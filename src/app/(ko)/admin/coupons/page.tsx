"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { couponBenefit, won } from "@/lib/payment";
import { Alert, Badge, Button, EmptyState, Input, Modal, PageHeader, Skeleton, Textarea, Toast, cx } from "@/components/ui";

// ─────────────────────────────────────────────────────────────────
// 관리자 — 쿠폰
//   목록(검색·상태·종류) · 새 쿠폰(공용 코드 / 특정 회원 개인 쿠폰) · 켜기/끄기
//   개인 발급(이메일 여러 개 → 회원별 개인 쿠폰) · 사용 내역
//   워크북 95% 완주 쿠폰은 자동 발급(종류: 완주 보상)
// ─────────────────────────────────────────────────────────────────

interface CouponRow {
  _id: string;
  code: string;
  name: string;
  discountType: "percent" | "amount";
  discountValue: number;
  maxDiscount: number | null;
  minAmount: number;
  itemTypes: ("course" | "workbook")[];
  itemIds: string[];
  excludeItemIds: string[];
  validFrom: string | null;
  validUntil: string | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number;
  status: "active" | "disabled";
  source: "manual" | "issued" | "workbook-complete";
  user: { email: string; name: string } | null;
  createdAt: string;
}
interface Item {
  id: string;
  type: "course" | "workbook";
  title: string;
}
interface UsedOrder {
  _id: string;
  externalOrderId: string;
  itemTitle: string;
  amount: number;
  discountAmount: number;
  couponCode: string;
  status: string;
  paidAt: string;
  userId: { email: string; name: string } | null;
}

const SOURCE_LABEL: Record<CouponRow["source"], string> = { manual: "직접 만듦", issued: "개인 발급", "workbook-complete": "완주 보상" };
const date = (v: string | null) => (v ? new Date(v).toLocaleDateString("ko-KR") : "");

const emptyForm = {
  name: "",
  code: "",
  discountType: "percent" as "percent" | "amount",
  discountValue: "10",
  maxDiscount: "",
  minAmount: "",
  itemTypes: [] as ("course" | "workbook")[],
  itemIds: [] as string[],
  validFrom: "",
  validUntil: "",
  usageLimit: "",
  perUserLimit: "1",
  userEmail: "",
};

