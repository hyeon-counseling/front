"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { deadlineText, kstParts, type SlotView } from "@/lib/assessment";
import { Modal, Skeleton, cx } from "@/components/ui";
import { RefundRules } from "@/components/assessment/RefundRules";
import { FLOW_COMPACT, ProcessStepsCompact } from "@/components/assessment/ProcessSteps";
import { Plate } from "@/components/assessment/Plate";
import { Icon, type IconName } from "@/components/assessment/Icon";

/**
 * 종합심리검사 신청 (11-신청페이지-v2 기준)
 * 기본 정보 → 상담 방식 → 공개 슬롯 1개 → 검사 이유 → 필수 동의 4가지 → 주문 생성 → /checkout/:orderId (쿠폰)
 * 금액·마감은 서버가 다시 계산한다. 슬롯은 [신청하기]를 누를 때 30분 잡아 둔다.
 * 화면 = 71-신청페이지-시안 (1/3·2/3·3/3 단계 표시, 넓은 화면 「내 신청 요약」). 검증·전송 흐름은 그대로.
 */
const REGIONS = ["홍대", "강남", "종로", "혜화", "사당"];
const REASONS = [
  "나를 더 정확히 알고 싶어서",
  "진로·이직 앞에서 나에게 맞는 방향을 찾고 싶어서",
  "관계에서 반복되는 패턴이 궁금해서",
  "내 강점을 말로 정리해 보고 싶어서",
  "새 출발을 앞두고 나를 점검해 보고 싶어서",
];
const GENDERS = [
  { v: "female", l: "여성" },
  { v: "male", l: "남성" },
  { v: "other", l: "기타" },
  { v: "undisclosed", l: "밝히고 싶지 않음" },
];
const FIRST_DAYS = 6;

type Field = "name" | "phone" | "gender" | "birth" | "mode" | "region" | "slot" | "agree";

const CONSENTS: { key: "privacy" | "sensitive" | "testing" | "notice"; title: string; rows: [string, string][] }[] = [
  {
    key: "privacy",
    title: "개인정보 수집·이용 동의",
    rows: [
      ["항목", "이름, 휴대폰 번호, 성별, 태어난 해, 해석 상담 방식·지역·일시, 검사 받는 이유(적은 경우)"],
      ["목적", "신청 확인, 일정 안내, 검사·해석 상담 진행 안내"],
      ["처리 위탁", "검사 실시: 마음사랑(MMPI-3·TCI-RS), 인싸이트(SCT) — 이름 등 검사에 필요한 정보 / 알림톡·문자 발송: 솔라피 — 이름·휴대폰 번호"],
      ["보관 기간", "10년"],
      ["거부할 권리", "동의하지 않을 수 있어요. 다만 이 정보 없이는 검사를 진행할 수 없어요."],
    ],
  },
  {
    key: "sensitive",
    title: "민감정보 처리 동의 (따로 받는 동의예요)",
    rows: [
      ["항목", "심리검사 응답과 결과, 접수면접지에 적은 마음·건강 관련 내용"],
      ["목적", "검사 결과 해석, 종합 해석 보고서·해석 영상 제작, 해석 상담"],
      ["처리 위탁", "검사 응답·결과는 마음사랑·인싸이트 검사 시스템에 저장돼요."],
      ["보관 기간", "10년"],
      ["거부할 권리", "동의하지 않을 수 있어요. 다만 검사 결과 없이는 해석을 할 수 없어요."],
    ],
  },
  {
    key: "testing",
    title: "검사·해석 동의 (온라인 검사 수칙 포함)",
    rows: [
      ["목적", "나를 더 깊이 이해하기 위한 검사예요. 의학적 판단을 내리는 검사가 아니에요."],
      ["비용", "150,000원 — 검사 3종 + 종합 해석 보고서 + 해석 상담 약 60분 + 해석 영상(3만 원 상당)"],
      ["해석 방법", "출판사의 채점 자료를 참고하고, 김태현 심리상담가가 접수면접지와 함께 종합해 해석해요."],
      ["비밀보장", "김태현 심리상담가만 보고, 동의 없이 가족·회사 등 다른 사람에게 알리지 않아요. 단, 본인이나 다른 사람의 생명·안전이 위험할 때나 법으로 정한 경우는 예외예요."],
      ["온라인 검사 수칙", "신청한 본인이 직접, 조용한 곳에서 혼자 응답해요. 검사 화면은 사진·녹화·캡처하거나 공유하지 않아요. 검사 문항은 출판사의 저작물이라 옮겨 적거나 퍼뜨리지 않아요."],
    ],
  },
  {
    key: "notice",
    title: "알림톡 수신 동의 — 진행 안내를 받고, 검사 마감 전까지 미완료 시 매일 아침 1회 안내 알림을 받는 데 동의해요",
    rows: [
      ["보내는 것", "신청 확정, 접수면접지, 검사 링크, 검사 마감, 상담 장소·화상 링크, 보고서 전달처럼 진행에 꼭 필요한 안내만 보내요. 검사를 다 마치면 매일 안내는 바로 멈춰요. 광고는 보내지 않아요."],
      ["대신 보내기", "카카오톡을 쓰지 않으면 문자로 대신 보내 드려요."],
    ],
  },
];

