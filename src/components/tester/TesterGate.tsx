"use client";

import { useState } from "react";
import { saveTesterToken, testerRequest } from "@/lib/tester";

/** 초대 링크 본인 확인 — 휴대폰 뒤 4자리. 맞으면 이 기기에 저장(30일)하고 onDone */
export function TesterGate({ inviteKey, nameHint, onDone }: { inviteKey: string; nameHint: string; onDone: () => void }) {
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
    const r = await testerRequest<{ token: string }>(inviteKey, "/verify", { method: "POST", body: JSON.stringify({ last4 }) });
    setBusy(false);
    if (r.ok && r.data?.token) {
      saveTesterToken(inviteKey, r.data.token);
      onDone();
      return;
    }
    setError(r.message || "확인하지 못했어요. 잠시 뒤 다시 해 주세요.");
    setLast4("");
  };

  return (
    <div className="mx-auto max-w-sm px-4 py-20">
      <div className="card p-7 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">본인 확인</h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <b className="text-[var(--foreground)]">{nameHint}</b>님께 보내 드린 안내예요.
          <br />
          안내를 받은 휴대폰 번호 <b>뒤 4자리</b>를 넣어 주세요.
        </p>
        <form onSubmit={submit} className="mt-6">
          <input
            inputMode="numeric"
            autoComplete="one-time-code"
            aria-label="휴대폰 번호 뒤 4자리"
            value={last4}
            onChange={(e) => setLast4(e.target.value.replace(/\D/g, "").slice(0, 4))}
            className="h-14 w-full rounded-xl border border-[var(--border)] text-center text-2xl font-bold tracking-[0.4em] focus:border-[var(--brand)] focus:outline-none"
          />
          {error && <p className="mt-3 text-sm text-[var(--error)]">{error}</p>}
          <button disabled={busy} className="mt-4 h-12 w-full cursor-pointer rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
            {busy ? "확인 중…" : "확인"}
          </button>
        </form>
      </div>
    </div>
  );
}
