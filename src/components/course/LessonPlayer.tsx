"use client";

import { useEffect, useRef } from "react";
import type { Playback } from "@/lib/course";

/**
 * 강의 동영상 플레이어
 *  - url   : 일반 <video> (Stream 설정 전 테스트용 직접 주소)
 *  - stream: Cloudflare Stream iframe + Stream Player SDK (재생 위치를 읽고 쓰기 위해)
 *  - youtube: 유튜브 일부공개 영상 (Stream 도입 전 임시) — IFrame Player API, 쿠키 덜 쓰는 youtube-nocookie 도메인
 *
 * onProgress(초)   : 재생 중 10초마다 · 일시정지 · 페이지 이탈 시
 * onEnded()        : 끝까지 재생
 */

const SAVE_EVERY_SEC = 10;
const STREAM_SDK = "https://embed.cloudflarestream.com/embed/sdk.latest.js";
const YOUTUBE_API = "https://www.youtube.com/iframe_api";

interface StreamPlayer {
  currentTime: number;
  duration: number;
  addEventListener(ev: string, fn: () => void): void;
  removeEventListener(ev: string, fn: () => void): void;
}
interface YtPlayer {
  getCurrentTime(): number;
  destroy(): void;
}
interface YtNamespace {
  Player: new (
    el: HTMLElement,
    opts: {
      host?: string;
      videoId: string;
      playerVars?: Record<string, string | number>;
      events?: { onStateChange?: (e: { data: number }) => void };
    }
  ) => YtPlayer;
  PlayerState: { PLAYING: number; PAUSED: number; ENDED: number };
}
declare global {
  interface Window {
    Stream?: (el: HTMLIFrameElement) => StreamPlayer;
    YT?: YtNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

function loadYoutubeApi(): Promise<YtNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  return new Promise((resolve, reject) => {
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      if (window.YT) resolve(window.YT);
    };
    if (!document.querySelector(`script[src="${YOUTUBE_API}"]`)) {
      const s = document.createElement("script");
      s.src = YOUTUBE_API;
      s.async = true;
      s.onerror = () => reject(new Error("youtube"));
      document.head.appendChild(s);
    }
  });
}

function loadStreamSdk(): Promise<void> {
  if (typeof window === "undefined" || window.Stream) return Promise.resolve();
  const existing = document.querySelector<HTMLScriptElement>(`script[src="${STREAM_SDK}"]`);
  return new Promise((resolve, reject) => {
    const s = existing ?? document.createElement("script");
    s.addEventListener("load", () => resolve());
    s.addEventListener("error", () => reject(new Error("sdk")));
    if (!existing) {
      s.src = STREAM_SDK;
      s.async = true;
      document.head.appendChild(s);
    }
  });
}

/** 공통: 재생 위치 추적 → 저장 호출 */
function useTracker(onProgress: (sec: number) => void) {
  const last = useRef(0);
  const cb = useRef(onProgress);
  useEffect(() => {
    cb.current = onProgress;
  }, [onProgress]);
  return {
    tick(sec: number) {
      if (Math.abs(sec - last.current) >= SAVE_EVERY_SEC) {
        last.current = sec;
        cb.current(sec);
      }
    },
    flush(sec: number) {
      if (sec > 0 && Math.abs(sec - last.current) >= 1) {
        last.current = sec;
        cb.current(sec);
      }
    },
  };
}

