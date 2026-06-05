"use client";

import { useEffect, useMemo, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Reservation, ReservationStatus, RESERVATION_STATUS_LABEL } from "../../_lib/types";

// 예약 캘린더 — 상담/심리검사 예약을 월별로 조회. 가드는 admin/layout.tsx에서 처리.

const WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
const STATUS_OPTIONS: ReservationStatus[] = ["requested", "confirmed", "in_progress", "completed", "canceled", "no_show"];

function statusColor(status: ReservationStatus): string {
  switch (status) {
    case "confirmed": return "bg-[var(--brand-light)] text-[var(--brand)]";
    case "in_progress": return "bg-blue-100 text-blue-700";
    case "completed": return "bg-gray-100 text-gray-600";
    case "canceled": return "bg-red-50 text-red-600";
    case "no_show": return "bg-orange-100 text-orange-700";
    default: return "bg-yellow-50 text-yellow-700";
  }
}

// Date → datetime-local input 값 (YYYY-MM-DDTHH:mm, 로컬시간)
function toLocalInput(iso?: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CalendarPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() }; // month 0-11
  });

  // 편집 모달
  const [selected, setSelected] = useState<Reservation | null>(null);
  const [editStatus, setEditStatus] = useState<ReservationStatus>("confirmed");
  const [editSchedule, setEditSchedule] = useState("");
  const [editMemo, setEditMemo] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const data = await apiFetch("/api/admin/reservations");
      setReservations(data);
    } catch {
      // 무시
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // 이번 달 날짜별 예약 맵 + 일정 미정 목록
  const { weeks, byDay, undated } = useMemo(() => {
    const byDay = new Map<string, Reservation[]>();
    const undated: Reservation[] = [];
    for (const r of reservations) {
      if (!r.scheduledAt) { undated.push(r); continue; }
      const d = new Date(r.scheduledAt);
      if (d.getFullYear() === cursor.year && d.getMonth() === cursor.month) {
        const key = String(d.getDate());
        const arr = byDay.get(key) ?? [];
        arr.push(r);
        byDay.set(key, arr);
      }
    }
    // 날짜별 시간순 정렬
    for (const arr of byDay.values()) arr.sort((a, b) => new Date(a.scheduledAt!).getTime() - new Date(b.scheduledAt!).getTime());

    // 달력 그리드(주 단위)
    const first = new Date(cursor.year, cursor.month, 1);
    const startDay = first.getDay(); // 0=일
    const daysInMonth = new Date(cursor.year, cursor.month + 1, 0).getDate();
    const cells: (number | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    const weeks: (number | null)[][] = [];
    for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

    return { weeks, byDay, undated };
  }, [reservations, cursor]);

  const openEdit = (r: Reservation) => {
    setSelected(r);
    setEditStatus(r.status);
    setEditSchedule(toLocalInput(r.scheduledAt));
    setEditMemo(r.memo ?? "");
  };

  const closeEdit = () => { setSelected(null); fetchAll(); };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/reservations/${selected._id}`, {
        method: "PUT",
        body: JSON.stringify({
          status: editStatus,
          scheduledAt: editSchedule ? new Date(editSchedule).toISOString() : null,
          memo: editMemo,
        }),
      });
      closeEdit();
    } catch {
      // 무시
    } finally {
      setSaving(false);
    }
  };

  const prevMonth = () => setCursor((c) => c.month === 0 ? { year: c.year - 1, month: 11 } : { year: c.year, month: c.month - 1 });
  const nextMonth = () => setCursor((c) => c.month === 11 ? { year: c.year + 1, month: 0 } : { year: c.year, month: c.month + 1 });

  const today = new Date();
  const isToday = (d: number) => today.getFullYear() === cursor.year && today.getMonth() === cursor.month && today.getDate() === d;

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-semibold text-[var(--foreground)]">예약 캘린더</h1>
        <div className="flex items-center gap-3">
          <button onClick={prevMonth} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface)]">←</button>
          <span className="text-sm font-medium text-[var(--foreground)]">{cursor.year}년 {cursor.month + 1}월</span>
          <button onClick={nextMonth} className="rounded-full border border-[var(--border)] px-3 py-1 text-sm hover:bg-[var(--surface)]">→</button>
        </div>
      </div>

      {loading ? (
        <div className="h-96 animate-pulse rounded-2xl bg-[var(--surface)]" />
      ) : (
        <>
          {/* 달력 그리드 */}
          <div className="overflow-hidden rounded-2xl border border-[var(--border)]">
            <div className="grid grid-cols-7 border-b border-[var(--border)] bg-[var(--surface)]">
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={`px-2 py-2 text-center text-xs font-medium ${i === 0 ? "text-red-500" : i === 6 ? "text-blue-500" : "text-[var(--foreground-subtle)]"}`}>{w}</div>
              ))}
            </div>
            {weeks.map((week, wi) => (
              <div key={wi} className="grid grid-cols-7">
                {week.map((day, di) => (
                  <div key={di} className={`min-h-[92px] border-b border-r border-[var(--border)] p-1.5 ${day === null ? "bg-[var(--surface)]/40" : ""}`}>
                    {day !== null && (
                      <>
                        <div className={`mb-1 text-xs ${isToday(day) ? "font-bold text-[var(--brand)]" : "text-[var(--foreground-subtle)]"}`}>{day}{isToday(day) ? " ·오늘" : ""}</div>
                        <div className="space-y-1">
                          {(byDay.get(String(day)) ?? []).map((r) => (
                            <button key={r._id} onClick={() => openEdit(r)} className={`block w-full truncate rounded px-1.5 py-0.5 text-left text-[11px] ${statusColor(r.status)}`} title={`${r.customerName ?? ""} ${r.productName}`}>
                              {new Date(r.scheduledAt!).toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })} {r.customerName ?? r.productName}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>

          {/* 일정 미정 */}
          {undated.length > 0 && (
            <div className="mt-6">
              <h2 className="mb-2 text-sm font-semibold text-[var(--foreground-subtle)]">일정 미정 ({undated.length})</h2>
              <div className="space-y-2">
                {undated.map((r) => (
                  <button key={r._id} onClick={() => openEdit(r)} className="flex w-full items-center justify-between rounded-xl border border-[var(--border)] px-4 py-2 text-left text-sm hover:bg-[var(--surface)]">
                    <span className="text-[var(--foreground)]">{r.customerName ?? "고객"} · {r.productName}</span>
                    <span className="text-xs text-[var(--foreground-subtle)]">{r.slotLabel ?? "슬롯 없음"} · {RESERVATION_STATUS_LABEL[r.status]}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* 예약 편집 모달 */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={(e) => { if (e.target === e.currentTarget) closeEdit(); }}>
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">{selected.customerName ?? "고객"} · {selected.productName}</h2>
            <p className="mb-4 text-xs text-[var(--foreground-subtle)]">{selected.customerPhone ?? "전화 없음"} · 주문 {selected.externalOrderId}{selected.slotLabel ? ` · 옵션 ${selected.slotLabel}` : ""}</p>

            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--foreground-subtle)]">상태</label>
                <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ReservationStatus)} className="w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--brand)]">
                  {STATUS_OPTIONS.map((s) => <option key={s} value={s}>{RESERVATION_STATUS_LABEL[s]}</option>)}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--foreground-subtle)]">예약 일시</label>
                <input type="datetime-local" value={editSchedule} onChange={(e) => setEditSchedule(e.target.value)} className="w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-[var(--foreground-subtle)]">메모</label>
                <textarea value={editMemo} onChange={(e) => setEditMemo(e.target.value)} rows={2} className="w-full rounded-xl border border-[var(--border)] px-4 py-2 text-sm outline-none focus:border-[var(--brand)]" />
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button onClick={closeEdit} className="rounded-full border border-[var(--border)] px-5 py-2 text-sm text-[var(--foreground-muted)] hover:bg-[var(--surface)]">닫기</button>
              <button onClick={handleSave} disabled={saving} className="rounded-full bg-[var(--brand)] px-5 py-2 text-sm font-medium text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">{saving ? "저장 중..." : "저장"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
