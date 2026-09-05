export const metadata = {
  title: 'Contact | Hyeon Counseling',
  description: 'Contact Hyeon Counseling — we are here to help with your questions and support needs.',
};

export default function ContactPage() {
  return (
    <div className="bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-semibold text-[var(--foreground)]">Contact Us</h1>
          <p className="text-[var(--foreground-muted)]">
            We&apos;re here to help. Reach out with any questions or concerns.
          </p>
        </div>

        {/* 이메일 CTA */}
        <div className="mb-10 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-8 text-center">
          <div className="mb-4 flex justify-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-light)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                <polyline points="22,6 12,13 2,6" />
              </svg>
            </div>
          </div>
          <h2 className="mb-2 text-lg font-semibold text-[var(--foreground)]">Email Support</h2>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">
            Send us an email and we&apos;ll get back to you within 1–2 business days.
          </p>
          <a
            href="mailto:support@hyeoncounseling.com"
            className="inline-block rounded-full bg-[var(--brand)] px-8 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            support@hyeoncounseling.com
          </a>
        </div>

        {/* 문의 유형 안내 */}
        <div className="mb-10">
          <h2 className="mb-6 text-lg font-semibold text-[var(--foreground)]">What Can We Help You With?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-5">
              <div className="mb-3 text-xl">&#128196;</div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Purchase & Downloads</h3>
              <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                Help with accessing purchased files, download issues, or account-related questions.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-5">
              <div className="mb-3 text-xl">&#128260;</div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Refund Requests</h3>
              <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                For refund inquiries due to technical issues or billing errors. Please contact us within 48 hours of purchase.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-5">
              <div className="mb-3 text-xl">&#128218;</div>
              <h3 className="mb-2 text-sm font-semibold text-[var(--foreground)]">Content Questions</h3>
              <p className="text-xs leading-relaxed text-[var(--foreground-muted)]">
                Questions about our e-books, guides, or educational materials.
              </p>
            </div>
          </div>
        </div>

        {/* 응답 시간 안내 */}
        <div className="mb-10 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Response Times</h2>
          <ul className="space-y-2 text-sm text-[var(--foreground-muted)]">
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand)]">&#10003;</span>
              <span>General inquiries: within 1–2 business days</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand)]">&#10003;</span>
              <span>Refund requests: within 1 business day (please submit within 48 hours of purchase)</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="mt-0.5 text-[var(--brand)]">&#10003;</span>
              <span>Technical issues: within 1 business day</span>
            </li>
          </ul>
          <p className="mt-4 text-xs text-[var(--foreground-subtle)]">
            Business hours: Monday – Friday, 10:00 AM – 6:00 PM KST (UTC+9)
          </p>
        </div>

        {/* 회사 정보 */}
        <div className="rounded-2xl border border-[var(--border-light)] bg-[var(--background)] p-6">
          <h2 className="mb-4 text-sm font-semibold text-[var(--foreground)]">Business Information</h2>
          <dl className="space-y-2 text-sm text-[var(--foreground-muted)]">
            <div className="flex gap-2">
              <dt className="min-w-[160px] font-medium text-[var(--foreground)]">Company</dt>
              <dd>Hyeon Counseling</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[160px] font-medium text-[var(--foreground)]">Address</dt>
              <dd>16, Sangdo-ro 15da-gil, Dongjak-gu, Seoul 06951, Republic of Korea</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[160px] font-medium text-[var(--foreground)]">Business Reg. No.</dt>
              <dd>185-25-02396</dd>
            </div>
            <div className="flex gap-2">
              <dt className="min-w-[160px] font-medium text-[var(--foreground)]">Email</dt>
              <dd>
                <a href="mailto:support@hyeoncounseling.com" className="text-[var(--brand)] hover:underline">
                  support@hyeoncounseling.com
                </a>
              </dd>
            </div>
          </dl>
        </div>

      </div>
    </div>
  );
}
