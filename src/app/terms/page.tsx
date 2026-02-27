export const metadata = {
  title: 'Terms of Service | Hyeon Counseling',
  description: 'Terms of Service for Hyeon Counseling — please read before using our services.',
};

export default function TermsPage() {
  return (
    <div className="bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-semibold text-[var(--foreground)]">Terms of Service</h1>
        <p className="mb-10 text-sm text-[var(--foreground-subtle)]">Last updated: February 27, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground-muted)]">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Hyeon Counseling (&ldquo;Service&rdquo;), you agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our Service.
            </p>
            <p className="mt-3">
              The Service is operated by Hyeon Counseling, located at 16, Sangdo-ro 15da-gil, Dongjak-gu,
              Seoul 06951, Republic of Korea (Business Registration No. 185-25-02396).
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">2. Description of Service</h2>
            <p>
              Hyeon Counseling provides a digital platform for purchasing and downloading educational e-books
              and self-help guides written by a licensed psychological counselor. All content is for educational
              purposes only and does not constitute professional psychological therapy or medical advice.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">3. Account Registration</h2>
            <p>To purchase and access our digital products, you must create an account. You agree to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized use of your account</li>
              <li>Take responsibility for all activity that occurs under your account</li>
            </ul>
            <p className="mt-3">You must be at least 18 years old to create an account and make purchases.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">4. Purchases and Payment</h2>
            <p>
              All purchases are processed through Polar.sh, which acts as the Merchant of Record. By completing
              a purchase, you also agree to{' '}
              <a href="https://polar.sh/legal/terms" target="_blank" rel="noopener noreferrer" className="text-[var(--brand)] hover:underline">
                Polar&apos;s Terms of Service
              </a>.
              Payment processing is handled securely by Stripe.
            </p>
            <p className="mt-3">
              Prices are displayed in USD. Applicable taxes and fees are calculated at checkout by Polar.sh.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">5. Digital Products and Delivery</h2>
            <p>
              Upon successful payment, you will receive access to download your purchased PDF e-book(s) through
              your account page (&ldquo;My Page&rdquo;). Digital products are delivered electronically — no physical
              shipping is involved.
            </p>
            <p className="mt-3">
              Download links are time-limited for security purposes. If you experience difficulty accessing
              your purchase, please contact us at{' '}
              <a href="mailto:support@hyeoncounseling.com" className="text-[var(--brand)] hover:underline">
                support@hyeoncounseling.com
              </a>.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">6. Refund Policy</h2>
            <p>
              Due to the nature of digital products, all sales are final once the product has been downloaded.
              Please see our{' '}
              <a href="/refund" className="text-[var(--brand)] hover:underline">Refund Policy</a>{' '}
              for full details and exceptions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">7. Intellectual Property</h2>
            <p>
              All content provided through our Service — including e-books, guides, text, images, and other
              materials — is the intellectual property of Hyeon Counseling or its content creators and is
              protected by applicable copyright laws.
            </p>
            <p className="mt-3">Upon purchase, you are granted a non-exclusive, non-transferable license to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Download and retain a personal copy of purchased materials</li>
              <li>Use the materials for your personal, non-commercial purposes</li>
            </ul>
            <p className="mt-3">You may not reproduce, distribute, sell, republish, or create derivative works from our content without prior written permission.</p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">8. Educational Disclaimer</h2>
            <p>
              All content provided by Hyeon Counseling is for educational and informational purposes only.
              It does not constitute medical advice, psychological diagnosis, or therapeutic treatment.
              Our e-books and guides are not a substitute for professional mental health care.
            </p>
            <p className="mt-3">
              If you are experiencing a mental health crisis or require clinical support, please consult
              a licensed mental health professional or contact emergency services in your area.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">9. Prohibited Uses</h2>
            <p>You agree not to:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Resell, redistribute, or share purchased digital content with others</li>
              <li>Use the Service for any unlawful purpose</li>
              <li>Attempt to gain unauthorized access to any part of the Service</li>
              <li>Upload malicious code or interfere with the Service&apos;s operation</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">10. Limitation of Liability</h2>
            <p>
              To the fullest extent permitted by applicable law, Hyeon Counseling shall not be liable for
              any indirect, incidental, special, or consequential damages arising from your use of the Service
              or purchased content.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">11. Governing Law</h2>
            <p>
              These Terms of Service are governed by and construed in accordance with the laws of the
              Republic of Korea, without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">12. Changes to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify users of significant
              changes by updating the date at the top of this page. Continued use of the Service after
              changes constitutes acceptance of the new Terms.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">13. Contact Us</h2>
            <p>
              For questions about these Terms, please contact us at{' '}
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
