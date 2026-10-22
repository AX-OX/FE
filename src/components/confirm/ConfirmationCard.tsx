import { useEffect, useState, type ReactNode } from 'react'
import { ApiError } from '@/api/client'
import { getExtraction } from '@/api/extraction'
import { Button } from '@/components/Button'
import { Badge } from '@/components/roadmap/Badges'
import { SYSTEM_TYPE_LABEL, WORK_TYPE_LABEL } from '@/components/roadmap/labels'
import { useChatStore, type Turn } from '@/stores/chatStore'
import type { ExtractedProcess, ExtractedSystem, ExtractionDraft, SystemType, WorkType } from '@/types/extraction'
import { metricEdited, metricOf, metricState, newKey, toForm, toPayload, validateForm, type DraftForm, type MetricFields } from './draftForm'

const WORK_TYPES = Object.keys(WORK_TYPE_LABEL) as WorkType[]
const SYSTEM_TYPES = Object.keys(SYSTEM_TYPE_LABEL) as SystemType[]

const INPUT = 'h-8 min-w-0 rounded-md border border-line bg-surface px-2 text-[13px] outline-none focus:border-line-strong'
const ICON_BUTTON = 'grid size-7 shrink-0 place-items-center rounded-md text-muted hover:bg-ink/5 hover:text-danger disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-muted'

function Section({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="rounded-lg bg-white/70 p-3">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <h4 className="text-[13px] font-semibold">{title}</h4>
          {sub && <p className="text-[11px] text-muted">{sub}</p>}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

function AddButton({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="shrink-0 rounded-md px-2 py-1 text-[12px] font-semibold text-accent hover:bg-accent/10">
      + {children}
    </button>
  )
}

function RemoveButton({ label, onClick, disabled, title }: { label: string; onClick: () => void; disabled?: boolean; title?: string }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={title ?? label} className={ICON_BUTTON}>
      <svg viewBox="0 0 16 16" className="size-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" strokeLinecap="round" />
      </svg>
    </button>
  )
}

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; draft: ExtractionDraft; form: DraftForm }

/**
 * CONFIRMATION_REQUIRED → AI가 PDF에서 추출한 회사 데이터를 검토·수정해 확정한다.
 * 확정하면 서버가 부서·업무·지표·시스템을 저장하고 분석을 이어간다. 회사당 한 번이다.
 */
