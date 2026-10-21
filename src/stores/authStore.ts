import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { AuthUser } from '@/api/auth'

/** 세션이 끝난 이유. user = 로그아웃 버튼, expired = API·SSE 401 */
export type SessionEndReason = 'user' | 'expired'

interface AuthState {
  accessToken: string | null
  user: AuthUser | null
  /** 저장하지 않는다. 로그인 화면 안내·복귀 경로를 정하는 데만 쓴다 */
  endedBy: SessionEndReason | null
  setSession: (accessToken: string, user: AuthUser) => void
  /**
   * 로그아웃 API는 없다 (JWT, 기준 문서 §8). 토큰·사용자를 지우고 저장소에서도 삭제한다.
   * 대화·SSE 정리는 chatStore가 이 변화를 구독해서 한다.
   */
  logout: (reason?: SessionEndReason) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      user: null,
      endedBy: null,
      setSession: (accessToken, user) => set({ accessToken, user, endedBy: null }),
      logout: (reason = 'user') => {
        if (!get().accessToken) return
        set({ accessToken: null, user: null, endedBy: reason })
        useAuthStore.persist.clearStorage()
      },
    }),
    {
      name: 'ax-auth',
      partialize: ({ accessToken, user }) => ({ accessToken, user }),
    },
  ),
)
