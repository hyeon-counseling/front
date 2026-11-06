"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Input, Modal, Skeleton, Toast } from "@/components/ui";
import { METHOD_LABEL, SESSION_STATUS, type CounselingMethod, type CounselingSlot, type SessionStatus } from "@/lib/counseling";
import { kstDateTime } from "@/lib/assessment";

// ─────────────────────────────────────────────────────────────────
// 관리자 · 개인 상담 — 상담권 목록, 세부 신청서, 일정 확정(검사와 같은 일정표), 회기 기록, 연장, 환불
// ─────────────────────────────────────────────────────────────────
interface Row {
  id: string;
  name: string;
  planName: string;
  sessions: number;
  remaining: number;
  scheduled: number;
  status: "active" | "refunded";
  needsIntake: boolean;
  expired: boolean;
  isTester: boolean;
  crisis: boolean;
  paidAt: string | null;
}
interface Session {
  id: string;
  startsAt: string;
  method: CounselingMethod;
  place: string;
  videoLink: string;
  status: SessionStatus;
  counts: boolean;
  cut: number;
  note: string;
}
interface Detail extends Omit<Row, "id"> {
  id: string;
  email: string;
  used: number;
  validUntil: string | null;
  extendedAt: string | null;
  log: Session[];
  refund: { amount: number; reason: string; at: string } | null;
  history: { at: string; by: string; note: string }[];
  order: { externalOrderId: string; amount: number; originalAmount?: number; discountAmount?: number; couponCode?: string | null; provider: string; status: string } | null;
  intake: { method: CounselingMethod; regions: string[]; preferredSlotIds: string[]; topic: string; safety: boolean; submittedAt: string } | null;
  quote: { amount: number; paid: number; used: number; lateCut: number; rule: string };
}

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;
const when = (iso: string) => kstDateTime(iso);
const maskName = (n: string) => (n.length <= 1 ? "*" : n.length === 2 ? `${n[0]}*` : `${n[0]}${"*".repeat(n.length - 2)}${n[n.length - 1]}`);

