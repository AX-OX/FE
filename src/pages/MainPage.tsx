import { Logo } from '@/components/Logo'
import { AppCard } from '@/layouts/AppCard'
import { useAuthStore } from '@/stores/authStore'

/** TODO: 메인(채팅) 화면 — 다음 작업에서 design-spec §3~4대로 구현 */
export function MainPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)

  return (
    <AppCard>
      <div className="flex w-full justify-end px-6 pt-6 text-[13px] text-muted">
        <span className="mr-3">{user?.name}님</span>
        <button type="button" onClick={logout} className="font-semibold text-ink hover:underline">
          로그아웃
        </button>
      </div>
      <div className="mt-[120px] flex flex-col items-center gap-12">
        <Logo className="h-[37.83px] w-9 text-ink" />
        <h1 className="text-2xl">Ask our AI anything</h1>
      </div>
    </AppCard>
  )
}
