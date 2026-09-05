"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

// ─────────────────────────────────────────────────────────────────
// 내 학습(마이페이지) 대시보드 — S2/S4에서 이어보기·진도·워크북 카드가 채워진다.
// 지금은 계정 정보와 바로가기만.
// ─────────────────────────────────────────────────────────────────
export default function MyPage() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/my");
  }, [loading, user, router]);

  if (loading || !user) return null;

  const cards = [
    { title: "내 강의", desc: "수강 중인 강의와 진도", href: "/courses", note: "아직 수강 중인 강의가 없어요" },
    { title: "내 워크북", desc: "진행 중인 워크북과 기록", href: "/workbooks", note: "아직 시작한 워크북이 없어요" },
    { title: "주문 내역", desc: "결제 내역과 구매한 전자책", href: "/my/orders", note: null },
  ];

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <p className="mb-3"><span className="eyebrow">내 학습</span></p>
        <h1 className="font-display text-3xl text-[var(--foreground)] sm:text-4xl">
          {user.name}님, 오늘도 10분.
        </h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">{user.email}</p>

        <div className="mt-10 grid gap-4 sm:grid-cols-3">
          {cards.map((c) => (
            <Link key={c.title} href={c.href} className="group card p-6 transition-colors hover:border-[var(--brand)]">
              <h2 className="font-display text-xl text-[var(--foreground)] group-hover:text-[var(--brand)]">{c.title}</h2>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">{c.desc}</p>
              {c.note && <p className="mt-4 text-xs text-[var(--foreground-subtle)]">{c.note}</p>}
            </Link>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap items-center gap-4 border-t border-[var(--border)] pt-6 text-sm">
          {user.role === "admin" && (
            <Link href="/admin" className="link-underline text-[var(--foreground)]">
              관리자 페이지
            </Link>
          )}
          <button
            onClick={() => {
              logout();
              router.push("/");
            }}
            className="cursor-pointer text-[var(--foreground-subtle)] hover:text-[var(--foreground)]"
          >
            로그아웃
          </button>
        </div>
      </div>
    </div>
  );
}
