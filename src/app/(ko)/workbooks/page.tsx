import type { Metadata } from "next";
import Link from "next/link";
import { formatPrice, type WorkbookListItem } from "@/lib/workbook";

export const metadata: Metadata = {
  title: "셀프 워크북",
  description: "매일 10분, 나에게 질문하고 기록하는 웹 워크북. 1주차는 무료.",
};

async function getWorkbooks(): Promise<WorkbookListItem[] | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/workbooks`, { next: { revalidate: 60 } });
    const body = await res.json();
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

export default async function WorkbooksPage() {
  const list = await getWorkbooks();

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="eyebrow">셀프 워크북</span>
          <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">매일 10분, 나에게 질문하기</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            검증된 심리치료 방법을 하루 한 장으로 나눴어요. 적은 내용은 자동으로 저장되고 나만 볼 수 있어요.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {list === null && (
            <div className="card p-8 text-sm text-[var(--foreground-muted)] md:col-span-2">
              워크북 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.
            </div>
          )}
          {list?.length === 0 && (
            <div className="card p-8 text-sm text-[var(--foreground-muted)] md:col-span-2">곧 첫 워크북이 열려요.</div>
          )}
          {list?.map((w) => (
            <Link key={w.slug} href={`/workbooks/${w.slug}`} className="card card-hover group flex flex-col overflow-hidden">
              <div className="bg-brand-gradient relative px-7 pb-8 pt-7 text-white">
                <p className="text-xs font-semibold text-white/70">{w.seriesLabel}</p>
                <h2 className="mt-3 text-2xl font-extrabold tracking-tight">{w.title}</h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-white/80">{w.subtitle}</p>
                <span className="absolute right-6 top-6 rounded-full bg-white/15 px-2.5 py-1 text-xs font-semibold ring-1 ring-white/25">1주차 무료</span>
              </div>
              <div className="flex flex-1 flex-col p-7">
                <div className="flex flex-wrap gap-2 text-xs font-medium text-[var(--foreground-muted)]">
                  {w.framework && <span className="rounded-lg bg-[var(--surface)] px-2.5 py-1">{w.framework}</span>}
                  {w.durationLabel && <span className="rounded-lg bg-[var(--surface)] px-2.5 py-1">{w.durationLabel}</span>}
                  <span className="rounded-lg bg-[var(--surface)] px-2.5 py-1">
                    {w.plannedWeeks.length > w.openWeeks ? `${w.openWeeks}/${w.plannedWeeks.length}단계 공개` : `${w.dayCount}일차`}
                  </span>
                </div>
                <div className="mt-auto flex items-center justify-between pt-6">
                  <span className="text-sm font-semibold text-[var(--foreground)]">{formatPrice(w.salePrice ?? w.price) ?? "무료로 시작"}</span>
                  <span className="text-sm font-semibold text-[var(--brand)]">
                    자세히 보기 <span className="inline-block transition-transform group-hover:translate-x-0.5">→</span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <p className="mt-10 text-sm text-[var(--foreground-subtle)]">
          PDF 버전 워크북은{" "}
          <a href={process.env.NEXT_PUBLIC_SHOP_URL ?? "https://hyeon-counseling.com"} target="_blank" rel="noopener noreferrer" className="link-underline text-[var(--foreground-muted)]">
            쇼핑몰
          </a>
          에서 따로 판매하고 있어요.
        </p>
      </div>
    </div>
  );
}
