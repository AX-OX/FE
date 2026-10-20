import { useState } from 'react'
import { Button } from '@/components/Button'
import { formatKrw } from '@/lib/format'
import type { Turn } from '@/stores/chatStore'

interface ApprovalCardProps {
  turn: Turn
  onDecide: (decision: { decision: 'APPROVE' | 'REJECT'; reason?: string }) => void
}

/** §8 APPROVAL_REQUIRED → 요청자 본인 승인·거절 */
export function ApprovalCard({ turn, onDecide }: ApprovalCardProps) {
  const [rejecting, setRejecting] = useState(false)
  const [reason, setReason] = useState('')
  const itemCount = turn.approval?.items.length ?? 0

  return (
    <div className="rounded-lg border border-accent/30 bg-white/80 p-4 backdrop-blur-sm">
      <h3 className="text-[15px] font-semibold">이 로드맵으로 진행할까요?</h3>
      <p className="mt-1 text-[13px] text-muted">
        승인하면 로드맵과 프로젝트 {itemCount}건이 등록됩니다
        {turn.approval && ` (배정 예산 ${formatKrw(turn.approval.totalAllocatedKrw)})`}.
      </p>

      {turn.approvalError && (
        <p role="alert" className="mt-3 text-[13px] text-danger">
          {turn.approvalError}
        </p>
      )}

      {rejecting ? (
        <div className="mt-3">
          <label htmlFor={`reason-${turn.id}`} className="mb-1.5 block text-[13px] font-semibold text-muted">
            거절 사유 (선택)
          </label>
          <textarea
            id={`reason-${turn.id}`}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={2}
            autoFocus
            placeholder="예: 고객지원 과제는 내년으로 미루고 싶어요"
            className="w-full resize-none rounded-lg border border-line bg-surface p-2.5 text-sm outline-none focus:border-line-strong"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => setRejecting(false)}
              disabled={turn.approvalPending}
              className="h-10 flex-1 rounded-lg border border-line bg-surface text-sm font-semibold hover:bg-ink/5 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              onClick={() => onDecide({ decision: 'REJECT', reason: reason.trim() || undefined })}
              disabled={turn.approvalPending}
              className="h-10 flex-1 rounded-lg bg-danger text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
            >
              {turn.approvalPending ? '처리 중…' : '거절하기'}
            </button>
          </div>
        </div>
      ) : (
        <div className="mt-3 flex gap-2">
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={turn.approvalPending}
            className="h-10 flex-1 rounded-lg border border-line bg-surface text-sm font-semibold hover:bg-ink/5 disabled:opacity-50"
          >
            거절
          </button>
          <Button
            type="button"
            onClick={() => onDecide({ decision: 'APPROVE' })}
            loading={turn.approvalPending}
            size="sm"
            className="flex-1"
          >
            승인
          </Button>
        </div>
      )}
    </div>
  )
}
