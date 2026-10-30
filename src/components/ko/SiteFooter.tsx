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

/**
 * 사업자 정보 (전자상거래법 표시 사항 · 토스페이먼츠 카드사 심사)
 * 사업자등록증과 똑같이 적는다. 빈 값('')은 화면에 나오지 않는다. (10/30 상담가 값: 고객센터 전화, 통신판매업 신고번호)
 */
const BUSINESS: { label: string; value: string }[] = [
  { label: "상호", value: "심리상담실 현 (Hyeon Counseling)" },
  { label: "대표", value: "김태현" },
  { label: "사업자등록번호", value: "186-25-02396" },
  { label: "통신판매업 신고", value: "2026-서울동작-0798" },
  { label: "주소", value: "서울특별시 동작구 상도로15다길 16" },
  { label: "고객센터", value: "010-6478-1181" },
  { label: "이메일", value: "support@hyeon-counseling.com" },
  { label: "호스팅 제공", value: "Vercel Inc." },
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
              나를 이해하는 공부를, 편안한 속도로. 김태현 심리상담가가 만드는 강의·상담.
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
          <p>
            {BUSINESS.filter((b) => b.value)
              .map((b) => (b.label === "상호" ? b.value : `${b.label} ${b.value}`))
              .join(" · ")}
          </p>
          <p>이 사이트의 콘텐츠는 심리 교육을 목적으로 하며 의학적 진단이나 치료를 대체하지 않습니다.</p>
          <p>© {year} Hyeon Counseling. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
