import Link from "next/link";
import { Fragment, type ReactNode } from "react";
import { Icon } from "@/components/assessment/Icon";
import { GuideTabs } from "@/components/assessment/GuideTabs";
import { GUIDES, type GuideBlock, type GuidePageData, type GuideSection, type GuideTab } from "@/content/assessmentGuide";

/**
 * 고정 안내 페이지(/guide/apply · /guide/tests) — 문안은 src/content/assessmentGuide.ts, 여기는 그리기만
 * 70·71 시안 톤(.assess 토큰). 알림톡 버튼으로 휴대폰에서 바로 열리므로 세로 한 줄 흐름, 로그인 없음.
 * 탭은 경로로 나뉜다(/guide/apply/faq 등) — 버튼이 특정 탭을 바로 연다.
 */
export const G_WRAP = "mx-auto max-w-[760px] px-5";

/** [이름](/주소) → 링크, **글** → 굵게 */
export function RichText({ text }: { text: string }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) => {
        const link = /^\[([^\]]+)\]\(([^)]+)\)$/.exec(part);
        if (link)
          return (
            <Link key={i} href={link[2]} className="link-underline font-semibold text-[var(--foreground)]">
              {link[1]}
            </Link>
          );
        const bold = /^\*\*([^*]+)\*\*$/.exec(part);
        if (bold)
          return (
            <b key={i} className="text-[var(--foreground)]">
              {bold[1]}
            </b>
          );
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

const CARD = "rounded-[18px] bg-white p-5 shadow-[var(--shadow-sm)]";

