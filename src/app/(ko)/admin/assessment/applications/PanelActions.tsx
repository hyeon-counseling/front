"use client";

import { useState } from "react";
import { apiRequest } from "@/lib/api";
import { cx } from "@/components/ui";

/**
 * 신청 상세 패널의 일 처리 부분 — 검사 3종(링크 입력·완료 체크) · 장소/화상 링크 · 알림 다시 보내기 · 취소
 * 검사 순서는 MMPI → TCI → SCT (10/29 확정)
 */
export interface TestDetail {
  collected: boolean;
  source: string | null;
  issuedAt: string | null;
  doneAt: string | null;
  doneBy: string | null;
}

const TESTS = [
  { key: "mmpi3", label: "MMPI-3", site: "마음사랑", ph: "https://mtest.kr/?u=…" },
  { key: "tci", label: "TCI", site: "마음사랑", ph: "https://mtest.kr/?u=…" },
  { key: "sct", label: "SCT", site: "인싸이트", ph: "https://www.inpsyt.co.kr/inpsyt/testing/…" },
] as const;

const CODES: [string, string][] = [
  ["N1", "N1 신청 완료"],
  ["N2", "N2 접수면접지 안내"],
  ["N3", "N3 접수면접지 받음"],
  ["N4", "N4 검사 링크"],
  ["N5", "N5 검사 미완료"],
  ["N6", "N6 검사 완료"],
  ["N7", "N7 일정 재조정"],
  ["N8P", "N8-0 장소 확정 (D-3)"],
  ["N8A", "N8-1 하루 전 · 대면"],
  ["N8B", "N8-2 하루 전 · 화상"],
];

const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" });