export default function AdminCounselingPage() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Detail | null>(null);
  const [showIntake, setShowIntake] = useState(false);
  const [slots, setSlots] = useState<CounselingSlot[]>([]);
  const [method, setMethod] = useState<CounselingMethod>("online");
  const [slotId, setSlotId] = useState("");
  const [place, setPlace] = useState("");
  const [videoLink, setVideoLink] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");
  const [extendTo, setExtendTo] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setRows(await apiFetch("/api/admin/counseling/passes?status=all"));
    } catch (err) {
      setRows([]);
      setToast(err instanceof Error ? err.message : "불러오지 못했어요.");
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const refresh = async (id: string) => {
    const d: Detail = await apiFetch(`/api/admin/counseling/passes/${id}`);
    setSelected(d);
    setRefundAmount(String(d.quote.amount));
    return d;
  };

  const open = async (id: string) => {
    setShowIntake(false);
    setSlotId("");
    setPlace("");
    setVideoLink("");
    setRefundReason("");
    setExtendTo("");
    try {
      const d = await refresh(id);
      const m = d.intake?.method ?? "online";
      setMethod(m);
      setSlots(await apiFetch(`/api/admin/counseling/slots?method=${m}`));
    } catch (err) {
      setToast(err instanceof Error ? err.message : "불러오지 못했어요.");
    }
  };

  const changeMethod = async (m: CounselingMethod) => {
    setMethod(m);
    setSlotId("");
    setSlots(await apiFetch(`/api/admin/counseling/slots?method=${m}`));
  };

  const act = async (fn: () => Promise<unknown>, ok: string) => {
    if (!selected) return;
    setSaving(true);
    try {
      await fn();
      await refresh(selected.id);
      setSlots(await apiFetch(`/api/admin/counseling/slots?method=${method}`));
      await load();
      setToast(ok);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "처리하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const post = (path: string, body: unknown, m = "POST") => apiFetch(`/api/admin/counseling/passes/${selected?.id}${path}`, { method: m, body: JSON.stringify(body) });
  const record = (s: Session, status: SessionStatus, extra: Record<string, unknown>, ask: string) => {
    if (!confirm(ask)) return;
    void act(() => post(`/sessions/${s.id}`, { status, ...extra }, "PATCH"), "기록했어요.");
  };
  const preferred = selected?.intake?.preferredSlotIds ?? [];
  const sortedSlots = [...slots].sort((a, b) => Number(preferred.includes(b.id)) - Number(preferred.includes(a.id)));

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--foreground)]">개인 상담</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">시간은 검사와 같은 일정표(공개 슬롯)를 써요. 없는 시간은 공개 슬롯에서 먼저 열어 주세요.</p>

      {rows === null ? (
        <Skeleton className="mt-6 h-48" />
      ) : rows.length === 0 ? (
        <p className="mt-6 rounded-2xl border border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">아직 결제된 상담이 없어요.</p>
      ) : (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-5 py-3">이름</th>
                <th className="px-5 py-3">옵션</th>
                <th className="px-5 py-3">남은 회기</th>
                <th className="px-5 py-3">상태</th>
                <th className="px-5 py-3">결제일</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} onClick={() => open(r.id)} className="cursor-pointer border-t border-[var(--border-light)] hover:bg-[var(--surface)]">
                  <td className="px-5 py-3 font-medium text-[var(--foreground)]">
                    {maskName(r.name)}
                    {r.isTester && <span className="ml-2 text-xs text-[var(--foreground-subtle)]">테스터</span>}
                  </td>
                  <td className="px-5 py-3 text-[var(--foreground-muted)]">{r.planName}</td>
                  <td className="px-5 py-3 text-[var(--foreground-muted)]">
                    {r.remaining} / {r.sessions}
                  </td>
                  <td className="px-5 py-3">
                    {r.crisis && <Badge tone="warning">안전 확인</Badge>} {r.status === "refunded" ? "환불" : r.needsIntake ? "신청서 대기" : r.expired ? "기간 지남" : r.scheduled ? "예약됨" : "일정 대기"}
                  </td>
                  <td className="px-5 py-3 text-[var(--foreground-subtle)]">{r.paidAt ? new Date(r.paidAt).toLocaleDateString("ko-KR") : "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected ? `${selected.name} · ${selected.planName}` : ""} wide>
        {selected && (
          <div className="space-y-6 text-sm">
            <p className="text-[var(--foreground-muted)]">
              {selected.email} · 남은 회기 {selected.remaining}/{selected.sessions}
              {selected.validUntil && ` · ${new Date(selected.validUntil).toLocaleDateString("ko-KR")}까지`}
              {selected.order && ` · 결제 ${won(selected.order.amount)}`}
              {selected.order?.couponCode && ` (쿠폰 ${selected.order.couponCode})`}
              {selected.isTester && " · 테스터"}
            </p>

            <section>
              <h3 className="mb-2 font-bold text-[var(--foreground)]">세부 신청서</h3>
              {!selected.intake ? (
                <p className="text-[var(--foreground-subtle)]">아직 제출하지 않았어요.</p>
              ) : !showIntake ? (
                <Button size="md" variant="secondary" onClick={() => setShowIntake(true)}>
                  신청서 열기
                </Button>
              ) : (
                <div className="space-y-1.5 rounded-xl bg-[var(--surface)] px-4 py-3 text-[var(--foreground-muted)]">
                  <p>방식: {METHOD_LABEL[selected.intake.method]}{selected.intake.regions.length ? ` · ${selected.intake.regions.join(", ")}` : ""}</p>
                  <p className="whitespace-pre-wrap">다루고 싶은 이야기: {selected.intake.topic || "(없음)"}</p>
                  <p className={selected.intake.safety ? "font-bold text-[var(--error)]" : ""}>안전 문항: {selected.intake.safety ? "예 — 먼저 확인해 주세요" : "아니요"}</p>
                </div>
              )}
            </section>

            <section>
              <h3 className="mb-2 font-bold text-[var(--foreground)]">회기</h3>
              {selected.log.length === 0 ? (
                <p className="text-[var(--foreground-subtle)]">아직 일정이 없어요.</p>
              ) : (
                <ul className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)]">
                  {selected.log.map((s) => (
                    <li key={s.id} className="px-4 py-3">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="font-semibold text-[var(--foreground)]">{when(s.startsAt)} · {METHOD_LABEL[s.method]}</span>
                        <span className="text-xs text-[var(--foreground-subtle)]">
                          {SESSION_STATUS[s.status]}
                          {s.status === "no_show" && !s.counts && " (차감 안 함)"}
                          {s.cut > 0 && ` · 차감 ${won(s.cut)}`}
                        </span>
                      </div>
                      {(s.place || s.videoLink) && <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">{s.place || s.videoLink}</p>}
                      {s.status === "scheduled" && (
                        <div className="mt-2 flex flex-wrap gap-2">
                          <Button size="sm" disabled={saving} onClick={() => record(s, "done", {}, "상담 완료로 기록할까요? 1회 사용돼요.")}>상담 완료</Button>
                          <Button size="sm" variant="secondary" disabled={saving} onClick={() => record(s, "no_show", {}, "노쇼로 기록할까요? 1회 사용돼요.")}>노쇼</Button>
                          <Button size="sm" variant="secondary" disabled={saving} onClick={() => record(s, "no_show", { forgive: true }, "처음 한 번의 노쇼로 차감 없이 기록할까요?")}>노쇼(차감 없음)</Button>
                          <Button size="sm" variant="secondary" disabled={saving} onClick={() => record(s, "canceled", {}, "취소로 기록할까요? 지금 시각 기준으로 차감액을 계산하고 시간을 다시 열어요.")}>취소</Button>
                          <Button size="sm" variant="secondary" disabled={saving} onClick={() => record(s, "canceled", { exempt: true }, "차감 없이 취소할까요? (질병·경조사·상담가 사정 등)")}>취소(차감 없음)</Button>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {selected.status === "active" && selected.remaining - selected.scheduled > 0 && (
              <section>
                <h3 className="mb-2 font-bold text-[var(--foreground)]">일정 확정</h3>
                <div className="space-y-3">
                  <div className="flex gap-2">
                    {(["online", "offline"] as const).map((m) => (
                      <Button key={m} size="sm" variant={method === m ? "primary" : "secondary"} onClick={() => changeMethod(m)}>
                        {METHOD_LABEL[m]}
                      </Button>
                    ))}
                  </div>
                  <select value={slotId} onChange={(e) => setSlotId(e.target.value)} className="w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 outline-none">
                    <option value="">시간 고르기 ({slots.length}개 비어 있음)</option>
                    {sortedSlots.map((s) => (
                      <option key={s.id} value={s.id}>
                        {preferred.includes(s.id) ? "★ 희망 · " : ""}
                        {s.text}
                      </option>
                    ))}
                  </select>
                  {method === "offline" ? (
                    <Input id="session-place" label="장소 (3일 전까지 비워 둬도 돼요)" value={place} onChange={(e) => setPlace(e.target.value)} />
                  ) : (
                    <Input id="session-video" label="화상 링크" value={videoLink} onChange={(e) => setVideoLink(e.target.value)} />
                  )}
                  <Button size="md" disabled={saving || !slotId} onClick={() => act(() => post("/sessions", { slotId, method, place, videoLink }), "일정을 확정했어요. 고객에게 카카오톡으로 알려 주세요.")}>
                    이 시간으로 확정
                  </Button>
                </div>
              </section>
            )}

            {selected.status === "active" && selected.validUntil && !selected.extendedAt && (
              <section>
                <h3 className="mb-2 font-bold text-[var(--foreground)]">유효기간 1회 연장</h3>
                <div className="flex flex-wrap items-end gap-2">
                  <Input id="extend-to" type="date" value={extendTo} onChange={(e) => setExtendTo(e.target.value)} />
                  <Button size="md" variant="secondary" disabled={saving || !extendTo} onClick={() => act(() => post("/extend", { validUntil: `${extendTo}T23:59:59+09:00` }), "연장했어요.")}>
                    연장
                  </Button>
                </div>
              </section>
            )}

            {selected.status === "active" ? (
              <section className="border-t border-[var(--border-light)] pt-5">
                <h3 className="mb-1 font-bold text-[var(--foreground)]">환불</h3>
                <p className="mb-3 text-xs text-[var(--foreground-muted)]">
                  계산값 {won(selected.quote.amount)} — {selected.quote.rule} (결제 {won(selected.quote.paid)}, 사용 {selected.quote.used}회{selected.quote.lateCut ? `, 늦은 취소 차감 ${won(selected.quote.lateCut)}` : ""}). 질병·상담가 권유 종결 등은 금액을 고쳐 주세요.
                </p>
                <div className="space-y-3">
                  <Input id="refund-amount" type="number" label="환불 금액 (원)" value={refundAmount} onChange={(e) => setRefundAmount(e.target.value)} />
                  <Input id="refund-reason" label="사유" value={refundReason} onChange={(e) => setRefundReason(e.target.value)} />
                  <Button
                    size="md"
                    variant="danger"
                    disabled={saving || !refundReason.trim()}
                    onClick={() => {
                      if (confirm(`${won(Number(refundAmount))}을 환불하고 상담권을 종료할까요? 되돌릴 수 없어요.`)) void act(() => post("/refund", { amount: Number(refundAmount), reason: refundReason }), "환불했어요.");
                    }}
                  >
                    환불하고 종료
                  </Button>
                </div>
              </section>
            ) : (
              selected.refund && <p className="text-[var(--foreground-muted)]">환불 {won(selected.refund.amount)} · {selected.refund.reason}</p>
            )}

            <details>
              <summary className="cursor-pointer text-xs font-semibold text-[var(--foreground-subtle)]">이력</summary>
              <ul className="mt-2 space-y-1 text-xs text-[var(--foreground-muted)]">
                {selected.history.map((h, i) => (
                  <li key={i}>{new Date(h.at).toLocaleString("ko-KR")} · {h.note}</li>
                ))}
              </ul>
            </details>
          </div>
        )}
      </Modal>
      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
