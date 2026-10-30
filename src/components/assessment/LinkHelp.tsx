import Link from "next/link";

/**
 * 개인 주소(/a/:key)가 없거나 맞지 않을 때 — 알림톡 버튼을 다시 누르도록 안내
 * (/a 로 바로 들어왔을 때, 링크가 잘렸거나 신청을 찾지 못했을 때)
 */
export function LinkHelp({ message }: { message?: string }) {
  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-4xl">🔗</p>
      <h1 className="mt-4 text-2xl font-bold text-[var(--foreground)]">알림톡의 링크를 다시 눌러 주세요</h1>
      <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
        {message ? `${message.replace(/\s*알림톡의 링크를 다시 눌러 주세요\.?/, "")} ` : ""}
        종합심리검사 진행 화면은 알림톡이나 문자로 받은 버튼으로만 열려요. 받은 메시지에서 버튼을 한 번 더 눌러 주세요.
      </p>
      <p className="mt-2 text-sm text-[var(--foreground-subtle)]">그래도 열리지 않으면 카카오톡 채널 「심리상담실 현」이나 문의 페이지로 알려 주세요.</p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/my/assessment" className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
          마이페이지에서 보기
        </Link>
        <Link href="/contact" className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold text-[var(--foreground)]">
          문의하기
        </Link>
      </div>
    </div>
  );
}
