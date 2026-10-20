import type { ExcludedProcess } from '@/types/task'

/** portfolio.excluded — 사람에 대한 최종 판단을 AI가 하게 되는 업무 등은 후보에서 뺀다 */
export function ExcludedList({ excluded }: { excluded: ExcludedProcess[] }) {
  if (!excluded.length) return null

  return (
    <section className="rounded-lg bg-white/70 p-3.5" aria-labelledby="excluded-title">
      <h4 id="excluded-title" className="text-[13px] font-medium">
        분석에서 제외한 업무 ({excluded.length}건)
      </h4>
      <ul className="mt-2 space-y-1.5 text-[12px]">
        {excluded.map((e) => (
          <li key={e.processId} className="flex flex-wrap items-baseline gap-x-2">
            <span className="font-medium">{e.processName ?? `업무 ${e.processId}`}</span>
            <span className="text-muted">사유: {e.reason}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
