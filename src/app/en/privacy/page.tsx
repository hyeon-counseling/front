export const metadata = {
  title: 'Privacy Policy | Hyeon Counseling',
  description: 'Privacy Policy for Hyeon Counseling — how we collect, use, and protect your personal information.',
};

export default function PrivacyPage() {
  return (
    <div className="bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-semibold text-[var(--foreground)]">Privacy Policy</h1>
        <p className="mb-10 text-sm text-[var(--foreground-subtle)]">Last updated: February 27, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground-muted)]">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">1. Who We Are</h2>
            <p>
              Hyeon Counseling (&ldquo;we,&rdquo; &ldquo;our,&rdquo; or &ldquo;us&rdquo;) is operated by a licensed psychological counselor and author
              based in Seoul, Republic of Korea. We provide educational psychological e-books and self-help guides
              through our website at hyeoncounseling.com.
            </p>
            <p className="mt-3">
              <strong className="text-[var(--foreground)]">Business Address:</strong> 16, Sangdo-ro 15da-gil, Dongjak-gu, Seoul 06951, Republic of Korea<br />
              <strong className="text-[var(--foreground)]">Business Registration No.:</strong> 185-25-02396<br />
              <strong className="text-[var(--foreground)]">Contact:</strong>{' '}
              <a href="mailto:support@hyeoncounseling.com" className="text-[var(--brand)] hover:underline">
                support@hyeoncounseling.com
              </a>
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">2. Information We Collect</h2>
            <p>We collect the following types of personal information:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong className="text-[var(--foreground)]">Account information:</strong> Your name and email address when you register for an account.</li>
              <li><strong className="text-[var(--foreground)]">Purchase information:</strong> Records of your purchases (product name, date, amount). Payment card details are processed directly by Polar.sh (via Stripe) and are never stored on our servers.</li>
              <li><strong className="text-[var(--foreground)]">Google OAuth data:</strong> If you sign in with Google, we receive your name and email address from Google.</li>
              <li><strong className="text-[var(--foreground)]">Usage data:</strong> Basic server logs (IP address, browser type, pages visited) for security and performance monitoring.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">3. How We Use Your Information</h2>
            <ul className="list-disc space-y-2 pl-5">
              <li>To create and manage your account</li>
              <li>To process your purchases and deliver digital products</li>
              <li>To send purchase confirmation and download emails</li>
              <li>To respond to your support inquiries</li>
              <li>To comply with legal obligations</li>
            </ul>
            <p className="mt-3">We do not use your personal information for advertising or sell it to third parties.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">4. Third-Party Services</h2>
            <p>We share your information with the following trusted third parties only as necessary to provide our services:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong className="text-[var(--foreground)]">Polar.sh / Stripe:</strong> Payment processing. Polar acts as the Merchant of Record for your purchase. Your payment data is governed by <a href="https://polar.sh/legal/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--brand)] hover:underline">Polar&apos;s Privacy Policy</a> and Stripe&apos;s Privacy Policy.</li>
              <li><strong className="text-[var(--foreground)]">Resend:</strong> Transactional email delivery (purchase confirmations, account emails).</li>
              <li><strong className="text-[var(--foreground)]">Google OAuth:</strong> Optional sign-in method. Governed by Google&apos;s Privacy Policy.</li>
              <li><strong className="text-[var(--foreground)]">Cloudflare R2:</strong> Secure storage of your purchased PDF files.</li>
              <li><strong className="text-[var(--foreground)]">MongoDB Atlas:</strong> Secure database hosting for account and order data.</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">5. Cookies</h2>
            <p>
              We use only essential cookies necessary for authentication (JWT tokens stored in memory). We do not use
              tracking or advertising cookies.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">6. Data Retention</h2>
            <p>
              We retain your account and purchase information for as long as your account is active or as needed to
              provide our services. If you request account deletion, we will delete your personal data within 30 days,
              except where we are required to retain it for legal purposes (e.g., tax records).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">7. Your Rights (GDPR)</h2>
            <p>If you are located in the European Economic Area (EEA), you have the following rights:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li><strong className="text-[var(--foreground)]">Right to access:</strong> Request a copy of the personal data we hold about you.</li>
              <li><strong className="text-[var(--foreground)]">Right to rectification:</strong> Request correction of inaccurate data.</li>
              <li><strong className="text-[var(--foreground)]">Right to erasure:</strong> Request deletion of your personal data.</li>
              <li><strong className="text-[var(--foreground)]">Right to data portability:</strong> Request your data in a machine-readable format.</li>
              <li><strong className="text-[var(--foreground)]">Right to object:</strong> Object to processing of your personal data.</li>
            </ul>
            <p className="mt-3">
              To exercise any of these rights, please contact us at{' '}
              <a href="mailto:support@hyeoncounseling.com" className="text-[var(--brand)] hover:underline">
                support@hyeoncounseling.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">8. Data Security</h2>
            <p>
              We implement industry-standard security measures including encrypted data transmission (HTTPS),
              secure cloud storage, and access controls. However, no method of transmission over the internet is
              100% secure.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes by
              posting the new policy on this page with an updated date.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">10. Contact Us</h2>
            <p>
              For any questions about this Privacy Policy, please contact us at{' '}
              <a href="mailto:support@hyeoncounseling.com" className="text-[var(--brand)] hover:underline">
                support@hyeoncounseling.com
              </a>.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
