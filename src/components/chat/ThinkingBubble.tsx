import { Logo } from '@/components/Logo'

/** design-spec §4.5 — 응답 대기 버블 */
export function ThinkingBubble() {
  return (
    <div className="flex h-[50px] w-full items-center rounded-lg border border-white bg-linear-to-r from-white/25 to-white/40 p-2.5">
      <Logo className="h-[25.2px] w-6 animate-pulse text-white" />
      <span className="sr-only">답변을 준비하고 있습니다</span>
    </div>
  )
}
