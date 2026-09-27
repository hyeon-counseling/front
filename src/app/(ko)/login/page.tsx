"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiFetch } from "@/lib/api";
import { Alert, Button, Input } from "@/components/ui";
import { GoogleIcon } from "@/components/ko/GoogleIcon";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/my";
  const oauthError = searchParams.get("error");
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(oauthError === "google_failed" ? "구글 로그인에 실패했어요. 다시 시도해 주세요." : "");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
      login(data.token, data.user);
      const dest = next.startsWith("/") ? next : "/my";
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
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">강의·워크북·주문 내역을 이어서 볼 수 있어요.</p>
        </div>

        <div className="card p-8 shadow-soft">
          <form onSubmit={handleSubmit} className="space-y-5">
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

          <Button
            type="button"
            variant="secondary"
            size="lg"
            className="w-full bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--surface)]"
            onClick={() => {
              window.location.href = `${process.env.NEXT_PUBLIC_API_URL}/api/auth/google`;
            }}
            disabled={loading}
          >
            <GoogleIcon />
            구글로 계속하기
          </Button>
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
