import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

/** 로그인해야 들어갈 수 있는 화면 */
export function RequireAuth() {
  const token = useAuthStore((s) => s.accessToken)
  const endedBy = useAuthStore((s) => s.endedBy)
  const location = useLocation()
  if (token) return <Outlet />
  // 직접 로그아웃했으면 그냥 로그인 화면으로. 만료·미로그인이면 로그인 후 돌아올 경로를 넘긴다
  if (endedBy === 'user') return <Navigate to="/login" replace />
  return <Navigate to="/login" replace state={{ from: location.pathname + location.search, expired: endedBy === 'expired' }} />
}

/** 로그인한 사용자는 들어갈 필요가 없는 화면 (로그인·회원가입) */
export function GuestOnly() {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  // 로그인 직후에도 이 가드가 먼저 반응하므로, 돌아갈 경로(from)가 있으면 그쪽으로 보낸다
  const from = (location.state as { from?: string } | null)?.from
  if (token) return <Navigate to={from ?? '/'} replace />
  return <Outlet />
}
