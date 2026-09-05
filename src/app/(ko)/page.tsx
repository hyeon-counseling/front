import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "심리상담실 현 — 나를 이해하는 공부, 편안한 속도로",
  description: "심리상담가 현의 강의, 셀프 워크북, 상담·심리검사. 배우고, 스스로 해보고, 필요하면 함께 이야기합니다.",
};

// ─────────────────────────────────────────────────────────────────
// 한국어 홈 — 단순하게: 한 줄 소개 · 세 가지 길(강의·워크북·상담) · 상담가 소개 · 시작하기
// 강의·워크북 데이터는 S2/S4에서 연결한다.
// ─────────────────────────────────────────────────────────────────

const PATHS = [
  {
    no: "01",
    title: "강의",
    desc: "심리상담가가 직접 설명하는 짧은 강의. 10분씩, 한 편씩. 마음이 움직이는 원리를 배웁니다.",
    href: "/courses",
    cta: "강의 보기",
    status: "곧 공개",
  },
  {
    no: "02",
    title: "셀프 워크북",
    desc: "매일 10분, 나에게 질문하고 기록합니다. 인지행동치료(CBT) 같은 검증된 방법을 하루 단위로 나눴습니다.",
    href: "/workbooks",
    cta: "워크북 보기",
    status: "1주차 무료",
  },
  {
    no: "03",
    title: "상담 · 심리검사",
    desc: "혼자 하기 어려울 때는 함께 이야기합니다. 화상(Google Meet) 또는 대면으로 진행합니다.",
    href: "/counseling",
    cta: "상담 안내",
    status: null,
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ── 히어로 ─────────────────────────────── */}
      <section className="relative overflow-hidden px-4 pb-20 pt-20 sm:px-6 sm:pb-28 sm:pt-28">
        {/* 배경 장식: 옅은 원 하나 */}
        <div
          aria-hidden
          className="pointer-events-none absolute -right-32 -top-32 h-[420px] w-[420px] rounded-full opacity-60"
          style={{ background: "radial-gradient(closest-side, var(--brand-light), transparent 70%)" }}
        />
        <div className="mx-auto max-w-4xl">
          <p className="eyebrow rise rise-1 mb-5">심리상담실 현 · Hyeon Counseling</p>
          <h1 className="font-display rise rise-2 text-[2.4rem] font-bold leading-[1.2] text-[var(--brand-ink)] sm:text-6xl sm:leading-[1.15]">
            나를 이해하는 공부를,
            <br />
            <span className="text-[var(--brand)]">편안한 속도로.</span>
          </h1>
          <p className="rise rise-3 mt-7 max-w-xl text-lg leading-relaxed text-[var(--foreground-muted)]">
            배우고, 스스로 해보고, 필요하면 함께 이야기합니다. 심리상담가 현이 만드는 강의와 워크북, 그리고 상담.
          </p>
          <div className="rise rise-4 mt-10 flex flex-wrap items-center gap-3">
            <Link
              href="/workbooks"
              className="inline-flex items-center rounded-full bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              무료 워크북 시작하기
            </Link>
            <Link href="/courses" className="link-underline px-2 py-3 text-sm text-[var(--foreground)]">
              강의 둘러보기
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl border-t border-[var(--border)]" />

      {/* ── 세 가지 길 ───────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 flex items-end justify-between gap-6 sm:mb-14">
            <h2 className="font-display text-2xl text-[var(--foreground)] sm:text-3xl">세 가지 길</h2>
            <p className="hidden max-w-sm text-right text-sm text-[var(--foreground-muted)] sm:block">
              어디서 시작해도 괜찮습니다. 지금 필요한 것부터.
            </p>
          </div>
          <div className="grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--border)] md:grid-cols-3">
            {PATHS.map((p, i) => (
              <Link
                key={p.no}
                href={p.href}
                className={`group flex flex-col bg-[var(--background)] p-7 transition-colors hover:bg-[var(--surface)] sm:p-9 rise rise-${i + 2}`}
              >
                <div className="mb-8 flex items-center justify-between">
                  <span className="font-display text-sm text-[var(--foreground-subtle)]">{p.no}</span>
                  {p.status && (
                    <span className="rounded-full bg-[var(--brand-light)] px-2.5 py-0.5 text-[0.7rem] font-medium text-[var(--brand)]">
                      {p.status}
                    </span>
                  )}
                </div>
                <h3 className="font-display text-2xl text-[var(--foreground)]">{p.title}</h3>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{p.desc}</p>
                <span className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--brand)]">
                  {p.cta}
                  <span className="transition-transform group-hover:translate-x-1">→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 상담가 소개(요약) ─────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1fr_1.4fr] md:gap-16">
          <div>
            <p className="eyebrow mb-4">상담가</p>
            <h2 className="font-display text-3xl leading-snug text-[var(--foreground)]">
              심리상담가 현
            </h2>
            <ul className="mt-6 space-y-2 text-sm text-[var(--foreground-muted)]">
              <li>상담심리 석사 · 청소년상담 학사</li>
              <li>임상심리사 2급 · 청소년상담사 2급</li>
              <li>인지행동치료(CBT) · 인간중심 · 정신역동 접근</li>
            </ul>
            <Link href="/about" className="link-underline mt-6 inline-block text-sm text-[var(--foreground)]">
              더 알아보기
            </Link>
          </div>
          <blockquote className="font-display border-l-2 border-[var(--brand)] pl-6 text-xl leading-relaxed text-[var(--foreground)] sm:text-2xl">
            힘든 사람들 대부분은 위기가 아니라, 자기 안에서 일어나는 일을 설명할 언어가 없을 뿐이었습니다.
            <span className="mt-4 block text-base text-[var(--foreground-muted)]">
              그래서 쓰고, 가르치고, 함께 이야기합니다. 전문 지식을 누구나 읽고 써볼 수 있는 말로 바꾸는 것이 제 일입니다.
            </span>
          </blockquote>
        </div>
      </section>

      {/* ── 시작하기 ─────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl text-[var(--foreground)] sm:text-4xl">오늘 10분부터.</h2>
          <p className="mt-4 text-[var(--foreground-muted)]">
            회원가입은 이메일 하나면 됩니다. 워크북 1주차는 누구나 무료로 시작할 수 있어요.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="/register"
              className="inline-flex items-center rounded-full bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
            >
              회원가입
            </Link>
            <Link
              href="/articles"
              className="inline-flex items-center rounded-full border border-[var(--border)] px-7 py-3 text-sm font-medium text-[var(--foreground)] transition-colors hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              무료 아티클 읽기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
