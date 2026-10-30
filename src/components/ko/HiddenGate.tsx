"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { MyCourse } from "@/lib/course";
import type { MyProgram } from "@/lib/program";

/**
 * 당분간 숨긴 상품 화면 (lib/site.ts SHOW_COURSES·SHOW_COUNSELING)
 * 공개(show) → 그대로. 관리자 → 그대로. 강의는 이미 이용권이 있는 회원이면 자기 강의·과정 상세는 그대로.
 * 그 밖에는 「준비 중이에요」.
 */
export function HiddenGate({ show, kind, children }: { show: boolean; kind: "courses" | "programs" | "counseling"; children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const slug = kind === "counseling" ? "" : decodeURIComponent(pathname.split("/")[2] ?? "");
  const [owned, setOwned] = useState<boolean | null>(null);
  const checkOwned = !show && !loading && !!user && user.role !== "admin" && !!slug;

  useEffect(() => {
    if (!checkOwned) return;
    Promise.all([apiRequest<MyCourse[]>("/api/my/courses"), apiRequest<MyProgram[]>("/api/my/programs")]).then(([c, p]) => {
      const programs = p.ok && p.data ? p.data : [];
      const courses = new Set([...(c.ok && c.data ? c.data.map((x) => x.slug) : []), ...programs.flatMap((x) => x.courses.map((y) => y.slug))]);
      setOwned(kind === "programs" ? programs.some((x) => x.slug === slug) : courses.has(slug));
    });
  }, [checkOwned, kind, slug]);

  if (show) return <>{children}</>;
  if (loading || (checkOwned && owned === null)) return <div className="min-h-[50vh]" />;
  if (user?.role === "admin" || (checkOwned && owned)) return <>{children}</>;
  return <ComingSoon />;
}

function ComingSoon() {
  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      <p className="text-4xl">🌱</p>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">준비 중이에요</h1>
      <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">더 좋은 모습으로 곧 찾아올게요. 지금은 심리검사와 아티클을 먼저 만나 보세요.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/assessment" className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
          심리검사 보기
        </Link>
        <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold text-[var(--foreground)]">
          홈으로
        </Link>
      </div>
    </div>
  );
}
