import Link from "next/link";
import type { ProgressView } from "@/lib/assessment";

// 검사 3종 버튼 (MMPI → TCI → SCT, 10/29 확정) — 진행 화면·검사 이어서 하기 공통
const SLUG: Record<string, string> = { mmpi3: "mmpi", tci: "tci", sct: "sct" };
const SITE: Record<string, string> = { mmpi3: "마음사랑 · 약 60~90분", tci: "마음사랑", sct: "인싸이트 · 문장 완성" };

export function TestButtons({ v }: { v: ProgressView }) {
  return (
    <ul className="space-y-2">
      {v.tests.map((t) => (
        <li key={t.key}>
          {t.done ? (
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5">
              <span>
                <b className="text-[var(--foreground)]">{t.label} 검사</b>
                <span className="ml-2 text-xs text-[var(--foreground-subtle)]">{SITE[t.key]}</span>
              </span>
              <span className="text-sm font-semibold text-[var(--brand)]">완료 ✓</span>
            </div>
          ) : t.ready ? (
            <Link href={`/a/${v.linkKey}/go/${SLUG[t.key]}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 ring-1 ring-[var(--brand)] transition hover:bg-[var(--brand-light)]">
              <span>
                <b className="text-[var(--foreground)]">{t.label} 검사</b>
                <span className="ml-2 text-xs text-[var(--foreground-subtle)]">{SITE[t.key]}</span>
              </span>
              <span className="text-sm font-bold text-[var(--brand)]">검사하기 →</span>
            </Link>
          ) : (
            <div className="flex items-center justify-between rounded-xl bg-white px-4 py-3.5 opacity-70">
              <b className="text-[var(--foreground)]">{t.label} 검사</b>
              <span className="text-xs text-[var(--foreground-subtle)]">링크 준비 중</span>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}
