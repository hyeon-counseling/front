"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { assessRequest } from "@/lib/assessment";
import { Skeleton, cx } from "@/components/ui";

/**
 * 테스터 서비스 점검 설문 (/a/:key/tester-survey) — T3 [설문 쓰기], 54-테스터-프로그램 04 문안 그대로.
 * 사람마다 다른 링크로 들어오므로 이름·연락처를 묻지 않고, 휴대폰 뒤 4자리도 묻지 않는다. 모든 문항은 건너뛸 수 있다.
 */
type Answers = Record<string, string | number>;

const SCALE_EASY = ["전혀 아니에요", "어려운 곳이 많았어요", "보통이에요", "대체로 쉬웠어요", "쉬웠어요"];

function Scale({ name, labels, value, onChange }: { name: string; labels: string[]; value: unknown; onChange: (v: number) => void }) {
  return (
    <div className="mt-3 grid gap-1.5">
      {labels.map((l, i) => (
        <button
          key={l}
          type="button"
          aria-pressed={value === i + 1}
          aria-label={`${name} ${i + 1}번 ${l}`}
          onClick={() => onChange(i + 1)}
          className={cx("min-h-11 cursor-pointer rounded-xl border px-4 py-2 text-left text-[15px]", value === i + 1 ? "border-[var(--brand)] bg-[var(--brand-light)] font-semibold text-[var(--brand)]" : "border-[var(--border)] bg-white")}
        >
          {"①②③④⑤"[i]} {l}
        </button>
      ))}
    </div>
  );
}

