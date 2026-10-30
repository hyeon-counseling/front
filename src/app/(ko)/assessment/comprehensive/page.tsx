import type { Metadata } from "next";
import Link from "next/link";
import { TestsTabs } from "@/components/assessment/TestsTabs";
import { ProcessSteps } from "@/components/assessment/ProcessSteps";
import { RefundRules } from "@/components/assessment/RefundRules";
import { ReportPreview } from "@/components/assessment/ReportPreview";
import { StickyApplyBar } from "@/components/assessment/StickyApplyBar";
import { Plate } from "@/components/assessment/Plate";
import { Icon, type IconName } from "@/components/assessment/Icon";
import { DETAIL_FAQ } from "@/content/assessmentGuide";
import { DiffArt, HeroLayersArt, SpreadLayersArt, VideoSceneArt } from "@/components/assessment/AssessArt";

export const metadata: Metadata = {
  title: "종합심리검사 MMPI-2 + TCI + SCT",
  description: "온라인 심리검사 3종 + 종합 해석 보고서 + 해석 상담 약 60분 + 해석 영상. 150,000원.",
};

/**
 * 종합심리검사 상품 상세 (70-상품상세-시안 — 썸네일 C '세 층' 톤)
 * 첫 화면 → 이런 분께 → 세 겹 → 받는 것 → 진행 8단계 → 다른 점 → 상담가 → FAQ → 가격 → 마지막 신청
 * 색 토큰은 globals.css 의 .assess 안에서만 덮어쓴다.
 */
const APPLY = "/assessment/comprehensive/apply";

// 아이콘 타일 색 — g 그린 · s 민트 · c 코랄
const TILE = {
  g: "bg-[var(--brand-light)] text-[var(--tci)]",
  s: "bg-[#D5EFE4] text-[var(--mmpi-ink)]",
  c: "bg-[var(--sct-light)] text-[var(--sct-ink)]",
};

const KEYS: { icon: IconName; tone: keyof typeof TILE; title: string; sub: string }[] = [
  { icon: "laptop", tone: "g", title: "검사 3종, 집에서 온라인으로", sub: "나눠서 해도 괜찮아요" },
  { icon: "doc", tone: "s", title: "상담가가 직접 쓰는 종합 해석 보고서", sub: "세 검사를 한 편의 이야기로 · 해석 영상도 함께" },
  { icon: "chat", tone: "c", title: "해석 상담 약 60분", sub: "대면(추천) 또는 화상으로, 결과를 같이 읽어요" },
];

const NEEDS: { icon: IconName; tone: keyof typeof TILE; title: string; body: string }[] = [
  { icon: "book", tone: "g", title: "나를 설명할 말이 갖고 싶어요", body: "생일이나 연말처럼 한 해를 돌아볼 때, 나를 한 문장으로 정리해 보고 싶은 분" },
  { icon: "ruler", tone: "s", title: "MBTI 다음이 궁금해요", body: "유형 상자 대신, 나는 '어디쯤'인지 눈금으로 재 보고 싶은 분" },
  { icon: "people", tone: "c", title: "관계 속 내 모습이 궁금해요", body: "연애·친구·일터에서 내가 자주 맡는 역할과 그 힘을 알고 싶은 분" },
  { icon: "compass", tone: "g", title: "갈림길 앞에 서 있어요", body: "이직·진로·새 출발 앞에서 나에게 잘 맞는 방향을 고르고 싶은 분" },
  { icon: "sun", tone: "s", title: "요즘의 나를 정리하고 싶어요", body: "바쁘게 달려온 요즘, 오래된 내 결과 요즘의 날씨를 나눠 보고 싶은 분" },
  { icon: "sprout", tone: "c", title: "강점을 더 키우고 싶어요", body: "약점을 고치기보다, 이미 잘 쓰는 힘을 더 잘 쓰고 싶은 분" },
];

