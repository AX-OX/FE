import { useId } from 'react'

interface LogoProps {
  className?: string
}

/** AXOX 로고 (Λ X / O X, 보라 그라데이션). 비율 972 × 880 */
export function Logo({ className }: LogoProps) {
  // 한 화면에 로고가 여러 개여도 그라데이션 id가 겹치지 않게
  const gradient = `axox-${useId()}`
  return (
    <svg className={className} width="972" height="880" viewBox="0 0 972 880" aria-hidden="true">
      <defs>
        <linearGradient id={gradient} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#6D3EF6" />
          <stop offset="1" stopColor="#9A78FB" />
        </linearGradient>
      </defs>
      <g fill={`url(#${gradient})`}>
        <path d="M3 417L222 4H328L532 417H395L271 159L137 417Z" />
        <path d="M466 4H615L705 122L795 4H950L785 214L948 417H788L705 312L620 417H553L522 350L625 219Z" />
        <path fillRule="evenodd" d="M250 417a241 230 0 1 0 0.01 0ZM250 527a122 120 0 1 0 0.01 0Z" />
        <path d="M452 437H610L698 549L791 437H956L790 644L968 867H797L698 742L597 867H432L612 649Z" />
      </g>
    </svg>
  )
}
