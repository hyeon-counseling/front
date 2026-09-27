import type { Metadata } from "next";
import Link from "next/link";
import type { CourseListItem } from "@/lib/course";
import { formatPrice } from "@/lib/workbook";

export const metadata: Metadata = {
  title: "강의",
  description: "심리상담가 현의 온라인 강의. 10분씩, 한 편씩.",
};

async function getCourses(): Promise<CourseListItem[] | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/courses`, { next: { revalidate: 60 } });
    const body = await res.json();
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

export default async function CoursesPage() {
  const list = await getCourses();

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="eyebrow">강의</span>
          <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">10분씩, 한 편씩.</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            심리상담가가 직접 설명하는 짧은 강의예요. 이어보기와 진도가 저장돼서 틈틈이 들을 수 있어요.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {list === null && (
            <div className="card p-8 text-sm text-[var(--foreground-muted)] md:col-span-2">
              강의 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.
            </div>
          )}
          {list?.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[var(--border)] p-10 text-center md:col-span-2">
              <p className="text-xl font-bold text-[var(--foreground)]">곧 공개됩니다</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                첫 강의는 <strong className="text-[var(--foreground)]">고기능 우울증</strong>을 다뤄요. 그동안 무료 아티클과 워크북 1주차를 먼저 만나 보세요.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/workbooks" className="inline-flex items-center rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                  워크북 1주차 무료로 시작
                </Link>
                <Link href="/articles" className="inline-flex items-center rounded-xl bg-[var(--surface)] px-6 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface-muted)]">
                  아티클 읽기
                </Link>
              </div>
            </div>
          )}
          {list?.map((c) => {
            const price = formatPrice(c.salePriceEffective);
            const original = c.salePrice && c.price && c.price > c.salePrice ? formatPrice(c.price) : null;
            return (
              <Link key={c.slug} href={`/courses/${c.slug}`} className="card card-hover group flex flex-col overflow-hidden">
                <div className="bg-brand-gradient relative flex aspect-[16/9] items-end p-6 text-white">
                  {c.coverImageUrl && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={c.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                  )}
                  <span className="relative rounded-lg bg-black/25 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                    영상 {c.lessonCount}편{c.totalMinutes ? ` · 총 ${c.totalMinutes}분` : ""}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-bold leading-snug text-[var(--foreground)] group-hover:text-[var(--brand)]">{c.title}</h2>
                  {c.subtitle && <p className="mt-2 text-[var(--foreground-muted)]">{c.subtitle}</p>}
                  <div className="mt-auto flex items-end justify-between pt-6">
                    <span className="text-sm text-[var(--foreground-subtle)]">{c.instructor}</span>
                    <span className="text-right">
                      {original && <span className="mr-2 text-sm text-[var(--foreground-subtle)] line-through">{original}</span>}
                      <span className="text-lg font-extrabold text-[var(--foreground)]">{price ?? "준비 중"}</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
