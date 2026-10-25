import { useEffect } from 'react'
import { Link } from 'react-router'
import { ChatInput } from '@/components/chat/ChatInput'
import { DocumentPanel } from '@/components/chat/DocumentPanel'
import { DocumentTray } from '@/components/chat/DocumentTray'
import { MessageList } from '@/components/chat/MessageList'
import { Suggestions } from '@/components/chat/Suggestions'
import { Logo } from '@/components/Logo'
import { AppCard } from '@/layouts/AppCard'
import { useAuthStore } from '@/stores/authStore'
import { isBusy, useChatStore } from '@/stores/chatStore'
import { useDocumentStore } from '@/stores/documentStore'

export function MainPage() {
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const turns = useChatStore((s) => s.turns)
  const referenceTaskId = useChatStore((s) => s.referenceTaskId)
  const send = useChatStore((s) => s.send)
  const reset = useChatStore((s) => s.reset)
  const referenceTurn = turns.find((turn) => turn.taskId === referenceTaskId)
  const empty = turns.length === 0
  const loadDocuments = useDocumentStore((s) => s.load)
  const upload = useDocumentStore((s) => s.upload)
  const uploading = useDocumentStore((s) => s.uploading)

  // 회사 문서 목록 (색인 중이면 store가 끝날 때까지 다시 조회한다)
  useEffect(() => {
    void loadDocuments()
  }, [loadDocuments])

  // 대화·SSE 정리는 chatStore가, 로그인 화면 이동은 RequireAuth가 한다
  function handleLogout() {
    logout()
  }

  return (
    <AppCard fixedHeight>
      <header className="flex w-full shrink-0 items-center justify-between gap-3 px-5 pt-5 text-[13px] sm:px-8 sm:pt-6">
        {empty ? (
          <span />
        ) : (
          <div className="flex items-center gap-2">
            <Logo className="h-[22px] w-auto" />
            <span className="font-semibold">AXOX</span>
          </div>
        )}
        <div className="flex items-center gap-3 text-muted">
          {/* 진행 중이어도 새 대화를 열 수 있다. 서버 작업은 그대로 진행되고 작업 이력에서 다시 불러온다 */}
          {!empty && (
            <button type="button" onClick={reset} className="font-semibold text-ink hover:underline">
              새 대화
            </button>
          )}
          <Link to="/tasks" className="font-semibold text-ink hover:underline">
            작업 이력
          </Link>
          <span className="hidden sm:inline">{user?.name}님</span>
          <button type="button" onClick={handleLogout} className="font-semibold text-ink hover:underline">
            로그아웃
          </button>
        </div>
      </header>

      {empty ? (
        <>
          {/* design-spec §4.2 히어로 — 로고 ↔ 타이틀 48px */}
          <div className="mt-[clamp(32px,12vh,120px)] flex flex-col items-center gap-12 px-4 text-center">
            <Logo className="h-10 w-auto" />
            <h1 className="text-2xl">AX 전환, 무엇이든 물어보세요</h1>
          </div>
          <div className="mt-auto w-full max-w-[915px] px-4 pt-8">
            <Suggestions onPick={send} />
          </div>
        </>
      ) : (
        <MessageList />
      )}

      <div className={`w-full max-w-[915px] shrink-0 px-4 pb-5 sm:pb-[37px] ${empty ? 'pt-[38px]' : 'pt-3'}`}>
        <DocumentTray />
        {referenceTurn && (
          <p className="mb-2 truncate px-1 text-xs text-muted" title={referenceTurn.requestText}>
            이 분석을 참고해 답변해요: {referenceTurn.requestText}
          </p>
        )}
        <ChatInput onSend={send} disabled={turns.some(isBusy)} onAttach={(file) => void upload(file)} attaching={uploading} />
      </div>

      <DocumentPanel />
    </AppCard>
  )
}
