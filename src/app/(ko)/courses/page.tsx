import type { Metadata } from "next";
import Link from "next/link";
import { COMPONENT_FILTERS, type CourseListItem, type LessonType } from "@/lib/course";
import { totalTimeLabel, type ProgramListItem } from "@/lib/program";
import { formatPrice } from "@/lib/practice";

export const metadata: Metadata = {
  title: "강의",
  description: "심리상담가 현의 온라인 강의. 영상·오디오·글·퀴즈·카드·쓰기 실습으로 10분씩.",
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

async function getPrograms(): Promise<ProgramListItem[]> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/programs`, { next: { revalidate: 60 } });
    const body = await res.json();
    return body.success ? body.data : [];
  } catch {
    return [];
  }
}

// 강의 목록 — 과정(묶음) + 강의. 구성 요소(영상·오디오·글·퀴즈·카드·쓰기 실습)로 거를 수 있다 (?has=practice)
export default async function CoursesPage({ searchParams }: { searchParams: Promise<{ has?: string }> }) {
  const [all, programs, sp] = await Promise.all([getCourses(), getPrograms(), searchParams]);
  const has = COMPONENT_FILTERS.find((f) => f.type === sp.has)?.type ?? null;
  const list = all && has ? all.filter((c) => c.components?.includes(has)) : all;
  // 목록에 실제로 있는 구성 요소만 필터로 보여준다
  const present = new Set<LessonType>((all ?? []).flatMap((c) => c.components ?? []));
  const filters = COMPONENT_FILTERS.filter((f) => present.has(f.type));

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="eyebrow">강의</span>
          <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">10분씩, 한 편씩.</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            심리상담가가 직접 만든 강의예요. 보고 듣는 강의도, 매일 직접 써 보는 강의도 있어요. 진도와 기록이 저장돼서 틈틈이 이어 할 수 있어요.
          </p>
        </div>

        {filters.length > 1 && (
          <nav aria-label="구성 요소로 거르기" className="mt-8 flex flex-wrap gap-2">
            <Link
              href="/courses"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${!has ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"}`}
            >
              전체
            </Link>
            {filters.map((f) => (
              <Link
                key={f.type}
                href={`/courses?has=${f.type}`}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${has === f.type ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)] hover:bg-[var(--surface-muted)]"}`}
              >
                {f.icon} {f.label}
              </Link>
            ))}
          </nav>
        )}

        {programs.length > 0 && !has && (
          <section className="mt-12">
            <h2 className="text-lg font-bold text-[var(--foreground)]">과정 · 여러 과목을 한 번에</h2>
            <div className="mt-4 grid gap-6 md:grid-cols-2">
              {programs.map((p) => {
                const price = formatPrice(p.salePriceEffective);
                const separate = p.separateTotal && p.salePriceEffective && p.separateTotal > p.salePriceEffective ? p.separateTotal : null;
                return (
                  <Link key={p.slug} href={`/programs/${p.slug}`} className="card card-hover group flex flex-col overflow-hidden ring-1 ring-[var(--brand-light)]">
                    <div className="bg-brand-gradient relative flex aspect-[16/7] items-end p-6 text-white">
                      {p.coverImageUrl && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.coverImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                      )}
                      <span className="relative rounded-lg bg-black/25 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                        {p.courseCount}과목 · {p.lessonCount}차시{p.totalMinutes ? ` · ${totalTimeLabel(p.totalMinutes)}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <span className="text-xs font-bold text-[var(--brand)]">과정</span>
                      <h3 className="mt-1 text-xl font-bold leading-snug text-[var(--foreground)] group-hover:text-[var(--brand)]">{p.title}</h3>
                      {p.subtitle && <p className="mt-2 text-[var(--foreground-muted)]">{p.subtitle}</p>}
                      <div className="mt-auto flex items-end justify-between pt-6">
                        <span className="text-sm text-[var(--foreground-subtle)]">{p.instructor}</span>
                        <span className="text-right">
                          {separate && <span className="mr-2 text-sm text-[var(--foreground-subtle)] line-through">{formatPrice(separate)}</span>}
                          <span className="text-lg font-extrabold text-[var(--foreground)]">{price ?? "준비 중"}</span>
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
            {!!list?.length && <h2 className="mt-14 text-lg font-bold text-[var(--foreground)]">강의</h2>}
          </section>
        )}

        <div className={`${programs.length > 0 && !has ? "mt-4" : "mt-10"} grid gap-6 md:grid-cols-2`}>
          {list === null && (
            <div className="card p-8 text-sm text-[var(--foreground-muted)] md:col-span-2">
              강의 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.
            </div>
          )}
          {list?.length === 0 && has && (
            <p className="text-sm text-[var(--foreground-muted)] md:col-span-2">이 구성의 강의가 아직 없어요.</p>
          )}
          {list?.length === 0 && !has && programs.length === 0 && (
            <div className="rounded-3xl border border-dashed border-[var(--border)] p-10 text-center md:col-span-2">
              <p className="text-xl font-bold text-[var(--foreground)]">곧 공개됩니다</p>
              <p className="mt-2 text-sm text-[var(--foreground-muted)]">
                첫 강의는 <strong className="text-[var(--foreground)]">고기능 우울증</strong>을 다뤄요. 그동안 무료 아티클과 심리검사를 먼저 만나 보세요.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                <Link href="/tests" className="inline-flex items-center rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)]">
                  무료 심리검사 해 보기
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
                  <span className="relative flex flex-wrap gap-1.5">
                    <span className="rounded-lg bg-black/25 px-2.5 py-1 text-xs font-semibold backdrop-blur-sm">
                      {[c.durationLabel, `${c.lessonCount}차시`, c.totalMinutes ? totalTimeLabel(c.totalMinutes) : ""].filter(Boolean).join(" · ")}
                    </span>
                    {!!c.previewCount && <span className="rounded-lg bg-white/90 px-2.5 py-1 text-xs font-bold text-[var(--brand)]">무료 체험</span>}
                  </span>
                </div>
                <div className="flex flex-1 flex-col p-6">
                  <h2 className="text-xl font-bold leading-snug text-[var(--foreground)] group-hover:text-[var(--brand)]">{c.title}</h2>
                  {c.subtitle && <p className="mt-2 text-[var(--foreground-muted)]">{c.subtitle}</p>}
                  {!!c.components?.length && (
                    <p className="mt-3 flex flex-wrap gap-1.5">
                      {COMPONENT_FILTERS.filter((f) => c.components!.includes(f.type)).map((f) => (
                        <span key={f.type} className="rounded-full bg-[var(--surface)] px-2.5 py-0.5 text-xs font-medium text-[var(--foreground-muted)]">
                          {f.icon} {f.label}
                        </span>
                      ))}
                    </p>
                  )}
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
