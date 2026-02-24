"use client";

/**
 * 비밀번호 재설정 페이지
 *
 * 비밀번호 재설정 이메일의 링크를 클릭하면 이 페이지로 이동:
 *   /reset-password?token=<재설정토큰>
 *
 * 새 비밀번호 입력 → 백엔드 POST /api/auth/reset-password 호출
 */

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";

function ResetPasswordHandler() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // 토큰 없으면 유효하지 않은 링크로 처리
  if (!token) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">Invalid or expired reset link.</p>
          <Link href="/forgot-password" className="text-sm font-medium text-[var(--brand)] hover:underline">
            Request a new link
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("비밀번호는 8자 이상이어야 합니다.");
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/reset-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setSuccess(true);
      } else {
        setError(data.message || "오류가 발생했습니다.");
      }
    } catch {
      setError("서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">Reset Password</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            Enter your new password below
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="mb-2 font-semibold text-[var(--foreground)]">Password updated!</h2>
              <p className="mb-6 text-sm text-[var(--foreground-muted)]">
                Your password has been successfully reset. Please sign in with your new password.
              </p>
              <Link
                href="/login"
                className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                Sign In
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="password"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  New Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  autoComplete="new-password"
                  required
                />
              </div>

              <div>
                <label
                  htmlFor="confirm"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  Confirm Password
                </label>
                <input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Repeat your password"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  autoComplete="new-password"
                  required
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full cursor-pointer rounded-full bg-[var(--brand)] py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? "Updating..." : "Reset Password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>
        </div>
      }
    >
      <ResetPasswordHandler />
    </Suspense>
  );
}
