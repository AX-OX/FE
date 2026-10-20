import { formatKrw, formatKrwShort, formatPct } from '@/lib/format'
import type { RoadmapItem } from '@/types/task'

interface RoadmapSummaryProps {
  items: RoadmapItem[]
  totalAllocatedKrw: number
  budgetKrw: number
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

/** 핵심 수치 + 예산 사용률 */
export function RoadmapSummary({ items, totalAllocatedKrw, budgetKrw }: RoadmapSummaryProps) {
  const saving = items.reduce((sum, i) => sum + i.expectedAnnualSavingKrw, 0)
  // 포트폴리오 ROI = (절감 합 − 비용 합) / 비용 합. 개별 ROI 평균이 아니라 합계로 본다
  const portfolioRoi = totalAllocatedKrw > 0 ? ((saving - totalAllocatedKrw) / totalAllocatedKrw) * 100 : 0
  const usage = budgetKrw > 0 ? Math.min(totalAllocatedKrw / budgetKrw, 1) : 0

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <Stat label="선정 과제" value={`${items.length}개`} />
        <Stat label="1년 차 투자" value={formatKrwShort(totalAllocatedKrw)} sub="구축비 + 12개월 운영비" />
        <Stat label="연간 절감 (기준)" value={formatKrwShort(saving)} />
        <Stat label="포트폴리오 ROI (기준)" value={formatPct(portfolioRoi)} sub="1년 차 기준" />
      </div>

      <div className="rounded-lg bg-white/70 p-3">
        <div className="flex items-baseline justify-between gap-2 text-[13px]">
          <span className="font-medium">예산 사용</span>
          <span className="text-muted">
            <span className="font-semibold text-ink">{formatKrw(totalAllocatedKrw)}</span> / {formatKrw(budgetKrw)} ({Math.round(usage * 100)}%)
          </span>
        </div>
        <div
          className="mt-2 h-2 overflow-hidden rounded-full bg-ink/8"
          role="meter"
          aria-label="예산 사용률"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(usage * 100)}
        >
          <div className="h-full rounded-full bg-accent" style={{ width: `${usage * 100}%` }} />
        </div>
      </div>
    </div>
  )
}
