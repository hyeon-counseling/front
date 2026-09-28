"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { METHOD_LABEL, ORDER_STATUS_LABEL, won } from "@/lib/payment";
import { Badge, Button, Input, Modal, Skeleton, Toast } from "@/components/ui";

// 관리자 — 사이트 결제(강의·워크북) 주문 · 환불 · 테스트 결제 시뮬레이터
// (카페24·Polar 주문은 Shop 메뉴에서 따로 본다)

type Status = "pending" | "paid" | "failed" | "refunded";
interface OrderRow {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  provider: "mock" | "toss";
  itemType: "course" | "workbook" | "program";
  itemTitle: string;
  amount: number;
  status: Status;
  externalOrderId: string;
  paymentKey: string | null;
  paidAt: string | null;
  failure: { code: string; message: string } | null;
  refund: { amount: number; reason: string; at: string } | null;
  createdAt: string;
}
interface PaymentRow {
  _id: string;
  method: string;
  amount: number;
  approvedAt: string;
  receiptUrl: string | null;
  cancels: { amount: number; reason: string; at: string }[];
}
interface Config {
  provider: "mock" | "toss";
  mockOpen: boolean;
  mockTesters: number;
  tossConfigured: boolean;
}

const TONE: Record<Status, "brand" | "neutral" | "warning" | "error"> = { paid: "brand", pending: "warning", failed: "neutral", refunded: "error" };

