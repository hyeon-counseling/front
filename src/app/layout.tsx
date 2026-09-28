import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────
// 루트 레이아웃 — html/body + 전역 상태만.
// 헤더·푸터는 라우트 그룹별 레이아웃이 담당한다:
//   (ko)/layout.tsx  한국어 사이트(기본)
//   en/layout.tsx    영어 사이트(기존 페이지 이동)
// ─────────────────────────────────────────────────────────────────

// 사이트 주소 — 공유 미리보기 이미지를 절대 주소로 만들 때 쓴다 (없으면 Vercel 주소)
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "심리상담실 현",
    template: "%s | 심리상담실 현",
  },
  description:
    "심리상담가 현의 강의(영상·오디오·직접 써 보는 실습)와 과정, 심리검사, 상담. 나를 이해하는 공부를 편안한 속도로.",
  openGraph: {
    siteName: "심리상담실 현",
    locale: "ko_KR",
    type: "website",
    // 카카오톡·SNS 링크 미리보기 (1200×630, public/og-default.png)
    images: [{ url: "/og-default.png", width: 1200, height: 630, alt: "심리상담실 현 — 나를 이해하는 공부, 편안한 속도로." }],
  },
  twitter: { card: "summary_large_image", images: ["/og-default.png"] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <head>
        {/* 서체: Pretendard(가변) — 제목·본문 공통 */}
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="flex min-h-screen flex-col antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
