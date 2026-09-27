"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { scoreText, type TestResult } from "@/lib/psychTest";
import { Badge, Button, Input, Modal, Skeleton } from "@/components/ui";

// 관리자 — 심리검사 결과 열람 (민감정보: 상담 연계·서비스 개선 목적에 한해 열람)

interface Row {
  _id: string;
  userId: { _id: string; name: string; email: string } | null;
  testSlug: string;
  testTitle: string;
  score: number;
  maxScore: number;
  bandKey: string;
  bandLabel: string;
  scaleScores?: { label: string; score: number; max: number }[];
  crisis: boolean;
  age: number | null;
  gender: "male" | "female" | "other" | null;
  createdAt: string;
}
interface Stats {
  total: number;
  crisis: number;
  byTest: Record<string, number>;
  byBand: Record<string, number>;
  byGender: Record<string, number>;
  byAge: Record<string, number>;
}
interface TestMeta { slug: string; title: string }
type Detail = TestResult & { user: { name: string; email: string } | null; age: number | null; gender: string | null; answers: { question: string; answer: string }[] };

const GENDER: Record<string, string> = { male: "남", female: "여", other: "기타" };

function Bars({ title, data }: { title: string; data: Record<string, number> }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...entries.map((e) => e[1]));
  return (
    <div className="card p-5">
      <p className="text-sm font-bold">{title}</p>
      {entries.length === 0 ? (
        <p className="mt-3 text-xs text-[var(--foreground-subtle)]">데이터 없음</p>
      ) : (
        <ul className="mt-3 space-y-1.5">
          {entries.slice(0, 8).map(([k, v]) => (
            <li key={k} className="text-xs">
              <div className="flex justify-between"><span className="truncate pr-2">{k}</span><span className="font-semibold">{v}</span></div>
              <div className="mt-0.5 h-1.5 rounded-full bg-[var(--surface-muted)]"><div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${(v / max) * 100}%` }} /></div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ResultsInner() {
  const params = useSearchParams();
  const [tests, setTests] = useState<TestMeta[]>([]);
  const [f, setF] = useState({ test: params.get("test") ?? "", crisis: false, from: "", to: "", q: "" });
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ total: number; rows: Row[]; pageSize: number } | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [detail, setDetail] = useState<Detail | null>(null);
  const [downloading, setDownloading] = useState(false);

  const query = useCallback(() => {
    const p = new URLSearchParams();
    if (f.test) p.set("test", f.test);
    if (f.crisis) p.set("crisis", "1");
    if (f.from) p.set("from", f.from);
    if (f.to) p.set("to", f.to);
    if (f.q.trim()) p.set("q", f.q.trim());
    return p;
  }, [f]);

  useEffect(() => {
    apiFetch("/api/admin/tests").then((l: TestMeta[]) => setTests(l)).catch(() => null);
  }, []);

  useEffect(() => {
    const p = query();
    apiFetch(`/api/admin/test-results/stats?${p}`).then(setStats).catch(() => setStats(null));
    p.set("page", String(page));
    apiFetch(`/api/admin/test-results?${p}`).then(setData).catch(() => setData({ total: 0, rows: [], pageSize: 50 }));
  }, [query, page]);

  const setFilter = (patch: Partial<typeof f>) => {
    setPage(1);
    setF((prev) => ({ ...prev, ...patch }));
  };

  const download = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/test-results/export?${query()}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token") ?? ""}` },
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `심리검사결과_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("내려받지 못했어요.");
    } finally {
      setDownloading(false);
    }
  };

  const pages = data ? Math.max(1, Math.ceil(data.total / data.pageSize)) : 1;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-[var(--foreground)]">심리검사 결과</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">민감정보예요. 상담 연계·서비스 개선 목적에서만 열람하고, 내려받은 파일은 안전하게 보관해 주세요.</p>
        </div>
        <Button variant="secondary" onClick={download} loading={downloading}>CSV 내려받기 (엑셀)</Button>
      </div>

      {/* 필터 */}
      <div className="card mt-6 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-[1fr_140px_140px_1fr_auto]">
        <select value={f.test} onChange={(e) => setFilter({ test: e.target.value })} className="h-11 rounded-xl border border-[var(--border)] bg-white px-3 text-sm">
          <option value="">전체 검사</option>
          {tests.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
        </select>
        <input type="date" value={f.from} onChange={(e) => setFilter({ from: e.target.value })} className="h-11 rounded-xl border border-[var(--border)] px-3 text-sm" aria-label="시작일" />
        <input type="date" value={f.to} onChange={(e) => setFilter({ to: e.target.value })} className="h-11 rounded-xl border border-[var(--border)] px-3 text-sm" aria-label="종료일" />
        <Input id="q" placeholder="이름 또는 이메일" value={f.q} onChange={(e) => setFilter({ q: e.target.value })} />
        <label className="flex cursor-pointer items-center gap-2 whitespace-nowrap text-sm font-semibold text-red-700">
          <input type="checkbox" checked={f.crisis} onChange={(e) => setFilter({ crisis: e.target.checked })} className="accent-red-600" />
          위기 응답만
        </label>
      </div>

      {/* 통계 */}
      {stats && (
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          <div className="card p-5">
            <p className="text-sm text-[var(--foreground-muted)]">응시 수</p>
            <p className="mt-1 text-3xl font-extrabold">{stats.total}</p>
            <p className="mt-2 text-sm font-semibold text-red-600">위기 문항 응답 {stats.crisis}건</p>
          </div>
          <Bars title="결과 분포" data={stats.byBand} />
          <Bars title="성별" data={stats.byGender} />
          <Bars title="연령대" data={stats.byAge} />
        </div>
      )}

      {/* 목록 */}
      <div className="mt-6">
        {data === null ? (
          <Skeleton className="h-48" />
        ) : data.rows.length === 0 ? (
          <p className="card p-8 text-center text-sm text-[var(--foreground-muted)]">결과가 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[820px] text-sm">
              <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3">검사일시</th>
                  <th className="px-4 py-3">회원</th>
                  <th className="px-4 py-3">나이·성별</th>
                  <th className="px-4 py-3">검사</th>
                  <th className="px-4 py-3">점수</th>
                  <th className="px-4 py-3">결과</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr key={r._id} onClick={() => apiFetch(`/api/admin/test-results/${r._id}`).then(setDetail)} className="cursor-pointer border-t border-[var(--border-light)] hover:bg-[var(--surface)]">
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)]">{new Date(r.createdAt).toLocaleString("ko-KR")}</td>
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.userId?.name ?? "(탈퇴)"}</p>
                      <p className="text-xs text-[var(--foreground-subtle)]">{r.userId?.email}</p>
                    </td>
                    <td className="px-4 py-3 text-xs">{r.age ?? "-"}세 · {GENDER[r.gender ?? ""] ?? "-"}</td>
                    <td className="px-4 py-3">{r.testTitle}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.scaleScores?.length ? r.scaleScores.map((s) => `${s.label} ${s.score}/${s.max}`).join(" · ") : scoreText(r.score, r.maxScore)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        <Badge tone="neutral">{r.bandLabel}</Badge>
                        {r.crisis && <Badge tone="error">위기 문항</Badge>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {data && pages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3 text-sm">
            <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>이전</Button>
            <span>{page} / {pages}</span>
            <Button size="sm" variant="secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>다음</Button>
          </div>
        )}
      </div>

      <Modal open={!!detail} onClose={() => setDetail(null)} title="검사 결과 상세" wide>
        {detail && (
          <div className="space-y-5 text-sm">
            <div className="grid gap-2 sm:grid-cols-2">
              <p><span className="text-[var(--foreground-subtle)]">회원</span> · {detail.user?.name ?? "(탈퇴)"} ({detail.user?.email})</p>
              <p><span className="text-[var(--foreground-subtle)]">나이·성별</span> · {detail.age ?? "-"}세 · {GENDER[detail.gender ?? ""] ?? "-"}</p>
              <p><span className="text-[var(--foreground-subtle)]">검사</span> · {detail.test.title}</p>
              <p><span className="text-[var(--foreground-subtle)]">일시</span> · {new Date(detail.createdAt).toLocaleString("ko-KR")}</p>
            </div>
            <div className="rounded-xl bg-[var(--surface)] p-4">
              <p className="font-bold">
                {detail.scales.length ? detail.scales.map((s) => `${s.label} ${s.score}/${s.max}(${s.levelLabel})`).join(" · ") : scoreText(detail.score, detail.maxScore)} — {detail.band.label}
              </p>
              {detail.crisis && <p className="mt-1 font-semibold text-red-600">⚠ 자살 사고 관련 문항에 응답했어요. 상담 연계가 필요한지 살펴봐 주세요.</p>}
            </div>
            <ol className="space-y-2">
              {detail.answers.map((a, i) => (
                <li key={i} className="flex gap-3 border-b border-[var(--border-light)] pb-2">
                  <span className="w-6 shrink-0 text-[var(--foreground-subtle)]">{i + 1}</span>
                  <span className="flex-1">{a.question}</span>
                  <span className="shrink-0 font-semibold">{a.answer}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default function AdminTestResultsPage() {
  return (
    <Suspense fallback={null}>
      <ResultsInner />
    </Suspense>
  );
}
