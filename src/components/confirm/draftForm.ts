import type { ExtractedDepartment, ExtractedMetric, ExtractedProcess, ExtractedSystem, ExtractionPayload } from '@/types/extraction'

/** 지표 입력칸은 문자열로 들고 있다가 확정할 때 숫자로 바꾼다 (빈칸 = 지표 없음) */
export interface MetricFields {
  monthlyCount: string
  avgMinutes: string
  hourlyLaborCostKrw: string
}

/** 확정 화면에서 고치는 상태. 지표는 업무 key별로 둔다 */
export interface DraftForm {
  industry: string
  employeeCount: string
  departments: ExtractedDepartment[]
  processes: ExtractedProcess[]
  metrics: Record<string, MetricFields>
  systems: ExtractedSystem[]
}

const EMPTY_METRIC: MetricFields = { monthlyCount: '', avgMinutes: '', hourlyLaborCostKrw: '' }

export function toForm(payload: ExtractionPayload): DraftForm {
  const metrics: Record<string, MetricFields> = {}
  for (const p of payload.processes) metrics[p.key] = EMPTY_METRIC
  for (const m of payload.metrics) {
    metrics[m.processKey] = {
      monthlyCount: String(m.monthlyCount),
      avgMinutes: String(m.avgMinutes),
      hourlyLaborCostKrw: String(m.hourlyLaborCostKrw),
    }
  }
  return {
    industry: payload.company?.industry ?? '',
    employeeCount: payload.company?.employeeCount != null ? String(payload.company.employeeCount) : '',
    departments: payload.departments,
    processes: payload.processes,
    metrics,
    systems: payload.systems,
  }
}

/** 새로 추가하는 부서·업무·시스템의 key. draft의 key(d1, p1, s1)와 겹치지 않게 한다 */
export function newKey(prefix: string, existing: string[]): string {
  let i = existing.length + 1
  while (existing.includes(`${prefix}${i}`)) i++
  return `${prefix}${i}`
}

export function metricOf(form: DraftForm, processKey: string): MetricFields {
  return form.metrics[processKey] ?? EMPTY_METRIC
}

export type MetricState = 'empty' | 'partial' | 'complete'

export function metricState(m: MetricFields): MetricState {
  const filled = [m.monthlyCount, m.avgMinutes, m.hourlyLaborCostKrw].filter((v) => v.trim() !== '').length
  return filled === 0 ? 'empty' : filled === 3 ? 'complete' : 'partial'
}

const isInt = (v: string) => /^\d+$/.test(v.trim())

/** 서버 검증(Bean Validation·key 참조)과 같은 규칙을 먼저 확인한다. 문제마다 한 줄 */
export function validateForm(form: DraftForm): string[] {
  const errors: string[] = []
  if (form.industry.trim().length > 50) errors.push('업종은 50자 이하로 입력해 주세요.')
  if (form.employeeCount.trim() && (!isInt(form.employeeCount) || Number(form.employeeCount) < 1)) errors.push('직원 수는 1 이상의 정수로 입력해 주세요.')
  if (!form.departments.length) errors.push('부서가 하나 이상 있어야 해요.')
  for (const d of form.departments) {
    if (!d.name.trim()) errors.push('이름이 빈 부서가 있어요.')
    else if (d.name.trim().length > 50) errors.push(`부서 "${d.name}" 이름은 50자 이하로 입력해 주세요.`)
  }
  const departmentKeys = form.departments.map((d) => d.key)
  for (const p of form.processes) {
    const label = p.name.trim() || '이름 없는 업무'
    if (!p.name.trim()) errors.push('이름이 빈 업무가 있어요.')
    else if (p.name.trim().length > 100) errors.push(`업무 "${label}" 이름은 100자 이하로 입력해 주세요.`)
    if (!departmentKeys.includes(p.departmentKey)) errors.push(`업무 "${label}"의 부서를 골라 주세요.`)
    const m = metricOf(form, p.key)
    const state = metricState(m)
    if (state === 'partial') errors.push(`업무 "${label}": 월 건수, 건당 처리 시간, 시간당 인건비를 모두 입력하거나 모두 비워 주세요.`)
    if (state === 'complete') {
      const minutes = Number(m.avgMinutes)
      if (!isInt(m.monthlyCount)) errors.push(`업무 "${label}": 월 건수는 0 이상의 정수예요.`)
      if (!Number.isFinite(minutes) || minutes <= 0 || minutes >= 1_000_000) errors.push(`업무 "${label}": 건당 처리 시간(분)은 0보다 커야 해요.`)
      if (!isInt(m.hourlyLaborCostKrw) || Number(m.hourlyLaborCostKrw) < 1) errors.push(`업무 "${label}": 시간당 인건비는 1원 이상의 정수예요.`)
    }
  }
  for (const s of form.systems) {
    if (!s.name.trim()) errors.push('이름이 빈 시스템이 있어요.')
    else if (s.name.trim().length > 100) errors.push(`시스템 "${s.name}" 이름은 100자 이하로 입력해 주세요.`)
  }
  return errors
}

/**
 * 확정 요청 payload. 문서 값을 그대로 둔 지표는 원래 dataSource(EXTRACTED)를,
 * 고치거나 새로 입력한 지표는 USER_INPUT을 쓴다. 지표 칸이 비어 있는 업무는 지표 없이 보낸다.
 */
export function toPayload(form: DraftForm, original: ExtractionPayload): ExtractionPayload {
  const processKeys = new Set(form.processes.map((p) => p.key))
  const metrics: ExtractedMetric[] = []
  for (const p of form.processes) {
    const m = metricOf(form, p.key)
    if (metricState(m) !== 'complete') continue
    const values = {
      monthlyCount: Number(m.monthlyCount),
      avgMinutes: Math.round(Number(m.avgMinutes) * 100) / 100,
      hourlyLaborCostKrw: Number(m.hourlyLaborCostKrw),
    }
    const before = original.metrics.find((o) => o.processKey === p.key)
    const unchanged =
      !!before &&
      before.monthlyCount === values.monthlyCount &&
      before.avgMinutes === values.avgMinutes &&
      before.hourlyLaborCostKrw === values.hourlyLaborCostKrw
    metrics.push({
      processKey: p.key,
      ...values,
      errorRate: before?.errorRate ?? null,
      dataSource: unchanged ? before.dataSource : 'USER_INPUT',
      source: before?.source ?? null,
    })
  }
  const industry = form.industry.trim()
  const employeeCount = form.employeeCount.trim()
  return {
    company: { industry: industry || null, employeeCount: employeeCount ? Number(employeeCount) : null },
    departments: form.departments.map((d) => ({ ...d, name: d.name.trim() })),
    processes: form.processes.map((p) => ({ ...p, name: p.name.trim() })),
    metrics,
    // 지운 업무는 시스템 연결에서도 뺀다
    systems: form.systems.map((s) => ({ ...s, name: s.name.trim(), processKeys: s.processKeys.filter((k) => processKeys.has(k)) })),
  }
}

/** 문서 값과 다른 지표인지 (배지 표시용) */
export function metricEdited(form: DraftForm, original: ExtractionPayload, processKey: string): boolean | undefined {
  const m = metricOf(form, processKey)
  if (metricState(m) !== 'complete') return undefined
  const before = original.metrics.find((o) => o.processKey === processKey)
  if (!before) return true
  return !(
    Number(m.monthlyCount) === before.monthlyCount &&
    Number(m.avgMinutes) === before.avgMinutes &&
    Number(m.hourlyLaborCostKrw) === before.hourlyLaborCostKrw
  )
}