const LAYERS: { kind: "sct" | "mmpi" | "tci"; lv: string; lvColor: string; name: string; full: string; body: string; eg?: string; meta: string[] }[] = [
  {
    kind: "sct",
    lv: "맨 위 · 내 말 속의 나",
    lvColor: "text-[var(--sct-ink)]",
    name: "SCT",
    full: "문장 완성",
    body: "문장의 앞부분을 보고 떠오르는 대로 이어 써요. 숫자로는 잡히지 않는 나만의 이야기가 담겨요.",
    eg: "\"내가 가장 나다워지는 순간은 ______\"",
    meta: ["약 50문장", "약 20~40분"],
  },
  {
    kind: "mmpi",
    lv: "가운데 · 지금의 나",
    lvColor: "text-[var(--mmpi-ink)]",
    name: "MMPI-2",
    full: "다면적 인성검사",
    body: "요즘의 내가 어떤 마음으로 지내는지, 스트레스가 올 때 어떻게 대처하는지 넓게 살펴봐요. 솔직하게 답했는지도 함께 확인해서 결과를 더 믿고 볼 수 있어요.",
    meta: ["567문항 · 예/아니오", "약 60~90분"],
  },
  {
    kind: "tci",
    lv: "맨 아래 · 타고난 나",
    lvColor: "text-[var(--tci)]",
    name: "TCI",
    full: "기질 및 성격검사",
    body: "어릴 때부터 이어진 타고난 기질과, 살아오며 키워 온 성격을 함께 봐요. 기질이 '엔진'이라면 성격은 그 엔진을 다루는 '운전 습관'이에요.",
    meta: ["약 140문항 · 5점 중 고르기", "약 15~30분"],
  },
];

const SCENE_LIST: [string, string][] = [
  ["이런 사람이에요", "\"어? 나 같다\""],
  ["이런 강점이 있어요", "\"맞아, 이거 잘하지\""],
  ["이런 상황이 오면", "\"그럴 때 있어\""],
  ["같은 힘, 다른 방향", "\"이렇게 해 볼 수 있겠다\""],
];
const SCENE_NUM = ["bg-[var(--brand-light)] text-[var(--brand)]", "bg-[var(--mmpi)] text-[var(--tci-dark)]", "bg-[var(--coral-light)] text-[var(--coral-ink)]", "bg-[var(--brand)] text-white"];

const DIFF: { n: 1 | 2 | 3; title: string; body: string }[] = [
  { n: 1, title: "세 검사를 한 이야기로", body: "검사마다 따로 풀지 않아요. 세 결과가 겹치는 곳을 찾아, 한 사람의 이야기로 엮은 통합 해석을 드려요." },
  { n: 2, title: "강점에서 시작해요", body: "이런 사람 → 이런 강점 → 이런 상황이 오면 → 같은 힘, 다른 방향. 어려움은 고장이 아니라, 좋은 힘이 조금 과하게 켜진 순간으로 읽어요." },
  { n: 3, title: "읽고, 듣고, 다시 봐요", body: "보고서로 읽고, 60분 대화로 묻고, 해석 영상으로 다시 봐요. 결과를 혼자 받아 들고 막막해지는 일이 없어요." },
];

// 자주 묻는 질문 8개 — 문안은 src/content/assessmentGuide.ts (관리자 '안내·FAQ' 칸에서도 보인다)
const FAQ = DETAIL_FAQ;

const INCLUDED: { title: string; sub: string; gift?: string }[] = [
  { title: "온라인 심리검사 3종", sub: "MMPI-2 · TCI · SCT, 집에서" },
  { title: "종합 해석 보고서", sub: "김태현 심리상담가가 직접 써요" },
  { title: "해석 상담 약 60분", sub: "대면(서울 5개 지역) 또는 화상" },
  { title: "해석 영상", sub: "상담 뒤 내 페이지에서 다시 보기", gift: "3만 원 상당" },
];

const CALENDAR: { d: string; t: string; tone?: "on" | "hot" }[] = [
  { d: "12/10(목)", t: "신청·접수면접지", tone: "on" },
  { d: "12/11(금) 8시", t: "검사 링크" },
  { d: "12/17(목)", t: "검사 마감" },
  { d: "12/24(목)", t: "해석 상담", tone: "hot" },
];

// ── 작은 조각들 ──
const WRAP = "mx-auto max-w-[1080px] px-5";
const SEC = "scroll-mt-16 py-[72px] md:py-[104px]";
const SEC_H = "mb-3 mt-3.5 text-[28px] font-extrabold leading-tight tracking-[-0.025em] md:text-4xl";
const LEAD = "max-w-[620px] text-[var(--foreground-muted)]";
const CARD = "rounded-[28px] bg-white px-5 py-6 shadow-[var(--shadow-sm)] md:p-9";

