// 종합심리검사 상세 화면 삽화 (70 시안 인라인 SVG를 그대로 옮김)
import { Plate } from "./Plate";

const FONT = "Pretendard Variable, Pretendard, sans-serif";

/** 첫 화면 — 썸네일 C: 아래부터 TCI(진한 그린) · MMPI-3(민트) · SCT(코랄) 판 세 장 */
export function HeroLayersArt({ className }: { className?: string }) {
  return (
    <svg viewBox="40 60 640 690" className={className} role="img" aria-label="아래부터 TCI 타고난 기질, MMPI-3 지금의 나, SCT 내 말로 쓴 마음 판 세 장이 쌓인 그림">
      <g>
        <polygon points="120,580 350,695 350,719 120,604" fill="#24564a" />
        <polygon points="580,580 350,695 350,719 580,604" fill="#1f3a33" />
        <polygon points="350,465 580,580 350,695 120,580" fill="#2F6B5A" />
      </g>
      <g>
        <polygon points="120,390 350,505 350,529 120,414" fill="#7cc2a8" />
        <polygon points="580,390 350,505 350,529 580,414" fill="#5fae92" />
        <polygon points="350,275 580,390 350,505 120,390" fill="#9FD6C2" />
      </g>
      <g>
        <polygon points="120,200 350,315 350,339 120,224" fill="#e57a5a" />
        <polygon points="580,200 350,315 350,339 580,224" fill="#d4694a" />
        <polygon points="350,85 580,200 350,315 120,200" fill="#F08A6C" />
        <g stroke="#FBF8F3" strokeOpacity=".55" strokeWidth="7" strokeLinecap="round">
          <line x1="318" y1="118" x2="410" y2="164" />
          <line x1="282" y1="136" x2="330" y2="160" />
        </g>
      </g>
      <path d="M610 70 l9 25 25 9 -25 9 -9 25 -9 -25 -25 -9 25 -9z" fill="#F08A6C" />
      <path d="M70 330 l6 17 17 6 -17 6 -6 17 -6 -17 -17 -6 17 -6z" fill="#2F6B5A" />
      <path d="M628 470 l5 13 13 5 -13 5 -5 13 -5 -13 -13 -5 13 -5z" fill="#5FAE92" />
      <g fontFamily={FONT} fontWeight="800" textAnchor="middle">
        <rect x="148" y="176" width="404" height="64" rx="32" fill="#1f3a33" opacity=".12" transform="translate(0 6)" />
        <rect x="148" y="176" width="404" height="64" rx="32" fill="#fff" />
        <text x="350" y="220" fontSize="36" fill="#1f3a33">
          <tspan fill="#e0704f" fontWeight="900">SCT</tspan> 내 말로 쓴 마음
        </text>
        <rect x="168" y="366" width="364" height="64" rx="32" fill="#1f3a33" opacity=".12" transform="translate(0 6)" />
        <rect x="168" y="366" width="364" height="64" rx="32" fill="#fff" />
        <text x="350" y="410" fontSize="36" fill="#1f3a33">
          <tspan fill="#3f9c7e" fontWeight="900">MMPI-3</tspan> 지금의 나
        </text>
        <rect x="186" y="556" width="328" height="64" rx="32" fill="#1f3a33" opacity=".12" transform="translate(0 6)" />
        <rect x="186" y="556" width="328" height="64" rx="32" fill="#fff" />
        <text x="350" y="600" fontSize="36" fill="#1f3a33">
          <tspan fill="#2F6B5A" fontWeight="900">TCI</tspan> 타고난 기질
        </text>
      </g>
    </svg>
  );
}

function SpreadPlate({ dy, l, r, top, lines }: { dy: number; l: string; r: string; top: string; lines?: boolean }) {
  return (
    <g transform={`translate(0 ${dy})`}>
      <polygon points="40,86 180,156 180,172 40,102" fill={l} />
      <polygon points="320,86 180,156 180,172 320,102" fill={r} />
      <polygon points="180,16 320,86 180,156 40,86" fill={top} />
      {lines && (
        <g stroke="#FBF8F3" strokeOpacity=".55" strokeWidth="5" strokeLinecap="round">
          <line x1="160" y1="40" x2="216" y2="68" />
          <line x1="138" y1="52" x2="168" y2="67" />
        </g>
      )}
    </g>
  );
}

/** '세 겹' 섹션 — 같은 판 세 장을 위아래로 벌려 놓은 그림 */
export function SpreadLayersArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 360 446" className={className} role="img" aria-label="판 세 장을 위아래로 벌려 놓은 그림: 위 SCT 내 말, 가운데 MMPI-3 지금, 아래 TCI 바탕">
      <g stroke="#2F6B5A" strokeOpacity=".35" strokeWidth="2" strokeDasharray="3 7" strokeLinecap="round">
        <line x1="40" y1="96" x2="40" y2="346" />
        <line x1="320" y1="96" x2="320" y2="346" />
        <line x1="180" y1="166" x2="180" y2="404" />
      </g>
      <SpreadPlate dy={260} l="#24564a" r="#1f3a33" top="#2F6B5A" />
      <SpreadPlate dy={130} l="#7cc2a8" r="#5fae92" top="#9FD6C2" />
      <SpreadPlate dy={0} l="#e57a5a" r="#d4694a" top="#F08A6C" lines />
      <g fontFamily={FONT} fontWeight="900" textAnchor="middle" fontSize="20">
        <rect x="128" y="70" width="104" height="36" rx="18" fill="#fff" />
        <text x="180" y="95" fill="#e0704f">SCT</text>
        <rect x="118" y="200" width="124" height="36" rx="18" fill="#fff" />
        <text x="180" y="225" fill="#237A5E">MMPI-3</text>
        <rect x="133" y="330" width="94" height="36" rx="18" fill="#fff" />
        <text x="180" y="355" fill="#2F6B5A">TCI</text>
      </g>
      <path d="M330 20 l6 16 16 6 -16 6 -6 16 -6 -16 -16 -6 16 -6z" fill="#F08A6C" />
      <path d="M18 196 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z" fill="#2F6B5A" />
    </svg>
  );
}

