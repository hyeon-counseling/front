import Link from "next/link";

// 한국어 사이트 푸터 — 메뉴·법적 페이지·사업자 정보·영어 사이트 링크
const COLS = [
  {
    title: "배우기",
    links: [
      { href: "/courses", label: "강의" },
      { href: "/workbooks", label: "셀프 워크북" },
      { href: "/articles", label: "아티클" },
    ],
  },
  {
    title: "만나기",
    links: [
      { href: "/counseling", label: "상담·심리검사" },
      { href: "/about", label: "상담가 소개" },
      { href: "/contact", label: "문의" },
      { href: "/faq", label: "자주 묻는 질문" },
    ],
  },
  {
    title: "약관",
    links: [
      { href: "/terms", label: "이용약관" },
      { href: "/privacy", label: "개인정보처리방침" },
      { href: "/refund", label: "환불 규정" },
    ],
  },
];

export default function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="mt-auto border-t border-[var(--border)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <div>
            <p className="font-display text-lg font-bold text-[var(--brand-ink)]">심리상담실 현</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-[var(--foreground-muted)]">
              나를 이해하는 공부를, 편안한 속도로. 심리상담가 현이 만드는 강의·워크북·상담.
            </p>
            <Link href="/en" className="link-underline mt-4 inline-block text-xs text-[var(--foreground-subtle)]">
              English site →
            </Link>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="mb-3 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">{c.title}</p>
              <ul className="space-y-2">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--brand)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="my-8 border-t border-[var(--border)]" />

        <div className="space-y-1 text-xs leading-relaxed text-[var(--foreground-subtle)]">
          <p>심리상담실 현 (Hyeon Counseling) · 대표 김태현 · 사업자등록번호 185-25-02396</p>
          <p>서울특별시 동작구 상도로15다길 16 · 문의 support@hyeoncounseling.com</p>
          <p className="pt-2">
            이 사이트의 콘텐츠는 심리 교육을 목적으로 하며 의학적 진단이나 치료를 대체하지 않습니다. 위급한 상황이라면 자살예방상담전화 109 또는 정신건강위기상담 1577-0199로 연락해 주세요.
          </p>
          <p className="pt-2">© {year} Hyeon Counseling. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
