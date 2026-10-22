import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router'
import { signup } from '@/api/auth'
import { ApiError, fieldErrors } from '@/api/client'
import { Button } from '@/components/Button'
import { FormAlert } from '@/components/FormAlert'
import { TextField } from '@/components/TextField'
import { AuthLayout } from '@/layouts/AuthLayout'
import { PASSWORD_MIN_LENGTH, validateEmail, validateName, validatePassword } from '@/lib/validation'

type Field = 'name' | 'email' | 'password' | 'passwordConfirm'
type Values = Record<Field, string>

function validate(values: Values): Partial<Record<Field, string>> {
  return {
    name: validateName(values.name),
    email: validateEmail(values.email),
    password: validatePassword(values.password),
    passwordConfirm: !values.passwordConfirm
      ? '비밀번호를 한 번 더 입력해 주세요.'
      : values.passwordConfirm !== values.password
        ? '비밀번호가 일치하지 않습니다.'
        : undefined,
  }
}

export function SignupPage() {
  const navigate = useNavigate()
  const [values, setValues] = useState<Values>({ name: '', email: '', password: '', passwordConfirm: '' })
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({})
  const [formError, setFormError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)

  const bind = (field: Field) => ({
    value: values[field],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      setValues((v) => ({ ...v, [field]: e.target.value }))
      // 이미 에러가 표시된 필드는 입력하면서 바로 다시 검사
      if (errors[field]) setErrors((prev) => ({ ...prev, [field]: validate({ ...values, [field]: e.target.value })[field] }))
    },
    error: errors[field],
  })

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const next = validate(values)
    setErrors(next)
    setFormError(undefined)
    if (Object.values(next).some(Boolean)) return

    setSubmitting(true)
    try {
      const email = values.email.trim()
      await signup({ name: values.name.trim(), email, password: values.password })
      navigate('/login', { replace: true, state: { signupEmail: email } })
    } catch (err) {
      const fields = fieldErrors(err)
      if (err instanceof ApiError && err.code === 'DUPLICATE_EMAIL') {
        setErrors((prev) => ({ ...prev, email: err.message }))
      } else if (Object.keys(fields).length > 0) {
        // 서버 검증(400 VALIDATION_ERROR) 결과를 해당 입력란에 표시
        setErrors((prev) => ({ ...prev, ...fields }))
        setFormError(err instanceof ApiError ? err.message : undefined)
      } else {
        setFormError(err instanceof ApiError ? err.message : '회원가입 중 문제가 발생했습니다.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <AuthLayout title="계정 만들기" subtitle="AXOX를 시작하려면 정보를 입력해 주세요">
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {formError && <FormAlert tone="error">{formError}</FormAlert>}

        <TextField label="회사명" autoComplete="organization" placeholder="가온테크" hint="분석 대상 회사 이름으로 가입해요" autoFocus {...bind('name')} />
        <TextField label="이메일" type="email" autoComplete="email" placeholder="name@company.com" {...bind('email')} />
        <TextField
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder={`${PASSWORD_MIN_LENGTH}자 이상`}
          hint={`영문과 숫자를 포함해 ${PASSWORD_MIN_LENGTH}자 이상`}
          {...bind('password')}
        />
        <TextField
          label="비밀번호 확인"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호 다시 입력"
          {...bind('passwordConfirm')}
        />

        <Button type="submit" loading={submitting} className="mt-1">
          회원가입
        </Button>

        <p className="text-center text-[13px] text-muted">
          이미 계정이 있으신가요?{' '}
          <Link to="/login" className="font-semibold text-ink underline-offset-4 hover:underline">
            로그인
          </Link>
        </p>
      </form>
    </AuthLayout>
  )
}
