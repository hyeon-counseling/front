import type { Metadata } from "next";
import Link from "next/link";
import { Icon, type IconName } from "@/components/assessment/Icon";
import { CancelTable, OPEN_PRICE_UNTIL } from "@/components/counseling/CounselingRules";
import {
  ApplyButton,
  CounselingOptionsProvider,
  CounselingStickyBar,
  OptionCards,
  PriceBoxHead,
  SelectedPrice,
} from "@/components/counseling/CounselingOptions";

export const metadata: Metadata = {
  title: "개인 상담",
  description: "김태현 심리상담가와 1:1로 만나는 50분 개인 상담. 화상·대면 같은 가격 60,000원, 첫 상담 패키지와 5·10회 할인.",
};

/**
 * 개인 상담 상품 상세 — 종합심리검사 상세(/assessment/comprehensive)와 같은 디자인 체계(.assess)
 * 첫 화면(옵션·가격·신청) → 이런 분께 → 만나는 방식 → 진행 순서 → 상담가 → FAQ → 가격 → 마지막 신청
 * 상품·가격·취소 규정은 결정 #56(10/30), 신청·결제는 카페24
 */
const TILE = {
  g: "bg-[var(--brand-light)] text-[var(--tci)]",
  s: "bg-[#D5EFE4] text-[var(--mmpi-ink)]",
  c: "bg-[var(--sct-light)] text-[var(--sct-ink)]",
};

const KEYS: { icon: IconName; tone: keyof typeof TILE; title: string; sub: string }[] = [
  { icon: "chat", tone: "g", title: "1:1 상담 50분", sub: "김태현 심리상담가와 둘이서" },
  { icon: "pin", tone: "c", title: "대면 또는 화상, 같은 가격", sub: "서울 5개 지역 스터디룸 · 집에서 화상" },
  { icon: "gift", tone: "s", title: "처음이라면 2회를 1회 가격으로", sub: "첫 상담 패키지 · 5·10회는 10·20% 할인" },
];

const NEEDS: { icon: IconName; tone: keyof typeof TILE; title: string; body: string }[] = [
  { icon: "sun", tone: "s", title: "마음이 오래 무거워요", body: "이유를 딱 집어 말하긴 어렵지만, 요즘 계속 지치고 가라앉는 분" },
  { icon: "people", tone: "c", title: "관계에서 같은 장면이 반복돼요", body: "연애·가족·일터에서 비슷한 갈등이 되풀이되어 패턴을 알고 싶은 분" },
  { icon: "hourglass", tone: "g", title: "겉으론 괜찮은데 속은 지쳐 있어요", body: "할 일은 다 해내지만 쉬어도 개운하지 않은 날이 이어지는 분" },
  { icon: "compass", tone: "s", title: "결정 앞에서 마음이 복잡해요", body: "이직·관계·진로처럼 큰 선택을 앞두고 내 마음을 정리하고 싶은 분" },
  { icon: "book", tone: "c", title: "나를 더 잘 이해하고 싶어요", body: "왜 이렇게 느끼고 행동하는지, 나만의 이유를 차근차근 찾고 싶은 분" },
  { icon: "doc", tone: "g", title: "검사 결과를 더 이야기하고 싶어요", body: "종합심리검사 해석 뒤, 그 이야기를 이어서 더 깊이 나누고 싶은 분" },
];

const STEPS: { title: string; when: string; body: string; icon: IconName; tone: "g" | "c" | "s" }[] = [
  { title: "옵션 고르고 신청", when: "이 페이지에서", body: "1회·첫 상담 패키지·5회·10회 중에서 골라 쇼핑몰에서 신청해요.", icon: "heart", tone: "g" },
  { title: "결제", when: "쇼핑몰 결제", body: "결제가 끝나면 상담 세부 신청서 안내를 보내 드려요.", icon: "check", tone: "s" },
  { title: "상담 세부 신청서", when: "5~10분", body: "요즘의 고민과 희망 일시, 대면이면 희망 지역 1·2순위를 적어요.", icon: "pencil", tone: "c" },
  { title: "일정 확정·안내", when: "대면 장소는 3일 전", body: "일정을 확정해 알려 드려요. 화상은 접속 안내를 미리 보내 드려요.", icon: "bell", tone: "g" },
  { title: "상담 50분", when: "예약한 날", body: "편하게 이야기해요. 여러 회기라면 첫 상담에서 이후 일정을 함께 조율해요.", icon: "chat", tone: "c" },
];
const STEP_TONE = {
  g: { box: "bg-white text-[var(--brand)]", num: "bg-[var(--brand)]", when: "bg-[var(--brand-light)] text-[var(--brand)]" },
  c: { box: "bg-[var(--coral-light)] text-[var(--coral-ink)]", num: "bg-[var(--coral)]", when: "bg-[var(--coral-light)] text-[var(--coral-ink)]" },
  s: { box: "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]", num: "bg-[var(--mmpi-dark)]", when: "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]" },
};

