"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiFetch, apiRequest } from "@/lib/api";
import { Badge, EmptyState, Skeleton, cx } from "@/components/ui";

/**
 * 관리자 · 쿠폰 보내기 — ① 상품 ② 혜택 ③ 받는 사람(회원 검색 / 비회원 휴대폰) → 보내기
 * 아래: 비회원 선물 목록 (보냄·받음·사용함·만료·취소, 다시 보내기·취소)
 */
interface Item {
  id: string;
  type: "assessment" | "course" | "program";
  title: string;
}
interface Member {
  _id: string;
  name: string;
  email: string;
}
interface GiftRow {
  id: string;
  state: "sent" | "claimed" | "used" | "expired" | "canceled";
  recipientName: string;
  phoneLast4: string;
  itemTitle: string;
  couponName: string;
  benefit: string;
  expiresAt: string;
  claimedBy: { name: string; email: string } | null;
  sentCount: number;
  lastSendResult: "ok" | "failed" | null;
  createdAt: string;
}

const TYPE_LABEL: Record<Item["type"], string> = { assessment: "전문 심리검사", course: "강의", program: "과정" };
const STATE: Record<GiftRow["state"], { label: string; tone: "success" | "neutral" | "error" | "brand" }> = {
  sent: { label: "보냄", tone: "brand" },
  claimed: { label: "받음", tone: "success" },
  used: { label: "사용함", tone: "success" },
  expired: { label: "만료", tone: "neutral" },
  canceled: { label: "취소", tone: "neutral" },
};
const fmt = (iso: string) => new Date(iso).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric" });

