"use client";

/**
 * 이메일 인증 결과 페이지
 *
 * 회원가입 후 발송된 인증 이메일의 링크를 클릭하면 이 페이지로 이동합니다:
 *   /auth/verify-email?token=<인증토큰>
 *
 * 이 페이지에서:
 *   1. URL에서 token 추출
 *   2. 백엔드 GET /api/auth/verify-email?token=... 호출
 *   3. 성공 / 실패 메시지 표시
 */

import Link from "next/link";
import { Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";

function VerifyEmailHandler() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("유효하지 않은 인증 링크입니다.");
      return;
    }

    const verify = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/auth/verify-email?token=${token}`
        );
        const data = await res.json();

        if (data.success) {
          setStatus("success");
          setMessage(data.message ?? "이메일 인증이 완료되었습니다!");
        } else {
          setStatus("error");
          setMessage(data.message ?? "인증에 실패했습니다.");
        }
      } catch {
        setStatus("error");
        setMessage("서버와 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.");
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="w-full max-w-md text-center">
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" />
              <p className="text-sm text-[var(--foreground-muted)]">Verifying your email...</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-[var(--brand)]">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Email Verified!</h1>
              <p className="mb-6 text-sm text-[var(--foreground-muted)]">{message}</p>
              <Link
                href="/login"
                className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
              >
                Sign In
              </Link>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="mb-2 text-xl font-semibold text-[var(--foreground)]">Verification Failed</h1>
              <p className="mb-6 text-sm text-[var(--foreground-muted)]">{message}</p>
              <div className="flex flex-col gap-3">
                <Link
                  href="/login"
                  className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
                >
                  Go to Login
                </Link>
                <p className="text-xs text-[var(--foreground-subtle)]">
                  Didn&apos;t receive the email?{" "}
                  <Link href="/register" className="text-[var(--brand)] hover:underline">
                    Register again
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
          <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>
        </div>
      }
    >
      <VerifyEmailHandler />
    </Suspense>
  );
}