const FAQ: { q: string; a: string[] }[] = [
  { q: "첫 상담 패키지는 누가 고를 수 있나요?", a: ["심리상담실 현에서 처음 상담을 받는 분의 첫 2회기용이에요. 2회기를 1회 가격(60,000원)으로 만나고, 유효기간은 2개월이에요.", "3회기부터는 1회·5회·10회 중에서 골라요."] },
  { q: "여러 회기를 사면 일정은 어떻게 잡나요?", a: ["첫 상담 일정은 상담 세부 신청서로 잡고, 이후 회기는 첫 상담에서 함께 조율해요. 유효기간(5회 4개월, 10회 8개월) 안에서 내 속도에 맞게 나눠 쓰면 돼요."] },
  { q: "대면과 화상은 무엇이 다른가요?", a: ["가격과 시간(50분)은 같아요. 대면은 서울 홍대·강남·종로·혜화·사당 중 고른 지역의 조용한 스터디룸에서 만나고, 장소는 3일 전에 알려 드려요. 화상은 집에서 편하게 접속해요."] },
  { q: "일정을 바꾸거나 취소하려면요?", a: ["카카오톡 채널 「심리상담실 현」으로 알려 주세요. 메시지를 보낸 시각을 기준으로, 상담 3일(72시간) 전까지는 전액 돌려드려요. 그 뒤로는 가까워질수록 조금씩 차감돼요. 자세한 기준은 아래 가격 박스의 취소·환불 규정에 있어요."] },
  { q: "유효기간이 지나면 남은 회기는 어떻게 되나요?", a: ["남은 회기를 돌려받거나, 1회 연장을 신청할 수 있어요."] },
  { q: "상담 내용은 비밀이 지켜지나요?", a: ["네. 상담에서 나눈 이야기는 법이 정한 예외(본인이나 다른 사람의 안전이 위험할 때 등)를 빼고 밖으로 나가지 않아요."] },
  { q: "정신과 진료와는 어떻게 다른가요?", a: ["개인 상담은 마음을 함께 들여다보고 정리하는 시간이에요. 진단이나 약 처방은 하지 않으며, 의학적 진료를 대체하지 않아요. 필요하면 전문 기관과 함께 다니는 방법도 같이 찾아봐요."] },
  { q: "결제는 어디서 하나요?", a: ["지금은 「심리상담실 현」 쇼핑몰(카페24)에서 결제해요. [신청하기]를 누르면 쇼핑몰로 이어져요."] },
];

const INCLUDED: { title: string; sub: string }[] = [
  { title: "1:1 개인 상담 50분", sub: "김태현 심리상담가와 둘이서" },
  { title: "대면 또는 화상", sub: "서울 5개 지역 스터디룸 · 화상 · 같은 가격" },
  { title: "상담 세부 신청서", sub: "첫 만남 전에 요즘의 이야기를 미리 들어요" },
];

// ── 작은 조각들 (종합심리검사 상세와 같은 값) ──
const WRAP = "mx-auto max-w-[1080px] px-5";
const SEC = "scroll-mt-16 py-[72px] md:py-[104px]";
const SEC_H = "mb-3 mt-3.5 text-[28px] font-extrabold leading-tight tracking-[-0.025em] md:text-4xl";
const LEAD = "max-w-[620px] text-[var(--foreground-muted)]";

function Tile({ icon, tone, size = "h-11 w-11 rounded-[14px]" }: { icon: IconName; tone: keyof typeof TILE; size?: string }) {
  return (
    <span className={`flex shrink-0 items-center justify-center ${size} ${TILE[tone]}`}>
      <Icon name={icon} />
    </span>
  );
}

