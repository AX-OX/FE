import type { ReactNode } from 'react'
import { WARNING_LABEL } from './labels'

type Tone = 'accent' | 'warn' | 'neutral'

const TONE: Record<Tone, string> = {
  accent: 'bg-accent/10 text-accent',
  warn: 'bg-amber-50 text-amber-800 border-amber-600/20',
  neutral: 'bg-ink/6 text-muted',
}

export function Badge({ tone = 'neutral', title, children }: { tone?: Tone; title?: string; children: ReactNode }) {
  return (
    <span title={title} className={`inline-flex shrink-0 items-center rounded-full border border-transparent px-2 py-0.5 text-[10px] font-semibold whitespace-nowrap ${TONE[tone]}`}>
      {children}
    </span>
  )
}

/** 라벨 옆 도움말 (마우스 오버 시 표시, 스크린 리더는 본문으로 읽음) */
export function HelpIcon({ text }: { text: string }) {
  return (
    <span title={text} className="inline-grid size-3.5 cursor-help place-items-center rounded-full border border-current text-[9px] leading-none font-semibold text-muted">
      ?<span className="sr-only">{text}</span>
    </span>
  )
}

/** dataConfidence가 ASSUMED인 결과 — 점수에 반영하지 않고 표시만 한다 */
export function AssumedDataBadge() {
  return <Badge title="실측값이 아닌 가정값으로 계산한 결과">가정 데이터 기반</Badge>
}

interface ItemBadgesProps {
  humanReviewRequired?: boolean
  /** 선행 과제명 */
  dependsOn?: string
  warnings?: string[]
  apiOk?: boolean
}

/** 과제·후보 행에 붙는 배지 (감점·제외가 아니라 주의 표시) */
export function ItemBadges({ humanReviewRequired, dependsOn, warnings = [], apiOk }: ItemBadgesProps) {
  const badges: ReactNode[] = []
  if (humanReviewRequired)
    badges.push(
      <Badge key="review" tone="accent" title="AI 결과를 사람이 최종 검토하는 단계가 포함됩니다">
        사람 검토 필요
      </Badge>,
    )
  if (dependsOn)
    badges.push(
      <Badge key="dep" title="이 과제와 함께 선정돼야 하는 선행 과제">
        선행: {dependsOn}
      </Badge>,
    )
  for (const w of warnings)
    badges.push(
      <Badge key={w} tone="warn">
        {WARNING_LABEL[w] ?? w}
      </Badge>,
    )
  if (apiOk === false)
    badges.push(
      <Badge key="api" tone="warn" title="연결된 시스템 중 API를 제공하는 시스템이 없습니다">
        API 연동 불가
      </Badge>,
    )

  if (!badges.length) return null
  return <span className="inline-flex flex-wrap gap-1">{badges}</span>
}
