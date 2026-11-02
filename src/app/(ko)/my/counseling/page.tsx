"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Skeleton } from "@/components/ui";
import { SESSION_STATUS, type MyPass } from "@/lib/counseling";

// 마이페이지 · 심리상담 현황 — 내 상담권, 남은 회기, 세부 신청서, 확정된 일정
export default function MyCounselingPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [passes, setPasses] = useState<MyPass[] | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/my/counseling");
      return;
    }
    apiRequest<MyPass[]>("/api/counseling/my").then((r) => setPasses(r.ok && r.data ? r.data : []));
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        <h1 className="font-display text-2xl text-[var(--foreground)] sm:text-3xl">심리상담 현황</h1>
        {passes === null ? (
          <Skeleton className="mt-8 h-40" />
        ) : passes.length === 0 ? (
          <div className="card mt-8 p-8 text-center">
            <p className="text-[var(--foreground)]">이용 중인 상담이 없어요.</p>
            <Link href="/counseling" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
              상담 안내 보기
            </Link>
          </div>
        ) : (
          <div className="mt-8 grid gap-4">
            {passes.map((p) => (
              <section key={p.id} className="card p-6">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-[var(--foreground)]">개인 상담 · {p.planName}</h2>
                    <p className="mt-1 text-sm text-[var(--foreground-muted)]">
                      {p.status === "refunded" ? "환불 완료" : p.validUntil ? `${new Date(p.validUntil).toLocaleDateString("ko-KR")}까지${p.expired ? " · 기간이 지났어요" : ""}` : "유효기간 없음"}
                    </p>
                  </div>
                  {p.status === "active" && (
                    <p className="text-right">
                      <span className="block text-xs text-[var(--foreground-subtle)]">남은 회기</span>
                      <span className="text-2xl font-extrabold text-[var(--brand)]">
                        {p.remaining}
                        <small className="text-sm font-semibold text-[var(--foreground-muted)]"> / {p.sessions}회</small>
                      </span>
                    </p>
                  )}
                </div>

                {p.needsIntake && (
                  <div className="mt-5 rounded-xl bg-[var(--brand-light)] px-4 py-4">
                    <p className="text-sm font-semibold text-[var(--brand-ink)]">세부 신청서를 작성해 주세요. 받은 뒤 일정을 확정해 알려 드려요.</p>
                    <Link href={`/my/counseling/${p.id}/intake`} className="mt-3 inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                      세부 신청서 작성하기
                    </Link>
                  </div>
                )}
                {p.status === "active" && !p.needsIntake && p.scheduled === 0 && p.remaining > 0 && (
                  <p className="mt-5 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                    {p.log.length === 0 ? "세부 신청서를 받았어요. 일정을 확정해 알려 드릴게요." : "다음 일정은 상담에서 함께 조율해요."}
                  </p>
                )}
                {p.sessions > 1 && p.status === "active" && <p className="mt-3 text-xs text-[var(--foreground-subtle)]">첫 상담에서 이후 상담 일정을 함께 조율해요.</p>}

                {p.log.length > 0 && (
                  <ul className="mt-5 divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)]">
                    {p.log.map((s) => (
                      <li key={s.id} className="px-4 py-3 text-sm">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="font-semibold text-[var(--foreground)]">{s.text}</span>
                          <span className="shrink-0 text-xs text-[var(--foreground-subtle)]">{SESSION_STATUS[s.status]}</span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                          {s.method === "offline" ? `대면${s.place ? ` · ${s.place}` : " · 장소는 3일 전에 알려 드려요"}` : "화상"}
                        </p>
                        {s.videoLink && (
                          <a href={s.videoLink} target="_blank" rel="noreferrer" className="link-underline mt-1 inline-block text-xs text-[var(--foreground)]">
                            화상 상담 들어가기
                          </a>
                        )}
                      </li>
                    ))}
                  </ul>
                )}

                {p.status === "active" && <p className="mt-4 text-xs text-[var(--foreground-subtle)]">일정 변경·취소는 카카오톡 채널 「심리상담실 현」으로 알려 주세요.</p>}
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
