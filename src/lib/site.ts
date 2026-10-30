/**
 * 사이트 대표 주소 — 공유 미리보기·대표 주소(canonical)·사이트맵·robots 가 쓴다
 * NEXT_PUBLIC_SITE_URL(권장: https://hyeon-counseling.com) → 없으면 Vercel 의 프로덕션 도메인 → 로컬
 * Vercel 에 자체 도메인을 프로덕션으로 붙이면 VERCEL_PROJECT_PRODUCTION_URL 도 그 도메인이 된다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");
