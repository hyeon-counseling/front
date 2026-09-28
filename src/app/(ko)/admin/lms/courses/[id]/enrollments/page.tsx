"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/api";
import { Badge, Button, Input, Skeleton, Toast } from "@/components/ui";

interface Row {
  _id: string;
  user: { _id: string; name: string; email: string } | null;
  source: "payment" | "manual" | "free" | "program";
  status: "active" | "revoked";
  active: boolean;
  startedAt: string;
  expiresAt: string | null;
  progressPct: number;
  completedAt: string | null;
  lastLessonKey: string | null;
  lastActivityAt: string | null;
}

const SOURCE: Record<Row["source"], string> = { payment: "결제", manual: "관리자 부여", free: "무료", program: "과정으로 받음" };

// 관리자 — 강의 수강생·진도·수강권 부여/회수
export default function CourseEnrollmentsPage() {
  const { id } = useParams<{ id: string }>();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [email, setEmail] = useState("");
  const [granting, setGranting] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [err, setErr] = useState("");

  const load = useCallback(() => {
    apiFetch(`/api/admin/courses/${id}/enrollments`).then(setRows).catch(() => setRows([]));
  }, [id]);
  useEffect(load, [load]);

  const grant = async () => {
    setErr("");
    setGranting(true);
    try {
      const r = await apiFetch(`/api/admin/courses/${id}/enrollments`, { method: "POST", body: JSON.stringify({ email }) });
      setToast(`${r.user.name}님에게 수강권을 부여했어요.`);
      setEmail("");
      load();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "부여하지 못했어요.");
    } finally {
      setGranting(false);
    }
  };

  const patch = async (row: Row, body: Record<string, unknown>, msg: string) => {
    try {
      await apiFetch(`/api/admin/courses/${id}/enrollments/${row._id}`, { method: "PATCH", body: JSON.stringify(body) });
      setToast(msg);
      load();
    } catch (e) {
      setToast(e instanceof Error ? e.message : "변경하지 못했어요.");
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <Link href="/admin/lms/courses" className="text-sm text-[var(--foreground-subtle)]">← 강의 목록</Link>
      <h1 className="font-display mt-1 text-2xl">수강생</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">결제하면 자동으로 수강권이 생겨요. 초대·보상 등은 여기서 직접 부여할 수 있어요.</p>

      <div className="card mt-6 flex flex-col gap-3 p-5 sm:flex-row sm:items-end">
        <div className="flex-1">
          <Input id="grant-email" label="수강권 부여 (가입한 회원 이메일)" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" error={err || undefined} />
        </div>
        <Button onClick={grant} loading={granting} disabled={!email.trim()}>부여하기</Button>
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
                  <th className="px-4 py-3">진도</th>
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
                      {r.completedAt ? "수료" : `${r.progressPct}%`}
                      <div className="mt-1 h-1.5 w-24 rounded-full bg-[var(--surface-muted)]">
                        <div className="h-1.5 rounded-full bg-[var(--brand)]" style={{ width: `${r.progressPct}%` }} />
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)]">
                      {r.lastActivityAt ? new Date(r.lastActivityAt).toLocaleString("ko-KR") : "—"}
                      {r.lastLessonKey && <span className="block text-[var(--foreground-subtle)]">{r.lastLessonKey}</span>}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {r.status === "active" ? (
                        <Button size="sm" variant="danger" onClick={() => confirm("수강권을 회수할까요? 진도 기록은 남아요.") && patch(r, { status: "revoked" }, "수강권을 회수했어요.")}>
                          회수
                        </Button>
                      ) : (
                        <Button size="sm" variant="secondary" onClick={() => patch(r, { status: "active" }, "수강권을 다시 열었어요.")}>
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
