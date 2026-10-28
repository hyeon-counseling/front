import type { Metadata } from "next";
import Link from "next/link";
import { TestsTabs } from "@/components/assessment/TestsTabs";
import { ProcessSteps } from "@/components/assessment/ProcessSteps";

export const metadata: Metadata = {
  title: "종합심리검사 TCI + MMPI-3 + SCT",
  description: "온라인 심리검사 3종 + 종합 해석 보고서 + 해석 상담 약 60분 + 해석 영상. 150,000원.",
};

// 상품 상세 — 11-신청페이지-v2의 소개·절차를 사이트 톤으로
const INCLUDED = [
  { big: "3", title: "온라인 심리검사 3종", body: "MMPI-3(성격·마음 상태), TCI-RS(타고난 기질과 성격), SCT(문장 완성). 모두 집에서 온라인으로 받아요." },
  { big: "보", title: "종합 해석 보고서", body: "김태현 심리상담가가 세 검사와 접수면접지를 함께 읽고 써요." },
  { big: "60", title: "해석 상담 약 60분", body: "대면 또는 화상으로 결과를 함께 보며 이야기 나눠요." },
  { big: "영", title: "해석 영상", body: "내 검사 해석을 영상으로도 다시 볼 수 있어요. (3만 원 상당)" },
];

const TESTS = [
  { name: "MMPI-3", what: "성격·마음 상태", body: "마음사랑에서 2026년 10월 새로 나온 한국판이에요. 335문항, '예/아니오'로 답하고 약 35~50분 걸려요." },
  { name: "TCI-RS", what: "타고난 기질과 성격", body: "자극을 찾는 정도, 위험을 피하는 정도처럼 타고난 기질과, 살면서 다듬어 온 성격을 함께 봐요." },
  { name: "SCT", what: "문장 완성", body: "\"나는 ___\"처럼 시작하는 문장을 내 말로 채워요. 점수로는 안 보이는 내 이야기를 읽어요." },
];

const FAQ = [
  { q: "진단을 받는 검사인가요?", a: "아니에요. 나를 더 깊이 이해하기 위한 검사예요. 의학적 판단은 의료진의 몫이에요." },
  { q: "언제 상담을 받을 수 있나요?", a: "신청일로부터 14일 뒤부터 고를 수 있어요. 검사와 보고서 준비에 그만큼 시간이 필요해서예요." },
  { q: "검사는 한 번에 다 해야 하나요?", a: "나눠서 해도 괜찮아요. 해석 상담 7일 전까지만 마쳐 주세요." },
  { q: "대면 상담은 어디서 하나요?", a: "서울 홍대·강남·종로·혜화·사당 중 고른 지역의 조용한 스터디룸에서 해요. 정확한 장소는 상담 3일 전에 알려 드려요." },
];

export default function ComprehensivePage() {
  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-4xl">
        <TestsTabs active="pro" />
        <p className="mt-8 text-sm text-[var(--foreground-subtle)]">
          <Link href="/assessment" className="hover:text-[var(--foreground)]">
            전문 심리검사
          </Link>{" "}
          ›
        </p>

        <div className="mt-3 grid gap-8 lg:grid-cols-[1fr_320px]">
          <div>
            <h1 className="font-display text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">종합심리검사 + 해석 상담</h1>
            <p className="mt-3 text-lg leading-relaxed text-[var(--foreground-muted)]">
              나를 더 깊이 이해하고 싶은 분을 위한 검사예요. 신청은 3분, 자세한 이야기는 결제 뒤 접수면접지로 들을게요.
            </p>
          </div>
          {/* 가격·신청 — 넓은 화면에서는 오른쪽에 고정 */}
          <aside className="card h-fit p-6 lg:sticky lg:top-24">
            <p className="text-sm font-semibold text-[var(--foreground-subtle)]">결제 금액</p>
            <p className="mt-1 text-3xl font-extrabold text-[var(--foreground)]">150,000원</p>
            <ul className="mt-4 space-y-1.5 text-sm text-[var(--foreground-muted)]">
              <li>✓ 검사 3종 · 종합 해석 보고서</li>
              <li>✓ 해석 상담 약 60분 (대면·화상)</li>
              <li>✓ 해석 영상 (3만 원 상당)</li>
            </ul>
            <Link
              href="/assessment/comprehensive/apply"
              className="mt-6 flex h-13 w-full items-center justify-center rounded-xl bg-[var(--brand)] py-3.5 text-base font-bold text-white hover:bg-[var(--brand-hover)]"
            >
              신청하기
            </Link>
            <p className="mt-3 text-center text-xs text-[var(--foreground-subtle)]">결제하면 고른 상담 시간으로 바로 확정돼요.</p>
          </aside>
        </div>

        <section className="mt-14">
          <h2 className="text-xl font-bold text-[var(--foreground)]">이 안에 모두 들어 있어요</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            {INCLUDED.map((x) => (
              <div key={x.title} className="flex gap-4 rounded-2xl bg-[var(--surface)] p-5">
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-lg font-extrabold text-[var(--brand)]">{x.big}</span>
                <div>
                  <p className="font-semibold text-[var(--foreground)]">{x.title}</p>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{x.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-bold text-[var(--foreground)]">세 가지 검사</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            {TESTS.map((t) => (
              <div key={t.name} className="card p-5">
                <p className="text-lg font-extrabold text-[var(--brand)]">{t.name}</p>
                <p className="text-sm font-semibold text-[var(--foreground)]">{t.what}</p>
                <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{t.body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-bold text-[var(--foreground)]">이렇게 진행돼요</h2>
          <ProcessSteps />
        </section>

        <section className="mt-14">
          <h2 className="text-xl font-bold text-[var(--foreground)]">자주 묻는 질문</h2>
          <div className="mt-5 divide-y divide-[var(--border-light)] rounded-2xl border border-[var(--border-light)]">
            {FAQ.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-semibold text-[var(--foreground)]">
                  <span className="mr-2 text-[var(--brand)]">Q</span>
                  {f.q}
                </summary>
                <p className="mt-2 pl-6 text-sm leading-relaxed text-[var(--foreground-muted)]">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        <div className="mt-14 rounded-3xl bg-[var(--brand)] p-8 text-center text-white">
          <p className="text-xl font-bold">나를 설명하는 말을, 함께 찾아봐요</p>
          <Link href="/assessment/comprehensive/apply" className="mt-5 inline-flex h-12 items-center rounded-xl bg-white px-7 font-bold text-[var(--brand)]">
            150,000원 · 신청하기
          </Link>
        </div>
      </div>
    </div>
  );
}
