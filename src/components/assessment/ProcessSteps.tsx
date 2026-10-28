import { Icon, type IconName } from "./Icon";

// 종합심리검사 진행 순서 (70 상세 시안 '여덟 걸음') — 휴대폰은 세로, 넓은 화면은 4칸씩 가로
// tone: g = 그린, c = 코랄, s = 민트
const STEPS: { title: string; when: string; body: string; icon: IconName; tone: "g" | "c" | "s" }[] = [
  { title: "신청·결제", when: "결제 즉시 확정", body: "상담 날짜·시간은 신청할 때 직접 골라요. 3분이면 끝나요.", icon: "heart", tone: "g" },
  { title: "접수면접지 작성", when: "알림톡 링크 · 15~20분", body: "지금의 나를 미리 알려 주시면, 해석이 내 삶에 꼭 맞게 돼요.", icon: "pencil", tone: "c" },
  { title: "검사 링크 받기", when: "낸 다음 날 아침 8시", body: "MMPI-3 · TCI · SCT 링크가 알림톡으로 한 번에 와요.", icon: "bell", tone: "g" },
  { title: "집에서 온라인 검사", when: "마감 = 상담 7일 전", body: "나눠서 해도 괜찮아요. 남은 검사가 있으면 아침에 한 번 알려 드려요.", icon: "laptop", tone: "s" },
  { title: "보고서 준비", when: "상담 전 7일", body: "김태현 심리상담가가 결과와 접수면접지를 꼼꼼히 읽고 써요.", icon: "doc", tone: "g" },
  { title: "해석 상담 약 60분", when: "대면 3일 전 장소 · 하루 전 안내", body: "보고서를 함께 보며 묻고 답해요.", icon: "chat", tone: "c" },
  { title: "보고서·해석 영상 받기", when: "상담 뒤 내 페이지", body: "언제든 다시 열어 볼 수 있어요.", icon: "gift", tone: "g" },
  { title: "후기와 1주 뒤 체크", when: "다음 날 · 7일 뒤", body: "짧은 만족도 설문, 그리고 1주 뒤 마음 컨디션을 한 번 더 재 봐요.", icon: "sprout", tone: "s" },
];

const TONE = {
  g: { box: "bg-white text-[var(--brand)]", num: "bg-[var(--brand)]", when: "bg-[var(--brand-light)] text-[var(--brand)]" },
  c: { box: "bg-[var(--coral-light)] text-[var(--coral-ink)]", num: "bg-[var(--coral)]", when: "bg-[var(--coral-light)] text-[var(--coral-ink)]" },
  s: { box: "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]", num: "bg-[var(--mmpi-dark)]", when: "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]" },
};

export function ProcessSteps() {
  return (
    <ol className="as-steps mt-8 grid md:grid-cols-4 md:gap-x-[22px] md:gap-y-[34px]">
      {STEPS.map((s, i) => {
        const t = TONE[s.tone];
        return (
          <li key={s.title} className="grid grid-cols-[48px_1fr] gap-3.5 pb-[22px] md:grid-cols-1 md:content-start md:gap-3 md:pb-0">
            <span className={`relative flex h-12 w-12 items-center justify-center rounded-2xl shadow-[var(--shadow-sm)] ${t.box}`}>
              <Icon name={s.icon} />
              <i className={`absolute -right-1.5 -top-1.5 flex h-[22px] w-[22px] items-center justify-center rounded-full text-xs font-extrabold not-italic text-white ${t.num}`}>{i + 1}</i>
            </span>
            <div>
              <h3 className="pt-0.5 text-lg font-extrabold text-[var(--foreground)]">{s.title}</h3>
              <span className={`mb-0.5 mt-1 inline-block rounded-lg px-2 py-0.5 text-[13px] font-extrabold ${t.when}`}>{s.when}</span>
              <p className="text-[15.5px] leading-relaxed text-[var(--foreground-muted)]">{s.body}</p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// 신청 화면용 짧은 진행 순서 (71 신청 시안 '이렇게 진행돼요 · 7단계') — 1단계가 '지금'
export const FLOW_COMPACT: { title: string; body?: string; when?: string }[] = [
  { title: "신청·결제", body: "결제하면 바로 확정돼요. 상담 일시는 아래에서 직접 골라요", when: "결제 즉시 알림톡" },
  { title: "접수면접지 작성", body: "지금의 나를 15~20분쯤 알려 주세요. 해석이 내 삶에 딱 맞게 돼요", when: "알림톡 속 링크로" },
  { title: "검사 링크 받기", body: "MMPI-3 · TCI-RS · SCT 링크가 한 번에 와요", when: "접수면접지 낸 다음 날 아침 8시" },
  { title: "집에서 온라인 검사", body: "나눠서 해도 괜찮아요", when: "마감 = 해석 상담 7일 전" },
  { title: "보고서 준비", body: "김태현 심리상담가가 결과를 꼼꼼히 읽어요" },
  { title: "해석 상담 약 60분", when: "대면은 3일 전 장소 확정·하루 전 다시 안내 · 화상은 하루 전 접속 링크" },
  { title: "보고서·해석 영상 받기", body: "회원 페이지에서 언제든 다시 봐요" },
];

export function ProcessStepsCompact() {
  return (
    <ol className="as-flow px-[18px] pb-4">
      {FLOW_COMPACT.map((s, i) => (
        <li key={s.title} className="pb-3.5 pl-[46px] text-[14.5px] leading-normal text-[var(--foreground-muted)]">
          <span
            className={`absolute left-0 top-0 flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold ${
              i === 0 ? "bg-[var(--tci)] text-white" : i === 1 ? "bg-[var(--coral)] text-white" : "bg-[var(--brand-light)] text-[var(--tci)]"
            }`}
          >
            {i + 1}
          </span>
          <b className="block text-[15.5px] text-[var(--foreground)]">
            {s.title}
            {i === 0 && <span className="ml-1.5 rounded-full bg-[var(--tci)] px-2 py-px align-[2px] text-[11px] font-extrabold text-white">지금</span>}
          </b>
          {s.body}
          {s.when && (
            <>
              {s.body && <br />}
              <span className={`mt-[3px] inline-block rounded-[7px] px-2 py-px text-[12.5px] font-extrabold ${i === 1 ? "bg-[var(--coral-light)] text-[var(--coral-ink)]" : "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]"}`}>{s.when}</span>
            </>
          )}
        </li>
      ))}
    </ol>
  );
}
