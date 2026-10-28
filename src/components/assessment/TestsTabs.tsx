import Link from "next/link";

// 심리검사 하위 메뉴 — 전문 심리검사(기본) · 간이 무료 심리검사
export function TestsTabs({ active }: { active: "pro" | "free" }) {
  const tab = (key: "pro" | "free", href: string, label: string) => (
    <Link
      href={href}
      aria-current={active === key ? "page" : undefined}
      className={`inline-flex h-10 items-center rounded-full px-5 text-sm font-semibold transition-colors ${
        active === key ? "bg-[var(--foreground)] text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]"
      }`}
    >
      {label}
    </Link>
  );
  return (
    <nav aria-label="심리검사 종류" className="flex flex-wrap gap-2">
      {tab("pro", "/assessment", "전문 심리검사")}
      {tab("free", "/tests", "간이 무료 심리검사")}
    </nav>
  );
}
