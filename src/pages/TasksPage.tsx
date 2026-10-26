import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { deleteTask, listMyTasks } from '@/api/tasks'
import { Logo } from '@/components/Logo'
import { formatDateTime } from '@/lib/format'
import { AppCard } from '@/layouts/AppCard'
import { useChatStore } from '@/stores/chatStore'
import type { TaskStatus, TaskSummary } from '@/types/task'

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  QUEUED: { label: '대기', cls: 'bg-ink/6 text-muted' },
  RUNNING: { label: '분석 중', cls: 'bg-accent/10 text-accent' },
  WAITING_CONFIRMATION: { label: '확정 대기', cls: 'bg-amber-50 text-amber-800 border-amber-600/20' },
  WAITING_APPROVAL: { label: '승인 대기', cls: 'bg-amber-50 text-amber-800 border-amber-600/20' },
  DONE: { label: '완료', cls: 'bg-emerald-50 text-emerald-800 border-emerald-600/20' },
  FAILED: { label: '실패', cls: 'bg-danger/10 text-danger' },
  REJECTED: { label: '거절됨', cls: 'bg-ink/6 text-muted' },
}

/** 진행 중인 작업은 Agent가 계속 결과를 쓰므로 서버가 삭제를 막는다 (409) */
const DELETABLE: TaskStatus[] = ['DONE', 'FAILED', 'REJECTED']

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; tasks: TaskSummary[] }

/** `GET /api/ai/tasks?mine=true` — 내 작업 이력. 누르면 메인 대화로 불러온다 */
export function TasksPage() {
  const navigate = useNavigate()
  const restore = useChatStore((s) => s.restore)
  const forget = useChatStore((s) => s.forget)
  const [state, setState] = useState<LoadState>({ status: 'loading' })
  /** 삭제 확인 중인 작업 */
  const [confirming, setConfirming] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [deleteError, setDeleteError] = useState<{ taskId: string; message: string } | null>(null)

  useEffect(() => {
    let ignore = false
    listMyTasks()
      .then((tasks) => !ignore && setState({ status: 'ready', tasks }))
      .catch((err) => !ignore && setState({ status: 'error', message: err instanceof ApiError ? err.message : '작업 이력을 불러오지 못했습니다.' }))
    return () => {
      ignore = true
    }
  }, [])

  function open(task: TaskSummary) {
    void restore(task)
    navigate('/')
  }

  async function remove(taskId: string) {
    setDeleting(taskId)
    setDeleteError(null)
    try {
      await deleteTask(taskId)
    } catch (err) {
      // 404면 이미 지워진 작업이다 → 목록에서도 뺀다
      if (!(err instanceof ApiError && err.status === 404)) {
        setDeleteError({ taskId, message: err instanceof ApiError ? err.message : '작업을 삭제하지 못했습니다.' })
        return
      }
    } finally {
      setDeleting(null)
      setConfirming(null)
    }
    forget(taskId)
    setState((s) => (s.status === 'ready' ? { status: 'ready', tasks: s.tasks.filter((t) => t.taskId !== taskId) } : s))
  }

  return (
    <AppCard fixedHeight>
      <header className="flex w-full shrink-0 items-center justify-between gap-3 px-5 pt-5 text-[13px] sm:px-8 sm:pt-6">
        <div className="flex items-center gap-2">
          <Logo className="h-[22px] w-auto" />
          <span className="font-semibold">AXOX</span>
        </div>
        <Link to="/" className="font-semibold text-ink hover:underline">
          대화로 돌아가기
        </Link>
      </header>

      <main className="min-h-0 w-full flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-[915px] px-4 py-6">
          <h1 className="mb-4 pl-1 text-lg font-semibold">작업 이력</h1>

          {state.status === 'loading' && <p className="pl-1 text-sm text-muted">불러오는 중…</p>}
          {state.status === 'error' && (
            <p role="alert" className="pl-1 text-sm text-danger">
              {state.message}
            </p>
          )}
          {state.status === 'ready' && state.tasks.length === 0 && <p className="pl-1 text-sm text-muted">아직 요청한 작업이 없어요.</p>}
          {state.status === 'ready' && state.tasks.length > 0 && (
            <ul className="flex flex-col gap-2.5">
              {state.tasks.map((task) => (
                <li key={task.taskId}>
                  <div className="glass flex w-full items-center gap-1 pr-2 transition-colors hover:bg-white/80">
                    <button
                      type="button"
                      onClick={() => open(task)}
                      className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left focus-visible:outline-2 focus-visible:outline-line-strong"
                    >
                      <span className={`shrink-0 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold ${STATUS[task.status].cls}`}>
                        {STATUS[task.status].label}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-sm">{task.requestText}</span>
                      <time dateTime={task.createdAt} className="shrink-0 text-[12px] text-muted">
                        {formatDateTime(task.createdAt)}
                      </time>
                    </button>
                    {!DELETABLE.includes(task.status) ? (
                      // 삭제 버튼 자리만큼 비워 행마다 날짜 위치를 맞춘다
                      <span className="size-7 shrink-0" aria-hidden="true" />
                    ) : confirming === task.taskId ? (
                      <div className="flex shrink-0 items-center gap-1 text-[12px] font-semibold">
                        <button
                          type="button"
                          onClick={() => void remove(task.taskId)}
                          disabled={deleting === task.taskId}
                          aria-busy={deleting === task.taskId || undefined}
                          className="rounded-md px-2 py-1 text-danger hover:bg-danger/10 focus-visible:outline-2 focus-visible:outline-danger disabled:opacity-50"
                        >
                          {deleting === task.taskId ? '삭제 중…' : '삭제'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirming(null)}
                          disabled={deleting === task.taskId}
                          className="rounded-md px-2 py-1 text-muted hover:bg-ink/6 focus-visible:outline-2 focus-visible:outline-line-strong disabled:opacity-50"
                        >
                          취소
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setConfirming(task.taskId)
                          setDeleteError(null)
                        }}
                        aria-label={`작업 삭제: ${task.requestText}`}
                        title="이력에서 삭제"
                        className="shrink-0 rounded-md p-1.5 text-muted hover:bg-danger/10 hover:text-danger focus-visible:outline-2 focus-visible:outline-line-strong"
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                  {deleteError?.taskId === task.taskId && (
                    <p role="alert" className="mt-1 pl-3 text-[12px] text-danger">
                      {deleteError.message}
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppCard>
  )
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 7h16M10 11v6M14 11v6M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-12M9 7V4h6v3" />
    </svg>
  )
}
