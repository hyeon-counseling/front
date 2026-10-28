"use client";

import { useState } from "react";
import { assessRequest, saveAssessToken } from "@/lib/assessment";

/**
 * 진행 화면 본인 확인 — 알림톡 링크로 들어온 사람에게 휴대폰 뒤 4자리를 한 번 묻는다.
 * 맞으면 확인 토큰을 이 기기에 저장(30일)하고 onDone.
 */
export function VerifyGate({ linkKey, nameHint, onDone }: { linkKey: string; nameHint: string; onDone: () => void }) {
  const [last4, setLast4] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (last4.length !== 4) {
      setError("숫자 4자리를 넣어 주세요.");
      return;
    }
    setBusy(true);
    setError("");
    const r = await assessRequest<{ token: string }>(linkKey, "/verify", { method: "POST", body: JSON.stringify({ last4 }) });
    setBusy(false);
    if (r.ok && r.data?.token) {
      saveAssessToken(linkKey, r.data.token);
      onDone();
      return;
    }
    setError(r.message || "확인하지 못했어요. 잠시 뒤 다시 해 주세요.");
    setLast4("");
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <div className="card p-7 text-center">
        <p className="text-3xl" aria-hidden="true">🔒</p>
        <h1 className="mt-3 text-xl font-bold text-[var(--foreground)]">본인 확인</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <b className="text-[var(--foreground)]">{nameHint}</b>님의 검사 진행 화면이에요.
          <br />
          신청할 때 적은 휴대폰 번호 <b>뒤 4자리</b>를 넣어 주세요.
        </p>
        <form onSubmit={submit} className="mt-6">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="휴대폰 번호 뒤 4자리"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-14 w-full rounded-xl border border-[var(--border)] text-center text-2xl font-bold tracking-[0.5em] focus:border-[var(--brand)] focus:outline-none"
            placeholder="0000"
          />
          {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
          <button disabled={busy} className="mt-4 h-12 w-full cursor-pointer rounded-xl bg-[var(--brand)] font-semibold text-white disabled:opacity-60">
            {busy ? "확인 중…" : "확인"}
          </button>
        </form>
        <p className="mt-4 text-xs text-[var(--foreground-subtle)]">이 기기에서는 30일 동안 다시 묻지 않아요.</p>
      </div>
    </div>
  );
}
