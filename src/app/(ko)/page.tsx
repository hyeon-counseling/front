import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "심리상담실 현 — 나를 이해하는 공부, 편안한 속도로",
  description: "심리상담가 현의 강의, 셀프 워크북, 상담·심리검사. 배우고, 스스로 해보고, 필요하면 함께 이야기합니다.",
};

// ─────────────────────────────────────────────────────────────────
// 한국어 홈 (v2: 한국형 SaaS 톤)
//   히어로(좌 카피 + 우 제품 미리보기 카드) → 서비스 3종 카드 → 진행 방식 → 워크북 미리보기 → 상담가 → FAQ 요약 → CTA
// 강의·워크북 실데이터는 S2/S4에서 연결한다.
// ─────────────────────────────────────────────────────────────────

const SERVICES = [
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
    ),
    title: "강의",
    tag: "곧 공개",
    desc: "심리상담가가 직접 설명하는 10분 강의. 겉으로는 괜찮아 보여도 안에서 지쳐 있는 마음, 고기능 우울증부터.",
    href: "/courses",
    cta: "강의 보기",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9" /><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" /></svg>
    ),
    title: "셀프 워크북",
    tag: "1주차 무료",
    desc: "매일 10분, 질문에 답하고 기록합니다. 인지행동치료(CBT)를 60일 일차로 나눈 '불안과 함께 살기'부터.",
    href: "/workbooks",
    cta: "무료로 시작",
  },
  {
    icon: (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
    ),
    title: "상담 · 심리검사",
    tag: "화상 · 대면",
    desc: "혼자 하기 어려울 때는 함께 이야기합니다. Google Meet 화상 또는 서울 대면으로 50분.",
    href: "/counseling",
    cta: "상담 안내",
  },
];

const STEPS = [
  { n: "01", t: "가입은 이메일 하나", d: "카드 없이 시작. 워크북 1주차는 누구나 무료예요." },
  { n: "02", t: "하루 10분, 내 속도로", d: "강의는 10분 단위, 워크북은 하루 한 장. 보던 곳부터 이어집니다." },
  { n: "03", t: "기록이 남고, 돌아볼 수 있어요", d: "내가 쓴 답과 진도는 계정에 저장돼 언제든 다시 열어볼 수 있어요." },
  { n: "04", t: "필요하면 상담으로", d: "워크북과 강의로 다져진 언어로, 상담에서 더 깊게 이야기합니다." },
];

const FAQ = [
  { q: "심각한 어려움이 있어도 이용해도 되나요?", a: "강의와 워크북은 심리 교육 자료예요. 정신과 진료나 전문 치료를 대체하지 않습니다. 자해·자살 생각이 있다면 109(자살예방상담전화)로 먼저 연락해 주세요." },
  { q: "기록은 누가 볼 수 있나요?", a: "워크북 기록과 학습 내역은 본인만 볼 수 있어요. 운영자는 서비스 운영에 필요한 최소한의 정보만 확인합니다." },
  { q: "환불이 되나요?", a: "결제 후 7일 이내이고 진도가 10% 미만이면 전액 환불해 드려요. 자세한 기준은 환불 규정을 확인해 주세요." },
];

