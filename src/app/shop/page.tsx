import Link from "next/link";

// 더미 전자책 데이터 (실제 API 연결 전 임시 데이터)
const DUMMY_BOOKS = [
  {
    id: "1",
    title: "Understanding Anxiety",
    subtitle: "A Practical Guide to Calming Your Mind",
    price: 12.0,
    description:
      "Learn to recognize anxiety patterns and discover evidence-based techniques to find calm in everyday situations.",
    tag: "Anxiety",
  },
  {
    id: "2",
    title: "The Self-Compassion Workbook",
    subtitle: "Practical Exercises for Inner Healing",
    price: 14.0,
    description:
      "A step-by-step workbook guiding you to treat yourself with the kindness you deserve, backed by self-compassion research.",
    tag: "Self-Care",
  },
  {
    id: "3",
    title: "Emotional Boundaries",
    subtitle: "Protecting Your Energy Without Guilt",
    price: 11.0,
    description:
      "Understand why boundaries matter, how to set them without conflict, and how to maintain them in relationships.",
    tag: "Relationships",
  },
];

export default function ShopPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-5xl">
        {/* 페이지 헤더 */}
        <div className="mb-10 text-center">
          <h1 className="mb-3 text-3xl font-semibold text-[var(--foreground)] sm:text-4xl">
            Our E-Books
          </h1>
          <p className="text-[var(--foreground-muted)]">
            Thoughtfully written psychology resources to support your growth
          </p>
        </div>

        {/* 전자책 카드 목록 */}
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {DUMMY_BOOKS.map((book) => (
            <div
              key={book.id}
              className="flex flex-col rounded-2xl border border-[var(--border)] bg-[var(--background)] p-6 transition-shadow hover:shadow-md"
            >
              {/* 태그 */}
              <span className="mb-3 inline-block self-start rounded-full bg-[var(--brand-light)] px-3 py-0.5 text-xs font-medium text-[var(--brand)]">
                {book.tag}
              </span>

              {/* 제목 */}
              <h2 className="mb-1 text-lg font-semibold text-[var(--foreground)]">
                {book.title}
              </h2>
              <p className="mb-3 text-sm text-[var(--foreground-subtle)]">
                {book.subtitle}
              </p>

              {/* 설명 */}
              <p className="mb-5 flex-1 text-sm leading-relaxed text-[var(--foreground-muted)]">
                {book.description}
              </p>

              {/* 가격 + 버튼 */}
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-[var(--foreground)]">
                  ${book.price.toFixed(2)}
                </span>
                <Link
                  href={`/shop/${book.id}`}
                  className="rounded-full bg-[var(--brand)] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
                >
                  View Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
