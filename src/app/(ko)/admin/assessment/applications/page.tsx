"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { apiFetch, apiRequest } from "@/lib/api";
import { STAGES } from "@/lib/assessment";
import { Badge, EmptyState, Skeleton, cx } from "@/components/ui";
import { ApplicationPanel } from "./ApplicationPanel";
import type { Row } from "./types";
import { MaskedName } from "../../_components/MaskedName";

/**
 * 관리자 · 전문 심리검사 신청·진행 현황 (docs/ADMIN-REDESIGN-PLAN.md ②③)
 * 위: 오늘 할 일 카드 → 누르면 그 목록. 가운데: 필터 칩 + 표. 행을 누르면 오른쪽 상세 패널(?id=, 주소로 공유 가능).
 * 목록에는 접수면접지 내용이 없다 — 상세에서만.
 */

interface Summary {
  safety: number;
  intakeWaiting: number;
  issueWaiting: number;
  testing: number;
  reschedule: number;
  failedNotices: number;
  placeNeeded: number;
}

type FilterKey = "all" | "safety" | "intake" | "issue" | "reschedule" | "place" | "tester" | "closed" | `s${number}`;
const FILTERS = new Set(["all", "safety", "intake", "issue", "reschedule", "place", "tester", "closed", "s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"]);

function query(f: FilterKey, q: string): string {
  const p = new URLSearchParams();
  if (f === "safety" || f === "reschedule") p.set("hold", f);
  else if (f === "intake" || f === "issue" || f === "place") p.set("view", f);
  else if (f === "tester") p.set("tester", "1");
  else if (f === "closed") p.set("closed", "1");
  else if (f.startsWith("s")) p.set("stage", f.slice(1));
  if (q.trim()) p.set("q", q.trim());
  return p.toString();
}

