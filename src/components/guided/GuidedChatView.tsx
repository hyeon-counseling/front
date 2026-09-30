"use client";

/**
 * GuidedChatView — guided 차시 대화형 렌더러 (player.js chat 포트)
 * 스텝을 순서대로 재생하며 타이핑 인디케이터 → 말풍선 → 입력 독을 순차 표시한다.
 * react 스텝: 앞선 ask 답에 따라 분기.
 * quiz 스텝: 인라인 퀴즈 위젯.
 * 힘들 때 버튼: 109 · 1577-0199 안전 안내.
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { apiRequest } from "@/lib/api";
import { Character, Sticker } from "@/components/character/Character";
import { GuidedQuiz } from "./GuidedQuiz";
import {
  evalWhen,
  buildEntryValue,
  getEntry,
  resolveCardFrom,
  gad7Band,
  type Step,
  type AskStep,
  type AskChoice,
  type AskText,
  type AskScale,
  type AskGad7,
  type AskAssessment,
  type ReactStep,
  type ExpandStep,
  type Gad7Def,
  type SunGrant,
  type Entries,
} from "@/lib/guided";
import { drawChar, stickerMood, BIG_STICKERS } from "@/components/character/chars";
import type { CharKind } from "@/components/character/chars";

// ─── 타입 ──────────────────────────────────────────────────────────────────

interface Props {
  slug: string;
  lessonKey: string;
  lessonTitle: string;
  lessonLabel?: string;
  lessonMin?: number;
  steps: Step[];
  check?: boolean;
  gad7Def?: Gad7Def | null;
  initialEntries?: Entries;
  canSave?: boolean;
  isDone?: boolean;
  onCompleted?: (sun: SunGrant | null) => void;
  onNext?: () => void;
}

type MsgKind = "s" | "h" | "me";
interface ChatMsg {
  id: number;
  kind: MsgKind;
  text?: string;
  st?: string;
  sticker?: string;
  widget?: ReactNode;
  isTyping?: boolean;
}

// ─── 유틸 ──────────────────────────────────────────────────────────────────

const SAVE_DELAY = 800;
let _msgId = 0;
function newMsg(partial: Omit<ChatMsg, "id">): ChatMsg {
  return { id: ++_msgId, ...partial };
}

function reducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

function wait(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, reducedMotion() ? 60 : ms));
}

function typingDelay(text: string): number {
  return reducedMotion() ? 60 : Math.min(1400, 450 + text.length * 18);
}

// ─── 아바타 미니 SVG ─────────────────────────────────────────────────────────

type Mood = "happy" | "calm" | "sleepy" | "worried" | "wow" | "wink" | "serious" | "idle";

function AvatarMini({ kind, mood }: { kind: CharKind; mood?: Mood }) {
  const svg = drawChar(kind, { mood: mood ?? "idle", arms: false, stage: 2 });
  return (
    <span
      className="live inline-block h-9 w-9 shrink-0"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}

// ─── 메시지 버블 ──────────────────────────────────────────────────────────────

function MsgBubble({ msg }: { msg: ChatMsg }) {
  const isMe = msg.kind === "me";
  const isH = msg.kind === "h";
  const name = isH ? "현 선생님" : "숨이";
  const charKind: CharKind = isH ? "teacher" : "sumi";
  const mood = msg.st ? stickerMood(msg.st) : "idle";

  if (msg.sticker) {
    return (
      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
        {!isMe && <AvatarMini kind={charKind} mood={mood} />}
        <Sticker name={msg.sticker} className="inline-block h-28 w-28" />
      </div>
    );
  }

  if (msg.widget) {
    return (
      <div className={`flex items-start gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
        {!isMe && <AvatarMini kind={charKind} mood={mood} />}
        <div className="flex-1">{msg.widget}</div>
      </div>
    );
  }

  if (msg.isTyping) {
    return (
      <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
        {!isMe && <AvatarMini kind={charKind} />}
        <div className="flex items-center gap-1 rounded-2xl bg-[var(--surface)] px-4 py-3">
          {[0, 1, 2].map((d) => (
            <span
              key={d}
              className="inline-block h-2 w-2 rounded-full bg-[var(--foreground-subtle)]"
              style={{ animation: `chBounce 1s ${d * 0.15}s ease-in-out infinite` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-end gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
      {!isMe && <AvatarMini kind={charKind} mood={mood} />}
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isMe
            ? "bg-[var(--brand)] text-white"
            : "bg-[var(--surface)] text-[var(--foreground)]"
        }`}
      >
        {!isMe && (
          <p className="mb-0.5 text-xs font-semibold text-[var(--foreground-subtle)]">{name}</p>
        )}
        <p className="whitespace-pre-wrap">{msg.text}</p>
      </div>
    </div>
  );
}

// ─── 주요 컴포넌트 ──────────────────────────────────────────────────────────

export function GuidedChatView({
  slug,
  lessonKey,
  lessonTitle,
  lessonLabel,
  lessonMin,
  steps,
  check: _check,
  gad7Def,
  initialEntries = {},
  canSave = true,
  isDone = false,
  onCompleted,
  onNext,
}: Props) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [dock, setDock] = useState<ReactNode>(null);
  const [completed, setCompleted] = useState(isDone);
  const [sun, setSun] = useState<SunGrant | null>(null);
  const [showSos, setShowSos] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const entries = useRef<Entries>(initialEntries);
  const running = useRef(true);
  const saveTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  // react 판단용 답 (단일 선택은 몇 번째를 골랐는지 {__idx}, 저장 안 하는 선택은 id로)
  const reactVals = useRef<Record<string, unknown>>({});
  const [runId, setRunId] = useState(0);

  const scroll = useCallback(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, []);

  const addMsg = useCallback(
    (msg: ChatMsg) => {
      setMsgs((prev) => [...prev, msg]);
      setTimeout(scroll, 50);
      return msg;
    },
    [scroll]
  );

  const saveEntry = useCallback(
    (blockKey: string, value: unknown) => {
      if (!canSave) return;
      void apiRequest(`/api/courses/${slug}/lessons/${lessonKey}/entries/${blockKey}`, {
        method: "PUT",
        body: JSON.stringify({ value }),
      });
    },
    [canSave, slug, lessonKey]
  );

  const scheduleSave = useCallback(
    (blockKey: string, value: unknown, ask?: AskStep) => {
      // key가 없거나 save:false인 입력(예: “할 수 있을 것 같아?”)은 저장하지 않는다
      if (!blockKey || (ask && (!ask.key || (ask as { save?: boolean }).save === false))) return;
      if (saveTimers.current[blockKey]) clearTimeout(saveTimers.current[blockKey]);
      saveTimers.current[blockKey] = setTimeout(() => {
        delete saveTimers.current[blockKey];
        saveEntry(blockKey, value);
      }, SAVE_DELAY);
    },
    [saveEntry]
  );

  // ── 말하기 ────────────────────────────────────────────────────────────────

  const say = useCallback(
    async (who: "s" | "h", text: string, st?: string) => {
      const typing = newMsg({ kind: who, isTyping: true });
      addMsg(typing);
      await wait(typingDelay(text));
      // 타이핑 메시지 교체
      if (st && BIG_STICKERS.has(st)) {
        setMsgs((prev) => {
          const next = prev.filter((m) => m.id !== typing.id);
          return [
            ...next,
            newMsg({ kind: who, sticker: st }),
          ];
        });
        await wait(350);
      } else {
        setMsgs((prev) =>
          prev.map((m) =>
            m.id === typing.id ? { ...m, isTyping: false, text, st } : m
          )
        );
      }
      setTimeout(scroll, 50);
    },
    [addMsg, scroll]
  );

  const addMe = useCallback(
    (text: string) => {
      addMsg(newMsg({ kind: "me", text }));
    },
    [addMsg]
  );

  // ── 입력 위젯들 ───────────────────────────────────────────────────────────

  const askChoice = useCallback(
    (ask: AskChoice): Promise<{ sel: string[]; idx: number }> =>
      new Promise((res) => {
        const isNone = (v: string) => v === ask.none;
        let picked: string[] = [];
        let sending = false;

        const handleToggle = (opt: string, checked: boolean) => {
          if (isNone(opt)) {
            picked = checked ? [] : [];
          } else if (ask.multi) {
            picked = checked ? [...picked, opt] : picked.filter((x) => x !== opt);
          } else {
            // 단일 선택 — 즉시 확정
            const idx = ask.opts.indexOf(opt);
            setDock(null);
            addMe(opt);
            reactVals.current[ask.field && ask.key ? `${ask.key}.${ask.field}` : ask.key ?? ask.id ?? ""] = { __idx: idx, v: opt };
            if (ask.key && (ask as { save?: boolean }).save !== false) {
              const { blockKey, value } = buildEntryValue(ask, ask.field ? { selected: [opt] } : opt, entries.current);
              entries.current = { ...entries.current, [blockKey]: value };
              scheduleSave(blockKey, value, ask);
            }
            res({ sel: [opt], idx });
          }
        };

        const handleNone = () => {
          setDock(null);
          addMe(ask.none!);
          reactVals.current[ask.key ?? ask.id ?? ""] = [];
          const { blockKey, value } = buildEntryValue(ask, ask.field ? { selected: [] } : ask.multi ? [] : null, entries.current);
          entries.current = { ...entries.current, [blockKey]: value };
          scheduleSave(blockKey, value, ask);
          res({ sel: [], idx: -1 });
        };

        const handleSend = (other?: string) => {
          if (sending) return;
          sending = true;
          setDock(null);
          const oth = (other ?? "").trim();
          const displayText = [...picked, ...(oth ? [oth] : [])].join(", ") || (ask.none ?? "없음");
          addMe(displayText);
          reactVals.current[ask.key ?? ask.id ?? ""] = picked;
          const built = buildEntryValue(ask, ask.field ? { selected: picked, ...(oth ? { other: oth } : {}) } : picked, entries.current);
          const blockKey = built.blockKey;
          // 직접 쓴 답은 { selected, other } 의 other 로
          const value = !ask.field && oth ? { ...(built.value as object), other: oth } : built.value;
          entries.current = { ...entries.current, [blockKey]: value };
          scheduleSave(blockKey, value, ask);
          res({ sel: picked, idx: -1 });
        };

        setDock(
          <ChipsDock
            opts={ask.opts}
            multi={!!ask.multi}
            none={ask.none}
            other={!!ask.other}
            picked={[]}
            onToggle={handleToggle}
            onNone={handleNone}
            onSend={ask.multi ? handleSend : undefined}
          />
        );
      }),
    [addMe, scheduleSave]
  );

  const askText = useCallback(
    (ask: AskText): Promise<string> =>
      new Promise((res) => {
        const handleSend = (v: string) => {
          setDock(null);
          if (v) addMe(v);
          reactVals.current[ask.field && ask.key ? `${ask.key}.${ask.field}` : ask.key ?? ""] = v;
          if (ask.key) {
            const { blockKey, value } = buildEntryValue(ask, v, entries.current);
            entries.current = { ...entries.current, [blockKey]: value };
            if (v) scheduleSave(blockKey, value, ask);
          }
          res(v);
        };

        setDock(
          <TextDock
            ask={ask}
            onSend={handleSend}
          />
        );
      }),
    [addMe, scheduleSave]
  );

  const askScale = useCallback(
    (ask: AskScale): Promise<number> =>
      new Promise((res) => {
        const mid = Math.round((ask.min + ask.max) / 2 / ask.step) * ask.step;
        const handleSend = (v: number) => {
          setDock(null);
          addMe(`${v}${ask.unit ?? ""}`);
          reactVals.current[ask.field && ask.key ? `${ask.key}.${ask.field}` : ask.key ?? ""] = v;
          if (ask.key) {
            const { blockKey, value } = buildEntryValue(ask, v, entries.current);
            entries.current = { ...entries.current, [blockKey]: value };
            scheduleSave(blockKey, value, ask);
          }
          res(v);
        };

        setDock(<ScaleDock ask={ask} initial={mid} onSend={handleSend} />);
      }),
    [addMe, scheduleSave]
  );

  // ── assessment 문항별 답 받기 ─────────────────────────────────────────────

  const askAssessment = useCallback(
    async (ask: AskAssessment) => {
      if (!ask.items.length) return;
      await say("s", ask.q);
      const answers: number[] = [];
      for (let r = 0; r < ask.items.length; r++) {
        addMsg(newMsg({ kind: "s", text: `${r + 1}/${ask.items.length}. ${ask.items[r]}` }));
        const score = await new Promise<number>((res) => {
          setDock(
            <ChipsDock
              opts={ask.options.map((o) => o.label)}
              multi={false}
              onToggle={(opt) => {
                const found = ask.options.find((o) => o.label === opt);
                setDock(null);
                addMe(opt);
                res(found?.score ?? 0);
              }}
            />
          );
        });
        answers.push(score);
      }
      const total = answers.reduce((s, x) => s + x, 0);
      // 밴드 찾기
      const band = ask.bands?.find((b) => total >= b.min && total <= b.max);
      const blockKey = ask.key ?? "";
      const value = { answers, score: total, band: band?.label ?? "" };
      entries.current = { ...entries.current, [blockKey]: value };
      reactVals.current[blockKey] = value;
      scheduleSave(blockKey, { answers }, ask);
      // 점수 카드
      addMsg(
        newMsg({
          kind: "s",
          widget: (
            <div className="rounded-2xl bg-[var(--surface)] p-4 text-sm">
              <p className="font-bold text-[var(--brand)]">{ask.q} 점수: {total}점{band ? ` · ${band.label}` : ""}</p>
              {band?.note && <p className="mt-1 text-[var(--foreground-muted)]">{band.note}</p>}
              {/* 심한 불안(alert) 또는 점수 15 이상이면 안전 안내 */}
              {(band?.alert || total >= 15) && (
                <div className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-900">
                  <p className="font-semibold">지금 힘드신가요?</p>
                  <p className="mt-0.5">
                    <a href="tel:109" className="font-semibold underline">109</a> (자살예방) ·{" "}
                    <a href="tel:15770199" className="font-semibold underline">1577-0199</a> (정신건강 위기, 24시간)
                  </p>
                </div>
              )}
            </div>
          ),
        })
      );
    },
    [say, addMsg, addMe, scheduleSave]
  );

  const askGad7 = useCallback(
    async (ask: AskGad7) => {
      const G = gad7Def;
      if (!G) return;
      await say("h", ask.q);
      const ans: number[] = [];
      for (let r = 0; r < G.items.length; r++) {
        addMsg(
          newMsg({
            kind: "h",
            text: `${r + 1} / ${G.items.length}. ${G.items[r]}`,
          })
        );
        const choice = await new Promise<number>((res) => {
          setDock(
            <ChipsDock
              opts={G.options.map(([label]) => label)}
              multi={false}
              onToggle={(opt) => {
                const idx = G.options.findIndex(([l]) => l === opt);
                setDock(null);
                addMe(opt);
                res(G.options[idx][1]);
              }}
            />
          );
        });
        ans.push(choice);
      }
      const score = ans.reduce((s, x) => s + x, 0);
      const band = gad7Band(score);
      const value = { answers: ans, score, band };
      const blockKey = ask.key ?? "";
      entries.current = { ...entries.current, [blockKey]: value };
      reactVals.current[blockKey] = value;
      scheduleSave(blockKey, { answers: ans }, ask);
      // 점수 표시
      addMsg(
        newMsg({
          kind: "h",
          text: `GAD-7 점수: ${score}점 · ${band}`,
        })
      );
    },
    [gad7Def, say, addMsg, addMe, scheduleSave]
  );

  // ── 스텝 루프 ─────────────────────────────────────────────────────────────

  useEffect(() => {
    running.current = true;

    const run = async () => {
      for (const step of steps) {
        if (!running.current) return;

        if ("h" in step) {
          await say("h", step.h, step.st);
        } else if ("s" in step) {
          await say("s", step.s, step.st);
        } else if ("story" in step) {
          await wait(400);
          addMsg(
            newMsg({
              kind: "s",
              widget: (
                <blockquote className="rounded-2xl border-l-4 border-[var(--brand-mint)] bg-[var(--surface)] px-4 py-3">
                  {step.who && (
                    <p className="mb-1 text-xs font-semibold text-[var(--foreground-subtle)]">{step.who}</p>
                  )}
                  <p className="text-sm leading-relaxed text-[var(--foreground)]">{step.story}</p>
                </blockquote>
              ),
            })
          );
          await wait(900);
        } else if ("tip" in step) {
          addMsg(
            newMsg({
              kind: "s",
              widget: (
                <div className="rounded-2xl bg-[var(--brand-light)] px-4 py-3 text-sm text-[var(--brand-ink)]">
                  {step.tip}
                </div>
              ),
            })
          );
          await wait(500);
        } else if ("deep" in step) {
          addMsg(
            newMsg({
              kind: "h",
              widget: (
                <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm">
                  <summary className="cursor-pointer px-4 py-3 font-semibold text-[var(--brand)] outline-none">
                    더 알아보기 · {step.deep.replace(/^더 알아보기 — /, "")}
                  </summary>
                  {step.md.split(/\n\n+/).map((para, j) => (
                    <p key={j} className="px-4 pb-3 pt-1 text-[var(--foreground-muted)]">{para}</p>
                  ))}
                </details>
              ),
            })
          );
          await wait(500);
        } else if ("card" in step) {
          addMsg(
            newMsg({
              kind: "h",
              widget: (
                <div className="rounded-2xl bg-[var(--surface)] p-4">
                  <h4 className="mb-2 text-sm font-bold text-[var(--brand)]">{step.card}</h4>
                  <ul className="space-y-1 text-sm">
                    {(step.items ?? []).map((item, j) => (
                      <li key={j} className="text-[var(--foreground)]">· {item}</li>
                    ))}
                    {(step.from ?? []).map(([label, ref], j) => (
                      <li key={`f${j}`} className="text-[var(--foreground)]">
                        <b className="mr-1 font-semibold text-[var(--foreground-muted)]">{label}</b>
                        {resolveCardFrom(ref, entries.current)}
                      </li>
                    ))}
                  </ul>
                </div>
              ),
            })
          );
          await wait(700);
        } else if ("traps" in step) {
          addMsg(
            newMsg({
              kind: "h",
              widget: (
                <div className="space-y-2">
                  {step.traps.map(([name, desc, example], j) => (
                    <div key={j} className="rounded-xl border border-[var(--border)] p-3">
                      <div className="flex items-center gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand)] text-xs font-bold text-white">
                          {j + 1}
                        </span>
                        <b className="text-xs font-bold">{name}</b>
                      </div>
                      <p className="mt-1 text-xs text-[var(--foreground-muted)]">{desc}</p>
                      <em className="text-xs italic text-[var(--foreground-subtle)]">{example}</em>
                    </div>
                  ))}
                </div>
              ),
            })
          );
          await wait(900);
        } else if ("safety" in step) {
          addMsg(
            newMsg({
              kind: "s",
              widget: <SafetyBox text={typeof step.safety === "string" ? step.safety : undefined} />,
            })
          );
          await wait(600);
        } else if ("paras" in step) {
          // ExpandStep: practice 텍스트 블록 >3문단
          const ex = step as ExpandStep;
          if (ex.paras.length <= 3) {
            // 3개 이하일 경우 (ExpandStep에 들어와도) 그냥 버블
            for (const p of ex.paras) await say("s", p);
          } else {
            // 첫 2개 버블 → 칩 [더 알려줘]/[바로 해 볼래]
            await say("s", ex.paras[0]);
            await say("s", ex.paras[1]);
            const choice = await new Promise<"more" | "skip">((res) => {
              setDock(
                <ChipsDock
                  opts={["더 알려줘", "바로 해 볼래"]}
                  multi={false}
                  onToggle={(opt) => {
                    setDock(null);
                    addMe(opt);
                    res(opt === "더 알려줘" ? "more" : "skip");
                  }}
                />
              );
            });
            if (choice === "more") {
              // 나머지 문단 버블
              for (const p of ex.paras.slice(2)) await say("s", p);
              // 테이블이 있으면 자세히 읽기 카드
              if (ex.md.includes("|")) {
                addMsg(newMsg({ kind: "h", widget: (
                  <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm">
                    <summary className="cursor-pointer px-4 py-3 font-semibold text-[var(--brand)] outline-none">자세히 읽기</summary>
                    <div className="px-4 pb-3 pt-1 text-[var(--foreground-muted)] font-mono text-xs whitespace-pre-wrap">{ex.md}</div>
                  </details>
                ) }));
                await wait(500);
              }
            } else {
              // 자세히 읽기 카드로 접기
              addMsg(newMsg({ kind: "s", widget: (
                <details className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] text-sm">
                  <summary className="cursor-pointer px-4 py-3 font-semibold text-[var(--brand)] outline-none">자세히 읽기</summary>
                  <div className="space-y-2 px-4 pb-3 pt-1">
                    {ex.paras.map((p, i) => (
                      <p key={i} className="text-sm leading-relaxed text-[var(--foreground-muted)]">{p}</p>
                    ))}
                  </div>
                </details>
              ) }));
              await wait(500);
            }
          }
        } else if ("ask" in step) {
          const ask = step as AskStep;
          if (ask.ask === "go") {
            await new Promise<void>((res) => {
              setDock(
                <div className="flex flex-wrap gap-2 p-3">
                  {ask.opts.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setDock(null); addMe(opt); res(); }}
                      className="cursor-pointer rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white"
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              );
            });
          } else if (ask.ask === "choice") {
            await askChoice(ask as AskChoice);
          } else if (ask.ask === "text") {
            await askText(ask as AskText);
          } else if (ask.ask === "scale") {
            await askScale(ask as AskScale);
          } else if (ask.ask === "gad7") {
            await askGad7(ask as AskGad7);
          } else if (ask.ask === "assessment") {
            await askAssessment(ask as AskAssessment);
          } else if (ask.ask === "table") {
            await say("s", ask.q);
            // 테이블은 채팅에서 단순화: 행별로 상황+불안 묻기
            const rows: { situation: string; level: number }[] = [];
            for (let r = 0; r < ask.rows; r++) {
              if (r > 0) {
                const moreRes = await new Promise<boolean>((res2) => {
                  setDock(
                    <ChipsDock
                      opts={["있어", "여기까지"]}
                      multi={false}
                      onToggle={(opt) => { setDock(null); addMe(opt); res2(opt === "있어"); }}
                    />
                  );
                });
                if (!moreRes) break;
              }
              const situation = await askText({ ask: "text", q: "", ph: "상황을 간단히 적어요", short: true });
              await say("s", "그때 불안은 몇 정도야?");
              const level = await askScale({ ask: "scale", q: "불안 수준", min: 0, max: 100, step: 5, lo: "전혀", hi: "가장 심함" });
              rows.push({ situation, level });
            }
            const { blockKey, value } = buildEntryValue(ask, { rows }, entries.current);
            entries.current = { ...entries.current, [blockKey]: value };
            scheduleSave(blockKey, value, ask);
          }
        } else if ("react" in step) {
          const rs = step as ReactStep;
          const on = rs.react.on;
          const v = on in reactVals.current ? reactVals.current[on] : getEntry(entries.current, on);
          const match = rs.react.cases.find((c) => evalWhen(c.when, v));
          if (match) {
            if (match.s) await say("s", match.s, match.st);
            if (match.h) await say("h", match.h, match.st);
            if (match.safety) {
              addMsg(newMsg({ kind: "s", widget: <SafetyBox /> }));
            }
          }
        } else if ("quiz" in step) {
          await wait(300);
          await new Promise<void>((res) => {
            addMsg(
              newMsg({
                kind: "h",
                widget: (
                  <GuidedQuiz
                    quiz={step.quiz}
                    courseSlug={slug}
                    lessonKey={lessonKey}
                    canSave={canSave}
                    onAnswered={() => setTimeout(res, 1200)}
                  />
                ),
              })
            );
          });
        }
      }

      // 완료
      const res = await apiRequest<{ completed: boolean; sun?: SunGrant | null }>(
        `/api/courses/${slug}/lessons/${lessonKey}/progress`,
        { method: "PUT", body: JSON.stringify({ completed: true }) }
      );
      const s = res.ok ? (res.data?.sun ?? null) : null;
      setCompleted(true);
      setSun(s);
      onCompleted?.(s);

      setDock(
        <div className="flex flex-wrap gap-2 p-3">
          <button
            type="button"
            onClick={
              onNext ??
              (() => {
                setMsgs([]);
                setDock(null);
                setSun(null);
                setCompleted(false);
                reactVals.current = {};
                setRunId((r) => r + 1);
              })
            }
            className="cursor-pointer rounded-xl bg-[var(--brand)] px-5 py-2 text-sm font-semibold text-white"
          >
            {onNext ? "다음 레슨 →" : "처음부터 다시"}
          </button>
        </div>
      );
    };

    void run();

    return () => {
      running.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  return (
    <div className="flex h-[calc(100dvh-120px)] min-h-[500px] flex-col">
      {/* 헤더 */}
      <div className="flex items-center justify-between border-b border-[var(--border-light)] px-4 py-3">
        <div className="flex items-center gap-3">
          <span className="live inline-block h-10 w-10">
            <Character kind="sumi" mood="happy" arms={false} live />
          </span>
          <div>
            <p className="text-sm font-bold text-[var(--foreground)]">
              {lessonLabel && <span className="mr-1">{lessonLabel} ·</span>}
              {lessonTitle}
            </p>
            <p className="text-xs text-[var(--foreground-subtle)]">
              약 {lessonMin}분 · 숨이 · 현 선생님
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowSos((v) => !v)}
          className="cursor-pointer rounded-xl bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 hover:bg-amber-100"
        >
          힘들 때
        </button>
      </div>

      {/* SOS 안내 */}
      {showSos && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-bold">혼자 버티지 않아도 돼요</p>
          <p className="mt-1">
            지금 많이 힘들다면{" "}
            <a href="tel:109" className="font-semibold underline">109</a>{" "}
            (자살예방) ·{" "}
            <a href="tel:1577-0199" className="font-semibold underline">1577-0199</a>{" "}
            (정신건강 위기, 24시간)에서 바로 이야기할 수 있어요.
          </p>
        </div>
      )}

      {/* 채팅 로그 */}
      <div
        ref={logRef}
        className="flex-1 space-y-4 overflow-y-auto px-4 py-4"
        aria-live="polite"
        aria-label="대화 내용"
      >
        {msgs.map((msg) => (
          <MsgBubble key={msg.id} msg={msg} />
        ))}

        {/* 완료·햇살 */}
        {completed && sun && (
          <div className="flex items-center gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <span className="text-xl">&#9728;&#65039;</span>
            <span>
              <b>햇살 +{sun.granted}</b> · {sun.reason}
              {sun.capped && " (오늘 최대)"}
            </span>
          </div>
        )}
      </div>

      {/* 입력 독 */}
      {dock && (
        <div className="border-t border-[var(--border)] bg-white">
          {dock}
        </div>
      )}
    </div>
  );
}