export default function HomePage() {
  return (
    <div className="overflow-hidden">
      {/* ── 히어로 ─────────────────────────────── */}
      <section className="relative px-4 pb-16 pt-14 sm:px-6 sm:pb-24 sm:pt-20">
        <div className="blob -left-24 top-10 h-72 w-72 bg-[var(--brand-light)]" aria-hidden />
        <div className="blob -right-16 top-40 h-80 w-80 bg-[var(--brand-mint)] opacity-30" aria-hidden />

        <div className="relative mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_1fr] lg:gap-16">
          <div>
            <span className="eyebrow rise rise-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[var(--brand)]" />
              첫 강의 · 고기능 우울증 준비 중
            </span>
            <h1 className="font-display-tight rise rise-2 mt-5 text-[2.5rem] leading-[1.15] text-[var(--foreground)] sm:text-[3.5rem] lg:text-[3.9rem]">
              나를 이해하는 공부,
              <br />
              <span className="text-gradient">하루 10분이면 충분해요</span>
            </h1>
            <p className="rise rise-3 mt-6 max-w-lg text-[1.05rem] leading-relaxed text-[var(--foreground-muted)] sm:text-lg">
              심리상담가 현이 만드는 강의와 셀프 워크북. 배우고, 스스로 해보고, 필요하면 함께 이야기합니다.
            </p>
            <div className="rise rise-4 mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/register"
                className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 text-[0.95rem] font-semibold text-white shadow-soft transition-all hover:-translate-y-0.5 hover:bg-[var(--brand-hover)]"
              >
                무료로 시작하기
              </Link>
              <Link
                href="/courses"
                className="inline-flex h-12 items-center gap-1.5 rounded-xl bg-[var(--surface)] px-6 text-[0.95rem] font-semibold text-[var(--foreground)] transition-colors hover:bg-[var(--surface-muted)]"
              >
                강의 둘러보기
                <span aria-hidden>→</span>
              </Link>
            </div>
            <div className="rise rise-5 mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-[var(--foreground-subtle)]">
              <span className="flex items-center gap-1.5"><Check /> 카드 없이 시작</span>
              <span className="flex items-center gap-1.5"><Check /> 기록은 나만 열람</span>
              <span className="flex items-center gap-1.5"><Check /> 상담심리 석사 · 임상심리사</span>
            </div>
          </div>

          {/* 제품 미리보기 카드 */}
          <div className="rise rise-3 relative mx-auto w-full max-w-md lg:max-w-none">
            <div className="card shadow-float p-5 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-[var(--foreground-subtle)]">오늘의 학습</p>
                  <p className="mt-0.5 text-lg font-bold text-[var(--foreground)]">Day 8 · 인지왜곡 식별하기</p>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-bold text-[var(--brand)]">
                  38%
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-[var(--surface)] p-4">
                <p className="text-sm font-semibold text-[var(--foreground)]">어제 적은 생각에 이름표를 붙여볼까요?</p>
                <p className="mt-1 text-sm text-[var(--foreground-muted)]">&ldquo;발표 망치면 팀에서 무능하다고 볼 거야&rdquo;</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {["파국화", "마음 읽기", "과잉 일반화", "흑백 사고"].map((c, i) => (
                    <span
                      key={c}
                      className={`rounded-lg px-3 py-1.5 text-xs font-medium ${i === 1 ? "bg-[var(--brand)] text-white" : "bg-white text-[var(--foreground-muted)] ring-1 ring-[var(--border)]"}`}
                    >
                      {c}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-4">
                <div className="mb-2 flex items-center justify-between text-xs text-[var(--foreground-subtle)]">
                  <span>지금 불안 정도</span>
                  <span className="font-semibold text-[var(--foreground)]">40 / 100</span>
                </div>
                <div className="h-2 rounded-full bg-[var(--surface-muted)]">
                  <div className="h-2 w-[40%] rounded-full bg-[var(--brand)]" />
                </div>
              </div>

              <div className="mt-5 flex items-center gap-3">
                <div className="h-11 flex-1 rounded-xl bg-[var(--brand)] text-center text-sm font-semibold leading-[44px] text-white">오늘 완료</div>
                <span className="text-xs text-[var(--foreground-subtle)]">연속 8일 🔥</span>
              </div>
            </div>

            {/* 떠 있는 작은 카드 */}
            <div className="floaty card absolute -bottom-6 -left-6 hidden items-center gap-3 p-3 pr-4 shadow-soft sm:flex">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--brand-light)] text-[var(--brand)]">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="5 3 19 12 5 21 5 3" /></svg>
              </span>
              <div>
                <p className="text-xs text-[var(--foreground-subtle)]">이어보기</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">고기능 우울증 2편 · 04:12</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── 서비스 3종 ───────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="mb-10 max-w-2xl">
            <span className="eyebrow">세 가지 길</span>
            <h2 className="font-display mt-4 text-3xl text-[var(--foreground)] sm:text-4xl">어디서 시작해도 괜찮아요</h2>
            <p className="mt-3 text-[var(--foreground-muted)]">지금 필요한 것부터. 배우거나, 직접 해보거나, 함께 이야기하거나.</p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {SERVICES.map((s, i) => (
              <Link key={s.title} href={s.href} className={`card card-hover group flex flex-col p-7 rise rise-${i + 1}`}>
                <div className="flex items-center justify-between">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--brand-light)] text-[var(--brand)]">{s.icon}</span>
                  <span className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs font-semibold text-[var(--foreground-muted)]">{s.tag}</span>
                </div>
                <h3 className="mt-6 text-xl font-bold text-[var(--foreground)]">{s.title}</h3>
                <p className="mt-2 flex-1 text-[0.95rem] leading-relaxed text-[var(--foreground-muted)]">{s.desc}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">
                  {s.cta}
                  <span className="transition-transform group-hover:translate-x-0.5" aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 진행 방식 ───────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-16">
            <div>
              <span className="eyebrow">이렇게 진행돼요</span>
              <h2 className="font-display mt-4 text-3xl text-[var(--foreground)] sm:text-4xl">
                부담 없이 시작해서,
                <br />
                꾸준히 이어지도록
              </h2>
              <p className="mt-4 text-[var(--foreground-muted)]">
                성장은 정해진 일정대로 오지 않아요. 오늘 10분, 내일 다시. 필요할 때 다시 꺼내 볼 수 있게 만들었습니다.
              </p>
            </div>
            <ol className="grid gap-4 sm:grid-cols-2">
              {STEPS.map((s) => (
                <li key={s.n} className="card p-6">
                  <span className="text-sm font-bold text-[var(--brand)]">{s.n}</span>
                  <h3 className="mt-3 text-lg font-bold text-[var(--foreground)]">{s.t}</h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">{s.d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ── 상담가 ─────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1fr_1.2fr] lg:gap-16">
          <div className="card relative overflow-hidden p-8">
            <div className="blob -right-10 -top-10 h-40 w-40 bg-[var(--brand-light)]" aria-hidden />
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--brand)] text-2xl font-extrabold text-white">현</div>
              <p className="mt-5 text-xl font-bold text-[var(--foreground)]">심리상담가 현 (김태현)</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {["상담심리 석사", "청소년상담 학사", "임상심리사 2급", "청소년상담사 2급"].map((b) => (
                  <span key={b} className="rounded-lg bg-[var(--surface)] px-2.5 py-1 text-xs font-medium text-[var(--foreground-muted)]">{b}</span>
                ))}
              </div>
            </div>
          </div>
          <div>
            <span className="eyebrow">상담가</span>
            <h2 className="font-display mt-4 text-3xl leading-snug text-[var(--foreground)] sm:text-4xl">
              힘든 사람들 대부분은 위기가 아니라,
              <br className="hidden sm:block" /> 설명할 언어가 없었을 뿐이었어요.
            </h2>
            <p className="mt-5 text-[var(--foreground-muted)] leading-relaxed">
              청소년과 성인을 만나며 반복해서 본 장면입니다. 그래서 쓰고, 가르치고, 함께 이야기합니다. 전문 지식을 누구나 읽고 써볼 수 있는 말로 바꾸는 것이 제 일이에요.
            </p>
            <Link href="/about" className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">
              상담가 소개 더 보기 <span aria-hidden>→</span>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FAQ 요약 ────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <div className="mb-8 text-center">
            <span className="eyebrow">자주 묻는 질문</span>
            <h2 className="font-display mt-4 text-3xl text-[var(--foreground)]">궁금한 것들</h2>
          </div>
          <div className="space-y-3">
            {FAQ.map((f) => (
              <details key={f.q} className="card group p-5 open:shadow-soft">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-[0.95rem] font-semibold text-[var(--foreground)]">
                  {f.q}
                  <span className="text-[var(--foreground-subtle)] transition-transform group-open:rotate-45" aria-hidden>+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[var(--foreground-muted)]">{f.a}</p>
              </details>
            ))}
          </div>
          <p className="mt-6 text-center text-sm text-[var(--foreground-muted)]">
            <Link href="/faq" className="font-semibold text-[var(--brand)]">전체 FAQ 보기 →</Link>
          </p>
        </div>
      </section>

      {/* ── CTA ─────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-24">
        <div className="bg-brand-gradient mx-auto max-w-6xl overflow-hidden rounded-[28px] px-6 py-14 text-center text-white sm:px-12 sm:py-20">
          <h2 className="font-display-tight text-3xl sm:text-5xl">오늘 10분부터 시작해요</h2>
          <p className="mx-auto mt-4 max-w-md text-white/80">회원가입은 이메일 하나면 됩니다. 워크북 1주차는 누구나 무료.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex h-12 items-center rounded-xl bg-white px-6 text-[0.95rem] font-semibold text-[var(--brand-ink)] transition-transform hover:-translate-y-0.5">
              무료로 시작하기
            </Link>
            <Link href="/articles" className="inline-flex h-12 items-center rounded-xl bg-white/15 px-6 text-[0.95rem] font-semibold text-white ring-1 ring-white/30 transition-colors hover:bg-white/25">
              무료 아티클 읽기
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

function Check() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
