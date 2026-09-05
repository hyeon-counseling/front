"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Badge, Button, Input, Modal, Skeleton, Toast } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 회원 관리 — 목록·검색·역할 필터·상세(주문)·역할 변경
// 카페24 구매자 "고객(CRM)"과는 별개: 여기서는 사이트 로그인 계정을 다룬다.
// ─────────────────────────────────────────────────────────────────

type Role = "user" | "counselor" | "admin";
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  googleId?: string;
  createdAt: string;
}
interface UserOrder {
  _id: string;
  productId: { title: string; price: number } | null;
  itemTitle?: string;
  amount: number;
  currency: string;
  channel: string;
  provider?: string;
  status: string;
  createdAt: string;
}

const ROLE_LABEL: Record<Role, string> = { user: "회원", counselor: "상담사", admin: "관리자" };
const ROLE_TONE: Record<Role, "neutral" | "brand" | "warning"> = { user: "neutral", counselor: "brand", admin: "warning" };

export default function AdminUsersPage() {
  const { user: me } = useAuth();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [role, setRole] = useState<"" | Role>("");
  const [toast, setToast] = useState<string | null>(null);

  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<UserOrder[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (q.trim()) params.set("q", q.trim());
      if (role) params.set("role", role);
      const data = await apiFetch(`/api/admin/users?${params.toString()}`);
      setUsers(data.users);
      setTotal(data.total);
    } catch (err) {
      setToast(err instanceof Error ? err.message : "불러오지 못했어요.");
    } finally {
      setLoading(false);
    }
  }, [q, role]);

  useEffect(() => {
    load();
  }, [load]);

  const openDetail = async (u: AdminUser) => {
    setSelected(u);
    setOrders([]);
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/admin/users/${u._id}`);
      setSelected(data.user);
      setOrders(data.orders ?? []);
    } catch {
      // 무시
    } finally {
      setDetailLoading(false);
    }
  };

  const changeRole = async (next: Role) => {
    if (!selected) return;
    if (!confirm(`${selected.name}님의 역할을 "${ROLE_LABEL[next]}"(으)로 바꿀까요?`)) return;
    setSaving(true);
    try {
      const data = await apiFetch(`/api/admin/users/${selected._id}/role`, { method: "PATCH", body: JSON.stringify({ role: next }) });
      setSelected({ ...selected, role: data.role });
      setUsers((prev) => prev.map((u) => (u._id === selected._id ? { ...u, role: data.role } : u)));
      setToast("역할을 변경했어요.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "변경에 실패했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--foreground)]">회원</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">사이트 로그인 계정 {loading ? "" : `${total}명`}</p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            load();
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <select value={role} onChange={(e) => setRole(e.target.value as "" | Role)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm outline-none">
            <option value="">모든 역할</option>
            <option value="user">회원</option>
            <option value="counselor">상담사</option>
            <option value="admin">관리자</option>
          </select>
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 또는 이메일" className="w-56" />
          <Button type="submit" size="md" variant="secondary">
            검색
          </Button>
        </form>
      </div>

      {loading ? (
        <Skeleton className="h-64" />
      ) : users.length === 0 ? (
        <p className="rounded-2xl border border-[var(--border)] p-8 text-center text-sm text-[var(--foreground-muted)]">회원이 없어요.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-[var(--border)]">
          <table className="w-full text-sm">
            <thead className="bg-[var(--surface)] text-left text-xs uppercase tracking-wider text-[var(--foreground-subtle)]">
              <tr>
                <th className="px-5 py-3">이름</th>
                <th className="px-5 py-3">이메일</th>
                <th className="px-5 py-3">역할</th>
                <th className="px-5 py-3">가입</th>
                <th className="px-5 py-3">가입일</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u._id} onClick={() => openDetail(u)} className="cursor-pointer border-t border-[var(--border-light)] hover:bg-[var(--surface)]">
                  <td className="px-5 py-3 font-medium text-[var(--foreground)]">{u.name}</td>
                  <td className="px-5 py-3 text-[var(--foreground-muted)]">{u.email}</td>
                  <td className="px-5 py-3">
                    <Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge>
                  </td>
                  <td className="px-5 py-3 text-[var(--foreground-muted)]">
                    {u.googleId ? "구글" : "이메일"}
                    {!u.isEmailVerified && !u.googleId && <span className="ml-1 text-xs text-[var(--warning)]">미인증</span>}
                  </td>
                  <td className="px-5 py-3 text-[var(--foreground-subtle)]">{new Date(u.createdAt).toLocaleDateString("ko-KR")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!selected} onClose={() => setSelected(null)} title={selected?.name ?? ""}>
        {selected && (
          <div className="space-y-6">
            <div className="text-sm text-[var(--foreground-muted)]">
              <p>{selected.email}</p>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                가입 {new Date(selected.createdAt).toLocaleDateString("ko-KR")} · {selected.googleId ? "구글 로그인" : selected.isEmailVerified ? "이메일 인증됨" : "이메일 미인증"}
              </p>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">역할</p>
              <div className="flex flex-wrap gap-2">
                {(["user", "counselor", "admin"] as Role[]).map((r) => {
                  const active = selected.role === r;
                  const isSelf = me?.id === selected._id;
                  return (
                    <button
                      key={r}
                      disabled={active || saving || (isSelf && r !== "admin")}
                      onClick={() => changeRole(r)}
                      className={`cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                        active ? "border-[var(--brand)] bg-[var(--brand)] text-white" : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--brand)]"
                      }`}
                    >
                      {ROLE_LABEL[r]}
                    </button>
                  );
                })}
              </div>
              {me?.id === selected._id && <p className="mt-2 text-xs text-[var(--foreground-subtle)]">자신의 관리자 권한은 내릴 수 없어요.</p>}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">최근 주문</p>
              {detailLoading ? (
                <Skeleton className="h-16" />
              ) : orders.length === 0 ? (
                <p className="text-sm text-[var(--foreground-subtle)]">주문이 없어요.</p>
              ) : (
                <ul className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)]">
                  {orders.map((o) => (
                    <li key={o._id} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                      <span className="truncate text-[var(--foreground)]">{o.itemTitle ?? o.productId?.title ?? "상품"}</span>
                      <span className="shrink-0 text-xs text-[var(--foreground-subtle)]">
                        {o.provider ?? o.channel} · {o.amount.toLocaleString()} {o.currency} · {new Date(o.createdAt).toLocaleDateString("ko-KR")}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
