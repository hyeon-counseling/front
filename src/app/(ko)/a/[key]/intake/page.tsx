"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { assessRequest } from "@/lib/assessment";
import { Skeleton, cx } from "@/components/ui";
import { VerifyGate } from "@/components/assessment/VerifyGate";
import { useProgress } from "@/components/assessment/useProgress";
import { LinkHelp } from "@/components/assessment/LinkHelp";
import { filled, INTAKE_STEPS, type Answers, type Q } from "@/components/assessment/intakeConfig";

/**
 * 접수면접지 (12-접수면접지-v2) — 10단계, 단계마다 필수 확인, 이 기기에 임시 저장(실패해도 동작).
 * 제출하면 서버가 다시 검사하고, 안전 문항 '예'면 안전 확인 화면으로.
 */
const DRAFT = (k: string) => `hyeon_intake_draft_v2:${k}`;

function loadDraft(key: string): { answers: Answers; step: number } | null {
  try {
    const t = window.localStorage.getItem(DRAFT(key));
    return t ? JSON.parse(t) : null;
  } catch {
    return null;
  }
}
function saveDraft(key: string, answers: Answers, step: number) {
  try {
    window.localStorage.setItem(DRAFT(key), JSON.stringify({ answers, step }));
    return true;
  } catch {
    return false;
  }
}
function clearDraft(key: string) {
  try {
    window.localStorage.removeItem(DRAFT(key));
  } catch {
    // 저장소를 못 쓰는 브라우저
  }
}

const inputCls = "w-full rounded-xl border border-[var(--border)] px-4 focus:border-[var(--brand)] focus:outline-none";

