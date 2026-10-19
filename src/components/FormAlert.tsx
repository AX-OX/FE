interface FormAlertProps {
  tone: 'error' | 'success' | 'info'
  children: React.ReactNode
}

const toneClass = {
  error: 'border-danger/30 bg-danger/5 text-danger',
  success: 'border-emerald-600/25 bg-emerald-50/80 text-emerald-800',
  info: 'border-white bg-glass text-muted',
}

export function FormAlert({ tone, children }: FormAlertProps) {
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-lg border px-3 py-2.5 text-[13px] ${toneClass[tone]}`}>
      {children}
    </div>
  )
}
