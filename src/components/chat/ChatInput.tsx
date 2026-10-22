import { useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react'
import { SendIcon } from './SendIcon'

interface ChatInputProps {
  onSend: (text: string) => void
  disabled?: boolean
  /** PDF 첨부. 분석 중에도 올릴 수 있다 */
  onAttach?: (file: File) => void
  attaching?: boolean
}

const MAX_HEIGHT = 160

/** design-spec §4.6 — Enter 전송, Shift+Enter 줄바꿈 */
export function ChatInput({ onSend, disabled = false, onAttach, attaching = false }: ChatInputProps) {
  const [value, setValue] = useState('')
  const ref = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const canSend = !disabled && value.trim().length > 0

  // 내용에 맞춰 높이 자동 조절
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, MAX_HEIGHT)}px`
  }, [value])

  function submit(e?: FormEvent) {
    e?.preventDefault()
    if (!canSend) return
    onSend(value)
    setValue('')
  }

  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    // 한글 조합 중 Enter는 무시 (마지막 글자가 두 번 전송되는 문제 방지)
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault()
      submit()
    }
  }

  return (
    <form
      onSubmit={submit}
      className="flex min-h-14 w-full items-end gap-2 rounded-lg border border-line bg-surface p-2.5 transition-colors focus-within:border-line-strong"
    >
      {onAttach && (
        <>
          <input
            ref={fileRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              // 같은 파일을 다시 고를 수 있게 비운다 (FAILED 후 재업로드)
              e.target.value = ''
              if (file) onAttach(file)
            }}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={attaching}
            aria-label={attaching ? 'PDF 올리는 중' : 'PDF 첨부'}
            title="회사 PDF 첨부 (20MB 이하)"
            className="grid size-9 shrink-0 place-items-center rounded-md text-muted transition-colors hover:bg-ink/5 hover:text-ink focus-visible:outline-2 focus-visible:outline-line-strong disabled:cursor-wait"
          >
            {attaching ? (
              <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
            ) : (
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M15.5 9.5l-5.8 5.8a3.5 3.5 0 01-5-5l6.3-6.3a2.3 2.3 0 013.3 3.3l-6.2 6.2a1.2 1.2 0 01-1.7-1.7l5.6-5.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </button>
        </>
      )}
      <label htmlFor="chat-input" className="sr-only">
        메시지 입력
      </label>
      <textarea
        id="chat-input"
        ref={ref}
        rows={1}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={disabled ? '분석이 끝나면 다음 요청을 보낼 수 있어요' : 'AX 전환에 대해 무엇이든 물어보세요'}
        className="max-h-40 min-w-0 flex-1 resize-none self-center bg-transparent py-1 pl-1 text-sm leading-normal outline-none placeholder:text-muted disabled:cursor-not-allowed"
      />
      <button
        type="submit"
        disabled={!canSend}
        aria-label="보내기"
        className="grid size-9 shrink-0 place-items-center rounded-md text-ink transition-colors hover:bg-ink/5 focus-visible:outline-2 focus-visible:outline-line-strong disabled:text-send disabled:hover:bg-transparent"
      >
        <SendIcon className="size-[30px]" />
      </button>
    </form>
  )
}
