import { useAuthStore } from '@/stores/authStore'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export const USE_MOCK = import.meta.env.VITE_USE_MOCK === 'true'

/** AX_NAVIGATOR_CONTEXT §7 공통 오류 응답 형식 */
export interface ApiErrorBody {
  code: string
  message: string
  hint?: Record<string, unknown>
}

export class ApiError extends Error {
  readonly status: number
  readonly code: string
  readonly hint?: Record<string, unknown>

  constructor(status: number, body: ApiErrorBody) {
    super(body.message)
    this.name = 'ApiError'
    this.status = status
    this.code = body.code
    this.hint = body.hint
  }
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  if (init.body && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' })
  }

  if (!res.ok) {
    const body = (await res.json().catch(() => null)) as ApiErrorBody | null
    // 토큰이 만료·무효 → 세션 종료 (RequireAuth가 로그인 화면으로 보낸다). 로그인 요청의 401은 토큰이 없어 해당 없음
    if (res.status === 401 && token) useAuthStore.getState().logout('expired')
    if (!body?.message && res.status === 403) throw new ApiError(403, { code: body?.code ?? 'FORBIDDEN', message: '작업을 요청한 본인만 볼 수 있어요.' })
    throw new ApiError(res.status, body ?? { code: 'HTTP_ERROR', message: `요청에 실패했습니다. (${res.status})` })
  }

  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