function Block({ b }: { b: GuideBlock }) {
  switch (b.type) {
    case "p":
      return (
        <p>
          <RichText text={b.text} />
        </p>
      );
    case "h3":
      return <h3 className="pt-2 font-bold text-[var(--foreground)]">{b.text}</h3>;
    case "steps":
      return (
        <ol className="space-y-2.5">
          {b.items.map((s, i) => (
            <li key={s.title} className="flex gap-3.5 rounded-[18px] bg-white p-4 shadow-[var(--shadow-sm)]">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-light)] text-sm font-extrabold text-[var(--brand)]">{i + 1}</span>
              <span className="min-w-0">
                <span className="block font-bold text-[var(--foreground)]">
                  {s.title}
                  {s.tag && <span className="ml-2 rounded-full bg-[var(--sct-light)] px-2 py-0.5 text-xs font-bold text-[var(--sct-ink)]">{s.tag}</span>}
                </span>
                {s.desc && (
                  <span className="mt-0.5 block text-[15px] leading-relaxed">
                    <RichText text={s.desc} />
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
      );
    case "note":
      return (
        <div className={`rounded-[18px] p-5 ${b.tone === "coral" ? "bg-[var(--sct-light)]" : "bg-[var(--brand-light)]"}`}>
          <p className={`font-bold ${b.tone === "coral" ? "text-[var(--sct-ink)]" : "text-[var(--tci-dark)]"}`}>{b.title}</p>
          <p className="mt-1 text-[15px] leading-relaxed text-[var(--foreground)]">
            <RichText text={b.text} />
          </p>
        </div>
      );
    case "cards":
      return (
        <div className={`grid gap-2.5 ${b.items.length > 1 ? "sm:grid-cols-2" : ""}`}>
          {b.items.map((c) => (
            <div key={c.title} className={CARD}>
              <p className="font-bold text-[var(--foreground)]">
                {c.title}
                {c.badge && <span className="ml-2 text-sm font-bold text-[var(--sct-ink)]">{c.badge}</span>}
              </p>
              <p className="mt-1 text-[15px] leading-relaxed">
                <RichText text={c.text} />
              </p>
              {c.sub && <p className="mt-1 text-sm font-semibold text-[var(--brand)]">{c.sub}</p>}
            </div>
          ))}
        </div>
      );
    case "list": {
      const L = b.ordered ? "ol" : "ul";
      return (
        <L className={`${b.ordered ? "list-decimal" : "list-disc"} space-y-1 pl-5 text-[15px]`}>
          {b.items.map((t) => (
            <li key={t}>
              <RichText text={t} />
            </li>
          ))}
        </L>
      );
    }
    case "example":
      return (
        <div className="rounded-[18px] bg-[var(--surface)] p-5">
          <p className="text-xs font-bold text-[var(--foreground-subtle)]">예시 문장 (실제 문항 아님)</p>
          <p className="mt-1 font-semibold text-[var(--foreground)]">&ldquo;{b.text}&rdquo;</p>
          {b.answer && <p className="mt-1 text-[15px]">→ {b.answer}</p>}
        </div>
      );
  }
}

function Section({ s }: { s: GuideSection }) {
  return (
    <section id={s.id} className="scroll-mt-28 pt-12 md:pt-14">
      <div className={G_WRAP}>
        {s.chip && <span className={`as-chip ${s.tone ?? ""}`}>{s.chip}</span>}
        <h2 className="mb-4 mt-3 text-[24px] font-extrabold leading-snug tracking-[-0.025em] md:text-[30px]">{s.title}</h2>
        <div className="space-y-4 text-[var(--foreground-muted)]">
          {s.blocks?.map((b, i) => <Block key={i} b={b} />)}
          {s.faq && (
            <div className="grid gap-2.5">
              {s.faq.map((f) => (
                <details key={f.q} className="group rounded-[18px] bg-white shadow-[var(--shadow-sm)]">
                  <summary className="flex min-h-[60px] cursor-pointer items-center gap-3 p-[18px] text-[17px] font-bold leading-[1.45] text-[var(--foreground)]">
                    <span className="flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[10px] bg-[var(--brand-light)] text-sm font-extrabold text-[var(--brand)] group-open:bg-[var(--brand)] group-open:text-white">Q</span>
                    {f.q}
                    <Icon name="chev" className="as-chev ml-auto h-5 w-5 shrink-0 text-[var(--foreground-subtle)]" />
                  </summary>
                  <div className="space-y-2 px-[18px] pb-5 text-base leading-[1.75] text-[var(--foreground-muted)] min-[421px]:pl-[60px]">
                    {f.a.map((b, i) => (
                      <Block key={i} b={b} />
                    ))}
                  </div>
                </details>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

/** 탭 하나의 본문 — 각 탭 page.tsx 가 부른다 */
export function GuideTabBody({ tab }: { tab: GuideTab }) {
  return (
    <>
      {tab.sections.map((s) => (
        <Section key={s.id} s={s} />
      ))}
    </>
  );
}

/** 안내 페이지 틀 — 머리, 경로 탭, 맨 아래 다른 안내·진행 상황 안내 (각 layout.tsx 가 부른다) */
export function GuideShell({ page, children }: { page: GuidePageData; children: ReactNode }) {
  const others = GUIDES.filter((g) => g.key !== page.key);
  return (
    <div className="assess text-[17px] leading-[1.75]">
      <header className="bg-[var(--mint-bg)]">
        <div className={`${G_WRAP} pb-8 pt-8 md:pb-10 md:pt-12`}>
          <span className="as-chip">{page.chip}</span>
          <h1 className="mb-2 mt-3 text-[28px] font-extrabold leading-tight tracking-[-0.035em] text-[var(--tci-dark)] md:text-[38px]">{page.title}</h1>
          <p className="max-w-[560px] text-[var(--foreground-muted)]">{page.lead}</p>
          <p className="mt-4 text-sm font-bold text-[var(--brand)]">김태현 심리상담가 · 심리상담실 현</p>
        </div>
      </header>
      <GuideTabs tabs={page.tabs.map((t) => ({ path: t.path, label: t.label }))} />
      <div className="bg-[var(--ivory)] pb-16">
        {children}
        <section className="pt-14">
          <div className={G_WRAP}>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {others.flatMap((g) =>
                g.tabs.map((t) => (
                  <Link key={t.path} href={t.path} className="flex items-center justify-between gap-3 rounded-[18px] bg-white p-5 shadow-[var(--shadow-sm)] transition hover:shadow-md">
                    <span>
                      <span className="block text-xs font-bold text-[var(--foreground-subtle)]">{g.title}</span>
                      <span className="block font-bold text-[var(--foreground)]">{t.label}</span>
                    </span>
                    <Icon name="arrow" className="h-5 w-5 shrink-0 text-[var(--brand)]" />
                  </Link>
                ))
              )}
            </div>
            <div className="mt-6 rounded-[18px] bg-white p-5 text-[15px] leading-relaxed text-[var(--foreground-muted)] shadow-[var(--shadow-sm)]">
              <p className="font-bold text-[var(--foreground)]">내 진행 상황 보기</p>
              <p className="mt-1">
                지금 어디까지 왔는지는 알림톡의 [내 진행 상황 보기] 버튼으로 열 수 있어요. 로그인했다면{" "}
                <Link href="/my/assessment" className="link-underline font-semibold text-[var(--foreground)]">
                  마이페이지 → 심리검사 진행
                </Link>
                에서도 볼 수 있어요.
              </p>
            </div>
            <p className="mt-8 text-center text-[15px] text-[var(--foreground-muted)]">
              더 궁금한 점은 카카오톡 채널 <b className="text-[var(--foreground)]">「심리상담실 현」</b>으로 편하게 물어봐 주세요.
              <br />
              김태현 심리상담가가 직접 확인하고 답해 드려요.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
