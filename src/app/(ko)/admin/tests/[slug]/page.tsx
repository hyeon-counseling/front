"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, apiRequest } from "@/lib/api";
import type { Recommendation } from "@/lib/psychTest";
import { Button, Input, Skeleton, Textarea, Toast } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 관리자 — 심리검사 편집
//   [기본 정보] 제목·소개·오리엔테이션·공개 여부
//   [결과 해설] 결과 구간별 이름·요약·분석·해법 (점수 범위·문항은 고칠 수 없음 — 과거 결과와 어긋나지 않게)
//   [추천]     결과 구간별로 보여줄 상품·강의·상담 링크
// ─────────────────────────────────────────────────────────────────

interface Band { key: string; min: number; max: number; label: string; subtitle: string; analysis: string; solution: string; alert: boolean }
interface Level { label: string; analysis: string; tip: string }
interface Scale { key: string; label: string; levels: { low: Level; mid: Level; high: Level } }
interface TestDoc {
  slug: string;
  title: string;
  engTitle: string;
  emoji: string;
  summary: string;
  intro: string;
  orientation: string;
  instruction: string;
  credit: string;
  estMinutes: number;
  status: "draft" | "published";
  scoring: { type: string };
  questions: { text: string }[];
  answerLabels: string[];
  bands: Band[];
  scales: Scale[];
  crisisItems?: { index: number; minValue: number }[];
  recommendations: Recommendation[];
}

const clone = <T,>(v: T): T => JSON.parse(JSON.stringify(v));
const emptyRec = (): Recommendation => ({ bandKeys: [], title: "", desc: "", url: "", tag: "", emoji: "📘", cta: "자세히 보기" });