export default function AdminPaymentsPage() {
  const [config, setConfig] = useState<Config | null>(null);
  const [rows, setRows] = useState<OrderRow[] | null>(null);
  const [status, setStatus] = useState<Status | "">("");
  const [q, setQ] = useState("");
  const [detail, setDetail] = useState<{ order: OrderRow; payments: PaymentRow[] } | null>(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (status) p.set("status", status);
    if (q.trim()) p.set("q", q.trim());
    apiFetch(`/api/admin/payments?${p}`).then(setRows).catch(() => setRows([]));
  }, [status, q]);

  useEffect(() => {
    apiFetch("/api/admin/payments/config").then(setConfig).catch(() => null);
  }, []);
  useEffect(load, [load]);

  const open = async (o: OrderRow) => {
    setReason("");
    const d = await apiFetch(`/api/admin/payments/${o._id}`);
    setDetail(d);
  };

  const act = async (path: string, body: Record<string, unknown>, msg: string) => {
    if (!detail) return;
    setBusy(true);
    const res = await apiRequest(`/api/admin/payments/${detail.order._id}/${path}`, { method: "POST", body: JSON.stringify(body) });
    setBusy(false);
    setToast(res.ok ? msg : res.message || "처리하지 못했어요.");
    if (res.ok) {
      setDetail(null);
      load();
    }
  };

  const o = detail?.order;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="font-display text-2xl text-[var(--foreground)]">결제·주문</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">강의·과정 결제 내역이에요. 카페24·Polar 주문은 Shop 메뉴에서 볼 수 있어요.</p>

      {config && (
        <div className={`mt-5 rounded-2xl px-5 py-4 text-sm ${config.provider === "mock" ? "bg-amber-50 text-amber-800" : "bg-[var(--brand-light)] text-[var(--brand-ink)]"}`}>
          {config.provider === "mock" ? (
            <>
              <strong>테스트 결제 모드</strong> — 실제 돈이 결제되지 않아요.{" "}
              {config.mockOpen
                ? "모든 회원이 테스트 결제를 할 수 있어요 (MOCK_PAYMENT_OPEN=true)."
                : `관리자와 등록된 테스터 ${config.mockTesters}명만 결제할 수 있어요 (서버 환경변수 MOCK_PAYMENT_TESTERS).`}
            </>
          ) : (
            <>
              <strong>토스페이먼츠</strong> 실제 결제 모드 {config.tossConfigured ? "" : "— ⚠️ 키가 설정되지 않았어요"}
            </>
          )}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-end gap-3">
        <div className="flex gap-1.5">
          {(["", "paid", "pending", "failed", "refunded"] as const).map((s) => (
            <button key={s} onClick={() => setStatus(s)} className={`h-10 cursor-pointer rounded-xl px-3.5 text-sm font-semibold ${status === s ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]"}`}>
              {s ? ORDER_STATUS_LABEL[s] : "전체"}
            </button>
          ))}
        </div>
        <div className="w-full sm:ml-auto sm:w-72">
          <Input id="q" placeholder="주문번호 또는 회원 이메일" value={q} onChange={(e) => setQ(e.target.value)} />
        </div>
      </div>

      <div className="mt-5">
        {rows === null ? (
          <Skeleton className="h-48" />
        ) : rows.length === 0 ? (
          <p className="card p-8 text-center text-sm text-[var(--foreground-muted)]">주문이 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3">주문일시</th>
                  <th className="px-4 py-3">회원</th>
                  <th className="px-4 py-3">상품</th>
                  <th className="px-4 py-3 text-right">금액</th>
                  <th className="px-4 py-3">상태</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} onClick={() => open(r)} className="cursor-pointer border-t border-[var(--border-light)] hover:bg-[var(--surface)]">
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)]">
                      {new Date(r.createdAt).toLocaleString("ko-KR")}
                      <span className="block font-mono text-[var(--foreground-subtle)]">{r.externalOrderId}</span>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.userId?.name ?? "(탈퇴)"}</p>
                      <p className="text-xs text-[var(--foreground-subtle)]">{r.userId?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.itemTitle}</p>
                      <p className="text-xs text-[var(--foreground-subtle)]">{r.itemType === "course" ? "강의" : r.itemType === "program" ? "과정(과목 묶음)" : "워크북 전체 이용권(예전)"}</p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold">{won(r.amount)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge tone={TONE[r.status]}>{ORDER_STATUS_LABEL[r.status]}</Badge>
                        {r.provider === "mock" && <Badge tone="warning">테스트</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="주문 상세">
        {o && detail && (
          <div className="space-y-5 text-sm">
            <dl className="grid grid-cols-[88px_1fr] gap-y-2">
              <dt className="text-[var(--foreground-subtle)]">주문번호</dt>
              <dd className="font-mono">{o.externalOrderId}</dd>
              <dt className="text-[var(--foreground-subtle)]">회원</dt>
              <dd>{o.userId?.name} · {o.userId?.email}</dd>
              <dt className="text-[var(--foreground-subtle)]">상품</dt>
              <dd>{o.itemTitle}</dd>
              <dt className="text-[var(--foreground-subtle)]">금액</dt>
              <dd className="font-bold">{won(o.amount)}</dd>
              <dt className="text-[var(--foreground-subtle)]">상태</dt>
              <dd><Badge tone={TONE[o.status]}>{ORDER_STATUS_LABEL[o.status]}</Badge> {o.provider === "mock" ? "(테스트 결제)" : "(토스)"}</dd>
              {o.failure && (
                <>
                  <dt className="text-[var(--foreground-subtle)]">실패 사유</dt>
                  <dd>{o.failure.message} <span className="text-xs text-[var(--foreground-subtle)]">({o.failure.code})</span></dd>
                </>
              )}
              {o.refund && (
                <>
                  <dt className="text-[var(--foreground-subtle)]">환불</dt>
                  <dd>{won(o.refund.amount)} · {o.refund.reason} · {new Date(o.refund.at).toLocaleString("ko-KR")}</dd>
                </>
              )}
            </dl>

            {detail.payments.length > 0 && (
              <div>
                <p className="mb-2 text-xs font-semibold text-[var(--foreground-subtle)]">결제 기록</p>
                {detail.payments.map((p) => (
                  <div key={p._id} className="rounded-xl bg-[var(--surface)] px-4 py-3">
                    <p>{METHOD_LABEL[p.method] ?? p.method} · {won(p.amount)} · {new Date(p.approvedAt).toLocaleString("ko-KR")}</p>
                    {p.receiptUrl && <a href={p.receiptUrl} target="_blank" rel="noreferrer" className="text-xs text-[var(--brand)] underline">영수증</a>}
                    {p.cancels.map((c, i) => (
                      <p key={i} className="mt-1 text-xs text-[var(--foreground-muted)]">취소 {won(c.amount)} · {c.reason}</p>
                    ))}
                  </div>
                ))}
              </div>
            )}

            {o.status === "paid" && (
              <div className="rounded-2xl border border-[var(--border)] p-4">
                <p className="font-semibold">전액 환불</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">
                  환불하면 이 주문으로 생긴 이용권이 회수되고(무료 체험 기록은 남아요) 회원에게 안내 메일이 가요.
                </p>
                <div className="mt-3 flex gap-2">
                  <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="환불 사유" className="min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 py-2" />
                  <Button variant="danger" loading={busy} disabled={!reason.trim()} onClick={() => confirm(`${won(o.amount)}을 환불할까요?`) && act("refund", { reason }, "환불했어요.")}>
                    환불
                  </Button>
                </div>
              </div>
            )}

            {o.status === "pending" && o.provider === "mock" && (
              <div className="rounded-2xl border border-dashed border-amber-300 p-4">
                <p className="font-semibold">테스트 결제 시뮬레이터</p>
                <p className="mt-1 text-xs text-[var(--foreground-muted)]">결제창을 거치지 않고 이 주문을 완료·실패로 바꿔 봐요. (결제 알림을 받은 것처럼 처리)</p>
                <div className="mt-3 flex gap-2">
                  <Button loading={busy} onClick={() => act("simulate", { result: "paid" }, "결제 완료로 처리했어요.")}>결제 완료로</Button>
                  <Button variant="secondary" loading={busy} onClick={() => act("simulate", { result: "failed" }, "실패로 처리했어요.")}>실패로</Button>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
