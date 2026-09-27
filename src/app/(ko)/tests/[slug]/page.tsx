"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import type { TestDetail } from "@/lib/psychTest";
import { Markdown } from "@/components/workbook/Markdown";
import { COMMON_ORIENTATION, SensitiveConsentText } from "@/components/tests/TestParts";
import { Alert, Skeleton } from "@/components/ui";

type Step = "intro" | "orient" | "quiz";

/**
 * 검사 진행 — 소개 → 오리엔테이션(마음가짐 + 민감정보 동의) → 한 문항씩 → 제출 → 결과
 * 로그인·추가 정보(생년월일·성별)가 없으면 시작할 때 안내한다.
 * 진행 중 응답은 이 브라우저 탭(sessionStorage)에만 잠시 보관한다.
 */
export default function TestTakePage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const { user, loading, updateUser } = useAuth();
  const [test, setTest] = useState<TestDetail | null>(null);
  const [loadError, setLoadError] = useState("");
  const [step, setStep] = useState<Step>("intro");
  const [agree, setAgree] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [idx, setIdx] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const draftKey = `test-draft:${slug}`;

  useEffect(() => {
    apiRequest<TestDetail>(`/api/tests/${slug}`).then((res) => {
      if (!res.ok || !res.data) {
        setLoadError(res.message || "검사를 찾을 수 없어요.");
        return;
      }
      const t = res.data;
      setTest(t);
      // 새로고침해도 이어서 풀 수 있게
      let saved: (number | null)[] | null = null;
      try {
        saved = JSON.parse(sessionStorage.getItem(draftKey) ?? "null");
      } catch {
        saved = null;
      }
      if (Array.isArray(saved) && saved.length === t.questions.length && saved.some((v) => v !== null)) {
        setAnswers(saved);
        setIdx(Math.max(0, saved.findIndex((v) => v === null)));
      } else {
        setAnswers(Array(t.questions.length).fill(null));
      }
    });
  }, [slug, draftKey]);

  const persist = (next: (number | null)[]) => {
    setAnswers(next);
    try {
      sessionStorage.setItem(draftKey, JSON.stringify(next));
    } catch {
      /* 저장소를 못 써도 진행에는 문제없음 */
    }
  };

  /** 시작 전 확인: 로그인 → 추가 정보 → 오리엔테이션 */
  const begin = () => {
    const here = `/tests/${slug}`;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(here)}`);
      return;
    }
    if (user.profileComplete === false || !user.birthDate) {
      router.push(`/onboarding?next=${encodeURIComponent(here)}`);
      return;
    }
    setStep("orient");
    window.scrollTo({ top: 0 });
  };

  const startQuiz = async () => {
    setError("");
    if (!user?.sensitiveAgreed) {
      if (!agree) {
        setError("심리검사 응답 수집·이용에 동의해 주세요.");
        return;
      }
      setBusy(true);
      const res = await apiRequest<{ sensitiveAgreed: boolean }>("/api/auth/me/agreements/sensitive", { method: "POST", body: JSON.stringify({ agree: true }) });
      setBusy(false);
      if (!res.ok) {
        setError(res.message || "동의를 저장하지 못했어요.");
        return;
      }
      updateUser({ sensitiveAgreed: true });
    }
    setStep("quiz");
    window.scrollTo({ top: 0 });
  };

  const submit = useCallback(
    async (final: (number | null)[]) => {
      setBusy(true);
      setError("");
      const res = await apiRequest<{ id: string }>(`/api/tests/${slug}/submit`, { method: "POST", body: JSON.stringify({ answers: final }) });
      if (res.ok && res.data) {
        try {
          sessionStorage.removeItem(draftKey);
        } catch {
          /* 무시 */
        }
        router.push(`/tests/result/${res.data.id}`);
        return;
      }
      setBusy(false);
      const reason = (res.data as unknown as { reason?: string } | null)?.reason;
      if (reason === "profile") router.push(`/onboarding?next=${encodeURIComponent(`/tests/${slug}`)}`);
      else if (reason === "consent") {
        updateUser({ sensitiveAgreed: false });
        setStep("orient");
      }
      setError(res.message || "제출하지 못했어요. 잠시 후 다시 시도해 주세요.");
    },
    [slug, draftKey, router, updateUser]
  );

  const choose = (v: number) => {
    if (!test || busy) return;
    const next = [...answers];
    next[idx] = v;
    persist(next);
    if (idx < test.questions.length - 1) setTimeout(() => setIdx(idx + 1), 180);
    else if (next.every((a) => a !== null)) submit(next);
  };

  if (loadError) {
    return (
      <div className="px-4 py-24 text-center">
        <p className="text-[var(--foreground-muted)]">{loadError}</p>
        <Link href="/tests" className="link-underline mt-4 inline-block text-sm">검사 목록으로</Link>
      </div>
    );
  }
  if (!test || loading) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-16">
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-48" />
      </div>
    );
  }

  // ── 1. 소개 ──
  if (step === "intro") {
    const inProgress = answers.some((a) => a !== null);
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <Link href="/tests" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← 무료 심리검사</Link>
          <div className="mt-6 flex h-16 w-16 items-center justify-center rounded-3xl text-3xl" style={{ background: `${test.color ?? "#3d6b5e"}1a` }}>{test.emoji}</div>
          <h1 className="font-display mt-5 text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">{test.title}</h1>
          {test.engTitle && <p className="mt-1 text-sm text-[var(--foreground-subtle)]">{test.engTitle}</p>}
          <div className="mt-6">
            <Markdown md={test.intro} />
          </div>
          <button onClick={begin} className="mt-8 flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)]">
            {!user ? "로그인하고 시작하기" : inProgress ? "이어서 하기" : "시작하기"}
          </button>
          <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">
            {test.questionCount}문항 · 약 {test.estMinutes}분 · 결과는 나만 볼 수 있어요
          </p>
          {test.credit && <p className="mt-8 text-center text-xs text-[var(--foreground-subtle)]">출처: {test.credit}</p>}
        </div>
      </div>
    );
  }

  // ── 2. 오리엔테이션 ──
  if (step === "orient") {
    return (
      <div className="px-4 py-12 sm:px-6 sm:py-16">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold text-[var(--brand)]">{test.title}</p>
          <h1 className="font-display mt-2 text-3xl text-[var(--foreground)]">시작하기 전에, 잠깐</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">어떤 마음으로 답하면 좋을지 1분만 읽어 주세요.</p>

          <ul className="mt-8 space-y-3">
            {COMMON_ORIENTATION.map((o) => (
              <li key={o.title} className="flex gap-4 rounded-2xl bg-[var(--surface)] p-5">
                <span className="text-xl">{o.icon}</span>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{o.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{o.body}</p>
                </div>
              </li>
            ))}
          </ul>

          {test.orientation && (
            <div className="mt-6 rounded-2xl border border-[var(--brand-light)] bg-[var(--brand-light)]/40 p-5">
              <p className="mb-2 text-sm font-bold text-[var(--brand)]">이 검사는</p>
              <Markdown md={test.orientation} />
            </div>
          )}

          {!user?.sensitiveAgreed && (
            <div className="mt-6 rounded-2xl border border-[var(--border)] p-5">
              <label className="flex cursor-pointer items-start gap-3">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1 h-4 w-4 accent-[var(--brand)]" />
                <span className="text-sm font-semibold text-[var(--foreground)]">[필수] 심리검사 응답(민감정보) 수집·이용에 동의합니다</span>
              </label>
              <div className="mt-3 pl-7">
                <SensitiveConsentText />
              </div>
            </div>
          )}

          {error && <div className="mt-4"><Alert>{error}</Alert></div>}

          <button onClick={startQuiz} disabled={busy} className="mt-8 flex h-14 w-full cursor-pointer items-center justify-center rounded-2xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
            {busy ? "잠시만요…" : "준비됐어요, 시작할게요"}
          </button>
          <button onClick={() => setStep("intro")} className="mt-3 w-full cursor-pointer text-center text-sm text-[var(--foreground-subtle)] hover:text-[var(--foreground)]">
            ← 돌아가기
          </button>
        </div>
      </div>
    );
  }

  // ── 3. 문항 ──
  const total = test.questions.length;
  const answered = answers.filter((a) => a !== null).length;
  const cur = answers[idx];
  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-[var(--brand)]">{test.title}</span>
          <span className="font-semibold text-[var(--foreground-muted)]">{idx + 1} / {total}</span>
        </div>
        <div className="mt-3 h-2 rounded-full bg-[var(--surface-muted)]">
          <div className="h-2 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${(answered / total) * 100}%` }} />
        </div>

        {test.instruction && <p className="mt-8 text-sm text-[var(--foreground-muted)]">{test.instruction}</p>}
        <h2 key={idx} className="rise mt-3 min-h-[4.5rem] text-2xl font-bold leading-snug text-[var(--foreground)] sm:text-[1.7rem]">
          {test.questions[idx]}
        </h2>

        <div className={`mt-8 grid gap-2.5 ${test.answerLabels.length === 2 ? "grid-cols-2" : ""}`}>
          {test.answerLabels.map((label, v) => (
            <button
              key={label}
              onClick={() => choose(v)}
              disabled={busy}
              className={`flex min-h-14 cursor-pointer items-center justify-center rounded-2xl px-5 py-3 text-base font-semibold transition-colors disabled:opacity-60 ${
                cur === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4"><Alert>{error}</Alert></div>}

        <div className="mt-8 flex items-center justify-between">
          <button
            onClick={() => (idx > 0 ? setIdx(idx - 1) : setStep("orient"))}
            className="cursor-pointer text-sm font-semibold text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
          >
            ← 이전
          </button>
          {idx === total - 1 && answered === total ? (
            <button onClick={() => submit(answers)} disabled={busy} className="h-11 cursor-pointer rounded-xl bg-[var(--brand)] px-6 text-sm font-bold text-white disabled:opacity-60">
              {busy ? "결과 계산 중…" : "결과 보기"}
            </button>
          ) : (
            cur !== null && idx < total - 1 && (
              <button onClick={() => setIdx(idx + 1)} className="cursor-pointer text-sm font-semibold text-[var(--brand)]">다음 →</button>
            )
          )}
        </div>
      </div>
    </div>
  );
}