export default function AdminTestEditor() {
  const { slug } = useParams<{ slug: string }>();
  const [doc, setDoc] = useState<TestDoc | null>(null);
  const [tab, setTab] = useState<"meta" | "bands" | "recs">("recs");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`/api/admin/tests/${slug}`).then(setDoc).catch((e) => setError(e.message));
  }, [slug]);

  const update = (fn: (d: TestDoc) => void) => {
    setDoc((prev) => {
      if (!prev) return prev;
      const next = clone(prev);
      fn(next);
      return next;
    });
    setDirty(true);
  };

  const save = async () => {
    if (!doc) return;
    setSaving(true);
    setError("");
    const { title, engTitle, emoji, summary, intro, orientation, instruction, credit, estMinutes, status, bands, scales, recommendations } = doc;
    const res = await apiRequest(`/api/admin/tests/${slug}`, {
      method: "PUT",
      body: JSON.stringify({ title, engTitle, emoji, summary, intro, orientation, instruction, credit, estMinutes, status, bands, scales, recommendations }),
    });
    setSaving(false);
    if (res.ok) {
      setDirty(false);
      setToast("저장했어요.");
    } else setError(res.message);
  };

  if (!doc) return <div className="p-10">{error ? <p className="text-sm text-red-600">{error}</p> : <Skeleton className="h-96" />}</div>;

  const CRISIS = { key: "crisis", label: "⚠ 위기 문항 응답" };
  // 위기 문항이 있는 검사는 '위기 문항에 응답한 경우'도 추천 조건으로 고를 수 있다 (점수와 무관)
  const choices = [...doc.bands.map((b) => ({ key: b.key, label: b.label })), ...((doc.crisisItems?.length ?? 0) > 0 ? [CRISIS] : [])];
  const bandLabel = (k: string) => choices.find((b) => b.key === k)?.label ?? k;

  return (
    <div className="px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/tests" className="text-sm text-[var(--foreground-subtle)]">← 심리검사 목록</Link>
          <h1 className="font-display mt-1 text-2xl">{doc.emoji} {doc.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {dirty && <span className="text-xs font-semibold text-amber-600">저장하지 않은 변경</span>}
          <Link href={`/tests/${doc.slug}`} target="_blank" className="inline-flex h-10 items-center rounded-xl bg-[var(--surface)] px-4 text-sm font-semibold">미리보기</Link>
          <Button onClick={save} loading={saving}>저장</Button>
        </div>
      </div>
      {error && <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

      <div className="mb-6 flex gap-2">
        {([["recs", "결과별 추천"], ["bands", "결과 해설"], ["meta", "기본 정보·안내"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold ${tab === k ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]"}`}>
            {label}
          </button>
        ))}
      </div>

      {tab === "recs" && (
        <div className="max-w-3xl space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">
            결과 화면 아래에 보여줄 추천이에요. 맨 위 추천이 &lsquo;맞춤 추천&rsquo;으로 강조돼요. 결과 구간을 하나도 고르지 않으면 모든 결과에 보여요.
            주소는 <code>https://…</code>(외부) 또는 <code>/courses/…</code>(사이트 안)로 적어 주세요.
          </p>
          {doc.recommendations.map((r, i) => (
            <div key={i} className="card space-y-3 p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-[var(--foreground-subtle)]">추천 {i + 1}{i === 0 && " · 맞춤 추천 강조"}</span>
                <div className="flex gap-1">
                  <Button size="sm" variant="ghost" onClick={() => update((d) => { if (i > 0) [d.recommendations[i - 1], d.recommendations[i]] = [d.recommendations[i], d.recommendations[i - 1]]; })}>↑</Button>
                  <Button size="sm" variant="ghost" onClick={() => update((d) => { if (i < d.recommendations.length - 1) [d.recommendations[i + 1], d.recommendations[i]] = [d.recommendations[i], d.recommendations[i + 1]]; })}>↓</Button>
                  <Button size="sm" variant="danger" onClick={() => update((d) => { d.recommendations.splice(i, 1); })}>삭제</Button>
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-[80px_1fr]">
                <Input id={`e${i}`} label="이모지" value={r.emoji ?? ""} onChange={(e) => update((d) => { d.recommendations[i].emoji = e.target.value; })} />
                <Input id={`t${i}`} label="제목" value={r.title} onChange={(e) => update((d) => { d.recommendations[i].title = e.target.value; })} />
              </div>
              <Input id={`d${i}`} label="설명" value={r.desc} onChange={(e) => update((d) => { d.recommendations[i].desc = e.target.value; })} />
              <Input id={`u${i}`} label="링크 주소" value={r.url} placeholder="https://… 또는 /courses/anxiety-cbt-60" onChange={(e) => update((d) => { d.recommendations[i].url = e.target.value.trim(); })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input id={`g${i}`} label="작은 라벨 (선택)" value={r.tag ?? ""} placeholder="예: 무료 · 4주 과정" onChange={(e) => update((d) => { d.recommendations[i].tag = e.target.value; })} />
                <Input id={`c${i}`} label="버튼 문구" value={r.cta ?? ""} onChange={(e) => update((d) => { d.recommendations[i].cta = e.target.value; })} />
              </div>
              <div>
                <p className="mb-1.5 text-sm font-medium">보여줄 결과</p>
                <div className="flex flex-wrap gap-2">
                  {choices.map((b) => {
                    const on = r.bandKeys.includes(b.key);
                    return (
                      <button
                        key={b.key}
                        type="button"
                        onClick={() => update((d) => {
                          const keys = d.recommendations[i].bandKeys;
                          d.recommendations[i].bandKeys = on ? keys.filter((k) => k !== b.key) : [...keys, b.key];
                        })}
                        className={`h-8 cursor-pointer rounded-full px-3 text-xs font-semibold ${on ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)]"}`}
                      >
                        {b.label}
                      </button>
                    );
                  })}
                  <span className="self-center text-xs text-[var(--foreground-subtle)]">
                    {r.bandKeys.length === 0 ? "→ 모든 결과에 표시" : `→ ${r.bandKeys.map(bandLabel).join(", ")}일 때만`}
                  </span>
                </div>
              </div>
            </div>
          ))}
          <Button variant="secondary" onClick={() => update((d) => { d.recommendations.push(emptyRec()); })} disabled={doc.recommendations.length >= 10}>
            + 추천 추가
          </Button>
        </div>
      )}

      {tab === "bands" && (
        <div className="max-w-3xl space-y-4">
          <p className="text-sm text-[var(--foreground-muted)]">점수 범위는 바꿀 수 없고, 보이는 문구만 고칠 수 있어요. 마크다운(**굵게**, - 목록)을 쓸 수 있어요.</p>
          {doc.bands.map((b, i) => (
            <div key={b.key} className="card space-y-3 p-5">
              <p className="text-xs font-semibold text-[var(--foreground-subtle)]">
                {doc.scoring.type === "dual" ? `유형: ${b.key}` : `점수 ${b.min} ~ ${b.max}`}
              </p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Input id={`bl${i}`} label="결과 이름" value={b.label} onChange={(e) => update((d) => { d.bands[i].label = e.target.value; })} />
                <Input id={`bs${i}`} label="한 줄 요약" value={b.subtitle} onChange={(e) => update((d) => { d.bands[i].subtitle = e.target.value; })} />
              </div>
              <Textarea id={`ba${i}`} label="결과 분석" value={b.analysis} onChange={(e) => update((d) => { d.bands[i].analysis = e.target.value; })} />
              {doc.scoring.type !== "dual" && (
                <Textarea id={`bo${i}`} label="이렇게 해 보세요 (해법)" value={b.solution} onChange={(e) => update((d) => { d.bands[i].solution = e.target.value; })} />
              )}
              <label className="flex cursor-pointer items-center gap-2 text-sm">
                <input type="checkbox" checked={b.alert} onChange={(e) => update((d) => { d.bands[i].alert = e.target.checked; })} className="accent-[var(--brand)]" />
                이 결과에서 &lsquo;전문 도움 권유&rsquo; 안내(109·1577-0199)를 함께 보여주기
              </label>
            </div>
          ))}
          {doc.scales.map((s, si) => (
            <div key={s.key} className="card space-y-3 p-5">
              <p className="font-bold">{s.label} 성향 — 수준별 해설</p>
              {(["low", "mid", "high"] as const).map((lv) => (
                <div key={lv} className="rounded-xl bg-[var(--surface)] p-3">
                  <p className="mb-2 text-xs font-semibold text-[var(--foreground-subtle)]">{s.levels[lv].label}</p>
                  <Textarea id={`${s.key}${lv}a`} label="분석" value={s.levels[lv].analysis} onChange={(e) => update((d) => { d.scales[si].levels[lv].analysis = e.target.value; })} />
                  <Textarea id={`${s.key}${lv}t`} label="제안" value={s.levels[lv].tip} onChange={(e) => update((d) => { d.scales[si].levels[lv].tip = e.target.value; })} />
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {tab === "meta" && (
        <div className="grid max-w-5xl gap-6 lg:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">공개 상태</label>
              <div className="flex gap-2">
                {([["published", "공개"], ["draft", "비공개"]] as const).map(([v, label]) => (
                  <button key={v} onClick={() => update((d) => { d.status = v; })} className={`h-10 flex-1 cursor-pointer rounded-xl text-sm font-semibold ${doc.status === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]"}`}>
                    {label}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-[80px_1fr] gap-3">
              <Input id="emoji" label="이모지" value={doc.emoji} onChange={(e) => update((d) => { d.emoji = e.target.value; })} />
              <Input id="title" label="제목" value={doc.title} onChange={(e) => update((d) => { d.title = e.target.value; })} />
            </div>
            <Input id="eng" label="영문 이름" value={doc.engTitle} onChange={(e) => update((d) => { d.engTitle = e.target.value; })} />
            <Input id="summary" label="카드 한 줄 설명" value={doc.summary} onChange={(e) => update((d) => { d.summary = e.target.value; })} />
            <Input id="instruction" label="문항 위 안내문" value={doc.instruction} onChange={(e) => update((d) => { d.instruction = e.target.value; })} />
            <div className="grid grid-cols-2 gap-3">
              <Input id="min" label="예상 시간(분)" inputMode="numeric" value={doc.estMinutes} onChange={(e) => update((d) => { d.estMinutes = Number(e.target.value) || 1; })} />
              <Input id="credit" label="출처 표기" value={doc.credit} onChange={(e) => update((d) => { d.credit = e.target.value; })} />
            </div>
            <Textarea id="intro" label="소개 (마크다운)" className="min-h-[160px]" value={doc.intro} onChange={(e) => update((d) => { d.intro = e.target.value; })} />
            <Textarea id="orientation" label="이 검사만의 오리엔테이션 (공통 안내 뒤에 표시)" className="min-h-[120px]" value={doc.orientation} onChange={(e) => update((d) => { d.orientation = e.target.value; })} />
          </div>
          <div className="card p-6">
            <p className="mb-3 text-xs font-semibold text-[var(--foreground-subtle)]">문항 ({doc.questions.length}개) — 과거 결과 보호를 위해 수정할 수 없어요</p>
            <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[var(--foreground-muted)]">
              {doc.questions.map((q, i) => <li key={i}>{q.text}</li>)}
            </ol>
            <p className="mt-4 text-xs text-[var(--foreground-subtle)]">보기: {doc.answerLabels.join(" / ")}</p>
          </div>
        </div>
      )}

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
