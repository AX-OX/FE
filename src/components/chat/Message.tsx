import type { ReactNode } from 'react'

/** design-spec §4.4 — 발신자 라벨(11px uppercase) + 말풍선. 디자인대로 사용자=왼쪽, AI=오른쪽 */
function SenderLabel({ children }: { children: ReactNode }) {
  return <p className="h-4 text-[11px] font-medium text-label uppercase">{children}</p>
}

export function UserMessage({ text }: { text: string }) {
  return (
    <div className="flex max-w-[85%] flex-col items-start self-start pl-2.5 sm:max-w-[65%]">
      <SenderLabel>Me</SenderLabel>
      <div className="glass p-2.5 text-sm whitespace-pre-wrap">{text}</div>
    </div>
  )
}

interface AiMessageProps {
  children: ReactNode
  /** wide: 콘텐츠 열 전체 폭 (로드맵 리포트) */
  wide?: boolean
  label?: boolean
}

export function AiMessage({ children, wide = false, label = true }: AiMessageProps) {
  return (
    <div className={`flex w-full flex-col items-stretch self-end ${wide ? '' : 'sm:w-[572px]'}`}>
      {label && <SenderLabel>AX Navigator</SenderLabel>}
      {children}
    </div>
  )
}
