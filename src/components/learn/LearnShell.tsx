"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { cx } from "@/components/ui";

/**
 * 학습 화면 공용 틀 — 왼쪽 목차 사이드바 + 본문
 *
 *  - 데스크톱(1024px 이상): 왼쪽에 고정. ☰ 버튼으로 접고 펼치며, 상태는 이 브라우저에 기억
 *  - 모바일: 아래 "목차" 버튼 → 서랍(드로어)으로 열림
 *  - 그룹(주차·섹션)은 접고 펼칠 수 있고, 지금 보는 항목이 있는 그룹은 자동으로 펼쳐짐
 *  - 항목: 완료 ✓ · 잠김 🔒 · 지금 위치 강조
 *  - 키보드 [ ] 로 이전/다음 (입력 칸에서 글을 쓰는 중에는 동작하지 않음)
 * 워크북 일차 화면과 강의 수강 화면이 함께 쓴다.
 */

export interface LearnNavItem {
  key: string;
  href: string;
  label?: string;     // 예: "Day 3", "1편"
  title: string;
  meta?: string;      // 예: "10분"
  completed?: boolean;
  locked?: boolean;
}

export interface LearnNavGroup {
  key: string;
  title: string;
  badge?: string;     // 예: "무료"
  items: LearnNavItem[];
}

const COLLAPSE_KEY = "learn-nav-collapsed";

function readCollapsed(): boolean {
  try {
    return localStorage.getItem(COLLAPSE_KEY) === "1";
  } catch {
    return false;
  }
}

