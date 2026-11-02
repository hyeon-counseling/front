"use client";

import { useRef, useState } from "react";
import { apiRequest } from "@/lib/api";

/**
 * 관리자 · 보고서와 해석 영상 — 올리기 → 미리 보기 → [전달 완료](공개·7단계·N9·작업 기록)
 * 전달 완료 전에는 고객에게 보이지 않는다.
 */
interface Props {
  id: string;
  report: { name: string; size: number; uploadedAt: string } | null;
  interpretVideoUrl: string | null;
  publishedAt: string | null;
  sessionAt: string | null;
  closed: string | null;
  onChanged: () => void;
  onToast: (m: string) => void;
}

const fmt = (iso: string) => new Date(iso).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

export function ReportBox({ id, report, interpretVideoUrl, publishedAt, sessionAt, closed, onChanged, onToast }: Props) {
  const base = `/api/admin/assessment/applications/${id}`;
  const [video, setVideo] = useState(interpretVideoUrl ?? "");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const upload = async (file: File) => {
    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}${base}/report`, { method: "POST", headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
      const body = await res.json().catch(() => ({}));
      if (res.ok && body.success) {
        setPreview(null);
        onToast("보고서를 올렸어요. 전달 완료 전까지 고객에게 보이지 않아요.");
        onChanged();
      } else onToast(body.message || "올리지 못했어요.");
    } catch {
      onToast("서버와 연결할 수 없어요.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const saveVideo = async () => {
    setBusy(true);
    const r = await apiRequest<{ interpretVideoUrl: string | null }>(`${base}/report-video`, { method: "PUT", body: JSON.stringify({ url: video }) });
    setBusy(false);
    if (r.ok) {
      setVideo(r.data?.interpretVideoUrl ?? "");
      onToast(r.data?.interpretVideoUrl ? "영상 링크를 저장했어요." : "영상 링크를 지웠어요.");
      onChanged();
    } else onToast(r.message || "저장하지 못했어요.");
  };

  const openPreview = async () => {
    const r = await apiRequest<{ html: string }>(`${base}/report`);
    if (r.ok && r.data) setPreview(r.data.html);
    else onToast(r.message || "불러오지 못했어요.");
  };

  const publish = async () => {
    const missing = [!report && "보고서", !interpretVideoUrl && "해석 영상"].filter(Boolean).join("");
    const ask = `${missing ? `⚠️ ${missing}이 없어요. 그래도 ` : ""}전달 완료할까요?\n고객에게 공개되고${closed ? "" : " 보고서 전달 알림(N9)이 나가요"}. 알림은 되돌릴 수 없어요.`;
    if (!confirm(ask)) return;
    setBusy(true);
    const r = await apiRequest<{ notice: { sent: boolean; reason?: string } | null }>(`${base}/publish`, { method: "POST" });
    setBusy(false);
    if (!r.ok) return onToast(r.message || "전달하지 못했어요.");
    onToast(r.data?.notice === null ? "공개했어요. 닫힌 신청이라 알림은 보내지 않았어요. 직접 안내해 주세요." : r.data?.notice?.sent ? "전달 완료했어요. N9를 보냈어요." : r.data?.notice?.reason === "duplicate" ? "공개했어요. N9는 전에 이미 보내서 다시 보내지 않았어요." : `공개했어요. 다만 N9가 나가지 않았어요(${r.data?.notice?.reason ?? "이유 모름"}). 직접 안내하거나 다시 보내 주세요.`);
    onChanged();
  };

  const unpublish = async () => {
    if (!confirm("전달을 취소할까요? 고객 화면에서 내려가요. 이미 나간 알림은 되돌릴 수 없어요.")) return;
    setBusy(true);
    const r = await apiRequest(`${base}/unpublish`, { method: "POST" });
    setBusy(false);
    if (r.ok) {
      onToast("전달을 취소했어요.");
      onChanged();
    } else onToast(r.message || "취소하지 못했어요.");
  };

  const early = !closed && (!sessionAt || new Date(sessionAt) > new Date());
  const btn = "h-10 cursor-pointer rounded-xl border border-[var(--border)] bg-white px-4 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--surface)] disabled:opacity-50";

  return (
    <section className="rounded-2xl border border-[var(--border)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-bold text-[var(--foreground)]">보고서와 해석 영상</h3>
        <span className={publishedAt ? "text-xs font-bold text-[var(--brand)]" : "text-xs text-[var(--foreground-subtle)]"}>{publishedAt ? `전달 완료 ${fmt(publishedAt)}` : "고객에게 아직 안 보여요"}</span>
      </div>

      <p className="mb-1.5 text-xs font-semibold text-[var(--foreground-muted)]">보고서 (HTML 파일, 5MB까지)</p>
      {report && (
        <p className="mb-2 text-xs text-[var(--foreground-subtle)]">
          {report.name} · {Math.round(report.size / 1024)}KB · {fmt(report.uploadedAt)} 올림
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <input ref={fileRef} type="file" accept=".html,.htm,text/html" className="hidden" onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
        <button type="button" disabled={busy} onClick={() => fileRef.current?.click()} className={btn}>
          {report ? "다시 올리기" : "파일 올리기"}
        </button>
        {report && (
          <button type="button" disabled={busy} onClick={preview ? () => setPreview(null) : openPreview} className={btn}>
            {preview ? "미리 보기 닫기" : "미리 보기"}
          </button>
        )}
      </div>
      {preview && <iframe title="보고서 미리 보기" srcDoc={preview} sandbox="allow-scripts allow-modals" className="mt-3 h-[60vh] w-full rounded-xl border border-[var(--border-light)] bg-white" />}

      <p className="mb-1.5 mt-4 text-xs font-semibold text-[var(--foreground-muted)]">해석 영상 (유튜브 일부공개 링크)</p>
      <div className="flex gap-2">
        <input value={video} onChange={(e) => setVideo(e.target.value)} placeholder="https://youtu.be/..." className="h-10 min-w-0 flex-1 rounded-xl border border-[var(--border)] bg-white px-3 text-sm outline-none" />
        <button type="button" disabled={busy || video.trim() === (interpretVideoUrl ?? "")} onClick={saveVideo} className={btn}>
          저장
        </button>
      </div>
      <p className="mt-2 rounded-xl bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-800">
        일부공개는 링크를 아는 사람이면 볼 수 있어요. 영상에 <b>이름·얼굴·연락처를 넣지 말아 주세요.</b> 유튜브에서 「퍼가기 허용」을 켜 두어야 재생돼요. 고객이 탈퇴해도 유튜브 영상은 직접 지워 주세요.
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-[var(--border-light)] pt-4">
        {publishedAt ? (
          <button type="button" disabled={busy} onClick={unpublish} className={btn}>
            전달 취소
          </button>
        ) : (
          <button type="button" disabled={busy || early || (!report && !interpretVideoUrl) || closed === "refunded"} onClick={publish} className="h-11 cursor-pointer rounded-xl bg-[var(--brand)] px-5 text-sm font-semibold text-white hover:bg-[var(--brand-hover)] disabled:opacity-50">
            전달 완료
          </button>
        )}
        {!publishedAt && early && <span className="text-xs text-[var(--foreground-subtle)]">해석 상담이 끝난 뒤에 누를 수 있어요.</span>}
        {!publishedAt && !early && !!(report || interpretVideoUrl) && !(report && interpretVideoUrl) && <span className="text-xs text-amber-700">{report ? "해석 영상" : "보고서"}이 아직 없어요. 하나만 있어도 전달할 수 있어요.</span>}
      </div>
    </section>
  );
}
