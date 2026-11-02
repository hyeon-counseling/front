"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Alert, Button, Skeleton, Textarea, cx } from "@/components/ui";
import { METHOD_LABEL, REGIONS, type CounselingMethod, type CounselingSlot } from "@/lib/counseling";

// 상담 세부 신청서 — 방식, 대면 지역, 희망 시간 1~3개(검사와 같은 일정표의 빈 시간), 다루고 싶은 이야기, 안전 확인
const CRISIS_LINES = [
  ["자살예방상담전화", "109"],
  ["정신건강위기상담전화", "1577-0199"],
  ["지금 위험하다면 (경찰)", "112"],
  ["지금 위험하다면 (응급)", "119"],
];

export default function CounselingIntakePage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [method, setMethod] = useState<CounselingMethod | null>(null);
  const [regions, setRegions] = useState<string[]>([]);
  const [slots, setSlots] = useState<CounselingSlot[] | null>(null);
  const [picked, setPicked] = useState<string[]>([]);
  const [topic, setTopic] = useState("");
  const [safety, setSafety] = useState<boolean | null>(null);
  const [agree, setAgree] = useState(false);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState<{ crisis: boolean } | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace(`/login?next=${encodeURIComponent(`/my/counseling/${id}/intake`)}`);
  }, [loading, user, id, router]);

  useEffect(() => {
    if (!method) return;
    setSlots(null);
    setPicked([]);
    apiRequest<CounselingSlot[]>(`/api/counseling/slots?method=${method}`).then((r) => setSlots(r.ok && r.data ? r.data : []));
  }, [method]);

  if (loading || !user) return null;

  const toggleSlot = (slotId: string) => setPicked((p) => (p.includes(slotId) ? p.filter((x) => x !== slotId) : p.length >= 3 ? p : [...p, slotId]));
  const toggleRegion = (r: string) => setRegions((p) => (p.includes(r) ? p.filter((x) => x !== r) : p.length >= 2 ? p : [...p, r]));
  const visibleSlots = (slots ?? []).filter((s) => method !== "offline" || !regions.length || s.regions.some((r) => regions.includes(r)));
  const ready = !!method && (method === "online" || regions.length > 0) && picked.length > 0 && safety !== null && agree;

  const submit = async () => {
    setSaving(true);
    setError("");
    const r = await apiRequest<{ crisis: boolean }>(`/api/counseling/passes/${id}/intake`, {
      method: "POST",
      body: JSON.stringify({ method, regions, preferredSlotIds: picked, topic, safety, agreeSensitive: agree }),
    });
    setSaving(false);
    if (r.ok && r.data) setDone(r.data);
    else setError(r.message || "제출하지 못했어요. 잠시 후 다시 시도해 주세요.");
  };

  if (done) {
    return (
      <div className="mx-auto max-w-lg px-4 py-14 sm:px-6">
        <h1 className="font-display text-2xl text-[var(--foreground)]">세부 신청서를 받았어요</h1>
        <p className="mt-3 text-[var(--foreground-muted)]">일정을 확정해 알려 드릴게요. 심리상담 현황에서도 볼 수 있어요.</p>
        {done.crisis && <CrisisBox />}
        <Link href="/my/counseling" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white hover:bg-[var(--brand-hover)]">
          심리상담 현황 보기
        </Link>
      </div>
    );
  }

  const optionClass = (on: boolean) =>
    cx("cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors", on ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border)] bg-white text-[var(--foreground)] hover:border-[var(--brand)]");

  return (
    <div className="mx-auto max-w-lg px-4 py-10 sm:px-6 sm:py-14">
      <Link href="/my/counseling" className="text-sm text-[var(--foreground-muted)] hover:text-[var(--foreground)]">← 심리상담 현황</Link>
      <h1 className="font-display mt-3 text-3xl text-[var(--foreground)]">상담 세부 신청서</h1>
      <p className="mt-2 text-[var(--foreground-muted)]">첫 만남 전에 미리 들을게요. 5분이면 돼요.</p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="mb-2 font-bold text-[var(--foreground)]">상담 방식</h2>
          <div className="flex gap-2">
            {(["online", "offline"] as const).map((m) => (
              <button key={m} type="button" onClick={() => setMethod(m)} className={optionClass(method === m)}>
                {METHOD_LABEL[m]}
              </button>
            ))}
          </div>
        </section>

        {method === "offline" && (
          <section>
            <h2 className="mb-2 font-bold text-[var(--foreground)]">희망 지역 (2곳까지)</h2>
            <div className="flex flex-wrap gap-2">
              {REGIONS.map((r) => (
                <button key={r} type="button" onClick={() => toggleRegion(r)} className={optionClass(regions.includes(r))}>
                  {r}
                </button>
              ))}
            </div>
          </section>
        )}

        {method && (
          <section>
            <h2 className="font-bold text-[var(--foreground)]">희망 시간 (3개까지)</h2>
            <p className="mb-2 text-sm text-[var(--foreground-muted)]">고른 시간 중에서 확정해 알려 드려요. 확정 전에는 시간이 마감될 수 있어요.</p>
            {slots === null ? (
              <Skeleton className="h-32" />
            ) : visibleSlots.length === 0 ? (
              <p className="rounded-xl bg-[var(--surface)] px-4 py-3 text-sm text-[var(--foreground-muted)]">지금 고를 수 있는 시간이 없어요. 카카오톡 채널 「심리상담실 현」으로 알려 주세요.</p>
            ) : (
              <div className="grid max-h-72 gap-2 overflow-y-auto sm:grid-cols-2">
                {visibleSlots.map((s) => (
                  <button key={s.id} type="button" onClick={() => toggleSlot(s.id)} className={optionClass(picked.includes(s.id))}>
                    {s.text}
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

        <section>
          <Textarea id="topic" label="상담에서 다루고 싶은 이야기 (선택)" value={topic} onChange={(e) => setTopic(e.target.value)} rows={4} maxLength={2000} placeholder="요즘 마음에 걸리는 일을 편하게 적어 주세요." />
        </section>

        <section>
          <h2 className="mb-2 font-bold text-[var(--foreground)]">최근 2주 동안, 스스로를 해치고 싶거나 죽고 싶다는 생각을 한 적이 있나요?</h2>
          <div className="flex gap-2">
            <button type="button" onClick={() => setSafety(false)} className={optionClass(safety === false)}>
              아니요
            </button>
            <button type="button" onClick={() => setSafety(true)} className={optionClass(safety === true)}>
              예
            </button>
          </div>
          {safety === true && <CrisisBox />}
        </section>

        <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-relaxed text-[var(--foreground-muted)]">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-1" />
          <span>
            <b className="text-[var(--foreground)]">민감정보 수집·이용에 동의해요.</b> 위 답변은 상담 준비와 안전 확인에만 쓰고, 김태현 심리상담가만 봐요. 상담 기록과 함께 10년 보관한 뒤 파기해요.
          </span>
        </label>

        {error && <Alert>{error}</Alert>}
        <Button size="lg" className="w-full" loading={saving} disabled={!ready} onClick={submit}>
          제출하기
        </Button>
      </div>
    </div>
  );
}

function CrisisBox() {
  return (
    <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 p-5">
      <p className="font-bold text-[var(--foreground)]">말해 주셔서 고마워요</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--foreground-muted)]">혼자 견디지 않으셔도 돼요. 지금 바로 이야기할 곳이 필요하면 아래로 연락해 주세요.</p>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {CRISIS_LINES.map(([l, n]) => (
          <li key={n}>
            <a href={`tel:${n.replace(/-/g, "")}`} className="flex items-center justify-between rounded-xl bg-white px-4 py-3">
              <span className="text-[var(--foreground-muted)]">{l}</span>
              <b className="text-[var(--foreground)]">{n}</b>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
