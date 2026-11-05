"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Skeleton, cx } from "@/components/ui";
import { AVOID_TOPICS, CONSENT_ITEMS, ConsentDoc, OPTIONAL_ITEMS } from "@/components/tester/ConsentDoc";
import { TesterGate } from "@/components/tester/TesterGate";
import { testerApplyPath, testerRequest, type TesterView } from "@/lib/tester";

/**
 * 테스터 안내·동의 (/tester/:key) — T1 [참여 안내 보기], T2 [동의 내용 보기]
 * 동의 전: 안내를 읽고 듣고 싶지 않은 영역·필수·선택 동의 → 쿠폰 발급.
 * 동의 뒤: 다음 단계, 동의 내용 다시 보기, 영역·선택 동의 바꾸기, [테스트 그만두기].
 */
function Check({ checked, onChange, children }: { checked: boolean; onChange: (v: boolean) => void; children: React.ReactNode }) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-[var(--border-light)] bg-white p-3.5 text-[15px] leading-relaxed text-[var(--foreground)]">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="mt-1 h-5 w-5 flex-none accent-[var(--brand)]" />
      <span>{children}</span>
    </label>
  );
}

function AvoidFields({ acquaintance, topics, other, onTopics, onOther }: { acquaintance: boolean; topics: string[]; other: string; onTopics: (t: string[]) => void; onOther: (v: string) => void }) {
  return (
    <div className="space-y-2">
      {AVOID_TOPICS.filter((t) => acquaintance || !t.acquaintance).map((t) => (
        <Check key={t.key} checked={topics.includes(t.key)} onChange={(on) => onTopics(on ? [...topics, t.key] : topics.filter((x) => x !== t.key))}>
          {t.label}
        </Check>
      ))}
      <label className="block text-sm font-semibold text-[var(--foreground)]">
        그 밖에
        <input value={other} onChange={(e) => onOther(e.target.value)} maxLength={200} className="mt-1.5 h-12 w-full rounded-xl border border-[var(--border)] px-4 text-[15px] font-normal focus:border-[var(--brand)] focus:outline-none" />
      </label>
    </div>
  );
}

const AVOID_INTRO = "상담과 보고서에서 다루지 않았으면 하는 주제가 있으면 골라 주세요. 지금 고르지 않아도 되고, 상담 시작할 때나 상담 중에 바꾸셔도 돼요.";
const AVOID_NOTE = "고르신 주제도 검사 응답에는 담겨 있어서 제가 해석을 준비하며 보게 돼요. 약속드릴 수 있는 것은 상담과 보고서에서 꺼내지 않는 것까지예요. 안전과 관련된 응답이 있으면 고르신 주제여도 여쭤볼 수 있어요.";

