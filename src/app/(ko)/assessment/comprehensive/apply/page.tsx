"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { deadlineText, kstParts, type SlotView } from "@/lib/assessment";
import { Modal, Skeleton, cx } from "@/components/ui";
import { RefundRules } from "@/components/assessment/RefundRules";

/**
 * 종합심리검사 신청 (11-신청페이지-v2 기준)
 * 기본 정보 → 상담 방식 → 공개 슬롯 1개 → 검사 이유 → 필수 동의 4가지 → 주문 생성 → /checkout/:orderId (쿠폰)
 * 금액·마감은 서버가 다시 계산한다. 슬롯은 [신청하기]를 누를 때 30분 잡아 둔다.
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

  const box = (f: Field) => cx("card p-6", bad.has(f) && "border-[var(--error)] ring-2 ring-red-100");
  const errText = (f: Field, text: string) => (bad.has(f) ? <p className="mt-2 text-sm font-medium text-[var(--error)]">{text}</p> : null);
  const visibleDays = showAll ? days : days.slice(0, FIRST_DAYS);

  return (
    <div className="px-4 py-10 sm:px-6 sm:py-14">
      <form onSubmit={submit} noValidate className="mx-auto max-w-2xl space-y-5">
        <div>
          <p className="text-sm text-[var(--foreground-subtle)]">
            <Link href="/assessment/comprehensive" className="hover:text-[var(--foreground)]">
              종합심리검사
            </Link>{" "}
            › 신청
          </p>
          <h1 className="font-display mt-2 text-3xl text-[var(--foreground)]">종합심리검사 + 해석 상담 신청</h1>
          <p className="mt-2 text-[var(--foreground-muted)]">꼭 필요한 것만 받고, 자세한 이야기는 결제 뒤 접수면접지로 들을게요. 3분이면 끝나요.</p>
        </div>

        {/* 사람이 보지 않는 칸 — 자동 입력 봇 막기 */}
        <input ref={website} name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

        {/* 1. 기본 정보 */}
        <section className="card space-y-5 p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">1. 기본 정보</h2>
          <div data-bad={bad.has("name") ? "1" : undefined}>
            <label htmlFor="ap-name" className="mb-1.5 block text-sm font-medium">이름 <span className="text-[var(--error)]">*</span></label>
            <input id="ap-name" value={name} onChange={(e) => (setName(e.target.value), clear("name"))} maxLength={40} className="h-12 w-full rounded-xl border border-[var(--border)] px-4 focus:border-[var(--brand)] focus:outline-none" />
            {errText("name", "이름을 적어 주세요.")}
          </div>
          <div data-bad={bad.has("phone") ? "1" : undefined}>
            <label htmlFor="ap-phone" className="mb-1.5 block text-sm font-medium">휴대폰 번호 <span className="text-[var(--error)]">*</span></label>
            <input
              id="ap-phone"
              inputMode="numeric"
              value={phone}
              placeholder="010-0000-0000"
              onChange={(e) => {
                const n = e.target.value.replace(/\D/g, "").slice(0, 11);
                setPhone(n.length > 7 ? `${n.slice(0, 3)}-${n.slice(3, 7)}-${n.slice(7)}` : n.length > 3 ? `${n.slice(0, 3)}-${n.slice(3)}` : n);
                clear("phone");
              }}
              className="h-12 w-full rounded-xl border border-[var(--border)] px-4 focus:border-[var(--brand)] focus:outline-none"
            />
            <p className="mt-1.5 text-xs text-[var(--foreground-subtle)]">진행 안내는 카카오톡 알림톡으로 이 번호에 보내 드려요.</p>
            {errText("phone", "010으로 시작하는 휴대폰 번호 11자리를 적어 주세요.")}
          </div>
          <fieldset data-bad={bad.has("gender") ? "1" : undefined}>
            <legend className="mb-1.5 text-sm font-medium">성별 <span className="text-[var(--error)]">*</span></legend>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {GENDERS.map((g) => (
                <button
                  key={g.v}
                  type="button"
                  aria-pressed={gender === g.v}
                  onClick={() => (setGender(g.v), clear("gender"))}
                  className={cx("h-11 cursor-pointer rounded-xl text-sm font-semibold", gender === g.v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
                >
                  {g.l}
                </button>
              ))}
            </div>
            <p className="mt-1.5 text-xs text-[var(--foreground-subtle)]">검사 결과를 해석할 때 참고해요.</p>
            {errText("gender", "하나를 골라 주세요. '밝히고 싶지 않음'도 괜찮아요.")}
          </fieldset>
          <div data-bad={bad.has("birth") ? "1" : undefined}>
            <label htmlFor="ap-birth" className="mb-1.5 block text-sm font-medium">태어난 해 <span className="text-[var(--error)]">*</span></label>
            <div className="flex flex-wrap items-center gap-3">
              <select id="ap-birth" value={birth} onChange={(e) => (setBirth(e.target.value), clear("birth"))} className="h-12 rounded-xl border border-[var(--border)] px-3">
                <option value="">선택해 주세요</option>
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}년
                  </option>
                ))}
                <option value="under">{thisYear - 18}년 이후</option>
              </select>
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={adult} onChange={(e) => (setAdult(e.target.checked), clear("birth"))} className="h-4 w-4 accent-[var(--brand)]" />
                만 19세 이상이에요
              </label>
            </div>
            {errText("birth", birth === "under" ? "만 19세 이상 성인만 신청할 수 있어요." : "태어난 해를 고르고, 만 19세 이상인지 확인해 주세요.")}
          </div>
        </section>

        {/* 2. 해석 상담 방식 */}
        <section className={box("mode")} data-bad={bad.has("mode") || bad.has("region") ? "1" : undefined}>
          <h2 className="text-lg font-bold text-[var(--foreground)]">2. 해석 상담 방식</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">검사는 모두 집에서 온라인으로 받고, 해석 상담만 방식을 골라요.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {([
              ["offline", "대면 상담", "추천", ["표정·목소리·몸짓 같은 말 밖의 신호까지 함께 읽어서, 해석이 더 풍성해져요", "결과지를 같이 보며 짚어 가니 이야기가 깊어져요", "서울 홍대·강남·종로·혜화·사당 중 고른 지역의 조용한 스터디룸"]],
              ["online", "화상 상담", "가볍게", ["이동 없이 집에서 편하게 받아요", "오가는 시간·교통비 부담이 적어요"]],
            ] as const).map(([v, title, tag, points]) => (
              <button
                key={v}
                type="button"
                aria-pressed={method === v}
                onClick={() => {
                  setMethod(v);
                  clear("mode");
                  if (picked && !picked.methods.includes(v)) setSlotId("");
                }}
                className={cx(
                  "cursor-pointer rounded-2xl border-2 p-5 text-left transition",
                  method === v ? "border-[var(--brand)] bg-[var(--brand-light)]" : "border-[var(--border-light)] bg-white hover:border-[var(--border)]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span className="text-base font-bold text-[var(--foreground)]">{title}</span>
                  <span className={cx("rounded-full px-2 py-0.5 text-xs font-bold", v === "offline" ? "bg-[var(--brand)] text-white" : "bg-[var(--surface-muted)] text-[var(--foreground-muted)]")}>{tag}</span>
                </span>
                <ul className="mt-3 space-y-1.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
                  {points.map((p) => (
                    <li key={p}>· {p}</li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          {errText("mode", "해석 상담 방식을 골라 주세요.")}
          {method === "offline" && (
            <div className="mt-5 rounded-2xl bg-[var(--surface)] p-4">
              <p className="text-sm text-[var(--foreground-muted)]">원하시는 지역의 조용한 스터디룸을 빌려요. 정확한 장소는 상담 3일 전 알림톡으로 알려 드려요.</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {([["1순위 지역", r1, setR1], ["2순위 지역", r2, setR2]] as const).map(([label, val, set]) => (
                  <label key={label} className="text-sm font-medium">
                    {label} <span className="text-[var(--error)]">*</span>
                    <select value={val} onChange={(e) => (set(e.target.value), clear("region"))} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] bg-white px-3">
                      <option value="">선택</option>
                      {REGIONS.map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                  </label>
                ))}
              </div>
              {errText("region", "1순위와 2순위를 서로 다른 지역으로 골라 주세요.")}
            </div>
          )}
        </section>

        {/* 3. 해석 상담 날짜·시간 */}
        <section className={box("slot")} data-bad={bad.has("slot") ? "1" : undefined}>
          <h2 className="text-lg font-bold text-[var(--foreground)]">3. 해석 상담 날짜·시간</h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            김태현 심리상담가가 미리 열어 둔 시간 중 <b>하나</b>를 골라 주세요. 고른 시간으로 바로 확정돼요.
          </p>
          {fromText && (
            <p className="mt-3 rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">
              검사·보고서 준비 기간이 필요해서 <b>{fromText}</b>부터 고를 수 있어요. (신청일 기준 14일 뒤)
            </p>
          )}
          {!slots ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-14" />
              <Skeleton className="h-14" />
            </div>
          ) : days.length === 0 ? (
            <p className="mt-4 rounded-xl border border-dashed border-[var(--border)] p-6 text-center text-sm text-[var(--foreground-muted)]">
              {method ? "이 방식으로 열린 시간이 아직 없어요." : "아직 열린 시간이 없어요."} 곧 새 시간을 열 예정이에요. 카카오톡 채널 「심리상담실 현」으로 문의해 주세요.
            </p>
          ) : (
            <div className="mt-4 space-y-2">
              {visibleDays.map((d) => (
                <div key={d.key} className="flex items-start gap-3 rounded-xl border border-[var(--border-light)] p-3">
                  <div className={cx("w-14 shrink-0 pt-1.5 text-center", d.weekend && "text-[var(--brand)]")}>
                    <p className="text-base font-bold">{d.label}</p>
                    <p className="text-xs text-[var(--foreground-subtle)]">{d.dow}요일</p>
                  </div>
                  <div className="flex flex-1 flex-wrap gap-2">
                    {d.slots.map((s) => {
                      const p = kstParts(s.startsAt);
                      const on = s.id === slotId;
                      return (
                        <button
                          key={s.id}
                          type="button"
                          disabled={!s.available}
                          aria-pressed={on}
                          onClick={() => (setSlotId(s.id), clear("slot"))}
                          className={cx(
                            "h-12 min-w-[5.5rem] rounded-xl px-3 text-sm font-semibold transition",
                            !s.available
                              ? "cursor-not-allowed bg-[var(--surface)] text-[var(--foreground-subtle)] line-through"
                              : on
                                ? "cursor-pointer bg-[var(--brand)] text-white"
                                : "cursor-pointer border border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--brand)]"
                          )}
                        >
                          {s.available ? p.timeText : "마감"}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {days.length > FIRST_DAYS && !showAll && (
                <button type="button" onClick={() => setShowAll(true)} className="w-full cursor-pointer rounded-xl py-3 text-sm font-semibold text-[var(--brand)] hover:bg-[var(--surface)]">
                  다음 날짜 더 보기
                </button>
              )}
            </div>
          )}
          {picked && (
            <p className="mt-4 rounded-xl bg-[var(--brand-light)] px-4 py-3 text-sm text-[var(--foreground)]">
              고른 시간: <b>{kstParts(picked.startsAt).dayText} {kstParts(picked.startsAt).timeText}</b>
              <br />
              <span className="text-xs text-[var(--foreground-muted)]">이 일정이면 검사 마감은 {deadlineText(picked.startsAt)} 밤 12시예요.</span>
            </p>
          )}
          {errText("slot", "해석 상담 시간을 하나 골라 주세요.")}
        </section>

        {/* 4. 검사 이유 */}
        <section className="card p-6">
          <h2 className="text-lg font-bold text-[var(--foreground)]">
            4. 검사를 받고 싶은 이유 <span className="text-sm font-normal text-[var(--foreground-subtle)]">선택</span>
          </h2>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">가까운 것을 눌러도 되고, 직접 적어도 돼요. 여러 개 골라도 괜찮아요.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {REASONS.map((r) => {
              const on = reasons.includes(r);
              return (
                <button
                  key={r}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setReasons((xs) => (on ? xs.filter((x) => x !== r) : [...xs, r]))}
                  className={cx("cursor-pointer rounded-full px-4 py-2 text-sm", on ? "bg-[var(--brand)] font-semibold text-white" : "bg-[var(--surface)] text-[var(--foreground)]")}
                >
                  {r}
                </button>
              );
            })}
          </div>
          <input value={own} onChange={(e) => setOwn(e.target.value)} maxLength={300} placeholder="직접 적기 (선택)" className="mt-3 h-12 w-full rounded-xl border border-[var(--border)] px-4 focus:border-[var(--brand)] focus:outline-none" />
        </section>

        {/* 5. 동의 */}
        <section className={box("agree")} data-bad={bad.has("agree") ? "1" : undefined}>
          <h2 className="text-lg font-bold text-[var(--foreground)]">5. 동의</h2>
          <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-xl bg-[var(--surface)] px-4 py-3.5 font-semibold">
            <input
              type="checkbox"
              checked={allAgreed}
              onChange={(e) => (setAgree(Object.fromEntries(CONSENTS.map((c) => [c.key, e.target.checked]))), clear("agree"))}
              className="h-5 w-5 accent-[var(--brand)]"
            />
            아래 내용에 모두 동의해요
          </label>
          <ul className="mt-3 space-y-2">
            {CONSENTS.map((c, i) => (
              <li key={c.key} className="rounded-xl border border-[var(--border-light)] px-4 py-3">
                <div className="flex items-start gap-3">
                  <input
                    id={`ag-${c.key}`}
                    type="checkbox"
                    checked={!!agree[c.key]}
                    onChange={(e) => (setAgree((a) => ({ ...a, [c.key]: e.target.checked })), clear("agree"))}
                    className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand)]"
                  />
                  <label htmlFor={`ag-${c.key}`} className="flex-1 cursor-pointer text-sm leading-relaxed">
                    <span className="font-semibold text-[var(--brand)]">[필수 {i + 1}]</span> {c.title}
                  </label>
                  <button type="button" onClick={() => setOpenDetail((o) => (o === c.key ? null : c.key))} className="shrink-0 cursor-pointer text-xs text-[var(--foreground-subtle)] underline underline-offset-2">
                    {openDetail === c.key ? "접기" : "자세히 보기"}
                  </button>
                </div>
                {openDetail === c.key && (
                  <dl className="mt-3 space-y-2 rounded-lg bg-[var(--surface)] p-3 text-xs leading-relaxed">
                    {c.rows.map(([k, v]) => (
                      <div key={k}>
                        <dt className="font-semibold text-[var(--foreground)]">{k}</dt>
                        <dd className="text-[var(--foreground-muted)]">{v}</dd>
                      </div>
                    ))}
                  </dl>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-[var(--foreground-subtle)]">검사 링크 3개(MMPI-3·TCI-RS·SCT)는 접수면접지를 낸 다음 날 아침 8시에 알림톡으로 한 번에 보내 드려요.</p>
          {errText("agree", "필수 동의 4가지에 모두 체크해 주세요.")}
        </section>

        {/* 결제 금액 */}
        <section className="card p-6">
          <div className="flex items-baseline justify-between">
            <h2 className="text-lg font-bold text-[var(--foreground)]">결제 금액</h2>
            <p className="text-2xl font-extrabold text-[var(--foreground)]">150,000원</p>
          </div>
          <ul className="mt-3 space-y-1 text-sm text-[var(--foreground-muted)]">
            <li className="flex justify-between"><span>온라인 심리검사 3종</span><span>포함</span></li>
            <li className="flex justify-between"><span>종합 해석 보고서</span><span>포함</span></li>
            <li className="flex justify-between"><span>해석 상담 약 60분</span><span>포함</span></li>
            <li className="flex justify-between"><span>해석 영상</span><span>3만 원 상당 포함</span></li>
          </ul>
          <p className="mt-4 rounded-xl bg-[var(--brand-light)] px-4 py-3 text-sm text-[var(--foreground)]">
            <b>자동 확정</b> — 결제가 끝나면 그 자리에서 바로 확정돼요. 상담 일시와 접수면접지 링크가 알림톡으로 곧바로 가요.
          </p>
          <p className="mt-3 text-sm text-[var(--foreground-muted)]">
            취소·환불은{" "}
            <button type="button" onClick={() => setRefundOpen(true)} className="cursor-pointer font-semibold text-[var(--brand)] underline underline-offset-2">
              환불 규정 보기
            </button>
            를 눌러 확인해 주세요.
          </p>
        </section>

        {error && (
          <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-[var(--error)]">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={busy}
          className="flex h-14 w-full cursor-pointer items-center justify-center rounded-xl bg-[var(--brand)] text-lg font-bold text-white hover:bg-[var(--brand-hover)] disabled:opacity-60"
        >
          {busy ? "신청서를 보내는 중…" : "다음: 결제하기"}
        </button>
        <p className="text-center text-xs text-[var(--foreground-subtle)]">다음 화면에서 쿠폰을 적용할 수 있어요. 고른 시간은 30분 동안 잡아 둬요.</p>
      </form>

      <Modal open={refundOpen} onClose={() => setRefundOpen(false)} title="취소·환불 규정">
        <RefundRules />
        <button onClick={() => setRefundOpen(false)} className="mt-6 h-12 w-full cursor-pointer rounded-xl bg-[var(--surface)] font-semibold">
          닫기
        </button>
      </Modal>
    </div>
  );
}