// ─── 입력 독 하위 컴포넌트 ─────────────────────────────────────────────────

function ChipsDock({
  opts,
  multi,
  none,
  other,
  picked: initialPicked = [],
  onToggle,
  onNone,
  onSend,
}: {
  opts: string[];
  multi: boolean;
  none?: string;
  other?: boolean;
  picked?: string[];
  onToggle: (opt: string, checked: boolean) => void;
  onNone?: () => void;
  onSend?: (other?: string) => void;
}) {
  const [picked, setPicked] = useState<string[]>(initialPicked);
  const [otherVal, setOtherVal] = useState("");

  return (
    <div className="p-3">
      <div className="flex flex-wrap gap-2">
        {opts.map((opt) => {
          const selected = picked.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              aria-pressed={selected}
              onClick={() => {
                if (!multi) {
                  onToggle(opt, true);
                  return;
                }
                const next = selected ? picked.filter((x) => x !== opt) : [...picked, opt];
                setPicked(next);
                onToggle(opt, !selected);
              }}
              className={`cursor-pointer rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
                selected
                  ? "border-[var(--brand)] bg-[var(--brand-light)] text-[var(--brand)]"
                  : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--brand)]"
              }`}
            >
              {opt}
            </button>
          );
        })}
        {none && (
          <button
            type="button"
            onClick={() => onNone?.()}
            className="cursor-pointer rounded-xl border border-[var(--border)] bg-white px-4 py-2 text-sm font-medium text-[var(--foreground-muted)] hover:border-[var(--brand)]"
          >
            {none}
          </button>
        )}
      </div>
      {other && (
        <input
          type="text"
          placeholder="직접 쓰기 (선택)"
          value={otherVal}
          onChange={(e) => setOtherVal(e.target.value)}
          aria-label="직접 쓰기"
          className="mt-2 w-full rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--brand)]"
        />
      )}
      {multi && onSend && (
        <button
          type="button"
          disabled={picked.length === 0 && !otherVal.trim()}
          onClick={() => onSend(otherVal)}
          className="mt-2 w-full cursor-pointer rounded-xl bg-[var(--brand)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          다 골랐어
        </button>
      )}
    </div>
  );
}