export default function AdminCouponsPage() {
  const [rows, setRows] = useState<CouponRow[] | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);
  const [issueFor, setIssueFor] = useState<CouponRow | null>(null);
  const [emails, setEmails] = useState("");
  const [issueResult, setIssueResult] = useState<{ issued: string[]; already: string[]; notFound: string[] } | null>(null);
  const [ordersFor, setOrdersFor] = useState<CouponRow | null>(null);
  const [orders, setOrders] = useState<UsedOrder[] | null>(null);

  const load = useCallback(() => {
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (status) p.set("status", status);
    if (source) p.set("source", source);
    apiFetch(`/api/admin/coupons?${p}`).then(setRows).catch(() => setRows([]));
  }, [q, status, source]);

  useEffect(() => {
    load();
  }, [load]);
  useEffect(() => {
    apiFetch("/api/admin/coupons/items").then(setItems).catch(() => setItems([]));
  }, []);

  const set = <K extends keyof typeof emptyForm>(k: K, v: (typeof emptyForm)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const create = async () => {
    setSaving(true);
    setFormError("");
    const n = (v: string) => (v.trim() === "" ? null : Number(v));
    const res = await apiRequest("/api/admin/coupons", {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        code: form.code.trim() || undefined,
        discountType: form.discountType,
        discountValue: Number(form.discountValue),
        maxDiscount: form.discountType === "percent" ? n(form.maxDiscount) : null,
        minAmount: n(form.minAmount) ?? 0,
        itemTypes: form.itemTypes,
        itemIds: form.itemIds,
        validFrom: form.validFrom || null,
        validUntil: form.validUntil || null,
        usageLimit: n(form.usageLimit),
        perUserLimit: n(form.perUserLimit) ?? 1,
        userEmail: form.userEmail.trim() || undefined,
      }),
    });
    setSaving(false);
    if (!res.ok) {
      setFormError(res.message || "만들지 못했어요.");
      return;
    }
    setCreating(false);
    setForm(emptyForm);
    setToast("쿠폰을 만들었어요.");
    load();
  };

  const toggle = async (c: CouponRow) => {
    const res = await apiRequest(`/api/admin/coupons/${c._id}`, { method: "PATCH", body: JSON.stringify({ status: c.status === "active" ? "disabled" : "active" }) });
    setToast(res.ok ? (c.status === "active" ? "사용을 멈췄어요." : "다시 쓸 수 있게 했어요.") : res.message);
    load();
  };

  const issue = async () => {
    if (!issueFor) return;
    setSaving(true);
    const res = await apiRequest<{ issued: string[]; already: string[]; notFound: string[] }>(`/api/admin/coupons/${issueFor._id}/issue`, {
      method: "POST",
      body: JSON.stringify({ emails }),
    });
    setSaving(false);
    if (res.ok && res.data) {
      setIssueResult(res.data);
      load();
    } else setToast(res.message || "발급하지 못했어요.");
  };

  const openOrders = (c: CouponRow) => {
    setOrdersFor(c);
    setOrders(null);
    apiFetch(`/api/admin/coupons/${c._id}/orders`).then(setOrders).catch(() => setOrders([]));
  };

  const target = (c: CouponRow) => {
    if (c.itemIds.length) return c.itemIds.map((id) => items.find((i) => i.id === id)?.title ?? "(삭제된 상품)").join(", ");
    const t = c.itemTypes.length === 1 ? (c.itemTypes[0] === "course" ? "강의 전체" : "워크북 전체") : "강의·워크북 전체";
    return c.excludeItemIds.length ? `${t} (${c.excludeItemIds.length}개 제외)` : t;
  };

  return (
    <div className="px-4 py-8">
      <PageHeader title="쿠폰" description="할인 쿠폰을 만들고 회원에게 발급해요. 워크북을 95% 이상 완주하면 다음 워크북 10% 쿠폰이 자동으로 발급돼요.">
        <div className="mt-5">
          <Button onClick={() => setCreating(true)}>새 쿠폰</Button>
        </div>
      </PageHeader>

      <div className="mb-5 flex flex-wrap gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="코드·이름·회원 이메일"
          className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] px-3 text-sm sm:max-w-xs"
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] px-2 text-sm">
          <option value="">상태 전체</option>
          <option value="active">사용 중</option>
          <option value="disabled">멈춤</option>
        </select>
        <select value={source} onChange={(e) => setSource(e.target.value)} className="h-10 rounded-xl border border-[var(--border)] px-2 text-sm">
          <option value="">종류 전체</option>
          <option value="manual">직접 만듦</option>
          <option value="issued">개인 발급</option>
          <option value="workbook-complete">완주 보상</option>
        </select>
      </div>

      {!rows ? (
        <Skeleton className="h-64" />
      ) : rows.length === 0 ? (
        <EmptyState title="쿠폰이 없어요" description="[새 쿠폰]으로 첫 쿠폰을 만들어 보세요." />
      ) : (
        <div className="space-y-3">
          {rows.map((c) => (
            <div key={c._id} className={cx("card flex flex-wrap items-center gap-x-6 gap-y-3 p-5", c.status === "disabled" && "opacity-60")}>
              <div className="min-w-0 flex-1 basis-64">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-sm font-bold">{c.code}</span>
                  <Badge tone={c.status === "active" ? "brand" : "neutral"}>{c.status === "active" ? "사용 중" : "멈춤"}</Badge>
                  <Badge>{SOURCE_LABEL[c.source]}</Badge>
                </div>
                <p className="mt-1 font-semibold">{c.name}</p>
                <p className="mt-0.5 text-sm text-[var(--foreground-muted)]">
                  {couponBenefit(c)} · {target(c)}
                  {c.minAmount ? ` · ${won(c.minAmount)} 이상` : ""}
                </p>
                <p className="mt-0.5 text-xs text-[var(--foreground-subtle)]">
                  {c.validFrom || c.validUntil ? `${date(c.validFrom) || "지금"} ~ ${date(c.validUntil) || "제한 없음"}` : "기간 제한 없음"}
                  {c.user && ` · 대상 ${c.user.email}`}
                </p>
              </div>
              <div className="text-sm">
                <p className="font-semibold">
                  {c.usedCount}
                  {c.usageLimit ? ` / ${c.usageLimit}` : ""}회 사용
                </p>
                <p className="text-xs text-[var(--foreground-subtle)]">1인 {c.perUserLimit}회</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" onClick={() => openOrders(c)}>사용 내역</Button>
                {!c.user && (
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setIssueFor(c);
                      setEmails("");
                      setIssueResult(null);
                    }}
                  >
                    개인 발급
                  </Button>
                )}
                <Button size="sm" variant={c.status === "active" ? "danger" : "secondary"} onClick={() => toggle(c)}>
                  {c.status === "active" ? "멈추기" : "다시 켜기"}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 새 쿠폰 */}
      <Modal open={creating} onClose={() => setCreating(false)} title="새 쿠폰" wide>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input id="cn" label="쿠폰 이름 (회원에게 보여요)" value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="예: 오픈 기념 10% 할인" />
          <Input id="cc" label="코드 (비우면 자동)" value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="예: OPEN10" />
          <div>
            <label className="mb-1.5 block text-sm font-medium">할인 방식</label>
            <div className="flex gap-2">
              {([["percent", "정률 (%)"], ["amount", "정액 (원)"]] as const).map(([v, l]) => (
                <button key={v} onClick={() => set("discountType", v)} className={cx("h-10 flex-1 cursor-pointer rounded-xl text-sm font-semibold", form.discountType === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                  {l}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="cv" label={form.discountType === "percent" ? "할인율 (%)" : "할인 금액 (원)"} inputMode="numeric" value={form.discountValue} onChange={(e) => set("discountValue", e.target.value)} />
            {form.discountType === "percent" && (
              <Input id="cm" label="최대 할인액 (선택)" inputMode="numeric" value={form.maxDiscount} onChange={(e) => set("maxDiscount", e.target.value)} />
            )}
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">대상</label>
            <div className="flex gap-2">
              {([["course", "강의"], ["workbook", "워크북"]] as const).map(([v, l]) => (
                <label key={v} className="flex cursor-pointer items-center gap-2 rounded-xl bg-[var(--surface)] px-3 py-2 text-sm">
                  <input
                    type="checkbox"
                    className="accent-[var(--brand)]"
                    checked={form.itemTypes.includes(v)}
                    onChange={(e) => set("itemTypes", e.target.checked ? [...form.itemTypes, v] : form.itemTypes.filter((x) => x !== v))}
                  />
                  {l}
                </label>
              ))}
            </div>
            <p className="mt-1 text-xs text-[var(--foreground-subtle)]">둘 다 비우면 강의·워크북 모두</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">특정 상품만 (선택)</label>
            <select
              multiple
              value={form.itemIds}
              onChange={(e) => set("itemIds", [...e.target.selectedOptions].map((o) => o.value))}
              className="h-24 w-full rounded-xl border border-[var(--border)] px-2 py-1 text-sm"
            >
              {items
                .filter((i) => !form.itemTypes.length || form.itemTypes.includes(i.type))
                .map((i) => (
                  <option key={i.id} value={i.id}>
                    [{i.type === "course" ? "강의" : "워크북"}] {i.title}
                  </option>
                ))}
            </select>
            <p className="mt-1 text-xs text-[var(--foreground-subtle)]">Ctrl(⌘)을 누른 채 여러 개 선택</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input id="vf" label="시작일 (선택)" type="date" value={form.validFrom} onChange={(e) => set("validFrom", e.target.value)} />
            <Input id="vu" label="종료일 (선택)" type="date" value={form.validUntil} onChange={(e) => set("validUntil", e.target.value)} />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Input id="mn" label="최소 결제액" inputMode="numeric" value={form.minAmount} onChange={(e) => set("minAmount", e.target.value)} placeholder="0" />
            <Input id="ul" label="전체 횟수" inputMode="numeric" value={form.usageLimit} onChange={(e) => set("usageLimit", e.target.value)} placeholder="무제한" />
            <Input id="pl" label="1인당 횟수" inputMode="numeric" value={form.perUserLimit} onChange={(e) => set("perUserLimit", e.target.value)} />
          </div>
          <Input
            id="ue"
            label="특정 회원 전용 (선택)"
            hint="이메일을 적으면 그 회원만 쓸 수 있는 개인 쿠폰이 돼요. 여러 명에게는 만든 뒤 [개인 발급]을 쓰세요."
            value={form.userEmail}
            onChange={(e) => set("userEmail", e.target.value)}
            placeholder="member@example.com"
            className="sm:col-span-2"
          />
        </div>
        {formError && <div className="mt-4"><Alert>{formError}</Alert></div>}
        <div className="mt-6 flex justify-end gap-2">
          <Button variant="secondary" onClick={() => setCreating(false)}>취소</Button>
          <Button onClick={create} loading={saving}>만들기</Button>
        </div>
      </Modal>

      {/* 개인 발급 */}
      <Modal open={!!issueFor} onClose={() => setIssueFor(null)} title={`개인 발급 · ${issueFor?.name ?? ""}`}>
        {issueResult ? (
          <div className="space-y-3 text-sm">
            <Alert tone="success">{issueResult.issued.length}명에게 발급했어요.</Alert>
            {issueResult.already.length > 0 && <p className="text-[var(--foreground-muted)]">이미 받은 회원 {issueResult.already.length}명: {issueResult.already.join(", ")}</p>}
            {issueResult.notFound.length > 0 && <p className="text-[var(--error)]">가입하지 않은 이메일 {issueResult.notFound.length}개: {issueResult.notFound.join(", ")}</p>}
            <div className="flex justify-end">
              <Button onClick={() => setIssueFor(null)}>닫기</Button>
            </div>
          </div>
        ) : (
          <>
            <p className="mb-3 text-sm text-[var(--foreground-muted)]">이 쿠폰과 같은 조건으로 회원마다 전용 코드를 만들어요. 같은 회원에게는 한 번만 발급돼요.</p>
            <Textarea id="em" label="회원 이메일 (줄바꿈·쉼표로 여러 개)" value={emails} onChange={(e) => setEmails(e.target.value)} className="min-h-[140px]" />
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setIssueFor(null)}>취소</Button>
              <Button onClick={issue} loading={saving} disabled={!emails.trim()}>발급하기</Button>
            </div>
          </>
        )}
      </Modal>

      {/* 사용 내역 */}
      <Modal open={!!ordersFor} onClose={() => setOrdersFor(null)} title={`사용 내역 · ${ordersFor?.code ?? ""}`} wide>
        {!orders ? (
          <Skeleton className="h-32" />
        ) : orders.length === 0 ? (
          <p className="py-6 text-center text-sm text-[var(--foreground-muted)]">아직 사용한 주문이 없어요.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs text-[var(--foreground-subtle)]">
                <tr>
                  <th className="py-2">결제일</th>
                  <th>회원</th>
                  <th>상품</th>
                  <th className="text-right">할인</th>
                  <th className="text-right">결제액</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o._id} className="border-t border-[var(--border-light)]">
                    <td className="py-2">{date(o.paidAt)}</td>
                    <td>{o.userId?.email ?? "-"}</td>
                    <td>{o.itemTitle}</td>
                    <td className="text-right">-{won(o.discountAmount)}</td>
                    <td className="text-right">{won(o.amount)}</td>
                    <td>{o.status === "refunded" ? "환불" : "완료"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>

      <Toast message={toast} onClose={() => setToast(null)} />
    </div>
  );
}
