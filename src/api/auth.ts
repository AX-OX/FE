import { ApiError, request, USE_MOCK } from './client'

/** AX_NAVIGATOR_CONTEXT §8 `POST /api/auth/login` 응답 */
export interface AuthUser {
  userId: number
  name: string
  companyId: number
}

export interface LoginResponse {
  accessToken: string
  user: AuthUser
}

export interface LoginRequest {
  email: string
  password: string
}

/**
 * §8 `POST /api/auth/signup` `{ email, password, name }` → 201 `{ userId }`
 * 이메일 중복 409 DUPLICATE_EMAIL, 입력값 오류 400 VALIDATION_ERROR.
 * 서버가 name을 회사명으로 하는 기업을 새로 만들어 연결한다.
 */
export interface SignupRequest {
  email: string
  password: string
  name: string
}

export interface SignupResponse {
  userId: number
}

export function login(body: LoginRequest): Promise<LoginResponse> {
  if (USE_MOCK) return mockLogin(body)
  return request<LoginResponse>('/api/auth/login', { method: 'POST', body: JSON.stringify(body) })
}

export function signup(body: SignupRequest): Promise<SignupResponse> {
  if (USE_MOCK) return mockSignup(body)
  return request<SignupResponse>('/api/auth/signup', { method: 'POST', body: JSON.stringify(body) })
}

// ---------------------------------------------------------------------------
// mock (VITE_USE_MOCK=true). 가입한 계정은 이 브라우저 localStorage에만 남는다.
// ---------------------------------------------------------------------------

interface MockUser extends SignupRequest {
  userId: number
  companyId: number
}

const MOCK_USERS_KEY = 'ax-mock-users'
const DEMO_USER: MockUser = {
  userId: 1,
  companyId: 1,
  email: 'demo@ax-navigator.com',
  password: 'demo1234!',
  name: '김데모',
}

function readMockUsers(): MockUser[] {
  try {
    const saved = JSON.parse(localStorage.getItem(MOCK_USERS_KEY) ?? '[]') as MockUser[]
    return [DEMO_USER, ...saved]
  } catch {
    return [DEMO_USER]
  }
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function mockLogin({ email, password }: LoginRequest): Promise<LoginResponse> {
  await delay(600)
  const user = readMockUsers().find((u) => u.email === email.trim().toLowerCase())
  if (!user || user.password !== password) {
    throw new ApiError(401, { code: 'UNAUTHORIZED', message: '이메일 또는 비밀번호가 올바르지 않습니다.' })
  }
  return {
    accessToken: `mock.${btoa(String(user.userId))}.${Date.now()}`,
    user: { userId: user.userId, name: user.name, companyId: user.companyId },
  }
}

async function mockSignup(body: SignupRequest): Promise<SignupResponse> {
  await delay(600)
  const users = readMockUsers()
  const email = body.email.trim().toLowerCase()
  if (users.some((u) => u.email === email)) {
    throw new ApiError(409, { code: 'DUPLICATE_EMAIL', message: '이미 가입된 이메일입니다.' })
  }
  const user: MockUser = { ...body, email, userId: Math.max(...users.map((u) => u.userId)) + 1, companyId: 1 }
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify([...users.slice(1), user]))
  return { userId: user.userId }
}
