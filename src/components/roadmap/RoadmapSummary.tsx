import { formatKrw, formatKrwShort, formatScore } from '@/lib/format'
import type { Portfolio } from '@/types/task'
import { AssumedDataBadge } from './Badges'
import { VIOLATION_LABEL } from './labels'

interface RoadmapSummaryProps {
  itemCount: number
  totalAllocatedKrw: number
  budgetKrw: number
  /** 승인 카드만 먼저 온 경우 아직 없을 수 있다 */
  portfolio?: Portfolio
  assumedData: boolean
}

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white/70 p-3">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className="mt-1 text-xl font-semibold tracking-tight">{value}</p>
      {sub && <p className="mt-0.5 text-[11px] text-muted">{sub}</p>}
    </div>
  )
}

/** 핵심 수치 + 예산 사용. 합계·잔액은 모두 서버 값 (프론트에서 계산하지 않는다) */
export function RoadmapSummary({ itemCount, totalAllocatedKrw, budgetKrw, portfolio, assumedData }: RoadmapSummaryProps) {
  // 막대 너비만 프론트에서 정한다
  const width = budgetKrw > 0 ? Math.min(totalAllocatedKrw / budgetKrw, 1) * 100 : 0
  const greedy = portfolio?.greedyTop3

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="선정 과제" value={`${itemCount}개`} />
        <Stat label="AX점수 합" value={portfolio ? formatScore(portfolio.totalAxScore) : '–'} sub="Impact × 0.6 + Feasibility × 0.4" />
        <Stat label="1년 차 투자" value={formatKrwShort(totalAllocatedKrw)} sub="구축비 + 12개월 운영비" />
        <Stat label="남은 예산" value={portfolio ? formatKrwShort(portfolio.remainingBudgetKrw) : '–'} />
      </div>

      <div className="rounded-lg bg-white/70 p-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2 text-[13px]">
          <span className="flex items-center gap-1.5 font-medium">
            예산 사용
            {assumedData && <AssumedDataBadge />}
          </span>
          <span className="text-muted">
            <span className="font-semibold text-ink">{formatKrw(totalAllocatedKrw)}</span> / {formatKrw(budgetKrw)}
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8"
          role="meter"
          aria-label="예산 사용"
          aria-valuemin={0}
          aria-valuemax={budgetKrw}
          aria-valuenow={totalAllocatedKrw}
          aria-valuetext={`${formatKrw(totalAllocatedKrw)} / ${formatKrw(budgetKrw)}`}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${width}%` }} />
        </div>
        {portfolio?.validCombinations != null && (
          <p className="mt-2 text-[11px] text-muted">
            예산·선행 과제 조건을 만족하는 조합 {portfolio.validCombinations.toLocaleString('ko-KR')}개 중 AX점수 합이 가장 높은 조합
          </p>
        )}
        {greedy && (greedy.violations?.length ?? 0) > 0 && (
          <p className="mt-0.5 text-[11px] text-muted">
            AX점수 상위 3개를 그대로 고르면(합 {formatScore(greedy.totalAxScore)}, {formatKrw(greedy.totalFirstYearTcoKrw)}) 조건을 만족하지 못해요:{' '}
            {greedy.violations.map((v) => VIOLATION_LABEL[v] ?? v).join(', ')}
          </p>
        )}
      </div>
    </div>
  )
}
