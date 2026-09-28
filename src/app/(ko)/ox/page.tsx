"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { useAuth } from "@/contexts/AuthContext";
import { apiRequest } from "@/lib/api";
import { Markdown } from "@/components/workbook/Markdown";
import { Button, cx } from "@/components/ui";

/**
 * 방 O/X 실시간 퀴즈 (메뉴 연결 없는 모듈 — 주소로만 들어옴: /ox, /ox?code=123456)
 * 방장(관리자·상담사)이 방을 만들고 코드를 알려주면, 회원이 코드로 들어와 함께 푼다.
 * 흐름: 대기실 → 문제(20초) → 정답 공개 → [설명자 뽑기 → 평가 투표] → 해설 → 다음 … → 최종 순위
 */
type Status = "lobby" | "question" | "reveal" | "roulette" | "voting" | "explain" | "ended";
interface PlayerView { userId: string; name: string; score: number; connected: boolean; isHost: boolean }
interface Snapshot {
  code: string;
  status: Status;
  set: { id: string; title: string; total: number } | null;
  hostId: string;
  currentIdx: number;
  players: PlayerView[];
  solved: number[];
  endsAt: number | null;
}
interface Question { idx: number; total: number; section: string; statement: string; endsAt: number; durationMs: number }
interface Reveal { idx: number; correct: "O" | "X"; picks: Record<string, "O" | "X">; correctIds: string[]; canRoulette: boolean; remaining: boolean }
interface Ack { ok: boolean; error?: string; data?: { code?: string; snapshot?: Snapshot; question?: Question } }

const API = process.env.NEXT_PUBLIC_API_URL ?? "";

