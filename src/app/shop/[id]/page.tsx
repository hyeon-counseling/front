import Link from "next/link";

// 더미 전자책 데이터 (실제 API 연결 전 임시 데이터)
const DUMMY_BOOKS: Record<
  string,
  {
    id: string;
    title: string;
    subtitle: string;
    price: number;
    description: string;
    tag: string;
    chapters: string[];
  }
> = {
  "1": {
    id: "1",
    title: "Understanding Anxiety",
    subtitle: "A Practical Guide to Calming Your Mind",
    price: 12.0,
    description:
      "Anxiety is one of the most common emotional experiences of our time — yet so few of us truly understand what it is and why it happens. This e-book walks you through the psychology behind anxiety, helps you identify your personal triggers, and offers practical, evidence-based techniques to find calm in your daily life.",
    tag: "Anxiety",
    chapters: [
      "What Anxiety Really Is (and Isn't)",
      "Recognizing Your Personal Triggers",
      "The Mind-Body Connection",
      "Grounding Techniques for Immediate Relief",
      "Building Long-Term Resilience",
    ],
  },
  "2": {
    id: "2",
    title: "The Self-Compassion Workbook",
    subtitle: "Practical Exercises for Inner Healing",
    price: 14.0,
    description:
      "We are often our own harshest critics. This workbook guides you through the three pillars of self-compassion — mindfulness, common humanity, and self-kindness — with exercises drawn from Kristin Neff's research and real counseling sessions.",
    tag: "Self-Care",
    chapters: [
      "Understanding Self-Criticism",
      "The Three Pillars of Self-Compassion",
      "Daily Mindfulness Practices",
      "Writing Exercises for Inner Healing",
      "Integrating Self-Compassion into Daily Life",
    ],
  },
  "3": {
    id: "3",
    title: "Emotional Boundaries",
    subtitle: "Protecting Your Energy Without Guilt",
    price: 11.0,
    description:
      "Setting boundaries is not selfish — it is necessary. This e-book helps you understand the psychology of boundary-setting, identify where your limits currently are, and communicate them clearly and calmly in your relationships.",
    tag: "Relationships",
    chapters: [
      "Why Boundaries Feel So Hard",
      "Types of Boundaries and Where You Need Them",
      "The Language of Healthy Limits",
      "Dealing with Pushback",
      "Maintaining Boundaries with Compassion",
    ],
  },
};

// Next.js App Router에서 동적 경로 파라미터를 받는 방식
export default async function BookDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const book = DUMMY_BOOKS[id];

  // 존재하지 않는 ID일 경우
  if (!book) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center">
          <p className="mb-4 text-lg text-[var(--foreground-muted)]">
            Book not found.
          </p>
          <Link
            href="/shop"
            className="text-sm font-medium text-[var(--brand)] hover:underline"
          >
            Back to Shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-3xl">
        {/* 뒤로가기 */}
        <Link
          href="/shop"
          className="mb-8 inline-flex items-center gap-1 text-sm text-[var(--foreground-subtle)] transition-colors hover:text-[var(--brand)]"
        >
          &larr; Back to Shop
        </Link>

        <div className="rounded-2xl border border-[var(--border)] bg-[var(--background)] p-8 sm:p-10">
          {/* 태그 */}
          <span className="mb-4 inline-block rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
            {book.tag}
          </span>

          {/* 제목 */}
          <h1 className="mb-2 text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            {book.title}
          </h1>
          <p className="mb-6 text-[var(--foreground-subtle)]">{book.subtitle}</p>

          {/* 설명 */}
          <p className="mb-8 leading-relaxed text-[var(--foreground-muted)]">
            {book.description}
          </p>

          {/* 목차 */}
          <div className="mb-8 rounded-xl bg-[var(--surface)] p-5">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">
              What You Will Learn
            </h2>
            <ol className="list-inside list-decimal space-y-2">
              {book.chapters.map((chapter, index) => (
                <li
                  key={index}
                  className="text-sm text-[var(--foreground-muted)]"
                >
                  {chapter}
                </li>
              ))}
            </ol>
          </div>

          {/* 구분선 */}
          <div className="mb-6 border-t border-[var(--border)]" />

          {/* 가격 + 구매 버튼 */}
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-[var(--foreground-subtle)]">Price</p>
              <p className="text-2xl font-semibold text-[var(--foreground)]">
                ${book.price.toFixed(2)}
              </p>
            </div>
            <button className="w-full rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)] sm:w-auto">
              Purchase — ${book.price.toFixed(2)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
