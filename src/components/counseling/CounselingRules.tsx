import Link from "next/link";

/**
 * 개인 상담 상품·가격·취소·환불 규정 (결정 #56, 10/30 상담가 확정 — 근거: hyeon test test/reports/취소·환불 규칙안 2026-10.md)
 * /counseling(요약)과 /refund(전문)이 같은 값을 쓴다. 가격은 2026-12-31까지 오픈 가격. 부가세 문구는 면세 여부 확인 뒤.
 */
export const PRICE = 60_000; // 1회기 50분, 화상·대면 같음
export const OPEN_PRICE_UNTIL = "2026년 12월 31일";

export const PLANS = [
  { key: "single", name: "1회", sessions: 1, total: 60_000, valid: "", note: "한 번씩 편하게" },
  { key: "first", name: "첫 상담 패키지", sessions: 2, total: 60_000, valid: "2개월", note: "처음 오시는 분의 첫 2회기를 1회 가격으로" },
  { key: "five", name: "5회", sessions: 5, total: 270_000, valid: "4개월", note: "10% 할인" },
  { key: "ten", name: "10회", sessions: 10, total: 480_000, valid: "8개월", note: "20% 할인" },
] as const;
export type PlanKey = (typeof PLANS)[number]["key"];

/** 여러 회기 옵션(2·5·10회) 공통 안내 */
export const MULTI_NOTE = "첫 상담에서 이후 상담 일정을 함께 조율해요.";

/**
 * 신청·결제는 아직 카페24 — 옵션별 카페24 상품 주소를 넣으면 그 상품으로 바로 간다 (비우면 쇼핑몰 첫 화면)
 * 예: single: "https://hyeoncounseling.cafe24.com/product/개인상담/12/"
 */
export const SHOP_HOME = process.env.NEXT_PUBLIC_SHOP_URL ?? "https://hyeoncounseling.cafe24.com";
export const SHOP_URLS: Record<PlanKey, string> = { single: "", first: "", five: "", ten: "" };
export const shopUrl = (key: PlanKey) => SHOP_URLS[key] || SHOP_HOME;

const won = (n: number) => `${n.toLocaleString("ko-KR")}원`;

// 회기 취소·변경 (상담 시작 시각 기준, 6만 원 기준 환불액)
export const CANCEL_ROWS = [
  { when: "3일(72시간) 전까지", cut: 0 },
  { when: "3일 전 ~ 2일 전", cut: 10 },
  { when: "2일 전 ~ 1일 전", cut: 30 },
  { when: "1일 전 ~ 2시간 전", cut: 50 },
  { when: "2시간 이내", cut: 80 },
] as const;

/** 묶음 중도 해지 환급액 (B안) — 결제액 − min(정가 × 이용, 회당 결제 단가 × 이용 + 결제 총액의 10%) */
export function refundOnCancel(total: number, sessions: number, used: number): number {
  const unit = total / sessions;
  const cut = Math.min(PRICE * used, unit * used + total * 0.1);
  return Math.max(0, Math.round(total - cut));
}

const EXAMPLES = [
  { label: "10회 묶음(48만 원) · 3회 사용", total: 480_000, sessions: 10, used: 3 },
  { label: "10회 묶음(48만 원) · 8회 사용", total: 480_000, sessions: 10, used: 8 },
  { label: "첫 상담 패키지(6만 원) · 1회 사용", total: 60_000, sessions: 2, used: 1 },
];

const TH = "px-3 py-2.5 text-left font-semibold";
const TD = "px-3 py-2.5";

