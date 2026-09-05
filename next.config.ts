import type { NextConfig } from "next";

// ─────────────────────────────────────────────────────────────────
// 라우트 이동에 따른 리다이렉트 (S1)
// - 영어 사이트: 루트 → /en/* 로 이동 (이메일 링크·Polar successUrl 등 기존 URL 보호)
// - 마이페이지: /mypage → /my
// - 관리자: /admin/kr/*, /admin/en/* → /admin/shop/kr/*, /admin/shop/en/*
// 쿼리스트링은 자동으로 유지된다.
// ─────────────────────────────────────────────────────────────────
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
    ];
  },
};

export default nextConfig;
