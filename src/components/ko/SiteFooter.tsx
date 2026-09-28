import Link from "next/link";

const COLS = [
  {
    title: "서비스",
    links: [
      { href: "/courses", label: "강의" },
      { href: "/courses?has=practice", label: "쓰기 실습 강의" },
      { href: "/counseling", label: "상담·심리검사" },
      { href: "/articles", label: "아티클" },
    ],
  },
  {
    title: "회사",
    links: [
      { href: "/about", label: "소개" },
      { href: "/contact", label: "문의" },
      { href: "/faq", label: "자주 묻는 질문" },
      { href: "/en", label: "English" },
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
    <footer className="mt-auto border-t border-[var(--border-light)] bg-[var(--surface)]">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--brand)] text-base font-extrabold text-white">현</span>
              <span className="font-bold tracking-tight text-[var(--foreground)]">심리상담실 현</span>
            </div>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-[var(--foreground-muted)]">
              나를 이해하는 공부를, 편안한 속도로. 심리상담가 현이 만드는 강의·상담.
            </p>
          </div>
          {COLS.map((c) => (
            <div key={c.title}>
              <p className="mb-3 text-sm font-semibold text-[var(--foreground)]">{c.title}</p>
              <ul className="space-y-2.5">
                {c.links.map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-[var(--foreground-muted)] transition-colors hover:text-[var(--foreground)]">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="my-8 border-t border-[var(--border)]" />

        <div className="space-y-1.5 text-xs leading-relaxed text-[var(--foreground-subtle)]">
          <p>심리상담실 현 (Hyeon Counseling) · 대표 김태현 · 사업자등록번호 185-25-02396 · 서울특별시 동작구 상도로15다길 16 · support@hyeoncounseling.com</p>
          <p>이 사이트의 콘텐츠는 심리 교육을 목적으로 하며 의학적 진단이나 치료를 대체하지 않습니다. 위급한 상황이라면 자살예방상담전화 109, 정신건강위기상담 1577-0199로 연락해 주세요.</p>
          <p>© {year} Hyeon Counseling. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
