// 접수면접지 v2 문항 (12-접수면접지-v2.html) — 서버 규칙은 hyeon-back services/assessment/intakeForm.ts (키·필수 같게 유지)

export type Q =
  | { key: string; kind: "text"; label: string; required?: boolean; max: number; placeholder?: string; hint?: string; numeric?: boolean }
  | { key: string; kind: "area"; label: string; required?: boolean; max: number; placeholder?: string; hint?: string; examples?: string[]; counter?: boolean }
  | { key: string; kind: "choice"; label: string; required?: boolean; choices: string[]; hint?: string; more?: { when: string[]; key: string; label: string | Record<string, string>; placeholder: string | Record<string, string> } }
  | { key: string; kind: "multi"; label: string; required?: boolean; choices: string[]; hint?: string }
  | { key: string; kind: "rank"; label: string; required?: boolean; choices: string[]; max: number; solo?: string; hint?: string; more?: { when: string; key: string; label: string } }
  | { key: string; kind: "range"; label: string; min: number; max: number; left: string; right: string }
  | { key: "safety"; kind: "safety"; label: string }
  | { key: "pledge"; kind: "pledge"; label: string; items: string[] };

export interface Step {
  title: string;
  lead?: string;
  questions: Q[];
}

const JOB_DETAIL_LABEL: Record<string, string> = {
  직장인: "어떤 일을 하나요? (직종)",
  프리랜서: "어떤 분야에서 일하나요?",
  자영업: "어떤 가게·일인가요?",
  사업: "어떤 사업인가요?",
  "대학생(대학원생)": "전공은 무엇인가요?",
  기타: "어떤 상황인지 적어 주세요",
};
const JOB_DETAIL_PH: Record<string, string> = {
  직장인: "예: IT 회사 마케팅, 병원 간호사",
  프리랜서: "예: 영상 편집, 번역, 일러스트",
  자영업: "예: 카페 운영, 온라인 쇼핑몰",
  사업: "예: 교육 스타트업 운영, 디자인 회사 대표",
  "대학생(대학원생)": "예: 경영학과 3학년, 심리학 석사과정",
  기타: "예: 군 복무 중, 해외 거주 중",
};

