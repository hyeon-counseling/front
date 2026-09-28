"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { isExternal, scoreText, TONE_STYLE, type TestResult } from "@/lib/psychTest";
import { Markdown } from "@/components/practice/Markdown";
import { CrisisBox } from "@/components/tests/TestParts";
import { Skeleton, Toast } from "@/components/ui";

/** 점수 원형 게이지 */
function Ring({ value, max, color, label }: { value: number; max: number; color: string; label: string }) {
  const r = 52;
  const c = 2 * Math.PI * r;
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  return (
    <div className="relative mx-auto h-40 w-40">
      <svg viewBox="0 0 120 120" className="h-40 w-40 -rotate-90">
        <circle cx="60" cy="60" r={r} fill="none" stroke="var(--surface-muted)" strokeWidth="10" />
        <circle cx="60" cy="60" r={r} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${c * pct} ${c}`} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-[var(--foreground)]">{Number.isInteger(value) ? value : value.toFixed(2)}</span>
        <span className="text-xs text-[var(--foreground-subtle)]">{label}</span>
      </div>
    </div>
  );
}

export default function TestResultPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [r, setR] = useState<TestResult | null>(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=/tests/result/${id}`);
      return;
    }
    apiRequest<TestResult>(`/api/tests/results/${id}`).then((res) => {
      if (res.ok && res.data) setR(res.data);
      else setError(res.message || "결과를 불러오지 못했어요.");
    });
  }, [loading, user, id, router]);

  const share = async () => {
    if (!r) return;
    // 점수는 공유하지 않고 검사 링크만
    const url = `${window.location.origin}/tests/${r.test.slug}`;
    const text = `${r.test.title} — 3분이면 지금의 마음을 살펴볼 수 있어요.`;
    try {
      if (navigator.share) await navigator.share({ title: r.test.title, text, url });
      else {
        await navigator.clipboard.writeText(url);
        setToast("검사 링크를 복사했어요.");
      }
    } catch {
      /* 공유 취소 */
    }
  };

  if (error) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{error}</p>
        <Link href="/tests" className="link-underline mt-4 inline-block text-sm">검사 목록으로</Link>
      </div>
    );
  }
  if (!r) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16">
        <Skeleton className="mx-auto h-40 w-40 rounded-full" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  const tone = TONE_STYLE[r.band.tone] ?? TONE_STYLE.mild;
  const isDual = r.scales.length > 0;

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-2xl">
        <p className="text-center text-sm font-semibold text-[var(--brand)]">{r.test.title} 결과</p>
        <p className="mt-1 text-center text-xs text-[var(--foreground-subtle)]">{new Date(r.createdAt).toLocaleString("ko-KR")}</p>

        {r.crisis && <div className="mt-6"><CrisisBox strong /></div>}

        {/* 점수 */}
        <div className="card mt-6 p-7 text-center">
          {isDual ? (
            <div className="space-y-4 text-left">
              {r.scales.map((s) => (
                <div key={s.key}>
                  <div className="flex items-baseline justify-between">
                    <span className="font-bold text-[var(--foreground)]">{s.label} 성향</span>
                    <span className="text-sm text-[var(--foreground-muted)]">{s.score} / {s.max} · {s.levelLabel}</span>
                  </div>
                  <div className="mt-2 h-3 rounded-full bg-[var(--surface-muted)]">
                    <div className="h-3 rounded-full" style={{ width: `${(s.score / s.max) * 100}%`, background: r.test.color ?? "var(--brand)" }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Ring value={r.score} max={r.maxScore} color={tone.ring} label={`${scoreText(r.score, r.maxScore).split(" / ")[1]}점 만점`} />
          )}
          <p className={`mx-auto mt-5 inline-block rounded-full px-4 py-1.5 text-sm font-bold ${tone.bg} ${tone.text}`}>{r.band.label}</p>
          {r.band.subtitle && <p className="mt-3 text-[var(--foreground-muted)]">{r.band.subtitle}</p>}
        </div>

        {!r.crisis && r.band.alert && <div className="mt-5"><CrisisBox /></div>}

        {/* 해설 */}
        <section className="card mt-5 p-6 sm:p-7">
          <h2 className="text-lg font-bold text-[var(--foreground)]">🔍 결과 분석</h2>
          <div className="mt-3"><Markdown md={r.band.analysis} /></div>
          {r.band.solution && (
            <>
              <h2 className="mt-7 text-lg font-bold text-[var(--foreground)]">💡 이렇게 해 보세요</h2>
              <div className="mt-3"><Markdown md={r.band.solution} /></div>
            </>
          )}
        </section>

        {isDual &&
          r.scales.map((s) => (
            <section key={s.key} className="card mt-4 p-6">
              <h3 className="font-bold text-[var(--foreground)]">{s.label} 성향 · {s.levelLabel}</h3>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-[var(--foreground-muted)]">{s.analysis}</p>
              {s.tip && <p className="mt-3 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground)]">💡 {s.tip}</p>}
            </section>
          ))}

        {/* 추천 */}
        {r.recommendations.length > 0 && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-[var(--foreground)]">지금 나에게 도움이 될 수 있어요</h2>
            <div className="mt-4 space-y-3">
              {r.recommendations.map((rec, i) => {
                const ext = isExternal(rec.url);
                const inner = (
                  <>
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[var(--surface)] text-2xl">{rec.emoji || "📘"}</span>
                    <span className="min-w-0 flex-1">
                      {rec.tag && <span className="block text-xs font-semibold text-[var(--brand)]">{rec.tag}</span>}
                      <span className="block font-bold text-[var(--foreground)]">{rec.title}</span>
                      {rec.desc && <span className="mt-0.5 block text-sm text-[var(--foreground-muted)]">{rec.desc}</span>}
                    </span>
                    <span className="shrink-0 text-sm font-semibold text-[var(--brand)]">{rec.cta || "보기"} →</span>
                  </>
                );
                const cls = `card card-hover flex items-center gap-4 p-5 ${i === 0 ? "ring-2 ring-[var(--brand-light)]" : ""}`;
                return ext ? (
                  <a key={rec.title} href={rec.url} target="_blank" rel="noopener noreferrer" className={cls}>{inner}</a>
                ) : (
                  <Link key={rec.title} href={rec.url} className={cls}>{inner}</Link>
                );
              })}
            </div>
          </section>
        )}

        <div className="mt-8 grid grid-cols-2 gap-2">
          <button onClick={share} className="h-12 cursor-pointer rounded-xl bg-[var(--surface)] text-sm font-semibold hover:bg-[var(--surface-muted)]">
            친구에게 검사 알려주기
          </button>
          <Link href="/tests" className="flex h-12 items-center justify-center rounded-xl bg-[var(--surface)] text-sm font-semibold hover:bg-[var(--surface-muted)]">
            다른 검사 해보기
          </Link>
        </div>
        <Link href="/my" className="mt-2 flex h-12 items-center justify-center rounded-xl text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)]">
          내 검사 기록 보기
        </Link>

        <p className="mt-8 rounded-2xl bg-[var(--surface)] p-4 text-xs leading-relaxed text-[var(--foreground-muted)]">
          이 결과는 자가 검사로, 의학적 진단을 대신하지 않아요. 걱정되는 점이 있다면 정신건강의학과 전문의나 상담 전문가와 이야기해 보세요.
          힘든 마음이 들 땐 자살예방상담전화 109, 정신건강위기상담 1577-0199(24시간)로 연락할 수 있어요.
          {r.credit && <span className="mt-2 block text-[var(--foreground-subtle)]">출처: {r.credit}</span>}
        </p>
      </div>
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