export function TestsBox({ id, tests, onChanged }: { id: string; tests: Record<string, TestDetail>; onChanged: () => void }) {
  const [edit, setEdit] = useState<string | null>(null);
  const [url, setUrl] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  const saveLink = async (test: string) => {
    setBusy(true);
    setMsg("");
    const r = await apiRequest(`/api/admin/assessment/applications/${id}/link`, { method: "POST", body: JSON.stringify({ test, url }) });
    setBusy(false);
    if (!r.ok) return setMsg(r.message || "저장하지 못했어요.");
    setEdit(null);
    setUrl("");
    onChanged();
  };
  const toggleDone = async (test: string, done: boolean) => {
    setMsg("");
    const r = await apiRequest<{ allDone: boolean }>(`/api/admin/assessment/applications/${id}/done`, { method: "POST", body: JSON.stringify({ test, done }) });
    if (!r.ok) return setMsg(r.message || "저장하지 못했어요.");
    if (r.data?.allDone) setMsg("3종 완료 — 내일 아침 8시에 완료 안내(N6)가 가요.");
    onChanged();
  };

  return (
    <section>
      <h3 className="mb-3 text-sm font-bold text-[var(--foreground)]">검사 3종</h3>
      <ul className="space-y-2">
        {TESTS.map((t) => {
          const d = tests?.[t.key];
          return (
            <li key={t.key} className="rounded-xl border border-[var(--border-light)] p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">
                  {t.label} <span className="text-xs font-normal text-[var(--foreground-subtle)]">{t.site}</span>
                </p>
                <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input type="checkbox" checked={!!d?.doneAt} onChange={(e) => toggleDone(t.key, e.target.checked)} className="h-4 w-4 accent-[var(--brand)]" />
                  완료
                </label>
              </div>
              <p className="mt-1 text-xs text-[var(--foreground-subtle)]">
                {d?.issuedAt ? `발급 ${fmt(d.issuedAt)} · ` : "발급 전 · "}
                {d?.collected ? `링크 모임(${d.source === "gmail" ? "메일" : "직접 입력"})` : "링크 없음"}
                {d?.doneAt && ` · 완료 ${fmt(d.doneAt)}${d.doneBy === "service" ? " (예약 작업)" : d.doneBy === "auto" ? " (메일)" : ""}`}
              </p>
              {edit === t.key ? (
                <div className="mt-2 flex gap-2">
                  <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder={t.ph} aria-label={`${t.label} 검사 링크`} className="h-9 min-w-0 flex-1 rounded-lg border border-[var(--border)] px-2 text-xs" />
                  <button disabled={busy} onClick={() => saveLink(t.key)} className="h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-3 text-xs font-semibold text-white">
                    저장
                  </button>
                  <button onClick={() => setEdit(null)} className="h-9 cursor-pointer rounded-lg px-2 text-xs text-[var(--foreground-subtle)]">
                    취소
                  </button>
                </div>
              ) : (
                <button onClick={() => (setEdit(t.key), setUrl(""))} className="mt-1 cursor-pointer text-xs font-semibold text-[var(--brand)]">
                  {d?.collected ? "링크 바꾸기" : "링크 직접 넣기"}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {msg && <p className="mt-2 text-xs text-[var(--brand)]">{msg}</p>}
      <p className="mt-2 text-[11px] text-[var(--foreground-subtle)]">링크는 암호로 바꿔 저장하고, 고객에게는 알림톡의 [MMPI 검사]·[TCI 검사]·[SCT 검사] 버튼으로만 보여요.</p>
    </section>
  );
}

export function PlaceBox({
  id,
  method,
  place,
  videoLink,
  onChanged,
}: {
  id: string;
  method: "offline" | "online";
  place: { name: string; address: string; mapUrl: string } | null;
  videoLink: string | null;
  onChanged: () => void;
}) {
  const [name, setName] = useState(place?.name ?? "");
  const [address, setAddress] = useState(place?.address ?? "");
  const [mapUrl, setMapUrl] = useState(place?.mapUrl ?? "");
  const [video, setVideo] = useState(videoLink ?? "");
  const [msg, setMsg] = useState("");

  const save = async () => {
    setMsg("");
    const body = method === "offline" ? { place: { name, address, mapUrl } } : { videoLink: video };
    const r = await apiRequest(`/api/admin/assessment/applications/${id}`, { method: "PATCH", body: JSON.stringify(body) });
    setMsg(r.ok ? "저장했어요." : r.message || "저장하지 못했어요.");
    if (r.ok) onChanged();
  };
  const field = "h-9 w-full rounded-lg border border-[var(--border)] px-2 text-sm";
  return (
    <section>
      <h3 className="mb-2 text-sm font-bold text-[var(--foreground)]">{method === "offline" ? "상담 장소 (3일 전 안내)" : "화상 링크 (하루 전 안내)"}</h3>
      {method === "offline" ? (
        <div className="space-y-2">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="스터디룸 이름·호실" aria-label="장소 이름" className={field} />
          <input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="주소" aria-label="주소" className={field} />
          <input value={mapUrl} onChange={(e) => setMapUrl(e.target.value)} placeholder="지도 링크 (선택, https://…)" aria-label="지도 링크" className={field} />
        </div>
      ) : (
        <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://… (줌·구글 미트 등)" aria-label="화상 링크" className={field} />
      )}
      <button onClick={save} className="mt-2 h-9 cursor-pointer rounded-lg bg-[var(--foreground)] px-4 text-sm font-semibold text-white">
        저장
      </button>
      {msg && <span className="ml-2 text-xs text-[var(--brand)]">{msg}</span>}
    </section>
  );
}

export function ResendBox({ id, onChanged }: { id: string; onChanged: () => void }) {
  const [code, setCode] = useState("N1");
  const [msg, setMsg] = useState("");
  const send = async () => {
    if (!window.confirm(`${code} 알림을 지금 다시 보낼까요? (고객에게 실제로 가요)`)) return;
    const r = await apiRequest<{ sent: boolean; reason?: string }>(`/api/admin/assessment/applications/${id}/notice`, { method: "POST", body: JSON.stringify({ code }) });
    setMsg(r.ok && r.data?.sent ? "보냈어요." : `보내지 못했어요${r.data?.reason ? ` (${r.data.reason})` : ""}.`);
    onChanged();
  };
  return (
    <div className="mt-3 flex items-center gap-2">
      <select value={code} onChange={(e) => setCode(e.target.value)} aria-label="다시 보낼 알림" className="h-9 rounded-lg border border-[var(--border)] px-2 text-sm">
        {CODES.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <button onClick={send} className="h-9 cursor-pointer rounded-lg bg-[var(--surface)] px-3 text-sm font-semibold">
        다시 보내기
      </button>
      {msg && <span className="text-xs text-[var(--foreground-muted)]">{msg}</span>}
    </div>
  );
}

export function CancelBox({ id, closed, onChanged }: { id: string; closed: string | null; onChanged: () => void }) {
  const [msg, setMsg] = useState("");
  if (closed) return null;
  const cancel = async () => {
    if (!window.confirm("이 신청을 취소할까요? 잡아 둔 상담 시간이 다시 열려요. (환불은 결제·주문 화면에서 따로)")) return;
    const r = await apiRequest(`/api/admin/assessment/applications/${id}`, { method: "PATCH", body: JSON.stringify({ cancel: true }) });
    setMsg(r.ok ? "취소했어요." : r.message || "취소하지 못했어요.");
    onChanged();
  };
  return (
    <section className="border-t border-[var(--border-light)] pt-4">
      <button onClick={cancel} className={cx("h-9 cursor-pointer rounded-lg px-3 text-sm font-semibold text-[var(--error)] hover:bg-red-50")}>
        신청 취소
      </button>
      {msg && <span className="ml-2 text-xs">{msg}</span>}
    </section>
  );
}
