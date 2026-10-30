/**
 * 사이트 대표 주소 — 공유 미리보기·대표 주소(canonical)·사이트맵·robots 가 쓴다
 * NEXT_PUBLIC_SITE_URL(권장: https://hyeon-counseling.com) → 없으면 Vercel 의 프로덕션 도메인 → 로컬
 * Vercel 에 자체 도메인을 프로덕션으로 붙이면 VERCEL_PROJECT_PRODUCTION_URL 도 그 도메인이 된다.
 */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000")
).replace(/\/$/, "");

/**
 * 통신판매업 신고번호 — 하단·약관 운영자 상자가 쓴다
 * 10/30 상담가: 면허세 납부 전이라 당분간 숨김. 납부 뒤 SHOW_MAIL_ORDER_NO 를 true 로 바꾸면 모든 화면에 다시 나온다.
 */
export const MAIL_ORDER_NO = "2026-서울동작-0798";
export const SHOW_MAIL_ORDER_NO = false;
