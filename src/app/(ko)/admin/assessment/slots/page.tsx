"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { kstParts } from "@/lib/assessment";
import { Skeleton, cx } from "@/components/ui";

/**
 * 관리자 · 공개 슬롯 (해석 상담 가능 시간)
 *
 * 위: 여러 칸 한꺼번에 열기 — 기간(시작일~종료일) × 요일 × 시간. 미리 보기에서 「○일 동안 ○칸」, 이미 있는 칸은 그대로 둔다.
 * 아래: 보기 세 가지 (마지막으로 본 보기를 기억)
 *   월간 — 날짜마다 상태별 칸 수. 날짜를 누르면 그날 시간대가 펼쳐지고, 여러 날을 끌어 고르면 그 날들 전부 한꺼번에.
 *   주간 — 7일 × 시간대. 칸을 끌면 네모 안의 칸이 골라진다(세로=같은 날 여러 시간, 가로=여러 날 같은 시간).
 *   리스트 — 날짜·시간·상태·예약자(가린 이름), 상태·기간 필터, 체크박스로 고르기.
 * 고른 칸은 한꺼번에 열기·닫기·개인 일정·지우기. 예약됐거나 결제 중인 칸은 고르지도 바꾸지도 않는다 (서버도 같은 규칙).
 * Shift·Ctrl 을 누른 채 끌거나 누르면 더해지고, 고른 칸을 다시 누르면 풀린다. 휴대폰은 길게 누른 뒤 끈다.
 */
interface AdminSlot {
  id: string;
  startsAt: string;
  methods: ("offline" | "online")[];
  regions: string[];
  state: "open" | "held" | "booked" | "closed" | "personal";
  applicationId: string | null;
  counseling?: boolean; // 개인 상담으로 잡힌 칸
  who?: string; // 예약자 가린 이름 (예약·결제 중 칸만)
}
type State = AdminSlot["state"];
type View = "month" | "week" | "list";
type BulkAction = "open" | "closed" | "personal" | "delete";
interface BulkResult {
  changed: number;
  same: number;
  booked: number;
  held: number;
  missing: number;
}
interface OpenPreview {
  count: number;
  existing: number;
  days: number;
  skipped: { at: string; why: string }[];
}

const REGIONS = ["홍대", "강남", "종로", "혜화", "사당"];
// 기본값(10/29 확정): 수·목·금·토·일, 14:00 · 15:30 · 18:00 · 19:30 — 월·화 없음, 대면 5곳 모두
const DEFAULT_TIMES = ["14:00", "15:30", "18:00", "19:30"];
const DEFAULT_DOWS = [3, 4, 5, 6, 0];
const PRESET_TIMES = ["10:00", "11:00", ...DEFAULT_TIMES, "20:00"];
const DOW = ["일", "월", "화", "수", "목", "금", "토"];
const STATES: State[] = ["open", "closed", "personal", "booked", "held"];
const VIEW_KEY = "admin.assessment.slots.view";

const STATE_STYLE: Record<State, string> = {
  open: "bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand-light)]",
  held: "bg-amber-50 text-amber-700 border-amber-200",
  booked: "bg-[var(--brand)] text-white border-[var(--brand)]",
  closed: "bg-[var(--surface)] text-[var(--foreground-subtle)] border-[var(--border-light)] line-through",
  personal: "bg-violet-50 text-violet-700 border-violet-200",
};
const STATE_DOT: Record<State, string> = {
  open: "bg-[var(--brand)]/40",
  held: "bg-amber-400",
  booked: "bg-[var(--brand)]",
  closed: "bg-gray-300",
  personal: "bg-violet-400",
};
const STATE_LABEL: Record<State, string> = { open: "열림", held: "결제 중", booked: "예약됨", closed: "닫힘", personal: "개인 일정" };
const BULK_BUTTON: Record<BulkAction, string> = { open: "열기", closed: "닫기", personal: "개인 일정으로", delete: "지우기" };
const BULK_DONE: Record<BulkAction, string> = { open: "열었어요", closed: "닫았어요", personal: "개인 일정으로 막았어요", delete: "지웠어요" };

const locked = (s: AdminSlot) => s.state === "booked" || s.state === "held";

function kstToday(): string {
  return new Date(Date.now() + 9 * 3600 * 1000).toISOString().slice(0, 10);
}
function addDaysKey(key: string, n: number): string {
  const d = new Date(`${key}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}
function dowOf(key: string): number {
  return new Date(`${key}T00:00:00Z`).getUTCDay();
}
function monthStart(key: string): string {
  return `${key.slice(0, 7)}-01`;
}
function addMonths(key: string, n: number): string {
  const d = new Date(`${monthStart(key)}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + n);
  return d.toISOString().slice(0, 10);
}
const dayText = (key: string) => kstParts(`${key}T03:00:00Z`).dayText;
const methodText = (m: AdminSlot["methods"]) => (m.length === 2 ? "대면·화상" : m[0] === "offline" ? "대면" : "화상");

// 마지막으로 본 보기 — 이 브라우저에 기억 (저장이 막힌 브라우저는 이 화면을 연 동안만)
let memoryView: View = "month";
const viewListeners = new Set<() => void>();
function readView(): View {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "week" || v === "list" || v === "month" ? v : memoryView;
  } catch {
    return memoryView;
  }
}
function writeView(v: View) {
  memoryView = v;
  try {
    localStorage.setItem(VIEW_KEY, v);
  } catch {
    /* 저장이 막힌 브라우저 */
  }
  viewListeners.forEach((f) => f());
}
const subscribeView = (f: () => void) => {
  viewListeners.add(f);
  return () => {
    viewListeners.delete(f);
  };
};

