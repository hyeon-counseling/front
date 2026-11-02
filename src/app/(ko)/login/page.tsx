"use client";

import { SHOW_COURSES } from "@/lib/site";
import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, type AuthUser } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";
import { SocialLoginButtons, socialErrorMessage } from "@/components/ko/SocialLoginButtons";
import { EXPIRED_MESSAGE, safeNext, saveUnverifiedEmail } from "@/lib/authSession";
import { pendingGiftPath } from "@/lib/gift";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // 돌아갈 주소는 같은 사이트 안의 경로만 (다른 사이트로 빠져나가지 않게)
  const next = safeNext(searchParams.get("next"));
  const oauthError = searchParams.get("error");
  const expired = searchParams.get("expired") === "1";
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(socialErrorMessage(oauthError));
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const r = await apiRequest<{ token: string; user: AuthUser; emailUnverified?: boolean }>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      // 비밀번호까지 맞았는데 이메일 인증 전 — 서버가 토큰을 주지 않으니 안내 화면으로
      if (r.data?.emailUnverified) {
        saveUnverifiedEmail(email.trim().toLowerCase());
        router.push("/auth/verify-needed");
        return;
      }
      if (!r.ok || !r.data) {
        setError(r.message || "로그인에 실패했어요.");
        return;
      }
      const data = r.data;
      login(data.token, data.user);
      // 돌아갈 곳이 따로 없으면, 받으러 온 쿠폰 선물(가입·인증을 거쳐 온 경우)로
      const dest = searchParams.get("next") ? next : pendingGiftPath() ?? next;
      // 추가 정보가 없는 기존 회원은 입력 화면을 먼저 거친다
      router.push(data.user?.profileComplete === false ? `/onboarding?next=${encodeURIComponent(dest)}` : dest);
    } catch (err) {
      setError(err instanceof Error ? err.message : "로그인에 실패했어요.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-10rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <p className="mb-3"><span className="eyebrow">로그인</span></p>
          <h1 className="font-display text-3xl text-[var(--foreground)]">다시 만나서 반가워요</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">{SHOW_COURSES ? "강의·워크북·주문 내역을 이어서 볼 수 있어요." : "심리검사 진행과 검사 기록, 주문 내역을 이어서 볼 수 있어요."}</p>
        </div>

        <div className="card p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-5">
            {expired && !error && <Alert tone="info">{EXPIRED_MESSAGE}</Alert>}
            {error && <Alert>{error}</Alert>}
            <Input id="email" type="email" label="이메일" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required autoComplete="email" />
            <Input id="password" type="password" label="비밀번호" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="비밀번호" required autoComplete="current-password" />
            <Button type="submit" loading={loading} className="w-full" size="lg">
              로그인
            </Button>
            <p className="text-center text-sm">
              <Link href="/forgot-password" className="link-underline text-[var(--foreground-muted)]">
                비밀번호를 잊으셨나요?
              </Link>
            </p>
          </form>

          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--foreground-subtle)]">또는</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          <SocialLoginButtons disabled={loading} />
        </div>

        <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
          아직 계정이 없나요?{" "}
          <Link href="/register" className="font-medium text-[var(--brand)] hover:underline">
            회원가입
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