export default function CouponSendPage() {
  const [items, setItems] = useState<Item[] | null>(null);
  const [itemId, setItemId] = useState("assessment");
  const [kind, setKind] = useState<"free" | "percent" | "amount">("free");
  const [value, setValue] = useState("");
  const [validDays, setValidDays] = useState("30");
  const [name, setName] = useState("");
  const [who, setWho] = useState<"member" | "phone">("phone");
  const [q, setQ] = useState("");
  const [found, setFound] = useState<Member[] | null>(null);
  const [member, setMember] = useState<Member | null>(null);
  const [phone, setPhone] = useState("");
  const [toName, setToName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [gifts, setGifts] = useState<GiftRow[] | null>(null);

  const loadGifts = useCallback(() => {
    apiFetch("/api/admin/coupons/gifts")
      .then(setGifts)
      .catch(() => setGifts([]));
  }, []);
  useEffect(() => {
    apiFetch("/api/admin/coupons/items")
      .then((x: Item[]) => setItems(x.filter((i) => i.type === "assessment" || i.type === "course" || i.type === "program")))
      .catch(() => setItems([]));
    loadGifts();
  }, [loadGifts]);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!q.trim()) return;
    const r = await apiRequest<{ users: Member[] }>(`/api/admin/users?limit=10&q=${encodeURIComponent(q.trim())}`);
    setFound(r.ok && r.data ? r.data.users : []);
  };

  const item = items?.find((i) => i.id === itemId);
  const benefit = kind === "free" ? "무료(100%)" : kind === "percent" ? `${value || "?"}% 할인` : `${Number(value || 0).toLocaleString("ko-KR")}원 할인`;

  const send = async () => {
    setMsg(null);
    if (!item) return setMsg({ ok: false, text: "상품을 골라 주세요." });
    if (who === "member" && !member) return setMsg({ ok: false, text: "받을 회원을 골라 주세요." });
    setBusy(true);
    const r = await apiRequest<{ kind: "member" | "gift"; name: string; sent?: boolean; to?: string }>("/api/admin/coupons/send", {
      method: "POST",
      body: JSON.stringify({
        item: { type: item.type, id: item.type === "assessment" ? null : item.id },
        discountType: kind === "amount" ? "amount" : "percent",
        discountValue: kind === "free" ? 100 : Number(value),
        validDays: Number(validDays),
        name: name.trim() || undefined,
        recipient: who === "member" ? { userId: member!._id } : { phone, name: toName },
      }),
    });
    setBusy(false);
    if (!r.ok || !r.data) return setMsg({ ok: false, text: r.message || "보내지 못했어요." });
    if (r.data.kind === "member") setMsg({ ok: true, text: `${r.data.to || member?.name}님 쿠폰함에 「${r.data.name}」을 넣었어요.` });
    else setMsg({ ok: r.data.sent !== false, text: r.data.sent === false ? "선물을 만들었지만 문자 발송에 실패했어요. 아래 목록에서 다시 보내 주세요." : `선물 문자를 보냈어요 (끝번호 ${phone.replace(/\D/g, "").slice(-4)}).` });
    setPhone("");
    setToName("");
    setMember(null);
    loadGifts();
  };

  const act = async (g: GiftRow, what: "resend" | "cancel") => {
    if (what === "cancel" && !window.confirm("이 선물을 취소할까요? 링크가 막히고 쿠폰도 꺼져요.")) return;
    const r = await apiRequest(`/api/admin/coupons/gifts/${g.id}/${what}`, { method: "POST" });
    setMsg({ ok: r.ok, text: r.ok ? (what === "resend" ? "다시 보냈어요." : "취소했어요.") : r.message || "처리하지 못했어요." });
    loadGifts();
  };

  const pill = (on: boolean) => cx("h-10 cursor-pointer rounded-xl px-4 text-sm font-semibold", on ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)] text-[var(--foreground)]");

  return (
    <div className="px-4 py-8 sm:px-6">
      <p className="text-xs font-semibold text-[var(--foreground-subtle)]">
        <Link href="/admin/coupons" className="hover:text-[var(--foreground)]">
          쿠폰
        </Link>{" "}
        ›
      </p>
      <h1 className="font-display text-2xl text-[var(--foreground)]">쿠폰 보내기</h1>
      <p className="mt-1 text-sm text-[var(--foreground-muted)]">상품 하나와 혜택을 정해 바로 보내요. 회원은 쿠폰함으로, 회원이 아니면 휴대폰으로 선물 링크가 가요.</p>

      <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="font-bold">① 상품</h2>
            {!items ? (
              <Skeleton className="mt-3 h-11" />
            ) : (
              <select value={itemId} onChange={(e) => setItemId(e.target.value)} className="mt-3 h-11 w-full rounded-xl border border-[var(--border)] px-3">
                {(["assessment", "course", "program"] as const).map((t) => {
                  const list = items.filter((i) => i.type === t);
                  return list.length ? (
                    <optgroup key={t} label={TYPE_LABEL[t]}>
                      {list.map((i) => (
                        <option key={i.id} value={i.id}>
                          {i.title}
                        </option>
                      ))}
                    </optgroup>
                  ) : null;
                })}
              </select>
            )}
            <p className="mt-2 text-xs text-[var(--foreground-subtle)]">심리상담은 지금 카페24에서만 판매해서 사이트 쿠폰 대상에 없어요.</p>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">② 혜택</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={pill(kind === "free")} onClick={() => setKind("free")}>
                무료 (100%)
              </button>
              <button type="button" className={pill(kind === "percent")} onClick={() => setKind("percent")}>
                % 할인
              </button>
              <button type="button" className={pill(kind === "amount")} onClick={() => setKind("amount")}>
                원 할인
              </button>
              {kind !== "free" && (
                <input
                  value={value}
                  onChange={(e) => setValue(e.target.value.replace(/\D/g, ""))}
                  inputMode="numeric"
                  placeholder={kind === "percent" ? "예: 30" : "예: 30000"}
                  aria-label={kind === "percent" ? "할인율(%)" : "할인 금액(원)"}
                  className="h-10 w-32 rounded-xl border border-[var(--border)] px-3"
                />
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm font-medium">
                쓸 수 있는 기간 (일)
                <input value={validDays} onChange={(e) => setValidDays(e.target.value.replace(/\D/g, ""))} inputMode="numeric" className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3" />
              </label>
              <label className="text-sm font-medium">
                쿠폰 이름 (선택)
                <input value={name} onChange={(e) => setName(e.target.value)} maxLength={80} placeholder={`${item?.title ?? ""} ${benefit} 쿠폰`} className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3" />
              </label>
            </div>
          </section>

          <section className="card space-y-4 p-5">
            <h2 className="font-bold">③ 받는 사람</h2>
            <div className="flex gap-2">
              <button type="button" className={pill(who === "phone")} onClick={() => setWho("phone")}>
                휴대폰 번호 (비회원)
              </button>
              <button type="button" className={pill(who === "member")} onClick={() => setWho("member")}>
                회원 검색
              </button>
            </div>
            {who === "phone" ? (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="text-sm font-medium">
                  휴대폰 번호
                  <input value={phone} onChange={(e) => setPhone(e.target.value)} inputMode="numeric" placeholder="010-0000-0000" className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3" />
                </label>
                <label className="text-sm font-medium">
                  부를 이름 (선택)
                  <input value={toName} onChange={(e) => setToName(e.target.value)} maxLength={40} placeholder="예: 이서윤" className="mt-1 h-11 w-full rounded-xl border border-[var(--border)] px-3" />
                </label>
                <p className="text-xs text-[var(--foreground-subtle)] sm:col-span-2">번호는 선물을 보내는 데만 쓰고, 받거나 만료·취소되면 지워요(끝 4자리만 남김).</p>
              </div>
            ) : (
              <div>
                <form onSubmit={search} className="flex gap-2">
                  <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름 또는 이메일" className="h-11 flex-1 rounded-xl border border-[var(--border)] px-3" />
                  <button className="h-11 cursor-pointer rounded-xl bg-[var(--foreground)] px-4 text-sm font-semibold text-white">검색</button>
                </form>
                {member ? (
                  <p className="mt-3 flex items-center justify-between rounded-xl bg-[var(--brand-light)] px-4 py-3 text-sm">
                    <span>
                      <b>{member.name}</b> · {member.email}
                    </span>
                    <button onClick={() => setMember(null)} className="cursor-pointer text-[var(--foreground-subtle)] underline">
                      바꾸기
                    </button>
                  </p>
                ) : (
                  found && (
                    <ul className="mt-3 divide-y divide-[var(--border-light)] rounded-xl border border-[var(--border-light)]">
                      {found.length === 0 && <li className="px-4 py-3 text-sm text-[var(--foreground-subtle)]">찾는 회원이 없어요.</li>}
                      {found.map((m) => (
                        <li key={m._id}>
                          <button onClick={() => setMember(m)} className="flex w-full cursor-pointer justify-between px-4 py-3 text-left text-sm hover:bg-[var(--surface)]">
                            <b>{m.name}</b>
                            <span className="text-[var(--foreground-subtle)]">{m.email}</span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  )
                )}
              </div>
            )}
          </section>
        </div>

        <aside className="card h-fit space-y-3 p-5 lg:sticky lg:top-24">
          <h2 className="font-bold">보낼 내용</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-[var(--foreground-subtle)]">상품</dt>
              <dd className="font-semibold">{item?.title ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-subtle)]">혜택</dt>
              <dd className="font-semibold">
                {benefit} · {validDays || "?"}일
              </dd>
            </div>
            <div>
              <dt className="text-[var(--foreground-subtle)]">받는 사람</dt>
              <dd className="font-semibold">{who === "member" ? (member ? `${member.name} (회원)` : "—") : phone ? `${toName || "이름 없음"} · ${phone}` : "—"}</dd>
            </div>
          </dl>
          <button onClick={send} disabled={busy} className="h-12 w-full cursor-pointer rounded-xl bg-[var(--brand)] font-bold text-white disabled:opacity-60">
            {busy ? "보내는 중…" : who === "member" ? "쿠폰함에 넣기" : "선물 문자 보내기"}
          </button>
          {msg && <p className={cx("text-sm", msg.ok ? "text-[var(--brand)]" : "text-[var(--error)]")}>{msg.text}</p>}
        </aside>
      </div>

      <section className="mt-10">
        <h2 className="mb-3 font-bold">선물 목록 (비회원)</h2>
        {!gifts ? (
          <Skeleton className="h-24" />
        ) : gifts.length === 0 ? (
          <EmptyState title="보낸 선물이 없어요" />
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-[var(--border-light)] bg-white">
            <table className="w-full min-w-[720px] text-sm">
              <thead className="bg-[var(--surface)] text-left text-xs text-[var(--foreground-subtle)]">
                <tr>
                  <th className="px-4 py-3">받는 사람</th>
                  <th className="px-4 py-3">쿠폰</th>
                  <th className="px-4 py-3">상태</th>
                  <th className="px-4 py-3">기한</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {gifts.map((g) => (
                  <tr key={g.id} className="border-t border-[var(--border-light)]">
                    <td className="px-4 py-3">
                      {g.recipientName || "이름 없음"} <span className="text-xs text-[var(--foreground-subtle)]">끝번호 {g.phoneLast4}</span>
                      {g.claimedBy && <p className="text-xs text-[var(--foreground-subtle)]">받은 계정: {g.claimedBy.name}</p>}
                    </td>
                    <td className="px-4 py-3">
                      <p>{g.couponName}</p>
                      <p className="text-xs text-[var(--foreground-subtle)]">{g.benefit}</p>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={STATE[g.state].tone}>{STATE[g.state].label}</Badge>
                      {g.lastSendResult === "failed" && <p className="mt-1 text-xs text-[var(--error)]">문자 실패</p>}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--foreground-muted)]">
                      {fmt(g.createdAt)} 보냄 · {fmt(g.expiresAt)}까지
                    </td>
                    <td className="px-4 py-3 text-right">
                      {g.state === "sent" && (
                        <span className="flex justify-end gap-2">
                          <button onClick={() => act(g, "resend")} className="h-8 cursor-pointer rounded-lg bg-[var(--surface)] px-3 text-xs font-semibold">
                            다시 보내기
                          </button>
                          <button onClick={() => act(g, "cancel")} className="h-8 cursor-pointer rounded-lg px-3 text-xs font-semibold text-[var(--error)] hover:bg-red-50">
                            취소
                          </button>
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
