"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { Badge, Button, Input, Modal, Skeleton, Toast } from "@/components/ui";
import { stageName } from "@/lib/attendance";
import { DeletionSummary, type DeletionPreview } from "@/components/my/DeletionSummary";

// ─────────────────────────────────────────────────────────────────
// 회원 관리 — 목록·검색·역할 필터·상세(주문)·역할 변경·정보 수정·이메일 인증 처리·메일 발송·삭제·작업 기록
// 비밀번호는 관리자가 보거나 입력하지 않는다 (재설정 메일만 보낼 수 있다)
// 카페24 구매자 "고객(CRM)"과는 별개: 여기서는 사이트 로그인 계정을 다룬다.
// ─────────────────────────────────────────────────────────────────

type Role = "user" | "counselor" | "admin";
type Gender = "male" | "female" | "other";
interface AdminUser {
  _id: string;
  name: string;
  email: string;
  role: Role;
  isEmailVerified: boolean;
  googleId?: string;
  kakaoId?: string;
  naverId?: string;
  appleId?: string;
  birthDate?: string | null;
  gender?: Gender | null;
  createdAt: string;
  /** 숨이 성장 정보 (참고용, 관리자 화면에서만) */
  sumi?: { drops: number; stage: number } | null;
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

/** 가입 방법 — 소셜이면 그 이름, 아니면 이메일 */
const loginMethod = (u: AdminUser) => (u.googleId ? "구글" : u.kakaoId ? "카카오" : u.naverId ? "네이버" : u.appleId ? "애플" : "이메일");
const isSocial = (u: AdminUser) => loginMethod(u) !== "이메일";
const GENDER_LABEL: Record<Gender, string> = { female: "여성", male: "남성", other: "기타" };

interface AuditRow {
  id: string;
  action: string;
  status: "done" | "started";
  changed: string[];
  by: string | null;
  target: string | null;
  createdAt: string;
}
const AUDIT_LABEL: Record<string, string> = {
  "member.update": "정보 수정",
  "member.role": "역할 변경",
  "member.verify_email": "이메일 인증 처리",
  "member.send_verification": "인증 메일 발송",
  "member.send_password_reset": "비밀번호 재설정 메일 발송",
  "member.delete": "회원 삭제",
  "member.self_delete": "본인 탈퇴",
};
const CHANGED_LABEL: Record<string, string> = { name: "이름", email: "이메일", birthDate: "생년월일", gender: "성별" };

interface EditForm {
  name: string;
  email: string;
  birthDate: string;
  gender: "" | Gender;
}
const formOf = (u: AdminUser): EditForm => ({ name: u.name, email: u.email, birthDate: u.birthDate ? u.birthDate.slice(0, 10) : "", gender: u.gender ?? "" });

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
  const [hasPassword, setHasPassword] = useState(false);
  const [edit, setEdit] = useState<EditForm | null>(null);
  const [editError, setEditError] = useState("");
  const [deletion, setDeletion] = useState<DeletionPreview | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [audit, setAudit] = useState<AuditRow[] | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

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
    setEdit(null);
    setEditError("");
    setHasPassword(false);
    setDeletion(null);
    setDeleteOpen(false);
    setDeleteEmail("");
    setDeleteError("");
    setDetailLoading(true);
    try {
      const data = await apiFetch(`/api/admin/users/${u._id}`);
      setSelected(data.user);
      setOrders(data.orders ?? []);
      setHasPassword(!!data.hasPassword);
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

  const openDeletion = async () => {
    if (!selected) return;
    setDeleteOpen(true);
    setDeleteError("");
    try {
      setDeletion(await apiFetch(`/api/admin/users/${selected._id}/deletion-preview`));
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "안내를 불러오지 못했어요.");
    }
  };

