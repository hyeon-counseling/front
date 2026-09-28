"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui";

const MAX_BYTES = 2 * 1024 * 1024;
const TYPES = ["image/jpeg", "image/png", "image/webp"];
export const COVER_GUIDE = "권장 1600×900px (가로:세로 16:9) · JPG·PNG·WebP · 2MB 이하";

/** 이미지 크기 읽기 (올리기 전에 권장 크기 안내용) */
function readSize(file: File): Promise<{ w: number; h: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      resolve({ w: img.naturalWidth, h: img.naturalHeight });
      URL.revokeObjectURL(url);
    };
    img.onerror = () => {
      resolve(null);
      URL.revokeObjectURL(url);
    };
    img.src = url;
  });
}

/**
 * 표지 이미지 — 파일을 고르면 R2에 올리고 주소를 자동으로 넣는다 (관리자 강의·과정 편집)
 */
export function CoverImageField({ value, onChange, label = "표지 이미지" }: { value: string | null | undefined; onChange: (url: string | null) => void; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const pick = async (file: File | undefined) => {
    if (!file) return;
    setError("");
    setNotice("");
    if (!TYPES.includes(file.type)) return setError("JPG·PNG·WebP 이미지만 올릴 수 있어요.");
    if (file.size > MAX_BYTES) return setError(`2MB 이하만 올릴 수 있어요. (지금 ${(file.size / 1024 / 1024).toFixed(1)}MB — 이미지 크기를 줄이거나 JPG·WebP로 저장해 주세요)`);
    const size = await readSize(file);
    const tips: string[] = [];
    if (size && size.w < 1200) tips.push(`가로가 ${size.w}px라 큰 화면에서 흐려 보일 수 있어요`);
    if (size && Math.abs(size.w / size.h - 16 / 9) > 0.08) tips.push("16:9가 아니라 위아래나 양옆이 잘려 보일 수 있어요");

    setBusy(true);
    const form = new FormData();
    form.append("file", file);
    try {
      const token = localStorage.getItem("token");
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/media/cover`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      const body = await res.json().catch(() => null);
      if (!res.ok || !body?.success) {
        setError(body?.message || "올리지 못했어요. 잠시 후 다시 시도해 주세요.");
        return;
      }
      onChange(body.data.url);
      setNotice(tips.length ? `올렸어요. 다만 ${tips.join(", ")}.` : "올렸어요. 저장을 눌러야 반영돼요.");
    } catch {
      setError("올리지 못했어요. 인터넷 연결을 확인해 주세요.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  };

  return (
    <div>
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="bg-brand-gradient relative aspect-[16/9] w-full shrink-0 overflow-hidden rounded-xl sm:w-48">
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={value} alt="표지 미리보기" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-xs font-semibold text-white/80">표지 없음 (기본 색)</span>
          )}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="secondary" loading={busy} onClick={() => input.current?.click()}>
              {value ? "다른 이미지로 바꾸기" : "이미지 올리기"}
            </Button>
            {value && (
              <Button size="sm" variant="secondary" onClick={() => onChange(null)}>
                빼기
              </Button>
            )}
          </div>
          <p className="text-xs text-[var(--foreground-subtle)]">{COVER_GUIDE}</p>
          {notice && <p className="text-xs text-[var(--foreground-muted)]">{notice}</p>}
          {error && <p className="text-xs text-[var(--error)]">{error}</p>}
        </div>
      </div>
      <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
    </div>
  );
}
