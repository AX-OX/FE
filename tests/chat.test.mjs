import assert from 'node:assert/strict'
import { after, afterEach, beforeEach, test } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { createServer } from 'vite'
import { createElement } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

// Exercise the real TS store, HTTP client and renderer through the existing Vite
// transform pipeline; no additional testing/browser dependencies are required.
const storage = new Map()
globalThis.localStorage = {
  getItem: (key) => storage.get(key) ?? null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: (key) => storage.delete(key),
}
globalThis.window = { setTimeout, clearTimeout }
const vite = await createServer({ server: { middlewareMode: true, hmr: false, ws: false, watch: null },
  define: { 'import.meta.env.VITE_USE_MOCK': '"false"', 'import.meta.env.VITE_API_BASE_URL': '""' } })
const { useChatStore, isBusy } = await vite.ssrLoadModule('/src/stores/chatStore.ts')
const { TurnView } = await vite.ssrLoadModule('/src/components/chat/TurnView.tsx')
const taskId = '67def8d2-034f-45b6-9976-e83628a904f3'
let calls = []
let reply
let failure = false
let deferred
const originalFetch = globalThis.fetch

beforeEach(() => {
  useChatStore.getState().reset()
  calls = []
  reply = { intent: 'SERVICE_QA', message: 'AX 개념에 대한 설명이에요.', taskId: null }
  failure = false
  deferred = undefined
  globalThis.fetch = async (url, init = {}) => {
    calls.push({ url: String(url), method: init.method ?? 'GET', body: init.body ? JSON.parse(init.body) : undefined })
    if (String(url) === '/api/ai/chat/messages') {
      if (deferred) await deferred
      return Response.json(failure ? { code: 'AI_UNAVAILABLE', message: '답변 서버에 연결하지 못했어요.' } : reply, { status: failure ? 503 : 200 })
    }
    if (String(url).endsWith('/stream')) {
      return new Response(new ReadableStream({ start(controller) {
        init.signal.addEventListener('abort', () => controller.close(), { once: true })
      } }), { headers: { 'Content-Type': 'text/event-stream' } })
    }
    if (String(url) === `/api/ai/tasks/${taskId}`) {
      return Response.json({ taskId, status: 'RUNNING', result: null, traceUrl: null })
    }
    throw new Error(`Unexpected endpoint: ${url}`)
  }
})
afterEach(async () => { useChatStore.getState().reset(); await setImmediate() })
after(async () => { globalThis.fetch = originalFetch; await vite.close() })

test('greetings, questions, clarifications and scope replies do not create or stream tasks', async () => {
  for (const intent of ['GREETING', 'SERVICE_QA', 'RESULT_QA', 'CLARIFY', 'OUT_OF_SCOPE']) {
    reply = { intent, message: '일반 답변입니다.', taskId: null }
    await useChatStore.getState().send('질문이에요')
    const turn = useChatStore.getState().turns.at(-1)
    assert.equal(turn.kind, 'message')
    assert.equal(turn.taskId, undefined)
    const html = renderToStaticMarkup(createElement(TurnView, { turn }))
    assert.match(html, /일반 답변입니다/)
    assert.doesNotMatch(html, /진단 중|분석 중|승인 대기|로드맵 생성|분석을 완료하지/)
  }
  assert.equal(calls.length, 5)
  assert.ok(calls.every((call) => call.url === '/api/ai/chat/messages'))
})