export default function SlotsPage() {
  // 화면을 연 날 기준 (다시 그려도 바뀌지 않게)
  const [today] = useState(kstToday);
  const firstBookable = addDaysKey(today, 14);
  const lastBookable = addDaysKey(today, 42);

  // ── 보기 (마지막으로 본 보기는 이 브라우저에 기억) ──
  const view = useSyncExternalStore(subscribeView, readView, () => "month" as View);
  const [cursor, setCursor] = useState(today); // 월간: 그 달 · 주간: 그 주
  const [listFrom, setListFrom] = useState(today);
  const [listTo, setListTo] = useState(addDaysKey(today, 60));
  const [listStates, setListStates] = useState<State[]>(STATES);

  // 보이는 날짜
  const gridDays = useMemo(() => {
    if (view === "month") {
      const first = monthStart(cursor);
      const start = addDaysKey(first, -dowOf(first));
      return Array.from({ length: 42 }, (_, i) => addDaysKey(start, i));
    }
    if (view === "week") {
      const start = addDaysKey(cursor, -dowOf(cursor));
      return Array.from({ length: 7 }, (_, i) => addDaysKey(start, i));
    }
    return [];
  }, [view, cursor]);
  const rangeFrom = view === "list" ? listFrom : gridDays[0];
  const rangeTo = view === "list" ? listTo : gridDays[gridDays.length - 1];

  // ── 데이터 ──
  const [slots, setSlots] = useState<AdminSlot[] | null>(null);
  const [overview, setOverview] = useState<AdminSlot[] | null>(null); // 오늘~8주 — '열린 칸이 언제까지' 안내용
  const [avail, setAvail] = useState<{ bookable: number; warnBelow: number; low: boolean } | null>(null);
  const load = useCallback(() => {
    if (rangeFrom && rangeTo && rangeTo >= rangeFrom) {
      apiFetch(`/api/admin/assessment/slots?from=${rangeFrom}&to=${rangeTo}`)
        .then(setSlots)
        .catch(() => setSlots([]));
    }
    apiFetch(`/api/admin/assessment/slots?from=${today}&to=${addDaysKey(today, 56)}`)
      .then(setOverview)
      .catch(() => setOverview([]));
    apiRequest<{ bookable: number; warnBelow: number; low: boolean }>("/api/admin/assessment/slots/availability").then((r) => setAvail(r.ok && r.data ? r.data : null));
  }, [rangeFrom, rangeTo, today]);
  useEffect(load, [load]);

  const lastOpen = overview?.filter((s) => s.state === "open").map((s) => kstParts(s.startsAt).dateKey).sort().pop();
  const openUntil = !overview ? undefined : lastOpen && lastOpen >= firstBookable ? lastOpen : null;
  const needsMore = !openUntil || openUntil < addDaysKey(today, 28);

  const byDay = useMemo(() => {
    const m = new Map<string, AdminSlot[]>();
    for (const s of slots ?? []) {
      const k = kstParts(s.startsAt).dateKey;
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots]);

  // ── 고르기 ──
  const [marked, setMarked] = useState<string[]>([]); // 칸 단위
  const [markedDays, setMarkedDays] = useState<string[]>([]); // 날짜 단위 (월간)
  const [lockedHint, setLockedHint] = useState("");
  const [dayOpen, setDayOpen] = useState<string | null>(null); // 월간에서 펼친 날
  const [selected, setSelected] = useState<AdminSlot | null>(null); // 한 칸 고치기 창
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const clearSelection = () => {
    setMarked([]);
    setMarkedDays([]);
    setLockedHint("");
  };
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const setView = (v: View) => {
    writeView(v);
    clearSelection();
  };
  const moveCursor = (next: string) => {
    setCursor(next);
    setDayOpen(null);
    clearSelection();
  };

  // 날짜로 고른 경우 → 그 날들의 칸 (예약·결제 중 칸은 빼고 수만 센다)
  const dayPick = useMemo(() => {
    const ids: string[] = [];
    let skip = 0;
    for (const k of markedDays)
      for (const s of byDay.get(k) ?? []) {
        if (locked(s)) skip++;
        else ids.push(s.id);
      }
    return { ids, skip };
  }, [markedDays, byDay]);
  const targetIds = markedDays.length ? dayPick.ids : marked;

  const bulk = async (action: BulkAction) => {
    if (!targetIds.length) return;
    const what = markedDays.length ? `선택한 ${markedDays.length}일의 ${targetIds.length}칸` : `선택한 ${targetIds.length}칸`;
    if (action === "delete" && !window.confirm(`${what}을 지울까요? 지운 칸은 되돌릴 수 없어요. (예약됐거나 결제 중인 칸은 지우지 않아요)`)) return;
    setBusy(true);
    setNotice("");
    const r = await apiRequest<BulkResult>("/api/admin/assessment/slots/bulk", { method: "POST", body: JSON.stringify({ ids: targetIds, action }) });
    setBusy(false);
    if (r.ok && r.data) {
      const d = r.data;
      const booked = d.booked + (markedDays.length ? dayPick.skip : 0);
      const skip = [booked && `예약·결제 중인 ${booked}칸`, d.held && `결제 중인 ${d.held}칸`, d.missing && `그새 바뀐 ${d.missing}칸`].filter(Boolean).join(", ");
      setNotice(`${d.changed}칸을 ${BULK_DONE[action]}.${d.same ? ` (이미 그 상태였던 ${d.same}칸)` : ""}${skip ? ` ${skip}은 건너뛰었어요.` : ""}`);
      clearSelection();
    } else setNotice(r.message || "바꾸지 못했어요.");
    load();
  };

  // 한 칸 고치기 (창)
  const act = async (s: AdminSlot, what: "open" | "closed" | "delete") => {
    setNotice("");
    const r =
      what === "delete"
        ? await apiRequest(`/api/admin/assessment/slots/${s.id}`, { method: "DELETE" })
        : await apiRequest(`/api/admin/assessment/slots/${s.id}`, { method: "PATCH", body: JSON.stringify({ state: what }) });
    if (!r.ok) setNotice(r.message || "바꾸지 못했어요.");
    setSelected(null);
    load();
  };
  const personal = async (ids: string[], action: "block" | "open") => {
    setBusy(true);
    setNotice("");
    const r = await apiRequest<{ changed: number; skipped: number }>("/api/admin/assessment/slots/personal", { method: "POST", body: JSON.stringify({ ids, action }) });
    setBusy(false);
    if (r.ok && r.data) setNotice(`${r.data.changed}칸을 ${action === "block" ? "개인 일정으로 막았어요" : "다시 열었어요"}.${r.data.skipped ? ` ${r.data.skipped}칸은 건너뛰었어요.` : ""}`);
    else setNotice(r.message || "바꾸지 못했어요.");
    setSelected(null);
    load();
  };

  // ── 끌어서 고르기 ──
  // 칸: 보이는 날짜(주간 7일, 월간에서 펼친 날)의 몇째 줄·몇째 칸·시각으로 네모 / 날짜: 월간 칸의 줄·칸으로 네모
  const slotDays = useMemo(() => (view === "week" ? gridDays : view === "month" && dayOpen ? [dayOpen] : []), [view, gridDays, dayOpen]);
  const slotPos = useMemo(() => {
    const idx = new Map(slotDays.map((k, i) => [k, i]));
    const m = new Map<string, { i: number; t: string; locked: boolean }>();
    for (const s of slots ?? []) {
      const p = kstParts(s.startsAt);
      const i = idx.get(p.dateKey);
      if (i !== undefined) m.set(s.id, { i, t: p.hhmm, locked: locked(s) });
    }
    return m;
  }, [slots, slotDays]);

  const rectSlots = (from: string, to: string, base: string[]) => {
    const a = slotPos.get(from);
    const b = slotPos.get(to);
    if (!a || !b) return;
    const [r1, r2] = [Math.floor(a.i / 7), Math.floor(b.i / 7)].sort((x, y) => x - y);
    const [c1, c2] = [a.i % 7, b.i % 7].sort((x, y) => x - y);
    const [t1, t2] = [a.t, b.t].sort();
    const inside: string[] = [];
    let skip = 0;
    for (const [id, p] of slotPos) {
      const r = Math.floor(p.i / 7);
      const c = p.i % 7;
      if (r < r1 || r > r2 || c < c1 || c > c2 || p.t < t1 || p.t > t2) continue;
      if (p.locked) skip++;
      else inside.push(id);
    }
    setMarkedDays([]);
    setMarked([...new Set([...base, ...inside])]);
    setLockedHint(skip ? `예약됐거나 결제 중인 ${skip}칸은 고르지 않았어요.` : "");
  };
  const rectDays = (from: string, to: string, base: string[]) => {
    const a = gridDays.indexOf(from);
    const b = gridDays.indexOf(to);
    if (a < 0 || b < 0) return;
    const [r1, r2] = [Math.floor(a / 7), Math.floor(b / 7)].sort((x, y) => x - y);
    const [c1, c2] = [a % 7, b % 7].sort((x, y) => x - y);
    const inside = gridDays.filter((_, i) => Math.floor(i / 7) >= r1 && Math.floor(i / 7) <= r2 && i % 7 >= c1 && i % 7 <= c2);
    setMarked([]);
    setMarkedDays([...new Set([...base, ...inside])]);
    setLockedHint("");
  };

  type Drag = { kind: "slot" | "day"; anchor: string; base: string[]; moved: boolean; touch: boolean; armed: boolean; x: number; y: number; timer: number | null };
  const drag = useRef<Drag | null>(null);
  const suppressClick = useRef(false);
  const muteNextClick = () => {
    suppressClick.current = true;
    window.setTimeout(() => (suppressClick.current = false), 0);
  };

  const startDrag = (e: React.PointerEvent, kind: "slot" | "day") => {
    const attr = kind === "slot" ? "data-slot-id" : "data-day";
    const anchor = (e.target as HTMLElement).closest<HTMLElement>(`[${attr}]`)?.getAttribute(attr);
    if (!anchor || e.button !== 0) return;
    const touch = e.pointerType !== "mouse";
    if (!touch) e.preventDefault(); // 끌 때 글자가 선택되지 않게 (클릭은 그대로)
    const keep = e.shiftKey || e.ctrlKey || e.metaKey;
    const st: Drag = { kind, anchor, base: keep ? (kind === "slot" ? marked : markedDays) : [], moved: false, touch, armed: !touch, x: e.clientX, y: e.clientY, timer: null };
    // 휴대폰·태블릿: 길게(0.45초) 누른 뒤 끌기 — 그 전에 움직이면 화면 넘기기로 본다
    if (touch)
      st.timer = window.setTimeout(() => {
        if (drag.current === st) {
          st.armed = true;
          navigator.vibrate?.(15);
        }
      }, 450);
    drag.current = st;
    const over = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>(`[${attr}]`)?.getAttribute(attr) ?? null;
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.armed) {
        if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 8) end();
        return;
      }
      const id = over(ev.clientX, ev.clientY);
      if (!id || (!d.moved && id === d.anchor)) return;
      d.moved = true;
      setSelected(null);
      if (d.kind === "slot") rectSlots(d.anchor, id, d.base);
      else rectDays(d.anchor, id, d.base);
    };
    const block = (ev: TouchEvent) => {
      if (drag.current?.armed) ev.preventDefault(); // 길게 누른 뒤에는 화면이 움직이지 않게
    };
    const end = () => {
      const d = drag.current;
      if (d?.timer) clearTimeout(d.timer);
      if (d?.moved) muteNextClick();
      else if (d?.touch && d.armed) {
        // 길게 누르기만 하고 놓음 → 그 칸(날) 하나 고르기
        if (d.kind === "slot") {
          if (!slotPos.get(d.anchor)?.locked) {
            setMarkedDays([]);
            setMarked((x) => toggle(x, d.anchor));
          }
        } else {
          setMarked([]);
          setMarkedDays((x) => toggle(x, d.anchor));
        }
        muteNextClick();
      }
      drag.current = null;
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      window.removeEventListener("touchmove", block);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
    if (touch) window.addEventListener("touchmove", block, { passive: false });
  };

  // 칸 누르기: 고르는 중이거나 Shift·Ctrl 이면 고르기/풀기, 아니면 한 칸 고치기 창
  const onSlotClick = (s: AdminSlot, e: React.MouseEvent) => {
    if (suppressClick.current) return;
    if (marked.length || e.shiftKey || e.ctrlKey || e.metaKey) {
      if (locked(s)) return;
      setMarkedDays([]);
      setMarked((x) => toggle(x, s.id));
      return;
    }
    if (s.state === "held" && s.applicationId) window.location.assign(`/admin/assessment/applications?id=${s.applicationId}`);
    else setSelected(s);
  };
  const onDayClick = (k: string, e: React.MouseEvent) => {
    if (suppressClick.current) return;
    if (markedDays.length || e.shiftKey || e.ctrlKey || e.metaKey) {
      setMarked([]);
      setMarkedDays((x) => toggle(x, k));
      return;
    }
    setDayOpen((d) => (d === k ? null : k));
    setMarked([]);
  };

  const slotButton = (s: AdminSlot, wide = false) => (
    <button
      key={s.id}
      type="button"
      data-slot-id={s.id}
      aria-pressed={marked.includes(s.id)}
      aria-disabled={marked.length && locked(s) ? true : undefined}
      onClick={(e) => onSlotClick(s, e)}
      style={{ WebkitTouchCallout: "none" }}
      title={`${s.counseling ? "개인 상담 " : ""}${STATE_LABEL[s.state]} · ${methodText(s.methods)}${s.who ? ` · ${s.who}` : ""}`}
      className={cx(
        "block w-full cursor-pointer rounded-md border px-1.5 text-left font-semibold",
        wide ? "py-1.5 text-sm" : "py-0.5 text-[11px]",
        STATE_STYLE[s.state],
        marked.length > 0 && locked(s) && "cursor-not-allowed opacity-50",
        marked.includes(s.id) && "ring-2 ring-violet-600 ring-offset-1"
      )}
    >
      {kstParts(s.startsAt).hhmm}
      <span className="ml-1 font-normal opacity-70">{s.methods.length === 2 ? "" : s.methods[0] === "offline" ? "대면" : "화상"}</span>
      {wide && (
        <span className="ml-2 font-normal opacity-80">
          {STATE_LABEL[s.state]}
          {s.who ? ` · ${s.who}` : ""}
        </span>
      )}
    </button>
  );

  // ── 여러 칸 한꺼번에 열기 (기간 × 요일 × 시간) ──
  const [openFrom, setOpenFrom] = useState(firstBookable);
  const [openTo, setOpenTo] = useState(lastBookable);
  const [dows, setDows] = useState<number[]>(DEFAULT_DOWS);
  const [times, setTimes] = useState<string[]>(DEFAULT_TIMES);
  const [custom, setCustom] = useState("");
  const [methods, setMethods] = useState<("offline" | "online")[]>(["offline", "online"]);
  const [regions, setRegions] = useState<string[]>([...REGIONS]);
  const [preview, setPreview] = useState<OpenPreview | null>(null);
  const [openMsg, setOpenMsg] = useState("");
  const openBody = () => ({ from: openFrom, to: openTo, dows: [...dows].sort(), times: [...times].sort(), methods, regions: methods.includes("offline") ? regions : [] });
  const resetPreview = () => setPreview(null);
  const doPreview = async () => {
    setOpenMsg("");
    const r = await apiRequest<OpenPreview>("/api/admin/assessment/slots", { method: "POST", body: JSON.stringify({ ...openBody(), dryRun: true }) });
    if (r.ok && r.data) setPreview(r.data);
    else setOpenMsg(r.message || "미리 보기를 하지 못했어요.");
  };
  const doOpen = async () => {
    setBusy(true);
    setOpenMsg("");
    const r = await apiRequest<{ created: number; existed: number; days: number }>("/api/admin/assessment/slots", { method: "POST", body: JSON.stringify(openBody()) });
    setBusy(false);
    if (r.ok && r.data) {
      setOpenMsg(`${r.data.days}일 동안 ${r.data.created}칸을 열었어요.${r.data.existed ? ` 이미 있던 ${r.data.existed}칸은 그대로 뒀어요.` : ""}`);
      setPreview(null);
      load();
    } else setOpenMsg(r.message || "열지 못했어요.");
  };

  // ── 리스트 ──
  const listRows = useMemo(() => (slots ?? []).filter((s) => listStates.includes(s.state)), [slots, listStates]);
  const listSelectable = listRows.filter((s) => !locked(s));
  const allChecked = listSelectable.length > 0 && listSelectable.every((s) => marked.includes(s.id));

  const pickCount = targetIds.length;
  const pickLabel = markedDays.length ? `선택한 ${markedDays.length}일(${pickCount}칸)` : `선택한 ${pickCount}칸`;
  const dayHint = markedDays.length && dayPick.skip ? `예약됐거나 결제 중인 ${dayPick.skip}칸은 빼고 바꿔요.` : "";

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">공개 슬롯</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        고객은 결제일 14일 뒤부터 6주까지 열린 칸만 고를 수 있어요 (오늘 신청하면 {dayText(firstBookable)}부터 {dayText(lastBookable)}까지). 월·수·금 오전은 열리지 않아요.
      </p>
      {openUntil !== undefined && (
        <p className={cx("mt-3 rounded-xl px-4 py-3 text-sm", needsMore ? "bg-amber-50 font-semibold text-amber-800" : "bg-[var(--surface)] text-[var(--foreground-muted)]")}>
          {openUntil ? <>열린 칸은 {dayText(openUntil)}까지 있어요. {dayText(addDaysKey(openUntil, -13))}부터 신청하는 분은 고를 칸이 없어요. </> : <>고객이 고를 수 있는 열린 칸이 없어요. </>}
          늘 오늘부터 6주 뒤까지 열어 두고, 일주일에 한 번 다음 한 주를 더 열어 주세요.
        </p>
      )}
      {avail?.low && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          오늘 신청하는 분이 고를 수 있는 칸이 {avail.bookable}칸이에요. {avail.warnBelow}칸보다 적으면 상품을 바로 사기 어려워 보일 수 있어요. 칸을 더 열거나 막은 칸을 다시 열어 주세요.
        </p>
      )}

      {/* 여러 칸 한꺼번에 열기 */}
      <section className="card mt-6 space-y-5 p-5">
        <h2 className="font-bold text-[var(--foreground)]">여러 칸 한꺼번에 열기</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold">1. 기간</p>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <input type="date" value={openFrom} min={today} onChange={(e) => (setOpenFrom(e.target.value), resetPreview())} className="h-9 rounded-lg border border-[var(--border)] px-2" aria-label="시작일" />
              <span>~</span>
              <input type="date" value={openTo} min={openFrom} onChange={(e) => (setOpenTo(e.target.value), resetPreview())} className="h-9 rounded-lg border border-[var(--border)] px-2" aria-label="종료일" />
              <button type="button" onClick={() => (setOpenFrom(firstBookable), setOpenTo(lastBookable), resetPreview())} className="h-8 cursor-pointer rounded-lg bg-[var(--brand-light)] px-3 text-xs font-semibold text-[var(--brand)]">
                고객이 고르는 기간 (14일 뒤~6주)
              </button>
            </div>
            <p className="mt-1 text-xs text-[var(--foreground-subtle)]">더 먼 날도 미리 열 수 있어요 (한 번에 1년, 600칸까지).</p>
          </div>
          <div>
            <p className="mb-2 text-sm font-semibold">2. 요일</p>
            <div className="flex flex-wrap gap-1.5">
              {DOW.map((d, i) => (
                <button key={d} type="button" onClick={() => (setDows((x) => toggle(x, i)), resetPreview())} aria-pressed={dows.includes(i)} className={cx("h-9 w-9 cursor-pointer rounded-lg text-sm font-semibold", dows.includes(i) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <div>
          <p className="mb-2 text-sm font-semibold">3. 시간</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...PRESET_TIMES, ...times])].sort().map((t) => (
              <button key={t} type="button" onClick={() => (setTimes((x) => toggle(x, t)), resetPreview())} className={cx("h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold", times.includes(t) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                {t}
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (/^([01]\d|2[0-3]):[0-5]\d$/.test(custom)) {
                  setTimes((x) => [...new Set([...x, custom])]);
                  setCustom("");
                  resetPreview();
                }
              }}
              className="flex gap-1"
            >
              <input value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="13:30" className="h-9 w-20 rounded-lg border border-[var(--border)] px-2 text-sm" aria-label="직접 시간 넣기" />
              <button className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-2 text-sm">추가</button>
            </form>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className="mb-2 text-sm font-semibold">4. 상담 방식</p>
            <div className="flex gap-2">
              {([["offline", "대면"], ["online", "화상"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => (setMethods((x) => toggle(x, v)), resetPreview())} className={cx("h-9 cursor-pointer rounded-lg px-4 text-sm font-semibold", methods.includes(v) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          {methods.includes("offline") && (
            <div>
              <p className="mb-2 text-sm font-semibold">대면 가능 지역</p>
              <div className="flex flex-wrap gap-2">
                {REGIONS.map((r) => (
                  <button key={r} type="button" onClick={() => (setRegions((x) => toggle(x, r)), resetPreview())} className={cx("h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold", regions.includes(r) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={!openFrom || !openTo || !dows.length || !times.length} onClick={doPreview} className="h-10 cursor-pointer rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold disabled:opacity-40">
            미리 보기
          </button>
          {preview && (
            <>
              <span className="text-sm">
                <b>
                  {preview.days}일 동안 {preview.count}칸
                </b>
                이 열려요
                {preview.existing > 0 && <span className="text-[var(--foreground-subtle)]"> · 이미 있는 {preview.existing}칸은 그대로 둬요</span>}
                {preview.skipped.length > 0 && <span className="text-[var(--foreground-subtle)]"> · 빠짐 {preview.skipped.length}칸 ({[...new Set(preview.skipped.map((s) => s.why))].join(", ")})</span>}
              </span>
              <button disabled={busy || !preview.count} onClick={doOpen} className="h-10 cursor-pointer rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white disabled:opacity-40">
                {busy ? "여는 중…" : `${preview.count}칸 열기`}
              </button>
            </>
          )}
        </div>
        {openMsg && <p className="text-sm text-[var(--brand)]">{openMsg}</p>}
      </section>

      {/* 보기 */}
      <section className="mt-6">
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <div className="flex rounded-xl bg-[var(--surface)] p-1" role="tablist" aria-label="보기">
            {(
              [
                ["month", "월간"],
                ["week", "주간"],
                ["list", "리스트"],
              ] as const
            ).map(([v, l]) => (
              <button key={v} role="tab" aria-selected={view === v} onClick={() => setView(v)} className={cx("h-8 cursor-pointer rounded-lg px-3 text-sm font-semibold", view === v ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)]")}>
                {l}
              </button>
            ))}
          </div>
          {view !== "list" && (
            <div className="flex items-center gap-1">
              <button onClick={() => moveCursor(view === "month" ? addMonths(cursor, -1) : addDaysKey(cursor, -7))} className="h-8 w-8 cursor-pointer rounded-lg bg-[var(--surface)] font-bold" aria-label={view === "month" ? "이전 달" : "이전 주"}>
                ‹
              </button>
              <span className="min-w-[8.5rem] text-center text-sm font-bold">{view === "month" ? `${cursor.slice(0, 4)}년 ${Number(cursor.slice(5, 7))}월` : `${dayText(gridDays[0])} ~ ${dayText(gridDays[6])}`}</span>
              <button onClick={() => moveCursor(view === "month" ? addMonths(cursor, 1) : addDaysKey(cursor, 7))} className="h-8 w-8 cursor-pointer rounded-lg bg-[var(--surface)] font-bold" aria-label={view === "month" ? "다음 달" : "다음 주"}>
                ›
              </button>
              <button onClick={() => moveCursor(today)} className="h-8 cursor-pointer rounded-lg bg-[var(--surface)] px-3 text-sm font-semibold">
                오늘
              </button>
            </div>
          )}
          <div className="ml-auto flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
            {STATES.map((s) => (
              <span key={s} className="flex items-center gap-1">
                <span className={cx("h-2.5 w-2.5 rounded-full", STATE_DOT[s])} /> {STATE_LABEL[s]}
              </span>
            ))}
          </div>
        </div>

        {/* 고른 칸 한꺼번에 */}
        {(pickCount > 0 || markedDays.length > 0) && (
          <div className="sticky top-2 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm">
            <span className="font-semibold text-violet-800">{pickLabel}</span>
            {(["open", "closed", "personal", "delete"] as const).map((a) => (
              <button
                key={a}
                disabled={busy || !pickCount}
                onClick={() => bulk(a)}
                className={cx(
                  "h-9 cursor-pointer rounded-lg px-3 font-semibold disabled:opacity-40",
                  a === "personal" ? "bg-violet-600 text-white" : a === "delete" ? "bg-white text-[var(--error)]" : a === "open" ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--foreground)]"
                )}
              >
                {`${pickLabel} ${BULK_BUTTON[a]}`}
              </button>
            ))}
            <button onClick={clearSelection} className="cursor-pointer text-[var(--foreground-subtle)] underline underline-offset-2">
              고르기 취소
            </button>
            {(lockedHint || dayHint) && <span className="w-full text-xs font-semibold text-amber-800">{lockedHint || dayHint}</span>}
          </div>
        )}
        {notice && <p className="mb-2 text-sm text-[var(--brand)]">{notice}</p>}
        <p className="mb-2 text-xs text-[var(--foreground-subtle)]">
          {view === "month"
            ? "날짜를 누르면 그날 시간이 펼쳐져요. 여러 날을 끌면 그 날들이 골라져요(Shift·Ctrl+누르기로 더하기)."
            : view === "week"
              ? "칸을 누르면 고칠 수 있어요. 칸을 끌면 네모 안 칸이 골라져요 — 세로: 같은 날 여러 시간 · 가로: 여러 날 같은 시간. Shift·Ctrl로 더하기, 고른 칸을 다시 누르면 풀려요."
              : "체크박스로 여러 줄을 골라 한꺼번에 바꿔요. 시간을 누르면 그 칸 하나를 고칠 수 있어요."}{" "}
          휴대폰은 길게 누른 뒤 끌어요. 예약됐거나 결제 중인 칸은 고르지도 바꾸지도 않아요.
        </p>

        {!slots ? (
          <Skeleton className="h-96" />
        ) : view === "month" ? (
          <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
            <div className="overflow-x-auto">
              <div className="grid min-w-[560px] select-none grid-cols-7 gap-1" onPointerDown={(e) => startDrag(e, "day")} onContextMenu={(e) => drag.current?.touch && e.preventDefault()}>
                {DOW.map((d, i) => (
                  <div key={d} className={cx("pb-1 text-center text-xs font-semibold", i === 0 || i === 6 ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]")}>
                    {d}
                  </div>
                ))}
                {gridDays.map((k) => {
                  const inMonth = k.slice(0, 7) === cursor.slice(0, 7);
                  const list = byDay.get(k) ?? [];
                  const counts = STATES.map((s) => [s, list.filter((x) => x.state === s).length] as const).filter(([, n]) => n > 0);
                  return (
                    <button
                      key={k}
                      type="button"
                      data-day={k}
                      onClick={(e) => onDayClick(k, e)}
                      aria-pressed={markedDays.includes(k)}
                      aria-label={`${dayText(k)} ${list.length}칸`}
                      style={{ WebkitTouchCallout: "none" }}
                      className={cx(
                        "flex min-h-20 cursor-pointer flex-col rounded-xl border p-1.5 text-left",
                        k < today ? "bg-[var(--surface)] opacity-60" : "bg-white",
                        !inMonth && "opacity-40",
                        dayOpen === k ? "border-[var(--brand)]" : "border-[var(--border-light)]",
                        markedDays.includes(k) && "bg-violet-50 ring-2 ring-violet-500"
                      )}
                    >
                      <span className={cx("text-xs font-bold", k === today ? "rounded bg-[var(--brand)] px-1 text-white" : "text-[var(--foreground)]")}>{Number(k.slice(8))}</span>
                      <span className="mt-auto flex flex-wrap gap-x-1.5 gap-y-0.5 pt-1">
                        {counts.map(([s, n]) => (
                          <span key={s} className="flex items-center gap-0.5 text-[10px] text-[var(--foreground-muted)]" title={`${STATE_LABEL[s]} ${n}칸`}>
                            <span className={cx("h-2 w-2 rounded-full", STATE_DOT[s])} />
                            {n}
                          </span>
                        ))}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="card h-fit p-4">
              {dayOpen ? (
                <>
                  <p className="font-bold text-[var(--foreground)]">{dayText(dayOpen)}</p>
                  {(byDay.get(dayOpen) ?? []).length === 0 ? (
                    <p className="mt-2 text-sm text-[var(--foreground-muted)]">이 날은 칸이 없어요. 위 「여러 칸 한꺼번에 열기」에서 이 날을 기간으로 넣어 열어 주세요.</p>
                  ) : (
                    <div className="mt-2 select-none space-y-1.5" onPointerDown={(e) => startDrag(e, "slot")} onContextMenu={(e) => drag.current?.touch && e.preventDefault()}>
                      {(byDay.get(dayOpen) ?? []).map((s) => slotButton(s, true))}
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-[var(--foreground-muted)]">날짜를 누르면 그날 시간이 여기 펼쳐져요. 칸을 눌러 고치거나, 끌어서 여러 시간을 고를 수 있어요.</p>
              )}
            </div>
          </div>
        ) : view === "week" ? (
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] select-none grid-cols-7 gap-1.5" onPointerDown={(e) => startDrag(e, "slot")} onContextMenu={(e) => drag.current?.touch && e.preventDefault()}>
              {gridDays.map((k) => (
                <div key={`h-${k}`} className={cx("pb-1 text-center text-xs font-semibold", k === today ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]")}>
                  {DOW[dowOf(k)]} {Number(k.slice(5, 7))}/{Number(k.slice(8))}
                </div>
              ))}
              {gridDays.map((k) => (
                <div key={k} className={cx("min-h-64 space-y-1 rounded-xl border p-1.5", k < today ? "border-transparent bg-[var(--surface)] opacity-60" : "border-[var(--border-light)] bg-white")}>
                  {(byDay.get(k) ?? []).map((s) => slotButton(s))}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2 text-sm">
              <input type="date" value={listFrom} onChange={(e) => (setListFrom(e.target.value), clearSelection())} className="h-9 rounded-lg border border-[var(--border)] px-2" aria-label="목록 시작일" />
              <span>~</span>
              <input type="date" value={listTo} min={listFrom} onChange={(e) => (setListTo(e.target.value), clearSelection())} className="h-9 rounded-lg border border-[var(--border)] px-2" aria-label="목록 종료일" />
              <span className="mx-1 h-5 w-px bg-[var(--border)]" />
              {STATES.map((s) => (
                <button
                  key={s}
                  type="button"
                  aria-pressed={listStates.includes(s)}
                  onClick={() => (setListStates((x) => toggle(x, s)), clearSelection())}
                  className={cx("h-8 cursor-pointer rounded-lg border px-2.5 text-xs font-semibold", listStates.includes(s) ? STATE_STYLE[s].replace("line-through", "") : "border-[var(--border-light)] bg-white text-[var(--foreground-subtle)]")}
                >
                  {STATE_LABEL[s]}
                </button>
              ))}
              <span className="ml-auto text-xs text-[var(--foreground-muted)]">{listRows.length}칸</span>
            </div>
            <div className="card overflow-x-auto">
              <table className="w-full min-w-[560px] text-sm">
                <thead>
                  <tr className="border-b border-[var(--border-light)] text-left text-xs text-[var(--foreground-subtle)]">
                    <th className="w-10 p-2">
                      <input
                        type="checkbox"
                        checked={allChecked}
                        disabled={!listSelectable.length}
                        onChange={() => {
                          setMarkedDays([]);
                          setLockedHint("");
                          setMarked(allChecked ? [] : listSelectable.map((s) => s.id));
                        }}
                        aria-label="보이는 칸 모두 고르기"
                        className="h-4 w-4 accent-violet-600"
                      />
                    </th>
                    <th className="p-2">날짜</th>
                    <th className="p-2">시간</th>
                    <th className="p-2">방식</th>
                    <th className="p-2">상태</th>
                    <th className="p-2">예약자</th>
                  </tr>
                </thead>
                <tbody>
                  {listRows.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-[var(--foreground-muted)]">
                        조건에 맞는 칸이 없어요.
                      </td>
                    </tr>
                  )}
                  {listRows.map((s) => {
                    const p = kstParts(s.startsAt);
                    return (
                      <tr key={s.id} className={cx("border-b border-[var(--border-light)] last:border-0", marked.includes(s.id) && "bg-violet-50")}>
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={marked.includes(s.id)}
                            disabled={locked(s)}
                            onChange={() => {
                              setMarkedDays([]);
                              setMarked((x) => toggle(x, s.id));
                            }}
                            aria-label={`${p.dayText} ${p.hhmm} 고르기`}
                            title={locked(s) ? "예약됐거나 결제 중인 칸은 고를 수 없어요" : undefined}
                            className="h-4 w-4 accent-violet-600 disabled:opacity-30"
                          />
                        </td>
                        <td className="whitespace-nowrap p-2">{p.dayText}</td>
                        <td className="p-2">
                          <button type="button" onClick={() => setSelected(s)} className="cursor-pointer font-semibold text-[var(--foreground)] underline-offset-2 hover:underline">
                            {p.hhmm}
                          </button>
                        </td>
                        <td className="p-2 text-[var(--foreground-muted)]">{methodText(s.methods)}</td>
                        <td className="p-2">
                          <span className={cx("rounded-md border px-1.5 py-0.5 text-xs font-semibold", STATE_STYLE[s.state])}>
                            {s.counseling ? "개인 상담 " : ""}
                            {STATE_LABEL[s.state]}
                          </span>
                        </td>
                        <td className="p-2">
                          {s.who ? (
                            s.applicationId ? (
                              <a href={`/admin/assessment/applications?id=${s.applicationId}`} className="link-underline">
                                {s.who}
                              </a>
                            ) : (
                              s.who
                            )
                          ) : (
                            <span className="text-[var(--foreground-subtle)]">—</span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/30 p-0 sm:items-center sm:p-6" onClick={() => setSelected(null)}>
          <div role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()} className="w-full rounded-t-3xl bg-white p-6 sm:max-w-sm sm:rounded-3xl">
            <p className="text-lg font-bold text-[var(--foreground)]">
              {kstParts(selected.startsAt).dayText} {kstParts(selected.startsAt).timeText}
            </p>
            <p className="mt-1 text-sm text-[var(--foreground-muted)]">
              {selected.counseling ? "개인 상담 " : ""}
              {STATE_LABEL[selected.state]} · {methodText(selected.methods)}
              {selected.regions.length > 0 && ` · ${selected.regions.join(", ")}`}
              {selected.who && ` · ${selected.who}`}
            </p>
            <div className="mt-5 grid gap-2">
              {selected.state === "booked" || selected.state === "held" ? (
                <>
                  <p className="text-sm text-[var(--foreground-muted)]">{selected.state === "booked" ? "예약된 시간이라 바꿀 수 없어요." : "지금 누군가 결제 중이에요. 10분이 지나면 저절로 풀려요."}</p>
                  {selected.applicationId && (
                    <a href={`/admin/assessment/applications?id=${selected.applicationId}`} className="flex h-11 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-semibold text-white">
                      신청 보기
                    </a>
                  )}
                </>
              ) : selected.state === "personal" ? (
                <>
                  <p className="text-sm text-[var(--foreground-muted)]">고객에게는 「마감」으로 보여요.</p>
                  <button disabled={busy} onClick={() => personal([selected.id], "open")} className="h-11 cursor-pointer rounded-xl bg-[var(--brand)] text-sm font-semibold text-white disabled:opacity-40">
                    다시 열기
                  </button>
                </>
              ) : (
                <>
                  <button disabled={busy} onClick={() => personal([selected.id], "block")} className="h-11 cursor-pointer rounded-xl bg-violet-600 text-sm font-semibold text-white disabled:opacity-40">
                    개인 일정으로 막기 (고객에게 마감으로)
                  </button>
                  {selected.state === "open" ? (
                    <button onClick={() => act(selected, "closed")} className="h-11 cursor-pointer rounded-xl bg-[var(--surface)] text-sm font-semibold">
                      닫기 (고객에게 안 보이게)
                    </button>
                  ) : (
                    <button onClick={() => act(selected, "open")} className="h-11 cursor-pointer rounded-xl bg-[var(--brand)] text-sm font-semibold text-white">
                      다시 열기
                    </button>
                  )}
                  <button onClick={() => act(selected, "delete")} className="h-11 cursor-pointer rounded-xl text-sm font-semibold text-[var(--error)] hover:bg-red-50">
                    지우기
                  </button>
                </>
              )}
              <button onClick={() => setSelected(null)} className="h-11 cursor-pointer rounded-xl text-sm text-[var(--foreground-subtle)]">
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
