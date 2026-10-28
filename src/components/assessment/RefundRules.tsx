// 종합심리검사 취소·환불 규정 (11-신청페이지-v2 환불 팝업 문안, 52-취소환불규정.md — 10/29 상담가 확정)
// 신청 페이지 팝업 · 취소 요청 화면 공통. highlight = 지금 해당하는 구간
export type RefundTier = "free" | "before_link" | "link_not_started" | "started" | "after_deadline" | "none" | "manual";

const ROWS: { tier: RefundTier; when: string; amount: string; sub?: string }[] = [
  { tier: "before_link", when: "검사 링크를 받기 전", amount: "150,000원", sub: "전액" },
  { tier: "link_not_started", when: "링크를 받았지만 검사를 하나도 시작하지 않았을 때", amount: "120,000원", sub: "검사 실비 3만 원을 빼고" },
  { tier: "started", when: "검사를 시작한 뒤 ~ 검사 마감(상담 7일 전) 전", amount: "90,000원" },
  { tier: "after_deadline", when: "검사 마감 뒤 ~ 상담 3일 전까지", amount: "45,000원" },
  { tier: "none", when: "상담 2일 전 ~ 당일, 연락 없이 오지 않았을 때", amount: "환불 없음", sub: "준비된 보고서와 해석 영상은 내 페이지로 드려요" },
];

export function RefundRules({ highlight }: { highlight?: RefundTier }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-[var(--foreground-muted)]">
      <p>시작하기 전에는 전액, 시작한 뒤에는 이미 들어간 비용만큼 빼고 돌려드려요. (150,000원 기준)</p>
      <ul className="divide-y divide-[var(--border-light)] overflow-hidden rounded-2xl border border-[var(--border-light)]">
        {ROWS.map((r) => (
          <li key={r.tier} className={`flex items-start justify-between gap-3 px-4 py-3 ${highlight === r.tier ? "bg-[var(--brand-light)]" : "bg-white"}`}>
            <span className={highlight === r.tier ? "font-semibold text-[var(--foreground)]" : ""}>
              {highlight === r.tier && <span className="mr-1 text-[var(--brand)]">●</span>}
              {r.when}
            </span>
            <span className="shrink-0 text-right">
              {r.sub && <span className="block text-xs text-[var(--foreground-subtle)]">{r.sub}</span>}
              <b className="text-[var(--foreground)]">{r.amount}</b>
            </span>
          </li>
        ))}
      </ul>
      <p>
        <b className="text-[var(--foreground)]">일정 변경</b>: 상담 3일 전까지 1회 무료(일정 재조정 페이지). 검사 마감을 넘겨 다시 잡을 때도 1회 무료예요.
      </p>
      <p>
        <b className="text-[var(--foreground)]">상담가 사정으로 취소</b>되면 새 일정 또는 전액 환불 중에서 골라요. 상담가가 다른 도움(병원 진료 등)이 먼저라고 판단해 진행을 멈추면, 검사 시작 전엔 전액, 시작 후엔 검사 실비만 빼고 돌려드려요.
      </p>
      <p>무료(쿠폰 0원) 신청은 환불 대상이 아니에요.</p>
      <p>
        <b className="text-[var(--foreground)]">취소 요청</b>: 마이페이지 → 심리검사 진행 → 취소 요청, 또는 카카오톡 채널 「심리상담실 현」. 결제한 수단으로 영업일 3~5일 안에 돌려드려요.
      </p>
    </div>
  );
}
