import type { ReactNode } from 'react'
import { BackgroundBlobs } from '@/components/BackgroundBlobs'

/** design-spec §3 — 1280×832 흰 카드(radius 32) + 배경 블러. 모바일에서는 전체 화면. */
export function AppCard({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full items-center justify-center sm:p-6">
      <div className="relative flex min-h-dvh w-full max-w-[1280px] flex-col items-center overflow-hidden bg-surface sm:min-h-[min(832px,calc(100dvh-48px))] sm:rounded-[32px]">
        <BackgroundBlobs />
        <div className="relative z-10 flex w-full flex-1 flex-col items-center">{children}</div>
      </div>
    </div>
  )
}
