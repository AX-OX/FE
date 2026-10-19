const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const PASSWORD_MIN_LENGTH = 8

export function validateEmail(value: string): string | undefined {
  if (!value.trim()) return '이메일을 입력해 주세요.'
  if (!EMAIL_RE.test(value.trim())) return '이메일 형식이 올바르지 않습니다.'
}

export function validatePassword(value: string): string | undefined {
  if (!value) return '비밀번호를 입력해 주세요.'
  if (value.length < PASSWORD_MIN_LENGTH) return `비밀번호는 ${PASSWORD_MIN_LENGTH}자 이상이어야 합니다.`
  if (!/[A-Za-z]/.test(value) || !/\d/.test(value)) return '영문과 숫자를 모두 포함해 주세요.'
}

export function validateName(value: string): string | undefined {
  if (!value.trim()) return '이름을 입력해 주세요.'
  if (value.trim().length > 50) return '이름은 50자 이하로 입력해 주세요.'
}
