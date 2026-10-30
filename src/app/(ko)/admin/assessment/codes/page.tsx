"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { EmptyState, Skeleton } from "@/components/ui";
import { MaskedName } from "../../_components/MaskedName";

/**
 * 관리자 · 코드 발급·수집 — 밤 9시 '검사 업무 5분'에 쓰는 화면 (예약 작업과 같은 목록)
 *   발급 대상: 접수면접지를 냈고(안전 확인 아님) 아직 발급 안 한 검사
 *   진행 중: 검사 링크를 받았고 아직 다 끝나지 않은 사람
 *   메일 직접 연결: 지메일에서 받았는데 이름이 한 사람과 맞지 않은 검사 메일
 */
interface Work {
  issue: { id: string; applicationNo: string; name: string; gender: string; birthYear: number; tests: string[] }[];
  testing: { id: string; applicationNo: string; name: string; testDeadline: string | null; tests: Record<string, { done: boolean }> }[];
}
interface Mail {
  id: string;
  source: string;
  test: string;
  kind: "issue" | "done";
  examineeName: string;
  receivedAt: string;
}
interface AppRow {
  id: string;
  applicationNo: string;
  name: string;
}

const LABEL: Record<string, string> = { mmpi3: "MMPI-2", tci: "TCI", sct: "SCT" };
const GENDER: Record<string, string> = { female: "여", male: "남", other: "기타", undisclosed: "—" };

export default function CodesPage() {
  const [work, setWork] = useState<Work | null>(null);
  const [mails, setMails] = useState<Mail[] | null>(null);
  const [apps, setApps] = useState<AppRow[]>([]);
  const [pick, setPick] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    apiFetch("/api/admin/assessment/worklist").then(setWork).catch(() => setWork({ issue: [], testing: [] }));
    apiFetch("/api/admin/assessment/link-mails").then(setMails).catch(() => setMails([]));
    apiFetch("/api/admin/assessment/applications").then((a: AppRow[]) => setApps(a)).catch(() => setApps([]));
  }, []);
  useEffect(load, [load]);

  const assign = async (m: Mail) => {
    const applicationId = pick[m.id];
    if (!applicationId) return;
    const r = await apiRequest(`/api/admin/assessment/link-mails/${m.id}/assign`, { method: "POST", body: JSON.stringify({ applicationId }) });
    setMsg(r.ok ? "연결했어요." : r.message || "연결하지 못했어요.");
    load();
  };

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">전문 심리검사</p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">코드 발급·수집</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        밤 9시 디스코드 알림이 오면 마음사랑·인싸이트에 로그인한 뒤 Claude에게 &lsquo;진행&rsquo;이라고 말해 주세요. 발급과 완료 확인은 Claude가 하고, 결과가 여기에 쌓여요.
      </p>
      {msg && <p className="mt-3 text-sm text-[var(--brand)]">{msg}</p>}

      <section className="mt-6">
        <h2 className="mb-3 font-bold">발급 대상 {work ? `${work.issue.length}명` : ""}</h2>
        {!work ? (
          <Skeleton className="h-24" />
        ) : work.issue.length === 0 ? (
          <EmptyState title="오늘 발급할 사람이 없어요" />
        ) : (
          <ul className="divide-y divide-[var(--border-light)] rounded-2xl border border-[var(--border-light)] bg-white">
            {work.issue.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="flex items-center gap-3">
                  <MaskedName name={a.name} className="font-semibold" />
                  <span className="text-[var(--foreground-subtle)]">
                    {GENDER[a.gender] ?? ""} · {a.birthYear}년 · {a.applicationNo}
                  </span>
                </span>
                <span className="flex items-center gap-2">
                  {a.tests.map((t) => (
                    <span key={t} className="rounded-full bg-[var(--brand-light)] px-2 py-0.5 text-xs font-bold text-[var(--brand)]">
                      {LABEL[t]}
                    </span>
                  ))}
                  <Link href={`/admin/assessment/applications?id=${a.id}`} className="ml-2 font-semibold text-[var(--brand)]">
                    상세
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-[var(--foreground-subtle)]">발급할 때 수검자 연락처는 상담가 지메일·전화번호로 넣어요. 발급 메일이 오면 링크가 자동으로 모이고, 다음 날 아침 8시에 고객에게 가요.</p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-bold">검사 진행 중 {work ? `${work.testing.length}명` : ""}</h2>
        {work && work.testing.length === 0 ? (
          <EmptyState title="진행 중인 검사가 없어요" />
        ) : (
          <ul className="divide-y divide-[var(--border-light)] rounded-2xl border border-[var(--border-light)] bg-white">
            {work?.testing.map((a) => (
              <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                <span className="flex items-center gap-3">
                  <MaskedName name={a.name} className="font-semibold" />
                  <span className="text-[var(--foreground-subtle)]">마감 {a.testDeadline}</span>
                </span>
                <span className="flex items-center gap-2">
                  {["mmpi3", "tci", "sct"].map((t) => (
                    <span key={t} className={`rounded-full px-2 py-0.5 text-xs font-bold ${a.tests[t]?.done ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground-subtle)]"}`}>
                      {LABEL[t]} {a.tests[t]?.done ? "✓" : ""}
                    </span>
                  ))}
                  <Link href={`/admin/assessment/applications?id=${a.id}`} className="ml-2 font-semibold text-[var(--brand)]">
                    완료 체크
                  </Link>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-10">
        <h2 className="mb-3 font-bold">메일 직접 연결 {mails ? `${mails.length}통` : ""}</h2>
        {!mails ? (
          <Skeleton className="h-20" />
        ) : mails.length === 0 ? (
          <EmptyState title="연결할 메일이 없어요" description="이름이 한 사람과 맞으면 자동으로 붙어요." />
        ) : (
          <ul className="space-y-2">
            {mails.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center gap-2 rounded-xl border border-[var(--border-light)] bg-white px-4 py-3 text-sm">
                <span className="font-semibold">{m.examineeName}</span>
                <span className="text-[var(--foreground-subtle)]">
                  {m.source === "inpsyt" ? "인싸이트" : "마음사랑"} · {LABEL[m.test]} · {m.kind === "done" ? "완료 메일" : "발급 메일"}
                </span>
                <select value={pick[m.id] ?? ""} onChange={(e) => setPick((p) => ({ ...p, [m.id]: e.target.value }))} aria-label="연결할 신청" className="ml-auto h-9 rounded-lg border border-[var(--border)] px-2">
                  <option value="">연결할 신청 고르기</option>
                  {apps.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} · {a.applicationNo}
                    </option>
                  ))}
                </select>
                <button onClick={() => assign(m)} disabled={!pick[m.id]} className="h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-3 text-sm font-semibold text-white disabled:opacity-40">
                  연결
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
