import type { RoadmapItem } from '@/types/task'
import { PHASE_LABEL } from './labels'

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1)

/** 12개월 간트 차트 — start_month, duration_months */
export function RoadmapTimeline({ items }: { items: RoadmapItem[] }) {
  const sorted = [...items].sort((a, b) => a.priorityOrder - b.priorityOrder)

  return (
    <figure className="rounded-lg bg-white/70 p-3">
      <figcaption className="mb-3 text-[13px] font-medium">추진 일정 (12개월)</figcaption>

      <div className="grid grid-cols-[minmax(0,1fr)] gap-y-2.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-x-3">
        <div className="hidden sm:block" />
        <div className="grid grid-cols-12 text-center text-[10px] text-muted" aria-hidden="true">
          {MONTHS.map((m) => (
            <span key={m}>{m}월</span>
          ))}
        </div>

        {sorted.map((item) => {
          const end = Math.min(item.startMonth + item.durationMonths - 1, 12)
          return (
            <div key={`${item.processId}-${item.solutionId}`} className="contents">
              <div className="flex min-w-0 items-center gap-1.5 text-[13px]">
                <span className="shrink-0 rounded bg-ink/6 px-1.5 py-0.5 text-[10px] font-semibold text-muted">{PHASE_LABEL[item.phase]}</span>
                <span className="truncate">{item.itemName}</span>
              </div>
              <div className="relative grid h-7 grid-cols-12">
                {MONTHS.map((m) => (
                  <span key={m} className="border-l border-ink/6 first:border-l-0" aria-hidden="true" />
                ))}
                <div
                  className="absolute inset-y-1 flex items-center rounded bg-accent px-2 text-[11px] font-medium whitespace-nowrap text-white"
                  style={{ left: `calc(${((item.startMonth - 1) / 12) * 100}% + 1px)`, width: `calc(${(item.durationMonths / 12) * 100}% - 2px)` }}
                  title={`${item.itemName}: ${item.startMonth}월 ~ ${end}월 (${item.durationMonths}개월)`}
                >
                  <span className="truncate">
                    {item.startMonth}–{end}월
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </figure>
  )
}
