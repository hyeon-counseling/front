// 종합심리검사 진행 순서 (11-신청페이지-v2 '이렇게 진행돼요') — 상세·신청 화면 공통
const STEPS = [
  { title: "신청·결제", when: "지금", body: "결제하면 바로 확정돼요. 상담 일시는 신청할 때 직접 골라요." },
  { title: "접수면접지 작성", when: "알림톡 속 링크로", body: "지금의 나를 15~20분쯤 알려 주세요. 해석이 내 삶에 딱 맞게 돼요." },
  { title: "검사 링크 받기", when: "접수면접지 낸 다음 날 아침 8시", body: "MMPI-3 · TCI-RS · SCT 링크가 한 번에 와요." },
  { title: "집에서 온라인 검사", when: "마감 = 해석 상담 7일 전", body: "나눠서 해도 괜찮아요." },
  { title: "보고서 준비", when: "", body: "김태현 심리상담가가 결과를 꼼꼼히 읽어요." },
  { title: "해석 상담 약 60분", when: "하루 전 장소·화상 링크 안내", body: "결과를 함께 보며 이야기 나눠요." },
  { title: "보고서·해석 영상 받기", when: "", body: "회원 페이지에서 언제든 다시 봐요." },
];

export function ProcessSteps() {
  return (
    <ol className="mt-5 grid gap-3 sm:grid-cols-2">
      {STEPS.map((s, i) => (
        <li key={s.title} className="flex gap-4 rounded-2xl border border-[var(--border-light)] bg-white p-4">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--brand-light)] text-sm font-bold text-[var(--brand)]">{i + 1}</span>
          <div className="min-w-0">
            <p className="font-semibold text-[var(--foreground)]">{s.title}</p>
            {s.when && <p className="mt-0.5 text-xs font-semibold text-[var(--brand)]">{s.when}</p>}
            <p className="mt-1 text-sm leading-relaxed text-[var(--foreground-muted)]">{s.body}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}
