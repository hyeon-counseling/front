# hyeon-front 프론트엔드 개발원칙

공통 원칙은 루트 `CLAUDE.md`를 참조한다.
이 파일은 프론트엔드(Next.js)에만 적용된다.

---

## 프로젝트 정보

- **배포**: Vercel (main 브랜치 push 시 자동 배포)
- **프레임워크**: Next.js (App Router)
- **언어**: TypeScript
- **로컬 실행**: `npm run dev`

---

## 폴더 구조 원칙 (S1 개편 이후)

```
src/
├── app/
│   ├── layout.tsx          ← 루트: html(lang=ko)·서체·AuthProvider만
│   ├── (ko)/               ← 한국어 사이트(기본) — layout.tsx에 한국어 헤더·푸터
│   │   ├── page.tsx        홈 · about · counseling · courses · workbooks · articles/[id]
│   │   ├── faq · contact · terms · privacy · refund
│   │   ├── login · register · forgot-password · reset-password · auth/*
│   │   ├── my/             내 학습(대시보드) · my/orders(주문·PDF)
│   │   └── admin/          관리자 (shop/kr·shop/en = 기존 카페24·Polar 화면, users, common, 템플릿)
│   └── en/                 ← 영어 사이트(기존 페이지 이동, 신규 개발 없음) — layout.tsx에 영어 헤더·푸터
├── components/
│   ├── ui/index.tsx        ← 공용 UI 킷 (Button·Input·Card·Modal·Badge·Alert·EmptyState·Skeleton·Toast·PageHeader)
│   ├── ko/                 ← 한국어 셸 (SiteHeader·SiteFooter·LegalPage·GoogleIcon)
│   └── en/                 ← 영어 셸 (Header·Footer)
├── contexts/AuthContext.tsx
└── lib/api.ts              ← apiFetch (JWT 자동 첨부)
```

- 새 한국어 페이지는 `app/(ko)/` 아래에 만들고, 제목은 `font-display`(고운바탕), 본문은 기본 서체(Pretendard).
- 색상은 `globals.css`의 CSS 변수만 사용 (`--brand` #3d6b5e 유지). 라벨은 `.eyebrow`, 링크는 `.link-underline`.
- 옛 경로 리다이렉트는 `next.config.ts`(`/shop→/en/shop`, `/mypage→/my`, `/admin/kr→/admin/shop/kr` 등).

---

## 백엔드 API 연동 원칙

```typescript
// lib/api.ts에서 백엔드 URL 중앙 관리
const API_BASE = process.env.NEXT_PUBLIC_API_URL;

export async function fetchAPI(endpoint: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(getToken() && { Authorization: `Bearer ${getToken()}` }),
    },
    ...options,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
```

환경변수:
```
NEXT_PUBLIC_API_URL=https://hyeon-back.onrender.com  # 프로덕션
# 개발 시: http://localhost:3000
```

---

## 주요 페이지 구조

| 경로 | 역할 | 인증 |
|------|------|------|
| `/` | 한국어 홈 | 불필요 |
| `/courses`, `/workbooks` | 강의·워크북 (S2·S4에서 실제 기능) | 불필요 |
| `/counseling` | 상담 안내 (당분간 카페24 링크) | 불필요 |
| `/articles`, `/articles/[id]` | 한국어 아티클 (`/api/contents?lang=ko`) | 불필요 |
| `/my`, `/my/orders` | 내 학습 · 주문 내역/PDF | 로그인 |
| `/admin/*` | 관리자 (Shop 아래 카페24·Polar) | 관리자 |
| `/en/*` | 영어 사이트(전자책·Polar) | 페이지별 |

---

## 인증 처리 원칙

- 현재는 JWT를 localStorage에 저장(`AuthContext`). httpOnly 쿠키 전환은 카카오·네이버 로그인과 함께 진행 예정(`docs/PRD-V2.md`)
- 로그인 필요 페이지는 미들웨어로 보호
- 구글 소셜 로그인은 NextAuth.js 또는 백엔드 OAuth 엔드포인트 사용

---

## 컴포넌트 설계 원칙

```typescript
// 컴포넌트 파일 구조
'use client'; // 또는 'use server' 명시

interface Props {
  // 명확한 타입 정의
}

export default function ComponentName({ prop }: Props) {
  // ...
}
```

- 서버 컴포넌트를 기본으로 사용하고 필요할 때만 `'use client'` 추가
- 공통 UI는 `components/ui/`에, 기능별 컴포넌트는 `components/features/`에

---

## 스타일링 원칙

- Tailwind CSS 사용 (Next.js 기본 설정)
- 한국어/영어 혼용 UI 지원 (콘텐츠는 DB에서 언어별로 분리)
- 반응형 디자인 필수 (모바일 우선)

---

## 환경변수

```
NEXT_PUBLIC_API_URL=         # 백엔드 URL (공개 가능)
NEXTAUTH_SECRET=             # NextAuth 시크릿 (비공개)
GOOGLE_CLIENT_ID=            # 구글 로그인 (비공개)
GOOGLE_CLIENT_SECRET=        # 구글 로그인 (비공개)
```

`NEXT_PUBLIC_` 접두사가 있는 변수만 브라우저에 노출된다.
API 키 등 민감한 값은 절대 `NEXT_PUBLIC_` 사용 금지.
