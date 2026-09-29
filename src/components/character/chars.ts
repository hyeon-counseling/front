/**
 * 마음숲 캐릭터 SVG 생성기 — chars.js TypeScript 포트
 * 캐릭터: 숨이(sumi) · 토리(tori) · 달이(dari) · 현 선생님(teacher)
 *
 * SVG는 서버/클라이언트 모두에서 문자열로 생성한다.
 * dangerouslySetInnerHTML 용도이며, 모든 입력값은 코드 내 상수이므로 XSS 위험 없음.
 */

const INK = "#1F3A33";
let _n = 0;

const line = (d: string, w = 4) =>
  `<path d="${d}" stroke="${INK}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round" fill="none"/>`;

type Mood = "happy" | "calm" | "sleepy" | "worried" | "wow" | "wink" | "serious" | "idle";

function face(
  mood: Mood,
  dy = 0,
  opts: { cheeks?: string | false; cheekY?: number } = {}
): string {
  const cheeks = opts.cheeks !== undefined ? opts.cheeks : "#F2A99E";
  const cheekY = opts.cheekY ?? 143;

  const glint = (x: number) =>
    `<circle cx="${x + 2}" cy="125" r="1.8" fill="#fff"/>`;
  const open = (rx = 5.5, ry = 7) =>
    `<g class="eye"><ellipse cx="80" cy="128" rx="${rx}" ry="${ry}" fill="${INK}"/>${glint(80)}</g>` +
    `<g class="eye"><ellipse cx="120" cy="128" rx="${rx}" ry="${ry}" fill="${INK}"/>${glint(120)}</g>`;

  const E: Record<string, string> = {
    happy:
      line("M73 131 Q80 121 87 131") + line("M113 131 Q120 121 127 131"),
    calm:
      line("M73 127 Q80 134 87 127") + line("M113 127 Q120 134 127 127"),
    sleepy:
      line("M73 130 Q80 135 87 130") + line("M113 130 Q120 135 127 130"),
    worried:
      open(5, 6.5) +
      line("M70 116 L86 111") +
      line("M130 116 L114 111"),
    wow: open(6.5, 8.5),
    wink:
      open().replace(/<g class="eye"><ellipse cx="120"[\s\S]*$/, "") +
      line("M113 129 Q120 123 127 129"),
    serious:
      open(5, 6.5) + line("M71 113 L87 115") + line("M129 113 L113 115"),
    idle: open(),
  };

  const M: Record<string, string> = {
    happy: `<path d="M90 141 Q100 158 110 141 Z" fill="${INK}"/><path d="M95 149 Q100 153 105 149 Q100 147 95 149Z" fill="#F2A99E"/>`,
    calm: line("M95 144 Q100 147.5 105 144", 3.5),
    worried: line("M91 148 Q95.5 143 100 147 Q104.5 151 109 146", 3.5),
    sleepy: `<ellipse cx="100" cy="146" rx="3.5" ry="4.5" fill="${INK}"/>`,
    wow: `<ellipse cx="100" cy="147" rx="5.5" ry="6.5" fill="${INK}"/>`,
    serious: line("M94 146 L106 146", 3.5),
    wink: `<path d="M91 141 Q100 155 109 141 Z" fill="${INK}"/>`,
    idle: line("M93 143 Q100 150 107 143", 3.5),
  };

  const ch = cheeks
    ? `<ellipse cx="66" cy="${cheekY}" rx="9" ry="5.5" fill="${cheeks}" opacity=".55"/>` +
      `<ellipse cx="134" cy="${cheekY}" rx="9" ry="5.5" fill="${cheeks}" opacity=".55"/>`
    : "";

  const ePart = E[mood] ?? open();
  const mPart = M[mood] ?? line("M93 143 Q100 150 107 143", 3.5);

  return `<g transform="translate(0 ${dy})">${ch}<g class="face">${ePart}${mPart}</g></g>`;
}

