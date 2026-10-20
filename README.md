# AX Navigator AI — Frontend

React 19 + Vite + TypeScript + Tailwind CSS v4

## 실행

```bash
cp .env.example .env.local   # VITE_USE_MOCK=true면 백엔드 없이 동작
npm install
npm run dev                  # http://localhost:5173
```

Mock 시연 계정: `demo@ax-navigator.com` / `demo1234!`

## 화면

| 경로 | 화면 | 접근 |
|---|---|---|
| `/login` | 로그인 | 비로그인 |
| `/signup` | 회원가입 | 비로그인 |
| `/` | 메인 (채팅 + AX 투자 로드맵) | 로그인 필요 |

## 구조

```
src/
├── api/          # fetch 래퍼(client.ts), 인증(auth.ts), 작업·SSE·승인·문서(tasks.ts), mock/
├── stores/       # zustand — authStore(토큰·사용자), chatStore(SSE 이벤트 → 대화 상태)
├── types/        # §8 계약 타입 (task.ts)
├── components/
│   ├── chat/     # ChatInput, Suggestions, ProgressSteps, ApprovalCard, DocumentPanel …
│   ├── roadmap/  # RoadmapReport, 요약·예산, 일정(간트), 과제 카드, 성숙도, 후보 비교표
│   └── …         # Logo, BackgroundBlobs, TextField, Button, FormAlert
├── layouts/      # AppCard(디자인 카드 + 배경), AuthLayout
├── lib/          # 검증, 금액·비율 포맷
├── pages/        # LoginPage, SignupPage, MainPage
└── routes/       # RequireAuth, GuestOnly
```

## Mock 모드 시나리오

`VITE_USE_MOCK=true`면 어떤 질문을 보내도 MVP 시나리오(예산 3억 원 로드맵) 흐름을 재생한다.
도구 호출 진행(TOOL_START/END) → 답변 스트리밍(TOKEN) → 로드맵·승인 카드(APPROVAL_REQUIRED) → 승인 시 프로젝트 등록(DONE) / 거절 시 종료.
근거 문서 칩을 누르면 원문 패널이 열린다.

## 백엔드 연동 메모 (SSE)

진행 이벤트 스트림은 `EventSource` 대신 fetch로 읽고 **`Authorization: Bearer` 헤더로 인증**한다 (`src/api/sse.ts`). 토큰을 URL에 넣지 않는다.

Spring 쪽에서 필요한 것:
- `GET /api/ai/tasks/{taskId}/stream`도 다른 API와 같은 JWT 헤더 인증
- 15초마다 heartbeat 주석 전송 (`emitter.send(SseEmitter.event().comment("ping"))`) — 45초간 아무것도 안 오면 프론트가 재연결한다
- Spring Security 6: `.dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()` (스트림 중간에 403 나는 문제 방지)
- 스트림·조회·승인 모두 작업 요청자 본인인지 확인 (아니면 403/404 → 프론트는 재시도하지 않음)
- nginx 경유 시 `proxy_buffering off` 또는 응답 헤더 `X-Accel-Buffering: no`
- (선택) 이벤트에 `id:`를 붙이면 재연결 시 `Last-Event-ID` 헤더로 돌려받는다. 프론트는 재연결 직후 `GET /api/ai/tasks/{taskId}`로 상태를 다시 맞추므로 없어도 동작한다
