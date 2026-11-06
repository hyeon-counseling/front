"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { kstParts } from "@/lib/assessment";
import { Skeleton, cx } from "@/components/ui";

/**
 * 관리자 · 공개 슬롯 (해석 상담 가능 시간)
 * 위: 여러 날짜 × 여러 시간을 한꺼번에 열기 (미리 보기 → 열기). 월·수·금 오전(투석)은 서버가 빼 준다.
 * 아래: 7주 달력 — 칸을 눌러 닫기/다시 열기/지우기/개인 일정으로 막기. 예약된 칸은 바꿀 수 없다.
 * 개인 일정 칸은 고객에게 예약된 칸과 똑같이 '마감'으로 보인다.
 * 여러 칸: [여러 칸 고르기] 또는 달력에서 칸을 끌면(세로=같은 날 여러 시간, 가로=여러 날 같은 시간, 대각선=네모) 골라지고,
 * 고른 칸을 한꺼번에 열기·닫기·개인 일정·지우기. 예약됐거나 결제 중인 칸은 고르지도 바꾸지도 않는다 (서버도 같은 규칙).
 */
interface AdminSlot {
  id: string;
  startsAt: string;
  methods: ("offline" | "online")[];
  regions: string[];
  state: "open" | "held" | "booked" | "closed" | "personal";
  applicationId: string | null;
  counseling?: boolean; // 개인 상담으로 잡힌 칸
}

const REGIONS = ["홍대", "강남", "종로", "혜화", "사당"];
// 기본값(10/29 확정): 수·목·금·토·일, 14:00 · 15:30 · 18:00 · 19:30 — 월·화 없음, 대면 5곳 모두
const DEFAULT_TIMES = ["14:00", "15:30", "18:00", "19:30"];
const DEFAULT_DOWS = [3, 4, 5, 6, 0];
const PRESET_TIMES = ["10:00", "11:00", ...DEFAULT_TIMES, "20:00"];
const WEEKS = 7; // 고객이 고를 수 있는 끝(오늘 + 6주)이 늘 보이게
const DOW = ["일", "월", "화", "수", "목", "금", "토"];

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

const STATE_STYLE: Record<AdminSlot["state"], string> = {
  open: "bg-[var(--brand-light)] text-[var(--brand)] border-[var(--brand-light)]",
  held: "bg-amber-50 text-amber-700 border-amber-200",
  booked: "bg-[var(--brand)] text-white border-[var(--brand)]",
  closed: "bg-[var(--surface)] text-[var(--foreground-subtle)] border-[var(--border-light)] line-through",
  personal: "bg-violet-50 text-violet-700 border-violet-200",
};
const STATE_LABEL: Record<AdminSlot["state"], string> = { open: "열림", held: "결제 중", booked: "예약됨", closed: "닫힘", personal: "개인 일정" };

type BulkAction = "open" | "closed" | "personal" | "delete";
const BULK_BUTTON: Record<BulkAction, string> = { open: "열기", closed: "닫기", personal: "개인 일정으로", delete: "지우기" };
const BULK_DONE: Record<BulkAction, string> = { open: "열었어요", closed: "닫았어요", personal: "개인 일정으로 막았어요", delete: "지웠어요" };
interface BulkResult {
  changed: number;
  same: number;
  booked: number;
  held: number;
  missing: number;
}

