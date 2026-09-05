import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "셀프 워크북",
  description: "매일 10분, 나에게 질문하고 기록하는 웹 워크북. 1주차는 무료.",
};

// S4(워크북)에서 실제 목록·수행 화면으로 교체된다. 지금은 안내만.
export default function WorkbooksPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow mb-4">셀프 워크북</p>
        <h1 className="font-display text-4xl leading-tight text-[var(--brand-ink)] sm:text-5xl">
          매일 10분,
          <br />
          나에게 질문하기.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          PDF로 판매하던 셀프 심리상담 워크북을 웹에서 하루 단위로 수행할 수 있게 만들고 있습니다. 첫 워크북은{" "}
          <strong className="text-[var(--foreground)]">불안과 함께 살기 — 60일 CBT 워크북</strong>. 1주차는 누구나 무료입니다.
        </p>
        <div className="mt-12 rounded-3xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="font-display text-xl text-[var(--foreground)]">준비 중입니다</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            지금은 쇼핑몰에서 PDF 버전을 구매할 수 있어요. 웹 버전이 열리면 회원에게 알려드립니다.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center rounded-full bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
              회원가입하고 소식 받기
            </Link>
            <a
              href={process.env.NEXT_PUBLIC_SHOP_URL ?? "https://hyeon-counseling.com"}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 rounded-full border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--brand)] hover:text-[var(--brand)]"
            >
              PDF 워크북 보기 <span aria-hidden>↗</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
