"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { formatDuration } from "@/lib/course";

/**
 * 오디오(팟캐스트) 차시 플레이어
 * - 재생/일시정지 · 15초 뒤로/앞으로 · 구간 이동 막대 · 배속(0.75~2배, 기기에 기억)
 * - 이어듣기: startAt부터 시작, 재생 중 10초마다 · 일시정지 · 페이지 이탈 시 onProgress
 * - 휴대폰 잠금화면·이어폰 버튼(Media Session) 지원
 * - 서명 주소가 만료되면(2시간) onReload로 새 주소를 받아 같은 위치에서 이어 재생
 * 키보드: 스페이스 재생/정지, ←/→ 15초 이동 (입력칸에 있을 때는 무시)
 */
const SPEEDS = [0.75, 1, 1.25, 1.5, 1.75, 2];
const SPEED_KEY = "hyeon.audio.speed";
const SAVE_EVERY_SEC = 10;
const JUMP = 15;

function readSpeed(): number {
  try {
    const v = Number(localStorage.getItem(SPEED_KEY));
    return SPEEDS.includes(v) ? v : 1;
  } catch {
    return 1;
  }
}

export function AudioPlayer({
  src,
  title,
  subtitle,
  startAt,
  durationHint,
  onProgress,
  onEnded,
  onReload,
}: {
  src: string;
  title: string;
  subtitle?: string;
  startAt: number;
  durationHint: number | null;
  onProgress: (sec: number) => void;
  onEnded: () => void;
  onReload: () => void;
}) {
  const audio = useRef<HTMLAudioElement>(null);
  const lastSaved = useRef(0);
  const resumeAt = useRef(startAt);
  const cb = useRef({ onProgress, onEnded });
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(startAt);
  const [duration, setDuration] = useState(durationHint ?? 0);
  // 플레이어는 차시 데이터를 받은 뒤(브라우저에서만) 그려지므로 저장된 배속을 바로 읽어도 된다
  const [speed, setSpeed] = useState(readSpeed);
  const [buffering, setBuffering] = useState(false);
  const [failed, setFailed] = useState(false);
  const [showResume, setShowResume] = useState(startAt > 5);

  useEffect(() => {
    cb.current = { onProgress, onEnded };
  }, [onProgress, onEnded]);

  const save = useCallback((sec: number, force = false) => {
    if (sec <= 0) return;
    if (force ? Math.abs(sec - lastSaved.current) >= 1 : Math.abs(sec - lastSaved.current) >= SAVE_EVERY_SEC) {
      lastSaved.current = sec;
      cb.current.onProgress(sec);
    }
  }, []);

  // 주소를 (다시) 받으면 → 오류 표시 지우고 마지막 위치·배속 복원 (만료 후 재발급 포함)
  const onLoaded = () => {
    const a = audio.current;
    if (!a) return;
    setFailed(false);
    if (Number.isFinite(a.duration)) setDuration(a.duration);
    if (resumeAt.current > 0 && resumeAt.current < (a.duration || Infinity) - 3) a.currentTime = resumeAt.current;
    a.playbackRate = speed;
  };

  const toggle = useCallback(() => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setFailed(true));
    else a.pause();
  }, []);

  const seekTo = useCallback((sec: number) => {
    const a = audio.current;
    if (!a) return;
    const max = Number.isFinite(a.duration) ? a.duration : duration;
    a.currentTime = Math.max(0, Math.min(max || sec, sec));
    setTime(a.currentTime);
    setShowResume(false);
  }, [duration]);

  const jump = useCallback((d: number) => {
    const a = audio.current;
    if (a) seekTo(a.currentTime + d);
  }, [seekTo]);

  const changeSpeed = () => {
    const next = SPEEDS[(SPEEDS.indexOf(speed) + 1) % SPEEDS.length];
    setSpeed(next);
    if (audio.current) audio.current.playbackRate = next;
    try {
      localStorage.setItem(SPEED_KEY, String(next));
    } catch {
      /* 저장 못 해도 재생에는 지장 없음 */
    }
  };

  // 키보드 조작
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.closest("input, textarea, select, [contenteditable]") || (e.key === " " && t.closest("button, a")))) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === " ") {
        e.preventDefault();
        toggle();
      } else if (e.key === "ArrowLeft") jump(-JUMP);
      else if (e.key === "ArrowRight") jump(JUMP);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [toggle, jump]);

  // 잠금화면·이어폰 버튼
  useEffect(() => {
    if (typeof navigator === "undefined" || !("mediaSession" in navigator)) return;
    const ms = navigator.mediaSession;
    ms.metadata = new MediaMetadata({ title, artist: subtitle ?? "심리상담실 현" });
    const set = (a: MediaSessionAction, h: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(a, h);
      } catch {
        /* 지원하지 않는 동작 */
      }
    };
    set("play", () => void audio.current?.play());
    set("pause", () => audio.current?.pause());
    set("seekbackward", () => jump(-JUMP));
    set("seekforward", () => jump(JUMP));
    set("seekto", (d) => d.seekTime !== undefined && seekTo(d.seekTime));
    return () => {
      for (const a of ["play", "pause", "seekbackward", "seekforward", "seekto"] as MediaSessionAction[]) set(a, null);
    };
  }, [title, subtitle, jump, seekTo]);

  // 페이지를 떠날 때 위치 저장
  useEffect(() => {
    const flush = () => audio.current && save(audio.current.currentTime, true);
    window.addEventListener("pagehide", flush);
    return () => {
      window.removeEventListener("pagehide", flush);
      flush();
    };
  }, [save]);

  const pct = duration > 0 ? Math.min(100, (time / duration) * 100) : 0;

  return (
    <div className="rounded-2xl bg-[var(--brand-ink,#1f3a33)] p-5 text-white sm:p-7">
      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={onLoaded}
        onTimeUpdate={(e) => {
          const t = e.currentTarget.currentTime;
          setTime(t);
          resumeAt.current = t;
          if (!e.currentTarget.paused) save(t);
        }}
        onPlay={() => {
          setPlaying(true);
          setShowResume(false);
        }}
        onPause={(e) => {
          setPlaying(false);
          save(e.currentTarget.currentTime, true);
        }}
        onWaiting={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onEnded={(e) => {
          setPlaying(false);
          save(e.currentTarget.currentTime, true);
          cb.current.onEnded();
        }}
        onError={() => {
          setPlaying(false);
          setFailed(true);
        }}
      />

      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-lg" aria-hidden>🎧</span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{title}</p>
          {subtitle && <p className="truncate text-xs text-white/70">{subtitle}</p>}
        </div>
      </div>

      {/* 구간 이동 막대 */}
      <div className="mt-6">
        <input
          type="range"
          min={0}
          max={Math.max(1, Math.floor(duration))}
          step={1}
          value={Math.floor(time)}
          onChange={(e) => seekTo(Number(e.target.value))}
          aria-label="재생 위치"
          className="audio-range h-2 w-full cursor-pointer appearance-none rounded-full"
          style={{ background: `linear-gradient(to right, #fff ${pct}%, rgba(255,255,255,0.25) ${pct}%)` }}
        />
        <div className="mt-1.5 flex justify-between text-xs tabular-nums text-white/70">
          <span>{formatDuration(time, true) || "0:00"}</span>
          <span>{duration ? `-${formatDuration(Math.max(0, duration - time), true) || "0:00"}` : ""}</span>
        </div>
      </div>

      {/* 조작 버튼 */}
      <div className="mt-4 flex items-center justify-center gap-4 sm:gap-6">
        <button onClick={changeSpeed} className="h-10 w-14 cursor-pointer rounded-full bg-white/10 text-sm font-bold tabular-nums hover:bg-white/20" aria-label="재생 속도 바꾸기">
          {speed}x
        </button>
        <button onClick={() => jump(-JUMP)} className="flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-full hover:bg-white/10" aria-label="15초 뒤로">
          <span className="text-xl leading-none">↺</span>
          <span className="text-[10px] font-semibold">15</span>
        </button>
        <button
          onClick={toggle}
          className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-full bg-white text-2xl text-[var(--brand)] shadow-lg hover:scale-105"
          aria-label={playing ? "일시정지" : "재생"}
        >
          {buffering && playing ? <span className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--brand)] border-t-transparent" /> : playing ? "❚❚" : "▶"}
        </button>
        <button onClick={() => jump(JUMP)} className="flex h-12 w-12 cursor-pointer flex-col items-center justify-center rounded-full hover:bg-white/10" aria-label="15초 앞으로">
          <span className="text-xl leading-none">↻</span>
          <span className="text-[10px] font-semibold">15</span>
        </button>
        <span className="w-14" aria-hidden />
      </div>

      {showResume && !playing && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 text-sm">
          <span className="text-white/80">지난번 {formatDuration(startAt, true)}까지 들었어요.</span>
          <button onClick={toggle} className="cursor-pointer font-semibold underline underline-offset-4">이어듣기</button>
          <button
            onClick={() => {
              resumeAt.current = 0;
              seekTo(0);
            }}
            className="cursor-pointer text-white/70 underline underline-offset-4"
          >
            처음부터
          </button>
        </div>
      )}

      {failed && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3 rounded-xl bg-white/10 px-4 py-3 text-sm">
          <span>오디오를 불러오지 못했어요. 재생 주소가 만료됐을 수 있어요.</span>
          <button onClick={onReload} className="cursor-pointer font-semibold underline underline-offset-4">다시 불러오기</button>
        </div>
      )}

      <p className="mt-5 hidden text-center text-xs text-white/50 sm:block">스페이스 재생·정지 · ←/→ 15초 이동</p>
    </div>
  );
}