function Inner() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const openId = params.get("id");
  // 디스코드 링크 버튼이 ?f=issue 처럼 바로 그 목록을 연다
  const [filter, setFilter] = useState<FilterKey>(() => (FILTERS.has(params.get("f") ?? "") ? (params.get("f") as FilterKey) : "all"));
  const [q, setQ] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [sum, setSum] = useState<Summary | null>(null);

  const load = useCallback(() => {
    setRows(null);
    apiFetch(`/api/admin/assessment/applications?${query(filter, q)}`)
      .then(setRows)
      .catch(() => setRows([]));
    apiRequest<Summary>("/api/admin/assessment/summary").then((r) => r.ok && r.data && setSum(r.data));
    // 검색어는 개인정보일 수 있어 주소에 남기지 않는다
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter]);
  useEffect(load, [load]);

  const open = (id: string | null) => {
    const p = new URLSearchParams(params.toString());
    if (id) p.set("id", id);
    else p.delete("id");
    router.replace(`${pathname}${p.toString() ? `?${p}` : ""}`, { scroll: false });
  };

  const todo: { key: FilterKey; label: string; n: number | undefined; tone: string; hint: string }[] = [
    { key: "safety", label: "안전 확인", n: sum?.safety, tone: "border-red-200 bg-red-50 text-red-700", hint: "24시간 안 직접 연락" },
    { key: "issue", label: "코드 발급 대기", n: sum?.issueWaiting, tone: "border-[var(--brand-light)] bg-[var(--brand-light)] text-[var(--brand)]", hint: "접수면접지 제출 완료" },
    { key: "intake", label: "접수면접지 미제출", n: sum?.intakeWaiting, tone: "border-[var(--border-light)] bg-white text-[var(--foreground)]", hint: "N2 안내 대상" },
    { key: "s3", label: "검사 진행 중", n: sum?.testing, tone: "border-[var(--border-light)] bg-white text-[var(--foreground)]", hint: "완료 확인" },
    { key: "reschedule", label: "일정 재조정", n: sum?.reschedule, tone: "border-amber-200 bg-amber-50 text-amber-800", hint: "새 일정 필요" },
    { key: "place", label: "장소 입력 필요", n: sum?.placeNeeded, tone: "border-amber-200 bg-amber-50 text-amber-800", hint: "5일 안 대면 상담" },
  ];

  const chips: { key: FilterKey; label: string }[] = [
    { key: "all", label: "전체" },
    ...STAGES.map((s, i) => ({ key: `s${i + 1}` as FilterKey, label: `${i + 1} ${s}` })),
    { key: "tester", label: "테스터" },
    { key: "closed", label: "취소·환불" },
  ];

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <div className={cx("min-w-0 flex-1 px-4 py-8 sm:px-6", openId && "hidden xl:block")}>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
            <h1 className="font-display text-2xl text-[var(--foreground)]">신청·진행 현황</h1>
          </div>
          {!!sum?.failedNotices && <Badge tone="error">최근 7일 알림 실패 {sum.failedNotices}건</Badge>}
        </div>

        {/* 오늘 할 일 */}
        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {todo.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilter(t.key)}
              className={cx("cursor-pointer rounded-2xl border p-4 text-left transition hover:shadow-sm", t.tone, filter === t.key && "ring-2 ring-[var(--brand)]")}
            >
              <p className="text-xs font-semibold opacity-80">{t.label}</p>
              <p className="mt-1 text-2xl font-extrabold">{t.n ?? "–"}</p>
              <p className="mt-0.5 text-[11px] opacity-70">{t.hint}</p>
            </button>
          ))}
        </div>

        {/* 필터 칩 + 검색 */}
        <div className="mt-6 flex flex-wrap items-center gap-2">
          {chips.map((c) => (
            <button
              key={c.key}
              onClick={() => setFilter(c.key)}
              className={cx("h-8 cursor-pointer rounded-full px-3 text-xs font-semibold", filter === c.key ? "bg-[var(--foreground)] text-white" : "bg-[var(--surface)] text-[var(--foreground-muted)] hover:text-[var(--foreground)]")}
            >
              {c.label}
            </button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              load();
            }}
            className="ml-auto flex gap-2"
          >
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·신청번호·전화 뒤 4자리" className="h-9 w-56 rounded-xl border border-[var(--border)] px-3 text-sm focus:border-[var(--brand)] focus:outline-none" />
            <button className="h-9 cursor-pointer rounded-xl bg-[var(--foreground)] px-3 text-sm font-semibold text-white">검색</button>
          </form>
        </div>

        {/* 표 */}
        <div className="mt-4">
          {!rows ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : rows.length === 0 ? (
            <EmptyState title="해당하는 신청이 없어요" description="필터를 바꾸거나 검색어를 지워 보세요." />
          ) : (
            <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)] bg-white">
              <table className="w-full min-w-[760px] text-sm">
                <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                  <tr>
                    <th className="px-4 py-3 font-semibold">신청</th>
                    <th className="px-4 py-3 font-semibold">해석 상담</th>
                    <th className="px-4 py-3 font-semibold">단계</th>
                    <th className="px-4 py-3 font-semibold">접수면접지</th>
                    <th className="px-4 py-3 font-semibold">검사 MMPI · TCI · SCT</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr
                      key={r.id}
                      onClick={() => open(r.id)}
                      className={cx("cursor-pointer border-t border-[var(--border-light)] hover:bg-[var(--surface)]", openId === r.id && "bg-[var(--brand-light)]")}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-[var(--foreground)]">
                          <MaskedName name={r.name} />
                          {r.isTester && <span className="ml-1.5 rounded bg-[var(--surface-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--foreground-muted)]">테스터</span>}
                        </p>
                        <p className="text-xs text-[var(--foreground-subtle)]">{r.applicationNo}</p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[var(--foreground)]">{r.sessionText || "—"}</p>
                        <p className="text-xs text-[var(--foreground-subtle)]">{r.methodText}</p>
                      </td>
                      <td className="px-4 py-3">
                        {r.closed ? (
                          <Badge tone="neutral">{r.closed === "refunded" ? "환불" : "취소"}</Badge>
                        ) : r.hold === "safety" ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">● 안전 확인</span>
                        ) : (
                          <span className="text-[var(--foreground)]">
                            {r.stage}/8 {r.stageLabel}
                            {r.hold === "reschedule" && <span className="ml-1 text-xs font-semibold text-[var(--warning)]">· 재조정</span>}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">{r.intakeSubmitted ? <span className="text-[var(--brand)]">제출 ✓</span> : <span className="text-[var(--foreground-subtle)]">미제출</span>}</td>
                      <td className="px-4 py-3">
                        <span className="flex gap-1.5">
                          {["mmpi3", "tci", "sct"].map((k) => {
                            const t = r.tests[k];
                            return (
                              <span
                                key={k}
                                title={t?.done ? "완료" : t?.collected ? "링크 모임" : "링크 없음"}
                                className={cx("h-2.5 w-6 rounded-full", t?.done ? "bg-[var(--brand)]" : t?.collected ? "bg-[var(--brand-light)] ring-1 ring-[var(--brand)]" : "bg-[var(--surface-muted)]")}
                              />
                            );
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {openId && <ApplicationPanel key={openId} id={openId} onClose={() => open(null)} onChanged={load} />}
    </div>
  );
}

export default function AssessmentApplicationsPage() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
