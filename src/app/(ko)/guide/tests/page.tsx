import type { Metadata } from "next";
import { Card, FaqList, GuideFooter, GuidePage, GuideSection, GuideToc, Note, Steps } from "@/components/assessment/GuideBlocks";

export const metadata: Metadata = {
  title: "검사 소개·방법·자주 묻는 질문 · 종합심리검사",
  description: "MMPI-3 · TCI-RS · SCT가 각각 무엇을 보는지, 편하게 하는 요령과 검사 중 자주 묻는 질문을 모았어요.",
};

/**
 * 종합심리검사 검사 소개 + 검사 방법 + 검사 FAQ — 알림톡 N3·N4·N5 [검사 소개와 FAQ] 버튼의 고정 주소
 * 원본: 25-카드뉴스-검사소개 · 22-카드뉴스-검사방법-v2 · 23-카드뉴스-검사FAQ-v2 (10/30 웹 페이지로 옮김)
 * 예시 문장은 모두 실제 문항이 아니다 (검사 문항은 저작권·검사 보안).
 */
const THREE = [
  { name: "MMPI-3", what: "지금의 성격 · 대처", desc: "요즘의 나, 스트레스를 다루는 방식", meta: "335문항 · 예/아니오 · 약 35~50분 · 마음사랑", btn: "MMPI 검사" },
  { name: "TCI-RS", what: "타고난 기질 + 키워 온 성격", desc: "어릴 때부터 꾸준한 나의 바탕", meta: "약 140문항 · 5점 중 고르기 · 약 15~30분 · 마음사랑", btn: "TCI 검사" },
  { name: "SCT", what: "내 말로 쓴 마음", desc: "내가 고른 단어와 이야기", meta: "약 50문장 · 문장 끝맺기 · 약 20~40분 · 인싸이트", btn: "SCT 검사" },
];

const Example = ({ children, answer }: { children: string; answer?: string }) => (
  <Card className="bg-[var(--surface)] shadow-none">
    <p className="text-xs font-bold text-[var(--foreground-subtle)]">예시 문장 (실제 문항 아님)</p>
    <p className="mt-1 font-semibold text-[var(--foreground)]">&ldquo;{children}&rdquo;</p>
    {answer && <p className="mt-1 text-[15px]">→ {answer}</p>}
  </Card>
);