function Question({ q, a, set, bad }: { q: Q; a: Answers; set: (k: string, v: string | string[]) => void; bad: boolean }) {
  const str = (k: string) => (typeof a[k] === "string" ? (a[k] as string) : "");
  const arr = (k: string) => (Array.isArray(a[k]) ? (a[k] as string[]) : []);
  const req = ("required" in q && q.required) || q.kind === "safety" || q.kind === "pledge";
  const fid = `iq-${q.key}`;
  const Label = (
    <label htmlFor={q.kind === "text" || q.kind === "area" ? fid : undefined} className="mb-2 block text-[0.95rem] font-semibold text-[var(--foreground)]">
      {q.label} {req ? <span className="text-[var(--error)]">*</span> : q.kind !== "range" && <span className="text-xs font-normal text-[var(--foreground-subtle)]">선택</span>}
    </label>
  );
  const hint = "hint" in q && q.hint ? <p className="-mt-1 mb-2 text-xs text-[var(--foreground-subtle)]">{q.hint}</p> : null;

  let body: React.ReactNode = null;
  switch (q.kind) {
    case "text":
      body = (
        <input
          id={fid}
          value={str(q.key)}
          maxLength={q.max}
          inputMode={q.numeric ? "numeric" : undefined}
          placeholder={q.placeholder}
          onChange={(e) => {
            let v = e.target.value;
            if (q.key === "phone") {
              const n = v.replace(/\D/g, "").slice(0, 11);
              v = n.length > 7 ? `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}` : n.length > 3 ? `${n.slice(0, 3)}-${n.slice(3)}` : n;
            }
            if (q.key === "age") v = v.replace(/\D/g, "").slice(0, 2);
            set(q.key, v);
          }}
          className={cx(inputCls, "h-12")}
        />
      );
      break;
    case "area": {
      const v = str(q.key);
      body = (
        <>
          {q.examples && (
            <div className="mb-2 flex flex-wrap gap-1.5">
              {q.examples.map((ex) => {
                const used = v.includes(ex);
                return (
                  <button
                    key={ex}
                    type="button"
                    onClick={() => {
                      if (used) set(q.key, v.replace(ex, "").replace(/\n{2,}/g, "\n").replace(/^\n|\n$/g, ""));
                      else {
                        const nv = v.trim() ? `${v.replace(/\s+$/, "")}\n${ex}` : ex;
                        if (nv.length <= q.max) set(q.key, nv);
                      }
                    }}
                    className={cx("cursor-pointer rounded-full px-3 py-1.5 text-left text-xs", used ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]")}
                  >
                    {used ? "✓ " : "+ "}
                    {ex}
                  </button>
                );
              })}
            </div>
          )}
          <textarea id={fid} value={v} maxLength={q.max} placeholder={q.placeholder} rows={4} onChange={(e) => set(q.key, e.target.value)} className={cx(inputCls, "py-3 leading-relaxed")} />
          {q.counter && <p className="mt-1 text-right text-xs text-[var(--foreground-subtle)]">{v.length} / {q.max}</p>}
        </>
      );
      break;
    }
    case "choice": {
      const v = str(q.key);
      const more = q.more && q.more.when.includes(v) ? q.more : null;
      const label = more ? (typeof more.label === "string" ? more.label : more.label[v]) : "";
      const ph = more ? (typeof more.placeholder === "string" ? more.placeholder : more.placeholder[v]) : "";
      body = (
        <>
          <div className="flex flex-wrap gap-2">
            {q.choices.map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={v === c}
                onClick={() => set(q.key, c)}
                className={cx("min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold", v === c ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
              >
                {c}
              </button>
            ))}
          </div>
          {more && (
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium text-[var(--foreground)]">{label}</p>
              <input value={str(more.key)} maxLength={300} placeholder={ph} onChange={(e) => set(more.key, e.target.value)} className={cx(inputCls, "h-12")} />
            </div>
          )}
        </>
      );
      break;
    }
    case "multi": {
      const v = arr(q.key);
      body = (
        <div className="flex flex-wrap gap-2">
          {q.choices.map((c) => {
            const on = v.includes(c);
            return (
              <button
                key={c}
                type="button"
                aria-pressed={on}
                onClick={() => set(q.key, on ? v.filter((x) => x !== c) : [...v, c])}
                className={cx("min-h-11 cursor-pointer rounded-xl px-4 py-2 text-sm font-semibold", on ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
              >
                {on ? "✓ " : ""}
                {c}
              </button>
            );
          })}
        </div>
      );
      break;
    }
    case "rank": {
      const v = arr(q.key);
      body = <RankPicker q={q} value={v} onChange={(nv) => set(q.key, nv)} />;
      if (q.more && v.includes(q.more.when)) {
        body = (
          <>
            {body}
            <div className="mt-3">
              <p className="mb-1.5 text-sm font-medium text-[var(--foreground)]">{q.more.label}</p>
              <input value={str(q.more.key)} maxLength={100} onChange={(e) => set(q.more!.key, e.target.value)} className={cx(inputCls, "h-12")} />
            </div>
          </>
        );
      }
      break;
    }
    case "range": {
      const v = str(q.key) || "0";
      body = (
        <div>
          <div className="flex items-center gap-4">
            <input type="range" min={q.min} max={q.max} value={v} onChange={(e) => set(q.key, e.target.value)} className="flex-1 accent-[var(--brand)]" aria-label={q.label} />
            <span className="w-8 text-center text-xl font-bold text-[var(--brand)]">{v}</span>
          </div>
          <div className="mt-1 flex justify-between text-xs text-[var(--foreground-subtle)]">
            <span>{q.left}</span>
            <span>{q.right}</span>
          </div>
        </div>
      );
      break;
    }
    case "safety": {
      const v = str("safety");
      body = (
        <>
          <div className="grid gap-2 sm:grid-cols-3">
            {["아니요", "예", "말하기 어려워요"].map((c) => (
              <button
                key={c}
                type="button"
                aria-pressed={v === c}
                onClick={() => set("safety", c)}
                className={cx("h-12 cursor-pointer rounded-xl text-sm font-semibold", v === c ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
              >
                {c}
              </button>
            ))}
          </div>
          {v === "말하기 어려워요" && (
            <p className="mt-4 rounded-xl bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
              괜찮아요. 말하기 어려운 마음도 그대로 존중해요. 김태현 심리상담가가 해석 상담 전에 편한 방법으로 안부를 한 번 여쭐게요.
            </p>
          )}
          {v === "예" && (
            <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
              <p className="font-bold text-[var(--foreground)]">말해 주셔서 고마워요</p>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                그런 생각이 들 만큼 힘든 시간을 보내고 계시는군요. 혼자 견디지 않으셔도 돼요. 지금 바로 이야기할 사람이 필요하면 아래로 연락해 주세요. 24시간 받아요.
              </p>
              <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                {[
                  ["자살예방상담전화", "109"],
                  ["정신건강위기상담전화", "1577-0199"],
                  ["지금 위험하다면 (경찰)", "112"],
                  ["지금 위험하다면 (응급)", "119"],
                ].map(([l, n]) => (
                  <li key={n}>
                    <a href={`tel:${n.replace(/-/g, "")}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
                      <span className="text-[var(--foreground-muted)]">{l}</span>
                      <b className="text-[var(--foreground)]">{n}</b>
                    </a>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">이 면접지를 제출하시면 김태현 심리상담가가 24시간 안에 먼저 연락드려요. 검사는 그 뒤에 함께 정해요.</p>
              <div className="mt-3">
                <p className="mb-1.5 text-sm font-medium text-[var(--foreground)]">연락 받기 편한 시간 <span className="text-xs font-normal text-[var(--foreground-subtle)]">선택</span></p>
                <input value={str("callback_time")} maxLength={100} placeholder="예: 평일 저녁 7시 이후, 점심시간" onChange={(e) => set("callback_time", e.target.value)} className={cx(inputCls, "h-12 bg-white")} />
              </div>
            </div>
          )}
        </>
      );
      break;
    }
    case "pledge": {
      const v = arr("pledge");
      body = (
        <ul className="space-y-2">
          {q.items.map((it) => {
            const on = v.includes(it);
            return (
              <li key={it}>
                <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--border-light)] px-4 py-3 text-sm leading-relaxed">
                  <input type="checkbox" checked={on} onChange={() => set("pledge", on ? v.filter((x) => x !== it) : [...v, it])} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]" />
                  {it}
                </label>
              </li>
            );
          })}
        </ul>
      );
      break;
    }
  }

  return (
    <div className={cx("rounded-2xl p-1", bad && "ring-2 ring-red-200")} data-bad={bad ? "1" : undefined}>
      {Label}
      {hint}
      {body}
      {bad && <p className="mt-2 text-sm font-medium text-[var(--error)]">{q.kind === "pledge" ? "네 가지 약속에 모두 체크해 주세요." : q.key === "age" ? "만 19세 이상 나이를 숫자로 적어 주세요." : q.key === "phone" ? "010으로 시작하는 11자리 번호를 적어 주세요." : "이 칸을 채워 주세요."}</p>}
    </div>
  );
}

function RankPicker({ q, value, onChange }: { q: Extract<Q, { kind: "rank" }>; value: string[]; onChange: (v: string[]) => void }) {
  const [msg, setMsg] = useState("");
  const click = (c: string) => {
    setMsg("");
    const i = value.indexOf(c);
    if (i >= 0) return onChange(value.filter((x) => x !== c));
    if (c === q.solo) return onChange([c]);
    const base = value.filter((x) => x !== q.solo);
    if (base.length >= q.max) {
      setMsg(`최대 ${q.max}개까지 고를 수 있어요. 바꾸려면 고른 것을 한 번 더 눌러 빼 주세요.`);
      return;
    }
    onChange([...base, c]);
  };
  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {q.choices.map((c) => {
          const i = value.indexOf(c);
          return (
            <button
              key={c}
              type="button"
              aria-pressed={i >= 0}
              onClick={() => click(c)}
              className={cx("inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold", i >= 0 ? (i === 0 ? "bg-[var(--brand)] text-white" : "bg-[var(--brand-light)] text-[var(--brand)]") : "bg-[var(--surface)] text-[var(--foreground)]")}
            >
              {i >= 0 && <span className={cx("flex h-5 w-5 items-center justify-center rounded-full text-xs", i === 0 ? "bg-white text-[var(--brand)]" : "bg-[var(--brand)] text-white")}>{i + 1}</span>}
              {c}
            </button>
          );
        })}
      </div>
      {value.length > 0 && (
        <p className="mt-2 flex items-center gap-3 text-xs text-[var(--foreground-muted)]">
          {value.map((v, i) => `${i + 1}. ${v}`).join(" · ")}
          <button type="button" onClick={() => onChange([])} className="cursor-pointer underline underline-offset-2">
            다시 고르기
          </button>
        </p>
      )}
      {msg && <p className="mt-2 text-xs text-[var(--warning)]">{msg}</p>}
    </div>
  );
}

export default function IntakePage() {
  const { key } = useParams<{ key: string }>();
  const { view, needsVerify, error, reload } = useProgress(key);
  const [started, setStarted] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [answers, setAnswers] = useState<Answers>({});
  const [step, setStep] = useState(0);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const [savedAt, setSavedAt] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<null | { crisis: boolean }>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 저장소 읽기는 브라우저에서만 — 화면이 그려진 뒤 확인
    const t = setTimeout(() => setHasDraft(!!loadDraft(key)), 0);
    return () => clearTimeout(t);
  }, [key]);

  const set = (k: string, v: string | string[]) => {
    setAnswers((a) => {
      const next = { ...a, [k]: v };
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        if (saveDraft(key, next, step)) {
          const d = new Date();
          setSavedAt(`${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`);
        }
      }, 500);
      return next;
    });
    setBad((b) => {
      if (!b.has(k)) return b;
      const n = new Set(b);
      n.delete(k);
      return n;
    });
  };

  if (needsVerify !== null) return <VerifyGate linkKey={key} nameHint={needsVerify} onDone={reload} />;
  if (error && !view) return <LinkHelp message={error} />;
  if (!view) {
    return (
      <div className="mx-auto max-w-2xl space-y-4 px-4 py-14">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  const back = (
    <Link href={`/a/${key}`} className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">
      내 진행 상황 보기
    </Link>
  );

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-light)] text-3xl text-[var(--brand)]">✓</div>
        <h1 className="mt-5 text-2xl font-bold text-[var(--foreground)]">제출 완료</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">시간 내어 적어 주셔서 고마워요. 김태현 심리상담가가 검사 결과와 함께 꼼꼼히 읽을게요.</p>
        {done.crisis ? (
          <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-left">
            <p className="font-bold text-[var(--foreground)]">상담가가 먼저 연락드릴게요</p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
              김태현 심리상담가가 <b>24시간 안에</b> 직접 연락드려요. 검사 링크는 이야기를 나눈 뒤 편한 때에 보내 드릴게요.
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">그 전에라도 힘들면 109(자살예방상담전화)나 1577-0199로 언제든 전화해 주세요. 지금 위험하다면 112·119로 연락해 주세요.</p>
          </div>
        ) : (
          <div className="mt-8 space-y-3 text-left">
            <div className="rounded-2xl bg-[var(--surface)] p-5">
              <p className="font-semibold text-[var(--foreground)]">제출 확인을 알림톡으로 보내 드려요</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">신청할 때 적은 번호로 곧 도착해요.</p>
            </div>
            <div className="rounded-2xl bg-[var(--brand-light)] p-5">
              <p className="font-semibold text-[var(--foreground)]">내일 아침 8시, 검사 링크</p>
              <p className="mt-1 text-sm text-[var(--foreground-muted)]">MMPI-3 · TCI-RS · SCT 링크 3개가 알림톡으로 한 번에 와요. 검사 마감(해석 상담 7일 전)까지 나눠서 해도 괜찮아요.</p>
            </div>
          </div>
        )}
        <div className="mt-8">{back}</div>
      </div>
    );
  }

  if (view.intakeSubmittedAt || view.stage !== 2 || view.closed) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-[var(--foreground)]">{view.intakeSubmittedAt ? "접수면접지를 이미 냈어요" : "지금은 접수면접지를 쓸 수 없어요"}</h1>
        <p className="mt-2 text-sm text-[var(--foreground-muted)]">고칠 내용이 있으면 카카오톡 채널 「심리상담실 현」으로 말씀해 주세요.</p>
        <div className="mt-6">{back}</div>
      </div>
    );
  }

  if (!started) {
    return (
      <div className="px-4 py-10 sm:px-6 sm:py-14">
        <div className="mx-auto max-w-2xl">
          <p className="text-sm font-semibold text-[var(--foreground-subtle)]">심리상담실 현 · 종합심리검사</p>
          <h1 className="font-display mt-1 text-3xl text-[var(--foreground)]">접수면접지</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">검사 전에 지금의 나를 조금 알려 주세요. 김태현 심리상담가가 검사 결과와 함께 읽어요.</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="card p-5">
              <p className="font-bold text-[var(--foreground)]">왜 쓰나요?</p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                <li><b className="text-[var(--foreground)]">해석이 더 정확해져요.</b> 같은 점수도 요즘 어떤 일을 겪고 있는지에 따라 뜻이 달라져요.</li>
                <li><b className="text-[var(--foreground)]">결과를 내 삶과 연결할 수 있어요.</b></li>
                <li><b className="text-[var(--foreground)]">상담 시간을 핵심에 쓸 수 있어요.</b> 기본 정보를 묻는 대신, 정말 궁금한 이야기를 나눠요.</li>
              </ul>
            </div>
            <div className="card p-5">
              <p className="font-bold text-[var(--foreground)]">어떻게 쓰나요?</p>
              <ul className="mt-2 space-y-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                <li>솔직하게 써 주세요. 맞고 틀린 답은 없어요.</li>
                <li>예시를 눌러도 돼요. 누르면 칸에 들어가고, 내 말로 고쳐 써도 돼요.</li>
                <li>다 쓰는 데 15~20분쯤 걸려요. 중간에 닫아도 이 기기에 임시 저장돼요.</li>
                <li>모르겠거나 쓰기 싫은 질문은 비워도 돼요. 꼭 필요한 칸에만 <span className="text-[var(--error)]">*</span> 표시가 있어요.</li>
              </ul>
            </div>
          </div>
          <p className="mt-4 rounded-xl bg-[var(--surface)] p-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
            <b className="text-[var(--foreground)]">비밀 보장:</b> 적어 주신 내용은 김태현 심리상담가만 보고, 동의 없이 다른 사람에게 알리지 않아요. 다만 본인이나 다른 사람의 생명·안전이 위험할 때, 법으로 정한 경우에는 예외예요.
          </p>
          {hasDraft && (
            <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-[var(--border-light)] px-4 py-3 text-sm">
              <span>작성 중이던 내용이 있어요.</span>
              <button
                onClick={() => {
                  clearDraft(key);
                  setHasDraft(false);
                  setAnswers({});
                }}
                className="cursor-pointer text-[var(--foreground-subtle)] underline underline-offset-2"
              >
                지우고 새로 쓰기
              </button>
            </div>
          )}
          <button
            onClick={() => {
              const d = loadDraft(key);
              if (d) {
                setAnswers(d.answers);
                setStep(Math.min(d.step ?? 0, INTAKE_STEPS.length - 1));
              } else setAnswers((a) => ({ name: view.name, ...a }));
              setStarted(true);
              window.scrollTo(0, 0);
            }}
            className="mt-6 h-14 w-full cursor-pointer rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)]"
          >
            {hasDraft ? "이어서 쓰기" : "시작하기"}
          </button>
        </div>
      </div>
    );
  }

  const cur = INTAKE_STEPS[step];
  const last = step === INTAKE_STEPS.length - 1;
  const pct = Math.round((step / (INTAKE_STEPS.length - 1)) * 100);

  const next = async () => {
    const missing = cur.questions.filter((q) => ("required" in q && q.required) || q.kind === "safety" || q.kind === "pledge").filter((q) => !filled(q, answers)).map((q) => q.key);
    if (missing.length) {
      setBad(new Set(missing));
      setTimeout(() => document.querySelector("[data-bad='1']")?.scrollIntoView({ behavior: "smooth", block: "center" }), 30);
      return;
    }
    if (!last) {
      setStep(step + 1);
      saveDraft(key, answers, step + 1);
      window.scrollTo(0, 0);
      return;
    }
    setBusy(true);
    setSubmitError("");
    const r = await assessRequest<{ crisis: boolean }>(key, "/intake", { method: "POST", body: JSON.stringify({ answers }) });
    setBusy(false);
    if (r.ok && r.data) {
      clearDraft(key);
      setDone({ crisis: r.data.crisis });
      window.scrollTo(0, 0);
      return;
    }
    setSubmitError(r.message || "제출하지 못했어요. 잠시 뒤 다시 눌러 주세요. 적은 내용은 이 기기에 남아 있어요.");
    const field = (r.data as { field?: string } | null)?.field;
    if (field) {
      const keys = field.split(",");
      const at = INTAKE_STEPS.findIndex((s) => s.questions.some((q) => keys.includes(q.key)));
      if (at >= 0) {
        setStep(at);
        setBad(new Set(keys));
      }
    }
  };

  return (
    <div className="px-4 py-8 sm:px-6 sm:py-12">
      <div className="mx-auto max-w-2xl">
        <div className="sticky top-16 z-10 -mx-4 bg-white/95 px-4 py-3 backdrop-blur sm:mx-0 sm:px-0">
          <div className="flex items-center justify-between text-sm">
            <span className="font-bold text-[var(--foreground)]">{cur.title}</span>
            <span className="text-[var(--foreground-subtle)]">
              {step + 1} / {INTAKE_STEPS.length}
            </span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-[var(--surface-muted)]" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
            <div className="h-1.5 rounded-full bg-[var(--brand)] transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>

        <section className="card mt-4 space-y-7 p-6">
          <div>
            <h1 className="text-xl font-bold text-[var(--foreground)]">
              {step + 1}. {cur.title}
            </h1>
            {cur.lead && <p className="mt-1 text-sm text-[var(--foreground-muted)]">{cur.lead}</p>}
          </div>
          {last && (
            <div className="space-y-1.5 rounded-xl bg-[var(--surface)] p-4 text-sm">
              {INTAKE_STEPS.slice(0, -1).map((s) => {
                const n = s.questions.filter((q) => filled(q, answers)).length;
                return (
                  <div key={s.title} className="flex justify-between">
                    <span className="text-[var(--foreground-muted)]">{s.title}</span>
                    <span className={n ? "font-semibold text-[var(--brand)]" : "text-[var(--foreground-subtle)]"}>{n ? `${n} / ${s.questions.length} 작성` : "비워 둠"}</span>
                  </div>
                );
              })}
            </div>
          )}
          {cur.questions.map((q) => (
            <Question key={q.key} q={q} a={answers} set={set} bad={bad.has(q.key)} />
          ))}
          {last && (
            <p className="text-xs text-[var(--foreground-muted)]">
              검사는 마음사랑(MMPI-3·TCI-RS)과 인싸이트(SCT) 온라인 검사로 집에서 받아요. 제출하면 이 기기에 임시 저장된 내용은 지워져요.
            </p>
          )}
        </section>

        {submitError && (
          <p role="alert" className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-[var(--error)]">
            {submitError}
          </p>
        )}
        <div className="mt-5 flex gap-3">
          <button
            onClick={() => {
              setStep(step - 1);
              window.scrollTo(0, 0);
            }}
            className={cx("h-14 flex-1 cursor-pointer rounded-xl bg-[var(--surface)] font-semibold", step === 0 && "invisible")}
          >
            이전
          </button>
          <button onClick={next} disabled={busy} className="h-14 flex-[2] cursor-pointer rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
            {busy ? "보내는 중…" : last ? "제출하기" : "다음"}
          </button>
        </div>
        {savedAt && <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">이 기기에 임시 저장됨 {savedAt}</p>}
      </div>
    </div>
  );
}
