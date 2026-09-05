import type { Metadata } from "next";
import { Geist } from "next/font/google";
import Header from "@/components/en/Header";
import Footer from "@/components/en/Footer";

// 영어 사이트(/en/*) — 기존 페이지를 그대로 옮긴 영역. 신규 개발 없음.
// .site-en 클래스가 기존 크림 팔레트·서체를 복원한다 (globals.css).
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Hyeon Counseling — Psychological Knowledge for Everyday Wellbeing",
    template: "%s | Hyeon Counseling",
  },
  description:
    "Practical psychology resources by counselor Hyeon. E-books, columns, and self-coaching programs to help you understand your mind and grow.",
};

export default function EnLayout({ children }: { children: React.ReactNode }) {
  return (
    <div lang="en" className={`site-en ${geistSans.variable} flex min-h-screen flex-col`}>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