/** 회기 취소·변경 표 */
export function CancelTable() {
  return (
    <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)]">
      <table className="w-full min-w-[420px] text-sm">
        <thead className="bg-[var(--surface)] text-xs text-[var(--foreground-subtle)]">
          <tr>
            <th className={TH}>취소·변경 시점 (상담 시작 시각 기준)</th>
            <th className={TH}>차감</th>
            <th className={TH}>돌려받는 금액 (6만 원 기준)</th>
          </tr>
        </thead>
        <tbody>
          {CANCEL_ROWS.map((r) => (
            <tr key={r.when} className="border-t border-[var(--border-light)]">
              <td className={TD}>{r.when}</td>
              <td className={TD}>{r.cut}%</td>
              <td className={`${TD} font-semibold text-[var(--foreground)]`}>{won((PRICE * (100 - r.cut)) / 100)}</td>
            </tr>
          ))}
          <tr className="border-t border-[var(--border-light)]">
            <td className={TD}>연락 없이 오지 않았을 때 (노쇼)</td>
            <td className={TD}>100% (묶음은 1회 차감)</td>
            <td className={`${TD} font-semibold text-[var(--foreground)]`}>0원</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

/** /refund 「개인 상담」 전문 */
export function CounselingRefundRules() {
  return (
    <div className="space-y-6">
      <div>
        <p className="mb-2 font-semibold text-[var(--foreground)]">1. 회기 취소·변경 (화상·대면 같음)</p>
        <CancelTable />
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>묶음·패키지 회기는 회당 결제 단가로 차감액을 계산합니다.</li>
          <li>취소·변경 기준 시각은 카카오톡 채널 「심리상담실 현」에 메시지를 보낸 시각입니다.</li>
          <li>갑작스러운 질병·사고·입원(나중에 증빙), 직계가족 경조사, 천재지변·감염병으로 취소하면 차감하지 않습니다.</li>
          <li>상담가 사정으로 취소하면 무료로 다시 예약해 드립니다. 상담 24시간 이내에 알려 드렸다면 다음 회기 금액을 깎아 드립니다.</li>
          <li>처음 한 번의 노쇼는 차감하지 않고 안내만 드립니다.</li>
        </ul>
      </div>

      <div>
        <p className="mb-2 font-semibold text-[var(--foreground)]">2. 묶음·패키지 중도 해지</p>
        <p>
          환급액 = 결제액 − 차감액. 차감액은 「정가 6만 원 × 이용한 회기」로 계산하되, 「회당 결제 단가 × 이용한 회기 + 결제 총액의 10%」를 넘지 않습니다.
        </p>
        <div className="mt-3 overflow-x-auto rounded-2xl border border-[var(--border-light)]">
          <table className="w-full min-w-[420px] text-sm">
            <thead className="bg-[var(--surface)] text-xs text-[var(--foreground-subtle)]">
              <tr>
                <th className={TH}>예시</th>
                <th className={TH}>돌려받는 금액</th>
              </tr>
            </thead>
            <tbody>
              {EXAMPLES.map((e) => (
                <tr key={e.label} className="border-t border-[var(--border-light)]">
                  <td className={TD}>{e.label}</td>
                  <td className={`${TD} font-semibold text-[var(--foreground)]`}>{won(refundOnCancel(e.total, e.sessions, e.used))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <ul className="mt-3 list-disc space-y-1.5 pl-5">
          <li>결제 후 7일 안에 해지하면 쓴 회기만 결제 단가로 빼고, 위약금 없이 돌려드립니다.</li>
          <li>유효기간이 지나도 남은 회기를 돌려받거나 1회 연장을 신청할 수 있습니다.</li>
          <li>질병·입원으로 상담을 이어가기 어렵거나, 상담가가 종결이나 다른 기관 연계를 권한 경우에는 위약금 없이 남은 회기를 모두 돌려드립니다.</li>
          <li>해지 의사를 받은 날부터 3영업일 안에 처리하며, 카드 수수료는 빼지 않습니다.</li>
        </ul>
      </div>
    </div>
  );
}

/** /counseling 요약 */
export function CounselingRulesSummary() {
  return (
    <div className="space-y-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
      <CancelTable />
      <p>
        상담 시작 3일(72시간) 전까지는 전액 돌려드리고, 그 뒤로는 가까워질수록 조금씩 차감돼요. 변경·취소는 카카오톡 채널 「심리상담실 현」으로 알려 주세요(보낸 시각이 기준이에요). 묶음 중도 해지와 예외 사항은{" "}
        <Link href="/refund" className="link-underline text-[var(--foreground)]">
          환불 규정
        </Link>
        에 자세히 있어요.
      </p>
    </div>
  );
}
