import type { Metadata } from "next";
import Link from "next/link";
import { CounselingRulesSummary, OPEN_PRICE_UNTIL, PLANS, PRICE } from "@/components/counseling/CounselingRules";

export const metadata: Metadata = {
  title: "개인 상담",
  description: "김태현 심리상담가의 개인 상담 — 1회기 50분, 화상·대면 같은 가격 60,000원. 첫 상담 패키지, 5·10회 묶음.",
};

// 신청·결제는 카페24 쇼핑몰에서 진행한다 (상담운영시스템·사이트 결제는 추후). 상품·가격·취소 규정은 결정 #56(10/30).
const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL ?? "https://hyeoncounseling.cafe24.com"; // 자체 도메인은 이 사이트로, 쇼핑몰은 카페24 기본 도메인 (10/30)

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

const STEPS = [
  { t: "상담 신청", d: "쇼핑몰에서 상담 상품(회기별·첫 상담 패키지·묶음)을 고르고 희망 방식(화상·대면)을 알려 주세요." },
  { t: "결제", d: "결제가 끝나면 상담 세부 신청서 안내를 보내 드려요." },
  { t: "상담 세부 신청서", d: "요즘의 고민과 희망 일시, 대면이면 희망 지역 1·2순위를 적어 주세요." },
  { t: "일정 확정·안내", d: "일정을 확정해 알려 드려요. 대면은 장소를 상담 3일 전에, 화상은 접속 안내를 미리 보내 드려요." },
  { t: "상담", d: "50분 동안 함께 이야기해요." },
];

export default function CounselingPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4">
          <span className="eyebrow rise rise-1">개인 상담</span>
        </p>
        <h1 className="font-display rise rise-2 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">
          혼자 하기 어려울 때는,
          <br />
          함께 이야기해요.
        </h1>
        <p className="rise rise-3 mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          김태현 심리상담가와 1회기 50분, 화상 또는 대면으로 만나요. 화상과 대면은 같은 가격이에요. 신청과 결제는 쇼핑몰에서 받고 있어요.
        </p>

        <div className="rise rise-4 mt-10 flex flex-wrap gap-3">
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            쇼핑몰에서 상담 신청하기
            <span aria-hidden>↗</span>
          </a>
          <a href="mailto:support@hyeon-counseling.com" className="link-underline px-2 py-3 text-sm text-[var(--foreground)]">
            먼저 문의하기
          </a>
        </div>

        {/* 가격 */}
        <section className="mt-16">
          <h2 className="font-display text-2xl text-[var(--foreground)]">가격</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            1회기 50분 · 화상·대면 같은 가격 <b className="text-[var(--foreground)]">{won(PRICE)}</b> · {OPEN_PRICE_UNTIL}까지 오픈 가격이에요.
          </p>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {PLANS.map((p) => (
              <div key={p.key} className={`card p-5 ${p.key === "first" ? "ring-2 ring-[var(--brand)]" : ""}`}>
                <p className="text-sm font-semibold text-[var(--foreground-muted)]">
                  {p.name}
                  {p.key === "first" && <span className="ml-2 rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-bold text-[var(--brand)]">처음이라면</span>}
                </p>
                <p className="mt-1 text-2xl font-extrabold text-[var(--foreground)]">
                  {won(p.total)}
                  {p.sessions > 1 && <span className="ml-1 text-sm font-semibold text-[var(--foreground-muted)]">/ {p.sessions}회</span>}
                </p>
                <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                  {p.note}
                  {p.valid && ` · 유효기간 ${p.valid}`}
                  {p.sessions > 1 && ` · 회당 ${won(p.total / p.sessions)}`}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-3 text-xs text-[var(--foreground-subtle)]">첫 상담 패키지는 처음 오시는 분의 첫 2회기용이에요. 3회기부터는 회기별·5회·10회 묶음 중에서 골라요.</p>
        </section>

        {/* 진행 순서 */}
        <section className="mt-16">
          <h2 className="font-display text-2xl text-[var(--foreground)]">진행 순서</h2>
          <ol className="mt-5 grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
            {STEPS.map((s, i) => (
              <li key={s.t} className="bg-[var(--background)] p-6">
                <p className="font-display mb-2 text-sm text-[var(--foreground-subtle)]">0{i + 1}</p>
                <h3 className="font-display text-lg text-[var(--foreground)]">{s.t}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* 장소 */}
        <section className="mt-12 rounded-2xl bg-[var(--surface)] p-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <p className="mb-2 font-semibold text-[var(--foreground)]">대면 상담 장소</p>
          <p>
            서울 홍대·강남·종로·혜화·사당 중 희망하신 1·2순위 지역의 조용한 스터디룸을 빌려서 만나요(전용 상담실은 없어요). 정확한 장소는 상담 3일 전에 알려 드려요.
          </p>
        </section>

        {/* 취소·변경 */}
        <section className="mt-12">
          <h2 className="font-display text-2xl text-[var(--foreground)]">취소·변경</h2>
          <div className="mt-4">
            <CounselingRulesSummary />
          </div>
        </section>

        {/* 안내 */}
        <div className="mt-12 rounded-2xl bg-[var(--surface)] p-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <p className="mb-2 font-semibold text-[var(--foreground)]">알아두세요</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>상담은 심리 교육과 자기 이해를 돕는 서비스이며 정신과 진료를 대체하지 않아요.</li>
            <li>지금 위급한 상황이라면 가까운 응급실이나 전문 기관의 도움을 먼저 받아 주세요.</li>
            <li>
              심리검사와 해석 상담이 함께 필요하다면{" "}
              <Link href="/assessment/comprehensive" className="link-underline text-[var(--foreground)]">
                종합심리검사
              </Link>
              를 봐 주세요.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