export default function ApplyPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [slots, setSlots] = useState<SlotView[] | null>(null);
  const [fromText, setFromText] = useState("");
  const [nameEdit, setName] = useState<string | null>(null);
  const [phone, setPhone] = useState("");
  const [gender, setGender] = useState("");
  const [birth, setBirth] = useState("");
  const [adult, setAdult] = useState(false);
  const [method, setMethod] = useState<"offline" | "online" | "">("");
  const [r1, setR1] = useState("");
  const [r2, setR2] = useState("");
  const [slotId, setSlotId] = useState("");
  const [reasons, setReasons] = useState<string[]>([]);
  const [own, setOwn] = useState("");
  const [agree, setAgree] = useState<Record<string, boolean>>({});
  const [openDetail, setOpenDetail] = useState<string | null>(null);
  const [refundOpen, setRefundOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [bad, setBad] = useState<Set<Field>>(new Set());
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const website = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?next=/assessment/comprehensive/apply");
      return;
    }
    apiRequest<{ fromText: string; slots: SlotView[] }>("/api/assessment/slots").then((r) => {
      setSlots(r.ok && r.data ? r.data.slots : []);
      setFromText(r.data?.fromText ?? "");
    });
  }, [loading, user, router]);

  const name = nameEdit ?? user?.name ?? "";
  const thisYear = new Date().getFullYear();
  const years = useMemo(() => Array.from({ length: 72 }, (_, i) => thisYear - 19 - i), [thisYear]);

  // 방식에 맞는 칸만, 날짜별로 묶기
  const days = useMemo(() => {
    const map = new Map<string, { label: string; weekend: boolean; slots: SlotView[] }>();
    for (const s of slots ?? []) {
      if (method && !s.methods.includes(method)) continue;
      const p = kstParts(s.startsAt);
      const d = map.get(p.dateKey) ?? { label: `${p.month}/${p.day}`, weekend: p.isWeekend, slots: [] };
      d.slots.push(s);
      map.set(p.dateKey, d);
    }
    return [...map.entries()].map(([key, v]) => ({ key, ...v, dow: kstParts(v.slots[0].startsAt).dow }));
  }, [slots, method]);
  const picked = slots?.find((s) => s.id === slotId) ?? null;

  const clear = (f: Field) =>
    setBad((b) => {
      if (!b.has(f)) return b;
      const n = new Set(b);
      n.delete(f);
      return n;
    });

  const allAgreed = CONSENTS.every((c) => agree[c.key]);

  const validate = (): Set<Field> => {
    const errs = new Set<Field>();
    if (name.trim().length < 2) errs.add("name");
    if (!/^010\d{8}$/.test(phone.replace(/\D/g, ""))) errs.add("phone");
    if (!gender) errs.add("gender");
    if (!birth || birth === "under" || !adult) errs.add("birth");
    if (!method) errs.add("mode");
    else if (method === "offline" && (!r1 || !r2 || r1 === r2)) errs.add("region");
    if (!picked || !picked.available || (method && !picked.methods.includes(method))) errs.add("slot");
    if (!allAgreed) errs.add("agree");
    return errs;
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (website.current?.value) return;
    setError("");
    const errs = validate();
    setBad(errs);
    if (errs.size) {
      setError(`빠진 곳이 ${errs.size}군데 있어요. 빨간 글씨를 확인해 주세요.`);
      document.querySelector("[data-bad='1']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setBusy(true);
    const res = await apiRequest<{ orderId: string }>("/api/assessment/applications", {
      method: "POST",
      body: JSON.stringify({
        name: name.trim(),
        phone,
        gender,
        birthYear: Number(birth),
        adult,
        method,
        regions: method === "offline" ? [r1, r2] : [],
        slotId,
        reasons: [...reasons, ...(own.trim() ? [own.trim()] : [])],
        consents: Object.fromEntries(CONSENTS.map((c) => [c.key, true])),
      }),
    });
    if (res.ok && res.data) {
      router.push(`/checkout/${res.data.orderId}`);
      return;
    }
    setBusy(false);
    setError(res.message || "신청하지 못했어요. 잠시 뒤 다시 시도해 주세요.");
    const field = (res.data as { field?: Field } | null)?.field;
    if (field) setBad(new Set([field]));
    if (field === "slot") apiRequest<{ slots: SlotView[] }>("/api/assessment/slots").then((r) => r.ok && r.data && setSlots(r.data.slots));
  };

  if (loading || !user) return null;

  // ── 화면 표시용 (검증 규칙과 같은 기준으로 단계 완료를 보여 준다 — 제출 검증은 위 validate 그대로) ──
  const stepDone = [
    name.trim().length >= 2 && /^010\d{8}$/.test(phone.replace(/\D/g, "")) && !!gender && !!birth && birth !== "under" && adult,
    method !== "" && (method === "online" || (!!r1 && !!r2 && r1 !== r2)) && !!picked && picked.available && picked.methods.includes(method),
    allAgreed,
  ];
  const curStep = stepDone.indexOf(false);
  const doneCount = stepDone.filter(Boolean).length;

  const errText = (f: Field, text: string) => (bad.has(f) ? <p className="as-err">{text}</p> : null);
  const visibleDays = showAll ? days : days.slice(0, FIRST_DAYS);
  const pickedText = picked ? `${kstParts(picked.startsAt).dayText} ${kstParts(picked.startsAt).timeText}` : "";

  // 넓은 화면 요약 칸의 버튼 — 다 채웠으면 제출(같은 submit), 아니면 덜 채운 단계로 이동
  const sideGo = () => {
    if (curStep === -1) {
      formRef.current?.requestSubmit();
      return;
    }
    document.getElementById(`ap-s${curStep + 1}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="assess">
      <div className="bg-[var(--ivory)] text-base leading-[1.6]">
        {/* 머리 */}
        <header className="relative overflow-hidden bg-[var(--mint-bg)]">
          <span aria-hidden="true" className="pointer-events-none absolute -right-[200px] -top-[220px] h-[640px] w-[640px] rounded-full bg-[radial-gradient(circle,#FBF8F3_0%,rgba(251,248,243,0)_68%)]" />
          <div className="relative mx-auto max-w-[1080px] px-5 pb-[30px] pt-4 lg:pb-10">
            <Link href="/assessment/comprehensive" className="inline-flex min-h-10 items-center gap-1 text-[14.5px] font-bold text-[var(--brand)]">
              <Icon name="back" className="h-[18px] w-[18px]" strokeWidth={2} />
              종합심리검사
            </Link>
            <div className="mt-2.5 grid grid-cols-[1fr_auto] items-center gap-3">
              <div>
                <span className="as-chip">종합심리검사 + 해석 상담 신청</span>
                <h1 className="mb-1.5 mt-3 text-[28px] font-extrabold leading-tight tracking-[-0.04em] text-[var(--tci-dark)] lg:text-[38px]">
                  신청서, <span className="text-[#E0704F]">3분</span>이면 끝나요
                </h1>
                <p className="max-w-[520px] text-[var(--foreground-muted)]">나를 더 깊이 이해하고 싶은 분을 위한 검사예요. 여기서는 꼭 필요한 것만 받고, 자세한 이야기는 결제 뒤 접수면접지로 들을게요.</p>
              </div>
              <Plate kind="stack" className="h-auto w-[86px] lg:w-[130px]" />
            </div>
            <ul aria-label="이 안에 모두 들어 있어요" className="mt-[18px] grid grid-cols-2 gap-2 lg:grid-cols-4 lg:gap-3">
              {INC.map((x) => (
                <li key={x.title} className="rounded-2xl bg-white p-3 text-[13.5px] leading-[1.45] text-[var(--foreground-muted)] shadow-[0_3px_0_rgba(31,58,51,0.06)]">
                  <span className={cx("flex h-[34px] w-[34px] items-center justify-center rounded-[11px]", x.tile)}>
                    <Icon name={x.icon} className="h-[22px] w-[22px]" strokeWidth={2} />
                  </span>
                  <b className="mt-1.5 block text-[15px] leading-[1.35] text-[var(--foreground)]">
                    {x.title}
                    {x.gift && <span className="ml-0.5 inline-block rounded-md bg-[var(--coral)] px-1.5 align-[1px] text-[11.5px] font-extrabold text-white">{x.gift}</span>}
                  </b>
                  {x.sub}
                </li>
              ))}
            </ul>
          </div>
        </header>

        {/* 단계 표시 — 사이트 헤더(h-16) 바로 아래에 붙는다 */}
        <nav aria-label="신청 단계" className="sticky top-16 z-30 border-b border-[var(--border-light)] bg-[rgba(251,248,243,0.94)] backdrop-blur-md">
          <div className="mx-auto max-w-[1080px] px-5 py-2.5">
            <ol className="grid grid-cols-3 gap-2">
              {PROG.map((p, i) => {
                const done = stepDone[i];
                const cur = i === curStep;
                return (
                  <li key={p.label}>
                    <a
                      href={`#ap-s${i + 1}`}
                      aria-current={cur ? "step" : undefined}
                      className={cx(
                        "flex min-h-12 items-center gap-1.5 rounded-[14px] p-1.5 shadow-[0_2px_0_rgba(31,58,51,0.05)] transition-colors min-[421px]:gap-2 min-[421px]:px-2",
                        done ? "bg-[var(--brand-light)] text-[var(--tci)]" : "bg-white text-[var(--foreground-muted)]",
                        cur && "text-[var(--foreground)] shadow-[inset_0_0_0_2px_var(--brand)]"
                      )}
                    >
                      <Plate kind={p.kind} className={cx("h-[22px] w-6 shrink-0 transition-[filter] min-[421px]:w-[30px]", !done && !cur && "opacity-35 grayscale")} />
                      <span className="min-w-0 leading-tight">
                        <small className="hidden text-[11.5px] font-bold text-[var(--foreground-subtle)] min-[421px]:block">
                          {i + 1} / 3{done && <span className="text-[var(--brand-bright)]"> · 완료</span>}
                        </small>
                        <b className="block truncate text-sm font-extrabold">{p.label}</b>
                      </span>
                    </a>
                  </li>
                );
              })}
            </ol>
            <div aria-hidden="true" className="mt-2 h-1.5 overflow-hidden rounded-full bg-[#EAE5DC]">
              <i className="block h-full rounded-full bg-[linear-gradient(90deg,var(--tci)_0%,var(--mmpi-dark)_55%,var(--coral)_100%)] transition-[width] duration-400" style={{ width: `${(doneCount / 3) * 100}%` }} />
            </div>
          </div>
        </nav>

        <div className="mx-auto grid max-w-[1080px] gap-5 px-5 pb-14 pt-[22px] lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
          <div className="min-w-0">
            {/* 진행 순서 (접기) — 넓은 화면에서는 처음부터 펼쳐 둔다 */}
            <details
              ref={(el) => {
                if (el && !el.dataset.init) {
                  el.dataset.init = "1";
                  if (window.matchMedia("(min-width: 1024px)").matches) el.open = true;
                }
              }}
              className="rounded-[22px] bg-white shadow-[var(--shadow-sm)]"
            >
              <summary className="flex min-h-14 cursor-pointer items-center gap-2.5 px-[18px] py-4 text-[16.5px] font-extrabold">
                <span>
                  이렇게 진행돼요 <small className="text-[13.5px] font-semibold text-[var(--foreground-subtle)]">· {FLOW_COMPACT.length}단계</small>
                </span>
                <Icon name="chev" className="as-chev ml-auto h-[22px] w-[22px] text-[var(--foreground-subtle)]" strokeWidth={2} />
              </summary>
              <ProcessStepsCompact />
            </details>

            <form ref={formRef} onSubmit={submit} noValidate>
              {/* 사람이 보지 않는 칸 — 자동 입력 봇 막기 */}
              <input ref={website} name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

              {/* 1 / 3 나에 대해 */}
              <section id="ap-s1" aria-labelledby="ap-s1h" className={STEP}>
                <StepHead kind="tci" n={1} id="ap-s1h" title="나에 대해 알려 주세요" done={stepDone[0]} tone="text-[var(--tci)]" />
                <div className="mt-[22px]" data-bad={bad.has("name") ? "1" : undefined}>
                  <label htmlFor="ap-name" className={LABEL}>
                    이름<Req />
                  </label>
                  <input id="ap-name" value={name} onChange={(e) => (setName(e.target.value), clear("name"))} maxLength={40} autoComplete="name" className={cx("as-input", bad.has("name") && "bad")} />
                  {errText("name", "이름을 적어 주세요.")}
                </div>
                <div className={BLK} data-bad={bad.has("phone") ? "1" : undefined}>
                  <label htmlFor="ap-phone" className={LABEL}>
                    휴대폰 번호<Req />
                  </label>
                  <input
                    id="ap-phone"
                    type="tel"
                    inputMode="numeric"
                    autoComplete="tel"
                    value={phone}
                    placeholder="010-0000-0000"
                    onChange={(e) => {
                      const n = e.target.value.replace(/\D/g, "").slice(0, 11);
                      setPhone(n.length > 7 ? `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}` : n.length > 3 ? `${n.slice(0, 3)}-${n.slice(3)}` : n);
                      clear("phone");
                    }}
                    className={cx("as-input", bad.has("phone") && "bad")}
                  />
                  <p className={SUB}>진행 안내는 카카오톡 알림톡으로 이 번호에 보내 드려요.</p>
                  {errText("phone", "010으로 시작하는 휴대폰 번호 11자리를 적어 주세요.")}
                </div>
                <fieldset className={BLK} data-bad={bad.has("gender") ? "1" : undefined}>
                  <legend className={cx(LABEL, "float-left w-full")}>
                    성별<Req />
                  </legend>
                  <div className="clear-left grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {GENDERS.map((g) => {
                      const on = gender === g.v;
                      return (
                        <button
                          key={g.v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => (setGender(g.v), clear("gender"))}
                          className={cx(
                            "flex min-h-[54px] cursor-pointer items-center justify-center gap-1.5 rounded-[14px] px-2.5 py-2 text-center text-[15.5px] font-bold leading-[1.3] transition",
                            on
                              ? "bg-[var(--tci)] text-white shadow-[0_6px_16px_rgba(47,107,90,0.25)]"
                              : cx("bg-[var(--ivory)] hover:shadow-[inset_0_0_0_1.5px_var(--mmpi)]", bad.has("gender") ? "shadow-[inset_0_0_0_1.5px_#F2B3A4]" : "shadow-[inset_0_0_0_1.5px_var(--border-light)]")
                          )}
                        >
                          {on && <Icon name="check" className="h-[18px] w-[18px]" strokeWidth={3} />}
                          {g.l}
                        </button>
                      );
                    })}
                  </div>
                  <p className={SUB}>검사 결과를 해석할 때 참고해요.</p>
                  {errText("gender", "하나를 골라 주세요. '밝히고 싶지 않음'도 괜찮아요.")}
                </fieldset>
                <div className={BLK} data-bad={bad.has("birth") ? "1" : undefined}>
                  <label htmlFor="ap-birth" className={LABEL}>
                    태어난 해<Req />
                  </label>
                  <select id="ap-birth" value={birth} onChange={(e) => (setBirth(e.target.value), clear("birth"))} className={cx("as-input", bad.has("birth") && "bad")}>
                    <option value="">선택해 주세요</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}년
                      </option>
                    ))}
                    <option value="under">{thisYear - 18}년 이후</option>
                  </select>
                  <label className={cx("mt-2.5 flex min-h-[52px] cursor-pointer items-center gap-3 rounded-[14px] px-3.5 py-2.5 text-[15.5px] font-bold transition-colors", adult ? "bg-[var(--brand-light)] text-[var(--tci-dark)]" : "bg-[var(--ivory)]")}>
                    <input type="checkbox" checked={adult} onChange={(e) => (setAdult(e.target.checked), clear("birth"))} className="as-check" />
                    만 19세 이상이에요
                  </label>
                  {errText("birth", birth === "under" ? "만 19세 이상 성인만 신청할 수 있어요." : "태어난 해를 고르고, 만 19세 이상인지 확인해 주세요.")}
                </div>
              </section>

              {/* 2 / 3 상담 일정 */}
              <section id="ap-s2" aria-labelledby="ap-s2h" className={STEP}>
                <StepHead kind="mmpi" n={2} id="ap-s2h" title="해석 상담 일정을 골라요" done={stepDone[1]} tone="text-[var(--mmpi-ink)]" />
                <p className={HINT}>검사는 모두 집에서 온라인으로 받고, 해석 상담만 방식을 골라요.</p>
                <div className="mt-3.5" data-bad={bad.has("mode") || bad.has("region") ? "1" : undefined}>
                  <span className={LABEL}>
                    해석 상담 방식<Req />
                  </span>
                  <div className="grid gap-2.5 sm:grid-cols-[1.15fr_1fr]">
                    {MODES.map((m) => {
                      const on = method === m.v;
                      const face = m.v === "offline";
                      return (
                        <button
                          key={m.v}
                          type="button"
                          aria-pressed={on}
                          onClick={() => {
                            setMethod(m.v);
                            clear("mode");
                            if (picked && !picked.methods.includes(m.v)) setSlotId("");
                          }}
                          className={cx(
                            "relative block cursor-pointer rounded-[20px] px-4 pb-3.5 pt-4 text-left transition",
                            on
                              ? "bg-[var(--brand-light)] shadow-[inset_0_0_0_2.5px_var(--tci),0_8px_20px_rgba(47,107,90,0.14)]"
                              : bad.has("mode")
                                ? cx(face ? "bg-[linear-gradient(135deg,#FFF3EE_0%,#FFF9F3_100%)]" : "bg-[var(--ivory)]", "shadow-[inset_0_0_0_1.5px_#F2B3A4]")
                                : face
                                  ? "bg-[linear-gradient(135deg,#FFF3EE_0%,#FFF9F3_100%)] shadow-[inset_0_0_0_1.5px_#F8D2C4]"
                                  : "bg-[var(--ivory)] shadow-[inset_0_0_0_1.5px_var(--border-light)]"
                          )}
                        >
                          <span aria-hidden="true" className={cx("absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-full border-2 text-white", on ? "border-[var(--tci)] bg-[var(--tci)]" : "border-[#D3CCC0] bg-white")}>
                            {on && <Icon name="check" className="h-4 w-4" strokeWidth={3.2} />}
                          </span>
                          <span className="flex flex-wrap items-center gap-2 pr-[34px] text-lg font-extrabold">
                            <span className={cx("flex h-[38px] w-[38px] items-center justify-center rounded-xl bg-white", face ? "text-[var(--coral-ink)]" : "text-[var(--tci)]")}>
                              <Icon name={face ? "pin" : "cam"} className="h-[22px] w-[22px]" strokeWidth={2} />
                            </span>
                            {m.title}
                            <span className={cx("rounded-full px-2.5 py-0.5 text-xs font-extrabold", face ? "bg-[var(--coral)] text-white" : "bg-[var(--mmpi-light)] text-[var(--mmpi-ink)]")}>{m.tag}</span>
                          </span>
                          <span className="mt-2.5 block text-[14.5px] leading-[1.55] text-[var(--foreground-muted)]">
                            {m.points.map((p) => (
                              <span key={p} className="relative my-1 block pl-4">
                                <span aria-hidden="true" className={cx("absolute left-0.5 top-[9px] h-1.5 w-1.5 rounded-full", face ? "bg-[var(--coral)]" : "bg-[var(--mmpi-dark)]")} />
                                {p}
                              </span>
                            ))}
                          </span>
                          {m.where && <span className="mt-2 block text-[13px] font-bold text-[var(--coral-ink)]">{m.where}</span>}
                        </button>
                      );
                    })}
                  </div>
                  {errText("mode", "해석 상담 방식을 골라 주세요.")}
                  {method === "offline" && (
                    <div className="mt-3 rounded-[18px] bg-[#FFF6F1] p-3.5">
                      <p className="mb-3 text-[14.5px] text-[var(--foreground-muted)]">원하시는 지역의 조용한 스터디룸을 빌려요. 정확한 장소는 상담 3일 전 알림톡으로 확정해 알려 드리고, 하루 전에 한 번 더 알려 드려요.</p>
                      <div className="grid grid-cols-2 gap-2.5">
                        {([["ap-r1", "1순위 지역", r1, setR1], ["ap-r2", "2순위 지역", r2, setR2]] as const).map(([id, label, val, set]) => (
                          <div key={id}>
                            <label htmlFor={id} className={LABEL}>
                              {label}
                              <Req />
                            </label>
                            <select id={id} value={val} onChange={(e) => (set(e.target.value), clear("region"))} className={cx("as-input", bad.has("region") && "bad")}>
                              <option value="">선택</option>
                              {REGIONS.map((r) => (
                                <option key={r} value={r}>
                                  {r}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      {errText("region", "1순위와 2순위를 서로 다른 지역으로 골라 주세요.")}
                    </div>
                  )}
                </div>

                <div className={BLK} data-bad={bad.has("slot") ? "1" : undefined}>
                  <span className={LABEL}>
                    해석 상담 날짜·시간<Req />
                  </span>
                  <p className={HINT}>
                    김태현 심리상담가가 미리 열어 둔 시간 중 <b>하나</b>를 골라 주세요. 고른 시간으로 바로 확정돼요.
                  </p>
                  {fromText && (
                    <div className="mb-3.5 mt-3 flex items-start gap-2.5 rounded-[14px] bg-[var(--mmpi-light)] px-3 py-2.5 text-sm leading-normal text-[var(--tci-dark)]">
                      <Icon name="hourglass" className="mt-px h-5 w-5 text-[var(--mmpi-ink)]" strokeWidth={2} />
                      <span>
                        검사·보고서 준비 기간이 필요해서 <b>{fromText}</b>부터 고를 수 있어요. (신청일 기준 <b>14일 뒤</b>)
                      </span>
                    </div>
                  )}
                  {!slots ? (
                    <div className="mt-4 space-y-2">
                      <Skeleton className="h-14" />
                      <Skeleton className="h-14" />
                    </div>
                  ) : days.length === 0 ? (
                    <p className="mt-4 rounded-[14px] border border-dashed border-[var(--border)] bg-[var(--ivory)] p-6 text-center text-sm text-[var(--foreground-muted)]">
                      {method ? "이 방식으로 열린 시간이 아직 없어요." : "아직 열린 시간이 없어요."} 곧 새 시간을 열 예정이에요. 카카오톡 채널 「심리상담실 현」으로 문의해 주세요.
                    </p>
                  ) : (
                    <>
                      <div className="mt-3 grid gap-2.5">
                        {visibleDays.map((d, di) => (
                          <div key={d.key} className={cx("grid grid-cols-[58px_1fr] items-start gap-2.5", di > 0 && "border-t border-dashed border-[var(--border)] pt-2.5")}>
                            <div className="pt-2.5 text-[17px] font-extrabold leading-[1.15]">
                              {d.label}
                              <small className={cx("mt-0.5 block text-[12.5px] font-bold", d.weekend ? "text-[var(--coral-ink)]" : "text-[var(--foreground-subtle)]")}>{d.dow}요일</small>
                            </div>
                            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                              {d.slots.map((s) => {
                                const t = slotTime(kstParts(s.startsAt).hhmm);
                                const on = s.id === slotId;
                                return (
                                  <button
                                    key={s.id}
                                    type="button"
                                    disabled={!s.available}
                                    aria-pressed={on}
                                    aria-label={`${d.label} ${kstParts(s.startsAt).timeText}${s.available ? "" : " 마감"}`}
                                    onClick={() => (setSlotId(s.id), clear("slot"))}
                                    className={cx(
                                      "flex min-h-14 flex-col items-center justify-center rounded-[14px] px-1.5 py-1 text-base font-extrabold leading-[1.2] transition",
                                      !s.available
                                        ? "cursor-not-allowed bg-[#F4F1EC] text-[#ADA59A]"
                                        : on
                                          ? "cursor-pointer bg-[var(--tci)] text-white shadow-[0_6px_16px_rgba(47,107,90,0.28)]"
                                          : cx("cursor-pointer bg-white hover:shadow-[inset_0_0_0_1.5px_var(--brand-bright)]", bad.has("slot") ? "shadow-[inset_0_0_0_1.5px_#F2B3A4]" : "shadow-[inset_0_0_0_1.5px_var(--border)]")
                                    )}
                                  >
                                    <span className={cx(!s.available && "line-through")}>{t.big}</span>
                                    <small className={cx("mt-0.5 text-[11.5px] font-semibold", !s.available ? "text-[#ADA59A]" : on ? "text-[#CBEBDD]" : "text-[var(--foreground-subtle)]")}>{s.available ? t.small : "마감"}</small>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                      {days.length > FIRST_DAYS && !showAll && (
                        <button type="button" onClick={() => setShowAll(true)} className="mt-3 flex min-h-[50px] w-full cursor-pointer items-center justify-center gap-1.5 rounded-[14px] bg-[var(--brand-light)] text-[15px] font-extrabold text-[var(--tci)]">
                          <Icon name="plus" className="h-[22px] w-[22px]" strokeWidth={2} />
                          다음 날짜 더 보기
                        </button>
                      )}
                      <div className="mt-2.5 flex flex-wrap gap-3 text-[12.5px] text-[var(--foreground-subtle)]">
                        <span>
                          <i className="mr-1 inline-block h-[13px] w-[13px] rounded align-[-2px] shadow-[inset_0_0_0_1.5px_var(--border)]" />
                          고를 수 있음
                        </span>
                        <span>
                          <i className="mr-1 inline-block h-[13px] w-[13px] rounded bg-[var(--tci)] align-[-2px]" />
                          내가 고른 시간
                        </span>
                        <span>
                          <i className="mr-1 inline-block h-[13px] w-[13px] rounded bg-[#F4F1EC] align-[-2px]" />
                          마감
                        </span>
                      </div>
                    </>
                  )}
                  {errText("slot", "해석 상담 시간을 하나 골라 주세요.")}
                  {picked && (
                    <div aria-live="polite" className="mt-3.5 flex items-start gap-3 rounded-[18px] bg-[linear-gradient(135deg,var(--tci)_0%,#3E8C72_100%)] px-4 py-3.5 text-[15px] leading-[1.55] text-white">
                      <Icon name="calendar" className="mt-px h-[26px] w-[26px] text-[var(--mmpi)]" strokeWidth={2} />
                      <span>
                        고른 시간
                        <br />
                        <b className="text-[17px]">{pickedText}</b>
                        <span className="mt-0.5 block text-[13px] text-[#D5EFE4]">이 일정이면 검사 마감은 {deadlineText(picked.startsAt)} 밤 12시예요.</span>
                      </span>
                    </div>
                  )}
                </div>
              </section>

              {/* 3 / 3 동의·결제 */}
              <section id="ap-s3" aria-labelledby="ap-s3h" className={STEP}>
                <StepHead kind="sct" n={3} id="ap-s3h" title="마지막으로 확인해요" done={stepDone[2]} tone="text-[var(--coral-ink)]" />

                <div className="mt-3.5">
                  <span className={LABEL}>
                    검사를 받고 싶은 이유<span className="ml-1.5 text-[13px] font-semibold text-[var(--foreground-subtle)]">선택</span>
                  </span>
                  <p className={cx(HINT, "mb-3")}>가까운 것을 눌러도 되고, 직접 적어도 돼요. 여러 개 골라도 괜찮아요.</p>
                  <div className="flex flex-wrap gap-2">
                    {REASONS.map((r) => {
                      const on = reasons.includes(r);
                      return (
                        <button
                          key={r}
                          type="button"
                          aria-pressed={on}
                          onClick={() => setReasons((xs) => (on ? xs.filter((x) => x !== r) : [...xs, r]))}
                          className={cx(
                            "inline-flex min-h-[46px] cursor-pointer items-center gap-1.5 rounded-full px-[15px] py-2.5 text-left text-[15px] leading-[1.35] transition",
                            on ? "bg-[var(--mmpi-light)] font-extrabold text-[var(--tci-dark)] shadow-[inset_0_0_0_2px_var(--mmpi-dark)]" : "bg-[var(--ivory)] font-semibold shadow-[inset_0_0_0_1.5px_var(--border-light)]"
                          )}
                        >
                          {on && <Icon name="check" className="h-4 w-4 text-[var(--mmpi-ink)]" strokeWidth={3} />}
                          {r}
                        </button>
                      );
                    })}
                  </div>
                  <label htmlFor="ap-own" className={cx(LABEL, "mt-3.5")}>
                    직접 적기<span className="ml-1.5 text-[13px] font-semibold text-[var(--foreground-subtle)]">선택</span>
                  </label>
                  <input id="ap-own" value={own} onChange={(e) => setOwn(e.target.value)} maxLength={300} placeholder="편하게 적어 주세요" className="as-input" />
                </div>

                <div className={BLK} data-bad={bad.has("agree") ? "1" : undefined}>
                  <span className={LABEL}>
                    동의<Req />
                  </span>
                  <label className={cx("flex min-h-[58px] cursor-pointer items-center gap-3 rounded-2xl px-4 py-3.5 text-[16.5px] font-extrabold transition-colors", allAgreed ? "bg-[var(--tci)] text-white" : "bg-[var(--mmpi-light)]")}>
                    <input
                      type="checkbox"
                      checked={allAgreed}
                      onChange={(e) => (setAgree(Object.fromEntries(CONSENTS.map((c) => [c.key, e.target.checked]))), clear("agree"))}
                      className="as-check on-dark"
                    />
                    아래 내용에 모두 동의해요
                  </label>
                  <ul className="mt-1.5">
                    {CONSENTS.map((c, i) => (
                      <li key={c.key} className={cx("px-0.5 py-3", i < CONSENTS.length - 1 && "border-b border-dashed border-[var(--border)]")}>
                        <div className="flex items-start gap-3">
                          <input
                            id={`ag-${c.key}`}
                            type="checkbox"
                            checked={!!agree[c.key]}
                            onChange={(e) => (setAgree((a) => ({ ...a, [c.key]: e.target.checked })), clear("agree"))}
                            className={cx("as-check", bad.has("agree") && !agree[c.key] && "border-[var(--error)]!")}
                          />
                          <label htmlFor={`ag-${c.key}`} className="flex-1 cursor-pointer text-[15px] leading-normal">
                            <b className="text-[var(--tci)]">[필수 {i + 1}]</b> {c.title}
                          </label>
                        </div>
                        <button
                          type="button"
                          aria-expanded={openDetail === c.key}
                          onClick={() => setOpenDetail((o) => (o === c.key ? null : c.key))}
                          className="ml-9 inline-flex min-h-8 cursor-pointer items-center text-[13.5px] font-bold text-[var(--brand-bright)]"
                        >
                          {openDetail === c.key ? "접기" : "자세히 보기"}
                        </button>
                        {openDetail === c.key && (
                          <dl className="ml-9 mt-0.5 grid gap-1.5">
                            {c.rows.map(([k, v]) => (
                              <div key={k} className="grid grid-cols-[78px_1fr] overflow-hidden rounded-[10px] bg-[var(--ivory)] text-[12.5px] leading-[1.55]">
                                <dt className="px-2.5 py-[7px] font-extrabold text-[var(--foreground)]">{k}</dt>
                                <dd className="px-2.5 py-[7px] text-[var(--foreground-muted)]">{v}</dd>
                              </div>
                            ))}
                          </dl>
                        )}
                      </li>
                    ))}
                  </ul>
                  <p className="mt-1 text-[13.5px] text-[var(--foreground-subtle)]">검사 링크 3개(MMPI-3·TCI-RS·SCT)는 접수면접지를 낸 다음 날 아침 8시에 알림톡으로 한 번에 보내 드려요.</p>
                  {errText("agree", "필수 동의 4가지에 모두 체크해 주세요.")}
                </div>

                {/* 결제 금액 */}
                <div className="mt-[22px] overflow-hidden rounded-[22px] shadow-[inset_0_0_0_1.5px_var(--border-light)]">
                  <div className="flex items-center justify-between gap-2.5 bg-[var(--mint-bg)] px-[18px] py-4">
                    <span className="font-extrabold">결제 금액</span>
                    <b className="whitespace-nowrap text-[28px] font-extrabold tracking-[-0.02em] text-[var(--tci-dark)]">150,000원</b>
                  </div>
                  <ul className="px-[18px] pb-1 pt-3 text-[15px]">
                    {PAY_ROWS.map(([k, v], i) => (
                      <li key={k} className="my-1.5 flex justify-between gap-2">
                        <span>{k}</span>
                        <span className={cx("whitespace-nowrap", i === PAY_ROWS.length - 1 ? "font-extrabold text-[var(--coral-ink)]" : "font-semibold text-[var(--foreground-subtle)]")}>{v}</span>
                      </li>
                    ))}
                  </ul>
                  <div className="mx-[18px] mt-2.5 flex items-start gap-2.5 rounded-[14px] bg-[#FFFBE3] px-3 py-[11px] text-[14.5px] leading-[1.55]">
                    <span className="mt-0.5 shrink-0 rounded-md bg-[#FEE500] px-[7px] py-0.5 text-[11.5px] font-extrabold text-[#3A1D1D]">자동 확정</span>
                    <span>
                      결제가 끝나면 <b>그 자리에서 바로 확정</b>돼요. 상담 일시와 접수면접지 링크가 카카오톡 알림톡으로 곧바로 가요.
                    </span>
                  </div>
                  <div className="mx-[18px] mt-2 flex items-start gap-2.5 rounded-[14px] bg-[var(--sct-light)] px-3 py-[11px] text-[14.5px] leading-[1.55]">
                    <Icon name="coupon" className="mt-0.5 h-5 w-5 text-[var(--coral-ink)]" strokeWidth={2} />
                    <span>
                      결제는 다음 화면에서 해요. 받은 쿠폰이 있으면 <b>[내 쿠폰 선택]</b>을 눌러 바로 적용할 수 있어요. 지금은 쿠폰으로 신청을 마칠 수 있어요.
                    </span>
                  </div>
                  <p className="px-[18px] pb-4 pt-3 text-[14.5px] text-[var(--foreground-muted)]">
                    취소·환불은{" "}
                    <button type="button" onClick={() => setRefundOpen(true)} className="min-h-8 cursor-pointer font-extrabold text-[var(--brand-bright)] underline underline-offset-[3px]">
                      환불 규정 보기
                    </button>
                    를 눌러 확인해 주세요.
                  </p>
                </div>

                {error && (
                  <p role="alert" className="mt-4 rounded-[14px] bg-[var(--error-bg)] px-3.5 py-3 text-[15px] font-bold text-[var(--error)]">
                    {error}
                  </p>
                )}
                <div className="mt-4">
                  <button type="submit" disabled={busy} className="as-btn w-full min-h-[60px]! rounded-[18px]! text-lg!">
                    {busy ? (
                      "신청서를 보내는 중…"
                    ) : (
                      <>
                        다음: 결제하기 · 150,000원 <Icon name="arrow" className="h-5 w-5" strokeWidth={2} />
                      </>
                    )}
                  </button>
                  <p className="mt-3 text-center text-[13px] leading-[1.6] text-[var(--foreground-subtle)]">다음 화면에서 [내 쿠폰 선택]으로 쿠폰을 적용할 수 있어요. 고른 시간은 30분 동안 잡아 둬요.</p>
                </div>
              </section>
            </form>
          </div>

          {/* 넓은 화면: 내 신청 요약 */}
          <aside aria-label="내 신청 요약" className="hidden lg:sticky lg:top-[168px] lg:block">
            <div className="overflow-hidden rounded-3xl bg-white shadow-[var(--shadow-md)]">
              <div className="flex items-center gap-3 bg-[var(--mint-bg)] p-[18px]">
                <Plate kind="stack" className="h-[72px] w-14" />
                <div>
                  <b className="block">내 신청 요약</b>
                  <small className="text-[13px] text-[var(--foreground-muted)]">고를 때마다 바로 채워져요</small>
                </div>
              </div>
              <dl className="grid grid-cols-[72px_1fr] gap-x-2.5 gap-y-2 px-[18px] py-3.5 text-sm">
                <SumRow k="이름" v={name.trim()} empty="아직 안 적었어요" />
                <SumRow k="방식" v={method === "offline" ? `대면${r1 ? ` · ${r1}${r2 ? ` > ${r2}` : ""}` : ""}` : method === "online" ? "화상" : ""} empty="아직 안 골랐어요" />
                <SumRow k="상담" v={pickedText} empty="아직 안 골랐어요" />
                <SumRow k="검사 마감" v={picked ? `${deadlineText(picked.startsAt)} 밤 12시` : ""} empty="시간을 고르면 보여요" />
              </dl>
              <div className="mx-[18px] flex items-baseline justify-between border-t border-dashed border-[var(--border)] pb-4 pt-3">
                <span>결제 금액</span>
                <b className="text-[22px]">150,000원</b>
              </div>
              <div className="px-[18px] pb-[18px]">
                <button type="button" onClick={sideGo} disabled={busy} className="as-btn w-full min-h-[52px]! text-base!">
                  {curStep === -1 ? "다음: 결제하기" : "이어서 작성하기"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="취소·환불 규정">
        <RefundRules />
        <button type="button" onClick={() => setRefundOpen(false)} className="as-btn mt-6 w-full">
          닫기
        </button>
      </Modal>
    </div>
  );
}

// ── 화면 조각 ──
const STEP = "mt-4 scroll-mt-[160px] rounded-[26px] bg-white px-[18px] py-[22px] shadow-[var(--shadow-sm)] sm:p-[30px]";
const BLK = "mt-[22px] border-t border-dashed border-[var(--border)] pt-[22px]";
const LABEL = "mb-2 block text-[15.5px] font-extrabold";
const HINT = "mb-1 mt-0.5 text-[14.5px] text-[var(--foreground-muted)]";
const SUB = "mt-2 text-[13.5px] text-[var(--foreground-subtle)]";

const PROG: { kind: "tci" | "mmpi" | "sct"; label: string }[] = [
  { kind: "tci", label: "나에 대해" },
  { kind: "mmpi", label: "상담 일정" },
  { kind: "sct", label: "동의·결제" },
];

const INC: { icon: IconName; tile: string; title: string; sub: string; gift?: string }[] = [
  { icon: "laptop", tile: "bg-[var(--brand-light)] text-[var(--tci)]", title: "온라인 심리검사 3종", sub: "MMPI-3 · TCI-RS · SCT" },
  { icon: "doc", tile: "bg-[#D5EFE4] text-[var(--mmpi-ink)]", title: "종합 해석 보고서", sub: "세 검사와 접수면접지를 함께 읽고 써요" },
  { icon: "chat", tile: "bg-[var(--brand-light)] text-[var(--tci)]", title: "해석 상담 약 60분", sub: "대면 또는 화상" },
  { icon: "play", tile: "bg-[var(--sct-light)] text-[var(--sct-ink)]", title: "해석 영상", sub: "영상으로도 다시 봐요", gift: "3만 원 상당" },
];

const MODES: { v: "offline" | "online"; title: string; tag: string; points: string[]; where?: string }[] = [
  {
    v: "offline",
    title: "대면 상담",
    tag: "추천",
    points: ["표정·목소리·몸짓 같은 말 밖의 신호까지 함께 읽어서, 해석이 더 풍성해져요", "보고서를 같이 보며 짚어 가니 이야기가 깊어져요"],
    where: "서울 홍대·강남·종로·혜화·사당 중 고른 지역의 조용한 스터디룸",
  },
  { v: "online", title: "화상 상담", tag: "가볍게", points: ["이동 없이 집에서 편하게 받아요", "오가는 시간·교통비 부담이 적어요"] },
];

const PAY_ROWS: [string, string][] = [
  ["온라인 심리검사 3종", "포함"],
  ["종합 해석 보고서", "포함"],
  ["해석 상담 약 60분", "포함"],
  ["해석 영상", "3만 원 상당 포함"],
];

/** "15:30" → 큰 글씨 "3:30" + 작은 글씨 "오후" (18시부터는 "저녁") */
function slotTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return { big: m ? `${h12}:${String(m).padStart(2, "0")}` : `${h12}시`, small: h < 12 ? "오전" : h < 18 ? "오후" : "저녁" };
}

function Req() {
  return <span className="ml-[3px] text-[var(--coral)]">*</span>;
}

function StepHead({ kind, n, id, title, done, tone }: { kind: "tci" | "mmpi" | "sct"; n: number; id: string; title: string; done: boolean; tone: string }) {
  return (
    <div className="mb-1.5 flex items-center gap-3">
      <Plate kind={kind} className="h-11 w-[52px] shrink-0" />
      <div>
        <small className={cx("block text-[13px] font-extrabold tracking-[0.02em]", tone)}>{n} / 3</small>
        <h2 id={id} className="text-[21px] font-extrabold leading-tight tracking-[-0.025em]">
          {title}
        </h2>
      </div>
      {done && (
        <span className="ml-auto inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[var(--brand-light)] py-1 pl-1.5 pr-2.5 text-[13px] font-extrabold text-[var(--brand-bright)]">
          <Icon name="check" className="h-4 w-4" strokeWidth={3} />
          완료
        </span>
      )}
    </div>
  );
}

function SumRow({ k, v, empty }: { k: string; v: string; empty: string }) {
  return (
    <>
      <dt className="font-bold text-[var(--foreground-subtle)]">{k}</dt>
      <dd className={cx("m-0", v ? "font-bold" : "font-semibold text-[#8A938F]")}>{v || empty}</dd>
    </>
  );
}
