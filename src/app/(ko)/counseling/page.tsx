import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "상담 · 심리검사",
  description: "개인 심리상담과 심리검사 안내. 화상(Google Meet) 또는 대면으로 진행합니다.",
};

// 당분간 신청·결제는 카페24 쇼핑몰에서 진행한다 (상담운영시스템은 추후).
const SHOP_URL = process.env.NEXT_PUBLIC_SHOP_URL ?? "https://hyeon-counseling.com";

const STEPS = [
  { t: "신청", d: "쇼핑몰에서 상담 상품을 선택하고 원하는 날짜·시간을 고릅니다. 결제가 끝나면 예약이 확정됩니다." },
  { t: "확인", d: "예약 확정 안내를 이메일·카카오톡으로 받습니다. 화상 상담이면 Google Meet 링크가 함께 갑니다." },
  { t: "상담", d: "50분 동안 함께 이야기합니다. 대면은 서울(종로·강남 인근) 스터디룸에서 진행하며 장소를 미리 안내합니다." },
  { t: "이후", d: "필요하면 다음 회기를 잡습니다. 워크북이나 강의를 함께 쓰면 상담 사이의 시간이 더 단단해집니다." },
];

export default function CounselingPage() {
  return (
    <div className="px-4 py-16 sm:px-6 sm:py-24">
      <div className="mx-auto max-w-3xl">
        <p className="eyebrow rise rise-1 mb-4">상담 · 심리검사</p>
        <h1 className="font-display rise rise-2 text-4xl leading-tight text-[var(--brand-ink)] sm:text-5xl">
          혼자 하기 어려울 때는,
          <br />
          함께 이야기합니다.
        </h1>
        <p className="rise rise-3 mt-6 max-w-2xl text-lg leading-relaxed text-[var(--foreground-muted)]">
          개인 심리상담은 화상(Google Meet) 또는 대면으로 진행합니다. 지금은 쇼핑몰에서 신청과 결제를 받고 있어요.
        </p>

        <div className="rise rise-4 mt-10 flex flex-wrap gap-3">
          <a
            href={SHOP_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full bg-[var(--brand)] px-7 py-3 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-hover)]"
          >
            쇼핑몰에서 상담 신청하기
            <span aria-hidden>↗</span>
          </a>
          <a href="mailto:support@hyeoncounseling.com" className="link-underline px-2 py-3 text-sm text-[var(--foreground)]">
            먼저 문의하기
          </a>
        </div>

        {/* 진행 순서 */}
        <div className="mt-16 grid gap-px overflow-hidden rounded-3xl border border-[var(--border)] bg-[var(--border)] sm:grid-cols-2">
          {STEPS.map((s, i) => (
            <div key={s.t} className="bg-[var(--background)] p-7">
              <p className="font-display mb-3 text-sm text-[var(--foreground-subtle)]">0{i + 1}</p>
              <h3 className="font-display text-xl text-[var(--foreground)]">{s.t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">{s.d}</p>
            </div>
          ))}
        </div>

        {/* 안내 */}
        <div className="mt-12 rounded-2xl border border-[var(--border-light)] bg-[var(--surface)] p-6 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <p className="mb-2 font-semibold text-[var(--foreground)]">알아두세요</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>상담은 심리 교육과 자기 이해를 돕는 서비스이며 정신과 진료를 대체하지 않습니다.</li>
            <li>자해·자살 생각 등 위급한 상황이라면 자살예방상담전화 109, 정신건강위기상담 1577-0199로 먼저 연락해 주세요.</li>
            <li>예약 변경·취소 규정은 쇼핑몰 상품 페이지의 안내를 따릅니다.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
