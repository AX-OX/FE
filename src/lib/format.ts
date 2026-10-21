/** 107_600_000 → "1억 760만 원" */
export function formatKrw(value: number): string {
  const sign = value < 0 ? '-' : ''
  const abs = Math.abs(value)
  const eok = Math.floor(abs / 100_000_000)
  const man = Math.round((abs % 100_000_000) / 10_000)
  if (!eok && !man) return `${sign}${abs.toLocaleString('ko-KR')}원`
  const parts = [eok && `${eok}억`, man && `${man.toLocaleString('ko-KR')}만`].filter(Boolean)
  return `${sign}${parts.join(' ')} 원`
}

/** 107_600_000 → "1.08억", 33_400_000 → "3,340만" */
export function formatKrwShort(value: number): string {
  const abs = Math.abs(value)
  const sign = value < 0 ? '-' : ''
  if (abs >= 100_000_000) return `${sign}${(abs / 100_000_000).toFixed(2).replace(/\.?0+$/, '')}억`
  return `${sign}${Math.round(abs / 10_000).toLocaleString('ko-KR')}만`
}

export function formatPct(value: number, digits = 0): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(digits)}%`
}

/** AX점수·Impact·Feasibility (0~100) → 소수 첫째 자리 */
export function formatScore(value: number): string {
  return value.toFixed(1)
}

/**
 * 서버 날짜 문자열 → "2026. 10. 20. 오후 3:48"
 * 작업 이력의 createdAt·completedAt은 오프셋 없는 로컬 시각(마이크로초 포함)이라 그대로 로컬 시각으로 읽는다.
 * 임의로 Z(UTC)를 붙이지 않는다. 오프셋이 있으면(SSE ts 등) 그 시각대로 해석한다.
 */
export function formatDateTime(value: string): string {
  const local = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?(?:\.\d+)?$/.exec(value)
  const date = local
    ? new Date(+local[1], +local[2] - 1, +local[3], +local[4], +local[5], +(local[6] ?? 0))
    : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })
}

export function formatMonths(value: number | null): string {
  return value === null ? '회수 어려움' : `${value.toFixed(1)}개월`
}
