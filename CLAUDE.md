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

## 폴더 구조 원칙

```
src/
├── app/                    ← Next.js App Router 페이지
│   ├── (auth)/             ← 로그인/회원가입 (그룹 라우트)
│   ├── (main)/             ← 메인 서비스 페이지
│   ├── admin/              ← 관리자 페이지 (보호됨)
│   └── api/                ← Next.js API Routes (필요 시)
├── components/
│   ├── ui/                 ← 재사용 가능한 기본 UI 컴포넌트
│   └── features/           ← 기능별 컴포넌트
├── lib/
│   ├── api.ts              ← 백엔드 API 호출 함수
│   └── auth.ts             ← 인증 관련 유틸
└── types/                  ← TypeScript 타입 정의
```

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

| 경로 | 역할 | 인증 필요 |
|------|------|----------|
| `/` | 메인/랜딩 | 불필요 |
| `/shop` | 전자책 목록 | 불필요 |
| `/shop/[id]` | 전자책 상세 | 불필요 |
| `/checkout` | 결제 (Polar.sh 리다이렉트) | 로그인 |
| `/mypage` | 구매 내역 + 다운로드 | 로그인 |
| `/admin` | 관리자 대시보드 | 관리자 |
| `/admin/products` | 상품 관리 | 관리자 |

---

## 인증 처리 원칙

- JWT 토큰은 `httpOnly` 쿠키에 저장 (localStorage 사용 금지 — 보안 취약)
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
