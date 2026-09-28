"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch, apiRequest } from "@/lib/api";
import { Badge, Button, Input, Skeleton, Textarea, Toast } from "@/components/ui";

interface Row {
  _id: string;
  user: { name: string; email: string } | null;
  source: "payment" | "manual";
  status: "active" | "revoked";
  active: boolean;
  startedAt: string;
  expiresAt: string | null;
  completedAt: string | null;
  progressPct: number;
  completedCourses: number;
  totalCourses: number;
  lastActivityAt: string | null;
}

interface InviteResult {
  email: string;
  ok: boolean;
  name?: string;
  message?: string;
}

const SOURCE: Record<Row["source"], string> = { payment: "결제", manual: "관리자 초대" };

// 관리자 — 과정 수강생·진도 + 이메일 여러 개 한 번에 초대
export default function ProgramEnrollmentsPage() {
  const { id } = useParams<{ id: string }>();
  const [title, setTitle] = useState("");
  const [rows, setRows] = useState<Row[] | null>(null);
  const [emails, setEmails] = useState("");
  const [days, setDays] = useState("");
  const [inviting, setInviting] = useState(false);
  const [results, setResults] = useState<InviteResult[] | null>(null);
  const [err, setErr] = useState("");
  const [toast, setToast] = useState<string | null>(null);

  const load = useCallback(() => {
    apiFetch(`/api/admin/programs/${id}/enrollments`).then(setRows).catch(() => setRows([]));
  }, [id]);
  useEffect(() => {
    load();
    apiFetch(`/api/admin/programs/${id}`).then((p) => setTitle(p.title)).catch(() => {});
  }, [id, load]);

  const count = emails.split(/[\s,;]+/).filter((s) => s.includes("@")).length;

  const invite = async () => {
    setErr("");
    setResults(null);
    setInviting(true);
    const r = await apiRequest<{ invited: number; results: InviteResult[] }>(`/api/admin/programs/${id}/enrollments`, {
      method: "POST",
      body: JSON.stringify({ emails, ...(days.trim() ? { accessDays: Number(days) } : {}) }),
    });
    setInviting(false);
    if (!r.ok || !r.data) return setErr(r.message || "초대하지 못했어요.");
    setResults(r.data.results);
    // 실패한 이메일만 남겨 두어 고쳐서 다시 보낼 수 있게
    setEmails(r.data.results.filter((x) => !x.ok).map((x) => x.email).join("\n"));
    setToast(`${r.data.invited}명을 초대했어요.`);
    load();
  };

  const patch = async (row: Row, body: Record<string, unknown>, msg: string) => {
    const r = await apiRequest(`/api/admin/programs/${id}/enrollments/${row._id}`, { method: "PATCH", body: JSON.stringify(body) });
    setToast(r.ok ? msg : r.message || "변경하지 못했어요.");
    load();
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin/lms/programs" className="text-sm text-[var(--foreground-subtle)]">← 과정 목록</Link>
      <h1 className="font-display mt-1 text-2xl">{title ? `${title} · 수강생` : "수강생"}</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">
        초대하면 과정에 든 과목이 모두 한 번에 열려요. 나중에 과목을 더 넣어도 이미 초대한 분에게 자동으로 열려요.
      </p>

      <div className="card mt-6 space-y-3 p-5">
        <Textarea
          id="emails"
          label="초대할 회원 이메일 (여러 명: 쉼표나 줄바꿈으로 구분)"
          className="min-h-[110px]"
          value={emails}
          onChange={(e) => setEmails(e.target.value)}
          placeholder={"a@example.com\nb@example.com"}
          error={err || undefined}
        />
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="sm:w-56">
            <Input id="days" label="이용 기간 (일, 선택)" inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/[^\d]/g, ""))} placeholder="비우면 과정 기본값" />
          </div>
          <Button onClick={invite} loading={inviting} disabled={!count}>
            {count ? `${count}명 초대하기` : "초대하기"}
          </Button>
        </div>
        <p className="text-xs text-[var(--foreground-subtle)]">사이트에 가입한 회원만 초대할 수 있어요. 가입 전이면 먼저 가입을 부탁해 주세요.</p>
        {results && (
          <ul className="space-y-1 rounded-xl bg-[var(--surface)] p-3 text-sm">
            {results.map((r) => (
              <li key={r.email} className="flex flex-wrap items-center gap-2">
                <Badge tone={r.ok ? "brand" : "error"}>{r.ok ? "초대됨" : "실패"}</Badge>
                <span className="font-medium">{r.email}</span>
                {r.name && <span className="text-[var(--foreground-muted)]">{r.name}</span>}
                {r.message && <span className="text-[var(--foreground-muted)]">— {r.message}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="mt-6">
        {rows === null ? (
          <Skeleton className="h-48" />
        ) : rows.length === 0 ? (
          <p className="card p-8 text-center text-sm text-[var(--foreground-muted)]">아직 수강생이 없어요.</p>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3">회원</th>
                  <th className="px-4 py-3">수강권</th>
                  <th className="px-4 py-3">과정 진도</th>
                  <th className="px-4 py-3">최근 활동</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r._id} className="border-t border-[var(--border-light)]">
                    <td className="px-4 py-3">
                      <p className="font-semibold">{r.user?.name ?? "(탈퇴)"}</p>
                      <p className="text-xs text-[var(--foreground-subtle)]">{r.user?.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={r.status === "revoked" ? "error" : r.active ? "brand" : "neutral"}>
                        {r.status === "revoked" ? "회수됨" : r.active ? "수강 중" : "기간 만료"}
                      </Badge>
                      <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                        {SOURCE[r.source]}
                        {r.expiresAt && ` · ~${new Date(r.expiresAt).toLocaleDateString("ko-KR")}`}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      {r.completedAt ? "과정 수료" : `${r.progressPct}% · ${r.completedCourses}/${r.totalCourses}과목 수료`}
                      <div className="mt-1 h-1.5 w-28 rounded-full bg-[var(--surface-muted)]">
                        <div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${r.progressPct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)]">{r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleString("ko-KR") : "—"}</td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "active" ? (
                        <Button
                          size="sm"
                          variant="danger"
                          onClick={() =>
                            confirm("과정 수강권을 회수할까요? 이 과정으로만 받은 과목이 닫혀요. 따로 산 과목과 진도 기록은 그대로예요.") &&
                            patch(r, { status: "revoked" }, "과정 수강권을 회수했어요.")
                          }
                        >
                          회수
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => patch(r, { status: "active" }, "과정 수강권을 다시 열었어요.")}>
                          다시 열기
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
