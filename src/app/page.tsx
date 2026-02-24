import Link from "next/link";

export default function Home() {
  return (
    <div>
      {/* ── 히어로 섹션 ─────────────────────────────── */}
      <section className="bg-[var(--background)] px-4 py-20 sm:px-6 sm:py-32">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-sm font-medium tracking-widest text-[var(--brand)] uppercase">
            Hyeon Counseling
          </p>
          <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            Understanding Your Mind
            <br />
            <span className="text-[var(--brand)]">Starts Here</span>
          </h1>
          <p className="mx-auto mb-10 max-w-xl text-lg leading-relaxed text-[var(--foreground-muted)]">
            Practical psychology knowledge crafted by a licensed counselor.
            E-books designed to help you recognize patterns, heal quietly, and
            grow at your own pace.
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Explore Books
          </Link>
        </div>
      </section>

      {/* ── 구분선 ────────────────────────────────────── */}
      <div className="border-t border-[var(--border)]" />

      {/* ── 소개 섹션 ─────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-24">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-8 text-center text-2xl font-semibold text-[var(--foreground)] sm:text-3xl">
            Why Hyeon Counseling?
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            {/* 카드 1 */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <div className="mb-3 text-2xl">&#129504;</div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">
                Science-Based
              </h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Every resource is grounded in psychological research and
                real-world counseling experience.
              </p>
            </div>

            {/* 카드 2 */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <div className="mb-3 text-2xl">&#128218;</div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">
                Practical Format
              </h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Short, focused e-books you can read in one sitting and apply
                right away in daily life.
              </p>
            </div>

            {/* 카드 3 */}
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <div className="mb-3 text-2xl">&#127807;</div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">
                Self-Paced
              </h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                No appointments, no pressure. Grow and heal on your own
                schedule, in your own space.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA 배너 섹션 ──────────────────────────────── */}
      <section className="bg-[var(--brand-light)] px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--foreground)]">
            Ready to start your journey?
          </h2>
          <p className="mb-8 text-[var(--foreground-muted)]">
            Browse our collection of e-books and take the first step toward
            better self-understanding.
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-full border border-[var(--brand)] px-8 py-3 text-sm font-medium text-[var(--brand)] transition-colors hover:bg-[var(--brand)] hover:text-white"
          >
            View All Books
          </Link>
        </div>
      </section>
    </div>
  );
}
