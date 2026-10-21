import type { ReactNode } from 'react'
import { BackgroundBlobs } from '@/components/BackgroundBlobs'

interface AppCardProps {
  children: ReactNode
  /** true면 카드 높이를 고정해 내부 영역이 스크롤된다 (채팅 화면) */
  fixedHeight?: boolean
}

/** design-spec §3 — 1280×832 흰 카드(radius 32) + 배경 블러. 모바일에서는 전체 화면. */
export function AppCard({ children, fixedHeight = false }: AppCardProps) {
  const height = fixedHeight ? 'h-dvh sm:h-[min(832px,calc(100dvh-48px))]' : 'min-h-dvh sm:min-h-[min(832px,calc(100dvh-48px))]'

  return (
    <div className="flex min-h-full items-center justify-center sm:p-6">
      <div className={`relative flex w-full max-w-[1280px] flex-col items-center overflow-hidden bg-surface sm:rounded-[32px] ${height}`}>
        <BackgroundBlobs />
        <div className="relative z-10 flex min-h-0 w-full flex-1 flex-col items-center">{children}</div>
      </div>
    </div>
  )
}
