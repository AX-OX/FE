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

export function formatMonths(value: number | null): string {
  return value === null ? '회수 불가' : `${value.toFixed(1)}개월`
}
