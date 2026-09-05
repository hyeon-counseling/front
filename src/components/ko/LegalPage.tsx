import type { ReactNode } from "react";

// 약관·정책 페이지 공용 틀
export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated: string; children: ReactNode }) {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4"><span className="eyebrow">{eyebrow}</span></p>
        <h1 className="font-display text-3xl leading-tight text-[var(--foreground)] sm:text-4xl">{title}</h1>
        <p className="mt-3 text-xs text-[var(--foreground-subtle)]">시행일 {updated}</p>
        <div className="mt-10 space-y-10 text-sm leading-relaxed text-[var(--foreground-muted)]">{children}</div>
      </div>
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-3 text-xl text-[var(--foreground)]">{title}</h2>
      {children}
    </section>
  );
}
