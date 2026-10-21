import { useId, useState, type InputHTMLAttributes } from 'react'

interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  hint?: string
}

export function TextField({ label, error, hint, type = 'text', className, ...inputProps }: TextFieldProps) {
  const id = useId()
  const [revealed, setRevealed] = useState(false)
  const isPassword = type === 'password'
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block px-0.5 text-[13px] font-semibold text-muted">
        {label}
      </label>
      <div
        className={`flex h-12 items-center rounded-lg border bg-surface px-3 transition-colors focus-within:border-line-strong ${
          error ? 'border-danger focus-within:border-danger' : 'border-line'
        }`}
      >
        <input
          id={id}
          type={isPassword && revealed ? 'text' : type}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="h-full min-w-0 flex-1 bg-transparent text-sm text-ink outline-none placeholder:text-muted/70"
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setRevealed((v) => !v)}
            className="-mr-1 shrink-0 rounded px-1.5 py-1 text-xs font-medium text-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-line-strong"
            aria-label={revealed ? '비밀번호 숨기기' : '비밀번호 보기'}
          >
            {revealed ? '숨기기' : '보기'}
          </button>
        )}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 px-0.5 text-xs text-danger">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-1.5 px-0.5 text-xs text-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
