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
| `/tasks` | 작업 이력 (누르면 메인 대화로 불러오고, 진행 중·승인 대기면 스트림 재구독) | 로그인 필요 |

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
├── pages/        # LoginPage, SignupPage, MainPage, TasksPage
└── routes/       # RequireAuth, GuestOnly
```

## 로드맵 화면 (AX점수 기준)

- 과제 선정 기준은 **AX점수 = Impact × 0.6 + Feasibility × 0.4** (기준 문서 §6). 예산 3억 원 안에서 AX점수 합이 가장 큰 3개 조합.
- 1년 ROI·회수 기간·3년 순편익은 **보조 지표**. 과제 카드와 후보 표에서 회수 기간 → 3년 순편익 → 1년 ROI 순서로 보여 준다.
- 배지: 사람 검토 필요 / 선행: {과제명} / 표준화 낮음 / API 연동 불가 / 가정 데이터 기반(dataConfidence = ASSUMED, 점수에는 반영하지 않음)
- 분석에서 제외한 업무(사람에 대한 최종 판단을 AI가 하게 되는 업무)는 사유와 함께 따로 표시
- 점수·금액·합계는 **프론트에서 계산하지 않는다**. 서버(`result.portfolio`, `result.candidates`, 로드맵 항목) 값만 표시한다.

## Mock 모드 시나리오

`VITE_USE_MOCK=true`면 MVP 시나리오(인사·기획·개발 3개 부서 9개 업무, 예산 3억 원)를 재생한다. 데이터는 `src/api/mock/fixtures.ts` (데이터 패키지 v3 fixture로 교체 예정).

| 상황 | 하는 법 | 결과 |
|---|---|---|
| 정상 | 아무 질문이나 보낸다 | 진행(TOOL_START/END) → 답변 스트리밍(TOKEN) → 로드맵·승인 카드(APPROVAL_REQUIRED) |
| 승인 | 승인 카드에서 승인 | 로드맵·프로젝트 3건 등록 → DONE |
| 거절 | 거절 → 거절하기 | REJECTED, 재요청 예시 표시 |
| 실패 | 요청 문구에 `실패`를 넣는다 | evaluate 단계에서 FAILED + trace 링크 |
| 다른 계정 | 작업을 만든 사용자와 다른 사용자로 조회·스트림·승인 | 403 ("작업을 요청한 본인만 승인할 수 있어요") |
| 근거 문서 | 근거 칩·성숙도 근거 클릭 | 원문 패널 (민감도 배지 포함) |
| 작업 이력 | 헤더 '작업 이력' → 항목 클릭 | 대화에 작업 복원. 승인 대기 작업은 이어서 승인할 수 있다 (mock 작업은 메모리에만 있어 새로고침하면 사라짐) |

Mock 선정 결과: 코드 리뷰 보조 에이전트 · 사내 규정 Q&A 검색 · 온보딩 안내 에이전트(사내 규정 Q&A가 선행). AX점수 1위인 장애 티켓 분류는 1년 차 비용 때문에 어떤 조합에서도 예산을 넘어 빠진다.

## 백엔드 연동 메모 (SSE)

진행 이벤트 스트림은 `EventSource` 대신 fetch로 읽고 **`Authorization: Bearer` 헤더로 인증**한다 (`src/api/sse.ts`). 토큰을 URL에 넣지 않는다.

Spring 쪽에서 필요한 것:
- `GET /api/ai/tasks/{taskId}/stream`도 다른 API와 같은 JWT 헤더 인증
- 15초마다 heartbeat 주석 전송 (`emitter.send(SseEmitter.event().comment("ping"))`) — 45초간 아무것도 안 오면 프론트가 재연결한다
- Spring Security 7: `.dispatcherTypeMatchers(DispatcherType.ASYNC, DispatcherType.ERROR).permitAll()` (스트림 중간에 403 나는 문제 방지)
- 스트림·조회·승인 모두 작업 요청자 본인인지 확인 (아니면 403/404 → 프론트는 재시도하지 않음)
- nginx 경유 시 `proxy_buffering off` 또는 응답 헤더 `X-Accel-Buffering: no`
- (선택) 이벤트에 `id:`를 붙이면 재연결 시 `Last-Event-ID` 헤더로 돌려받는다. 프론트는 재연결 직후 `GET /api/ai/tasks/{taskId}`로 상태를 다시 맞추므로 없어도 동작한다
