import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────
// 루트 레이아웃 — html/body + 전역 상태만.
// 헤더·푸터는 라우트 그룹별 레이아웃이 담당한다:
//   (ko)/layout.tsx  한국어 사이트(기본)
//   en/layout.tsx    영어 사이트(기존 페이지 이동)
// ─────────────────────────────────────────────────────────────────

export const metadata: Metadata = {
  title: {
    default: "심리상담실 현",
    template: "%s | 심리상담실 현",
  },
  description:
    "심리상담가 현의 강의와 셀프 워크북, 상담. 나를 이해하는 공부를 편안한 속도로.",
  openGraph: {
    siteName: "심리상담실 현",
    locale: "ko_KR",
    type: "website",
  },
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
