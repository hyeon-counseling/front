"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiRequest } from "@/lib/api";
import { Alert, Button } from "@/components/ui";
import { readUnverifiedEmail } from "@/lib/authSession";

// ─────────────────────────────────────────────────────────────────
// 이메일 인증 안내 — 비밀번호까지 맞았는데 인증 전인 계정만 로그인 화면에서 이리로 온다.
// 서버가 토큰을 주지 않으므로 이 화면에서는 인증 메일 다시 받기 말고는 할 수 있는 일이 없다.
// ─────────────────────────────────────────────────────────────────
export default function VerifyNeededPage() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    const saved = readUnverifiedEmail();
    if (!saved) {
      router.replace("/login");
      return;
    }
    setEmail(saved);
  }, [router]);

  // 다시 받기까지 남은 시간
  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait((w) => w - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const resend = async () => {
    if (!email) return;
    setSending(true);
    setError("");
    const r = await apiRequest<{ retryAfterSec?: number }>("/api/auth/resend-verification", { method: "POST", body: JSON.stringify({ email }) });
    setSending(false);
    if (r.ok) {
      setSent(true);
      setWait(60);
      return;
    }
    setSent(false);
    setError(r.message || "메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.");
    // 1분 대기만 숫자로 세고, 하루 횟수를 넘긴 경우는 안내 문구로 충분하다
    const retry = r.data?.retryAfterSec ?? 0;
    if (retry > 0 && retry <= 60) setWait(retry);
  };

  if (!email) return null;

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="card p-8 shadow-soft">
          <h1 className="font-display text-2xl text-[var(--foreground)]">이메일 인증이 아직 안 됐어요</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
            인증 메일의 버튼을 누르면 로그인할 수 있어요. 메일함에서 찾아보고, 안 보이면 스팸함도 확인해 주세요.
          </p>

          <div className="mt-5 rounded-xl bg-[var(--surface)] px-4 py-3">
            <p className="text-xs font-semibold text-[var(--foreground-subtle)]">가입한 이메일</p>
            <p className="mt-0.5 break-all font-semibold text-[var(--foreground)]">{email}</p>
          </div>

          <div className="mt-5 space-y-3">
            {sent && <Alert tone="success">인증 메일을 보냈어요. 가장 최근 메일의 버튼을 눌러 주세요.</Alert>}
            {error && <Alert>{error}</Alert>}
            <Button type="button" size="lg" className="w-full" loading={sending} disabled={wait > 0} onClick={resend}>
              {wait > 0 ? `인증 메일 다시 받기 (${wait}초 뒤)` : "인증 메일 다시 받기"}
            </Button>
          </div>

          <div className="mt-6 flex items-center justify-center gap-4 text-sm">
            <Link href="/login" className="link-underline text-[var(--foreground-muted)]">
              다른 계정으로 로그인
            </Link>
            <Link href="/" className="link-underline text-[var(--foreground-muted)]">
              처음으로
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
