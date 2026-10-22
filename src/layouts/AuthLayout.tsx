import type { ReactNode } from 'react'
import { Logo } from '@/components/Logo'
import { AppCard } from './AppCard'

interface AuthLayoutProps {
  title: string
  subtitle: string
  children: ReactNode
}

export function AuthLayout({ title, subtitle, children }: AuthLayoutProps) {
  return (
    <AppCard>
      <main className="flex w-full flex-1 flex-col items-center justify-center px-4 py-12">
        <header className="mb-10 flex flex-col items-center gap-8 text-center sm:mb-12 sm:gap-12">
          <Logo className="h-10 w-auto" />
          <div className="space-y-2">
            <h1 className="text-2xl font-normal">{title}</h1>
            <p className="text-sm text-muted">{subtitle}</p>
          </div>
        </header>
        <section className="w-full max-w-[420px] rounded-2xl border border-white bg-glass p-6 backdrop-blur-md sm:p-8">
          {children}
        </section>
      </main>
    </AppCard>
  )
}