export function LearnShell({
  title,
  backHref,
  groups,
  currentKey,
  prevHref,
  nextHref,
  lockedHref,
  children,
}: {
  title: string;
  backHref: string;
  groups: LearnNavGroup[] | null;   // 아직 못 불러왔으면 null
  currentKey: string;
  prevHref?: string | null;
  nextHref?: string | null;
  lockedHref?: string;             // 잠긴 항목을 누르면 갈 곳 (소개·구매 페이지)
  children: ReactNode;
}) {
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [drawer, setDrawer] = useState(false);

  // 저장된 접힘 상태는 화면이 뜬 뒤에 읽는다 (서버 렌더와 어긋나지 않게)
  useEffect(() => {
    const saved = readCollapsed();
    if (saved) {
      const t = setTimeout(() => setCollapsed(true), 0);
      return () => clearTimeout(t);
    }
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      try {
        localStorage.setItem(COLLAPSE_KEY, c ? "0" : "1");
      } catch {
        /* 저장 못 해도 동작에는 문제없음 */
      }
      return !c;
    });
  };

  // [ ] 로 이전/다음
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      if (el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "[" && prevHref) router.push(prevHref);
      if (e.key === "]" && nextHref) router.push(nextHref);
      if (e.key === "Escape") setDrawer(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [prevHref, nextHref, router]);

  // 서랍이 열려 있으면 뒤 배경 스크롤 막기
  useEffect(() => {
    if (!drawer) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [drawer]);

  const all = groups?.flatMap((g) => g.items) ?? [];
  const done = all.filter((i) => i.completed).length;
  const pos = all.findIndex((i) => i.key === currentKey);

  return (
    <div className="relative lg:flex">
      {/* 데스크톱 사이드바 */}
      {!collapsed && (
        <aside className="hidden w-[300px] shrink-0 border-r border-[var(--border-light)] bg-white lg:block">
          <div className="sticky top-16 flex h-[calc(100vh-4rem)] flex-col">
            <NavPanel
              title={title}
              backHref={backHref}
              groups={groups}
              currentKey={currentKey}
              done={done}
              total={all.length}
              lockedHref={lockedHref}
              onCollapse={toggleCollapsed}
            />
          </div>
        </aside>
      )}

      <div className="min-w-0 flex-1">
        {collapsed && (
          <button
            onClick={toggleCollapsed}
            className="sticky top-20 z-30 ml-4 mt-4 hidden h-10 cursor-pointer items-center gap-2 rounded-xl border border-[var(--border)] bg-white px-3 text-sm font-semibold shadow-sm hover:bg-[var(--surface)] lg:inline-flex"
            aria-label="목차 펼치기"
          >
            ☰ 목차
          </button>
        )}
        {children}
      </div>

      {/* 모바일: 목차 버튼 + 서랍 */}
      {groups && (
        <button
          onClick={() => setDrawer(true)}
          className="fixed bottom-5 left-1/2 z-40 flex h-11 -translate-x-1/2 cursor-pointer items-center gap-2 rounded-full bg-[var(--brand-ink)] px-5 text-sm font-semibold text-white shadow-lg lg:hidden"
        >
          ☰ 목차{pos >= 0 && <span className="text-white/70">· {pos + 1}/{all.length}</span>}
        </button>
      )}
      {drawer && (
        <div className="fixed inset-0 z-[90] lg:hidden" role="dialog" aria-modal="true" aria-label="목차">
          <div className="absolute inset-0 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white shadow-2xl">
            <NavPanel
              title={title}
              backHref={backHref}
              groups={groups}
              currentKey={currentKey}
              done={done}
              total={all.length}
              lockedHref={lockedHref}
              onClose={() => setDrawer(false)}
              onNavigate={() => setDrawer(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function NavPanel({
  title,
  backHref,
  groups,
  currentKey,
  done,
  total,
  lockedHref,
  onCollapse,
  onClose,
  onNavigate,
}: {
  title: string;
  backHref: string;
  groups: LearnNavGroup[] | null;
  currentKey: string;
  done: number;
  total: number;
  lockedHref?: string;
  onCollapse?: () => void;
  onClose?: () => void;
  onNavigate?: () => void;
}) {
  const currentGroup = groups?.find((g) => g.items.some((i) => i.key === currentKey))?.key;
  // 사용자가 직접 접거나 편 그룹만 기억하고, 나머지는 "현재 그룹만 펼침"이 기본
  const [manual, setManual] = useState<Record<string, boolean>>({});
  const isOpen = (key: string) => manual[key] ?? key === currentGroup;
  const toggle = (key: string) => setManual((m) => ({ ...m, [key]: !isOpen(key) }));

  // 지금 항목이 목차 안에서 보이도록 — 목차 영역만 스크롤한다
  // (scrollIntoView는 본문 페이지까지 움직여서, 저장할 때마다 화면이 맨 위로 튀었다)
  const listRef = useRef<HTMLDivElement>(null);
  const scrollToCurrent = useCallback(() => {
    const list = listRef.current;
    const el = list?.querySelector<HTMLElement>('[data-current="true"]');
    if (!list || !el) return;
    const offset = el.getBoundingClientRect().top - list.getBoundingClientRect().top;
    list.scrollTop += offset - (list.clientHeight - el.offsetHeight) / 2;
  }, []);
  useEffect(() => {
    scrollToCurrent();
  }, [currentKey, groups, scrollToCurrent]);

  const pct = total ? Math.round((done / total) * 100) : 0;

  return (
    <>
      <div className="border-b border-[var(--border-light)] px-4 pb-4 pt-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={backHref} onClick={onNavigate} className="min-w-0 truncate text-sm font-bold text-[var(--foreground)] hover:text-[var(--brand)]">
            ← {title}
          </Link>
          {onCollapse && (
            <button onClick={onCollapse} className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-xs font-semibold text-[var(--foreground-subtle)] hover:bg-[var(--surface)]" aria-label="목차 접기" title="목차 접기">
              ⟨ 접기
            </button>
          )}
          {onClose && (
            <button onClick={onClose} className="shrink-0 cursor-pointer rounded-lg px-2 py-1 text-sm text-[var(--foreground-subtle)] hover:bg-[var(--surface)]" aria-label="닫기">
              ✕
            </button>
          )}
        </div>
        {total > 0 && (
          <div className="mt-3 flex items-center gap-2">
            <div className="h-1.5 flex-1 rounded-full bg-[var(--surface-muted)]">
              <div className="h-1.5 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
            </div>
            <span className="shrink-0 text-xs font-semibold tabular-nums text-[var(--foreground-muted)]">
              {done}/{total} 완료
            </span>
          </div>
        )}
      </div>

      <div ref={listRef} className="flex-1 overflow-y-auto overscroll-contain px-2 py-3">
        {!groups ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4, 5].map((i) => <div key={i} className="h-9 animate-pulse rounded-lg bg-[var(--surface)]" />)}
          </div>
        ) : (
          groups.map((g) => {
            const open = isOpen(g.key);
            const gDone = g.items.filter((i) => i.completed).length;
            return (
              <div key={g.key} className="mb-1">
                <button
                  onClick={() => toggle(g.key)}
                  className="flex w-full cursor-pointer items-center gap-2 rounded-lg px-2 py-2 text-left hover:bg-[var(--surface)]"
                  aria-expanded={open}
                >
                  <span className={cx("text-[0.65rem] text-[var(--foreground-subtle)] transition-transform", open && "rotate-90")}>▶</span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-[var(--foreground)]">{g.title}</span>
                  {g.badge && <span className="shrink-0 rounded-full bg-[var(--brand-light)] px-1.5 py-0.5 text-[0.65rem] font-bold text-[var(--brand)]">{g.badge}</span>}
                  <span className="shrink-0 text-[0.7rem] tabular-nums text-[var(--foreground-subtle)]">{gDone}/{g.items.length}</span>
                </button>
                {open && (
                  <ul className="mb-2 ml-3 border-l border-[var(--border-light)] pl-1">
                    {g.items.map((i) => {
                      const current = i.key === currentKey;
                      const inner = (
                        <>
                          <span
                            className={cx(
                              "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.6rem] font-bold",
                              i.completed ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-muted)] text-[var(--foreground-subtle)]"
                            )}
                          >
                            {i.completed ? "✓" : i.locked ? "🔒" : ""}
                          </span>
                          <span className="min-w-0 flex-1">
                            {i.label && <span className="block text-[0.7rem] font-semibold text-[var(--foreground-subtle)]">{i.label}</span>}
                            <span className={cx("block truncate text-[0.83rem] leading-snug", current ? "font-bold text-[var(--brand)]" : "text-[var(--foreground)]")}>{i.title}</span>
                          </span>
                          {i.meta && <span className="shrink-0 text-[0.7rem] text-[var(--foreground-subtle)]">{i.meta}</span>}
                        </>
                      );
                      const cls = cx("flex items-center gap-2.5 rounded-lg px-2 py-1.5", current ? "bg-[var(--brand-light)]/70" : "hover:bg-[var(--surface)]");
                      return (
                        <li key={i.key} data-current={current ? "true" : undefined}>
                          {i.locked ? (
                            <Link href={lockedHref ?? backHref} onClick={onNavigate} className={cx(cls, "opacity-55")} title="이용권이 필요해요">
                              {inner}
                            </Link>
                          ) : (
                            <Link href={i.href} onClick={onNavigate} className={cls} aria-current={current ? "page" : undefined}>
                              {inner}
                            </Link>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            );
          })
        )}
      </div>

      <p className="hidden border-t border-[var(--border-light)] px-4 py-2 text-[0.7rem] text-[var(--foreground-subtle)] lg:block">
        키보드 <kbd className="rounded border px-1">[</kbd> <kbd className="rounded border px-1">]</kbd> 이전·다음
      </p>
    </>
  );
}
