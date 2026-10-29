"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { cx } from "@/components/ui";

/**
 * 신청 상세 패널의 일 처리 부분 — 검사 3종(링크 입력·완료 체크) · 장소/화상 링크 · 알림 다시 보내기 · 취소
 * 검사 순서는 MMPI → TCI → SCT (10/29 확정)
 */
export interface TestDetail {
  collected: boolean;
  source: string | null;
  issuedAt: string | null;
  doneAt: string | null;
  doneBy: string | null;
}

const TESTS = [
  { key: "mmpi3", label: "MMPI-3", site: "마음사랑", ph: "https://mtest.kr/?u=…" },
  { key: "tci", label: "TCI", site: "마음사랑", ph: "https://mtest.kr/?u=…" },
  { key: "sct", label: "SCT", site: "인싸이트", ph: "https://www.inpsyt.co.kr/inpsyt/testing/…" },
] as const;

const CODES: [string, string][] = [
  ["N1", "N1 신청 완료"],
  ["N2", "N2 접수면접지 안내"],
  ["N3", "N3 접수면접지 받음"],
  ["N4", "N4 검사 링크"],
  ["N5", "N5 검사 미완료"],
  ["N6", "N6 검사 완료"],
  ["N7", "N7 일정 재조정"],
  ["N8P", "N8-0 장소 확정 (D-3)"],
  ["N8A", "N8-1 하루 전 · 대면"],
  ["N8B", "N8-2 하루 전 · 화상"],
  ["N10", "N10 후기"],
  ["N11", "N11 1주 뒤 마음 체크"],
  ["CANCEL", "취소 요청 접수"],
  ["REFUND", "환불 완료"],
];

