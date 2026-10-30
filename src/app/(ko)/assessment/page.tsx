import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { TestsTabs } from "@/components/assessment/TestsTabs";

export const metadata: Metadata = {
  title: "전문 심리검사",
  description: "TCI · MMPI-3 · SCT 세 가지 검사와 김태현 심리상담가의 종합 해석 보고서, 해석 상담까지 한 번에.",
};

// 전문 심리검사 — 쇼핑몰식 상품 목록 (지금은 종합심리검사 1종)
const PRODUCTS = [
  {
    href: "/assessment/comprehensive",
    // 상품 이미지(16:9) — 10/29 상담가 확정 A안. 없으면 그린 머리로
    cover: "/assessment/comprehensive-cover.png" as string | null,
    badge: "대표",
    title: "종합심리검사 TCI + MMPI-3 + SCT",
    summary: "타고난 기질, 지금의 마음 상태, 내 문장 속 이야기까지. 세 검사를 함께 읽고 해석 상담으로 풀어 드려요.",
    tags: ["검사 3종", "종합 해석 보고서", "해석 상담 약 60분", "해석 영상"],
    price: 150000,
  },
];

export default function AssessmentListPage() {
  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <TestsTabs active="pro" />
        <div className="mt-10 max-w-2xl">
          <span className="eyebrow">전문 심리검사</span>
          <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">검사 결과를, 내 삶의 언어로</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            출판사의 표준화된 온라인 검사를 받고, 김태현 심리상담가가 접수면접지와 함께 읽어 해석해 드려요. 진단이 아니라 나를 더 깊이 이해하기 위한 검사예요.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PRODUCTS.map((p) => (
            <Link key={p.href} href={p.href} className="card card-hover group flex flex-col overflow-hidden">
              {p.cover ? (
                <div className="relative aspect-video bg-[var(--surface)]">
                  <Image src={p.cover} alt={p.title} fill sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw" className="object-cover" />
                  <span className="absolute right-3 top-3 rounded-full bg-[var(--brand)] px-2.5 py-1 text-xs font-semibold text-white">{p.badge}</span>
                </div>
              ) : (
                <div className="relative flex h-40 items-end bg-[var(--brand)] p-5 text-white">
                  <span className="absolute right-4 top-4 rounded-full bg-white/20 px-2.5 py-1 text-xs font-semibold">{p.badge}</span>
                  <div className="flex gap-2 text-sm font-bold">
                    {["TCI", "MMPI-3", "SCT"].map((t) => (
                      <span key={t} className="rounded-lg bg-white/15 px-2.5 py-1">
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
              )}
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
                  <span className="text-xl font-extrabold text-[var(--foreground)]">{p.price.toLocaleString("ko-KR")}원</span>
                  <span className="text-sm font-semibold text-[var(--brand)] group-hover:underline">자세히 보기 →</span>
                </p>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--foreground-subtle)]">
          가볍게 지금의 마음을 살펴보고 싶다면{" "}
          <Link href="/tests" className="link-underline">
            간이 무료 심리검사
          </Link>
          부터 해 보세요.
        </p>
      </div>
    </div>
  );
}
