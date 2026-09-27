"use client";

import Link from "next/link";
import { cx } from "@/components/ui";

export type Gender = "male" | "female" | "other";
const GENDERS: { v: Gender; label: string }[] = [
  { v: "female", label: "여성" },
  { v: "male", label: "남성" },
  { v: "other", label: "선택 안 함" },
];

/** 생년월일 · 성별 입력 (회원가입·추가 정보 입력 공용) */
export function ProfileFields({
  birthDate,
  gender,
  onBirthDate,
  onGender,
}: {
  birthDate: string;
  gender: Gender | "";
  onBirthDate: (v: string) => void;
  onGender: (v: Gender) => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  return (
    <>
      <div>
        <label htmlFor="birthDate" className="mb-1.5 block text-sm font-medium text-[var(--foreground)]">
          생년월일
        </label>
        <input
          id="birthDate"
          type="date"
          value={birthDate}
          max={today}
          min="1900-01-01"
          required
          onChange={(e) => onBirthDate(e.target.value)}
          className="w-full rounded-xl border border-[var(--border)] bg-white px-4 py-3 text-[0.95rem] outline-none focus:border-[var(--brand)] focus:ring-2 focus:ring-[var(--brand-light)]"
        />
        <p className="mt-1 text-xs text-[var(--foreground-subtle)]">만 14세 이상만 가입할 수 있어요.</p>
      </div>
      <div>
        <p className="mb-1.5 text-sm font-medium text-[var(--foreground)]">성별</p>
        <div className="grid grid-cols-3 gap-2">
          {GENDERS.map((g) => (
            <button
              key={g.v}
              type="button"
              onClick={() => onGender(g.v)}
              className={cx(
                "h-11 cursor-pointer rounded-xl text-sm font-semibold transition-colors",
                gender === g.v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"
              )}
            >
              {g.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

/** 필수 동의 (이용약관 · 개인정보 수집·이용) */
export function AgreementChecks({
  terms,
  privacy,
  onTerms,
  onPrivacy,
}: {
  terms: boolean;
  privacy: boolean;
  onTerms: (v: boolean) => void;
  onPrivacy: (v: boolean) => void;
}) {
  const all = terms && privacy;
  return (
    <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
      <label className="flex cursor-pointer items-center gap-2.5 font-semibold text-[var(--foreground)]">
        <input
          type="checkbox"
          checked={all}
          onChange={(e) => {
            onTerms(e.target.checked);
            onPrivacy(e.target.checked);
          }}
          className="h-4 w-4 accent-[var(--brand)]"
        />
        모두 동의
      </label>
      <div className="mt-3 space-y-2 border-t border-[var(--border)] pt-3 text-[var(--foreground-muted)]">
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={terms} onChange={(e) => onTerms(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
          <span className="flex-1">[필수] 이용약관 동의</span>
          <Link href="/terms" target="_blank" className="text-xs underline">보기</Link>
        </label>
        <label className="flex cursor-pointer items-center gap-2.5">
          <input type="checkbox" checked={privacy} onChange={(e) => onPrivacy(e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
          <span className="flex-1">[필수] 개인정보 수집·이용 동의 (이름·이메일·생년월일·성별)</span>
          <Link href="/privacy" target="_blank" className="text-xs underline">보기</Link>
        </label>
      </div>
    </div>
  );
}
