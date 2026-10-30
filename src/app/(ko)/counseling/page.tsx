import type { Metadata } from "next";
import Link from "next/link";
import { OPEN_PRICE_UNTIL, PRICE } from "@/components/counseling/CounselingRules";

export const metadata: Metadata = {
  title: "상담",
  description: "김태현 심리상담가의 상담 — 1:1 개인 상담 50분, 화상·대면 같은 가격.",
};

// 상담 — 심리검사 목록(/assessment)과 같은 상품 목록 (지금은 개인 상담 1종). 상품·가격은 결정 #56(10/30)
const PRODUCTS = [
  {
    href: "/counseling/individual",
    badge: "대표",
    chips: ["1:1", "50분", "화상·대면"],
    title: "개인 상담",
    summary: "김태현 심리상담가와 1:1로 만나요. 지금 내 마음이 어디에 걸려 있는지 함께 천천히 찾아가요.",
    tags: ["1회기 50분", "화상·대면 같은 가격", "첫 상담 패키지", "5·10회 할인"],
    price: PRICE,
  },
];

export default function CounselingListPage() {
  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="eyebrow">상담</span>
          <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">혼자 하기 어려울 때는, 함께</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            김태현 심리상담가가 직접 만나요. 화상과 대면은 같은 가격이고, {OPEN_PRICE_UNTIL}까지 오픈 가격이에요.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href} className="card card-hover group flex flex-col overflow-hidden">
              <div className="relative flex h-40 items-end bg-[linear-gradient(135deg,var(--brand)_0%,#3E8C72_100%)] p-5 text-white">
                <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">{p.badge}</span>
                <div className="flex gap-2 text-sm font-bold">
                  {p.chips.map((t) => (
                    <span key={t} className="rounded-lg bg-white/15 px-2.5 py-1">
                      {t}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <h2 className="text-lg font-bold leading-snug text-[var(--foreground)] group-hover:text-[var(--brand)]">{p.title}</h2>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{p.summary}</p>
                <div className="mt-4 flex flex-wrap gap-1.5">
                  {p.tags.map((t) => (
                    <span key={t} className="rounded-full bg-[var(--surface)] px-2.5 py-1 text-xs text-[var(--foreground-muted)]">
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-5 flex items-baseline justify-between">
                  <span className="text-xl font-extrabold text-[var(--foreground)]">
                    {p.price.toLocaleString("ko-KR")}원<span className="ml-1 text-sm font-semibold text-[var(--foreground-muted)]">/ 1회</span>
                  </span>
                  <span className="text-sm font-semibold text-[var(--brand)] group-hover:underline">자세히 보기 →</span>
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--foreground-subtle)]">
          검사로 나를 먼저 살펴보고 싶다면{" "}
          <Link href="/assessment" className="link-underline">
            전문 심리검사
          </Link>
          를 봐 주세요.
        </p>
      </div>
    </div>
  );
}