const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function TestsBox({ id, tests, onChanged }: { id: string; tests: Record<string, TestDetail>; onChanged: () => void }) {
  const [edit, setEdit] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const saveLink = async (test: string) => {
    setBusy(true);
    setMsg("");
    const r = await apiRequest(`/api/admin/assessment/applications/${id}/link`, { method: "POST", body: JSON.stringify({ test, url }) });
    setBusy(false);
    if (!r.ok) return setMsg(r.message || "저장하지 못했어요.");
    setEdit(null);
    setUrl("");
    onChanged();
  };
  const toggleDone = async (test: string, done: boolean) => {
    setMsg("");
    const r = await apiRequest<{ allDone: boolean }>(`/api/admin/assessment/applications/${id}/done`, { method: "POST", body: JSON.stringify({ test, done }) });
    if (!r.ok) return setMsg(r.message || "저장하지 못했어요.");
    if (r.data?.allDone) setMsg("3종 완료 — 내일 아침 8시에 완료 안내(N6)가 가요.");
    onChanged();
  };

  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">검사 3종</h3>
      <ul className="space-y-2">
        {TESTS.map((t) => {
          const d = tests?.[t.key];
          return (
            <li key={t.key} className="rounded-xl border border-[var(--border-light)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {t.label} <span className="text-xs font-normal text-[var(--foreground-subtle)]">{t.site}</span>
                </p>
                <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={!!d?.doneAt} onChange={(e) => toggleDone(t.key, e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                  완료
                </label>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                {d?.issuedAt ? `발급 ${fmt(d.issuedAt)} · ` : "발급 전 · "}
                {d?.collected ? `링크 모임(${d.source === "gmail" ? "메일" : "직접 입력"})` : "링크 없음"}
                {d?.doneAt && ` · 완료 ${fmt(d.doneAt)}${d.doneBy === "service" ? " (예약 작업)" : d.doneBy === "auto" ? " (메일)" : ""}`}
              </p>
              {edit === t.key ? (
                <div className="mt-2 flex gap-2">
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t.ph} aria-label={`${t.label} 검사 링크`} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] px-2 text-xs" />
                  <button disabled={busy} onClick={() => saveLink(t.key)} className="h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-3 text-xs font-semibold text-white">
                    저장
                  </button>
                  <button onClick={() => setEdit(null)} className="h-9 cursor-pointer rounded-lg px-2 text-xs text-[var(--foreground-subtle)]">
                    취소
                  </button>
                </div>
              ) : (
                <button onClick={() => (setEdit(t.key), setUrl(""))} className="mt-1 cursor-pointer text-xs font-semibold text-[var(--brand)]">
                  {d?.collected ? "링크 바꾸기" : "링크 직접 넣기"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {msg && <p className="mt-2 text-xs text-[var(--brand)]">{msg}</p>}
      <p className="mt-2 text-[11px] text-[var(--foreground-subtle)]">링크는 암호로 바꿔 저장하고, 고객에게는 알림톡의 [MMPI 검사]·[TCI 검사]·[SCT 검사] 버튼으로만 보여요.</p>
    </section>
  );
}

export function PlaceBox({
  id,
  method,
  place,
  videoLink,
  onChanged,
}: {
  id: string;
  method: "offline" | "online";
  place: { name: string; address: string; mapUrl: string } | null;
  videoLink: string | null;
  onChanged: () => void;
}) {
  const [name, setName] = useState(place?.name ?? "");
  const [address, setAddress] = useState(place?.address ?? "");
  const [mapUrl, setMapUrl] = useState(place?.mapUrl ?? "");
  const [video, setVideo] = useState(videoLink ?? "");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    const body = method === "offline" ? { place: { name, address, mapUrl } } : { videoLink: video };
    const r = await apiRequest(`/api/admin/assessment/applications/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setMsg(r.ok ? "저장했어요." : r.message || "저장하지 못했어요.");
    if (r.ok) onChanged();
  };
  const field = "h-9 w-full rounded-lg border border-[var(--border)] px-2 text-sm";
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-[var(--foreground)]">{method === "offline" ? "상담 장소 (3일 전 안내)" : "화상 링크 (하루 전 안내)"}</h3>
      {method === "offline" ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="스터디룸 이름·호실" aria-label="장소 이름" className={field} />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" aria-label="주소" className={field} />
          <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="지도 링크 (선택, https://…)" aria-label="지도 링크" className={field} />
        </div>
      ) : (
        <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://… (줌·구글 미트 등)" aria-label="화상 링크" className={field} />
      )}
      <button onClick={save} className="mt-2 h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-4 text-sm font-semibold text-white">
        저장
      </button>
      {msg && <span className="ml-2 text-xs text-[var(--brand)]">{msg}</span>}
    </section>
  );
}

export function ResendBox({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [code, setCode] = useState("N1");
  const [msg, setMsg] = useState("");
  const send = async () => {
    if (!window.confirm(`${code} 알림을 지금 다시 보낼까요? (고객에게 실제로 가요)`)) return;
    const r = await apiRequest<{ sent: boolean; reason?: string }>(`/api/admin/assessment/applications/${id}/notice`, { method: "POST", body: JSON.stringify({ code }) });
    setMsg(r.ok && r.data?.sent ? "보냈어요." : `보내지 못했어요${r.data?.reason ? ` (${r.data.reason})` : ""}.`);
    onChanged();
  };
  return (
    <div className="mt-3 flex items-center gap-2">
      <select value={code} onChange={(e) => setCode(e.target.value)} aria-label="다시 보낼 알림" className="h-9 rounded-lg border border-[var(--border)] px-2 text-sm">
        {CODES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button onClick={send} className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 text-sm font-semibold">
        다시 보내기
      </button>
      {msg && <span className="text-xs text-[var(--foreground-muted)]">{msg}</span>}
    </div>
  );
}

export interface RefundQuoteView {
  tier: string;
  amount: number;
  paid: number;
  label: string;
  ifStarted: number | null;
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

/**
 * 취소·환불 처리 (52-취소환불규정.md) — 고객 취소 요청이 있으면 맨 위에, 없으면 상담가가 직접 취소할 때.
 * 금액은 규정대로 계산된 값이 기본, 예외(상담가 사정 전액·진행 중단 실비만 공제·시작 여부 확인)는 고쳐서 확정.
 * 실제 돈은 결제 수단에서 상담가가 직접 돌려준다 — 여기서는 기록하고 슬롯을 다시 연다.
 */
export function RefundBox({
  id,
  closed,
  request,
  requestedAt,
  quote,
  refund,
  onChanged,
}: {
  id: string;
  closed: string | null;
  request: { reason: string; quoteAmount: number; quoteTier: string; by: string } | null;
  requestedAt: string | null;
  quote: RefundQuoteView | null;
  refund: { amount: number; note: string; processedAt: string } | null;
  onChanged: () => void;
}) {
  const [amount, setAmount] = useState(quote ? String(quote.amount) : "");
  const [note, setNote] = useState("");
  const [open, setOpen] = useState(!!requestedAt);
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  if (closed) {
    return refund ? (
      <section className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
        <p className="font-bold">{closed === "refunded" ? `환불 완료 처리 · ${won(refund.amount)}` : "취소 완료 (환불 없음)"}</p>
        <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
          {new Date(refund.processedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}
          {refund.note && ` · ${refund.note}`}
        </p>
      </section>
    ) : null;
  }

  const done = async () => {
    const n = Number(amount.replace(/\D/g, "") || 0);
    if (!window.confirm(`${n > 0 ? `${won(n)} 환불 완료로` : "환불 없이 취소로"} 처리할까요? 잡아 둔 상담 시간이 다시 열려요. (실제 환불은 결제 수단에서 직접)`)) return;
    setBusy(true);
    setMsg("");
    const r = await apiRequest(`/api/admin/assessment/applications/${id}/refund`, { method: "POST", body: JSON.stringify({ amount: n, note }) });
    setBusy(false);
    setMsg(r.ok ? "처리했어요." : r.message || "처리하지 못했어요.");
    if (r.ok) onChanged();
  };
  const withdraw = async () => {
    if (!window.confirm("취소 요청을 거두고 진행을 계속할까요? (고객이 마음을 바꾼 경우)")) return;
    const r = await apiRequest(`/api/admin/assessment/applications/${id}/cancel-withdraw`, { method: "POST" });
    setMsg(r.ok ? "거뒀어요. 정기 안내가 다시 나가요." : r.message || "처리하지 못했어요.");
    if (r.ok) onChanged();
  };

  if (!open) {
    return (
      <section className="border-t border-[var(--border-light)] pt-4">
        <button onClick={() => setOpen(true)} className="h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold text-[var(--error)] hover:bg-red-50">
          취소·환불 처리
        </button>
      </section>
    );
  }

  return (
    <section className={cx("rounded-2xl border p-4", requestedAt ? "border-red-200 bg-red-50" : "border-[var(--border-light)]")}>
      <h3 className="text-sm font-bold text-[var(--foreground)]">{requestedAt ? "🧾 취소 요청 처리" : "취소·환불 처리"}</h3>
      {requestedAt && request && (
        <p className="mt-1 text-xs text-[var(--foreground-muted)]">
          {new Date(requestedAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })} {request.by === "customer" ? "고객 요청" : "상담가 등록"} · 요청 때 예상 {won(request.quoteAmount)}
          {request.reason && <span className="mt-1 block text-[var(--foreground)]">사유: {request.reason}</span>}
        </p>
      )}
      {quote && (
        <p className="mt-2 text-xs text-[var(--foreground-muted)]">
          지금 기준: <b className="text-[var(--foreground)]">{won(quote.amount)}</b> · {quote.label}
          {quote.ifStarted !== null && ` (검사를 시작했다면 ${won(quote.ifStarted)})`}
        </p>
      )}
      <div className="mt-3 grid gap-2 sm:grid-cols-[140px_1fr]">
        <input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} inputMode="numeric" aria-label="환불액(원)" placeholder="환불액(원)" className="h-9 rounded-lg border border-[var(--border)] bg-white px-2 text-sm" />
        <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={500} aria-label="메모" placeholder="메모 (예: 상담가 사정 전액, 검사 시작 확인)" className="h-9 rounded-lg border border-[var(--border)] bg-white px-2 text-sm" />
      </div>
      <p className="mt-1 text-[11px] text-[var(--foreground-subtle)]">예외: 상담가 사정 = 새 일정 또는 전액 · 상담가가 진행 중단 = 검사 전 전액 / 시작 후 실비 3만 원만 공제 · 쿠폰 0원 = 환불 없이 취소</p>
      <div className="mt-3 flex flex-wrap gap-2">
        <button onClick={done} disabled={busy} className="h-9 cursor-pointer rounded-lg bg-[var(--error)] px-3 text-sm font-semibold text-white disabled:opacity-60">
          환불 완료 처리
        </button>
        {requestedAt && (
          <button onClick={withdraw} className="h-9 cursor-pointer rounded-lg bg-white px-3 text-sm font-semibold">
            요청 거두기
          </button>
        )}
        {!requestedAt && (
          <button onClick={() => setOpen(false)} className="h-9 cursor-pointer rounded-lg px-3 text-sm text-[var(--foreground-subtle)]">
            닫기
          </button>
        )}
      </div>
      {msg && <p className="mt-2 text-xs text-[var(--brand)]">{msg}</p>}
    </section>
  );
}

/**
 * 결제 전(결제 중·만료) 신청 — 환불할 돈이 없으니 [신청 취소·슬롯 풀기]만.
 * 결제 중은 30분이 지나면 저절로 만료되고 칸이 풀린다.
 */
export function UnpaidBox({ id, payState, onChanged }: { id: string; payState: "paying" | "expired" | "canceled"; onChanged: () => void }) {
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const cancel = async () => {
    if (!window.confirm("결제 전 신청을 취소하고 잡아 둔 상담 시간을 다시 열까요? (고객에게 알림은 가지 않아요)")) return;
    setBusy(true);
    const r = await apiRequest(`/api/admin/assessment/applications/${id}/cancel-unpaid`, { method: "POST" });
    setBusy(false);
    setMsg(r.ok ? "취소하고 상담 시간을 다시 열었어요." : r.message || "처리하지 못했어요.");
    if (r.ok) onChanged();
  };
  return (
    <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm">
      <h3 className="font-bold text-[var(--foreground)]">{payState === "paying" ? "💳 결제 중 — 아직 결제 전이에요" : payState === "expired" ? "⌛ 결제 미완료(만료)" : "결제 전 취소됨"}</h3>
      <p className="mt-1 text-xs text-[var(--foreground-muted)]">
        {payState === "paying"
          ? "고객이 결제 화면에 있거나 나갔어요. 30분 안에는 마이페이지·신청 페이지의 [결제 이어하기]로 마저 결제할 수 있고, 지나면 저절로 만료되고 상담 시간이 다시 열려요."
          : "결제하지 않아 닫힌 신청이에요. 환불할 돈이 없어요. 고객이 다시 신청하면 새 신청으로 들어와요."}
      </p>
      {payState === "paying" && (
        <button onClick={cancel} disabled={busy} className="mt-3 h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-3 text-sm font-semibold text-white disabled:opacity-60">
          신청 취소 · 슬롯 풀기
        </button>
      )}
      {msg && <p className="mt-2 text-xs text-[var(--brand)]">{msg}</p>}
    </section>
  );
}
