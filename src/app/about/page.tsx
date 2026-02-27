import Link from "next/link";

export const metadata = {
  title: 'About | Hyeon Counseling',
  description: 'Learn about Hyeon Counseling — evidence-based psychological guides written by a licensed counselor with an M.A. in Counseling and Psychotherapy.',
};

export default function AboutPage() {
  return (
    <div className="bg-[var(--background)]">

      {/* ── 히어로 ──────────────────────────────────────── */}
      <section className="px-4 py-20 sm:px-6 sm:py-28">
        <div className="mx-auto max-w-3xl text-center">
          <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-[var(--brand)]">
            About Hyeon Counseling
          </p>
          <h1 className="mb-6 text-4xl font-semibold leading-tight tracking-tight text-[var(--foreground)] sm:text-5xl">
            Psychological Knowledge,<br />
            <span className="text-[var(--brand)]">Made Accessible</span>
          </h1>
          <p className="mx-auto max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
            Hyeon Counseling was founded with a single belief: that evidence-based psychological
            knowledge should be available to anyone who wants to understand themselves better —
            not just those who can afford long-term therapy.
          </p>
        </div>
      </section>

      <div className="border-t border-[var(--border)]" />

      {/* ── 저자 소개 ─────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-8 sm:p-10">

            {/* 저자 아이콘 */}
            <div className="mb-6 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand)] text-2xl text-white">
                &#129504;
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-[var(--foreground-subtle)]">Author &amp; Founder</p>
                <h2 className="text-xl font-semibold text-[var(--foreground)]">Hyeon</h2>
              </div>
            </div>

            {/* 학력 배지 */}
            <div className="mb-6 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
                <span className="text-[var(--brand)]">&#127891;</span>
                M.A. in Counseling &amp; Psychotherapy
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
                <span className="text-[var(--brand)]">&#127891;</span>
                B.A. in Youth Counseling
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-xs font-medium text-[var(--foreground)]">
                <span className="text-[var(--brand)]">&#127757;</span>
                Based in Seoul, South Korea
              </span>
            </div>

            {/* 저자 본문 */}
            <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
              <p>
                I hold a <strong className="text-[var(--foreground)]">Bachelor&apos;s degree in Youth Counseling</strong> and a{' '}
                <strong className="text-[var(--foreground)]">Master&apos;s degree in Counseling and Psychotherapy</strong>, both completed in South Korea.
                My academic and clinical training spans individual counseling, developmental psychology, and
                evidence-based therapeutic frameworks including Cognitive Behavioral Therapy (CBT),
                Person-Centered Therapy, and psychodynamic approaches.
              </p>
              <p>
                During my years of working with adolescents and adults, I noticed a recurring gap: people
                who were struggling emotionally often lacked the vocabulary or frameworks to understand
                what was happening inside them. They weren&apos;t in crisis — they just needed a reliable,
                accessible map of their inner world.
              </p>
              <p>
                That&apos;s why I started writing. My guides translate clinical psychological knowledge into
                clear, practical language that anyone can read, reflect on, and actually use — without
                needing a therapy appointment.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--border)]" />

      {/* ── 우리가 하는 것 ──────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-semibold text-[var(--foreground)]">
            What We Offer
          </h2>
          <div className="grid gap-6 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <div className="mb-3 text-2xl">&#128218;</div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">E-Books &amp; Guides</h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Downloadable PDF guides based on established psychological frameworks. Practical, structured,
                and written to be read in one sitting.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <div className="mb-3 text-2xl">&#128196;</div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">Articles &amp; Columns</h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Free educational articles on psychological topics — from understanding anxiety to building
                healthier relationships and recognizing cognitive patterns.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <div className="mb-3 text-2xl">&#127807;</div>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">Self-Coaching Frameworks</h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                Structured self-reflection tools and exercises drawn from CBT and other evidence-based
                approaches, designed for independent use.
              </p>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--border)]" />

      {/* ── 접근 철학 ──────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-10 text-center text-2xl font-semibold text-[var(--foreground)]">
            Our Approach
          </h2>
          <div className="space-y-6">
            <div className="flex gap-5">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-semibold text-[var(--brand)]">
                1
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[var(--foreground)]">Evidence-Based, Always</h3>
                <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  Every concept in our guides is grounded in peer-reviewed psychological research and
                  established clinical practice. We don&apos;t invent frameworks — we translate them.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-semibold text-[var(--brand)]">
                2
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[var(--foreground)]">Clarity Over Complexity</h3>
                <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  Academic language can make psychology feel distant. We write in plain, human language
                  so that psychological insight feels like a conversation, not a lecture.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-semibold text-[var(--brand)]">
                3
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[var(--foreground)]">Self-Paced, No Pressure</h3>
                <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  Growth doesn&apos;t happen on a fixed schedule. Our content is designed to fit into your
                  life — readable at your own pace, revisited whenever you need it.
                </p>
              </div>
            </div>
            <div className="flex gap-5">
              <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-semibold text-[var(--brand)]">
                4
              </div>
              <div>
                <h3 className="mb-1 font-semibold text-[var(--foreground)]">Education, Not Therapy</h3>
                <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                  We are transparent about what our content is and isn&apos;t. These are educational tools,
                  not clinical treatment. For serious mental health concerns, professional support is
                  always the right path.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="border-t border-[var(--border)]" />

      {/* ── 두 채널 ────────────────────────────────────── */}
      <section className="bg-[var(--surface)] px-4 py-16 sm:px-6 sm:py-20">
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-4 text-center text-2xl font-semibold text-[var(--foreground)]">
            Two Channels, One Mission
          </h2>
          <p className="mb-10 text-center text-sm text-[var(--foreground-muted)]">
            Hyeon Counseling operates globally in English and locally in Korean under the brand{' '}
            <strong className="text-[var(--foreground)]">심리상담실 현</strong>.
          </p>
          <div className="grid gap-5 sm:grid-cols-2">
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">Global</p>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">Hyeon Counseling</h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                English-language content and e-books for readers worldwide. All guides are fully
                written in English with a global audience in mind.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
              <p className="mb-1 text-xs font-semibold uppercase tracking-wider text-[var(--brand)]">한국</p>
              <h3 className="mb-2 font-semibold text-[var(--foreground)]">심리상담실 현</h3>
              <p className="text-sm leading-relaxed text-[var(--foreground-muted)]">
                한국어로 작성된 심리 교육 콘텐츠. 자기 이해와 성장에 관심 있는 한국 독자를 위한 가이드와 칼럼을 제공합니다.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-xl text-center">
          <h2 className="mb-4 text-2xl font-semibold text-[var(--foreground)]">
            Ready to start?
          </h2>
          <p className="mb-8 text-[var(--foreground-muted)]">
            Browse our collection of evidence-based psychological guides.
          </p>
          <Link
            href="/shop"
            className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Explore Books
          </Link>
        </div>
      </section>

    </div>
  );
}
