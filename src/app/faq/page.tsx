'use client';

import { useState } from 'react';

const faqs = [
  {
    question: 'What formats are the e-books available in?',
    answer:
      'All our e-books and guides are available as PDF files. PDFs are universally compatible and can be read on any device — smartphones, tablets, laptops, and e-readers. After purchase, you can download your PDF directly from your account page (My Page).',
  },
  {
    question: 'How do I download my purchase?',
    answer:
      'After completing your purchase, log in to your account and visit the "My Page" section. You will see your order history with a download button for each purchased item. Download links are time-limited for security, so please download and save your file after purchase.',
  },
  {
    question: 'Can I access my purchases on multiple devices?',
    answer:
      'Yes. Once you download your PDF, you can save it to your device and access it from any device that supports PDF viewing. We recommend saving a copy to your cloud storage (Google Drive, iCloud, Dropbox, etc.) for easy access across devices.',
  },
  {
    question: 'Do you offer refunds?',
    answer:
      'Due to the digital nature of our products, all sales are generally final once the product has been downloaded. However, we do consider refunds in cases of technical failure (e.g., corrupted file, delivery failure, or duplicate charge). Please contact us within 48 hours of purchase at support@hyeoncounseling.com. See our full Refund Policy for details.',
  },
  {
    question: 'Is this content suitable for me if I have serious mental health issues?',
    answer:
      'Our e-books are educational resources designed for personal growth and self-understanding. They are not intended to replace professional mental health care, clinical diagnosis, or therapy. If you are experiencing severe anxiety, depression, trauma, or a mental health crisis, we strongly encourage you to seek support from a licensed mental health professional.',
  },
  {
    question: 'What payment methods do you accept?',
    answer:
      'We accept all major credit and debit cards (Visa, Mastercard, American Express) through our payment processor Polar.sh (powered by Stripe). Payments are processed securely and your card information is never stored on our servers.',
  },
  {
    question: 'How long do I have access to my download?',
    answer:
      'Download links generated from your account have a time limit for security purposes. However, once you have downloaded and saved the file to your device, it is yours to keep permanently. We recommend saving your file to a secure location immediately after downloading.',
  },
  {
    question: 'Is my payment information secure?',
    answer:
      'Yes. All payments are processed by Polar.sh (via Stripe), a trusted and PCI-DSS compliant payment processor. Your card details are never transmitted to or stored on our servers. Our website uses HTTPS encryption for all data transmission.',
  },
  {
    question: 'I did not receive my purchase. What should I do?',
    answer:
      'If you completed payment but cannot see your purchase in My Page, please first check your email for a confirmation message. If the issue persists, contact us at support@hyeoncounseling.com with your purchase details and we will resolve it promptly.',
  },
  {
    question: 'How can I contact you?',
    answer:
      'You can reach us by email at support@hyeoncounseling.com. We aim to respond to all inquiries within 1–2 business days. For faster resolution, please include your account email and a description of your question or issue.',
  },
];

function FaqItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-[var(--border)]">
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between py-5 text-left"
        aria-expanded={open}
      >
        <span className="pr-4 text-sm font-medium text-[var(--foreground)]">{question}</span>
        <span
          className={`flex-shrink-0 text-[var(--brand)] transition-transform duration-200 ${open ? 'rotate-45' : ''}`}
          aria-hidden="true"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v12M2 8h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
      </button>
      {open && (
        <p className="pb-5 text-sm leading-relaxed text-[var(--foreground-muted)]">{answer}</p>
      )}
    </div>
  );
}

export default function FAQPage() {
  return (
    <div className="bg-[var(--background)] px-4 py-16 sm:px-6">
      <div className="mx-auto max-w-3xl">
        <div className="mb-12 text-center">
          <h1 className="mb-3 text-3xl font-semibold text-[var(--foreground)]">Frequently Asked Questions</h1>
          <p className="text-sm text-[var(--foreground-muted)]">
            Can&apos;t find what you&apos;re looking for?{' '}
            <a href="/contact" className="text-[var(--brand)] hover:underline">
              Contact us
            </a>{' '}
            and we&apos;ll be happy to help.
          </p>
        </div>

        <div>
          {faqs.map((faq) => (
            <FaqItem key={faq.question} question={faq.question} answer={faq.answer} />
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-6 text-center">
          <p className="mb-2 text-sm font-medium text-[var(--foreground)]">Still have questions?</p>
          <p className="mb-4 text-sm text-[var(--foreground-muted)]">We&apos;re here to help. Reach out to our support team.</p>
          <a
            href="mailto:support@hyeoncounseling.com"
            className="inline-block rounded-full bg-[var(--brand)] px-6 py-2.5 text-xs font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            Email Us
          </a>
        </div>
      </div>
    </div>
  );
}
