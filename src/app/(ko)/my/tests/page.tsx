"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { MyTestRecords } from "@/components/my/MyTestRecords";

// 무료 자가 검사 기록 — 가입 화면에서 「기록을 모아 볼 수 있어요」라고 약속한 자리
export default function MyTestsPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (!loading && !user) router.replace("/login?next=/my/tests");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl text-[var(--foreground)]">무료 검사 기록</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">해 본 무료 자가 검사의 결과를 모아 봐요.</p>
        </div>
        <Link href="/tests" className="text-sm font-semibold text-[var(--brand)]">검사 하러 가기 →</Link>
      </div>
      <div className="mt-8">
        <MyTestRecords />
      </div>
    </div>
  );
}
