"use client";

/**
 * 구글 OAuth 콜백 페이지
 *
 * 구글 로그인 완료 후 백엔드가 이 URL로 리다이렉트합니다:
 *   /auth/callback?token=<JWT토큰>&user=<base64인코딩된사용자정보>
 *
 * 이 페이지에서:
 * 1. URL 파라미터에서 token과 user를 추출
 * 2. user를 base64 디코딩하여 JSON 파싱
 * 3. AuthContext의 login() 함수로 전역 상태에 저장
 * 4. 마이페이지로 이동
 *
 * 주의: useSearchParams()는 Next.js 빌드 시 반드시 Suspense로 감싸야 합니다.
 * 이를 위해 실제 로직을 CallbackHandler 컴포넌트로 분리하고 Suspense로 래핑합니다.
 */

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth, AuthUser } from "@/contexts/AuthContext";

// useSearchParams를 사용하는 실제 로직 컴포넌트 (Suspense 경계 안에서 렌더링)
function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = searchParams.get("token");
    const userParam = searchParams.get("user");

    if (!token || !userParam) {
      setError("로그인 정보를 받지 못했습니다. 다시 시도해 주세요.");
      return;
    }

    try {
      // URL 전송 시 + 가 공백으로 변환되므로 복원 후 디코딩
      // TextDecoder로 한글 등 UTF-8 문자도 안전하게 처리
      const fixedBase64 = userParam.replace(/ /g, '+');
      const bytes = Uint8Array.from(atob(fixedBase64), (c) => c.charCodeAt(0));
      const decoded = new TextDecoder('utf-8').decode(bytes);
      const user = JSON.parse(decoded) as AuthUser;

      // 전역 로그인 상태 + localStorage에 저장
      login(token, user);

      // 마이페이지로 이동
      router.replace("/mypage");
    } catch {
      setError(
        "사용자 정보를 처리하는 중 오류가 발생했습니다. 다시 시도해 주세요."
      );
    }
  }, [searchParams, login, router]);

  if (error) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-10">
            <p className="mb-4 text-sm text-red-600">{error}</p>
            <button
              onClick={() => router.push("/login")}
              className="rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
      <div className="text-center">
        <p className="text-sm text-[var(--foreground-muted)]">
          Signing you in...
        </p>
      </div>
    </div>
  );
}

// 페이지 컴포넌트 — CallbackHandler를 Suspense로 감싸서 useSearchParams 오류 방지
export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4">
          <p className="text-sm text-[var(--foreground-muted)]">Loading...</p>
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