/** 첫 화면 그림 — 마주 앉은 두 말풍선 */
function TalkArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 320" className={className} role="img" aria-label="두 사람이 마주 앉아 이야기하는 말풍선 그림">
      <ellipse cx="180" cy="292" rx="140" ry="16" fill="#1F3A33" opacity="0.08" />
      <rect x="28" y="40" width="200" height="132" rx="34" fill="#2F6B5A" />
      <path d="M78 168 L64 214 L120 170 Z" fill="#2F6B5A" />
      <rect x="62" y="82" width="120" height="12" rx="6" fill="#A8E0CA" />
      <rect x="62" y="108" width="84" height="12" rx="6" fill="#A8E0CA" opacity="0.7" />
      <rect x="140" y="132" width="196" height="120" rx="34" fill="#FFEDE6" />
      <path d="M284 246 L300 288 L246 250 Z" fill="#FFEDE6" />
      <rect x="140" y="132" width="196" height="120" rx="34" fill="none" stroke="#F08A6C" strokeWidth="3" />
      <circle cx="198" cy="192" r="9" fill="#F08A6C" />
      <circle cx="238" cy="192" r="9" fill="#F08A6C" opacity="0.75" />
      <circle cx="278" cy="192" r="9" fill="#F08A6C" opacity="0.5" />
      <circle cx="300" cy="58" r="22" fill="#9FD6C2" />
      <path d="M300 46 v24 M288 58 h24" stroke="#fff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

