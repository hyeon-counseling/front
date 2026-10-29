import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "@/components/assessment/Icon";

/**
 * 고정 안내 페이지(/guide/apply · /guide/tests) 공용 조각 — 70·71 시안 톤(.assess 토큰)
 * 알림톡 버튼으로 휴대폰에서 바로 열리므로 세로 한 줄 흐름, 로그인 없음.
 */
export const G_WRAP = "mx-auto max-w-[760px] px-5";

export function GuidePage({ chip, title, lead, children }: { chip: string; title: ReactNode; lead: string; children: ReactNode }) {
  return (
    <div className="assess text-[17px] leading-[1.75]">
      <header className="bg-[var(--mint-bg)]">
        <div className={`${G_WRAP} pb-10 pt-8 md:pb-14 md:pt-12`}>
          <span className="as-chip">{chip}</span>
          <h1 className="mb-2 mt-3 text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[var(--tci-dark)] md:text-[38px]">{title}</h1>
          <p className="max-w-[560px] text-[var(--foreground-muted)]">{lead}</p>
          <p className="mt-4 text-sm font-bold text-[var(--brand)]">김태현 심리상담가 · 심리상담실 현</p>
        </div>
      </header>
      <div className="bg-[var(--ivory)] pb-16">{children}</div>
    </div>
  );
}

/** 목차 — 같은 페이지 안 섹션으로 */
export function GuideToc({ items }: { items: { id: string; label: string }[] }) {
  return (
    <nav aria-label="이 페이지 차례" className={`${G_WRAP} pt-6`}>
      <ul className="flex flex-wrap gap-2">
        {items.map((t) => (
          <li key={t.id}>
            <a href={`#${t.id}`} className="inline-flex min-h-9 items-center rounded-full bg-white px-3.5 text-sm font-semibold text-[var(--foreground)] shadow-[var(--shadow-sm)]">
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function GuideSection({ id, chip, title, tone, children }: { id?: string; chip?: string; title: ReactNode; tone?: "coral" | "mmpi"; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 pt-12 md:pt-16">
      <div className={G_WRAP}>
        {chip && <span className={`as-chip ${tone ?? ""}`}>{chip}</span>}
        <h2 className="mb-4 mt-3 text-[24px] font-extrabold leading-snug tracking-[-0.025em] md:text-[30px]">{title}</h2>
        <div className="space-y-4 text-[var(--foreground-muted)]">{children}</div>
      </div>
    </section>
  );
}

export function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-[18px] bg-white p-5 shadow-[var(--shadow-sm)] ${className}`}>{children}</div>;
}

/** 번호 매긴 줄 — 제목 + 한 줄 설명 */
export function Steps({ items }: { items: { title: string; desc?: ReactNode; tag?: string }[] }) {
  return (
    <ol className="space-y-2.5">
      {items.map((s, i) => (
        <li key={s.title} className="flex gap-3.5 rounded-[18px] bg-white p-4 shadow-[var(--shadow-sm)]">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-light)] text-sm font-extrabold text-[var(--brand)]">{i + 1}</span>
          <span className="min-w-0">
            <span className="block font-bold text-[var(--foreground)]">
              {s.title}
              {s.tag && <span className="ml-2 rounded-full bg-[var(--sct-light)] px-2 py-0.5 text-xs font-bold text-[var(--sct-ink)]">{s.tag}</span>}
            </span>
            {s.desc && <span className="mt-0.5 block text-[15px] leading-relaxed">{s.desc}</span>}
          </span>
        </li>
      ))}
    </ol>
  );
}

/** 짧은 강조 상자 */
export function Note({ title, children, tone = "brand" }: { title: string; children: ReactNode; tone?: "brand" | "coral" }) {
  return (
    <div className={`rounded-[18px] p-5 ${tone === "coral" ? "bg-[var(--sct-light)]" : "bg-[var(--brand-light)]"}`}>
      <p className={`font-bold ${tone === "coral" ? "text-[var(--sct-ink)]" : "text-[var(--tci-dark)]"}`}>{title}</p>
      <div className="mt-1 text-[15px] leading-relaxed text-[var(--foreground)]">{children}</div>
    </div>
  );
}

/** 접는 자주 묻는 질문 */
export function FaqList({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div className="grid gap-2.5">
      {items.map((f) => (
        <details key={f.q} className="group rounded-[18px] bg-white shadow-[var(--shadow-sm)]">
          <summary className="flex min-h-[60px] cursor-pointer items-center gap-3 p-[18px] text-[17px] font-bold leading-[1.45] text-[var(--foreground)]">
            <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-light)] text-sm font-extrabold text-[var(--brand)] group-open:bg-[var(--brand)] group-open:text-white">Q</span>
            {f.q}
            <Icon name="chev" className="as-chev ml-auto h-5 w-5 shrink-0 text-[var(--foreground-subtle)]" />
          </summary>
          <div className="space-y-2 px-[18px] pb-5 text-base leading-[1.75] text-[var(--foreground-muted)] min-[421px]:pl-[60px]">{f.a}</div>
        </details>
      ))}
    </div>
  );
}

/** 맨 아래 — 다른 안내·문의 */
export function GuideFooter({ links }: { links: { href: string; label: string; sub: string }[] }) {
  return (
    <section className="pt-14">
      <div className={G_WRAP}>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-5 shadow-[var(--shadow-sm)] transition hover:shadow-md">
              <span>
                <span className="block font-bold text-[var(--foreground)]">{l.label}</span>
                <span className="block text-sm text-[var(--foreground-muted)]">{l.sub}</span>
              </span>
              <Icon name="arrow" className="h-5 w-5 shrink-0 text-[var(--brand)]" />
            </Link>
          ))}
        </div>
        <p className="mt-8 text-center text-[15px] text-[var(--foreground-muted)]">
          더 궁금한 점은 카카오톡 채널 <b className="text-[var(--foreground)]">「심리상담실 현」</b>으로 편하게 물어봐 주세요.
          <br />
          김태현 심리상담가가 직접 확인하고 답해 드려요.
        </p>
      </div>
    </section>
  );
}