export default function SlotsPage() {
  // 화면을 연 날 기준 (다시 그려도 바뀌지 않게). 달력은 이번 주 일요일부터 7주
  const [{ today, start }] = useState(() => {
    const t = kstToday();
    return { today: t, start: addDaysKey(t, -dowOf(t)) };
  });
  const days = useMemo(() => Array.from({ length: WEEKS * 7 }, (_, i) => addDaysKey(start, i)), [start]);
  const firstBookable = addDaysKey(today, 14);
  const lastBookable = addDaysKey(today, 42);

  const [slots, setSlots] = useState<AdminSlot[] | null>(null);
  const [pickDates, setPickDates] = useState<string[]>([]);
  const [times, setTimes] = useState<string[]>(DEFAULT_TIMES);
  const [custom, setCustom] = useState("");
  const [methods, setMethods] = useState<("offline" | "online")[]>(["offline", "online"]);
  const [regions, setRegions] = useState<string[]>([...REGIONS]);
  const [preview, setPreview] = useState<{ count: number; skipped: { at: string; why: string }[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [selected, setSelected] = useState<AdminSlot | null>(null);
  const [personalMsg, setPersonalMsg] = useState(""); // 달력 쪽 안내 — 위 '열기' 안내와 나눈다
  const [multi, setMulti] = useState(false); // 여러 칸 고르기
  const [marked, setMarked] = useState<string[]>([]);
  const [avail, setAvail] = useState<{ bookable: number; warnBelow: number; low: boolean } | null>(null);
  // 고객이 고를 수 있는 열린 칸이 언제까지 있는지 — 없으면 품절처럼 보인다
  const lastOpen = slots?.filter((s) => s.state === "open").map((s) => kstParts(s.startsAt).dateKey).sort().pop();
  const openUntil = !slots ? undefined : lastOpen && lastOpen >= firstBookable ? lastOpen : null;
  const needsMore = !openUntil || openUntil < addDaysKey(today, 28);

  const load = useCallback(() => {
    apiFetch(`/api/admin/assessment/slots?from=${start}&to=${addDaysKey(start, WEEKS * 7 - 1)}`)
      .then(setSlots)
      .catch(() => setSlots([]));
    apiRequest<{ bookable: number; warnBelow: number; low: boolean }>("/api/admin/assessment/slots/availability").then((r) => setAvail(r.ok && r.data ? r.data : null));
  }, [start]);
  useEffect(load, [load]);

  const byDay = useMemo(() => {
    const m = new Map<string, AdminSlot[]>();
    for (const s of slots ?? []) {
      const k = kstParts(s.startsAt).dateKey;
      m.set(k, [...(m.get(k) ?? []), s]);
    }
    return m;
  }, [slots]);

  const body = () => ({ dates: [...pickDates].sort(), times: [...times].sort(), methods, regions: methods.includes("offline") ? regions : [] });

  const doPreview = async () => {
    setMsg("");
    const r = await apiRequest<{ count: number; skipped: { at: string; why: string }[] }>("/api/admin/assessment/slots", { method: "POST", body: JSON.stringify({ ...body(), dryRun: true }) });
    if (r.ok && r.data) setPreview(r.data);
    else setMsg(r.message || "미리 보기를 하지 못했어요.");
  };

  const doOpen = async () => {
    setBusy(true);
    setMsg("");
    const r = await apiRequest<{ created: number; existed: number }>("/api/admin/assessment/slots", { method: "POST", body: JSON.stringify(body()) });
    setBusy(false);
    if (r.ok && r.data) {
      setMsg(`${r.data.created}칸을 열었어요.${r.data.existed ? ` (이미 있던 ${r.data.existed}칸은 건너뜀)` : ""}`);
      setPreview(null);
      setPickDates([]);
      load();
    } else setMsg(r.message || "열지 못했어요.");
  };

  const act = async (s: AdminSlot, what: "open" | "closed" | "delete") => {
    setMsg("");
    const r =
      what === "delete"
        ? await apiRequest(`/api/admin/assessment/slots/${s.id}`, { method: "DELETE" })
        : await apiRequest(`/api/admin/assessment/slots/${s.id}`, { method: "PATCH", body: JSON.stringify({ state: what }) });
    if (!r.ok) setMsg(r.message || "바꾸지 못했어요.");
    setSelected(null);
    load();
  };

  // 개인 일정으로 막기 · 다시 열기 (한 칸도 여러 칸도 같은 길)
  const personal = async (ids: string[], action: "block" | "open") => {
    setBusy(true);
    setPersonalMsg("");
    const r = await apiRequest<{ changed: number; skipped: number }>("/api/admin/assessment/slots/personal", { method: "POST", body: JSON.stringify({ ids, action }) });
    setBusy(false);
    if (r.ok && r.data) {
      const skipped = r.data.skipped ? ` ${r.data.skipped}칸은 ${action === "block" ? "예약됐거나 결제 중이라" : "개인 일정 칸이 아니라"} 건너뛰었어요.` : "";
      setPersonalMsg(`${r.data.changed}칸을 ${action === "block" ? "개인 일정으로 막았어요" : "다시 열었어요"}.${skipped}`);
    } else setPersonalMsg(r.message || "바꾸지 못했어요.");
    setSelected(null);
    setMarked([]);
    load();
  };

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  // ── 고른 칸 한꺼번에 (예약·결제 중 칸은 서버가 건너뛰고 수를 알려 준다) ──
  const [lockedHint, setLockedHint] = useState("");
  const bulk = async (action: BulkAction) => {
    if (!marked.length) return;
    if (action === "delete" && !window.confirm(`선택한 ${marked.length}칸을 지울까요? 지운 칸은 되돌릴 수 없어요. (예약됐거나 결제 중인 칸은 지우지 않아요)`)) return;
    setBusy(true);
    setPersonalMsg("");
    const r = await apiRequest<BulkResult>("/api/admin/assessment/slots/bulk", { method: "POST", body: JSON.stringify({ ids: marked, action }) });
    setBusy(false);
    if (r.ok && r.data) {
      const d = r.data;
      const skip = [d.booked && `예약된 ${d.booked}칸`, d.held && `결제 중인 ${d.held}칸`, d.missing && `그새 바뀐 ${d.missing}칸`].filter(Boolean).join(", ");
      setPersonalMsg(`${d.changed}칸을 ${BULK_DONE[action]}.${d.same ? ` (이미 그 상태였던 ${d.same}칸)` : ""}${skip ? ` ${skip}은 건너뛰었어요.` : ""}`);
      setMarked([]);
      setLockedHint("");
    } else setPersonalMsg(r.message || "바꾸지 못했어요.");
    load();
  };

  // ── 끌어서 여러 칸 고르기 ──
  // 칸 위치 = 달력의 몇째 줄·몇째 칸(요일)·시각. 끌기 시작한 칸과 지금 칸으로 네모를 만들어 그 안의 칸을 고른다
  const slotPos = useMemo(() => {
    const idx = new Map(days.map((k, i) => [k, i]));
    const m = new Map<string, { i: number; t: string; locked: boolean }>();
    for (const s of slots ?? []) {
      const p = kstParts(s.startsAt);
      const i = idx.get(p.dateKey);
      if (i !== undefined) m.set(s.id, { i, t: p.hhmm, locked: s.state === "booked" || s.state === "held" });
    }
    return m;
  }, [slots, days]);

  const rectSelect = (from: string, to: string, base: string[]) => {
      const a = slotPos.get(from);
      const b = slotPos.get(to);
      if (!a || !b) return;
      const [r1, r2] = [Math.floor(a.i / 7), Math.floor(b.i / 7)].sort((x, y) => x - y);
      const [c1, c2] = [a.i % 7, b.i % 7].sort((x, y) => x - y);
      const [t1, t2] = [a.t, b.t].sort();
      const inside: string[] = [];
      let locked = 0;
      for (const [id, p] of slotPos) {
        const r = Math.floor(p.i / 7);
        const c = p.i % 7;
        if (r < r1 || r > r2 || c < c1 || c > c2 || p.t < t1 || p.t > t2) continue;
        if (p.locked) locked++;
        else inside.push(id);
      }
      setMarked([...new Set([...base, ...inside])]);
      setLockedHint(locked ? `예약됐거나 결제 중인 ${locked}칸은 고르지 않았어요.` : "");
  };

  const drag = useRef<{ anchor: string; base: string[]; moved: boolean; touch: boolean; armed: boolean; x: number; y: number; timer: number | null } | null>(null);
  const suppressClick = useRef(false);

  const onGridPointerDown = (e: React.PointerEvent) => {
    const anchor = (e.target as HTMLElement).closest<HTMLElement>("[data-slot-id]")?.dataset.slotId;
    if (!anchor || e.button !== 0) return;
    const touch = e.pointerType !== "mouse";
    if (!touch) e.preventDefault(); // 끌 때 글자가 선택되지 않게 (클릭은 그대로)
    const keep = e.shiftKey || e.ctrlKey || e.metaKey; // Shift·Ctrl 을 누른 채 끌면 지금 고른 칸에 더한다
    const st = { anchor, base: keep ? marked : [], moved: false, touch, armed: !touch, x: e.clientX, y: e.clientY, timer: null as number | null };
    // 휴대폰·태블릿: 길게(0.45초) 누른 뒤 끌기 — 그 전에 움직이면 화면 넘기기로 본다
    if (touch)
      st.timer = window.setTimeout(() => {
        if (drag.current === st) {
          st.armed = true;
          navigator.vibrate?.(15);
        }
      }, 450);
    drag.current = st;
    const over = (x: number, y: number) => (document.elementFromPoint(x, y) as HTMLElement | null)?.closest<HTMLElement>("[data-slot-id]")?.dataset.slotId ?? null;
    const move = (ev: PointerEvent) => {
      const d = drag.current;
      if (!d) return;
      if (!d.armed) {
        if (Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 8) end();
        return;
      }
      const id = over(ev.clientX, ev.clientY);
      if (!id || (!d.moved && id === d.anchor)) return;
      if (!d.moved) {
        d.moved = true;
        setMulti(true);
        setSelected(null);
      }
      rectSelect(d.anchor, id, d.base);
    };
    const block = (ev: TouchEvent) => {
      if (drag.current?.armed) ev.preventDefault(); // 길게 누른 뒤에는 화면이 움직이지 않게
    };
    const end = () => {
      const d = drag.current;
      if (d?.timer) clearTimeout(d.timer);
      if (d?.moved) {
        suppressClick.current = true; // 끌기 끝의 클릭은 무시
        window.setTimeout(() => (suppressClick.current = false), 0);
      } else if (d?.touch && d.armed) {
        // 길게 누르기만 하고 놓음 → 그 칸 하나 고르기
        setMulti(true);
        setSelected(null);
        if (!slotPos.get(d.anchor)?.locked) setMarked((x) => toggle(x, d.anchor));
        suppressClick.current = true;
        window.setTimeout(() => (suppressClick.current = false), 0);
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

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">공개 슬롯</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        고객은 결제일 14일 뒤부터 6주까지 열린 칸만 고를 수 있어요 (오늘 신청하면 {kstParts(`${firstBookable}T03:00:00Z`).dayText}부터 {kstParts(`${lastBookable}T03:00:00Z`).dayText}까지). 월·수·금 오전은 열리지 않아요.
      </p>
      {openUntil !== undefined && (
        <p className={cx("mt-3 rounded-xl px-4 py-3 text-sm", needsMore ? "bg-amber-50 font-semibold text-amber-800" : "bg-[var(--surface)] text-[var(--foreground-muted)]")}>
          {openUntil
            ? <>열린 칸은 {kstParts(`${openUntil}T03:00:00Z`).dayText}까지 있어요. {kstParts(`${addDaysKey(openUntil, -13)}T03:00:00Z`).dayText}부터 신청하는 분은 고를 칸이 없어요. </>
            : <>고객이 고를 수 있는 열린 칸이 없어요. </>}
          늘 오늘부터 6주 뒤까지 열어 두고, 일주일에 한 번 다음 한 주를 더 열어 주세요.
        </p>
      )}

      {avail?.low && (
        <p className="mt-3 rounded-xl bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-800">
          오늘 신청하는 분이 고를 수 있는 칸이 {avail.bookable}칸이에요. {avail.warnBelow}칸보다 적으면 상품을 바로 사기 어려워 보일 수 있어요. 칸을 더 열거나 막은 칸을 다시 열어 주세요.
        </p>
      )}

      {/* 한꺼번에 열기 */}
      <section className="card mt-6 space-y-5 p-5">
        <h2 className="font-bold text-[var(--foreground)]">여러 칸 한꺼번에 열기</h2>
        <div>
          <p className="mb-2 text-sm font-semibold">1. 시간 고르기</p>
          <div className="flex flex-wrap gap-2">
            {[...new Set([...PRESET_TIMES, ...times])].sort().map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => (setTimes((x) => toggle(x, t)), setPreview(null))}
                className={cx("h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold", times.includes(t) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}
              >
                {t}
              </button>
            ))}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (/^([01]\d|2[0-3]):[0-5]\d$/.test(custom)) {
                  setTimes((x) => [...new Set([...x, custom])]);
                  setCustom("");
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
            <p className="mb-2 text-sm font-semibold">2. 상담 방식</p>
            <div className="flex gap-2">
              {([["offline", "대면"], ["online", "화상"]] as const).map(([v, l]) => (
                <button key={v} type="button" onClick={() => (setMethods((x) => toggle(x, v)), setPreview(null))} className={cx("h-9 cursor-pointer rounded-lg px-4 text-sm font-semibold", methods.includes(v) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
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
                  <button key={r} type="button" onClick={() => (setRegions((x) => toggle(x, r)), setPreview(null))} className={cx("h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold", regions.includes(r) ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                    {r}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold">3. 아래 달력에서 열 날짜를 눌러 고르세요 {pickDates.length > 0 && <span className="text-[var(--brand)]">· {pickDates.length}일 고름</span>}</p>
          <button
            type="button"
            onClick={() => {
              setPickDates(days.filter((k) => k >= firstBookable && DEFAULT_DOWS.includes(dowOf(k))));
              setPreview(null);
            }}
            className="h-8 cursor-pointer rounded-lg bg-[var(--brand-light)] px-3 text-xs font-semibold text-[var(--brand)]"
          >
            기본: 수~일 모두 고르기
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button disabled={!pickDates.length || !times.length} onClick={doPreview} className="h-10 cursor-pointer rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold disabled:opacity-40">
            미리 보기
          </button>
          {preview && (
            <>
              <span className="text-sm">
                <b>{preview.count}칸</b>이 열려요
                {preview.skipped.length > 0 && <span className="text-[var(--foreground-subtle)]"> · 빠짐 {preview.skipped.length}칸 ({[...new Set(preview.skipped.map((s) => s.why))].join(", ")})</span>}
              </span>
              <button disabled={busy || !preview.count} onClick={doOpen} className="h-10 cursor-pointer rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white disabled:opacity-40">
                {busy ? "여는 중…" : `${preview.count}칸 열기`}
              </button>
            </>
          )}
          {pickDates.length > 0 && (
            <button onClick={() => (setPickDates([]), setPreview(null))} className="cursor-pointer text-sm text-[var(--foreground-subtle)] underline underline-offset-2">
              날짜 선택 지우기
            </button>
          )}
        </div>
        {msg && <p className="text-sm text-[var(--brand)]">{msg}</p>}
      </section>

      {/* 7주 달력 */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap items-center gap-3 text-xs text-[var(--foreground-muted)]">
          {(Object.keys(STATE_LABEL) as AdminSlot["state"][]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cx("h-3 w-3 rounded border", STATE_STYLE[s])} /> {STATE_LABEL[s]}
            </span>
          ))}
          <button
            type="button"
            onClick={() => (setMulti((v) => !v), setMarked([]), setLockedHint(""))}
            aria-pressed={multi}
            className={cx("ml-auto h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold", multi ? "bg-violet-600 text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
          >
            {multi ? "여러 칸 고르기 끝내기" : "여러 칸 고르기"}
          </button>
        </div>
        {multi && (
          <div className="sticky top-2 z-10 mb-2 flex flex-wrap items-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm">
            <span className="font-semibold text-violet-800">{marked.length ? `${marked.length}칸 고름` : "칸을 누르거나 끌어서 고르세요"}</span>
            {(["open", "closed", "personal", "delete"] as const).map((a) => (
              <button
                key={a}
                disabled={busy || !marked.length}
                onClick={() => bulk(a)}
                className={cx(
                  "h-9 cursor-pointer rounded-lg px-3 font-semibold disabled:opacity-40",
                  a === "personal" ? "bg-violet-600 text-white" : a === "delete" ? "bg-white text-[var(--error)]" : a === "open" ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--foreground)]"
                )}
              >
                {marked.length ? `선택한 ${marked.length}칸 ${BULK_BUTTON[a]}` : BULK_BUTTON[a]}
              </button>
            ))}
            {marked.length > 0 && (
              <button onClick={() => (setMarked([]), setLockedHint(""))} className="cursor-pointer text-[var(--foreground-subtle)] underline underline-offset-2">
                고르기 취소
              </button>
            )}
            {lockedHint && <span className="w-full text-xs font-semibold text-amber-800">{lockedHint}</span>}
            <span className="w-full text-xs text-violet-800">
              끌면 네모 안의 칸이 한꺼번에 골라져요(세로: 같은 날 여러 시간 · 가로: 여러 날 같은 시간). Shift·Ctrl을 누른 채 끌면 더해지고, 고른 칸을 다시 누르면 풀려요. 휴대폰은 길게 누른 뒤 끌어요. 예약됐거나 결제 중인 칸은 고르지도 바꾸지도 않아요. 개인 일정 칸은 고객에게 「마감」으로 보여요.
            </span>
          </div>
        )}
        {personalMsg && <p className="mb-2 text-sm text-[var(--brand)]">{personalMsg}</p>}
        {!slots ? (
          <Skeleton className="h-96" />
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] select-none grid-cols-7 gap-1.5" onPointerDown={onGridPointerDown} onContextMenu={(e) => drag.current?.touch && e.preventDefault()}>
              {DOW.map((d, i) => (
                <div key={d} className={cx("pb-1 text-center text-xs font-semibold", i === 0 || i === 6 ? "text-[var(--brand)]" : "text-[var(--foreground-subtle)]")}>
                  {d}
                </div>
              ))}
              {days.map((k) => {
                const past = k < today;
                const picked = pickDates.includes(k);
                const list = byDay.get(k) ?? [];
                const d = Number(k.slice(8));
                return (
                  <div key={k} className={cx("min-h-28 rounded-xl border p-1.5", past ? "border-transparent bg-[var(--surface)] opacity-50" : picked ? "border-[var(--brand)] bg-[var(--brand-light)]/40" : "border-[var(--border-light)] bg-white")}>
                    <button
                      type="button"
                      disabled={past}
                      onClick={() => (setPickDates((x) => toggle(x, k)), setPreview(null))}
                      className={cx("flex w-full cursor-pointer items-center justify-between rounded-lg px-1.5 py-1 text-xs font-bold disabled:cursor-default", picked ? "text-[var(--brand)]" : "text-[var(--foreground)]")}
                      aria-pressed={picked}
                      aria-label={`${k} 고르기`}
                    >
                      <span>
                        {d === 1 || k === days[0] ? `${Number(k.slice(5, 7))}/` : ""}
                        {d}
                      </span>
                      {!past && <span className="text-[10px] font-normal text-[var(--foreground-subtle)]">{picked ? "✓" : k < firstBookable ? "14일 안" : "+"}</span>}
                    </button>
                    <div className="mt-1 space-y-1">
                      {list.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          data-slot-id={s.id}
                          aria-disabled={multi && (s.state === "booked" || s.state === "held") ? true : undefined}
                          aria-pressed={multi ? marked.includes(s.id) : undefined}
                          onClick={() => {
                            if (suppressClick.current) return;
                            if (multi) {
                              if (s.state !== "booked" && s.state !== "held") setMarked((x) => toggle(x, s.id));
                              return;
                            }
                            if (s.state === "held" && s.applicationId) window.location.assign(`/admin/assessment/applications?id=${s.applicationId}`);
                            else setSelected(s);
                          }}
                          style={{ WebkitTouchCallout: "none" }}
                          className={cx(
                            "block w-full cursor-pointer rounded-md border px-1.5 py-0.5 text-left text-[11px] font-semibold",
                            STATE_STYLE[s.state],
                            multi && (s.state === "booked" || s.state === "held") && "cursor-not-allowed opacity-50",
                            marked.includes(s.id) && "ring-2 ring-violet-600 ring-offset-1"
                          )}
                          title={`${s.counseling ? "개인 상담 " : ""}${STATE_LABEL[s.state]} · ${s.methods.map((m) => (m === "offline" ? "대면" : "화상")).join("·")}`}
                        >
                          {kstParts(s.startsAt).hhmm}
                          <span className="ml-1 font-normal opacity-70">{s.methods.length === 2 ? "" : s.methods[0] === "offline" ? "대면" : "화상"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
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
              {selected.counseling ? "개인 상담 " : ""}{STATE_LABEL[selected.state]} · {selected.methods.map((m) => (m === "offline" ? "대면" : "화상")).join("·")}
              {selected.regions.length > 0 && ` · ${selected.regions.join(", ")}`}
            </p>
            <div className="mt-5 grid gap-2">
              {selected.state === "booked" || selected.state === "held" ? (
                <>
                  <p className="text-sm text-[var(--foreground-muted)]">{selected.state === "booked" ? "예약된 시간이라 바꿀 수 없어요." : "지금 누군가 결제 중이에요. 30분이 지나면 저절로 풀려요."}</p>
                  {selected.applicationId && (
                    <a href={`/admin/assessment/applications?id=${selected.applicationId}`} className="flex h-11 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-semibold text-white">
                      신청 보기
                    </a>
                  )}
                </>
              ) : selected.state === "personal" ? (
                <>
                  <p className="text-sm text-[var(--foreground-muted)]">고객에게는 「마감」으로 보여요. 지우려면 먼저 다시 열어 주세요.</p>
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
