"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui";
import { TesterGate } from "@/components/tester/TesterGate";
import { useAuth } from "@/contexts/AuthContext";
import { clearPendingTester, rememberTester, testerApplyPath, testerRequest, type TesterView } from "@/lib/tester";

/**
 * T2 [신청서 쓰기] (/tester/:key/apply) — 휴대폰 뒤 4자리 확인 → 로그인(없으면 회원가입) → 쿠폰을 그 계정에 붙이고 신청 페이지로.
 * 가입·인증을 거쳐도 돌아오도록 이 기기에 기억하고, 인증 메일 링크에도 돌아올 주소를 싣는다.
 */
export default function TesterApplyPage() {
  const { key } = useParams<{ key: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [view, setView] = useState<TesterView | null>(null);
  const [verify, setVerify] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    void testerRequest<TesterView & { needsVerify?: boolean; nameHint?: string }>(key, "").then((r) => {
      if (r.ok && r.data) {
        setView(r.data);
        setVerify(null);
      } else if (r.status === 403 && r.data?.needsVerify) setVerify(r.data.nameHint ?? "");
      else setError(r.message || "안내를 불러오지 못했어요.");
    });
  }, [key]);

  useEffect(() => {
    rememberTester(key);
    load();
  }, [key, load]);

  // 확인과 로그인이 모두 끝나면 쿠폰을 붙이고 신청 페이지로
  useEffect(() => {
    if (!view || loading || !user) return;
    if (view.withdrawnAt || !view.consent || !view.coupon) return;
    if (view.applied && view.linkKey) {
      clearPendingTester();
      router.replace(`/a/${view.linkKey}`);
      return;
    }
    void testerRequest<{ next: string }>(key, "/claim", { method: "POST" }).then((r) => {
      if (r.ok && r.data?.next) {
        clearPendingTester();
        router.replace(r.data.next);
      } else setError(r.message || "쿠폰을 받지 못했어요. 잠시 뒤 다시 해 주세요.");
    });
  }, [view, user, loading, key, router]);

  if (verify !== null) return <TesterGate inviteKey={key} nameHint={verify} onDone={load} />;

  const box = (title: string, body: React.ReactNode) => (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="card p-7 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{title}</h1>
        {body}
      </div>
    </div>
  );

  if (error) return box("신청 화면을 열지 못했어요", <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">{error}</p>);
  if (!view || loading) return <Skeleton className="mx-auto my-14 h-64 max-w-md" />;
  if (view.withdrawnAt) return box("테스트 중단을 처리했어요", <p className="mt-3 text-sm text-[var(--foreground-muted)]">신청할 수 없어요. 궁금한 점은 카카오톡 채널 「심리상담실 현」으로 물어봐 주세요.</p>);
  if (!view.consent || !view.coupon) {
    return box(
      "동의를 먼저 마쳐 주세요",
      <>
        <p className="mt-3 text-sm text-[var(--foreground-muted)]">쿠폰은 동의를 마치신 분께만 발급돼요.</p>
        <Link href={`/tester/${key}`} className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white">
          안내 읽기
        </Link>
      </>
    );
  }
  if (user) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">신청 페이지로 가고 있어요…</p>;

  const next = encodeURIComponent(testerApplyPath(key));
  return box(
    "로그인하고 신청해 주세요",
    <>
      <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
        {view.coupon.name}은 로그인한 계정에 들어가요. 계정이 없으면 회원가입을 해 주세요. {view.coupon.untilText}까지 쓸 수 있어요.
      </p>
      <div className="mt-6 grid gap-2">
        <Link href={`/login?next=${next}`} className="flex h-12 items-center justify-center rounded-xl bg-[var(--brand)] font-bold text-white hover:bg-[var(--brand-hover)]">
          로그인
        </Link>
        <Link href={`/register?next=${next}`} className="flex h-12 items-center justify-center rounded-xl border border-[var(--border)] font-semibold">
          처음이에요 · 회원가입
        </Link>
      </div>
      <p className="mt-4 text-xs leading-relaxed text-[var(--foreground-subtle)]">중간에 화면을 닫으셨다면 알림톡의 [신청서 쓰기]를 다시 누르면 이어져요.</p>
    </>
  );
}
