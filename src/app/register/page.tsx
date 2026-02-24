"use client";

import Link from "next/link";
import { useState } from "react";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // 실제 회원가입 로직은 추후 API 연결 시 구현
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Registration functionality coming soon.");
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-md">
        {/* 헤더 */}
        <div className="mb-8 text-center">
          <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)]">
            Create an Account
          </h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Join Hyeon Counseling to access your purchases anytime
          </p>
        </div>

        {/* 회원가입 폼 */}
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* 이름 */}
            <div>
              <label
                htmlFor="name"
                className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
              >
                Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)]"
              />
            </div>

            {/* 이메일 */}
            <div>
              <label
                htmlFor="email"
                className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
              >
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)]"
              />
            </div>

            {/* 비밀번호 */}
            <div>
              <label
                htmlFor="password"
                className="mb-1.5 block text-sm font-medium text-[var(--foreground)]"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 8 characters, letters and numbers"
                required
                minLength={8}
                className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-sm text-[var(--foreground)] placeholder-[var(--foreground-subtle)] outline-none transition-colors focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)]"
              />
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                At least 8 characters with letters and numbers
              </p>
            </div>

            {/* 제출 버튼 */}
            <button
              type="submit"
              className="w-full rounded-full bg-[var(--brand)] py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Create Account
            </button>
          </form>

          {/* 구분선 */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-[var(--border)]" />
            <span className="text-xs text-[var(--foreground-subtle)]">or</span>
            <div className="h-px flex-1 bg-[var(--border)]" />
          </div>

          {/* 구글 회원가입 버튼 (추후 연결) */}
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-[var(--border)] bg-[var(--background)] py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:bg-[var(--surface)]"
            onClick={() => alert("Google sign-up coming soon.")}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            Continue with Google
          </button>
        </div>

        {/* 로그인 링크 */}
        <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-[var(--brand)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
