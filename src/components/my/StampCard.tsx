"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/api";
import { WEEKDAY, STAGE_NAMES, STAGE_DROPS, stageName, type Attendance, type AttendanceSettings } from "@/lib/attendance";
import { Skeleton, cx } from "@/components/ui";
import { Character } from "@/components/character/Character";

/**
 * 숨이 카드 — 마이페이지에 표시
 *   숨이 캐릭터(성장 단계 반영) · 물방울 · 이번 주 만난 날 · 주간 목표 설정
 *   쉰 날(과거, 도장 없음)은 달 아이콘으로 표시해 실패감을 주지 않는다.
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

  // 숨이 정보
  const sumi = data.sumi;
  const sumiStage = sumi?.stage ?? 0;
  const drops = sumi?.drops ?? 0;
  const buddyName = data.settings.buddyName ?? "숨이";
  const nextAt = sumi?.nextStageAt ?? null;
  const currentStageDrops = STAGE_DROPS[sumiStage] ?? 0;
  // 이번 주 만난 날 메시지
  const weekCount = data.weekCount;
  const meetMsg =
    weekCount === 0
      ? "이번 주는 아직 안 만났어요. 오늘 시작해 볼까요?"
      : weekCount === 1
        ? `이번 주 ${weekCount}번 만났어요.`
        : `이번 주 ${weekCount}번 만났어요.`;

  return (
    <section className="card mt-10 p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-center gap-4">
          {/* 숨이 캐릭터 */}
          <div className="shrink-0">
            <Character kind="sumi" mood="happy" arms stage={sumiStage} className="h-16 w-16" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--foreground)]">{buddyName}</h2>
            <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
              {stageName(sumiStage)}{" "}
              <span className="font-semibold text-[var(--brand)]">물방울 {drops}개</span>
              {nextAt !== null && (
                <span className="text-[var(--foreground-subtle)]"> · {nextAt - drops}개 더 모으면 {STAGE_NAMES[sumiStage + 1] ?? ""}</span>
              )}
              {nextAt === null && <span className="text-amber-600"> · 꽃이 피었어요!</span>}
            </p>
            {/* 물방울 진행 막대 (꽃 단계가 아닐 때) */}
            {nextAt !== null && sumiStage < 4 && (
              <div className="mt-2 h-1.5 w-40 overflow-hidden rounded-full bg-[var(--surface-muted)]">
                <div
                  className="h-1.5 rounded-full bg-[var(--brand)] transition-all"
                  style={{ width: `${Math.min(100, ((drops - currentStageDrops) / (nextAt - currentStageDrops)) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>
        <button
          onClick={() => setEditing((v) => !v)}
          className="cursor-pointer text-sm font-semibold text-[var(--brand)]"
        >
          {editing ? "닫기" : "목표 설정"}
        </button>
      </div>

      {/* 이번 주 만난 날 */}
      <p className="mt-5 text-sm font-semibold text-[var(--foreground-muted)]">{meetMsg}</p>
      <div className="mt-3 grid grid-cols-7 gap-1.5 sm:gap-3">
        {data.week.map((d, i) => (
          <div key={d.day} className="flex flex-col items-center gap-1.5">
            <span
              className={cx(
                "flex h-10 w-10 items-center justify-center rounded-full text-base sm:h-12 sm:w-12",
                d.stamped
                  ? "bg-[var(--brand)] text-white"
                  : d.future
                    ? "border border-dashed border-[var(--border)]"
                    : "bg-[var(--surface)] text-[var(--foreground-subtle)]", // 쉰 날 — 달 아이콘
                d.day === data.today && !d.stamped && "ring-2 ring-[var(--brand)]/40"
              )}
              aria-label={`${WEEKDAY[i]}요일 ${d.stamped ? "만남" : d.future ? "예정" : "쉼"}`}
            >
              {/* 도장 찍은 날은 물방울, 쉰 날은 달, 미래는 빈 칸 */}
              {d.stamped ? "💧" : !d.future ? "🌙" : ""}
            </span>
            <span
              className={cx(
                "text-xs",
                d.day === data.today ? "font-bold text-[var(--foreground)]" : "text-[var(--foreground-subtle)]"
              )}
            >
              {WEEKDAY[i]}
            </span>
          </div>
        ))}
      </div>

      {/* 주간 목표 요약 */}
      <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1.5 text-sm">
        <span>
          이번 주 <strong className="text-[var(--brand)]">{weekCount}</strong> / 목표 {data.weeklyGoal}일
        </span>
        {data.streak && data.settings.showStreak && (
          <span className="text-[var(--foreground-muted)]">
            연속 {data.streak.days}일{data.streak.restAvailableThisWeek ? " · 이번 주 쉬어가기 1번 남음" : " · 이번 주 쉬어가기 사용"}
          </span>
        )}
      </div>

      {/* 목표 설정 패널 */}
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
                  className={cx(
                    "h-9 w-11 cursor-pointer rounded-lg font-semibold",
                    data.weeklyGoal === n ? "bg-[var(--brand)] text-white" : "bg-white"
                  )}
                >
                  {n}일
                </button>
              ))}
            </div>
          </div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              checked={data.settings.showStreak}
              onChange={(e) => save({ showStreak: e.target.checked })}
              disabled={saving}
              className="mt-0.5 h-4 w-4 accent-[var(--brand)]"
            />
            <span>
              <span className="font-semibold">연속 기록 보기</span>
              <span className="mt-0.5 block text-[var(--foreground-muted)]">
                며칠 연속으로 공부했는지 보여줘요. 한 주에 하루는 &lsquo;쉬어가기&rsquo;로 자동으로 이어져요. 끊겨도 괜찮아요 — 다시 시작한 날이 새로운 첫날이에요.
              </span>
            </span>
          </label>
        </div>
      )}

      {/* 과정별 출석 */}
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
