import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router'
import { ApiError } from '@/api/client'
import { listMyTasks } from '@/api/tasks'
import { Logo } from '@/components/Logo'
import { AppCard } from '@/layouts/AppCard'
import { useChatStore } from '@/stores/chatStore'
import type { TaskStatus, TaskSummary } from '@/types/task'

const STATUS: Record<TaskStatus, { label: string; cls: string }> = {
  QUEUED: { label: '대기', cls: 'bg-ink/6 text-muted' },
  RUNNING: { label: '분석 중', cls: 'bg-accent/10 text-accent' },
  WAITING_APPROVAL: { label: '승인 대기', cls: 'bg-amber-50 text-amber-800 border-amber-600/20' },
  DONE: { label: '완료', cls: 'bg-emerald-50 text-emerald-800 border-emerald-600/20' },
  FAILED: { label: '실패', cls: 'bg-danger/10 text-danger' },
  REJECTED: { label: '거절됨', cls: 'bg-ink/6 text-muted' },
}

const formatTime = (iso: string) => new Date(iso).toLocaleString('ko-KR', { dateStyle: 'medium', timeStyle: 'short' })

type LoadState = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ready'; tasks: TaskSummary[] }

/** `GET /api/ai/tasks?mine=true` — 내 작업 이력. 누르면 메인 대화로 불러온다 */
export function TasksPage() {
  const navigate = useNavigate()
  const restore = useChatStore((s) => s.restore)
  const [state, setState] = useState<LoadState>({ status: 'loading' })

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

  return (
    <AppCard fixedHeight>
      <header className="flex w-full shrink-0 items-center justify-between gap-3 px-5 pt-5 text-[13px] sm:px-8 sm:pt-6">
        <div className="flex items-center gap-2">
          <Logo className="h-[21px] w-5 text-ink" />
          <span className="font-semibold">AX Navigator AI</span>
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
                  <button
                    type="button"
                    onClick={() => open(task)}
                    className="glass flex w-full items-center gap-3 p-3 text-left transition-colors hover:bg-white/80 focus-visible:outline-2 focus-visible:outline-line-strong"
                  >
                    <span className={`shrink-0 rounded-full border border-transparent px-2.5 py-1 text-[11px] font-semibold ${STATUS[task.status].cls}`}>
                      {STATUS[task.status].label}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-sm">{task.requestText}</span>
                    <time dateTime={task.createdAt} className="shrink-0 text-[12px] text-muted">
                      {formatTime(task.createdAt)}
                    </time>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
    </AppCard>
  )
}
