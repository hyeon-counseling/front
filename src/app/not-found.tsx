import Link from "next/link";

// 없는 주소 — Next 기본 화면 대신 쉬운 말로 (한국어·영어 사이트 공통, 헤더·푸터 없는 루트 레이아웃에서 그려진다)
export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-24">
      <div className="max-w-md text-center">
        <Link href="/" className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--brand)] text-xl font-bold text-white" aria-label="심리상담실 현 홈">
          현
        </Link>
        <h1 className="mt-6 text-2xl font-bold text-[var(--foreground)]">찾으시는 페이지가 없어요</h1>
        <p className="mt-3 leading-relaxed text-[var(--foreground-muted)]">
          주소가 바뀌었거나 잘못 입력되었을 수 있어요. 알림톡·문자의 버튼으로 들어오셨다면 받은 메시지에서 버튼을 한 번 더 눌러 주세요.
        </p>
        <p className="mt-2 text-sm text-[var(--foreground-subtle)]">The page you are looking for doesn&apos;t exist.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
            홈으로
          </Link>
          <Link href="/contact" className="inline-flex h-12 items-center rounded-xl bg-[var(--surface)] px-6 font-semibold text-[var(--foreground)]">
            문의하기
          </Link>
        </div>
      </div>
    </main>
  );
}