function Tile({ icon, tone, size = "h-11 w-11 rounded-[14px]" }: { icon: IconName; tone: keyof typeof TILE; size?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center ${size} ${TILE[tone]}`}>
      <Icon name={icon} />
    </span>
  );
}

function Tag({ children, tone }: { children: React.ReactNode; tone: "c" | "g" }) {
  return (
    <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-[12.5px] font-extrabold ${tone === "c" ? "bg-[var(--coral)] text-white" : "bg-[var(--brand-light)] text-[var(--brand)]"}`}>
      {children}
    </span>
  );
}

export default function ComprehensivePage() {
  return (
    <div className="assess text-[17px] leading-[1.75]">
      {/* 1. 첫 화면 */}
      <section id="top" className="relative overflow-hidden bg-[var(--mint-bg)] pb-[60px] pt-7 lg:pb-24 lg:pt-10">
        <span aria-hidden="true" className="pointer-events-none absolute -right-[220px] -top-[60px] h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,#FBF8F3_0%,rgba(251,248,243,0)_68%)]" />
        <div className={`${WRAP} relative`}>
          <TestsTabs active="pro" />
          <div className="grid items-center gap-2 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-10">
            <div>
              <p className="mt-[26px]">
                <span className="as-chip">종합심리검사 + 해석 상담</span>
              </p>
              <h1 className="mb-2.5 mt-[18px] text-[40px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[var(--tci-dark)] lg:text-[62px]">
                타고난 <span className="text-[var(--tci)]">나</span>,<br />
                지금의 <span className="text-[#3F9C7E]">나</span>,<br />내 말 속의 <span className="text-[#E0704F]">나</span>
              </h1>
              <p className="text-lg font-extrabold tracking-[-0.01em] text-[var(--tci)]">MMPI-2 · TCI · SCT</p>
              <p className="mt-3.5 max-w-[520px] text-[17px] text-[var(--foreground-muted)] lg:text-lg">
                세 가지 검사로 <b className="text-[var(--tci-dark)]">&apos;나 사용 설명서&apos;</b>를 함께 써 보는 시간이에요. 김태현 심리상담가가 세 겹을 하나로 읽고, 60분 동안 같이 풀어 드려요. 고민이 없어도 괜찮아요.
              </p>
            </div>
            <div className="floaty mx-auto mt-1 w-full max-w-[260px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-[460px]">
              <HeroLayersArt className="block h-auto w-full" />
            </div>
            <div>
              <ul className="mt-6 grid gap-2.5">
                {KEYS.map((k) => (
                  <li key={k.title} className="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 text-base leading-[1.45] shadow-[0_3px_0_rgba(31,58,51,0.07)]">
                    <Tile icon={k.icon} tone={k.tone} size="h-10 w-10 rounded-xl" />
                    <span>
                      <b className="block text-[16.5px]">{k.title}</b>
                      <small className="text-sm text-[var(--foreground-muted)]">{k.sub}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <div id="hero-buy" className="mt-[26px]">
                <p className="text-[28px] font-extrabold tracking-[-0.02em]">
                  150,000원
                  <small className="block text-[13.5px] font-semibold tracking-normal text-[var(--foreground-muted)]">검사 · 보고서 · 상담 · 해석 영상 모두 포함</small>
                </p>
                <div className="mt-3.5 flex flex-wrap gap-2.5">
                  <Link href={APPLY} className="as-btn flex-auto sm:flex-none">
                    신청하기 <Icon name="arrow" className="h-5 w-5" />
                  </Link>
                  <a href="#flow" className="as-btn ghost flex-auto sm:flex-none">
                    진행 순서 보기
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. 이런 분께 */}
      <section id="for" className={`${SEC} bg-[var(--ivory)]`}>
        <div className={WRAP}>
          <span className="as-chip coral">이런 분께</span>
          <h2 className={SEC_H}>
            이런 마음이 들 때<br />
            찾아와요
          </h2>
          <p className={LEAD}>아래 여섯 가지 중 하나라도 &apos;나네&apos; 싶다면, 충분히 쓸모 있는 시간이 될 거예요.</p>
          <div className="mt-[30px] grid gap-3 sm:grid-cols-2 lg:grid-cols-3 lg:gap-4">
            {NEEDS.map((n) => (
              <div key={n.title} className="flex items-start gap-3.5 rounded-[20px] bg-white p-[18px] shadow-[var(--shadow-sm)]">
                <Tile icon={n.icon} tone={n.tone} size="h-[46px] w-[46px] rounded-[14px]" />
                <div>
                  <b className="mb-[3px] block text-[17.5px] leading-[1.4]">{n.title}</b>
                  <p className="text-[15.5px] leading-[1.6] text-[var(--foreground-muted)]">{n.body}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-[26px] flex items-center gap-2.5 text-[17px] font-bold text-[var(--brand-ink)]">
            <Icon name="heart" className="h-6 w-6 text-[var(--brand-bright)]" />
            나를 더 잘 쓰고 싶은 사람을 위한 시간이에요.
          </p>
        </div>
      </section>

      {/* 3. 세 검사 = 세 겹 */}
      <section id="tests" className={`${SEC} bg-[var(--surface)]`}>
        <div className={WRAP}>
          <span className="as-chip">세 가지 검사</span>
          <h2 className={SEC_H}>
            같은 나를,
            <br />세 겹으로 읽어요
          </h2>
          <p className={LEAD}>검사 하나로는 한쪽 면만 보여요. 바탕이 되는 결, 요즘의 나, 내가 직접 쓴 말을 겹쳐 보면 &apos;어떤지&apos;를 넘어 &apos;왜 그런지&apos;까지 보여요.</p>
          <div className="mt-[30px] grid items-center gap-7 md:grid-cols-[0.85fr_1.15fr] md:gap-14">
            <div className="mx-auto w-full max-w-[360px]">
              <SpreadLayersArt className="block h-auto w-full" />
            </div>
            <ol className="grid gap-[22px]">
              {LAYERS.map((l) => (
                <li key={l.name} className="grid grid-cols-[56px_1fr] gap-3.5 rounded-[22px] bg-white py-[18px] pl-3.5 pr-[18px] shadow-[0_3px_0_rgba(31,58,51,0.06)]">
                  <Plate kind={l.kind} className="mt-0.5 h-12 w-14" />
                  <div className="min-w-0">
                    <p className={`text-[13px] font-extrabold tracking-[0.02em] ${l.lvColor}`}>{l.lv}</p>
                    <h3 className="mt-px text-[19px] font-extrabold">
                      {l.name}
                      <span className="ml-1.5 text-sm font-bold text-[var(--foreground-subtle)]">{l.full}</span>
                    </h3>
                    <p className="mt-1 text-base text-[var(--foreground-muted)]">{l.body}</p>
                    {l.eg && (
                      <p className="mt-2 rounded-xl bg-[var(--sct-light)] px-3 py-2 text-[15px] text-[var(--foreground-muted)]">
                        이런 식이에요(실제 문항 아님) — <b className="text-[var(--foreground)]">{l.eg}</b>
                      </p>
                    )}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {l.meta.map((m) => (
                        <span key={m} className="rounded-full bg-[var(--ivory)] px-2.5 py-0.5 text-[13px] font-bold text-[var(--foreground-muted)]">
                          {m}
                        </span>
                      ))}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </div>

          <div className="mt-11 rounded-3xl bg-white px-5 py-6 shadow-[var(--shadow-sm)] md:px-9 md:py-8">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-2">
              <h3 className="text-[21px] font-extrabold">세 장을 겹치면, 한 사람의 이야기가 돼요</h3>
              <small className="text-[13px] font-semibold text-[var(--foreground-subtle)]">가상 예시 · 이서윤(가명), 29세, 직장인</small>
            </div>
            <div className="mt-[18px] grid gap-2.5 text-[15.5px] leading-[1.55] md:grid-cols-3 md:gap-3.5">
              <div className="rounded-2xl bg-[var(--tci)] px-4 py-3.5 text-white">
                <b className="mb-1 block text-[13px] font-extrabold text-[#BDE7D6]">바탕 · TCI</b>먼저 살피고, 한번 맡으면 끝까지 가는 결
              </div>
              <div className="rounded-2xl bg-[var(--mmpi-light)] px-4 py-3.5">
                <b className="mb-1 block text-[13px] font-extrabold text-[var(--mmpi-ink)]">지금 · MMPI-2</b>요즘은 쉬어도 개운하지 않은 날씨
              </div>
              <div className="rounded-2xl bg-[var(--sct-light)] px-4 py-3.5">
                <b className="mb-1 block text-[13px] font-extrabold text-[var(--sct-ink)]">내 말 · SCT</b>&quot;내가 조금 더 하면 다들 편해진다.&quot;
              </div>
            </div>
            <p className="mt-4 flex items-start gap-3 text-[17px] font-bold leading-[1.6] text-[var(--brand-ink)]">
              <Icon name="spark" className="mt-[3px] h-6 w-6 text-[var(--coral)]" />
              <span>
                그래서 서윤 님에게는 &apos;더 참는 법&apos;보다, 끝까지 가는 힘으로 <span className="whitespace-nowrap">&apos;쉬는 약속&apos;</span>도 끝까지 지키는 쪽이 잘 맞아요.
              </span>
            </p>
          </div>
        </div>
      </section>

      {/* 4. 받는 것 */}
      <section id="get" className={`${SEC} bg-[var(--ivory)]`}>
        <div className={WRAP}>
          <span className="as-chip mmpi">받는 것</span>
          <h2 className={SEC_H}>
            검사가 끝나면,
            <br />
            이렇게 받아요
          </h2>
          <p className={LEAD}>결과를 혼자 받아 들지 않아요. 읽고, 함께 이야기하고, 나중에 다시 볼 수 있게 세 가지로 드려요.</p>

          <div className="mt-[34px] grid gap-[22px]">
            {/* 보고서 */}
            <article className={CARD}>
              <div className="mb-2.5 flex items-center gap-3">
                <Tile icon="doc" tone="s" />
                <h3 className="text-[22px] font-extrabold">종합 해석 보고서</h3>
              </div>
              <div className="mt-[18px] grid gap-[22px] md:grid-cols-[0.9fr_1.1fr] md:items-start md:gap-9">
                <div>
                  <p className="text-[var(--foreground-muted)]">김태현 심리상담가가 세 검사와 접수면접지를 함께 읽고 직접 써요. 검사별로 따로 나열하지 않고, 네 장면으로 이어지는 한 편의 이야기로 엮어요.</p>
                  <ol className="mt-[18px] grid gap-2">
                    {SCENE_LIST.map(([t, em], i) => (
                      <li key={t} className="flex items-center gap-3 text-base">
                        <span className={`flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-full text-sm font-extrabold ${SCENE_NUM[i]}`}>{i + 1}</span>
                        <span>
                          {t} <em className="ml-0.5 text-sm not-italic text-[var(--foreground-subtle)]">{em}</em>
                        </span>
                      </li>
                    ))}
                  </ol>
                  <p className="mt-4 text-[15.5px] text-[var(--foreground-muted)]">핵심 문장마다 내 점수와 내가 쓴 문장이 근거로 붙어 있어서, 누구에게나 맞는 말이 아니라 &apos;나에게만&apos; 맞는 말을 읽게 돼요.</p>
                </div>
                <ReportPreview />
              </div>
              <p className="mx-0.5 mb-0 mt-3 text-[12.5px] text-[var(--foreground-subtle)]">미리보기는 가상 인물 이서윤(가명)의 샘플 보고서 일부예요. 실제 보고서는 상담에서 함께 본 뒤 내 페이지에 올려 드려요.</p>
            </article>

            <div className="grid gap-[22px] md:grid-cols-2">
              {/* 해석 영상 — 샘플 영상이 아직 없어 '곧 공개'로만 표시 */}
              <article className={CARD}>
                <div className="mb-2.5 flex items-center gap-3">
                  <Tile icon="play" tone="c" />
                  <h3 className="text-[22px] font-extrabold">해석 영상</h3>
                  <span className="ml-auto">
                    <Tag tone="c">3만 원 상당 포함</Tag>
                  </span>
                </div>
                <p className="text-[var(--foreground-muted)]">내 해석을 그림 동화처럼 다시 보는 약 3분짜리 영상이에요. &quot;어려움은 고장이 아니라, 좋은 힘이 너무 열심히 일한 것&quot;이라는 이야기를 그림으로 풀어요.</p>
                <div className="relative mt-4 overflow-hidden rounded-[18px] shadow-[var(--shadow-sm)]">
                  <VideoSceneArt className="block h-auto w-full" />
                  <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/90 px-3.5 py-1.5 text-sm font-extrabold text-[var(--foreground-muted)]" aria-label="샘플 영상은 곧 공개돼요">
                    샘플 영상 곧 공개
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[14.5px] text-[var(--foreground-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="h-[18px] w-[18px] text-[var(--brand-bright)]" />약 3분
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="heart" className="h-[18px] w-[18px] text-[var(--brand-bright)]" />
                    상담에서 함께 본 뒤 공개
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="check" className="h-[18px] w-[18px] text-[var(--brand-bright)]" />내 페이지에서 언제든 다시
                  </span>
                </div>
              </article>

              {/* 해석 상담 */}
              <article className={CARD}>
                <div className="mb-2.5 flex items-center gap-3">
                  <Tile icon="chat" tone="g" />
                  <h3 className="text-[22px] font-extrabold">해석 상담 약 60분</h3>
                </div>
                <p className="text-[var(--foreground-muted)]">보고서를 화면에 같이 띄워 놓고, 궁금한 곳을 묻고 답해요. 방식은 신청할 때 골라요.</p>
                <div className="mt-4 grid gap-2.5">
                  <div className="rounded-[18px] bg-[linear-gradient(135deg,#FFF3EE,#FFF9F1)] p-4 shadow-[inset_0_0_0_1.5px_#F8C9B8]">
                    <div className="flex items-center gap-2 text-lg font-extrabold">
                      <Icon name="pin" className="h-6 w-6 text-[var(--coral-ink)]" />
                      대면 상담 <Tag tone="c">추천</Tag>
                    </div>
                    <p className="mt-1.5 text-[15.5px] leading-[1.6] text-[var(--foreground-muted)]">표정·목소리·몸짓 같은 말 밖의 신호까지 함께 읽어서, 해석이 더 풍성해져요.</p>
                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {["홍대", "강남", "종로", "혜화", "사당"].map((p) => (
                        <span key={p} className="rounded-full bg-white px-2.5 py-0.5 text-[13px] font-bold text-[var(--coral-ink)]">
                          {p}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-sm leading-[1.6] text-[var(--foreground-muted)]">고른 지역의 조용한 스터디룸 · 장소는 3일 전에 확정해 알려 드려요</p>
                  </div>
                  <div className="rounded-[18px] bg-[var(--ivory)] p-4">
                    <div className="flex items-center gap-2 text-lg font-extrabold">
                      <Icon name="cam" className="h-6 w-6 text-[var(--brand)]" />
                      화상 상담
                    </div>
                    <p className="mt-1.5 text-[15.5px] leading-[1.6] text-[var(--foreground-muted)]">이동 없이 집에서 가볍게. 접속 링크는 하루 전에 보내 드려요.</p>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </div>
      </section>

      {/* 5. 진행 8단계 */}
      <section id="flow" className={SEC}>
        <div className={WRAP}>
          <span className="as-chip">진행 순서</span>
          <h2 className={SEC_H}>
            신청부터 후기까지,
            <br />
            여덟 걸음이에요
          </h2>
          <p className={LEAD}>결제하면 그 자리에서 일정이 확정되고, 그다음부터는 알림톡이 한 걸음씩 안내해요. 해석 상담은 신청일로부터 14일 뒤부터 고를 수 있어요.</p>
          <div className="mt-[22px] grid grid-cols-2 items-center gap-2 sm:flex sm:flex-wrap" aria-label="날짜 예시">
            {CALENDAR.map((c, i) => (
              <span key={c.d} className="contents">
                {i > 0 && (
                  <span aria-hidden="true" className="hidden font-extrabold text-[var(--foreground-subtle)] sm:inline">
                    →
                  </span>
                )}
                <span
                  className={`inline-flex flex-col items-start rounded-[14px] px-3 py-2 text-sm leading-[1.35] shadow-[var(--shadow-sm)] ${
                    c.tone === "on" ? "bg-[var(--brand)] text-white" : c.tone === "hot" ? "bg-[var(--coral)] text-white" : "bg-white"
                  }`}
                >
                  <b className="text-[15.5px]">{c.d}</b>
                  {c.t}
                </span>
              </span>
            ))}
          </div>
          <p className="mt-2 text-[13.5px] text-[var(--foreground-subtle)]">날짜는 예시예요. 검사 마감은 언제나 &apos;해석 상담 7일 전&apos;이에요.</p>
          <ProcessSteps />
        </div>
      </section>

      {/* 6. 다른 점 */}
      <section id="diff" className={`${SEC} bg-[var(--ivory)]`}>
        <div className={WRAP}>
          <span className="as-chip coral">여기가 달라요</span>
          <h2 className={SEC_H}>
            점수를 건네는 대신,
            <br />
            이야기를 함께 써요
          </h2>
          <div className="mt-[34px] grid gap-7 md:grid-cols-3 md:gap-9">
            {DIFF.map((d) => (
              <div key={d.n}>
                <div className="mb-3.5">
                  <DiffArt n={d.n} />
                </div>
                <h3 className="text-[21px] font-extrabold">
                  <span className="text-[var(--brand-bright)]">{["①", "②", "③"][d.n - 1]}</span> {d.title}
                </h3>
                <p className="mt-2 text-[16.5px] text-[var(--foreground-muted)]">{d.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7. 상담가 */}
      <section id="counselor" className={SEC}>
        <div className={WRAP}>
          <span className="as-chip">상담가</span>
          <h2 className={SEC_H}>
            보고서를 쓰고,
            <br />
            함께 읽는 사람
          </h2>
          <div className="mt-[30px] grid gap-6 rounded-[28px] bg-white px-5 py-[26px] shadow-[var(--shadow-md)] md:grid-cols-[220px_1fr] md:gap-10 md:p-10">
            <div>
              <div className="relative flex h-[120px] w-[120px] items-center justify-center rounded-[36px] bg-[linear-gradient(135deg,var(--brand)_0%,var(--brand-bright)_100%)] text-[44px] font-extrabold text-white">
                현
                <span aria-hidden="true" className="absolute -bottom-2 -right-2 h-9 w-9 rounded-full border-[5px] border-white bg-[var(--sct)]" />
              </div>
            </div>
            <div>
              <h3 className="text-2xl font-extrabold">김태현 심리상담가</h3>
              <p className="mt-0.5 text-[15.5px] text-[var(--foreground-muted)]">「심리상담실 현」 운영</p>
              <p className="mt-4 border-l-4 border-[var(--brand-mint)] pl-4 text-lg font-semibold leading-[1.7] text-[var(--brand-ink)]">
                &quot;힘든 사람이 아니어도, 나를 설명할 언어와 틀이 필요할 때가 있어요. 손에 잡히는 마음의 지도를 함께 그려 드릴게요.&quot;
              </p>
              <ul className="mt-[18px] flex flex-wrap gap-2" aria-label="학력">
                {["상담 및 심리치료 석사", "청소년상담 학사"].map((c) => (
                  <li key={c} className="rounded-full border-[1.5px] border-[var(--border)] bg-[var(--ivory)] px-3 py-1 text-sm font-bold text-[var(--foreground-muted)]">
                    {c}
                  </li>
                ))}
              </ul>
              <Link href="/about" className="mt-4 inline-flex items-center gap-1.5 text-[15.5px] font-bold text-[var(--brand)]">
                상담실 소개 더 보기 <Icon name="arrow" className="h-[18px] w-[18px]" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. 자주 묻는 질문 */}
      <section id="faq" className={`${SEC} bg-[var(--surface)]`}>
        <div className={WRAP}>
          <span className="as-chip mmpi">자주 묻는 질문</span>
          <h2 className={SEC_H}>
            신청 전에
            <br />
            많이 궁금해하세요
          </h2>
          <div className="mt-7 grid max-w-[780px] gap-2.5">
            {FAQ.map((f) => (
              <details key={f.q} className="group rounded-[18px] bg-white shadow-[var(--shadow-sm)]">
                <summary className="flex min-h-[60px] cursor-pointer items-center gap-3 p-[18px] text-[17px] font-bold leading-[1.45]">
                  <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-light)] text-sm font-extrabold text-[var(--brand)] group-open:bg-[var(--brand)] group-open:text-white">Q</span>
                  {f.q}
                  <Icon name="chev" className="as-chev ml-auto h-5 w-5 text-[var(--foreground-subtle)]" />
                </summary>
                <div className="space-y-2 px-[18px] pb-5 text-base leading-[1.75] text-[var(--foreground-muted)] min-[421px]:pl-[60px]">
                  {f.a.map((p) => (
                    <p key={p}>{p}</p>
                  ))}
                </div>
              </details>
            ))}
          </div>
          <div className="mt-5 grid max-w-[780px] gap-2.5 sm:grid-cols-2">
            {[
              { href: "/guide/apply", label: "종합심리검사 신청 안내", sub: "진행 순서 · 검사 마감 · 자주 묻는 질문" },
              { href: "/guide/tests", label: "검사 안내", sub: "검사 소개 · 검사 방법 · 자주 묻는 질문" },
            ].map((l) => (
              <Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-[18px] shadow-[var(--shadow-sm)]">
                <span>
                  <span className="block font-bold">{l.label}</span>
                  <span className="block text-sm text-[var(--foreground-muted)]">{l.sub}</span>
                </span>
                <Icon name="arrow" className="h-5 w-5 shrink-0 text-[var(--brand)]" />
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 9. 가격 */}
      <section id="price" className={SEC}>
        <div className={WRAP}>
          <span className="as-chip">가격과 포함 내역</span>
          <h2 className={SEC_H}>
            한 번의 결제로,
            <br />
            처음부터 끝까지
          </h2>
          <div className="mt-[30px] max-w-[780px] overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-md)]">
            <div className="relative overflow-hidden bg-[linear-gradient(135deg,var(--brand)_0%,#3E8C72_100%)] px-[22px] py-6 text-white">
              <Plate kind="stack" className="absolute right-2 top-1/2 h-auto w-[92px] -translate-y-1/2 opacity-95 min-[421px]:right-3.5 min-[421px]:w-[120px]" />
              <p className="text-[15px] opacity-90">종합심리검사 + 해석 상담</p>
              <p className="mt-1 text-[40px] font-extrabold leading-[1.2] tracking-[-0.03em]">150,000원</p>
            </div>
            <div className="p-[22px]">
              <ul className="grid gap-3">
                {INCLUDED.map((x) => (
                  <li key={x.title} className="flex items-start gap-3 text-[16.5px] leading-normal">
                    <span className="mt-px flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-bright)] text-white">
                      <Icon name="check" className="h-[18px] w-[18px]" strokeWidth={2.6} />
                    </span>
                    <span>
                      {x.title}
                      {x.gift && <span className="ml-1 text-[13.5px] font-extrabold text-[var(--coral-ink)]">{x.gift}</span>}
                      <small className="block text-sm text-[var(--foreground-muted)]">{x.sub}</small>
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={APPLY} className="as-btn mt-5 w-full">
                신청하기 <Icon name="arrow" className="h-5 w-5" />
              </Link>
              <details className="mt-4 rounded-2xl bg-[var(--ivory)]">
                <summary className="flex min-h-[52px] cursor-pointer items-center gap-2.5 px-4 py-3.5 text-[15.5px] font-bold">
                  취소·환불 규정 한눈에
                  <Icon name="chev" className="as-chev ml-auto h-5 w-5 text-[var(--foreground-subtle)]" />
                </summary>
                <div className="px-4 pb-4">
                  <RefundRules />
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* 10. 마지막 */}
      <section className="pb-[72px] md:pb-[104px]">
        <div className={WRAP}>
          <div className="relative overflow-hidden rounded-[32px] bg-[var(--mint-bg)] px-[22px] pb-12 pt-10 text-center text-[var(--tci-dark)] md:px-10 md:py-[72px]">
            <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#FBF8F3_0%,rgba(251,248,243,0)_68%)]" />
            <Plate kind="stack" className="relative mx-auto mb-3.5 h-auto w-[150px]" />
            <h2 className="relative text-[28px] font-extrabold leading-tight tracking-[-0.025em] md:text-[38px]">
              나를 설명하는 <span className="text-[#E0704F]">말</span>을,
              <br />
              함께 찾아봐요
            </h2>
            <p className="relative mt-2 text-[var(--foreground-muted)]">신청은 3분이면 끝나요. 자세한 이야기는 결제 뒤 접수면접지로 들을게요.</p>
            <Link href={APPLY} className="as-btn relative mt-6">
              150,000원 · 신청하기 <Icon name="arrow" className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </section>

      <StickyApplyBar targetId="hero-buy" href={APPLY} price="150,000원" sub="보고서·상담·영상 포함" />
    </div>
  );
}