const FAQ = [
  {
    q: "링크가 안 열려요",
    a: (
      <>
        <ol className="list-decimal space-y-1 pl-5">
          <li>다른 브라우저로 열기 — 카톡 안 화면의 메뉴(︙)에서 &lsquo;다른 브라우저로 열기&rsquo; → 크롬·사파리</li>
          <li>PC에서 열기 — PC 카카오톡에도 같은 알림톡이 와요. 거기서 버튼을 눌러요</li>
          <li>맞는 버튼인지 확인 — 검사마다 버튼이 따로예요: [MMPI 검사] · [TCI 검사] · [SCT 검사]</li>
        </ol>
        <p>그래도 안 되면 채널에 어떤 화면이 뜨는지 알려 주세요. 오류 안내 화면은 캡처해 보내셔도 돼요 (문항 화면은 캡처하지 않아요).</p>
      </>
    ),
  },
  {
    q: "검사 링크 알림톡이 안 와요",
    a: (
      <>
        <p>검사 링크는 접수면접지를 낸 다음 날 아침 8시에 「심리상담실 현」 알림톡으로 가요. 인증코드를 따로 받을 필요는 없어요.</p>
        <ol className="list-decimal space-y-1 pl-5">
          <li>접수면접지를 냈는지 확인 — &lsquo;접수면접지를 받았어요&rsquo; 알림톡이 왔다면 제출된 거예요</li>
          <li>다음 날 아침 8시가 지났는지 확인 — 드물게 준비가 늦어지면 그다음 날 아침 8시에 가요</li>
          <li>그래도 없으면 카카오톡 채널 「심리상담실 현」에 이름을 남겨 주세요</li>
        </ol>
      </>
    ),
  },
  {
    q: "검사 중간에 끊겼어요",
    a: (
      <>
        <ol className="list-decimal space-y-1 pl-5">
          <li>같은 버튼으로 다시 들어가 보세요. 이어서 할 수 있는지는 출판사 시스템마다 달라요.</li>
          <li>처음부터 다시 하라고 나오면 그대로 두고 채널로 먼저 알려 주세요. 새 검사 링크가 필요할 수 있어요.</li>
        </ol>
        <p>다음엔 와이파이가 안정적인 곳에서, 충전기를 꽂고, 한 검사는 한 자리에서 마쳐 주세요. 끊긴 건 내 잘못이 아니에요. 응답한 부분은 상담가가 확인해 볼게요.</p>
      </>
    ),
  },
  {
    q: "잘 모르겠는 문항은요?",
    a: <p>정답은 없어요. 조금이라도 더 가까운 쪽을 고르고 넘어가요. 단어 뜻이 헷갈리면 평소 쓰는 뜻으로 읽어요. 남에게 묻거나 검색하지 않고, 빈칸은 되도록 남기지 않아요.</p>,
  },
  {
    q: "휴대폰으로 해도 되나요?",
    a: <p>할 수 있지만 문항이 많아 PC·노트북을 권해요. 휴대폰이면 충전기 연결, 와이파이, 방해 금지 모드를 켜고 다른 앱으로 넘어가지 않아요.</p>,
  },
  {
    q: "“왜 이런 걸 묻지?” 문항이 좀 이상해요",
    a: (
      <>
        <p>MMPI-3은 아주 다양한 사람의 여러 마음 상태를 넓게 살펴보도록 만든 검사예요. 그물을 넓게 던지는 것처럼, 나와 상관없어 보이는 문항도 섞여 있어요.</p>
        <p>나에게 해당 없으면 편하게 &lsquo;아니오&rsquo;를 고르세요. 그런 문항이 있다고 내가 이상한 게 아니에요. 해석은 성격·대처 방식·관계 패턴 중심으로 해요.</p>
      </>
    ),
  },
  {
    q: "다 했는지 어떻게 알아요?",
    a: (
      <>
        <p>검사마다 마지막에 &lsquo;제출(완료)&rsquo; 버튼을 누르고 완료 화면이 보이면 끝이에요. 세 개(MMPI-3·TCI-RS는 마음사랑, SCT는 인싸이트) 모두 확인해 주세요.</p>
        <p>셋 다 확인되면 다음 날 아침 &lsquo;검사가 모두 확인되었어요&rsquo; 알림톡이 가요. 다 마쳤는데 다음 날 아침 &ldquo;아직 끝나지 않은 검사가 있어요&rdquo; 알림톡이 오면 채널로 알려 주세요.</p>
      </>
    ),
  },
  {
    q: "마감이 다가와요",
    a: (
      <>
        <p>마감(상담 7일 전)까지 남은 검사가 있으면 매일 아침 8시에 알려 드려요. 시간이 부족할 것 같다면 마감 전에 채널로 말씀해 주세요.</p>
        <p>마감이 지나면 [새 일정 고르기]로 새 날짜를 골라요. 마친 검사는 그대로 인정돼요. 문항이 가장 많은 MMPI-3만 먼저 끝내도 훨씬 가벼워요.</p>
      </>
    ),
  },
  {
    q: "결과를 미리 볼 수 있나요?",
    a: (
      <>
        <p>검사를 마쳐도 결과가 바로 나오지 않고, 상담가에게만 전달돼요. 점수만 따로 보면 오해하기 쉬워서예요. 설명을 들으며 보는 게 훨씬 정확하고 마음도 편해요.</p>
        <p>상담 때 보고서를 화면으로 함께 보고, 끝나면 내 페이지에서 보고서와 해석 영상을 다시 봐요.</p>
      </>
    ),
  },
];

