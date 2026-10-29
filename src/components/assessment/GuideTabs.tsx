"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

/** 안내 페이지 경로 탭 — 같은 페이지 안에서 누르면 바로 바뀐다(화면 이동 없이 본문만). 머리 아래에 붙어 따라온다 */
export function GuideTabs({ tabs }: { tabs: { path: string; label: string }[] }) {
  const pathname = usePathname();
  return (
    <nav aria-label="안내 탭" className="sticky top-16 z-20 border-b border-[var(--border-light)] bg-white/95 backdrop-blur">
      <ul className="mx-auto flex max-w-[760px] gap-1 overflow-x-auto px-3">
        {tabs.map((t) => {
          const on = pathname === t.path;
          return (
            <li key={t.path} className="shrink-0">
              <Link
                href={t.path}
                scroll={false}
                aria-current={on ? "page" : undefined}
                className={`inline-flex min-h-12 items-center border-b-[3px] px-3 text-[15px] font-bold transition-colors ${on ? "border-[var(--brand)] text-[var(--brand)]" : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]"}`}
              >
                {t.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
