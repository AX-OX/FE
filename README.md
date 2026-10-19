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
| `/` | 메인 (채팅) — 구현 예정 | 로그인 필요 |

## 구조

```
src/
├── api/          # fetch 래퍼(client.ts), 인증 API + mock(auth.ts)
├── stores/       # zustand (authStore: accessToken, user — localStorage 저장)
├── components/   # Logo, BackgroundBlobs, TextField, Button, FormAlert
├── layouts/      # AppCard(디자인 카드 + 배경), AuthLayout
├── pages/        # LoginPage, SignupPage, MainPage
└── routes/       # RequireAuth, GuestOnly
```
