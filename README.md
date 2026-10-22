# AX Navigator AI — Frontend

React 19 + Vite + TypeScript + Tailwind CSS v4

## 실행

```bash
cp .env.example .env.local   # 기본값은 실제 백엔드(VITE_USE_MOCK=false). true면 백엔드 없이 mock으로 동작
npm install
npm run dev                  # http://localhost:5173
```

| 모드 | 설정 | 계정 |
|---|---|---|
| 실제 백엔드 | Spring을 `localhost:8080`에 띄우고 `VITE_USE_MOCK=false` | 시드 `analyst1@gaon.example`, `analyst2@gaon.example` / `ChangeMe123!` (또는 회원가입) |
| Mock | `VITE_USE_MOCK=true` | `demo@ax-navigator.com` / `demo1234!` |

- `VITE_API_BASE_URL`을 비워 두면 개발 서버의 vite proxy가 `/api`를 백엔드로 넘긴다. 프록시는 `Origin` 헤더를 빼고 넘기므로 백엔드 CORS 설정 없이 동작한다.
- `VITE_API_BASE_URL=http://localhost:8080`처럼 직접 연결하면 백엔드 `CORS_ORIGIN`에 프론트 주소(예: `http://localhost:5173`)를 넣고 재시작해야 한다. 안 하면 POST가 403(`Invalid CORS request`)으로 막힌다.
- 백엔드가 `AGENT_ENABLED=false`면 새 작업은 QUEUED로 남는다. 화면은 8초 뒤 "대기열에 있어요" 안내를 띄우고 완료처럼 보이지 않게 한다. 분석·승인 흐름은 mock 모드로 확인한다.
- Swagger: `http://localhost:8080/swagger-ui/index.html`

## 배포 (Vercel)

1. Vercel에서 이 저장소를 Import (Vite 자동 인식, Build `npm run build`, Output `dist`)
2. Environment Variables
   - 백엔드 연결: `VITE_API_BASE_URL=https://배포된-백엔드-주소` (끝에 `/`, `/api` 없이), `VITE_USE_MOCK=false`
   - 백엔드 없이 화면만: `VITE_USE_MOCK=true`
   - 빌드할 때 들어가는 값이라 바꾸면 Redeploy 해야 한다
3. 백엔드 `CORS_ORIGIN`에 Vercel 주소(예: `https://프로젝트명.vercel.app`)를 추가하고 재시작. 백엔드는 HTTPS여야 한다 (HTTP면 브라우저가 막음)

`vercel.json`은 `/tasks` 같은 주소에서 새로고침해도 404가 나지 않게 모든 경로를 `index.html`로 돌려준다.
배포본에는 Vite 프록시가 없으므로 `VITE_API_BASE_URL`을 반드시 넣는다. SSE 때문에 Vercel rewrites로 `/api`를 프록시하지 않고 백엔드에 직접 연결한다.

## 화면

| 경로 | 화면 | 접근 |
|---|---|---|
| `/login` | 로그인 | 비로그인 |
| `/signup` | 회원가입 | 비로그인 |
| `/` | 메인 (채팅 + AX 투자 로드맵) | 로그인 필요 |
| `/tasks` | 작업 이력 (누르면 메인 대화로 불러오고, 진행 중·승인 대기면 스트림 재구독) | 로그인 필요 |

## 인증·로그아웃

- 로그인 응답의 `accessToken`을 `authStore`에 저장하고(localStorage `ax-auth`), 모든 `/api/**`와 SSE에 `Authorization: Bearer` 헤더로 보낸다.
- 로그아웃 API는 없다 (JWT). 로그아웃 버튼을 누르면 토큰, 사용자, 저장된 로그인 정보를 지우고, SSE 연결을 모두 끊고, 대화와 문서 패널을 비운 뒤 로그인 화면으로 이동한다.
- API나 SSE가 401을 받으면 같은 방식으로 세션을 끝내고 "로그인이 만료되었습니다" 안내와 함께 로그인 화면으로 보낸다. 다시 로그인하면 원래 화면으로 돌아간다.
- 로그인 없이 보호 페이지(`/`, `/tasks`)에 들어오면 로그인 화면으로 보내고, 로그인 후 원래 화면으로 돌려보낸다.

## 구조

