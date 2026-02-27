export const metadata = {
  title: 'Refund Policy | Hyeon Counseling',
  description: 'Refund Policy for Hyeon Counseling digital e-book purchases.',
};

export default function RefundPage() {
  return (
    <div className="bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <h1 className="mb-2 text-3xl font-semibold text-[var(--foreground)]">Refund Policy</h1>
        <p className="mb-10 text-sm text-[var(--foreground-subtle)]">Last updated: February 27, 2026</p>

        <div className="space-y-10 text-sm leading-relaxed text-[var(--foreground-muted)]">

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Our Refund Policy</h2>
            <p>
              Thank you for purchasing from Hyeon Counseling. Because our products are digital downloads
              (PDF e-books), we have a strict no-refund policy once a product has been accessed or downloaded.
              This is a common practice for digital content to protect intellectual property.
            </p>
            <p className="mt-3">
              We encourage you to read the product description carefully before making a purchase to ensure
              it meets your needs.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Exceptions — When Refunds Are Considered</h2>
            <p>We will consider refund requests in the following circumstances:</p>
            <ul className="mt-3 list-disc space-y-3 pl-5">
              <li>
                <strong className="text-[var(--foreground)]">Technical failure:</strong> The purchased file is corrupted, unreadable, or cannot be downloaded due to a technical error on our end.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Duplicate charge:</strong> You were charged more than once for the same product due to a payment processing error.
              </li>
              <li>
                <strong className="text-[var(--foreground)]">Product not delivered:</strong> You completed payment but did not receive access to the product and cannot download it from your account page within 24 hours.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">How to Request a Refund</h2>
            <p>If you believe you qualify for a refund under the exceptions above, please contact us within <strong className="text-[var(--foreground)]">48 hours</strong> of your purchase:</p>
            <div className="mt-4 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-5">
              <p className="font-medium text-[var(--foreground)]">Email us at:</p>
              <a
                href="mailto:support@hyeoncounseling.com"
                className="mt-1 inline-block text-[var(--brand)] hover:underline"
              >
                support@hyeoncounseling.com
              </a>
              <p className="mt-3 text-xs text-[var(--foreground-subtle)]">
                Please include your order information and a description of the issue.
              </p>
            </div>
            <p className="mt-4">Please include in your email:</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>The email address used for your account</li>
              <li>The product name and purchase date</li>
              <li>A description of the issue you experienced</li>
              <li>Any relevant screenshots or error messages</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Refund Processing</h2>
            <p>
              Once we review and approve your refund request, we will process it within{' '}
              <strong className="text-[var(--foreground)]">5–10 business days</strong>. Refunds are issued to
              the original payment method. Processing times may vary depending on your bank or card issuer.
            </p>
            <p className="mt-3">
              All refunds are processed through Polar.sh (our payment processor). You will receive an
              email confirmation once your refund has been initiated.
            </p>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Non-Refundable Situations</h2>
            <p>Refunds will not be issued for:</p>
            <ul className="mt-3 list-disc space-y-2 pl-5">
              <li>Change of mind after downloading the product</li>
              <li>Failure to read the product description before purchase</li>
              <li>Technical issues caused by your own device, software, or internet connection</li>
              <li>Requests made more than 48 hours after purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--foreground)]">Questions?</h2>
            <p>
              If you have any questions about our Refund Policy, please contact us at{' '}
              <a href="mailto:support@hyeoncounseling.com" className="text-[var(--brand)] hover:underline">
                support@hyeoncounseling.com
              </a>.
              We aim to respond to all inquiries within 1–2 business days.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