export default function GuideTestsPage() {
  return (
    <GuidePage
      chip="종합심리검사 · 검사 안내"
      title={
        <>
          검사 소개와
          <br />
          방법, 자주 묻는 질문
        </>
      }
      lead="MMPI-3 · TCI-RS · SCT가 각각 무엇을 보는지, 왜 셋을 함께 보는지, 편하게 하는 요령과 막힐 때 볼 질문을 모았어요."
    >
      <GuideToc
        items={[
          { id: "about", label: "세 가지 검사" },
          { id: "together", label: "함께 보는 이유" },
          { id: "how", label: "검사 요령" },
          { id: "rest", label: "쉬는 법·환경" },
          { id: "dont", label: "하지 말 것" },
          { id: "faq", label: "자주 묻는 질문" },
        ]}
      />

      <GuideSection id="about" chip="검사를 시작하기 전에" title="&lsquo;어디가 문제일까&rsquo;보다 &lsquo;나는 어떤 사람일까&rsquo;">
        <div className="grid gap-2.5 sm:grid-cols-2">
          <Card>
            <p className="font-bold text-[var(--foreground)]">이런 게 아니에요</p>
            <ul className="mt-1 space-y-0.5 text-[15px]">
              <li>✕ 병 이름 붙이기</li>
              <li>✕ 정상·비정상 가르기</li>
              <li>✕ 점수로 줄 세우기</li>
            </ul>
          </Card>
          <Card>
            <p className="font-bold text-[var(--foreground)]">이런 거예요</p>
            <ul className="mt-1 space-y-0.5 text-[15px]">
              <li>✓ 내가 잘 쓰는 힘 찾기</li>
              <li>✓ 자주 반복되는 내 패턴 알기</li>
              <li>✓ 힘 빠질 때 꺼내 쓸 방법</li>
            </ul>
          </Card>
        </div>
        <p>세 검사로 &lsquo;나 사용 설명서&rsquo;를 함께 써 보는 시간이에요. 누구에게나 빛나는 힘이 있고, 그 힘이 잘 안 통하는 순간도 있어요.</p>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">같은 나를 세 층에서 들여다봐요</h3>
        <div className="grid gap-2.5">
          {THREE.map((t) => (
            <Card key={t.name}>
              <p className="flex flex-wrap items-baseline gap-x-2">
                <span className="text-lg font-extrabold text-[var(--tci-dark)]">{t.name}</span>
                <span className="font-bold text-[var(--foreground)]">{t.what}</span>
              </p>
              <p className="mt-0.5 text-[15px]">{t.desc}</p>
              <p className="mt-1 text-sm text-[var(--foreground-subtle)]">
                {t.meta} · 알림톡 [{t.btn}]
              </p>
            </Card>
          ))}
        </div>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">TCI-RS — 타고난 기질 4가지</h3>
        <div className="grid gap-2.5 sm:grid-cols-2">
          {[
            ["자극 추구", "새롭고 재미있는 것에 끌리는 정도", "시작하는 힘"],
            ["위험 회피", "미리 살피고 조심하는 정도", "신중함 · 꼼꼼함"],
            ["사회적 민감성", "다른 사람의 마음에 반응하는 정도", "공감 · 따뜻함"],
            ["인내력", "보상이 늦어도 꾸준히 하는 정도", "끈기 · 성실함"],
          ].map(([n, d, s]) => (
            <Card key={n}>
              <p className="font-bold text-[var(--foreground)]">{n}</p>
              <p className="text-[15px]">{d}</p>
              <p className="mt-0.5 text-sm font-semibold text-[var(--brand)]">{s}</p>
            </Card>
          ))}
        </div>
        <p>높다 · 낮다에 좋고 나쁨은 없어요. 상황마다 빛나는 쪽이 달라요.</p>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">TCI-RS — 살아오며 키워 온 성격 3가지</h3>
        <Steps
          items={[
            { title: "자율성", desc: "내 삶을 내 뜻대로 이끄는 힘" },
            { title: "연대감", desc: "다른 사람과 함께 지내는 힘" },
            { title: "자기초월", desc: "나보다 큰 것(자연·의미·가치)과 이어진 느낌" },
          ]}
        />
        <p>기질이 &lsquo;타고난 엔진&rsquo;이라면, 성격은 그 엔진을 다루는 &lsquo;운전 습관&rsquo;이에요. 성격은 지금도 자라요.</p>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">MMPI-3 — 요즘의 내가 어떤 마음으로 지내는지</h3>
        <p>스트레스가 올 때 어떻게 대처하는지 생각 · 감정 · 행동 · 관계를 골고루 넓게 살펴봐요. 새로 나온 한국판으로, 요즘 한국 성인들의 응답과 견주어 보고, 솔직하게 답했는지도 함께 확인해서 결과를 더 믿고 볼 수 있어요.</p>
        <p>높게 나온 곳도 &lsquo;문제&rsquo;라기보다 요즘 내가 힘을 많이 쓰고 있는 곳으로 함께 읽어요.</p>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">SCT — 숫자로는 잡히지 않는 나만의 이야기</h3>
        <p>문장의 앞부분을 보고 떠오르는 대로 이어 써요. 가족 · 관계 · 일 · 나 자신 · 앞으로의 나를 내가 어떤 말로 이야기하는지 알 수 있어요.</p>
        <Example answer="좋아하는 사람들과 맛있는 걸 먹으며 수다 떨 때다.">내가 가장 나다워지는 순간은 ______</Example>
      </GuideSection>

      <GuideSection id="together" chip="왜 셋을 함께 볼까요" tone="coral" title="세 장을 겹치면 한 사람의 이야기가 돼요">
        <Card>
          <p className="text-sm font-bold text-[var(--foreground-subtle)]">가상 예시 · 이서윤(가명), 29세, 직장인</p>
          <ul className="mt-2 space-y-1.5 text-[15px] leading-relaxed">
            <li>
              <b className="text-[var(--foreground)]">TCI-RS (바탕)</b> 새로운 일에 금방 불이 붙는 기질 → 시작하는 힘이 강점
            </li>
            <li>
              <b className="text-[var(--foreground)]">MMPI-3 (지금)</b> 요즘은 반복 업무가 이어져 쉬어도 개운하지 않은 상태
            </li>
            <li>
              <b className="text-[var(--foreground)]">SCT (내 말)</b> &ldquo;나는 원래 재미있는 걸 찾아다니는 사람인데…&rdquo;
            </li>
          </ul>
          <p className="mt-2 text-[15px]">→ &lsquo;더 참는 법&rsquo;보다 일 속에 작은 새로움을 넣는 법이 서윤 님에게 더 잘 맞을 수 있어요.</p>
        </Card>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">결과는 꼬리표가 아니라 대화의 재료예요</h3>
        <Steps
          items={[
            { title: "세 결과를 하나로 엮은 종합 해석 보고서", desc: "김태현 심리상담가가 접수면접지까지 함께 읽고 써요" },
            { title: "해석 상담 약 60분 (대면 · 화상)", desc: "보고서를 같이 보며 묻고 답해요" },
            { title: "강점에서 시작하는 해석", desc: "잘 쓰는 힘 → 그 힘이 안 통하는 상황 → 그때 꺼내 쓸 방법" },
          ]}
        />
        <p className="text-[15px]">검사는 의학적 판단을 대신하지 않아요. 병원의 도움이 필요해 보이면 상담에서 함께 이야기해요.</p>
      </GuideSection>

      <GuideSection id="how" chip="검사 방법" tone="mmpi" title="검사도 셋, 버튼도 셋">
        <p>알림톡의 [MMPI 검사] · [TCI 검사] · [SCT 검사] 버튼을 누르면 인증코드가 자동으로 들어가요.</p>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">추천 순서 — 긴 검사부터, 힘이 있을 때</h3>
        <Steps
          items={[
            { title: "MMPI-3", desc: "[MMPI 검사]로 · 집중력 좋을 때 먼저 (약 35~50분) → 물 한 잔, 스트레칭 5~10분" },
            { title: "TCI-RS", desc: "[TCI 검사]로 이어서 → 잠깐 숨 돌리기" },
            { title: "SCT", desc: "[SCT 검사]로, 마지막에 차분히 글로" },
          ]}
        />
        <p className="text-[15px]">순서는 바꿔도 괜찮아요. 검사별로 나눠서 해도 돼요.</p>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">① MMPI-3 — 예 / 아니오</h3>
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>예 / 아니오 중 더 가까운 쪽 — 딱 맞지 않아도 조금 더 가까운 쪽이면 돼요</li>
          <li>너무 오래 고민하지 않기 — 처음 떠오른 답이 가장 나다운 답이에요</li>
          <li>가능한 한 모든 문항에 답하기 — 빈칸이 많으면 해석이 어려워져요</li>
        </ul>
        <Example answer="예 / 아니오">나는 비 오는 날 우산을 자주 놓고 온다.</Example>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">② TCI-RS — 5점 중 고르기</h3>
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>&lsquo;요즘&rsquo;보다 &lsquo;평소의 나&rsquo; — 특별한 하루가 아니라 대체로의 나를 떠올려요</li>
          <li>애매하면 조금 더 가까운 쪽 — 가운데만 계속 고르지 않아도 돼요</li>
        </ul>
        <Example answer="전혀 아니다 · 아니다 · 보통 · 그렇다 · 매우 그렇다">나는 처음 가 보는 동네 카페를 찾아다니는 게 즐겁다.</Example>

        <h3 className="pt-2 font-bold text-[var(--foreground)]">③ SCT — 문장 끝맺기</h3>
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>떠오르는 대로 솔직하게 — 멋진 문장이 아니어도, 한 줄이어도 괜찮아요</li>
          <li>막히면 넘어갔다가 돌아오기 — 맞춤법은 신경 쓰지 않아도 돼요. 빈칸만 남기지 말아 주세요</li>
        </ul>
        <Example answer="알람 없이 푹 자고 싶은데 늘 일찍 깬다.">주말 아침이 되면 ______</Example>
      </GuideSection>

      <GuideSection id="rest" chip="쉬는 법 · 환경" title="쉬는 건 검사와 검사 사이에 해요">
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>검사 하나를 마치고 쉬기 — 물 마시기, 창문 열기, 스트레칭 5~10분</li>
          <li>문항이 많은 MMPI-3 중간에는 잠깐만 — 화면을 그대로 두고 1~2분 눈을 쉬어 주세요</li>
          <li>검사 중에 창 닫기 · 새로고침은 하지 않아요 — 응답이 사라질 수 있어요</li>
        </ul>
        <Note title="중간 저장, 될까요?">한 검사 안에서 이어 하기가 되는지는 출판사 시스템에 따라 달라요. 그래서 한 검사는 되도록 한 자리에서 마쳐 주세요.</Note>
        <h3 className="pt-2 font-bold text-[var(--foreground)]">조용한 곳에서, 한 번에</h3>
        <ul className="list-disc space-y-1 pl-5 text-[15px]">
          <li>방해받지 않는 조용한 곳 — 카페·지하철보다 집이나 내 방이 좋아요</li>
          <li>알림 끄기, 충전기 연결 — 휴대폰은 방해 금지 모드로</li>
          <li>PC·노트북 권장 — 휴대폰도 되지만 큰 화면이 덜 지쳐요</li>
          <li>시작 화면에서 이름 같은 내 정보를 물으면 신청 때와 같게 적어 주세요</li>
        </ul>
      </GuideSection>

      <GuideSection id="dont" chip="이것만은 하지 말아 주세요" tone="coral" title="있는 그대로의 나로, 혼자 답해 주세요">
        <Steps
          items={[
            { title: "다른 사람에게 묻거나 같이 하기", desc: "링크는 신청하신 본인만, 혼자 응답해요" },
            { title: "좋게 보이려고 꾸미기", desc: "답을 꾸미면 결과가 오히려 흐려져요" },
            { title: "화면 촬영 · 캡처 · 공유", desc: "검사 문항은 저작권과 검사 보안으로 보호돼요" },
          ]}
        />
        <Note title="&lsquo;타당도 척도&rsquo;가 있어요">얼마나 솔직하고 일관되게 답했는지 보는 척도예요. 꾸민 답이 많으면 해석 자체가 어려워져요.</Note>
        <p className="text-[15px]">검사 마감은 해석 상담 7일 전 밤 12시예요(알림톡에 날짜가 적혀 있어요). 다 마치면 상담가가 확인하고 알림톡으로 알려 드려요.</p>
      </GuideSection>

      <GuideSection id="faq" chip="자주 묻는 질문" tone="mmpi" title="검사하다 막힐 때 보는 9가지">
        <FaqList items={FAQ} />
      </GuideSection>

      <GuideFooter
        links={[
          { href: "/guide/apply", label: "신청 안내와 FAQ", sub: "진행 순서 · 검사 마감 · 해석 상담" },
          { href: "/my/assessment", label: "내 진행 상황 보기", sub: "로그인 후 마이페이지 → 심리검사 진행" },
        ]}
      />
    </GuidePage>
  );
}