/** 해석 영상 장면 그림 (등불과 벽돌길) — 샘플 영상이 아직 없어 재생 버튼 없이 그림만 */
export function VideoSceneArt({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 320 180" className={className} role="img" aria-label="등불과 벽돌길이 그려진 해석 영상 장면">
      <defs>
        <radialGradient id="as-vglow" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#FFE7A3" />
          <stop offset="1" stopColor="#FFE7A3" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="320" height="180" fill="#FBF3E4" />
      <path d="M0 132 Q 90 104 170 122 T 320 112 V180 H0z" fill="#CDEBDD" />
      <path d="M0 150 Q 110 128 200 146 T 320 140 V180 H0z" fill="#A8E0CA" />
      <g fill="#F4C7A6">
        <rect x="70" y="150" width="20" height="9" rx="2" />
        <rect x="96" y="146" width="20" height="9" rx="2" />
        <rect x="122" y="144" width="20" height="9" rx="2" />
        <rect x="148" y="144" width="20" height="9" rx="2" />
        <rect x="174" y="146" width="20" height="9" rx="2" />
      </g>
      <circle cx="82" cy="64" r="40" fill="url(#as-vglow)" />
      <rect x="80" y="70" width="4" height="74" rx="2" fill="#24322E" />
      <rect x="72" y="52" width="20" height="22" rx="5" fill="#FFD36E" stroke="#24322E" strokeWidth="2.5" />
      <path d="M70 52h24l-4-7H74z" fill="#24322E" />
      <rect x="226" y="96" width="50" height="40" rx="4" fill="#fff" stroke="#24322E" strokeWidth="2.5" />
      <path d="M218 100l33-26 33 26z" fill="#F08A6C" stroke="#24322E" strokeWidth="2.5" strokeLinejoin="round" />
      <rect x="244" y="112" width="14" height="24" rx="3" fill="#2F6B5A" />
      <rect x="232" y="104" width="9" height="9" rx="2" fill="#FFD36E" />
      <text x="12" y="20" fontFamily={FONT} fontSize="10" fontWeight="700" fill="#46524E">
        심리상담실 현 · 해석 영상
      </text>
      <text x="308" y="20" textAnchor="end" fontFamily={FONT} fontSize="10" fontWeight="700" fill="#46524E">
        가상 사례 · 이서윤(가명)
      </text>
    </svg>
  );
}

/** '여기가 달라요' 세 칸 그림 */
export function DiffArt({ n }: { n: 1 | 2 | 3 }) {
  if (n === 1)
    return (
      <div className="flex h-24 items-end">
        <Plate kind="stack" className="h-[95px] w-[74px]" />
        <svg viewBox="0 0 24 24" width="22" height="22" className="mb-[70px] ml-1" aria-hidden="true">
          <path d="M12 2l2.5 7.5L22 12l-7.5 2.5L12 22l-2.5-7.5L2 12l7.5-2.5z" fill="#F08A6C" />
        </svg>
      </div>
    );
  if (n === 2)
    return (
      <div className="flex h-24 items-end">
        <svg viewBox="0 0 140 90" width="140" height="90" aria-hidden="true">
          <path d="M70 84V46" stroke="#2F6B5A" strokeWidth="5" strokeLinecap="round" />
          <path d="M70 50C70 30 54 22 32 22c0 20 16 28 38 28z" fill="#3FA37F" />
          <path d="M70 40c0-18 13-27 32-27 0 18-13 27-32 27z" fill="#A8E0CA" />
          <path d="M108 10l3 7 7 3-7 3-3 7-3-7-7-3 7-3z" fill="#F08A6C" />
          <rect x="40" y="80" width="60" height="8" rx="4" fill="#F4C7A6" />
        </svg>
      </div>
    );
  return (
    <div className="flex h-24 items-end">
      <svg viewBox="0 0 140 90" width="140" height="90" aria-hidden="true">
        <rect x="10" y="22" width="52" height="64" rx="8" fill="#fff" stroke="#1E2A26" strokeWidth="2.5" />
        <path d="M20 38h32M20 48h24M20 58h28" stroke="#A8E0CA" strokeWidth="4" strokeLinecap="round" />
        <rect x="72" y="14" width="60" height="40" rx="8" fill="#F08A6C" />
        <path d="M96 26l12 8-12 8z" fill="#fff" />
        <path d="M78 66a10 10 0 0110-10h28a10 10 0 0110 10v4a10 10 0 01-10 10h-20l-8 6v-6a10 10 0 01-10-10z" fill="#9FD6C2" />
      </svg>
    </div>
  );
}
