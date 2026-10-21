import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

/** 재연결 대기 시간(ms). 다 쓰면 포기한다 */
const RETRY_DELAYS = [1000, 2000, 4000, 8000, 8000]

/**
 * 이 시간 동안 아무것도(heartbeat 포함) 못 받으면 죽은 연결로 보고 다시 붙는다.
 * 프록시를 거치면 서버 쪽 끊김이 브라우저로 전달되지 않고 연결이 매달려 있는 경우가 있다.
 * → 서버는 15초마다 `: ping` 주석을 보내야 한다.
 */
const IDLE_TIMEOUT_MS = 45_000

export interface SseHandlers {
  /** `data:` 한 건 (여러 줄이면 \n으로 이어 붙인 값) */
  onMessage: (data: string) => void
  /**
   * 연결될 때마다(첫 연결 포함). 이벤트 재생이 없으므로 호출 측이 상태 조회로 놓친 부분을 메운다.
   */
  onConnect: (reconnected: boolean) => void
  /**
   * 서버가 스트림을 정상 종료했을 때. true를 돌려주면(아직 진행 중) 잠시 뒤 다시 연결한다.
   */
  onClose: () => Promise<boolean>
  /** 재시도를 다 쓰거나 인증·권한 오류로 더 시도하지 않을 때 */
  onError: (status?: number) => void
}

/** 다시 시도해 봐야 소용없는 응답 */
const FATAL_STATUS = new Set([400, 401, 403, 404])

/**
 * fetch로 SSE를 읽는다. EventSource와 달리 `Authorization` 헤더를 보낼 수 있어서
 * 토큰이 URL(접속 로그·브라우저 기록)에 남지 않는다. 반환값을 호출하면 연결을 끊는다.
 */
export function openSse(path: string, handlers: SseHandlers): () => void {
  const controller = new AbortController()
  let connection: AbortController | undefined
  let lastEventId: string | undefined
  let attempt = 0
  let connectedOnce = false

  async function connect() {
    const token = useAuthStore.getState().accessToken
    const headers: Record<string, string> = { Accept: 'text/event-stream' }
    if (token) headers.Authorization = `Bearer ${token}`
    if (lastEventId) headers['Last-Event-ID'] = lastEventId

    // 연결 1개마다 따로 끊을 수 있게 (idle 감지용). 전체 구독이 끊기면 같이 끊긴다
    const conn = new AbortController()
    connection = conn
    let idleTimer: number | undefined
    const bumpIdle = () => {
      window.clearTimeout(idleTimer)
      idleTimer = window.setTimeout(() => conn.abort(), IDLE_TIMEOUT_MS)
    }

    let res: Response
    try {
      bumpIdle()
      res = await fetch(`${BASE_URL}${path}`, { headers, signal: conn.signal, cache: 'no-store' })
    } catch {
      window.clearTimeout(idleTimer)
      return retry()
    }

    if (!res.ok || !res.body) {
      window.clearTimeout(idleTimer)
      if (res.status === 401) useAuthStore.getState().logout('expired')
      if (FATAL_STATUS.has(res.status)) return handlers.onError(res.status)
      return retry()
    }

    handlers.onConnect(connectedOnce)
    connectedOnce = true
    attempt = 0

    let closedByServer = false
    try {
      await readEvents(res.body, bumpIdle)
      closedByServer = true
    } catch {
      // 읽는 도중 끊김·idle 초과 → 아래에서 재연결
    } finally {
      window.clearTimeout(idleTimer)
    }
    if (controller.signal.aborted) return
    // 정상 종료(DONE·FAILED·REJECTED 후 서버가 닫음)면 상태를 확인하고 진행 중일 때만 다시 붙는다
    if (closedByServer && !(await handlers.onClose())) return
    retry()
  }

  async function readEvents(body: ReadableStream<Uint8Array>, onBytes: () => void) {
    const reader = body.getReader()
    const decoder = new TextDecoder()
    let buffer = ''
    for (;;) {
      const { value, done } = await reader.read()
      if (done) return
      onBytes()
      buffer += decoder.decode(value, { stream: true })
      // 이벤트는 빈 줄로 구분된다 (\n\n, \r\n\r\n 모두 허용)
      const blocks = buffer.split(/\r?\n\r?\n/)
      buffer = blocks.pop() ?? ''
      for (const block of blocks) dispatch(block)
    }
  }

  function dispatch(block: string) {
    const data: string[] = []
    for (const line of block.split(/\r?\n/)) {
      if (!line || line.startsWith(':')) continue // 주석·heartbeat
      const sep = line.indexOf(':')
      const field = sep === -1 ? line : line.slice(0, sep)
      const value = sep === -1 ? '' : line.slice(sep + 1).replace(/^ /, '')
      if (field === 'data') data.push(value)
      else if (field === 'id') lastEventId = value
    }
    if (data.length && !controller.signal.aborted) handlers.onMessage(data.join('\n'))
  }

  function retry() {
    if (controller.signal.aborted) return
    const delay = RETRY_DELAYS[attempt++]
    if (delay === undefined) return handlers.onError()
    setTimeout(() => {
      if (!controller.signal.aborted) void connect()
    }, delay)
  }

  controller.signal.addEventListener('abort', () => connection?.abort())
  void connect()
  return () => controller.abort()
}
