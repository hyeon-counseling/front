"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { kstParts } from "@/lib/assessment";
import { Skeleton, cx } from "@/components/ui";

/**
 * 관리자 · 공개 슬롯 (해석 상담 가능 시간)
 * 위: 여러 날짜 × 여러 시간을 한꺼번에 열기 (미리 보기 → 열기). 월·수·금 오전(투석)은 서버가 빼 준다.
 * 아래: 6주 달력 — 칸을 눌러 닫기/다시 열기/지우기. 예약된 칸은 바꿀 수 없다.
 */
interface AdminSlot {
  id: string;
  startsAt: string;
  methods: ("offline" | "online")[];
  regions: string[];
  state: "open" | "held" | "booked" | "closed";
  applicationId: string | null;
}

const REGIONS = ["홍대", "강남", "종로", "혜화", "사당"];
// 기본값(10/29 확정): 수·목·금·토·일, 14:00 · 15:30 · 18:00 · 19:30 — 월·화 없음, 대면 5곳 모두
const DEFAULT_TIMES = ["14:00", "15:30", "18:00", "19:30"];
const DEFAULT_DOWS = [3, 4, 5, 6, 0];
const PRESET_TIMES = ["10:00", "11:00", ...DEFAULT_TIMES, "20:00"];
const WEEKS = 6;
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
};
const STATE_LABEL: Record<AdminSlot["state"], string> = { open: "열림", held: "결제 중", booked: "예약됨", closed: "닫힘" };

export default function SlotsPage() {
  // 화면을 연 날 기준 (다시 그려도 바뀌지 않게). 달력은 이번 주 일요일부터 6주
  const [{ today, start }] = useState(() => {
    const t = kstToday();
    return { today: t, start: addDaysKey(t, -dowOf(t)) };
  });
  const days = Array.from({ length: WEEKS * 7 }, (_, i) => addDaysKey(start, i));
  const firstBookable = addDaysKey(today, 14);

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

  const load = useCallback(() => {
    apiFetch(`/api/admin/assessment/slots?from=${start}&to=${addDaysKey(start, WEEKS * 7 - 1)}`)
      .then(setSlots)
      .catch(() => setSlots([]));
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

  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">공개 슬롯</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        고객은 신청일 14일 뒤부터 열린 칸만 고를 수 있어요 (오늘 신청하면 {kstParts(`${firstBookable}T03:00:00Z`).dayText}부터). 월·수·금 오전은 열리지 않아요.
      </p>

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

      {/* 6주 달력 */}
      <section className="mt-6">
        <div className="mb-2 flex flex-wrap gap-3 text-xs text-[var(--foreground-muted)]">
          {(Object.keys(STATE_LABEL) as AdminSlot["state"][]).map((s) => (
            <span key={s} className="flex items-center gap-1">
              <span className={cx("h-3 w-3 rounded border", STATE_STYLE[s])} /> {STATE_LABEL[s]}
            </span>
          ))}
        </div>
        {!slots ? (
          <Skeleton className="h-96" />
        ) : (
          <div className="overflow-x-auto">
            <div className="grid min-w-[760px] grid-cols-7 gap-1.5">
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
                          onClick={() => setSelected(s)}
                          className={cx("block w-full cursor-pointer rounded-md border px-1.5 py-0.5 text-left text-[11px] font-semibold", STATE_STYLE[s.state])}
                          title={`${STATE_LABEL[s.state]} · ${s.methods.map((m) => (m === "offline" ? "대면" : "화상")).join("·")}`}
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
              {STATE_LABEL[selected.state]} · {selected.methods.map((m) => (m === "offline" ? "대면" : "화상")).join("·")}
              {selected.regions.length > 0 && ` · ${selected.regions.join(", ")}`}
            </p>
            <div className="mt-5 grid gap-2">
              {selected.state === "booked" || selected.state === "held" ? (
                <>
                  <p className="text-sm text-[var(--foreground-muted)]">{selected.state === "booked" ? "예약된 시간이라 바꿀 수 없어요." : "지금 누군가 결제 중이에요 (30분)."}</p>
                  {selected.applicationId && (
                    <a href={`/admin/assessment/applications?id=${selected.applicationId}`} className="flex h-11 items-center justify-center rounded-xl bg-[var(--brand)] text-sm font-semibold text-white">
                      신청 보기
                    </a>
                  )}
                </>
              ) : (
                <>
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
