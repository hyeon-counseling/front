import type { Metadata } from "next";
import Link from "next/link";
import type { TestCard } from "@/lib/psychTest";
import { COMMON_ORIENTATION } from "@/components/tests/TestParts";

export const metadata: Metadata = {
  title: "무료 심리검사",
  description: "불안(GAD-7)·우울(PHQ-9)·고기능 우울증·자기자비·관계 패턴까지, 3분이면 지금의 마음을 살펴볼 수 있어요.",
};

async function getTests(): Promise<TestCard[] | null> {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/tests`, { next: { revalidate: 60 } });
    const body = await res.json();
    return body.success ? body.data : null;
  } catch {
    return null;
  }
}

export default async function TestsPage() {
  const tests = await getTests();

  return (
    <div className="px-4 py-14 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <span className="eyebrow">무료 심리검사</span>
          <h1 className="font-display mt-4 text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">3분, 지금의 마음 살펴보기</h1>
          <p className="mt-4 text-lg leading-relaxed text-[var(--foreground-muted)]">
            상담 현장에서 쓰는 표준 자가 검사를 무료로 해 볼 수 있어요. 결과와 함께 지금 나에게 도움이 되는 방법을 안내해 드려요.
          </p>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {tests === null && <p className="card p-8 text-sm text-[var(--foreground-muted)] sm:col-span-2">검사 목록을 불러오지 못했어요. 잠시 후 새로고침해 주세요.</p>}
          {tests?.map((t) => (
            <Link key={t.slug} href={`/tests/${t.slug}`} className="card card-hover group flex flex-col p-6">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl" style={{ background: `${t.color ?? "#3d6b5e"}1a` }}>
                {t.emoji}
              </span>
              <h2 className="mt-4 text-lg font-bold leading-snug text-[var(--foreground)] group-hover:text-[var(--brand)]">{t.title}</h2>
              {t.engTitle && <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">{t.engTitle}</p>}
              <p className="mt-2 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{t.summary}</p>
              <p className="mt-5 text-xs font-semibold text-[var(--foreground-subtle)]">
                {t.questionCount}문항 · 약 {t.estMinutes}분 <span className="ml-1 text-[var(--brand)] group-hover:underline">시작하기 →</span>
              </p>
            </Link>
          ))}
        </div>

        <section className="mt-16">
          <h2 className="text-xl font-bold text-[var(--foreground)]">검사 전에 기억해 주세요</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {COMMON_ORIENTATION.map((o) => (
              <div key={o.title} className="rounded-2xl bg-[var(--surface)] p-5">
                <p className="text-lg">{o.icon}</p>
                <p className="mt-2 font-semibold text-[var(--foreground)]">{o.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{o.body}</p>
              </div>
            ))}
          </div>
          <p className="mt-6 text-xs text-[var(--foreground-subtle)]">
            자가 검사는 의학적 진단을 대신하지 않아요. 검사를 하려면 로그인이 필요하고, 결과는 나만 볼 수 있어요(상담가는 상담 연계를 위해 열람할 수 있어요).
          </p>
        </section>
      </div>
    </div>
  );
}