function TextDock({ ask, onSend }: { ask: AskText; onSend: (v: string) => void }) {
  const [val, setVal] = useState("");
  return (
    <div className="p-3">
      {ask.samples && (
        <div className="mb-2 flex flex-wrap gap-2">
          {ask.samples.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setVal(s)}
              className="cursor-pointer rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-1.5 text-xs text-[var(--foreground-muted)] hover:border-[var(--brand)]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <textarea
          id="ch-text"
          rows={ask.short ? 1 : 2}
          placeholder={ask.ph ?? "여기에 적어요"}
          value={val}
          onChange={(e) => setVal(e.target.value)}
          aria-label="답 쓰기"
          className="flex-1 resize-none rounded-xl border border-[var(--border)] px-3 py-2 text-sm outline-none focus-visible:border-[var(--brand)]"
        />
        <button
          type="button"
          disabled={!val.trim()}
          onClick={() => onSend(val.trim())}
          aria-label="보내기"
          className="cursor-pointer self-end rounded-xl bg-[var(--brand)] px-3 py-2 text-sm font-bold text-white disabled:opacity-50"
        >
          ↑
        </button>
      </div>
      {ask.optional && (
        <button
          type="button"
          onClick={() => onSend("")}
          className="mt-2 cursor-pointer text-xs text-[var(--foreground-subtle)] underline"
        >
          건너뛰기
        </button>
      )}
    </div>
  );
}

function ScaleDock({ ask, initial, onSend }: { ask: AskScale; initial: number; onSend: (v: number) => void }) {
  const [val, setVal] = useState(initial);
  return (
    <div className="p-4">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-[var(--foreground-muted)]">{ask.q}</span>
        <b className="text-lg font-bold text-[var(--brand)]">
          {val}
          {ask.unit && <small className="ml-0.5 text-sm font-normal">{ask.unit}</small>}
        </b>
      </div>
      <input
        type="range"
        min={ask.min}
        max={ask.max}
        step={ask.step}
        value={val}
        onChange={(e) => setVal(Number(e.target.value))}
        className="w-full accent-[var(--brand)]"
        aria-label={ask.q}
      />
      <div className="mt-1 flex justify-between text-xs text-[var(--foreground-subtle)]">
        <span>{ask.lo ?? ask.min}</span>
        <span>{ask.hi ?? ask.max}</span>
      </div>
      <button
        type="button"
        onClick={() => onSend(val)}
        className="mt-3 w-full cursor-pointer rounded-xl bg-[var(--brand)] py-2 text-sm font-semibold text-white"
      >
        이 정도야
      </button>
    </div>
  );
}

function SafetyBox({ text }: { text?: string }) {
  return (
    <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-900">
      <p className="font-bold">혼자 버티지 않아도 돼요</p>
      <p className="mt-1">
        {text ??
          "지금 많이 힘들다면 자살예방 상담전화 109 · 정신건강 위기상담 1577-0199 (24시간)에서 바로 이야기할 수 있어요."}
      </p>
    </div>
  );
}
