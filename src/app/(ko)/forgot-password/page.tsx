"use client";

/**
 * 비밀번호 찾기 페이지
 *
 * 이메일 입력 → 백엔드에서 재설정 링크 이메일 발송
 */

import Link from "next/link";
import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("이메일을 입력해 주세요.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/auth/forgot-password`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim() }),
        }
      );
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
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
          <h1 className="text-2xl font-semibold text-[var(--foreground)]">비밀번호 찾기</h1>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            가입한 이메일을 입력하면 재설정 링크를 보내드려요
          </p>
        </div>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8">
          {submitted ? (
            // 전송 완료 상태
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="mb-2 font-semibold text-[var(--foreground)]">메일함을 확인해 주세요</h2>
              <p className="mb-6 text-sm text-[var(--foreground-muted)]">
                <strong>{email}</strong> 계정이 있다면 곧 비밀번호 재설정 링크가 도착해요.
              </p>
              <Link
                href="/login"
                className="text-sm font-medium text-[var(--brand)] hover:underline"
              >
                로그인으로 돌아가기
              </Link>
            </div>
          ) : (
            // 이메일 입력 폼
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label
                  htmlFor="email"
                  className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
                >
                  이메일
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-[var(--border)] bg-[var(--background)] px-4 py-3 text-sm text-[var(--foreground)] outline-none placeholder:text-[var(--foreground-subtle)] focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                  autoComplete="email"
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
                {isLoading ? "보내는 중..." : "재설정 링크 보내기"}
              </button>

              <p className="text-center text-sm text-[var(--foreground-muted)]">
                비밀번호가 기억났나요?{" "}
                <Link href="/login" className="font-medium text-[var(--brand)] hover:underline">
                  로그인
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
