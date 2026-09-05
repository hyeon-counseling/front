import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "강의",
  description: "심리상담가 현의 온라인 강의. 10분씩, 한 편씩.",
};

// S2(LMS)에서 실제 강의 목록으로 교체된다. 지금은 안내만.
export default function CoursesPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="mb-4"><span className="eyebrow">강의</span></p>
        <h1 className="font-display text-4xl leading-tight text-[var(--foreground)] sm:text-5xl">
          10분씩, 한 편씩.
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          심리상담가가 직접 설명하는 짧은 강의를 준비하고 있습니다. 첫 강의는 <strong className="text-[var(--foreground)]">고기능 우울증</strong>을 다룹니다. 겉으로는 잘 지내는 것처럼 보이지만 안에서는 오래 지쳐 있는 마음에 대해.
        </p>
        <div className="mt-12 rounded-3xl border border-dashed border-[var(--border)] p-10 text-center">
          <p className="font-display text-xl text-[var(--foreground)]">곧 공개됩니다</p>
          <p className="mt-2 text-sm text-[var(--foreground-muted)]">
            공개되면 회원에게 이메일로 알려드릴게요. 그동안 무료 아티클과 워크북 1주차를 먼저 만나 보세요.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/register" className="inline-flex items-center rounded-xl bg-[var(--brand)] px-6 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-hover)]">
              회원가입하고 소식 받기
            </Link>
            <Link href="/articles" className="inline-flex items-center rounded-xl border border-[var(--border)] px-6 py-2.5 text-sm font-medium text-[var(--foreground)] hover:border-[var(--brand)] hover:text-[var(--brand)]">
              아티클 읽기
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
