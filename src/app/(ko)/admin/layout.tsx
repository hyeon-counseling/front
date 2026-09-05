"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import AdminSidebar from "./_components/AdminSidebar";

// ─────────────────────────────────────────────────────────────────
// 어드민 공통 레이아웃
//
// - 인증 가드를 여기서 중앙화한다(각 페이지에서 반복하던 가드 제거 가능).
// - 채널 우선 사이드바 + 콘텐츠 영역 구성.
// ─────────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
    if (user.role !== "admin") {
      router.replace("/");
    }
  }, [loading, user, router]);

  // 로딩 중에는 스피너만(비관리자 콘텐츠 깜빡임 방지)
  if (loading) {
    return <div className="px-4 py-20 text-center text-sm text-[var(--foreground-muted)]">불러오는 중...</div>;
  }
  // 리다이렉트 진행 중에는 아무것도 렌더하지 않음
  if (!user || user.role !== "admin") return null;

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col lg:flex-row">
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  );
}
