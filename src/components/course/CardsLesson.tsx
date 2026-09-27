"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { apiRequest } from "@/lib/api";
import type { LessonCard } from "@/lib/course";
import { Markdown } from "@/components/workbook/Markdown";
import { Button, cx } from "@/components/ui";

/**
 * 요약카드 차시
 * - 카드 넘기기: 앞면 → 눌러서 뒷면 → "다시 볼게요"/"알아요" · 모르는 카드만 · 섞기
 * - 목록 보기: 앞·뒷면을 한 번에 펼쳐 보기
 * - 아는 카드 번호를 저장(수강생만), 모두 알면 차시 완료
 * 키보드: 스페이스/엔터 뒤집기, ← 다시 볼게요, → 알아요
 */
type Mode = "deck" | "list";

export function CardsLesson({
  endpoint,
  cards,
  enrolled,
  initialKnown,
  onSaved,
}: {
  endpoint: string;
  cards: LessonCard[];
  enrolled: boolean;
  initialKnown: number[];
  onSaved: (completed: boolean) => void;
}) {
  const [mode, setMode] = useState<Mode>("deck");
  const [known, setKnown] = useState<Set<number>>(() => new Set(initialKnown.filter((i) => i < cards.length)));
  const [onlyUnknown, setOnlyUnknown] = useState(false);
  const [order, setOrder] = useState<number[]>(() => cards.map((_, i) => i));
  const [pos, setPos] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pending = useRef<number[] | null>(null);

  // 이번 회차에 볼 카드 (모르는 카드만 보기면 시작 시점 기준으로 고정)
  const [deck, setDeck] = useState<number[]>(order);
  const current = deck[pos];
  const finished = pos >= deck.length;

  const flush = useCallback(() => {
    if (!pending.current || !enrolled) return;
    const body = JSON.stringify({ known: pending.current });
    pending.current = null;
    void apiRequest<{ completed: boolean }>(endpoint, { method: "PUT", body, keepalive: true }).then((res) => {
      if (res.ok && res.data) onSaved(res.data.completed);
    });
  }, [endpoint, enrolled, onSaved]);

  const persist = useCallback(
    (next: Set<number>) => {
      if (!enrolled) return;
      pending.current = [...next].sort((a, b) => a - b);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(flush, 800);
    },
    [enrolled, flush]
  );

  useEffect(
    () => () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      flush();
    },
    [flush]
  );

  const restart = useCallback(
    (opts: { unknownOnly?: boolean; shuffle?: boolean } = {}) => {
      const unknownOnly = opts.unknownOnly ?? onlyUnknown;
      const base = opts.shuffle ? shuffle(cards.map((_, i) => i)) : order;
      if (opts.shuffle) setOrder(base);
      const next = unknownOnly ? base.filter((i) => !known.has(i)) : base;
      setOnlyUnknown(unknownOnly);
      setDeck(next);
      setPos(0);
      setFlipped(false);
    },
    [cards, known, onlyUnknown, order]
  );

  const mark = useCallback(
    (isKnown: boolean) => {
      if (current === undefined) return;
      setKnown((prev) => {
        const next = new Set(prev);
        if (isKnown) next.add(current);
        else next.delete(current);
        persist(next);
        return next;
      });
      setFlipped(false);
      setPos((p) => p + 1);
    },
    [current, persist]
  );

  const toggleKnownInList = (i: number) => {
    setKnown((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      persist(next);
      return next;
    });
  };

  // 키보드
  useEffect(() => {
    if (mode !== "deck" || finished) return;
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t?.closest("input, textarea, select, [contenteditable]")) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " " || e.key === "Enter") {
        if (t?.closest("button, a")) return;
        e.preventDefault();
        setFlipped((f) => !f);
      } else if (e.key === "ArrowLeft") mark(false);
      else if (e.key === "ArrowRight") mark(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mode, finished, mark]);

  const knownPct = Math.round((known.size / Math.max(1, cards.length)) * 100);
  const unknownLeft = cards.length - known.size;
  const card = current !== undefined ? cards[current] : null;
  const groupOf = useMemo(() => cards.map((c) => c.group ?? ""), [cards]);

  return (
    <div>
      {/* 상단: 진행 · 보기 방식 */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="min-w-[10rem] flex-1">
          <div className="flex justify-between text-sm">
            <span className="font-semibold text-[var(--foreground)]">알아요 {known.size} / {cards.length}</span>
            <span className="text-[var(--foreground-muted)]">{knownPct}%</span>
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div className="h-full rounded-full bg-[var(--brand)] transition-all" style={{ width: `${knownPct}%` }} />
          </div>
        </div>
        <div className="flex rounded-xl bg-[var(--surface)] p-1 text-sm font-semibold">
          {(["deck", "list"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx("cursor-pointer rounded-lg px-3.5 py-1.5", mode === m ? "bg-white text-[var(--foreground)] shadow-sm" : "text-[var(--foreground-muted)]")}
            >
              {m === "deck" ? "카드 넘기기" : "목록 보기"}
            </button>
          ))}
        </div>
      </div>

      {!enrolled && <p className="mt-3 text-sm text-[var(--foreground-muted)]">수강 신청하면 &lsquo;알아요&rsquo; 표시가 저장돼요.</p>}

      {mode === "deck" ? (
        <div className="mt-6">
          {finished || !card ? (
            <div className="rounded-2xl bg-[var(--surface)] px-6 py-12 text-center">
              <p className="text-3xl">{unknownLeft === 0 ? "🎉" : "👏"}</p>
              <p className="mt-3 text-lg font-bold text-[var(--foreground)]">
                {deck.length === 0 ? "모르는 카드가 없어요!" : unknownLeft === 0 ? "모든 카드를 알아요!" : `한 바퀴 끝! 아직 모르는 카드 ${unknownLeft}장`}
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-2">
                {unknownLeft > 0 && <Button onClick={() => restart({ unknownOnly: true })}>모르는 카드만 다시</Button>}
                <Button variant="secondary" onClick={() => restart({ unknownOnly: false })}>전체 다시</Button>
                <Button variant="secondary" onClick={() => restart({ shuffle: true })}>섞어서 다시</Button>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center justify-between text-sm text-[var(--foreground-muted)]">
                <span>
                  {pos + 1} / {deck.length}
                  {onlyUnknown && " · 모르는 카드만"}
                </span>
                <span className="flex gap-3">
                  <button onClick={() => restart({ shuffle: true })} className="cursor-pointer hover:text-[var(--foreground)]">🔀 섞기</button>
                  {!onlyUnknown && unknownLeft > 0 && unknownLeft < cards.length && (
                    <button onClick={() => restart({ unknownOnly: true })} className="cursor-pointer hover:text-[var(--foreground)]">모르는 카드만</button>
                  )}
                  {onlyUnknown && (
                    <button onClick={() => restart({ unknownOnly: false })} className="cursor-pointer hover:text-[var(--foreground)]">전체 보기</button>
                  )}
                </span>
              </div>

              <button
                onClick={() => setFlipped((f) => !f)}
                className={cx(
                  "relative flex min-h-[16rem] w-full cursor-pointer flex-col rounded-2xl border-2 px-6 py-7 text-left transition sm:min-h-[18rem] sm:px-8",
                  flipped ? "border-[var(--brand)] bg-white" : "border-transparent bg-[var(--brand-light)]"
                )}
                aria-label={flipped ? "앞면 보기" : "뒷면 보기"}
              >
                <span className="flex items-center justify-between text-xs font-semibold text-[var(--brand)]">
                  <span>{flipped ? "뒷면" : "앞면"}{groupOf[current] ? ` · ${groupOf[current]}` : ""}</span>
                  {known.has(current) && <span className="rounded-full bg-white px-2 py-0.5">알아요</span>}
                </span>
                {flipped ? (
                  <div className="mt-4 text-[var(--foreground)]">
                    <Markdown md={card.back} />
                  </div>
                ) : (
                  <div className="flex flex-1 items-center justify-center py-6">
                    <p className="text-center text-xl font-bold leading-relaxed text-[var(--brand-ink)] sm:text-2xl">{card.front}</p>
                  </div>
                )}
                {!flipped && <span className="text-center text-xs text-[var(--foreground-muted)]">눌러서 뒷면 보기</span>}
              </button>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button onClick={() => mark(false)} className="h-12 cursor-pointer rounded-xl bg-[var(--surface)] font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                  ← 다시 볼게요
                </button>
                <button onClick={() => mark(true)} className="h-12 cursor-pointer rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)]">
                  알아요 →
                </button>
              </div>
              <p className="mt-3 hidden text-center text-xs text-[var(--foreground-subtle)] sm:block">스페이스 뒤집기 · ← 다시 볼게요 · → 알아요</p>
            </>
          )}
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {cards.map((c, i) => (
            <li key={i} className="rounded-2xl border border-[var(--border-light)] px-5 py-4">
              <div className="flex items-start gap-3">
                <span className="mt-0.5 shrink-0 text-xs font-bold text-[var(--brand)]">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  {c.group && <p className="text-xs text-[var(--foreground-subtle)]">{c.group}</p>}
                  <p className="font-semibold text-[var(--foreground)]">{c.front}</p>
                  <div className="mt-2 text-[var(--foreground-muted)]">
                    <Markdown md={c.back} className="!text-[0.95rem]" />
                  </div>
                </div>
                <button
                  onClick={() => toggleKnownInList(i)}
                  className={cx(
                    "shrink-0 cursor-pointer rounded-full px-3 py-1 text-xs font-semibold",
                    known.has(i) ? "bg-[var(--brand-light)] text-[var(--brand)]" : "bg-[var(--surface)] text-[var(--foreground-muted)]"
                  )}
                >
                  {known.has(i) ? "✓ 알아요" : "알아요"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}