export default function OxPage() {
  const { user, loading } = useAuth();
  const sock = useRef<Socket | null>(null);
  const joined = useRef<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [snap, setSnap] = useState<Snapshot | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [answered, setAnswered] = useState<{ mine: "O" | "X" | null; count: number; total: number }>({ mine: null, count: 0, total: 0 });
  const [reveal, setReveal] = useState<Reveal | null>(null);
  const [roulette, setRoulette] = useState<{ winnerId: string; winnerName: string; speakerGuide: string[] } | null>(null);
  const [votes, setVotes] = useState<{ voters: string[]; votes: Record<string, string> } | null>(null);
  const [voteResult, setVoteResult] = useState<{ winnerName: string; good: number; bad: number; awarded: boolean } | null>(null);
  const [explain, setExplain] = useState<{ statement: string; correct: string; explanation: string } | null>(null);
  const [sets, setSets] = useState<{ id: string; title: string; count: number }[]>([]);
  const [codeInput, setCodeInput] = useState("");
  const [error, setError] = useState("");
  const [now, setNow] = useState(() => Date.now());

  const isHostRole = user?.role === "admin" || user?.role === "counselor";
  const isHost = !!snap && snap.hostId === user?.id;

  const call = useCallback((ev: string, payload: unknown = {}) => {
    return new Promise<Ack>((resolve) => {
      if (!sock.current) return resolve({ ok: false, error: "연결되지 않았어요." });
      sock.current.timeout(8000).emit(ev, payload, (err: unknown, r: Ack) => resolve(err ? { ok: false, error: "응답이 없어요. 다시 시도해 주세요." } : r));
    });
  }, []);

  const applyJoin = (r: Ack) => {
    if (!r.ok) return setError(r.error ?? "들어가지 못했어요.");
    setError("");
    joined.current = r.data?.code ?? null;
    if (r.data?.snapshot) setSnap(r.data.snapshot);
    if (r.data?.question) setQuestion(r.data.question);
  };

  // 연결 (끊겼다 다시 붙으면 같은 방에 자동으로 다시 들어간다)
  useEffect(() => {
    if (loading || !user) return;
    const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
    const s = io(`${API}/ox`, { auth: { token }, transports: ["websocket", "polling"] });
    sock.current = s;
    s.on("connect", () => {
      setConnected(true);
      if (joined.current) s.emit("ox:join", { code: joined.current }, applyJoin);
    });
    s.on("disconnect", () => setConnected(false));
    s.on("connect_error", () => setError("실시간 연결에 실패했어요. 로그인 상태를 확인해 주세요."));
    s.on("ox:state", (x: Snapshot) => setSnap(x));
    s.on("ox:question", (q: Question) => {
      setQuestion(q);
      setAnswered({ mine: null, count: 0, total: 0 });
      setReveal(null);
      setRoulette(null);
      setVotes(null);
      setVoteResult(null);
      setExplain(null);
    });
    s.on("ox:answered", (a: { answeredCount: number; total: number }) => setAnswered((x) => ({ ...x, count: a.answeredCount, total: a.total })));
    s.on("ox:reveal", (r: Reveal) => setReveal(r));
    s.on("ox:roulette", (r: { winnerId: string; winnerName: string; speakerGuide: string[] }) => setRoulette(r));
    s.on("ox:voteState", (v: { voters: string[]; votes: Record<string, string> }) => setVotes(v));
    s.on("ox:voteResult", (v: { winnerName: string; good: number; bad: number; awarded: boolean }) => {
      setVoteResult(v);
      setRoulette(null);
    });
    s.on("ox:explain", (e: { statement: string; correct: string; explanation: string }) => setExplain(e));
    const code = new URLSearchParams(window.location.search).get("code");
    if (code) s.emit("ox:join", { code }, applyJoin);
    return () => {
      s.close();
      sock.current = null;
    };
  }, [loading, user]);

  useEffect(() => {
    if (isHostRole) apiRequest<{ id: string; title: string; count: number }[]>("/api/ox/sets").then((r) => r.ok && r.data && setSets(r.data));
  }, [isHostRole]);

  useEffect(() => {
    if (snap?.status !== "question") return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [snap?.status]);

  const host = async (ev: string, payload: unknown = {}) => {
    const r = await call(ev, payload);
    setError(r.ok ? "" : r.error ?? "처리하지 못했어요.");
  };

  if (loading) return null;
  if (!user) {
    return (
      <Center>
        <h1 className="text-2xl font-bold">방 O/X 퀴즈</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">로그인한 뒤 참여할 수 있어요.</p>
        <Link href="/login?next=/ox" className="mt-6 inline-flex h-12 items-center rounded-xl bg-[var(--brand)] px-6 font-semibold text-white">로그인</Link>
      </Center>
    );
  }

  // ── 입장 전 ──
  if (!snap) {
    return (
      <Center>
        <p className="text-4xl">⭕❌</p>
        <h1 className="mt-3 text-2xl font-bold">방 O/X 퀴즈</h1>
        <p className="mt-2 text-[var(--foreground-muted)]">방장에게 받은 6자리 코드를 입력하세요.</p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            applyJoin(await call("ox:join", { code: codeInput.trim() }));
          }}
        >
          <input
            value={codeInput}
            onChange={(e) => setCodeInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
            inputMode="numeric"
            placeholder="123456"
            className="h-14 w-44 rounded-xl border border-[var(--border)] text-center font-mono text-2xl tracking-widest"
          />
          <Button size="lg" disabled={codeInput.length !== 6 || !connected}>입장</Button>
        </form>
        {isHostRole && (
          <button onClick={async () => applyJoin(await call("ox:create"))} disabled={!connected} className="mt-6 cursor-pointer text-sm font-semibold text-[var(--brand)] underline underline-offset-4">
            방장으로 새 방 만들기
          </button>
        )}
        {error && <p className="mt-4 text-sm text-[var(--error)]">{error}</p>}
        {!connected && <p className="mt-4 text-xs text-[var(--foreground-subtle)]">연결하는 중…</p>}
      </Center>
    );
  }

  const me = snap.players.find((p) => p.userId === user.id);
  const secLeft = question && snap.status === "question" ? Math.max(0, Math.ceil((question.endsAt - now) / 1000)) : 0;
  const ranking = [...snap.players].sort((a, b) => b.score - a.score);

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:py-12">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-[var(--foreground-muted)]">방 코드</p>
          <p className="font-mono text-3xl font-extrabold tracking-widest">{snap.code}</p>
        </div>
        <div className="text-right text-sm text-[var(--foreground-muted)]">
          {snap.set ? `${snap.set.title} · ${snap.solved.length}/${snap.set.total}` : "문제 세트 고르는 중"}
          <br />내 점수 <strong className="text-[var(--brand)]">{me?.score ?? 0}</strong>
          {!connected && <span className="ml-2 text-[var(--error)]">다시 연결 중…</span>}
        </div>
      </div>

      {error && <p className="mt-4 rounded-xl bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      {/* 대기실 */}
      {snap.status === "lobby" && (
        <div className="card mt-6 p-6">
          <h2 className="text-lg font-bold">대기실 · {snap.players.filter((p) => p.connected).length}명</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {snap.players.map((p) => (
              <span key={p.userId} className={cx("rounded-full px-3 py-1 text-sm", p.connected ? "bg-[var(--brand-light)] text-[var(--brand-ink)]" : "bg-[var(--surface)] text-[var(--foreground-subtle)]")}>
                {p.isHost ? "👑 " : ""}
                {p.name}
              </span>
            ))}
          </div>
          {isHost ? (
            <div className="mt-6 space-y-3">
              <select value={snap.set?.id ?? ""} onChange={(e) => host("ox:selectSet", { setId: e.target.value })} className="h-11 w-full rounded-xl border border-[var(--border)] px-3">
                <option value="" disabled>문제 세트 고르기</option>
                {sets.map((s) => (
                  <option key={s.id} value={s.id}>{s.title} ({s.count}문항)</option>
                ))}
              </select>
              <Button size="lg" className="w-full" onClick={() => host("ox:start")} disabled={!snap.set}>시작하기</Button>
              <p className="text-xs text-[var(--foreground-subtle)]">참가 주소: {typeof window !== "undefined" ? `${window.location.origin}/ox?code=${snap.code}` : ""}</p>
            </div>
          ) : (
            <p className="mt-6 text-[var(--foreground-muted)]">방장이 시작하면 문제가 나와요.</p>
          )}
        </div>
      )}

      {/* 문제 */}
      {snap.status === "question" && question && (
        <div className="mt-6">
          <div className="flex items-center justify-between text-sm text-[var(--foreground-muted)]">
            <span>Q{question.idx + 1} / {question.total}{question.section ? ` · ${question.section}` : ""}</span>
            <span className={cx("font-mono text-lg font-bold", secLeft <= 5 ? "text-[var(--error)]" : "text-[var(--brand)]")}>{secLeft}초</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-[var(--surface-muted)]">
            <div className="h-full bg-[var(--brand)] transition-all" style={{ width: `${(secLeft * 1000 * 100) / question.durationMs}%` }} />
          </div>
          <p className="mt-6 text-center text-xl font-bold leading-relaxed sm:text-2xl">{question.statement}</p>
          <div className="mt-8 grid grid-cols-2 gap-4">
            {(["O", "X"] as const).map((a) => (
              <button
                key={a}
                disabled={!!answered.mine}
                onClick={async () => {
                  const r = await call("ox:answer", { answer: a });
                  if (r.ok) setAnswered((x) => ({ ...x, mine: a }));
                  else setError(r.error ?? "");
                }}
                className={cx(
                  "h-32 cursor-pointer rounded-3xl text-6xl font-black transition disabled:cursor-default sm:h-40",
                  answered.mine === a ? "bg-[var(--brand)] text-white" : answered.mine ? "bg-[var(--surface)] text-[var(--foreground-subtle)]" : a === "O" ? "bg-sky-50 text-sky-600 hover:bg-sky-100" : "bg-rose-50 text-rose-600 hover:bg-rose-100"
                )}
              >
                {a}
              </button>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-[var(--foreground-muted)]">
            {answered.mine ? `${answered.mine}로 답했어요 · ` : ""}응답 {answered.count}/{answered.total || snap.players.filter((p) => p.connected).length}명
          </p>
        </div>
      )}

      {/* 공개 · 룰렛 · 투표 · 해설 */}
      {["reveal", "roulette", "voting", "explain"].includes(snap.status) && reveal && (
        <div className="mt-6 space-y-4">
          <div className={cx("rounded-3xl p-6 text-center", reveal.picks[user.id] === reveal.correct ? "bg-[var(--brand-light)]" : "bg-[var(--surface)]")}>
            <p className="text-sm text-[var(--foreground-muted)]">정답</p>
            <p className="text-6xl font-black text-[var(--brand)]">{reveal.correct}</p>
            <p className="mt-2 font-semibold">
              {reveal.picks[user.id] ? (reveal.picks[user.id] === reveal.correct ? "맞혔어요! +1점" : "아쉬워요") : "답하지 않았어요"}
            </p>
          </div>
          {roulette && (
            <div className="card p-5 text-center">
              <p className="text-sm text-[var(--foreground-muted)]">🎯 설명할 사람</p>
              <p className="mt-1 text-2xl font-extrabold">{roulette.winnerName}</p>
              {roulette.winnerId === user.id && roulette.speakerGuide.length > 0 && (
                <ul className="mt-3 space-y-1 text-left text-sm text-[var(--foreground-muted)]">
                  {roulette.speakerGuide.map((g) => <li key={g}>• {g}</li>)}
                </ul>
              )}
            </div>
          )}
          {snap.status === "voting" && votes && (
            <div className="card p-5 text-center">
              <p className="font-semibold">설명이 도움이 됐나요?</p>
              {votes.voters.includes(user.id) ? (
                <div className="mt-3 flex justify-center gap-3">
                  {(["good", "bad"] as const).map((v) => (
                    <button key={v} onClick={() => host("ox:vote", { vote: v })} className={cx("h-14 w-24 cursor-pointer rounded-2xl text-2xl", votes.votes[user.id] === v ? "bg-[var(--brand)] text-white" : "bg-[var(--surface)]")}>
                      {v === "good" ? "👍" : "👎"}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-sm text-[var(--foreground-muted)]">다른 분들이 평가하고 있어요.</p>
              )}
              <p className="mt-2 text-xs text-[var(--foreground-subtle)]">투표 {Object.keys(votes.votes).length}/{votes.voters.length}</p>
            </div>
          )}
          {voteResult && !roulette && snap.status !== "voting" && (
            <p className="text-center text-sm text-[var(--foreground-muted)]">
              {voteResult.winnerName}님 설명 평가 👍 {voteResult.good} · 👎 {voteResult.bad} {voteResult.awarded ? "→ +1점!" : ""}
            </p>
          )}
          {snap.status === "explain" && explain && (
            <div className="card p-6">
              <p className="text-sm font-semibold text-[var(--brand)]">해설 · 정답 {explain.correct}</p>
              <p className="mt-1 font-semibold">{explain.statement}</p>
              {explain.explanation && <Markdown md={explain.explanation} className="mt-3" />}
            </div>
          )}
          <Ranking list={ranking} me={user.id} />
          {isHost && (
            <div className="flex flex-wrap justify-center gap-2 border-t border-[var(--border-light)] pt-4">
              {snap.status === "reveal" && reveal.canRoulette && <Button variant="secondary" onClick={() => host("ox:roulette")}>🎯 설명자 뽑기</Button>}
              {snap.status === "roulette" && <Button variant="secondary" onClick={() => host("ox:startVote")}>평가 투표 시작</Button>}
              {snap.status === "voting" && <Button variant="secondary" onClick={() => host("ox:closeVote")}>투표 마감</Button>}
              {snap.status !== "explain" && <Button variant="secondary" onClick={() => host("ox:explain")}>해설 보기</Button>}
              {(snap.status === "reveal" || snap.status === "explain") && <Button onClick={() => host("ox:next")}>{reveal.remaining ? "다음 문제" : "결과 보기"}</Button>}
            </div>
          )}
        </div>
      )}

      {/* 끝 */}
      {snap.status === "ended" && (
        <div className="mt-6 space-y-4">
          <h2 className="text-center text-2xl font-extrabold">🏆 최종 순위</h2>
          <Ranking list={ranking} me={user.id} big />
          {isHost && (
            <div className="flex justify-center gap-2">
              <Button variant="secondary" onClick={() => host("ox:start")}>같은 세트 다시</Button>
            </div>
          )}
        </div>
      )}

      {isHost && snap.status !== "lobby" && snap.status !== "ended" && (
        <p className="mt-8 text-center">
          <button onClick={() => window.confirm("퀴즈를 끝낼까요?") && host("ox:end")} className="cursor-pointer text-xs text-[var(--foreground-subtle)] underline">퀴즈 끝내기</button>
        </p>
      )}
    </div>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-16 text-center">{children}</div>;
}

function Ranking({ list, me, big }: { list: PlayerView[]; me: string; big?: boolean }) {
  return (
    <ol className="card divide-y divide-[var(--border-light)]">
      {list.map((p, i) => (
        <li key={p.userId} className={cx("flex items-center gap-3 px-5", big ? "py-4" : "py-2.5", p.userId === me && "bg-[var(--brand-light)]/50")}>
          <span className="w-6 text-center font-bold text-[var(--foreground-muted)]">{i < 3 ? ["🥇", "🥈", "🥉"][i] : i + 1}</span>
          <span className={cx("flex-1", !p.connected && "text-[var(--foreground-subtle)]")}>{p.name}{p.isHost ? " 👑" : ""}</span>
          <span className="font-bold text-[var(--brand)]">{p.score}점</span>
        </li>
      ))}
    </ol>
  );
}