export default function IndividualCounselingPage() {
  return (
    <CounselingOptionsProvider>
      <div className="assess text-[17px] leading-[1.75]">
        {/* 1. 첫 화면 */}
        <section id="top" className="relative overflow-hidden bg-[var(--mint-bg)] pb-[60px] pt-7 lg:pb-24 lg:pt-10">
          <span aria-hidden="true" className="pointer-events-none absolute -right-[220px] -top-[60px] h-[760px] w-[760px] rounded-full bg-[radial-gradient(circle,#FBF8F3_0%,rgba(251,248,243,0)_68%)]" />
          <div className={`${WRAP} relative`}>
            <Link href="/counseling" className="inline-flex items-center gap-1 text-sm font-bold text-[var(--foreground-muted)] hover:text-[var(--brand)]">
              <Icon name="back" className="h-4 w-4" /> 상담 목록
            </Link>
            <div className="grid items-center gap-2 lg:grid-cols-[1.05fr_0.95fr] lg:gap-x-10">
              <div>
                <p className="mt-[22px]">
                  <span className="as-chip">개인 상담</span>
                </p>
                <h1 className="mb-2.5 mt-[18px] text-[40px] font-extrabold leading-[1.16] tracking-[-0.045em] text-[var(--tci-dark)] lg:text-[60px]">
                  혼자 하기 <span className="text-[#E0704F]">어려울 때</span>는,
                  <br />
                  <span className="text-[var(--tci)]">함께</span> 이야기해요
                </h1>
                <p className="text-lg font-extrabold tracking-[-0.01em] text-[var(--tci)]">1회기 50분 · 화상·대면 같은 가격</p>
                <p className="mt-3.5 max-w-[520px] text-[17px] text-[var(--foreground-muted)] lg:text-lg">
                  김태현 심리상담가와 1:1로 만나요. 정답을 건네기보다, 지금 내 마음이 어디에 걸려 있는지 <b className="text-[var(--tci-dark)]">함께 천천히</b> 찾아가요.
                </p>
              </div>
              <div className="floaty mx-auto mt-1 w-full max-w-[240px] lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:mt-0 lg:max-w-[420px]">
                <TalkArt className="block h-auto w-full" />
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
                <div className="mt-[26px] rounded-[24px] bg-white/70 p-4 shadow-[var(--shadow-sm)] sm:p-5">
                  <OptionCards name="plan-top" />
                  <div id="hero-buy" className="mt-5">
                    <SelectedPrice />
                    <div className="mt-3.5 flex flex-wrap gap-2.5">
                      <ApplyButton className="flex-auto sm:flex-none" />
                      <a href="#flow" className="as-btn ghost flex-auto sm:flex-none">
                        진행 순서 보기
                      </a>
                    </div>
                    <p className="mt-2.5 text-[13px] text-[var(--foreground-subtle)]">{OPEN_PRICE_UNTIL}까지 오픈 가격이에요. 신청·결제는 「심리상담실 현」 쇼핑몰에서 해요.</p>
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
              이런 마음이 들 때
              <br />
              찾아와요
            </h2>
            <p className={LEAD}>큰 일이 있어야만 상담을 받는 건 아니에요. 아래 중 하나라도 &apos;나네&apos; 싶다면 충분해요.</p>
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
          </div>
        </section>

        {/* 3. 만나는 방식 */}
        <section id="way" className={`${SEC} bg-[var(--surface)]`}>
          <div className={WRAP}>
            <span className="as-chip">만나는 방식</span>
            <h2 className={SEC_H}>
              편한 방식으로,
              <br />
              같은 가격에
            </h2>
            <p className={LEAD}>대면과 화상 중에서 골라요. 시간(50분)과 가격은 같아요.</p>
            <div className="mt-[30px] grid gap-[22px] md:grid-cols-2">
              <div className="rounded-[28px] bg-[linear-gradient(135deg,#FFF3EE,#FFF9F1)] px-5 py-6 shadow-[inset_0_0_0_1.5px_#F8C9B8] md:p-9">
                <div className="flex items-center gap-2 text-[22px] font-extrabold">
                  <Icon name="pin" className="h-7 w-7 text-[var(--coral-ink)]" />
                  대면 상담
                </div>
                <p className="mt-2 text-[16px] leading-[1.65] text-[var(--foreground-muted)]">표정·목소리·몸짓 같은 말 밖의 신호까지 함께 나눠요. 전용 상담실 대신, 고른 지역의 조용한 스터디룸을 빌려서 만나요.</p>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {["홍대", "강남", "종로", "혜화", "사당"].map((p) => (
                    <span key={p} className="rounded-full bg-white px-2.5 py-0.5 text-[13px] font-bold text-[var(--coral-ink)]">
                      {p}
                    </span>
                  ))}
                </div>
                <p className="mt-2.5 text-sm text-[var(--foreground-muted)]">희망 지역 1·2순위를 받아 정하고, 정확한 장소는 상담 3일 전에 알려 드려요.</p>
              </div>
              <div className="rounded-[28px] bg-white px-5 py-6 shadow-[var(--shadow-sm)] md:p-9">
                <div className="flex items-center gap-2 text-[22px] font-extrabold">
                  <Icon name="cam" className="h-7 w-7 text-[var(--brand)]" />
                  화상 상담
                </div>
                <p className="mt-2 text-[16px] leading-[1.65] text-[var(--foreground-muted)]">이동 없이 집에서 편하게 만나요. 혼자 있을 수 있는 조용한 곳이면 충분하고, 접속 안내는 미리 보내 드려요.</p>
                <div className="mt-3 flex flex-wrap gap-x-3.5 gap-y-1.5 text-[14.5px] text-[var(--foreground-muted)]">
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="clock" className="h-[18px] w-[18px] text-[var(--brand-bright)]" />
                    50분
                  </span>
                  <span className="inline-flex items-center gap-1.5">
                    <Icon name="check" className="h-[18px] w-[18px] text-[var(--brand-bright)]" />
                    대면과 같은 가격
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 4. 진행 순서 */}
        <section id="flow" className={SEC}>
          <div className={WRAP}>
            <span className="as-chip">진행 순서</span>
            <h2 className={SEC_H}>
              신청부터 첫 상담까지,
              <br />
              다섯 걸음이에요
            </h2>
            <p className={LEAD}>여러 회기를 고르셨다면, 첫 상담에서 이후 상담 일정을 함께 조율해요.</p>
            <ol className="as-steps mt-8 grid md:grid-cols-5 md:gap-x-[22px]">
              {STEPS.map((s, i) => {
                const t = STEP_TONE[s.tone];
                return (
                  <li key={s.title} className="grid grid-cols-[48px_1fr] gap-3.5 pb-[22px] md:grid-cols-1 md:content-start md:gap-3 md:pb-0">
                    <span className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-[var(--shadow-sm)] ${t.box}`}>
                      <Icon name={s.icon} />
                      <i className={`absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-extrabold not-italic text-white ${t.num}`}>{i + 1}</i>
                    </span>
                    <div>
                      <h3 className="pt-0.5 text-lg font-extrabold text-[var(--foreground)]">{s.title}</h3>
                      <span className={`mb-0.5 mt-1 inline-block rounded-lg px-2 py-0.5 text-[13px] font-extrabold ${t.when}`}>{s.when}</span>
                      <p className="text-[15.5px] leading-relaxed text-[var(--foreground-muted)]">{s.body}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </section>

        {/* 5. 상담가 */}
        <section id="counselor" className={`${SEC} bg-[var(--ivory)]`}>
          <div className={WRAP}>
            <span className="as-chip coral">상담가</span>
            <h2 className={SEC_H}>
              마주 앉아
              <br />
              함께 듣는 사람
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

        {/* 6. 자주 묻는 질문 */}
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
          </div>
        </section>

        {/* 7. 가격 */}
        <section id="price" className={SEC}>
          <div className={WRAP}>
            <span className="as-chip">가격과 옵션</span>
            <h2 className={SEC_H}>
              내 속도에 맞는
              <br />
              회기를 골라요
            </h2>
            <div className="mt-[30px] max-w-[780px] overflow-hidden rounded-[28px] bg-white shadow-[var(--shadow-md)]">
              <div className="relative overflow-hidden bg-[linear-gradient(135deg,var(--brand)_0%,#3E8C72_100%)] px-[22px] py-6 text-white">
                <PriceBoxHead />
              </div>
              <div className="p-[22px]">
                <OptionCards name="plan-price" />
                <ul className="mt-5 grid gap-3">
                  {INCLUDED.map((x) => (
                    <li key={x.title} className="flex items-start gap-3 text-[16.5px] leading-normal">
                      <span className="mt-px flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full bg-[var(--brand-bright)] text-white">
                        <Icon name="check" className="h-[18px] w-[18px]" strokeWidth={2.6} />
                      </span>
                      <span>
                        {x.title}
                        <small className="block text-sm text-[var(--foreground-muted)]">{x.sub}</small>
                      </span>
                    </li>
                  ))}
                </ul>
                <ApplyButton className="mt-5 w-full" />
                <p className="mt-2.5 text-center text-[13px] text-[var(--foreground-subtle)]">{OPEN_PRICE_UNTIL}까지 오픈 가격 · 신청·결제는 쇼핑몰(카페24)에서</p>
                <details className="mt-4 rounded-2xl bg-[var(--ivory)]">
                  <summary className="flex min-h-[52px] cursor-pointer items-center gap-2.5 px-4 py-3.5 text-[15.5px] font-bold">
                    취소·환불 규정 한눈에
                    <Icon name="chev" className="as-chev ml-auto h-5 w-5 text-[var(--foreground-subtle)]" />
                  </summary>
                  <div className="space-y-3 px-4 pb-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
                    <CancelTable />
                    <p>
                      변경·취소는 카카오톡 채널 「심리상담실 현」으로 알려 주세요(보낸 시각이 기준이에요). 묶음 중도 해지와 예외 사항은{" "}
                      <Link href="/refund" className="link-underline text-[var(--foreground)]">
                        환불 규정
                      </Link>
                      에 자세히 있어요.
                    </p>
                  </div>
                </details>
              </div>
            </div>
          </div>
        </section>

        {/* 8. 마지막 */}
        <section className="pb-[72px] md:pb-[104px]">
          <div className={WRAP}>
            <div className="relative overflow-hidden rounded-[32px] bg-[var(--mint-bg)] px-[22px] pb-12 pt-10 text-center text-[var(--tci-dark)] md:px-10 md:py-[72px]">
              <span aria-hidden="true" className="pointer-events-none absolute left-1/2 top-1/2 h-[520px] w-[520px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,#FBF8F3_0%,rgba(251,248,243,0)_68%)]" />
              <TalkArt className="relative mx-auto mb-3.5 h-auto w-[150px]" />
              <h2 className="relative text-[28px] font-extrabold leading-tight tracking-[-0.025em] md:text-[38px]">
                오늘의 마음을,
                <br />
                <span className="text-[#E0704F]">함께</span> 꺼내 봐요
              </h2>
              <p className="relative mt-2 text-[var(--foreground-muted)]">자세한 이야기는 결제 뒤 상담 세부 신청서로 들을게요.</p>
              <ApplyButton className="relative mt-6" />
            </div>
          </div>
        </section>

        <CounselingStickyBar targetId="hero-buy" />
      </div>
    </CounselingOptionsProvider>
  );
}
