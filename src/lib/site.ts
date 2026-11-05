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

/**
 * 강의·개인 상담 공개 여부 — 10/30 상담가: 당분간 관리자에게만 보인다
 * false 면 메뉴·홈·안내 링크에서 빠지고, 관리자가 아니면 /courses·/programs·/counseling 에서 「준비 중이에요」가 보인다.
 * 이미 이용권이 있는 회원은 자기 강의·과정 화면과 학습 화면(/learn)·마이페이지를 그대로 쓴다. true 로 바꾸면 모두 다시 열린다.
 */
export const SHOW_COURSES = false;
export const SHOW_COUNSELING = false;

/** 종합심리검사 서비스 제공기간 — 토스페이먼츠 카드사 심사 표시 사항 (상담가 확정, 상품 상세·환불 규정이 함께 쓴다) */
export const ASSESSMENT_SERVICE_PERIOD = "서비스 제공기간: 결제일로부터 최대 2개월";
export const ASSESSMENT_REPORT_PERIOD = "보고서·해석 영상은 해석 상담 후 14일 동안 볼 수 있어요. 보고서는 그 안에 PDF로 저장할 수 있어요.";