function Choice({ options, value, onChange }: { options: string[]; value: unknown; onChange: (v: string) => void }) {
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          aria-pressed={value === o}
          onClick={() => onChange(o)}
          className={cx("min-h-11 cursor-pointer rounded-xl border px-3.5 py-2 text-[15px]", value === o ? "border-[var(--brand)] bg-[var(--brand-light)] font-semibold text-[var(--brand)]" : "border-[var(--border)] bg-white")}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

function Text({ value, onChange, label }: { value: unknown; onChange: (v: string) => void; label: string }) {
  return <textarea aria-label={label} value={typeof value === "string" ? value : ""} onChange={(e) => onChange(e.target.value)} maxLength={2000} rows={3} className="mt-3 w-full rounded-xl border border-[var(--border)] px-4 py-3 leading-relaxed focus:border-[var(--brand)] focus:outline-none" />;
}

function Q({ no, children, title }: { no: number; title: string; children: React.ReactNode }) {
  return (
    <div className="border-t border-[var(--border-light)] pt-5 first:border-t-0 first:pt-0">
      <p className="font-semibold leading-relaxed text-[var(--foreground)]">
        {no}. {title}
      </p>
      {children}
    </div>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="card space-y-5 p-5 sm:p-6">
      <h2 className="text-sm font-bold text-[var(--brand)]">{title}</h2>
      {children}
    </section>
  );
}

export default function TesterSurveyPage() {
  const { key } = useParams<{ key: string }>();
  const [state, setState] = useState<{ submitted: boolean; closed: boolean } | null>(null);
  const [error, setError] = useState("");
  const [a, setA] = useState<Answers>({});
  const [busy, setBusy] = useState(false);
  const set = (k: string) => (v: string | number) => setA((x) => ({ ...x, [k]: v }));

  useEffect(() => {
    assessRequest<{ submitted: boolean; closed: boolean }>(key, "/tester-survey").then((r) => (r.ok && r.data ? setState(r.data) : setError(r.message || "설문을 불러오지 못했어요.")));
  }, [key]);

  if (error && !state) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">{error}</p>;
  if (!state) return <Skeleton className="mx-auto my-14 h-96 max-w-2xl" />;
  if (state.submitted) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold text-[var(--foreground)]">고마워요</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">답해 주신 내용은 서비스를 고치는 데 써요.</p>
      </div>
    );
  }
  if (state.closed) return <p className="px-4 py-24 text-center text-[var(--foreground-muted)]">지금은 설문을 받지 않아요.</p>;

  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await assessRequest(key, "/tester-survey", { method: "POST", body: JSON.stringify({ answers: a }) });
    setBusy(false);
    if (r.ok) setState({ submitted: true, closed: false });
    else setError(r.message || "보내지 못했어요. 잠시 뒤 다시 해 주세요.");
  };

  return (
    <div className="px-4 py-10 sm:py-14">
      <div className="mx-auto max-w-2xl space-y-4">
        <header className="px-1">
          <h1 className="text-2xl font-bold text-[var(--foreground)]">서비스 점검 설문</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--foreground-muted)]">
            서비스가 어땠는지 알려 주세요. 검사 결과나 상담에서 나눈 내용은 묻지 않아요. 답에도 적지 않으셔도 돼요.
            <br />
            쓰지 않으시거나 불편했던 점만 쓰셔도 보고서와 영상은 그대로 볼 수 있어요.
            <br />
            답은 김태현 심리상담가가 직접 읽어요. 이름은 적지 않아요. 적기 곤란한 것은 비워 두세요.
          </p>
        </header>

        <Group title="동선">
          <Q no={1} title="동의부터 신청, 쿠폰 사용까지 막힘 없이 진행됐나요?">
            <Scale name="1번" labels={["전혀 아니에요", "조금 막혔어요", "보통이에요", "대체로 괜찮았어요", "막힘 없었어요"]} value={a.q1} onChange={set("q1")} />
          </Q>
          <Q no={2} title="가장 오래 멈춘 곳은 어디였나요? 하나만 골라 주세요.">
            <Choice options={["동의 페이지", "신청서", "쿠폰·결제 화면", "접수면접지", "검사 시작", "내 진행 상황 페이지", "보고서·영상 찾기", "PDF 저장", "없어요"]} value={a.q2} onChange={set("q2")} />
          </Q>
        </Group>

        <Group title="안내 문구">
          <Q no={3} title="안내 글은 이해하기 쉬웠나요?">
            <Scale name="3번" labels={SCALE_EASY} value={a.q3} onChange={set("q3")} />
          </Q>
          <Q no={4} title="무슨 뜻인지 헷갈렸던 말이나 문장이 있으면 적어 주세요.">
            <Text label="4번 답" value={a.q4} onChange={set("q4")} />
          </Q>
        </Group>

        <Group title="알림">
          <Q no={5} title="알림 횟수는 어땠나요?">
            <Choice options={["너무 많았어요", "조금 많았어요", "알맞았어요", "부족했어요"]} value={a.q5} onChange={set("q5")} />
          </Q>
          <Q no={6} title="시간이나 내용이 맞지 않았던 알림이 있었나요? 어떤 알림이었는지 적어 주세요.">
            <Text label="6번 답" value={a.q6} onChange={set("q6")} />
          </Q>
        </Group>

        <Group title="보고서와 영상">
          <Q no={7} title="보고서의 말과 구성은 이해하기 쉬웠나요? 내용이 아니라 쓰인 방식을 생각해 주세요.">
            <Scale name="7번" labels={SCALE_EASY} value={a.q7} onChange={set("q7")} />
          </Q>
          <Q no={8} title="보고서와 해석 영상 중 다시 본 것을 골라 주세요. 영상 길이와 보기 편한 정도도 적어 주셔도 돼요.">
            <Choice options={["보고서", "해석 영상", "둘 다", "다시 보지 않았어요"]} value={a.q8} onChange={set("q8")} />
            <Text label="8번 의견" value={a.q8note} onChange={set("q8note")} />
          </Q>
        </Group>

        <Group title="상담 경험">
          <Q no={9} title="해석 상담을 하며 궁금한 것을 물어보거나 말하기 편했나요? 상담 시간 60분은 어땠나요?">
            <p className="mt-3 text-sm font-semibold text-[var(--foreground-muted)]">편했나요</p>
            <Scale name="9번" labels={["전혀 아니에요", "조금 불편했어요", "보통이에요", "대체로 편했어요", "편했어요"]} value={a.q9} onChange={set("q9")} />
            <button
              type="button"
              aria-pressed={a.q9 === 0}
              onClick={() => set("q9")(0)}
              className={cx("mt-1.5 min-h-11 w-full cursor-pointer rounded-xl border px-4 py-2 text-left text-[15px]", a.q9 === 0 ? "border-[var(--brand)] bg-[var(--brand-light)] font-semibold text-[var(--brand)]" : "border-[var(--border)] bg-white")}
            >
              말하고 싶지 않아요
            </button>
            <p className="mt-4 text-sm font-semibold text-[var(--foreground-muted)]">시간</p>
            <Choice options={["짧았어요", "알맞았어요", "길었어요"]} value={a.q9time} onChange={set("q9time")} />
          </Q>
        </Group>

        <Group title="불편한 점">
          <Q no={10} title="불편했던 점이나 정식으로 열기 전에 하나만 고친다면 무엇을 고치고 싶은지 적어 주세요. 쓴소리도 괜찮아요.">
            <Text label="10번 답" value={a.q10} onChange={set("q10")} />
          </Q>
        </Group>

        {error && <p className="text-center text-sm text-[var(--error)]">{error}</p>}
        <button disabled={busy} onClick={submit} className="h-14 w-full cursor-pointer rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60">
          {busy ? "보내는 중…" : "보내기"}
        </button>
      </div>
    </div>
  );
}
