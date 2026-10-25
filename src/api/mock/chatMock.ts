import type { ChatReply, ChatRequest } from '@/types/chat'
import { createTask, getTask } from './taskMock'

/** Offline UI demo only. Production decisions always come from the authenticated BE. */
export async function sendChatMessage({ message, referenceTaskId }: ChatRequest): Promise<ChatReply> {
  const reply = (intent: ChatReply['intent'], text: string): ChatReply => ({ intent, message: text, taskId: null })
  const normalized = message.replace(/[\s!?.~。！？]+/g, '').toLowerCase()
  if (['안녕', '안녕하세요', '고마워', '감사합니다', 'hi', 'hello'].includes(normalized)) {
    return reply('GREETING', '안녕하세요! AXOX는 AX 성숙도 진단, 업무 자동화 과제 추천과 도입 로드맵을 도와드려요. AX 개념이나 기존 분석 결과에 대해 물어보셔도 좋아요.')
  }
  if (/날씨|저녁|맛집|로또|주식|시스템\s*프롬프트/.test(message)) {
    return reply('OUT_OF_SCOPE', '해당 질문은 지원 범위에 포함되지 않아요. 기업의 AX 진단, 업무 자동화와 도입 로드맵에 관한 질문을 도와드릴 수 있어요.')
  }
  if (!/하지\s*말|방법|뭐야|무엇|어떻게|하면.*(비용|달라)|할\s*수\s*있/.test(message)
      && /분석해|진단해|선정해|만들어|추천해|분석.*실행|진단.*해\s*줘|선정하고|진단하고/.test(message)) {
    return { intent: 'ANALYZE', message: '요청하신 조건으로 새 분석을 시작할게요.', taskId: (await createTask(message)).taskId }
  }
  if (/아까|기존|결과|이\s*과제|두\s*번째|1순위|왜.*추천/.test(message)) {
    if (!referenceTaskId) return reply('CLARIFY', '작업 이력에서 설명할 분석을 불러온 뒤 질문해 주세요. 새 분석은 실행하지 않았어요.')
    const task = await getTask(referenceTaskId)
    return reply('RESULT_QA', task.result?.answer ?? `현재 분석 상태는 ${task.status}예요. 어떤 과제나 지표를 설명해 드릴까요?`)
  }
  if (/AX|ROI|성숙도|자동화|로드맵|사용|할\s*수|PDF/i.test(message)) {
    return reply('SERVICE_QA', /ROI/i.test(message)
      ? 'ROI는 투자 비용 대비 순편익의 비율이에요. 산정 기간과 도입·운영 비용, 예상 절감액을 함께 확인해야 해요. 회사별 수치는 기존 분석 결과가 필요해요.'
      : 'AXOX는 기업 데이터를 바탕으로 AX 성숙도를 진단하고 자동화 과제와 도입 로드맵을 추천해요. 개념 질문에는 바로 답변하고, 새 분석은 명확하게 요청하실 때 시작해요.')
  }
  return reply('CLARIFY', 'AX 개념이나 사용 방법이 궁금하신가요, 아니면 회사 데이터를 바탕으로 새 분석을 실행할까요?')
}
