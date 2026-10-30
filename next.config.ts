import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────
// 라우트 이동에 따른 리다이렉트 (S1)
// - 영어 사이트: 루트 → /en/* 로 이동 (이메일 링크·Polar successUrl 등 기존 URL 보호)
// - 마이페이지: /mypage → /my
// - 관리자: /admin/kr/*, /admin/en/* → /admin/shop/kr/*, /admin/shop/en/*
// 쿼리스트링은 자동으로 유지된다.
// ─────────────────────────────────────────────────────────────────
// 카페24 쇼핑몰 기본 도메인과 카페24가 쓰는 경로 (우리 사이트 경로와 겹치지 않음 — /articles·/my/orders 등은 다른 이름)
const CAFE24 = "https://hyeoncounseling.cafe24.com";
const CAFE24_PATHS = ["product", "category", "board", "article", "member", "myshop", "order", "exec", "shopinfo", "web"];

const nextConfig: NextConfig = {
  async redirects() {
    return [
      { source: "/shop", destination: "/en/shop", permanent: true },
      { source: "/shop/:id", destination: "/en/shop/:id", permanent: true },
      { source: "/content", destination: "/en/content", permanent: true },
      { source: "/content/:id", destination: "/en/content/:id", permanent: true },
      { source: "/download", destination: "/en/download", permanent: true },
      { source: "/purchase-success", destination: "/en/purchase-success", permanent: true },
      { source: "/mypage", destination: "/my", permanent: true },
      { source: "/admin/kr/:path*", destination: "/admin/shop/kr/:path*", permanent: true },
      { source: "/admin/en/:path*", destination: "/admin/shop/en/:path*", permanent: true },
      // 강의·워크북 통합 (워크북 → 쓰기 실습이 있는 강의, 주소 slug·차시 key 그대로)
      { source: "/workbooks", destination: "/courses?has=practice", permanent: false },
      { source: "/workbooks/:slug", destination: "/courses/:slug", permanent: false },
      { source: "/workbook/:slug/:day", destination: "/learn/:slug/:day", permanent: false },
      { source: "/my/workbooks/:slug", destination: "/my/courses/:slug/records", permanent: false },
      { source: "/admin/workbooks/:path*", destination: "/admin/lms/courses", permanent: false },
      // 자체 도메인 교체(10/30) — hyeon-counseling.com 이 카페24에서 이 사이트로 옮겨 와도, 이미 퍼진 쇼핑몰 링크·QR
      // (무료 PDF 의 /product/list.html?cate_no=45 등)이 깨지지 않게 카페24 기본 도메인으로 넘긴다. 경로·쿼리 그대로, 308.
      ...CAFE24_PATHS.map((p) => ({ source: `/${p}/:path*`, destination: `${CAFE24}/${p}/:path*`, permanent: true })),
      { source: "/:skin(skin-[^/]+)/:path*", destination: `${CAFE24}/:skin/:path*`, permanent: true },
      { source: "/index.html", destination: `${CAFE24}/index.html`, permanent: true },
    ];
  },
};

export default nextConfig;