export function LessonPlayer({
  playback,
  startAt,
  onProgress,
  onEnded,
}: {
  playback: Playback;
  startAt: number;
  onProgress: (sec: number) => void;
  onEnded: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const tracker = useTracker(onProgress);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  // Stream: SDK로 이벤트 연결
  useEffect(() => {
    if (playback.kind !== "stream" || !iframeRef.current) return;
    let player: StreamPlayer | null = null;
    let seeked = false;
    const onTime = () => player && tracker.tick(player.currentTime);
    const onPause = () => player && tracker.flush(player.currentTime);
    const onEnd = () => {
      if (player) tracker.flush(player.currentTime);
      endedRef.current();
    };
    const onMeta = () => {
      if (player && !seeked && startAt > 5 && startAt < (player.duration || Infinity) - 5) {
        seeked = true;
        player.currentTime = startAt;
      }
    };
    loadStreamSdk()
      .then(() => {
        if (!iframeRef.current || !window.Stream) return;
        player = window.Stream(iframeRef.current);
        player.addEventListener("timeupdate", onTime);
        player.addEventListener("pause", onPause);
        player.addEventListener("ended", onEnd);
        player.addEventListener("loadedmetadata", onMeta);
      })
      .catch(() => null); // SDK를 못 불러와도 재생은 된다 (진도만 수동 완료)
    return () => {
      if (!player) return;
      tracker.flush(player.currentTime);
      player.removeEventListener("timeupdate", onTime);
      player.removeEventListener("pause", onPause);
      player.removeEventListener("ended", onEnd);
      player.removeEventListener("loadedmetadata", onMeta);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback]);

  // <video>: 페이지를 떠날 때 마지막 위치 저장
  useEffect(() => {
    const v = videoRef.current;
    return () => {
      if (v) tracker.flush(v.currentTime);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playback]);

  if (playback.kind === "youtube") {
    return <YoutubePlayer videoId={playback.videoId} startAt={startAt} onProgress={onProgress} onEnded={onEnded} />;
  }

  if (playback.kind === "stream") {
    return (
      <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
        <iframe
          ref={iframeRef}
          src={playback.iframeUrl}
          title="강의 영상"
          className="absolute inset-0 h-full w-full border-0"
          allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-black">
      <video
        ref={videoRef}
        src={playback.url}
        controls
        playsInline
        controlsList="nodownload"
        onContextMenu={(e) => e.preventDefault()}
        className="aspect-video w-full"
        onLoadedMetadata={(e) => {
          const v = e.currentTarget;
          if (startAt > 5 && startAt < v.duration - 5) v.currentTime = startAt;
        }}
        onTimeUpdate={(e) => tracker.tick(e.currentTarget.currentTime)}
        onPause={(e) => tracker.flush(e.currentTarget.currentTime)}
        onEnded={(e) => {
          tracker.flush(e.currentTarget.currentTime);
          endedRef.current();
        }}
      />
    </div>
  );
}

/** 유튜브 일부공개 영상 — 재생 중 1초마다 위치 확인(저장은 10초 간격), 일시정지·종료·이탈 시 저장 */
function YoutubePlayer({
  videoId,
  startAt,
  onProgress,
  onEnded,
}: {
  videoId: string;
  startAt: number;
  onProgress: (sec: number) => void;
  onEnded: () => void;
}) {
  const boxRef = useRef<HTMLDivElement>(null);
  const tracker = useTracker(onProgress);
  const endedRef = useRef(onEnded);
  useEffect(() => {
    endedRef.current = onEnded;
  }, [onEnded]);

  useEffect(() => {
    let player: YtPlayer | null = null;
    let timer: ReturnType<typeof setInterval> | null = null;
    let cancelled = false;
    const stop = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    loadYoutubeApi()
      .then((YT) => {
        if (cancelled || !boxRef.current) return;
        const mount = document.createElement("div");
        boxRef.current.appendChild(mount);
        player = new YT.Player(mount, {
          host: "https://www.youtube-nocookie.com",
          videoId,
          playerVars: {
            rel: 0, // 끝난 뒤 추천 영상은 같은 채널 영상만
            playsinline: 1,
            modestbranding: 1,
            start: startAt > 5 ? Math.floor(startAt) : 0, // 이어보기
          },
          events: {
            onStateChange: (e) => {
              if (!player) return;
              if (e.data === YT.PlayerState.PLAYING) {
                stop();
                timer = setInterval(() => player && tracker.tick(player.getCurrentTime()), 1000);
              } else if (e.data === YT.PlayerState.PAUSED) {
                stop();
                tracker.flush(player.getCurrentTime());
              } else if (e.data === YT.PlayerState.ENDED) {
                stop();
                tracker.flush(player.getCurrentTime());
                endedRef.current();
              }
            },
          },
        });
      })
      .catch(() => null);
    return () => {
      cancelled = true;
      stop();
      if (player) {
        try {
          tracker.flush(player.getCurrentTime());
        } catch {
          // 플레이어가 아직 준비 전이면 무시
        }
        player.destroy();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId]);

  return (
    <div className="relative aspect-video w-full overflow-hidden rounded-2xl bg-black">
      <div ref={boxRef} className="absolute inset-0 [&>iframe]:h-full [&>iframe]:w-full" />
    </div>
  );
}
