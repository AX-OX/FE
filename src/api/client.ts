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

/** 서버가 오류 본문을 주지 않았을 때(프록시 오류·HTML 등) 보여 줄 문구 */
function fallbackError(status: number): ApiErrorBody {
  if (status === 403) return { code: 'FORBIDDEN', message: '접근 권한이 없습니다.' }
  if (status === 404) return { code: 'NOT_FOUND', message: '요청한 정보를 찾을 수 없습니다.' }
  if (status >= 500) return { code: 'INTERNAL_ERROR', message: '서버에 문제가 발생했습니다. 잠시 후 다시 시도해 주세요.' }
  return { code: 'HTTP_ERROR', message: `요청에 실패했습니다. (${status})` }
}

/** 본문을 문자열로 읽고 비어 있으면 undefined (승인 API는 본문 없는 202) */
async function readJson(res: Response): Promise<unknown> {
  const text = await res.text().catch(() => '')
  if (!text) return undefined
  try {
    return JSON.parse(text)
  } catch {
    return undefined
  }
}

/** 400 VALIDATION_ERROR의 `hint.fields` → { 필드명: 메시지 } */
export function fieldErrors(err: unknown): Record<string, string> {
  if (!(err instanceof ApiError)) return {}
  const fields = err.hint?.fields
  return fields && typeof fields === 'object' ? (fields as Record<string, string>) : {}
}

export async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = useAuthStore.getState().accessToken
  const headers = new Headers(init.headers)
  // FormData(파일 업로드)는 브라우저가 boundary를 붙인 multipart Content-Type을 정한다
  if (init.body && !(init.body instanceof FormData) && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  let res: Response
  try {
    res = await fetch(`${BASE_URL}${path}`, { ...init, headers })
  } catch {
    throw new ApiError(0, { code: 'NETWORK_ERROR', message: '서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.' })
  }

  const body = await readJson(res)
  if (!res.ok) {
    // 토큰이 만료·무효 → 세션 종료 (RequireAuth가 로그인 화면으로 보낸다). 로그인 요청의 401은 토큰이 없어 해당 없음
    if (res.status === 401 && token) useAuthStore.getState().logout('expired')
    const error = body as Partial<ApiErrorBody> | undefined
    throw new ApiError(res.status, error?.message ? { code: error.code ?? 'HTTP_ERROR', message: error.message, hint: error.hint } : fallbackError(res.status))
  }
  return body as T
}
