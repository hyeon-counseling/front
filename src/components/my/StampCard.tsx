"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { WEEKDAY, type Attendance, type AttendanceSettings } from "@/lib/attendance";
import { Skeleton, cx } from "@/components/ui";

/**
 * 마음 도장 — 이번 주 공부한 날 · 주간 목표 · 누적 도장 · (켠 사람만) 연속 기록
 * 워크북 하루·강의 차시·퀴즈·카드·심리검사를 하면 그날 도장이 자동으로 찍힌다(새벽 4시 기준).
 * 연속 기록은 끊겼을 때 부담이 될 수 있어 기본으로 꺼 두고, 손실을 겁주는 문구는 쓰지 않는다.
 */
export function StampCard() {
  const [data, setData] = useState<Attendance | null>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiRequest<Attendance>("/api/my/attendance").then((r) => r.ok && r.data && setData(r.data));
  }, []);

  const save = async (patch: Partial<AttendanceSettings>) => {
    setSaving(true);
    const r = await apiRequest<AttendanceSettings>("/api/my/attendance/settings", { method: "PUT", body: JSON.stringify(patch) });
    setSaving(false);
    if (r.ok) {
      const fresh = await apiRequest<Attendance>("/api/my/attendance");
      if (fresh.ok && fresh.data) setData(fresh.data);
    }
  };

  if (!data) return <Skeleton className="mt-10 h-44" />;

  const message = data.weekGoalMet
    ? "이번 주 목표를 채웠어요. 스스로를 한 번 칭찬해 주세요 🌿"
    : data.weekCount === 0
      ? "이번 주는 아직이에요. 오늘 10분이면 충분해요."
      : `이번 주 ${data.weekCount}일 공부했어요. 편안한 속도로 괜찮아요.`;

  return (
    <section className="card mt-10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-[var(--foreground)]">마음 도장</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">{message}</p>
        </div>
        <button onClick={() => setEditing((v) => !v)} className="cursor-pointer text-sm font-semibold text-[var(--brand)]">
          {editing ? "닫기" : "목표 설정"}
        </button>
      </div>

      {/* 이번 주 7칸 */}
      <div className="mt-5 grid grid-cols-7 gap-1.5 sm:gap-3">
        {data.week.map((d, i) => (
          <div key={d.day} className="flex flex-col items-center gap-1.5">
            <span
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-full text-base sm:h-12 sm:w-12",
                d.stamped ? "bg-[var(--brand)] text-white" : d.future ? "border border-dashed border-[var(--border)]" : "bg-[var(--surface)]",
                d.day === data.today && !d.stamped && "ring-2 ring-[var(--brand)]/40"
              )}
              aria-label={`${WEEKDAY[i]}요일 ${d.stamped ? "도장" : "없음"}`}
            >
              {d.stamped ? "✓" : ""}
            </span>
            <span className={cx("text-xs", d.day === data.today ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground-subtle)]")}>{WEEKDAY[i]}</span>
          </div>
        ))}
      </div>

      <div className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
        <span>
          이번 주 <strong className="text-[var(--brand)]">{data.weekCount}</strong> / 목표 {data.weeklyGoal}일
        </span>
        <span className="text-[var(--foreground-muted)]">누적 도장 {data.total}개</span>
        {data.streak && (
          <span className="text-[var(--foreground-muted)]">
            연속 {data.streak.days}일{data.streak.restAvailableThisWeek ? " · 이번 주 쉬어가기 1번 남음" : " · 이번 주 쉬어가기 사용"}
          </span>
        )}
      </div>

      {editing && (
        <div className="mt-5 space-y-4 rounded-2xl bg-[var(--surface)] p-4 text-sm">
          <div>
            <p className="font-semibold">한 주에 며칠 공부할까요?</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[1, 2, 3, 4, 5, 6, 7].map((n) => (
                <button
                  key={n}
                  onClick={() => save({ weeklyGoal: n })}
                  disabled={saving}
                  className={cx("h-9 w-11 cursor-pointer rounded-lg font-semibold", data.weeklyGoal === n ? "bg-[var(--brand)] text-white" : "bg-white")}
                >
                  {n}일
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input type="checkbox" checked={data.settings.showStreak} onChange={(e) => save({ showStreak: e.target.checked })} disabled={saving} className="mt-0.5 h-4 w-4 accent-[var(--brand)]" />
            <span>
              <span className="font-semibold">연속 기록 보기</span>
              <span className="mt-0.5 block text-[var(--foreground-muted)]">며칠 연속으로 공부했는지 보여줘요. 한 주에 하루는 &lsquo;쉬어가기&rsquo;로 자동으로 이어져요. 끊겨도 괜찮아요 — 다시 시작한 날이 새로운 첫날이에요.</span>
            </span>
          </label>
        </div>
      )}

      {data.courses.length > 0 && (
        <div className="mt-6 border-t border-[var(--border-light)] pt-4">
          <p className="text-xs font-semibold text-[var(--foreground-subtle)]">과정별 출석 (수강 기간 안에 공부한 날)</p>
          <ul className="mt-2 space-y-1.5 text-sm">
            {data.courses.map((c) => (
              <li key={c.href} className="flex items-center justify-between gap-3">
                <Link href={c.href} className="min-w-0 truncate hover:underline">{c.title}</Link>
                <span className="shrink-0 text-[var(--foreground-muted)]">
                  {c.attendedDays}일{c.periodDays ? ` / ${c.periodDays}일` : ""}
                  {c.finished && <span className="ml-2 font-semibold text-[var(--brand)]">수료</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
