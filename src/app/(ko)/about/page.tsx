import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "소개",
  description: "심리상담실 현과 상담가 현을 소개합니다. 상담심리 석사, 임상심리사 2급·청소년상담사 2급.",
};

const APPROACH = [
  { n: "1", t: "근거 있는 이야기만", d: "강의와 워크북의 모든 개념은 검증된 심리학 연구와 임상 실무에 뿌리를 둡니다. 새 이론을 만들지 않고, 좋은 이론을 쉬운 말로 옮깁니다." },
  { n: "2", t: "복잡함보다 명료함", d: "학술 용어는 심리학을 멀게 느끼게 합니다. 강의처럼 들리지 않고 대화처럼 읽히도록 씁니다." },
  { n: "3", t: "각자의 속도로", d: "성장은 정해진 일정대로 오지 않습니다. 오늘 10분, 내일 다시. 필요할 때 다시 꺼내 볼 수 있게 만듭니다." },
  { n: "4", t: "교육이지 치료가 아닙니다", d: "이곳의 콘텐츠는 심리 교육 도구입니다. 임상적 진단·치료를 대체하지 않으며, 심각한 어려움에는 전문가의 도움을 권합니다." },
];

export default function AboutPage() {
  return (
    <div>
      <section className="px-4 pb-16 pt-16 sm:px-6 sm:pb-24 sm:pt-24">
        <div className="mx-auto max-w-3xl">
          <p className="eyebrow rise rise-1 mb-4">소개</p>
          <h1 className="font-display rise rise-2 text-4xl leading-tight text-[var(--brand-ink)] sm:text-5xl">
            심리 지식을,
            <br />
            누구나 쓸 수 있는 말로.
          </h1>
          <p className="rise rise-3 mt-6 text-lg leading-relaxed text-[var(--foreground-muted)]">
            심리상담실 현은 하나의 믿음에서 시작했습니다. 근거 있는 심리학 지식은 오랜 치료를 감당할 수 있는 사람만이 아니라, 자신을 더 이해하고 싶은 모든 사람에게 열려 있어야 한다는 것.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-3xl border-t border-[var(--border)]" />

      {/* 상담가 */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-3xl border border-[var(--border-light)] bg-[var(--surface)] p-8 sm:p-10">
            <div className="mb-6 flex items-center gap-4">
              <div className="font-display flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-2xl font-bold text-white">
                현
              </div>
              <div>
                <p className="text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">상담가 · 운영자</p>
                <h2 className="font-display text-xl text-[var(--foreground)]">심리상담가 현 (김태현)</h2>
              </div>
            </div>
            <div className="mb-6 flex flex-wrap gap-2">
              {["상담심리 석사", "청소년상담 학사", "임상심리사 2급", "청소년상담사 2급", "서울"].map((b) => (
                <span key={b} className="rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
                  {b}
                </span>
              ))}
            </div>
            <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
              <p>
                청소년상담을 전공하고 상담심리 석사를 마쳤습니다. 개인상담과 발달심리, 인지행동치료(CBT)·인간중심·정신역동 접근을 공부하고 임상에서 사용해 왔습니다.
              </p>
              <p>
                청소년과 성인을 만나면서 반복해서 보게 된 장면이 있습니다. 힘들어하는 사람들 대부분은 위기 상태가 아니었습니다. 다만 자기 안에서 무슨 일이 일어나는지 설명할 언어와 틀이 없었을 뿐입니다. 믿을 만한, 손에 잡히는 마음의 지도가 필요했습니다.
              </p>
              <p>
                그래서 쓰기 시작했고, 이제는 강의와 워크북으로 옮기고 있습니다. 임상 심리학 지식을 누구나 읽고, 곱씹고, 실제로 써볼 수 있는 말로 바꾸는 것이 제 일입니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 접근 */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display mb-10 text-2xl text-[var(--foreground)] sm:text-3xl">일하는 방식</h2>
          <div className="space-y-8">
            {APPROACH.map((a) => (
              <div key={a.n} className="flex gap-5">
                <div className="font-display mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm text-[var(--brand)]">
                  {a.n}
                </div>
                <div>
                  <h3 className="mb-1 font-semibold text-[var(--foreground)]">{a.t}</h3>
                  <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">{a.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 두 채널 */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="font-display mb-3 text-2xl text-[var(--foreground)]">두 개의 이름, 하나의 일</h2>
          <p className="mb-8 text-sm text-[var(--foreground-muted)]">
            한국에서는 <strong className="text-[var(--foreground)]">심리상담실 현</strong>, 해외에서는 <strong className="text-[var(--foreground)]">Hyeon Counseling</strong>이라는 이름으로 같은 일을 합니다.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <p className="eyebrow mb-1">한국어</p>
              <h3 className="font-display text-lg text-[var(--foreground)]">심리상담실 현</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">강의 · 셀프 워크북 · 상담과 심리검사. 이 사이트입니다.</p>
            </div>
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <p className="eyebrow mb-1">English</p>
              <h3 className="font-display text-lg text-[var(--foreground)]">Hyeon Counseling</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">
                영어 전자책과 아티클.{" "}
                <Link href="/en" className="link-underline text-[var(--foreground)]">
                  English site →
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
