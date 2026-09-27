"use client";

import { useEffect, useState } from "react";
import { GoogleIcon } from "@/components/ko/GoogleIcon";

/**
 * 소셜 로그인 버튼 — 서버에서 켜진 방식만 보여준다(/api/auth/providers).
 * 버튼 색은 각 서비스 디자인 가이드(카카오 노랑 #FEE500 · 네이버 초록 #03C75A · 애플 검정)를 따른다.
 */
type Providers = { google: boolean; kakao: boolean; naver: boolean; apple: boolean };

const API = process.env.NEXT_PUBLIC_API_URL;

/** 로그인 실패 코드 → 안내 문구 */
export const SOCIAL_ERROR: Record<string, string> = {
  google_failed: "구글 로그인에 실패했어요. 다시 시도해 주세요.",
  email_required: "이메일 제공에 동의해야 가입할 수 있어요. 다시 로그인하면서 이메일 항목을 허용해 주세요.",
  email_unverified: "이미 가입된 이메일이에요. 이메일로 로그인한 뒤 이용해 주세요.",
  state_invalid: "로그인 요청이 만료됐어요. 다시 시도해 주세요.",
  cancelled: "로그인을 취소했어요.",
  provider_disabled: "지금은 이 방법으로 로그인할 수 없어요.",
};
export const socialErrorMessage = (code: string | null) => (code ? SOCIAL_ERROR[code] ?? "로그인에 실패했어요. 잠시 후 다시 시도해 주세요." : "");

function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#000" d="M12 3C6.48 3 2 6.58 2 11c0 2.85 1.86 5.35 4.66 6.77-.2.74-.74 2.7-.85 3.12-.13.52.19.51.4.37.17-.11 2.64-1.79 3.71-2.52.68.1 1.38.16 2.08.16 5.52 0 10-3.58 10-8S17.52 3 12 3z" />
    </svg>
  );
}
function NaverIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden>
      <path fill="#fff" d="M16.27 12.84 7.44 0H0v24h7.73V11.16L16.56 24H24V0h-7.73z" />
    </svg>
  );
}
function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden>
      <path fill="#fff" d="M16.37 12.7c-.02-2.3 1.88-3.4 1.96-3.46-1.07-1.56-2.73-1.77-3.32-1.8-1.41-.14-2.76.83-3.47.83-.72 0-1.82-.81-3-.79-1.54.02-2.96.9-3.76 2.28-1.6 2.78-.41 6.9 1.15 9.16.76 1.1 1.67 2.34 2.86 2.3 1.15-.05 1.58-.74 2.97-.74 1.38 0 1.77.74 2.98.72 1.23-.02 2.01-1.12 2.76-2.23.87-1.28 1.23-2.52 1.25-2.58-.03-.01-2.4-.92-2.38-3.65zM14.1 5.95c.63-.77 1.06-1.83.94-2.9-.91.04-2.02.61-2.67 1.37-.58.67-1.09 1.76-.96 2.8 1.02.08 2.06-.52 2.69-1.27z" />
    </svg>
  );
}

export function SocialLoginButtons({ disabled }: { disabled?: boolean }) {
  // 목록을 못 받으면 기존처럼 구글만 보여준다
  const [p, setP] = useState<Providers>({ google: true, kakao: false, naver: false, apple: false });

  useEffect(() => {
    fetch(`${API}/api/auth/providers`)
      .then((r) => r.json())
      .then((b) => b?.success && setP(b.data))
      .catch(() => undefined);
  }, []);

  const go = (path: string) => {
    const origin = encodeURIComponent(window.location.origin);
    window.location.href = `${API}${path}${path.includes("?") ? "&" : "?"}origin=${origin}`;
  };

  const base = "flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-xl text-[0.95rem] font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <div className="space-y-2.5">
      {p.kakao && (
        <button type="button" onClick={() => go("/api/auth/social/kakao")} disabled={disabled} className={`${base} bg-[#FEE500] text-black/85 hover:brightness-95`}>
          <KakaoIcon />
          카카오로 계속하기
        </button>
      )}
      {p.naver && (
        <button type="button" onClick={() => go("/api/auth/social/naver")} disabled={disabled} className={`${base} bg-[#03C75A] text-white hover:brightness-95`}>
          <NaverIcon />
          네이버로 계속하기
        </button>
      )}
      {p.google && (
        <button
          type="button"
          onClick={() => (window.location.href = `${API}/api/auth/google`)}
          disabled={disabled}
          className={`${base} bg-white text-[var(--foreground)] ring-1 ring-[var(--border)] hover:bg-[var(--surface)]`}
        >
          <GoogleIcon />
          구글로 계속하기
        </button>
      )}
      {p.apple && (
        <button type="button" onClick={() => go("/api/auth/social/apple")} disabled={disabled} className={`${base} bg-black text-white hover:bg-black/85`}>
          <AppleIcon />
          Apple로 계속하기
        </button>
      )}
    </div>
  );
}