function sprout(stage: number): string {
  const stem = `<path d="M100 66 Q99 54 102 44" stroke="#3D6B5E" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  if (stage <= 0)
    return `<path d="M100 66 Q100 60 101 56" stroke="#3D6B5E" stroke-width="4" stroke-linecap="round" fill="none"/>`;
  const L = `<path d="M101 47 C90 34 72 34 64 42 C74 54 92 55 101 47Z" fill="#6FA88F"/>`;
  const R = `<path d="M102 45 C110 28 128 22 140 27 C135 43 118 50 102 45Z" fill="#3D6B5E"/>`;
  if (stage === 1)
    return (
      stem +
      `<path d="M102 46 C107 36 118 32 125 35 C121 45 111 49 102 46Z" fill="#3D6B5E"/>`
    );
  if (stage === 2) return stem + L + R;
  if (stage === 3)
    return stem + L + R + `<ellipse cx="102.5" cy="38" rx="6" ry="8" fill="#F2A99E"/>`;
  let f = "";
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
    f += `<circle cx="${(102.5 + Math.cos(a) * 8).toFixed(1)}" cy="${(33 + Math.sin(a) * 8).toFixed(1)}" r="6.5" fill="#F7C9C1"/>`;
  }
  return stem + L + R + f + `<circle cx="102.5" cy="33" r="5.5" fill="#F5C451"/>`;
}

const shadow = (rx = 52) =>
  `<ellipse class="shadow" cx="100" cy="197" rx="${rx}" ry="8" fill="rgba(31,58,51,.13)"/>`;

export type CharKind = "sumi" | "tori" | "dari" | "teacher";

interface DrawOpts {
  mood?: Mood;
  arms?: boolean;
  stage?: number;
  extra?: string;
  label?: string;
}

function bodyHtml(kind: CharKind, o: DrawOpts, id: string): string {
  const mood: Mood = o.mood ?? "idle";
  const showArms = o.arms !== false;

  if (kind === "sumi") {
    return (
      `<defs><radialGradient id="${id}" cx="40%" cy="30%" r="80%">` +
      `<stop offset="0" stop-color="#E4F4EB"/><stop offset=".55" stop-color="#BFE3D0"/><stop offset="1" stop-color="#94CDB4"/>` +
      `</radialGradient></defs>${shadow(54)}` +
      `<g class="bd">` +
      (showArms
        ? `<ellipse cx="40" cy="150" rx="10" ry="13" fill="#A6D6C0" transform="rotate(-24 40 150)"/>` +
          `<g class="ar"><ellipse cx="160" cy="150" rx="10" ry="13" fill="#A6D6C0" transform="rotate(24 160 150)"/></g>`
        : "") +
      `<path d="M100 62 C150 62 170 100 168 140 C166 178 136 193 100 193 C64 193 34 178 32 140 C30 100 50 62 100 62Z" fill="url(#${id})"/>` +
      `<ellipse cx="76" cy="92" rx="15" ry="9" fill="#fff" opacity=".55" transform="rotate(-24 76 92)"/>` +
      `<g class="sp">${sprout(o.stage ?? 2)}</g>` +
      face(mood) +
      `</g>`
    );
  }

  if (kind === "tori") {
    return (
      `<defs><radialGradient id="${id}" cx="40%" cy="35%" r="80%">` +
      `<stop offset="0" stop-color="#F0C898"/><stop offset="1" stop-color="#CF9560"/>` +
      `</radialGradient></defs>${shadow(50)}` +
      `<g class="bd">` +
      (showArms
        ? `<ellipse cx="44" cy="160" rx="9" ry="12" fill="#C98E58" transform="rotate(-24 44 160)"/>` +
          `<g class="ar"><ellipse cx="156" cy="160" rx="9" ry="12" fill="#C98E58" transform="rotate(24 156 160)"/></g>`
        : "") +
      `<path d="M100 78 C146 78 160 116 156 148 C152 180 128 194 100 194 C72 194 48 180 44 148 C40 116 54 78 100 78Z" fill="url(#${id})"/>` +
      `<g class="sp"><path d="M40 96 C40 66 68 50 100 50 C132 50 160 66 160 96 C150 104 50 104 40 96Z" fill="#8A5A34"/>` +
      `<path d="M56 84 h88 M60 72 h80" stroke="#6E4527" stroke-width="3" stroke-linecap="round" opacity=".55"/>` +
      `<path d="M100 50 q2 -14 12 -18" stroke="#6E4527" stroke-width="5" stroke-linecap="round" fill="none"/></g>` +
      face(mood, 8, { cheekY: 143 }) +
      `</g>`
    );
  }

  if (kind === "dari") {
    return (
      `<defs><radialGradient id="${id}" cx="40%" cy="35%" r="80%">` +
      `<stop offset="0" stop-color="#FFFFFF"/><stop offset="1" stop-color="#E4E1F4"/>` +
      `</radialGradient></defs>${shadow(50)}` +
      `<g class="bd"><g class="sp">` +
      `<path d="M74 96 C62 60 64 26 78 22 C92 20 94 58 90 94Z" fill="#EFEDF9"/>` +
      `<path d="M78 90 C72 64 72 38 79 34 C85 34 86 62 84 90Z" fill="#F6C9D0"/>` +
      `<path d="M126 96 C138 60 136 26 122 22 C108 20 106 58 110 94Z" fill="#EFEDF9"/>` +
      `<path d="M122 90 C128 64 128 38 121 34 C115 34 114 62 116 90Z" fill="#F6C9D0"/></g>` +
      (showArms
        ? `<ellipse cx="44" cy="160" rx="9" ry="12" fill="#DCD8EE" transform="rotate(-24 44 160)"/>` +
          `<g class="ar"><ellipse cx="156" cy="160" rx="9" ry="12" fill="#DCD8EE" transform="rotate(24 156 160)"/></g>`
        : "") +
      `<path d="M100 84 C146 84 162 118 160 150 C158 182 132 194 100 194 C68 194 42 182 40 150 C38 118 54 84 100 84Z" fill="url(#${id})"/>` +
      `<path d="M136 102 a20 20 0 1 0 14 30 a16 16 0 1 1 -14 -30z" fill="#F5C451" opacity=".9"/>` +
      face(mood, 12) +
      `</g>`
    );
  }

  // teacher (부엉이)
  return (
    `${shadow(52)}<g class="bd">` +
    `<path d="M58 62 L70 88 L50 86Z M142 62 L130 88 L150 86Z" fill="#7C6A5A"/>` +
    `<path d="M100 66 C150 66 166 104 164 142 C162 180 134 194 100 194 C66 194 38 180 36 142 C34 104 50 66 100 66Z" fill="#8C7A68"/>` +
    `<path d="M100 150 C124 150 136 164 136 180 C124 190 76 190 64 180 C64 164 76 150 100 150Z" fill="#E9DCC8"/>` +
    `<circle cx="80" cy="120" r="24" fill="#F4ECDF"/><circle cx="120" cy="120" r="24" fill="#F4ECDF"/>` +
    `<path d="M94 134 L100 146 L106 134Z" fill="#E0A04A"/>` +
    `<path d="M52 160 C44 150 42 176 60 184 M148 160 C156 150 158 176 140 184" stroke="#7C6A5A" stroke-width="10" stroke-linecap="round" fill="none"/>` +
    `<path d="M58 176 Q100 196 142 176" stroke="#3D6B5E" stroke-width="8" fill="none" stroke-linecap="round"/>` +
    face(mood, -8, { cheeks: "#F2A99E", cheekY: 150 }) +
    `<g fill="none" stroke="#2C4A42" stroke-width="3"><circle cx="80" cy="120" r="15"/><circle cx="120" cy="120" r="15"/>` +
    `<path d="M95 119 h10"/></g></g>`
  );
}

const CHAR_NAMES: Record<CharKind, string> = {
  sumi: "숨이",
  tori: "토리",
  dari: "달이",
  teacher: "현 선생님",
};

/** 캐릭터 SVG 문자열 반환 */
export function drawChar(kind: CharKind = "sumi", o: DrawOpts = {}): string {
  const id = "cg" + ++_n;
  const label = o.label ?? CHAR_NAMES[kind];
  return (
    `<svg class="ch-svg" viewBox="0 0 200 210" role="img" aria-label="${label}" xmlns="http://www.w3.org/2000/svg">` +
    bodyHtml(kind, o, id) +
    (o.extra ?? "") +
    `</svg>`
  );
}

// ─── 이모티콘 효과 ──────────────────────────────────────────────────────────

const FX: Record<string, string> = {
  heart: '<g class="fx fx-float"><path d="M160 60 c-6 -10 -22 -6 -18 6 c3 8 18 18 18 18 s15 -10 18 -18 c4 -12 -12 -16 -18 -6z" fill="#F28B8B"/></g>',
  hearts:
    '<g class="fx fx-float"><path d="M160 60 c-6 -10 -22 -6 -18 6 c3 8 18 18 18 18 s15 -10 18 -18 c4 -12 -12 -16 -18 -6z" fill="#F28B8B"/></g>' +
    '<g class="fx fx-float f2"><path d="M40 72 c-4 -7 -15 -4 -12 4 c2 5 12 12 12 12 s10 -7 12 -12 c3 -8 -8 -11 -12 -4z" fill="#F7B2B2"/></g>',
  spark:
    '<g class="fx fx-twinkle"><path d="M158 64 l4 11 11 4 -11 4 -4 11 -4 -11 -11 -4 11 -4z" fill="#F5C451"/></g>' +
    '<g class="fx fx-twinkle f2"><path d="M40 84 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3z" fill="#F5C451"/></g>' +
    '<g class="fx fx-twinkle f3"><path d="M150 150 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" fill="#F5C451"/></g>',
  question:
    '<g class="fx fx-bob"><text x="150" y="70" font-size="42" font-weight="800" fill="#5BA3DB" font-family="sans-serif">?</text></g>',
  excl: '<g class="fx fx-bob"><text x="152" y="72" font-size="44" font-weight="800" fill="#F08A5D" font-family="sans-serif">!</text></g>',
  sweat:
    '<g class="fx fx-drip"><path d="M156 88 q-7 12 0 16 q7 -4 0 -16z" fill="#8FC3E8"/></g>',
  zz: '<g class="fx fx-bob"><text x="146" y="74" font-size="26" font-weight="800" fill="#9AA6C9" font-family="sans-serif">z</text><text x="162" y="56" font-size="18" font-weight="800" fill="#9AA6C9" font-family="sans-serif">z</text></g>',
  note: '<g class="fx fx-float"><path d="M156 44 v26 a7 6 0 1 1 -4 -5 v-17 l16 -4 v20 a7 6 0 1 1 -4 -5 v-12z" fill="#7FC3A8"/></g>',
  flag: '<g class="fx fx-wave"><path d="M168 150 V70" stroke="#6E4527" stroke-width="4" stroke-linecap="round"/><path d="M168 72 L196 82 L168 94Z" fill="#F5C451"/></g>',
  breath:
    '<g class="fx fx-breath"><path d="M112 150 q18 -4 30 6 q10 8 22 2" stroke="#9FD2BA" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M118 162 q14 0 22 8" stroke="#BFE3D0" stroke-width="4" fill="none" stroke-linecap="round"/></g>',
  clap: '<g class="fx fx-twinkle"><path d="M30 120 l-12 -6 M28 132 l-14 0 M30 144 l-12 6 M170 120 l12 -6 M172 132 l14 0 M170 144 l12 6" stroke="#F5C451" stroke-width="4" stroke-linecap="round"/></g>',
  board:
    '<g class="fx"><rect x="150" y="96" width="46" height="36" rx="5" fill="#2F5C50"/><path d="M158 108 h26 M158 118 h18" stroke="#E4F4EB" stroke-width="3" stroke-linecap="round"/><path d="M146 150 L162 124" stroke="#B98D5E" stroke-width="4" stroke-linecap="round" class="fx-point"/></g>',
  thumb:
    '<g class="fx fx-bob"><circle cx="166" cy="70" r="18" fill="#F5C451"/><path d="M158 72 h6 v-10 q2 -6 6 -3 v8 h6 q4 0 3 4 l-2 9 q-1 3 -4 3 h-9 z M154 70 h4 v14 h-4z" fill="#fff"/></g>',
  bang: '<g class="fx fx-twinkle"><circle cx="40" cy="70" r="4" fill="#F28B8B"/><circle cx="164" cy="64" r="5" fill="#7FC3A8"/><circle cx="170" cy="120" r="4" fill="#5BA3DB"/><circle cx="30" cy="130" r="5" fill="#F5C451"/></g>',
};

// ─── 이모티콘 정의 ──────────────────────────────────────────────────────────

/** [캐릭터, 표정, 효과, 움직임 클래스, 이름] */
type StickerDef = [CharKind, Mood, string, string, string];

export const STICKERS: Record<string, StickerDef> = {
  "sumi-hi": ["sumi", "happy", "", "st-wave", "안녕!"],
  "sumi-nod": ["sumi", "calm", "", "st-nod", "응응"],
  "sumi-clap": ["sumi", "happy", "clap", "st-bounce", "짝짝"],
  "sumi-think": ["sumi", "idle", "question", "st-tilt", "음…"],
  "sumi-hug": ["sumi", "calm", "hearts", "st-squish", "토닥토닥"],
  "sumi-spark": ["sumi", "wow", "spark", "st-bounce", "반짝"],
  "sumi-breath": ["sumi", "calm", "breath", "st-breathe", "후~"],
  "sumi-cheer": ["sumi", "happy", "flag", "st-bounce", "힘내!"],
  "sumi-worry": ["sumi", "worried", "sweat", "st-shiver", "걱정돼"],
  "sumi-sleep": ["sumi", "sleepy", "zz", "st-sway", "잘 자"],
  "sumi-wow": ["sumi", "wow", "excl", "st-jump", "오!"],
  "sumi-love": ["sumi", "wink", "heart", "st-nod", "고마워"],
  "tori-hi": ["tori", "happy", "", "st-wave", "안녕!"],
  "tori-cheer": ["tori", "happy", "flag", "st-bounce", "할 수 있어"],
  "tori-think": ["tori", "idle", "question", "st-tilt", "어디 보자"],
  "tori-love": ["tori", "wink", "heart", "st-nod", "최고야"],
  "dari-hi": ["dari", "happy", "", "st-wave", "안녕~"],
  "dari-sleep": ["dari", "sleepy", "zz", "st-sway", "푹 자"],
  "dari-hug": ["dari", "calm", "hearts", "st-squish", "괜찮아"],
  "dari-wow": ["dari", "wow", "spark", "st-jump", "와아"],
  "teacher-hello": ["teacher", "happy", "", "st-nod", "반가워요"],
  "teacher-point": ["teacher", "idle", "board", "st-tilt", "설명할게요"],
  "teacher-nod": ["teacher", "calm", "", "st-nod", "그렇죠"],
  "teacher-thumb": ["teacher", "happy", "thumb", "st-bounce", "좋아요"],
  "teacher-heart": ["teacher", "calm", "heart", "st-squish", "괜찮아요"],
  "teacher-serious": ["teacher", "serious", "excl", "st-nod", "중요해요"],
};

/** 이모티콘 SVG 문자열 반환 */
export function drawSticker(name: string): string {
  const def = STICKERS[name] ?? STICKERS["sumi-hi"];
  const [kind, mood, fx, anim, label] = def;
  const svgStr = drawChar(kind, { mood, extra: FX[fx] ?? "", label });
  return `<span class="sticker ${anim}" title="${label}">${svgStr}</span>`;
}

/** 이모티콘의 캐릭터 표정 */
export function stickerMood(st: string): Mood {
  return STICKERS[st] ? STICKERS[st][1] : "idle";
}

/** 큰 이모티콘 목록 (sticker 앞에 별도 줄로 보여 줄 이름들) */
export const BIG_STICKERS = new Set([
  "sumi-hi", "sumi-clap", "sumi-hug", "sumi-spark", "sumi-cheer",
  "sumi-love", "sumi-wow", "sumi-worry", "sumi-breath",
  "teacher-thumb", "teacher-heart", "teacher-hello",
]);