export const INTAKE_STEPS: Step[] = [
  {
    title: "기본 정보",
    lead: "신청서와 맞춰 보기 위한 정보예요.",
    questions: [
      { key: "name", kind: "text", label: "이름", required: true, max: 40 },
      { key: "phone", kind: "text", label: "신청할 때 적은 휴대폰 번호", required: true, max: 13, placeholder: "010-0000-0000", numeric: true },
      { key: "age", kind: "text", label: "만 나이", required: true, max: 3, numeric: true, hint: "만 19세 이상 나이를 숫자로 적어 주세요." },
      {
        key: "job",
        kind: "choice",
        label: "지금 하는 일",
        required: true,
        choices: ["직장인", "프리랜서", "자영업", "사업", "대학생(대학원생)", "구직·쉬는 중", "주부·육아", "기타"],
        more: { when: Object.keys(JOB_DETAIL_LABEL), key: "job_detail", label: JOB_DETAIL_LABEL, placeholder: JOB_DETAIL_PH },
      },
      { key: "living", kind: "text", label: "함께 사는 사람", max: 100, placeholder: "예: 혼자 / 부모님·동생 / 배우자와 고양이" },
    ],
  },
  {
    title: "검사를 받게 된 계기와 기대",
    lead: "무엇이 이 검사를 떠올리게 했는지 알려 주세요.",
    questions: [
      {
        key: "why",
        kind: "area",
        label: "검사를 받아 보려고 한 계기",
        required: true,
        max: 1000,
        hint: "예시를 누르면 칸에 들어가요. 내 말로 고쳐 써도 좋아요.",
        examples: [
          "나를 더 정확히 알고, 나를 설명하는 말을 갖고 싶어요.",
          "이직·진로를 앞두고 나에게 맞는 방향을 찾고 싶어요.",
          "관계에서 비슷한 장면이 반복되는 이유가 궁금해요.",
          "요즘 달라진 내 모습이 원래 나인지 궁금해요.",
          "결혼·독립 같은 새 출발 전에 나를 점검해 보고 싶어요.",
        ],
      },
      {
        key: "hope",
        kind: "rank",
        label: "검사로 알고 싶은 것",
        max: 3,
        hint: "중요한 순서대로 최대 3개 — 먼저 누른 것이 1순위예요. 다시 누르면 빠져요.",
        choices: ["타고난 기질과 성격", "나만의 강점", "스트레스를 다루는 나만의 방식", "관계에서 반복되는 패턴", "일·진로와 잘 맞는 점", "요즘 마음 상태", "상담을 받아 볼지 결정"],
      },
      {
        key: "expect",
        kind: "area",
        label: "그 밖에 기대하는 것",
        max: 1000,
        examples: [
          "나를 설명하는 말을 갖고 싶어요.",
          "내 강점을 일에 어떻게 쓸지 알고 싶어요.",
          "가까운 사람에게 나를 설명할 수 있으면 좋겠어요.",
          "앞으로 무엇을 연습하면 좋을지 알고 싶어요.",
          "예전에 받은 검사 결과와 비교해 보고 싶어요.",
        ],
      },
    ],
  },
  {
    title: "지금 고민",
    lead: "특별한 고민이 없어도 괜찮아요. \"궁금해서\"도 좋은 이유예요.",
    questions: [
      {
        key: "area",
        kind: "rank",
        label: "요즘 마음이 쓰이는 영역",
        required: true,
        max: 3,
        solo: "특별히 없음(궁금해서)",
        hint: "중요한 순서대로 최대 3개 — 먼저 누른 것이 1순위예요.",
        choices: ["기분·감정", "불안·걱정", "의욕·지침", "자존감", "친구·동료 관계", "연애·결혼", "가족", "일·진로", "공부", "잠", "습관(술·폰·게임 등)", "기타", "특별히 없음(궁금해서)"],
        more: { when: "기타", key: "area_more", label: "'기타'는 어떤 영역인가요?" },
      },
      {
        key: "worry",
        kind: "area",
        label: "가장 마음 쓰이는 일을 조금 더 알려 주세요",
        max: 1000,
        counter: true,
        hint: "예시를 누르면 칸에 들어가요. 내 상황에 맞게 고쳐 주세요.",
        examples: [
          "팀장님 말 한마디가 하루 종일 마음에 남아요.",
          "이직을 할지 남을지 몇 달째 고민하고 있어요.",
          "연인과 다툴 때마다 비슷한 지점에서 막혀요.",
          "해야 할 일은 아는데 시작이 잘 안 돼요.",
          "가족에게 하고 싶은 말을 꺼내기가 어려워요.",
        ],
      },
      { key: "level", kind: "range", label: "이 고민 때문에 요즘 힘든 정도", min: 0, max: 10, left: "0 괜찮아요", right: "10 아주 힘들어요" },
    ],
  },
  {
    title: "생활",
    lead: "몸과 생활 리듬도 검사 결과에 영향을 줄 수 있어서 여쭤요. 이 단계는 모두 선택이에요.",
    questions: [
      { key: "work", kind: "area", label: "일·학업은 요즘 어떤가요?", max: 500, placeholder: "예: \"입사 2년 차, 야근이 주 3번쯤 있어요.\" / \"휴학하고 시험 준비 중이에요.\"" },
      { key: "sleep_h", kind: "choice", label: "하루에 보통 자는 시간", choices: ["5시간 이하", "6시간쯤", "7~8시간", "9시간 이상", "들쭉날쭉"] },
      { key: "sleep_issue", kind: "multi", label: "잠과 관련해 해당하는 것", choices: ["잠들기 어려워요", "자다가 자주 깨요", "너무 일찍 깨요", "자도 피곤해요", "괜찮아요"] },
      { key: "health", kind: "area", label: "지금 치료받고 있거나 신경 쓰이는 건강 문제", max: 500, placeholder: "예: \"없어요\" / \"갑상선 약을 먹고 있어요\" / \"허리 디스크로 물리치료 중이에요\"" },
      { key: "meds", kind: "area", label: "요즘 먹는 약", max: 500, placeholder: "약 이름을 몰라도 괜찮아요. 예: \"잠 오는 약을 가끔\", \"병원에서 받은 불안 약\"" },
    ],
  },
  {
    title: "가족·관계",
    lead: "간단하게만 알려 주세요. 자세한 이야기는 상담에서 원하실 때 나눠요.",
    questions: [
      { key: "family", kind: "area", label: "가족은 나에게 어떤 느낌인가요?", max: 500, placeholder: "예: \"엄마와는 친한데 아빠와는 거의 대화가 없어요.\" / \"따로 산 지 오래라 덤덤해요.\"" },
      { key: "support", kind: "choice", label: "힘들 때 이야기할 수 있는 사람이 있나요?", choices: ["있어요", "한두 명쯤", "잘 없어요"] },
    ],
  },
  {
    title: "이전 상담·검사 경험",
    lead: "예전 경험이 있으면 결과를 비교해 볼 수 있어요.",
    questions: [
      {
        key: "prev_c",
        kind: "choice",
        label: "상담을 받아 본 적이 있나요?",
        required: true,
        choices: ["없어요", "있어요"],
        more: { when: ["있어요"], key: "prev_c_more", label: "언제, 어디서, 얼마나", placeholder: "예: \"2023년 학교 상담센터에서 5번쯤\", \"지금도 다른 곳에서 받고 있어요\"" },
      },
      {
        key: "prev_t",
        kind: "choice",
        label: "심리검사를 받아 본 적이 있나요?",
        required: true,
        choices: ["없어요", "있어요", "잘 모르겠어요"],
        more: {
          when: ["있어요"],
          key: "prev_t_more",
          label: "검사 이름과 대략 언제인지",
          placeholder: "예: \"MBTI는 여러 번, 작년 회사에서 스트레스 검사\". 최근 1년 안에 MMPI나 TCI를 받았다면 꼭 적어 주세요.",
        },
      },
      { key: "psych", kind: "choice", label: "정신건강의학과 진료를 받은 적이 있나요?", choices: ["없어요", "예전에 있어요", "지금 다니고 있어요", "말하고 싶지 않아요"] },
    ],
  },
  {
    title: "나의 강점·좋아하는 것",
    lead: "검사는 어려운 점만 보지 않아요. 나를 버티게 하는 힘도 함께 봐요.",
    questions: [
      { key: "strength", kind: "area", label: "내가 잘하는 것, 남들이 칭찬해 준 점", max: 500, placeholder: "예: \"친구들 이야기를 잘 들어 준다는 말을 자주 들어요.\" / \"한번 시작하면 끝까지 해요.\"" },
      { key: "likes", kind: "area", label: "좋아하는 것, 기분이 나아지는 것", max: 500, placeholder: "예: \"주말 아침 혼자 동네 산책\", \"고양이랑 낮잠\", \"보드게임 모임\"" },
    ],
  },
  {
    title: "해석 상담에서 꼭 다루고 싶은 것",
    lead: "60분 중 가장 먼저 다룰 이야기를 정하는 데 써요.",
    questions: [
      {
        key: "focus",
        kind: "area",
        label: "이 질문의 답은 꼭 듣고 가고 싶어요",
        required: true,
        max: 1000,
        hint: "한 가지라도 적어 주세요. \"아직 잘 모르겠어요\"도 괜찮아요.",
        examples: [
          "나는 왜 부탁을 거절하기가 어려울까?",
          "이 결과를 이직·진로 결정에 어떻게 쓸 수 있을까?",
          "내 강점은 무엇이고, 어디에서 가장 잘 드러날까?",
          "관계에서 나는 어떤 역할을 자주 맡을까?",
          "지금 나에게 상담이 도움이 될까, 혼자 해 볼 수 있을까?",
        ],
      },
      {
        key: "careful",
        kind: "area",
        label: "다루기 조심스러운 주제가 있다면",
        max: 1000,
        examples: ["가족 이야기는 아직 꺼내고 싶지 않아요.", "예전 연애 이야기는 짧게만 다루고 싶어요.", "회사나 사람 이름은 말하지 않고 싶어요.", "건강 이야기는 다루지 않았으면 해요.", "특별히 없어요."],
      },
    ],
  },
  {
    title: "안전 확인",
    lead: "모든 분께 똑같이 여쭙는 질문이에요. 어떤 답이든 검사와 상담은 그대로 진행돼요.",
    questions: [{ key: "safety", kind: "safety", label: "최근 2주 동안, 스스로를 해치고 싶거나 죽고 싶다는 생각을 한 적이 있나요?" }],
  },
  {
    title: "확인하고 제출하기",
    lead: "빈칸이 있어도 제출할 수 있어요. 아래 온라인 검사 약속만 꼭 체크해 주세요.",
    questions: [
      {
        key: "pledge",
        kind: "pledge",
        label: "온라인 검사 약속",
        items: [
          "신청한 제가 직접 응답할게요. (다른 사람이 대신하거나 함께 고르지 않아요)",
          "조용한 곳에서 혼자 응답할게요.",
          "검사 화면을 사진 찍거나 캡처하거나 다른 곳에 공유하지 않을게요.",
          "검사 문항은 출판사의 저작물이라 옮겨 적거나 퍼뜨리지 않을게요.",
        ],
      },
    ],
  },
];

export type Answers = Record<string, string | string[]>;

/** 이 문항이 채워졌는지 (필수 검사용) */
export function filled(q: Q, a: Answers): boolean {
  const v = a[q.key];
  if (q.kind === "pledge") return Array.isArray(v) && v.length === q.items.length;
  if (q.key === "phone") return /^010\d{8}$/.test(String(v ?? "").replace(/\D/g, ""));
  if (q.key === "age") {
    const n = Number(v);
    return Number.isInteger(n) && n >= 19 && n <= 99;
  }
  return Array.isArray(v) ? v.length > 0 : typeof v === "string" && v.trim() !== "";
}
