import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate } from 'react-router'
import { login } from '@/api/auth'
import { ApiError, USE_MOCK } from '@/api/client'
import { Button } from '@/components/Button'
import { FormAlert } from '@/components/FormAlert'
import { TextField } from '@/components/TextField'
import { AuthLayout } from '@/layouts/AuthLayout'
import { validateEmail } from '@/lib/validation'
import { useAuthStore } from '@/stores/authStore'

interface LoginLocationState {
  from?: string
  signupEmail?: string
}

export function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = (location.state ?? {}) as LoginLocationState
  const setSession = useAuthStore((s) => s.setSession)

  const [email, setEmail] = useState(state.signupEmail ?? '')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = {
      email: validateEmail(email),
      password: password ? undefined : '비밀번호를 입력해 주세요.',
    }
    setErrors(next)
    setFormError(undefined)
    if (next.email || next.password) return

    setSubmitting(true)
    try {
      const { accessToken, user } = await login({ email: email.trim(), password })
      setSession(accessToken, user)
      navigate(state.from ?? '/', { replace: true })
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : '로그인 중 문제가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="AX Navigator AI" subtitle="업무 데이터로 AI 전환 과제를 찾고, ROI로 로드맵을 만드세요">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {state.signupEmail && !formError && <FormAlert tone="success">회원가입이 완료되었습니다. 로그인해 주세요.</FormAlert>}
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <TextField
          label="이메일"
          type="email"
          autoComplete="email"
          placeholder="name@company.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          autoFocus={!state.signupEmail}
        />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="current-password"
          placeholder="비밀번호"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          autoFocus={!!state.signupEmail}
        />

        <Button type="submit" loading={submitting} className="mt-1">
          로그인
        </Button>

        <p className="text-center text-[13px] text-muted">
          계정이 없으신가요?{' '}
          <Link to="/signup" className="font-semibold text-ink underline-offset-4 hover:underline">
            회원가입
          </Link>
        </p>

        {USE_MOCK && (
          <FormAlert tone="info">
            <span className="font-semibold">Mock 모드</span> · 시연 계정 demo@ax-navigator.com / demo1234!
          </FormAlert>
        )}
      </form>
    </AuthLayout>
  )
}
