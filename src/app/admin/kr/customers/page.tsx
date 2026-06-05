"use client";

import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Customer, AdminOrder, Reservation, RESERVATION_STATUS_LABEL } from "../../_lib/types";

// 고객(CRM) 관리 — 한국어 쇼핑몰(카페24). 가드는 admin/layout.tsx에서 처리.
// 카페24 주문이 들어오면 고객이 자동 생성/연결된다(운영 프로필).

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  // 상세 모달
  const [selected, setSelected] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [memo, setMemo] = useState("");
  const [tagsText, setTagsText] = useState("");
  const [kakaoConsent, setKakaoConsent] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fetchList = async (search = "") => {
    try {
      setLoading(true);
      const data = await apiFetch(`/api/admin/customers${search ? `?q=${encodeURIComponent(search)}` : ""}`);
      setCustomers(data);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  const openDetail = async (customer: Customer) => {
    setSelected(customer);
    setMemo(customer.memo ?? "");
    setTagsText((customer.tags ?? []).join(", "));
    setKakaoConsent(customer.kakaoConsent);
    setSaveMsg("");
    setOrders([]);
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/admin/customers/${customer._id}`);
      setSelected(data.customer);
      setOrders(data.orders ?? []);
      setReservations(data.reservations ?? []);
    } catch {
      // 무시
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelected(null);
    setOrders([]);
    fetchList(q);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    setSaveMsg("");
    try {
      const tags = tagsText.split(",").map((t) => t.trim()).filter(Boolean);
      await apiFetch(`/api/admin/customers/${selected._id}`, {
        method: "PUT",
        body: JSON.stringify({ memo, tags, kakaoConsent }),
      });
      setSaveMsg("저장되었습니다.");
    } catch (err) {
      setSaveMsg(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-semibold text-[var(--foreground)]">고객 (CRM)</h1>
          <p className="mt-1 text-xs text-[var(--foreground-subtle)]">카페24 주문 시 자동으로 생성·연결됩니다.</p>
        </div>
        <form
          onSubmit={(e) => { e.preventDefault(); fetchList(q); }}
          className="flex items-center gap-2"
        >
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="이름·이메일·전화 검색"
            className="w-56 rounded-full border border-[var(--border)] bg-[var(--background)] px-4 py-1.5 text-sm outline-none focus:border-[var(--brand)]"
          />
          <button type="submit" className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">검색</button>
        </form>
      </div>

      {loading ? (
        <div className="h-48 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ) : customers.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 text-center">
          <p className="text-sm text-[var(--foreground-muted)]">고객이 없습니다. 카페24 주문이 들어오면 자동으로 추가됩니다.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-[var(--surface)]">
                <tr>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">이름</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">이메일</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">전화</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">태그</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]">등록일</th>
                  <th className="px-5 py-3 text-left font-medium text-[var(--foreground-subtle)]"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border)] bg-[var(--background)]">
                {customers.map((c) => (
                  <tr key={c._id} className="hover:bg-[var(--surface)]">
                    <td className="px-5 py-3 font-medium text-[var(--foreground)]">{c.name || <span className="text-[var(--foreground-subtle)]">—</span>}</td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{c.email || "—"}</td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{c.phone || "—"}</td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{c.tags?.length ? c.tags.join(", ") : "—"}</td>
                    <td className="px-5 py-3 text-[var(--foreground-muted)]">{new Date(c.createdAt).toLocaleDateString()}</td>
                    <td className="px-5 py-3">
                      <button onClick={() => openDetail(c)} className="text-xs text-[var(--brand)] hover:underline">상세</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 고객 상세 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeDetail(); }}>
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-2xl bg-white shadow-xl">
            <div className="flex-shrink-0 border-b border-[var(--border)] px-6 py-5">
              <h2 className="text-lg font-semibold text-[var(--foreground)]">{selected.name || "이름 없음"}</h2>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">{selected.email || "이메일 없음"} · {selected.phone || "전화 없음"}{selected.cafe24MemberId ? ` · 카페24 ${selected.cafe24MemberId}` : ""}</p>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
              {/* 운영 필드 편집 */}
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--foreground-subtle)]">태그 (쉼표 구분)</label>
                  <input type="text" value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="예: 재방문, 상담희망" className="w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--brand)]" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-[var(--foreground-subtle)]">메모</label>
                  <textarea value={memo} onChange={(e) => setMemo(e.target.value)} rows={3} className="w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--brand)]" placeholder="내부 메모" />
                </div>
                <label className="flex items-center gap-2 text-sm text-[var(--foreground-muted)]">
                  <input type="checkbox" checked={kakaoConsent} onChange={(e) => setKakaoConsent(e.target.checked)} />
                  카카오 알림톡 수신 동의
                </label>
                <div className="flex items-center gap-2">
                  <button onClick={handleSave} disabled={saving} className="rounded-full bg-[var(--brand)] px-4 py-1.5 text-xs font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
                  {saveMsg && <span className="text-xs text-[var(--foreground-muted)]">{saveMsg}</span>}
                </div>
              </div>

              {/* 예약 이력 */}
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--foreground)]">예약 이력 (상담·검사)</p>
                {detailLoading ? (
                  <div className="h-12 animate-pulse rounded-xl bg-[var(--surface)]" />
                ) : reservations.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">예약 이력이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {reservations.map((r) => (
                      <div key={r._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--foreground)]">{r.productName}</p>
                          <p className="text-xs text-[var(--foreground-subtle)]">{r.scheduledAt ? new Date(r.scheduledAt).toLocaleString("ko-KR", { dateStyle: "medium", timeStyle: "short" }) : "일정 미정"}</p>
                        </div>
                        <span className="shrink-0 text-xs text-[var(--brand)]">{RESERVATION_STATUS_LABEL[r.status]}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 주문 이력 */}
              <div>
                <p className="mb-2 text-sm font-medium text-[var(--foreground)]">주문 이력</p>
                {detailLoading ? (
                  <div className="h-20 animate-pulse rounded-xl bg-[var(--surface)]" />
                ) : orders.length === 0 ? (
                  <p className="text-xs text-[var(--foreground-subtle)]">주문 이력이 없습니다.</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((o) => (
                      <div key={o._id} className="flex items-center justify-between rounded-xl border border-[var(--border)] px-4 py-2 text-sm">
                        <div className="min-w-0">
                          <p className="truncate font-medium text-[var(--foreground)]">{o.productId?.title ?? "(상품)"}</p>
                          <p className="text-xs text-[var(--foreground-subtle)]">{new Date(o.createdAt).toLocaleDateString()} · {o.channel}</p>
                        </div>
                        <div className="shrink-0 text-right">
                          <p className="text-[var(--foreground-muted)]">{o.currency} {o.amount.toFixed(2)}</p>
                          <span className={`text-xs ${o.status === "paid" ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]"}`}>{o.status}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-shrink-0 flex justify-end border-t border-[var(--border)] px-6 py-4">
              <button onClick={closeDetail} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">닫기</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