test('only an accepted analysis opens the existing task stream; followup stays chat', async () => {
  reply = { intent: 'ANALYZE', message: '새 분석을 시작할게요.', taskId }
  await useChatStore.getState().send('개발팀을 예산 2억으로 분석해줘')
  await setImmediate()
  const analysis = useChatStore.getState().turns[0]
  assert.equal(analysis.kind, 'analysis')
  assert.equal(analysis.taskId, taskId)
  assert.ok(calls.some((call) => call.url === `/api/ai/tasks/${taskId}/stream`))
  assert.equal(isBusy(analysis), false, 'read-only questions remain available while analysis runs')
  reply = { intent: 'RESULT_QA', message: '현재 분석이 진행 중이에요.', taskId: null }
  await useChatStore.getState().send('지금 어디까지 진행됐어?')
  const followup = calls.filter((call) => call.url === '/api/ai/chat/messages').at(-1).body
  assert.equal(followup.referenceTaskId, taskId)
  assert.deepEqual(followup.history, [{ role: 'user', content: '개발팀을 예산 2억으로 분석해줘' }])
  assert.equal(useChatStore.getState().turns[1].kind, 'message')
  assert.equal(calls.filter((call) => call.url.endsWith('/stream')).length, 1)
})

test('routing failure and malformed replies never fall back to createTask', async () => {
  failure = true
  await useChatStore.getState().send('분석해줘')
  assert.equal(useChatStore.getState().turns[0].status, 'FAILED')
  failure = false
  for (const invalid of [null, { intent: 'ANALYZE', message: '분석', taskId: null },
    { intent: 'SERVICE_QA', message: '설명', taskId }, { intent: 'UNKNOWN', message: '설명' }]) {
    reply = invalid
    await useChatStore.getState().send('질문')
    assert.equal(useChatStore.getState().turns.at(-1).status, 'FAILED')
  }
  assert.ok(calls.every((call) => call.url === '/api/ai/chat/messages'))
})

test('selecting an older analysis from history changes the followup reference', async () => {
  const older = 'ef5faaba-c458-46ce-a434-e33056e9f9da'
  reply = { intent: 'ANALYZE', message: '새 분석', taskId }
  await useChatStore.getState().send('새 분석해줘')
  await setImmediate()
  const latest = useChatStore.getState().turns[0]
  useChatStore.setState({ turns: [{ ...latest, id: 'older-turn', taskId: older, requestText: '이전 분석' }, latest] })
  await useChatStore.getState().restore({ taskId: older, requestText: '이전 분석' })
  reply = { intent: 'RESULT_QA', message: '선택한 기존 분석을 설명할게요.', taskId: null }
  await useChatStore.getState().send('이 결과 설명해줘')
  assert.equal(calls.filter((call) => call.url === '/api/ai/chat/messages').at(-1).body.referenceTaskId, older)
})

test('pending replies show no analysis steps and block duplicate sends', async () => {
  let resolve
  deferred = new Promise((done) => { resolve = done })
  const first = useChatStore.getState().send('안녕')
  const pending = useChatStore.getState().turns[0]
  assert.equal(isBusy(pending), true)
  const html = renderToStaticMarkup(createElement(TurnView, { turn: pending }))
  assert.match(html, /답변을 준비하고 있어요/)
  assert.doesNotMatch(html, /로드맵|과제 탐색|성숙도 진단/)
  await useChatStore.getState().send('중복')
  assert.equal(calls.length, 1)
  resolve()
  await first
})

test('history is bounded and resetting conversation drops in-flight UI subscriptions', async () => {
  for (let index = 0; index < 9; index++) {
    reply = { intent: 'SERVICE_QA', message: '설명'.repeat(1800), taskId: null }
    await useChatStore.getState().send(`AX 질문 ${index} ${'a'.repeat(3000)}`)
  }
  const history = calls.at(-1).body.history
  assert.ok(history.length <= 12)
  assert.ok(history.reduce((sum, message) => sum + message.content.length, 0) <= 16000)
  let resolve
  deferred = new Promise((done) => { resolve = done })
  reply = { intent: 'ANALYZE', message: '새 분석', taskId }
  const sending = useChatStore.getState().send('분석해줘')
  useChatStore.getState().reset()
  resolve()
  await sending
  assert.equal(useChatStore.getState().turns.length, 0)
  assert.ok(calls.every((call) => call.url === '/api/ai/chat/messages'))
})
