import Link from "next/link";

/** 위기 안내 — 자살 사고 문항에 응답했거나 결과가 심할 때 결과 맨 위에 */
export function CrisisBox({ strong }: { strong?: boolean }) {
  return (
    <div className={`rounded-2xl border p-5 ${strong ? "border-red-200 bg-red-50" : "border-amber-200 bg-amber-50"}`}>
      <p className={`font-bold ${strong ? "text-red-800" : "text-amber-800"}`}>
        {strong ? "지금 많이 힘드신가요? 혼자 견디지 않아도 돼요." : "혼자 감당하기보다 도움을 받아 보세요."}
      </p>
      <p className={`mt-1 text-sm leading-relaxed ${strong ? "text-red-700" : "text-amber-800"}`}>
        {strong
          ? "죽음이나 자해에 대한 생각이 든다면 지금 바로 이야기할 수 있는 곳이 있어요. 24시간 언제든 연결돼요."
          : "결과가 높게 나왔어요. 가까운 전문가와 이야기 나누면 훨씬 가벼워질 수 있어요."}
      </p>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        <li className="rounded-xl bg-white/70 px-4 py-3">
          <a href="tel:109" className="font-bold text-[var(--foreground)]">☎ 109</a>
          <span className="block text-xs text-[var(--foreground-muted)]">자살예방상담전화 (24시간)</span>
        </li>
        <li className="rounded-xl bg-white/70 px-4 py-3">
          <a href="tel:15770199" className="font-bold text-[var(--foreground)]">☎ 1577-0199</a>
          <span className="block text-xs text-[var(--foreground-muted)]">정신건강위기상담 (24시간)</span>
        </li>
      </ul>
      <p className="mt-3 text-xs text-[var(--foreground-muted)]">
        위급한 상황이면 112·119에 연락해 주세요. ·{" "}
        <Link href="/counseling" className="underline">심리상담실 현 상담 안내</Link>
      </p>
    </div>
  );
}

/** 모든 검사 공통 오리엔테이션 — 어떤 자세와 마음가짐으로 임하면 좋은지 */
export const COMMON_ORIENTATION: { icon: string; title: string; body: string }[] = [
  { icon: "🌿", title: "정답은 없어요", body: "좋은 답, 나쁜 답이 없어요. 문항을 읽고 가장 먼저 떠오르는 답을 골라 주세요. 한 문항에 오래 머물지 않아도 돼요." },
  { icon: "🪞", title: "'되고 싶은 나'가 아니라 '지금의 나'", body: "이래야 한다는 기준보다, 요즘 실제로 어떤지를 솔직하게 떠올려 주세요. 솔직할수록 결과가 나에게 더 쓸모 있어요." },
  { icon: "🕯️", title: "조용한 곳에서 잠깐", body: "방해받지 않는 2~3분이면 충분해요. 이동 중보다는 편안히 앉을 수 있을 때 해 보세요." },
  { icon: "🧭", title: "진단이 아니라 나를 살펴보는 거울", body: "자가 검사는 지금 마음의 상태를 가늠해 보는 도구예요. 병을 진단하지 않아요. 결과는 참고로만 보고, 궁금하거나 걱정되면 전문가와 이야기해 보세요." },
  { icon: "🤍", title: "결과가 높게 나와도 괜찮아요", body: "알아차리는 것이 돌봄의 시작이에요. 결과 화면에서 도움이 되는 방법과 이야기할 곳을 함께 안내해 드려요." },
  { icon: "⏸️", title: "힘들면 언제든 멈춰도 돼요", body: "답하다가 마음이 무거워지면 잠시 쉬었다 와도 괜찮아요. 급하게 도움이 필요하면 109(24시간)로 연락하세요." },
];

/** 민감정보(심리검사 응답) 수집·이용 안내 */
export function SensitiveConsentText() {
  return (
    <div className="space-y-1.5 text-xs leading-relaxed text-[var(--foreground-muted)]">
      <p><strong className="text-[var(--foreground)]">수집 항목</strong> · 검사 응답, 점수와 결과, 검사 당시 나이·성별</p>
      <p><strong className="text-[var(--foreground)]">이용 목적</strong> · 결과 제공, 내 검사 기록 보관, 상담 신청 시 참고, 서비스 개선을 위한 통계(개인을 알아볼 수 없는 형태)</p>
      <p><strong className="text-[var(--foreground)]">열람</strong> · 본인과 심리상담실 현 상담가(운영자)만 볼 수 있어요</p>
      <p><strong className="text-[var(--foreground)]">보관 기간</strong> · 회원 탈퇴 시 즉시 삭제</p>
      <p>동의하지 않을 수 있지만, 그 경우 심리검사를 이용할 수 없어요. 자세한 내용은 <Link href="/privacy" className="underline" target="_blank">개인정보처리방침</Link>을 확인해 주세요.</p>
    </div>
  );
}