export default function TesterPage() {
  const { key } = useParams<{ key: string }>();
  const [view, setView] = useState<TesterView | null>(null);
  const [verify, setVerify] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<Record<string, boolean>>({});
  const [optional, setOptional] = useState<Record<string, boolean>>({});
  const [topics, setTopics] = useState<string[]>([]);
  const [other, setOther] = useState("");
  const [reading, setReading] = useState(false); // 넘어간 뒤 다시 읽기
  const [leaving, setLeaving] = useState(false); // 그만두기 확인

  const apply = useCallback((v: TesterView) => {
    setView(v);
    setTopics(v.avoid.topics);
    setOther(v.avoid.other);
    setOptional({ review: !!v.optional.review?.agreedAt && !v.optional.review?.withdrawnAt, case: !!v.optional.case?.agreedAt && !v.optional.case?.withdrawnAt });
    setVerify(null);
  }, []);

  const load = useCallback(() => {
    void testerRequest<TesterView & { needsVerify?: boolean; nameHint?: string }>(key, "").then((r) => {
      if (r.ok && r.data) apply(r.data);
      else if (r.status === 403 && r.data?.needsVerify) setVerify(r.data.nameHint ?? "");
      else setError(r.message || "안내를 불러오지 못했어요.");
    });
  }, [key, apply]);
  useEffect(load, [load]);

  const send = async (path: string, method: string, body?: unknown) => {
    setBusy(true);
    setError("");
    setMsg("");
    const r = await testerRequest<TesterView>(key, path, { method, body: body === undefined ? undefined : JSON.stringify(body) });
    setBusy(false);
    if (r.ok && r.data) {
      apply(r.data);
      return true;
    }
    setError(r.message || "처리하지 못했어요. 잠시 뒤 다시 해 주세요.");
    return false;
  };

  if (verify !== null) return <TesterGate inviteKey={key} nameHint={verify} onDone={load} />;
  if (error && !view) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!view) return <Skeleton className="mx-auto my-14 h-96 max-w-2xl" />;

  if (view.withdrawnAt) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">테스트 중단을 처리했어요</h1>
        <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">알림은 더 보내지 않아요. 이미 만들어진 기록은 일반 고객과 똑같이 10년 보관한 뒤 파기해요. 궁금한 점은 카카오톡 채널 「심리상담실 현」으로 물어봐 주세요.</p>
      </div>
    );
  }

  if (view.declinedAt && !view.consent && !reading) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">알려 주셔서 고마워요</h1>
        <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">이번에는 넘어갈게요. 다시 연락드리지 않아요. 평소처럼 지내요.</p>
        <button onClick={() => setReading(true)} className="mt-6 cursor-pointer text-sm text-[var(--foreground-subtle)] underline underline-offset-2">
          안내 다시 읽기
        </button>
      </div>
    );
  }

  const need = CONSENT_ITEMS.filter((c) => view.acquaintance || !c.acquaintance);

  // 동의 뒤
  if (view.consent) {
    return (
      <div className="px-4 py-10 sm:py-14">
        <div className="mx-auto max-w-2xl space-y-4">
          <section className="card p-6">
            <h1 className="text-2xl font-bold text-[var(--foreground)]">동의해 주셔서 고마워요</h1>
            {view.applied && view.linkKey ? (
              <>
                <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">신청을 마치셨어요. 다음은 알림톡이 한 걸음씩 안내해요.</p>
                <Link href={`/a/${view.linkKey}`} className="mt-5 flex h-12 items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)]">
                  내 진행 상황 보기
                </Link>
              </>
            ) : (
              <>
                <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">신청에 쓰는 쿠폰을 보내 드렸어요. 쿠폰은 동의를 마치신 분께만 발급돼요.</p>
                <ol className="mt-4 list-decimal space-y-1.5 pl-5 text-[15px] leading-relaxed text-[var(--foreground-muted)]">
                  <li>알림톡으로 쿠폰 안내가 가요.</li>
                  <li>알림톡의 [신청서 쓰기]를 누르고 로그인해요. 계정이 없으면 회원가입을 해요.</li>
                  <li>신청 페이지에서 일정과 방식을 고르고, 결제 화면에서 쿠폰을 쓰면 0원으로 신청돼요.</li>
                  <li>그다음은 알림톡이 한 걸음씩 안내해요.</li>
                </ol>
                {view.coupon ? (
                  <>
                    <p className="mt-4 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
                      {view.coupon.name} · {view.coupon.untilText}까지
                    </p>
                    <Link href={testerApplyPath(key)} className="mt-4 flex h-12 items-center justify-center rounded-xl bg-[var(--brand)] font-semibold text-white hover:bg-[var(--brand-hover)]">
                      신청서 쓰기
                    </Link>
                  </>
                ) : (
                  <p className="mt-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">쿠폰을 준비하고 있어요. 준비되면 김태현 심리상담가가 알려 드려요.</p>
                )}
              </>
            )}
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">듣고 싶지 않은 영역</h2>
            <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{AVOID_INTRO}</p>
            <div className="mt-4">
              <AvoidFields acquaintance={view.acquaintance} topics={topics} other={other} onTopics={setTopics} onOther={setOther} />
            </div>
            <p className="mt-3 text-xs leading-relaxed text-[var(--foreground-subtle)]">{AVOID_NOTE}</p>
            <button
              disabled={busy}
              onClick={async () => {
                if (await send("/avoid", "PUT", { topics, other })) setMsg("바꿨어요.");
              }}
              className="mt-4 h-11 cursor-pointer rounded-xl bg-[var(--surface)] px-5 text-sm font-semibold disabled:opacity-60"
            >
              바꾸기
            </button>
          </section>

          <section className="card p-5 sm:p-6">
            <h2 className="text-lg font-bold text-[var(--foreground)]">선택 동의</h2>
            <p className="mt-2 text-sm text-[var(--foreground-muted)]">언제든 따로 거둘 수 있어요. 이미 게시한 내용은 말씀해 주시면 내려요.</p>
            <div className="mt-3 space-y-2">
              {OPTIONAL_ITEMS.map((o) => (
                <Check key={o.key} checked={!!optional[o.key]} onChange={(v) => setOptional((x) => ({ ...x, [o.key]: v }))}>
                  {o.label}
                </Check>
              ))}
            </div>
            <button
              disabled={busy}
              onClick={async () => {
                if (await send("/optional", "PUT", optional)) setMsg("바꿨어요.");
              }}
              className="mt-4 h-11 cursor-pointer rounded-xl bg-[var(--surface)] px-5 text-sm font-semibold disabled:opacity-60"
            >
              바꾸기
            </button>
          </section>

          {msg && <p className="text-center text-sm text-[var(--brand)]">{msg}</p>}
          {error && <p className="text-center text-sm text-[var(--error)]">{error}</p>}

          <details className="rounded-2xl border border-[var(--border-light)] bg-white p-5">
            <summary className="cursor-pointer font-semibold text-[var(--foreground)]">동의한 내용 다시 보기</summary>
            <p className="mt-3 text-sm text-[var(--foreground-muted)]">{new Date(view.consent.at).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" })}에 동의하셨어요.</p>
            <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-relaxed text-[var(--foreground-muted)]">
              {need.map((c) => (
                <li key={c.key}>{c.label}</li>
              ))}
            </ul>
            <div className="mt-5">
              <ConsentDoc name={view.name} acquaintance={view.acquaintance} />
            </div>
          </details>

          <div className="pt-2 text-center">
            {!leaving ? (
              <button onClick={() => setLeaving(true)} className="cursor-pointer text-sm text-[var(--foreground-subtle)] underline underline-offset-2 hover:text-[var(--error)]">
                테스트 그만두기
              </button>
            ) : (
              <div className="rounded-2xl border border-[var(--border-light)] bg-white p-5 text-left">
                <p className="font-bold text-[var(--foreground)]">테스트를 그만둘까요?</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">이유를 말하지 않으셔도 돼요. 불이익도 없고, 평소처럼 지내요. 이미 만들어진 기록은 일반 고객과 똑같이 10년 보관한 뒤 파기해요.</p>
                <div className="mt-4 flex gap-2">
                  <button onClick={() => setLeaving(false)} className="h-12 flex-1 cursor-pointer rounded-xl bg-[var(--surface)] font-semibold">
                    돌아가기
                  </button>
                  <button disabled={busy} onClick={() => send("/withdraw", "POST")} className="h-12 flex-1 cursor-pointer rounded-xl bg-[var(--foreground)] font-semibold text-white disabled:opacity-60">
                    그만두기
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 동의 전
  const allChecked = need.every((c) => items[c.key]);
  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-4">
        <ConsentDoc name={view.name} acquaintance={view.acquaintance} />

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">듣고 싶지 않은 영역을 골라 주세요</h2>
          <p className="mt-2 text-[15px] leading-relaxed text-[var(--foreground-muted)]">{AVOID_INTRO}</p>
          <div className="mt-4">
            <AvoidFields acquaintance={view.acquaintance} topics={topics} other={other} onTopics={setTopics} onOther={setOther} />
          </div>
          <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">{AVOID_NOTE}</p>
        </section>

        <section className="card p-5 sm:p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">동의</h2>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">필수예요. 모두 표시해야 다음으로 넘어가요.</p>
          <div className="mt-3 space-y-2">
            {need.map((c) => (
              <Check key={c.key} checked={!!items[c.key]} onChange={(v) => setItems((x) => ({ ...x, [c.key]: v }))}>
                {c.label}
              </Check>
            ))}
          </div>
          <p className="mt-5 text-sm text-[var(--foreground-muted)]">선택이에요. 표시하지 않아도 달라지는 것은 없어요. 이 페이지 밖에서 따로 부탁드리지도 않아요.</p>
          <div className="mt-3 space-y-2">
            {OPTIONAL_ITEMS.map((o) => (
              <Check key={o.key} checked={!!optional[o.key]} onChange={(v) => setOptional((x) => ({ ...x, [o.key]: v }))}>
                {o.label}
              </Check>
            ))}
          </div>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">선택 동의는 언제든 따로 거둘 수 있어요. 이미 게시한 내용은 말씀해 주시면 내려요.</p>
        </section>

        {error && <p className="text-center text-sm text-[var(--error)]">{error}</p>}
        <div className="grid gap-2">
          <button
            disabled={busy || !allChecked}
            onClick={() => send("/consent", "POST", { items, optional, avoid: { topics, other } })}
            className={cx("h-14 cursor-pointer rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)]", "disabled:cursor-not-allowed disabled:opacity-40")}
          >
            {busy ? "처리 중…" : "동의하고 다음으로"}
          </button>
          <button disabled={busy} onClick={() => send("/decline", "POST")} className="h-12 cursor-pointer rounded-xl bg-[var(--surface)] font-semibold text-[var(--foreground-muted)] disabled:opacity-60">
            이번에는 넘어갈게요
          </button>
        </div>
      </div>
    </div>
  );
}
