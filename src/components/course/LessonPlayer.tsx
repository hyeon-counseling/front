"use client";

import { useEffect, useRef } from "react";
import type { Playback } from "@/lib/course";

/**
 * 강의 동영상 플레이어
 *  - url   : 일반 <video> (Stream 설정 전 테스트용 직접 주소)
 *  - stream: Cloudflare Stream iframe + Stream Player SDK (재생 위치를 읽고 쓰기 위해)
 *
 * onProgress(초)   : 재생 중 10초마다 · 일시정지 · 페이지 이탈 시
 * onEnded()        : 끝까지 재생
 */

const SAVE_EVERY_SEC = 10;
const STREAM_SDK = "https://embed.cloudflarestream.com/embed/sdk.latest.js";

interface StreamPlayer {
  currentTime: number;
  duration: number;
  addEventListener(ev: string, fn: () => void): void;
  removeEventListener(ev: string, fn: () => void): void;
}
declare global {
  interface Window {
    Stream?: (el: HTMLIFrameElement) => StreamPlayer;
  }
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