```
src/
├── api/          # fetch 래퍼(client.ts), 인증(auth.ts), 작업·SSE·승인·문서(tasks.ts), mock/
├── stores/       # zustand — authStore(토큰·사용자, 로그아웃), chatStore(SSE 이벤트 → 대화 상태, 세션 종료 시 정리)
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
| 진단만 | 요청 문구에 `진단`을 넣는다 | 로드맵 없이 DONE. 답변(`result.answer`)과 성숙도 카드만 표시 |
| 예산 없음 | 요청 문구에 `예산`·`억`을 넣지 않는다 | 예산 제약 없이 선정. 예산 바 대신 "예산 제약 없이 선정", 남은 예산 "제약 없음" |
| 다른 계정 | 작업을 만든 사용자와 다른 사용자로 조회·스트림·승인 | 403 ("작업을 요청한 본인만 승인할 수 있어요") |
| 근거 문서 | 근거 칩·성숙도 근거 클릭 | 원문 패널 (민감도 배지 포함) |
| 작업 이력 | 헤더 '작업 이력' → 항목 클릭 | 대화에 작업 복원. 승인 대기 작업은 이어서 승인할 수 있다 (mock 작업은 메모리에만 있어 새로고침하면 사라짐) |

Mock 선정 결과: 코드 리뷰 보조 에이전트 · 사내 규정 Q&A 검색 · 온보딩 안내 에이전트(사내 규정 Q&A가 선행). AX점수 1위인 장애 티켓 분류는 1년 차 비용 때문에 어떤 조합에서도 예산을 넘어 빠진다.

## 백엔드 연동 메모

**공통 요청** (`src/api/client.ts`)
- 응답 본문을 문자열로 먼저 읽고 비어 있으면 파싱하지 않는다 (승인 API는 본문 없는 202).
- 오류는 `{ code, message, hint }`의 `message`를 그대로 보여 준다. 400 `VALIDATION_ERROR`의 `hint.fields`는 회원가입 입력란별로 표시한다.
- 401은 세션 종료(로그인 화면), 403은 로그아웃하지 않고 메시지만 표시, 네트워크 오류는 HTTP 오류와 구분한다.
- POST(작업 생성·승인)는 자동 재전송하지 않는다.

**SSE** (`src/api/sse.ts`, `src/stores/chatStore.ts`)
- `EventSource` 대신 fetch 스트리밍 + `Authorization: Bearer` 헤더. 토큰을 URL에 넣지 않는다.
- 청크 경계와 무관하게 빈 줄로 이벤트를 나눈다 (한 청크에 여러 이벤트, 청크 사이에서 나뉜 JSON·한글, CRLF 처리).
- 45초간 아무것도 못 받으면(15초 heartbeat 포함) 다시 연결한다. 연결은 작업당 하나.
- 이벤트 재생이 없으므로 연결될 때마다(첫 연결 포함) `GET /api/ai/tasks/{taskId}`로 상태를 맞춘다. DONE·FAILED 이벤트와 승인 후에도 다시 조회한다.
- 서버가 스트림을 닫으면 상세 조회로 최종 상태를 확인하고, 아직 진행 중일 때만 다시 연결한다.
- 승인 409(`INVALID_STATE`)나 응답을 놓친 경우 상세 조회 결과로 화면을 맞춘다.

**결과 표시**
- `result`는 null이거나 일부만 올 수 있다. 후보의 표시용 이름이 없으면 `업무 {id}`처럼 대체 문구로 보여 준다.
- 요청에 예산이 없으면 `budgetKrw`·`remainingBudgetKrw`·`budgetLimitKrw`가 null이다. 예산 바를 그리지 않고 "예산 제약 없이 선정"으로 표시한다.
- 추천할 과제가 없으면 `roadmap: null`인 DONE이 TOKEN 없이 온다. 승인·등록 문구 대신 `result.answer`와 성숙도 카드를 보여 준다.
- 솔루션 템플릿 하나가 여러 업무에 붙을 수 있어 후보는 `(processId, solutionId)` 쌍으로 구분한다. 선행 과제는 `(dependsOnProcessId, dependsOnSolutionId)`로 찾는다.
- `portfolio.warnings`(지표 부족, `missingMonths`)는 제외 업무 목록에 함께 표시하고, `insufficient: true`는 "조건을 만족하는 조합이 없음" 안내로 보여 준다.
- 작업 이력의 `createdAt`·`completedAt`은 오프셋 없는 로컬 시각이라 그대로 로컬 시각으로 읽는다 (Z를 붙이지 않는다).