  const deleteMember = async () => {
    if (!selected) return;
    if (!confirm(`${selected.name}님을 삭제할까요? 되돌릴 수 없어요.`)) return;
    setSaving(true);
    setDeleteError("");
    try {
      await apiFetch(`/api/admin/users/${selected._id}`, { method: "DELETE", body: JSON.stringify({ confirmEmail: deleteEmail }) });
      setUsers((prev) => prev.filter((u) => u._id !== selected._id));
      setTotal((n) => n - 1);
      setSelected(null);
      setToast("회원을 삭제했어요.");
    } catch (err) {
      setDeleteError(err instanceof Error ? err.message : "삭제하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const openAudit = async () => {
    setAuditOpen(true);
    setAudit(null);
    try {
      setAudit(await apiFetch("/api/admin/users/audit-log"));
    } catch (err) {
      setAudit([]);
      setToast(err instanceof Error ? err.message : "기록을 불러오지 못했어요.");
    }
  };

  const saveEdit = async () => {
    if (!selected || !edit) return;
    const emailChanged = edit.email.trim().toLowerCase() !== selected.email;
    if (emailChanged && !confirm(`이메일을 ${edit.email.trim()}(으)로 바꿀까요?\n새 주소를 인증하기 전까지 이메일 로그인이 막혀요. 바꾼 뒤 [이메일 인증 처리]나 [인증 메일 다시 보내기]를 눌러 주세요.`)) return;
    setSaving(true);
    setEditError("");
    try {
      const data = await apiFetch(`/api/admin/users/${selected._id}`, { method: "PATCH", body: JSON.stringify({ name: edit.name, email: edit.email, birthDate: edit.birthDate || null, gender: edit.gender || null }) });
      const patch = { name: data.name, email: data.email, isEmailVerified: data.isEmailVerified, birthDate: data.birthDate, gender: data.gender };
      setSelected({ ...selected, ...patch });
      setUsers((prev) => prev.map((u) => (u._id === selected._id ? { ...u, ...patch } : u)));
      setEdit(null);
      setToast(data.changed?.length ? "회원 정보를 고쳤어요." : "바뀐 내용이 없어요.");
    } catch (err) {
      setEditError(err instanceof Error ? err.message : "저장하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const sendPasswordReset = async () => {
    if (!selected) return;
    if (!confirm(`${selected.email} 주소로 비밀번호 재설정 메일을 보낼까요?`)) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/users/${selected._id}/send-password-reset`, { method: "POST" });
      setToast("비밀번호 재설정 메일을 보냈어요.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "메일을 보내지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const verifyEmail = async () => {
    if (!selected) return;
    if (!confirm(`${selected.email} 주소의 이메일 인증을 처리할까요?\n본인이 메일을 확인하지 않아도 바로 로그인할 수 있게 돼요.`)) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/users/${selected._id}/verify-email`, { method: "POST" });
      setSelected({ ...selected, isEmailVerified: true });
      setUsers((prev) => prev.map((u) => (u._id === selected._id ? { ...u, isEmailVerified: true } : u)));
      setToast("이메일 인증을 처리했어요.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "처리하지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  const sendVerification = async () => {
    if (!selected) return;
    if (!confirm(`${selected.email} 주소로 인증 메일을 다시 보낼까요?`)) return;
    setSaving(true);
    try {
      await apiFetch(`/api/admin/users/${selected._id}/send-verification`, { method: "POST" });
      setToast("인증 메일을 보냈어요.");
    } catch (err) {
      setToast(err instanceof Error ? err.message : "메일을 보내지 못했어요.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl text-[var(--foreground)]">회원</h1>
          <p className="mt-1 text-sm text-[var(--foreground-muted)]">
            사이트 로그인 계정 {loading ? "" : `${total}명`} ·{" "}
            <button type="button" onClick={openAudit} className="cursor-pointer font-semibold text-[var(--foreground)] underline-offset-2 hover:underline">
              작업 기록
            </button>
          </p>
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
                    {loginMethod(u)}
                    {!u.isEmailVerified && !isSocial(u) && <span className="ml-1 text-xs text-[var(--warning)]">미인증</span>}
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
                가입 {new Date(selected.createdAt).toLocaleDateString("ko-KR")} · {isSocial(selected) ? `${loginMethod(selected)} 로그인` : selected.isEmailVerified ? "이메일 인증됨" : "이메일 미인증"}
              </p>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                생년월일 {selected.birthDate ? selected.birthDate.slice(0, 10) : "미입력"} · 성별 {selected.gender ? GENDER_LABEL[selected.gender] : "미입력"}
              </p>
              {/* 숨이 성장 정보 (참고용) — 마음 날씨 등 민감 정보는 표시하지 않는다 */}
              {selected.sumi != null && (
                <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                  숨이 물방울 {selected.sumi.drops}개 · {stageName(selected.sumi.stage)}
                </p>
              )}
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">회원 정보</p>
              {edit ? (
                <div className="space-y-3 rounded-xl border border-[var(--border-light)] p-4">
                  <Input id="edit-name" label="이름" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} />
                  <Input id="edit-email" type="email" label="이메일" value={edit.email} onChange={(e) => setEdit({ ...edit, email: e.target.value })} />
                  <Input id="edit-birth" type="date" label="생년월일" value={edit.birthDate} onChange={(e) => setEdit({ ...edit, birthDate: e.target.value })} />
                  <label className="block text-sm font-medium text-[var(--foreground)]">
                    성별
                    <select value={edit.gender} onChange={(e) => setEdit({ ...edit, gender: e.target.value as EditForm["gender"] })} className="mt-1.5 w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3 py-2.5 text-sm font-normal outline-none">
                      <option value="">미입력</option>
                      {(Object.keys(GENDER_LABEL) as Gender[]).map((g) => (
                        <option key={g} value={g}>
                          {GENDER_LABEL[g]}
                        </option>
                      ))}
                    </select>
                  </label>
                  {editError && <p className="text-sm text-[var(--error)]">{editError}</p>}
                  <div className="flex gap-2">
                    <Button size="md" loading={saving} onClick={saveEdit}>
                      저장
                    </Button>
                    <Button size="md" variant="secondary" disabled={saving} onClick={() => { setEdit(null); setEditError(""); }}>
                      취소
                    </Button>
                  </div>
                </div>
              ) : (
                <Button size="md" variant="secondary" disabled={saving} onClick={() => setEdit(formOf(selected))}>
                  정보 수정
                </Button>
              )}
            </div>

            {hasPassword && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">비밀번호</p>
                <Button size="md" variant="secondary" disabled={saving} onClick={sendPasswordReset}>
                  비밀번호 재설정 메일 보내기
                </Button>
                <p className="mt-2 text-xs text-[var(--foreground-subtle)]">비밀번호는 관리자가 보거나 정할 수 없어요. 회원이 메일의 링크로 직접 정해요.</p>
              </div>
            )}

            {!selected.isEmailVerified && !isSocial(selected) && (
              <div>
                <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">이메일 인증</p>
                <div className="flex flex-wrap gap-2">
                  <Button size="md" disabled={saving} onClick={verifyEmail}>
                    이메일 인증 처리
                  </Button>
                  <Button size="md" variant="secondary" disabled={saving} onClick={sendVerification}>
                    인증 메일 다시 보내기
                  </Button>
                </div>
              </div>
            )}

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

            {/* 회원 삭제 — 자기 자신과 관리자 계정은 지울 수 없다 */}
            {me?.id !== selected._id && selected.role !== "admin" && (
              <div className="border-t border-[var(--border-light)] pt-5">
                <p className="mb-2 text-xs font-semibold tracking-wider text-[var(--foreground-subtle)]">회원 삭제</p>
                {!deleteOpen ? (
                  <Button size="md" variant="danger" disabled={saving} onClick={openDeletion}>
                    삭제 안내 보기
                  </Button>
                ) : (
                  <div className="space-y-4">
                    {deleteError && <p className="text-sm text-[var(--error)]">{deleteError}</p>}
                    {!deletion ? (
                      !deleteError && <Skeleton className="h-40" />
                    ) : (
                      <>
                        <DeletionSummary preview={deletion} />
                        {deletion.blockers.length > 0 ? (
                          <div className="rounded-xl bg-[var(--surface)] px-4 py-3 text-sm leading-relaxed text-[var(--foreground-muted)]">
                            <p className="font-bold text-[var(--foreground)]">지금은 삭제할 수 없어요</p>
                            {deletion.blockers.map((b) => (
                              <p key={b.code} className="mt-1">
                                {b.message} {b.applicationNos?.length ? `(신청 ${b.applicationNos.join(", ")})` : ""}
                              </p>
                            ))}
                            <p className="mt-1">검사 신청 관리에서 취소·환불을 먼저 처리해 주세요.</p>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Input id="delete-confirm" label={`확인을 위해 ${selected.email} 를 그대로 입력해 주세요`} value={deleteEmail} onChange={(e) => setDeleteEmail(e.target.value)} autoComplete="off" />
                            <Button size="md" variant="danger" className="w-full" loading={saving} disabled={deleteEmail.trim().toLowerCase() !== selected.email} onClick={deleteMember}>
                              회원 삭제
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>

      <Modal open={auditOpen} onClose={() => setAuditOpen(false)} title="작업 기록" wide>
        <p className="mb-3 text-xs text-[var(--foreground-subtle)]">최근 100건. 삭제된 회원은 이름이 남지 않아요. 수정한 값은 기록하지 않고 항목 이름만 남겨요.</p>
        {audit === null ? (
          <Skeleton className="h-40" />
        ) : audit.length === 0 ? (
          <p className="text-sm text-[var(--foreground-muted)]">아직 기록이 없어요.</p>
        ) : (
          <ul className="divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)]">
            {audit.map((r) => (
              <li key={r.id} className="px-4 py-3 text-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <span className="font-semibold text-[var(--foreground)]">
                    {AUDIT_LABEL[r.action] ?? r.action}
                    {r.status === "started" && <span className="ml-2 text-xs text-[var(--warning)]">중간에 멈춤</span>}
                  </span>
                  <span className="text-xs text-[var(--foreground-subtle)]">{new Date(r.createdAt).toLocaleString("ko-KR")}</span>
                </div>
                <p className="mt-0.5 text-xs text-[var(--foreground-muted)]">
                  대상 {r.target ?? "(삭제된 회원)"} · 처리 {r.by ?? (r.action === "member.self_delete" ? "본인" : "(없음)")}
                  {r.changed.length > 0 && ` · ${r.changed.map((c) => CHANGED_LABEL[c] ?? c).join(", ")}`}
                </p>
              </li>
            ))}
          </ul>
        )}
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