export function ConfirmationCard({ turn }: { turn: Turn }) {
  const confirmData = useChatStore((s) => s.confirmData)
  const openDocument = useChatStore((s) => s.openDocument)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  const [errors, setErrors] = useState<string[]>([])
  const [asking, setAsking] = useState(false)
  const taskId = turn.taskId

  useEffect(() => {
    if (!taskId) return
    let ignore = false
    getExtraction(taskId)
      .then((draft) => !ignore && setState({ status: 'ready', draft, form: toForm(draft.payload) }))
      .catch((err) => !ignore && setState({ status: 'error', message: err instanceof ApiError ? err.message : '추출 결과를 불러오지 못했습니다.' }))
    return () => {
      ignore = true
    }
  }, [taskId, turn.confirmation?.draftId])

  if (state.status === 'loading') return <div className="glass p-3 text-sm text-muted">PDF에서 찾은 회사 데이터를 불러오는 중…</div>
  if (state.status === 'error')
    return (
      <div role="alert" className="rounded-lg border border-danger/30 bg-white/80 p-3 text-sm text-danger">
        {state.message}
      </div>
    )

  const { draft, form } = state
  const setForm = (fn: (f: DraftForm) => DraftForm) => {
    setState((s) => (s.status === 'ready' ? { ...s, form: fn(s.form) } : s))
    setErrors([])
    setAsking(false)
  }
  const updateProcess = (key: string, patch: Partial<ExtractedProcess>) =>
    setForm((f) => ({ ...f, processes: f.processes.map((p) => (p.key === key ? { ...p, ...patch } : p)) }))
  const updateMetric = (key: string, patch: Partial<MetricFields>) =>
    setForm((f) => ({ ...f, metrics: { ...f.metrics, [key]: { ...metricOf(f, key), ...patch } } }))
  const updateSystem = (key: string, patch: Partial<ExtractedSystem>) =>
    setForm((f) => ({ ...f, systems: f.systems.map((s) => (s.key === key ? { ...s, ...patch } : s)) }))

  const usedDepartments = new Set(form.processes.map((p) => p.departmentKey))
  const noMetric = form.processes.filter((p) => metricState(metricOf(form, p.key)) === 'empty' || p.workType === 'OTHER')
  const confirmed = draft.status === 'CONFIRMED'

  function submit() {
    const problems = validateForm(form)
    setErrors(problems)
    if (problems.length) return setAsking(false)
    if (!asking) return setAsking(true)
    void confirmData(turn.id, toPayload(form, draft.payload))
  }

  return (
    <section className="glass space-y-3 p-3 sm:p-4" aria-labelledby={`confirm-${turn.id}`}>
      <header>
        <p className="text-[11px] font-medium text-muted">PDF {draft.documentIds.length}개에서 찾은 내용</p>
        <h3 id={`confirm-${turn.id}`} className="text-lg font-semibold">
          회사 데이터를 확인해 주세요
        </h3>
        <p className="mt-0.5 text-[13px] text-muted">틀린 부분을 고치고 확정하면 이 데이터로 분석을 이어가요. 확정은 회사당 한 번이에요.</p>
      </header>

      <Section title="회사" sub="문서에 없으면 비워 두세요">
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-[12px] text-muted">
            업종
            <input className={`${INPUT} mt-1 w-full`} value={form.industry} placeholder="예: B2B 정밀부품 제조" onChange={(e) => setForm((f) => ({ ...f, industry: e.target.value }))} />
          </label>
          <label className="text-[12px] text-muted">
            직원 수
            <input className={`${INPUT} mt-1 w-full`} inputMode="numeric" value={form.employeeCount} placeholder="예: 120" onChange={(e) => setForm((f) => ({ ...f, employeeCount: e.target.value }))} />
          </label>
        </div>
      </Section>

      <Section
        title="부서"
        action={<AddButton onClick={() => setForm((f) => ({ ...f, departments: [...f.departments, { key: newKey('d', f.departments.map((d) => d.key)), name: '' }] }))}>부서</AddButton>}
      >
        <ul className="flex flex-wrap gap-2">
          {form.departments.map((d) => (
            <li key={d.key} className="flex items-center gap-1">
              <input
                aria-label="부서 이름"
                className={`${INPUT} w-36`}
                value={d.name}
                placeholder="부서 이름"
                onChange={(e) => setForm((f) => ({ ...f, departments: f.departments.map((x) => (x.key === d.key ? { ...x, name: e.target.value } : x)) }))}
              />
              <RemoveButton
                label={`${d.name || '부서'} 삭제`}
                disabled={usedDepartments.has(d.key) || form.departments.length === 1}
                title={usedDepartments.has(d.key) ? '이 부서의 업무를 먼저 옮기거나 지워 주세요' : undefined}
                onClick={() => setForm((f) => ({ ...f, departments: f.departments.filter((x) => x.key !== d.key) }))}
              />
            </li>
          ))}
        </ul>
      </Section>

      <Section
        title="업무"
        sub="업무 유형으로 추천할 솔루션을 찾아요. 지표(월 건수, 건당 분, 시간당 인건비)가 없으면 그 업무는 추천에서 빠져요."
        action={
          <AddButton
            onClick={() =>
              setForm((f) => {
                const key = newKey('p', f.processes.map((p) => p.key))
                const process: ExtractedProcess = {
                  key,
                  departmentKey: f.departments[0]?.key ?? '',
                  name: '',
                  purpose: null,
                  steps: [],
                  standardizationLevel: null,
                  requiresApproval: false,
                  exceptionRules: null,
                  workType: 'OTHER',
                  source: null,
                }
                return { ...f, processes: [...f.processes, process] }
              })
            }
          >
            업무
          </AddButton>
        }
      >
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-[12px]">
            <thead className="text-left text-[11px] whitespace-nowrap text-muted">
              <tr>
                <th className="py-1.5 pr-2 font-medium">업무</th>
                <th className="py-1.5 pr-2 font-medium">부서</th>
                <th className="py-1.5 pr-2 font-medium">업무 유형</th>
                <th className="py-1.5 pr-2 text-center font-medium">승인 필요</th>
                <th className="py-1.5 pr-2 font-medium">월 건수</th>
                <th className="py-1.5 pr-2 font-medium">건당 분</th>
                <th className="py-1.5 pr-2 font-medium">시간당 인건비</th>
                <th className="py-1.5 pr-2 font-medium">지표</th>
                <th className="py-1.5 font-medium">
                  <span className="sr-only">삭제</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {form.processes.map((p) => {
                const m = metricOf(form, p.key)
                const state = metricState(m)
                const edited = metricEdited(form, draft.payload, p.key)
                return (
                  <tr key={p.key} className="border-t border-ink/6 align-top">
                    <td className="py-1.5 pr-2">
                      <input aria-label="업무 이름" className={`${INPUT} w-36`} value={p.name} placeholder="업무 이름" onChange={(e) => updateProcess(p.key, { name: e.target.value })} />
                      {p.source && (
                        <button type="button" onClick={() => openDocument(p.source!.documentId)} className="mt-0.5 block text-[11px] text-accent hover:underline">
                          출처{p.source.page ? ` p.${p.source.page}` : ''}
                        </button>
                      )}
                    </td>
                    <td className="py-1.5 pr-2">
                      <select aria-label="부서" className={`${INPUT} w-24`} value={p.departmentKey} onChange={(e) => updateProcess(p.key, { departmentKey: e.target.value })}>
                        {form.departments.map((d) => (
                          <option key={d.key} value={d.key}>
                            {d.name || '(이름 없음)'}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2">
                      <select aria-label="업무 유형" className={`${INPUT} w-40`} value={p.workType} onChange={(e) => updateProcess(p.key, { workType: e.target.value as WorkType })}>
                        {WORK_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {WORK_TYPE_LABEL[t]}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="py-1.5 pr-2 text-center">
                      <input
                        type="checkbox"
                        aria-label="사람 승인 필요"
                        className="mt-2 size-4 accent-accent"
                        checked={p.requiresApproval}
                        onChange={(e) => updateProcess(p.key, { requiresApproval: e.target.checked })}
                      />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input aria-label="월 처리 건수" inputMode="numeric" className={`${INPUT} w-16`} value={m.monthlyCount} placeholder="건수" onChange={(e) => updateMetric(p.key, { monthlyCount: e.target.value })} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input aria-label="건당 처리 시간(분)" inputMode="decimal" className={`${INPUT} w-14`} value={m.avgMinutes} placeholder="분" onChange={(e) => updateMetric(p.key, { avgMinutes: e.target.value })} />
                    </td>
                    <td className="py-1.5 pr-2">
                      <input aria-label="시간당 인건비(원)" inputMode="numeric" className={`${INPUT} w-20`} value={m.hourlyLaborCostKrw} placeholder="원" onChange={(e) => updateMetric(p.key, { hourlyLaborCostKrw: e.target.value })} />
                    </td>
                    <td className="py-1.5 pr-2 pt-2.5">
                      {state === 'empty' ? (
                        <Badge tone="warn" title="지표가 없으면 추천과 ROI 계산에서 빠져요">
                          지표 없음
                        </Badge>
                      ) : state === 'partial' ? (
                        <Badge tone="warn">입력 중</Badge>
                      ) : edited ? (
                        <Badge tone="accent">직접 입력</Badge>
                      ) : (
                        <Badge>문서 추출</Badge>
                      )}
                    </td>
                    <td className="py-1.5">
                      <RemoveButton
                        label={`${p.name || '업무'} 삭제`}
                        onClick={() => setForm((f) => ({ ...f, processes: f.processes.filter((x) => x.key !== p.key) }))}
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {form.processes.length === 0 && <p className="py-2 text-[13px] text-muted">찾은 업무가 없어요. 업무를 추가하면 추천을 받을 수 있어요.</p>}
        {noMetric.length > 0 && (
          <p className="mt-2 text-[12px] text-amber-800">
            추천에서 빠지는 업무 {noMetric.length}개: {noMetric.map((p) => p.name || '이름 없는 업무').join(', ')} (지표가 없거나 유형이 기타)
          </p>
        )}
      </Section>

      <Section
        title="IT 시스템"
        sub="API를 제공하는 시스템과 연결된 업무는 실행 가능성 점수가 높아져요."
        action={
          <AddButton
            onClick={() =>
              setForm((f) => ({
                ...f,
                systems: [
                  ...f.systems,
                  { key: newKey('s', f.systems.map((s) => s.key)), name: '', type: 'ETC', apiAvailable: false, dataAccessLevel: 'RESTRICTED', cloudBased: false, processKeys: [] },
                ],
              }))
            }
          >
            시스템
          </AddButton>
        }
      >
        {form.systems.length === 0 ? (
          <p className="text-[13px] text-muted">찾은 시스템이 없어요.</p>
        ) : (
          <ul className="space-y-2">
            {form.systems.map((s) => (
              <li key={s.key} className="flex flex-wrap items-center gap-2 border-t border-ink/6 pt-2 first:border-t-0 first:pt-0">
                <input aria-label="시스템 이름" className={`${INPUT} w-36`} value={s.name} placeholder="시스템 이름" onChange={(e) => updateSystem(s.key, { name: e.target.value })} />
                <select aria-label="시스템 유형" className={`${INPUT} w-28`} value={s.type} onChange={(e) => updateSystem(s.key, { type: e.target.value as SystemType })}>
                  {SYSTEM_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {SYSTEM_TYPE_LABEL[t]}
                    </option>
                  ))}
                </select>
                <label className="flex items-center gap-1 text-[12px]">
                  <input type="checkbox" className="size-4 accent-accent" checked={s.apiAvailable} onChange={(e) => updateSystem(s.key, { apiAvailable: e.target.checked })} />
                  API 제공
                </label>
                <span className="text-[11px] text-muted">쓰는 업무</span>
                {form.processes.map((p) => (
                  <label key={p.key} className="flex items-center gap-1 text-[12px]">
                    <input
                      type="checkbox"
                      className="size-3.5 accent-accent"
                      checked={s.processKeys.includes(p.key)}
                      onChange={(e) =>
                        updateSystem(s.key, { processKeys: e.target.checked ? [...s.processKeys, p.key] : s.processKeys.filter((k) => k !== p.key) })
                      }
                    />
                    {p.name || '이름 없는 업무'}
                  </label>
                ))}
                <span className="ml-auto">
                  <RemoveButton label={`${s.name || '시스템'} 삭제`} onClick={() => setForm((f) => ({ ...f, systems: f.systems.filter((x) => x.key !== s.key) }))} />
                </span>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {(errors.length > 0 || turn.confirmError) && (
        <div role="alert" className="rounded-lg border border-danger/30 bg-white/80 p-3 text-[13px] text-danger">
          {turn.confirmError && <p>{turn.confirmError}</p>}
          {errors.length > 0 && (
            <ul className="list-disc space-y-0.5 pl-4">
              {errors.map((e) => (
                <li key={e}>{e}</li>
              ))}
            </ul>
          )}
        </div>
      )}

      {confirmed ? (
        <p className="text-[13px] text-muted">이미 확정한 데이터예요.</p>
      ) : (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {asking && <p className="mr-auto text-[13px]">확정하면 회사 데이터가 저장되고 다시 바꿀 수 없어요. 이대로 확정할까요?</p>}
          {asking && (
            <button
              type="button"
              onClick={() => setAsking(false)}
              disabled={turn.confirmPending}
              className="h-10 rounded-lg border border-line bg-surface px-4 text-sm font-semibold hover:bg-ink/5 disabled:opacity-50"
            >
              취소
            </button>
          )}
          <div className="w-40">
            <Button type="button" size="sm" onClick={submit} loading={turn.confirmPending}>
              {asking ? '확정하기' : '이 데이터로 확정'}
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
