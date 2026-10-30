// 판(플레이트) 그림 — 썸네일 C '세 층' 형태 언어 (70·71 시안 p-tci / p-mmpi / p-sct / p-stack)
// TCI 진한 그린 · MMPI-2 민트 · SCT 코랄. stack = 아래부터 MMPI-2 · TCI · SCT 세 장
type Kind = "tci" | "mmpi" | "sct";

const COLORS: Record<Kind, [string, string, string]> = {
  // [왼쪽 옆면, 오른쪽 옆면, 윗면]
  tci: ["#24564A", "#1F3A33", "#2F6B5A"],
  mmpi: ["#7CC2A8", "#5FAE92", "#9FD6C2"],
  sct: ["#E57A5A", "#D4694A", "#F08A6C"],
};

function PlateShape({ kind }: { kind: Kind }) {
  const [l, r, top] = COLORS[kind];
  return (
    <>
      <path d="M8 34l52 26v12L8 46z" fill={l} />
      <path d="M112 34L60 60v12l52-26z" fill={r} />
      <path d="M60 8l52 26-52 26L8 34z" fill={top} />
      {kind === "sct" && <path d="M52 18l20 10M44 24l10 5" stroke="#FBF8F3" strokeOpacity=".6" strokeWidth="2.5" strokeLinecap="round" />}
    </>
  );
}

export function Plate({ kind, className, label }: { kind: Kind | "stack"; className?: string; label?: string }) {
  const a11y = label ? { role: "img" as const, "aria-label": label } : { "aria-hidden": true as const };
  if (kind === "stack") {
    return (
      <svg viewBox="0 0 120 154" className={className} {...a11y}>
        <g transform="translate(0 78)">
          <PlateShape kind="tci" />
        </g>
        <g transform="translate(0 40)">
          <PlateShape kind="mmpi" />
        </g>
        <g transform="translate(0 2)">
          <PlateShape kind="sct" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 120 80" className={className} {...a11y}>
      <PlateShape kind={kind} />
    </svg>
  );
}
