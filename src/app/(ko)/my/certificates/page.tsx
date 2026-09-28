"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { hoursLabel, krDate, type CertificateInfo } from "@/lib/attendance";
import { EmptyState, Skeleton } from "@/components/ui";

// 내 수료증 — 강의 수료·워크북 95% 완주 시 자동 발급
export default function MyCertificatesPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [list, setList] = useState<CertificateInfo[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/my/certificates");
      return;
    }
    apiRequest<CertificateInfo[]>("/api/my/certificates").then((r) => setList(r.ok && r.data ? r.data : []));
  }, [loading, user, router]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/my" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← 내 학습</Link>
      <h1 className="font-display mt-3 text-3xl text-[var(--foreground)]">수료증</h1>
      <p className="mt-2 text-[var(--foreground-muted)]">강의를 수료하거나 워크북을 95% 이상 완주하면 자동으로 발급돼요.</p>
      {!list ? (
        <Skeleton className="mt-8 h-28" />
      ) : list.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="아직 받은 수료증이 없어요" description="끝까지 함께해요. 완주한 날 이곳에 수료증이 생겨요." />
        </div>
      ) : (
        <ul className="mt-8 space-y-3">
          {list.map((c) => (
            <li key={c.serial}>
              <Link href={`/certificates/${c.serial}`} className="card card-hover flex items-center gap-4 p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-xl">🎓</span>
                <span className="min-w-0 flex-1">
                  <span className="block font-semibold text-[var(--foreground)]">{c.title}</span>
                  <span className="mt-0.5 block text-sm text-[var(--foreground-muted)]">
                    {c.kind === "workbook" ? "워크북 완주" : "강의 수료"} · {krDate(c.issuedAt)}
                    {c.minutes ? ` · ${hoursLabel(c.minutes)}` : ""}
                  </span>
                  <span className="mt-0.5 block font-mono text-xs text-[var(--foreground-subtle)]">{c.serial}</span>
                </span>
                <span className="text-sm font-semibold text-[var(--brand)]">보기 →</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
