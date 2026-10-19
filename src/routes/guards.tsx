import { Navigate, Outlet, useLocation } from 'react-router'
import { useAuthStore } from '@/stores/authStore'

/** 로그인해야 들어갈 수 있는 화면 */
export function RequireAuth() {
  const token = useAuthStore((s) => s.accessToken)
  const location = useLocation()
  if (!token) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  return <Outlet />
}

/** 로그인한 사용자는 들어갈 필요가 없는 화면 (로그인·회원가입) */
export function GuestOnly() {
  const token = useAuthStore((s) => s.accessToken)
  if (token) return <Navigate to="/" replace />
  return <Outlet />
}
