import Link from "next/link";

// 마이페이지 · 심리상담 현황 — 상담 예약은 아직 카페24에서 받으므로 안내만
export default function MyCounselingPage() {
  return (
    <div className="px-4 py-12 sm:px-6 sm:py-16">
      <div className="mx-auto max-w-4xl">
        <h1 className="font-display text-2xl text-[var(--foreground)] sm:text-3xl">심리상담 현황</h1>
        <div className="card mt-8 p-8 text-center">
          <p className="text-[var(--foreground)]">상담 예약 현황을 이곳에서 볼 수 있도록 준비하고 있어요.</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">지금은 상담 안내 페이지에서 예약하고, 카카오톡 채널 「심리상담실 현」으로 일정을 안내해 드려요.</p>
          <Link href="/counseling" className="mt-6 inline-flex h-11 items-center rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white">
            상담 안내 보기
          </Link>
        </div>
      </div>
    </div>
  );
}
