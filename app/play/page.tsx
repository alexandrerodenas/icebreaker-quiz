"use client";

import { useEffect, useState, useRef, useMemo } from 'react';
import useSWR from 'swr';

interface GameState {
  players: string[];
  scores: Record<string, number>;
  currentQuestionIndex: number;
  currentQuestion: { id: number; text: string; options: string[]; illustration?: string; illustrations?: string[]; correctAnswerIndex: number } | null;
  isActive: boolean;
  phase: 'answering' | 'verdict';
  questionStartTime: number;
  questionDuration: number;
  verdictStartTime: number | null;
  playerResults: { player: string; correct: boolean; hasAnswered: boolean }[] | null;
  totalQuestions: number;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

const EMOJIS = ['😎', '🤩', '🥳', '😏', '🧐', '🤓', '😈', '👑', '🦊', '🐉', '🦄', '🚀', '🌟', '💎', '🎯'];
const SUSPENSE_MESSAGES = [
  '🔮 L\'oracle de la glace réfléchit...',
  '🧊 Les autres joueurs fondent encore...',
  '🎯 Ça chauffe, encore quelques secondes...',
  '❄️ Le verdict gèle les mauvaises réponses...',
  '⏳ Suspense insoutenable...',
  '🕒 On attend les retardataires...',
];
const CONFETTI_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#06b6d4'];

export default function PlayPage() {
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [initialized, setInitialized] = useState(false);
  const [hasAnswered, setHasAnswered] = useState(false);
  const [confettiPieces, setConfettiPieces] = useState<{ id: number; color: string; left: number; delay: number }[]>([]);
  const [suspenseMessageIndex, setSuspenseMessageIndex] = useState(0);
  const [now, setNow] = useState(Date.now());
  const emojiRef = useRef(EMOJIS[Math.floor(Math.random() * EMOJIS.length)]);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('gameId');
    const player = urlParams.get('player');
    if (id) setGameId(id);
    if (player) setPlayerName(decodeURIComponent(player));
    if (id || player) setInitialized(true);
  }, []);

  const { data: gameState, isLoading, error } = useSWR<GameState>(
    initialized && gameId ? `/api/gameState?gameId=${gameId}` : null,
    fetcher,
    { refreshInterval: 1000 }
  );

  // Reset hasAnswered when a new answering phase starts
  useEffect(() => {
    if (gameState?.phase === 'answering') {
      setHasAnswered(false);
    }
  }, [gameState?.currentQuestionIndex, gameState?.phase]);

  // Cycle suspense messages while waiting
  useEffect(() => {
    if (!hasAnswered || gameState?.phase !== 'answering') return;
    const id = setInterval(() => {
      setSuspenseMessageIndex((i) => (i + 1) % SUSPENSE_MESSAGES.length);
    }, 3000);
    return () => clearInterval(id);
  }, [hasAnswered, gameState?.phase]);

  // Live timer — always mounted, check game state inside
  useEffect(() => {
    const isGameOver = !gameState?.isActive || (gameState?.currentQuestionIndex ?? 0) >= (gameState?.totalQuestions ?? 0);
    if (!isGameOver) {
      const id = setInterval(() => setNow(Date.now()), 200);
      return () => clearInterval(id);
    }
  }, [gameState?.isActive, gameState?.currentQuestionIndex, gameState?.totalQuestions]);

  // Confetti trigger for verdict
  const myResult = useMemo(
    () => gameState?.playerResults?.find((r) => r.player === playerName),
    [gameState?.playerResults, playerName]
  );
  useEffect(() => {
    if (gameState?.phase === 'verdict' && myResult?.correct && confettiPieces.length === 0) {
      triggerConfetti();
    }
  }, [gameState?.phase, myResult?.correct]);

  const triggerConfetti = () => {
    const pieces = Array.from({ length: 20 }, (_, i) => ({
      id: i,
      color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setConfettiPieces(pieces);
    setTimeout(() => setConfettiPieces([]), 3500);
  };

  const handleAnswer = async (answerIndex: number) => {
    if (hasAnswered || gameState?.phase !== 'answering') return;
    setHasAnswered(true);
    try {
      const res = await fetch('/api/gameState', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, playerName, answerIndex }),
      });
      await res.json();
    } catch {
      // Silently fail
    }
  };

  if (!initialized) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        <div className="text-2xl text-slate-400 animate-shimmer rounded-xl px-8 py-4">Chargement...</div>
      </div>
    );
  }

  if (!gameId || !playerName) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        <div className="glass rounded-3xl max-w-md w-full p-8 text-center space-y-4 animate-bounce-in">
          <div className="text-6xl">😕</div>
          <h1 className="text-2xl font-bold font-fredoka text-white">Partie introuvable</h1>
          <p className="text-slate-400">Vérifie ton code et ton pseudo, puis réessaie !</p>
          <a
            href="/"
            className="inline-block w-full py-3 px-6 rounded-2xl font-bold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            🔙 Retour à l&apos;accueil
          </a>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        <div className="text-center space-y-4">
          <div className="text-5xl animate-float">🧊</div>
          <div className="text-slate-400 animate-shimmer rounded-xl px-8 py-3">Chargement de la partie...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
      >
        <div className="glass rounded-3xl max-w-md w-full p-8 text-center space-y-4 animate-bounce-in">
          <div className="text-6xl">💥</div>
          <h1 className="text-2xl font-bold font-fredoka text-white">Oups !</h1>
          <p className="text-slate-400">Impossible de charger la partie. Réessaie !</p>
          <a
            href="/"
            className="inline-block w-full py-3 px-6 rounded-2xl font-bold text-white transition-all duration-300"
            style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
          >
            🔙 Retour
          </a>
        </div>
      </div>
    );
  }

  if (!gameState) return null;

  const {
    players,
    scores,
    currentQuestionIndex,
    currentQuestion,
    isActive,
    phase,
    questionStartTime,
    questionDuration,
    verdictStartTime,
    playerResults,
    totalQuestions,
  } = gameState;

  const isGameOver = !isActive || currentQuestionIndex >= totalQuestions;

  // ─── Game Over Screen ───

  if (isGameOver) {
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => (b as number) - (a as number))
      .map(([player, score], index) => ({ player, score: score as number, rank: index + 1 }));

    const winnerEmoji = sortedScores[0]?.rank === 1 ? '👑' : '🎉';

    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #312e81, #1e3a5f)' }}
      >
        {confettiPieces.map((p) => (
          <div
            key={p.id}
            className="absolute top-0 w-2 h-2 rounded-full animate-confetti"
            style={{
              left: `${p.left}%`,
              animationDelay: `${p.delay}s`,
              backgroundColor: p.color,
            }}
          />
        ))}

        <div className="relative z-10 w-full max-w-md animate-bounce-in text-center space-y-6">
          <div className="text-7xl mb-2">{winnerEmoji}</div>
          <h1 className="text-4xl font-bold font-fredoka gradient-text">Partie terminée !</h1>
          <p className="text-slate-300 text-lg">Voici les scores finaux 🏆</p>

          <div className="space-y-3">
            {sortedScores.map(({ player, score, rank }) => {
              const medal = rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`;
              const isMe = player === playerName;
              return (
                <div
                  key={player}
                  className={`glass rounded-2xl p-4 flex items-center justify-between transition-all duration-300 card-glow ${
                    isMe ? 'ring-2 ring-blue-400/50' : ''
                  }`}
                  style={{ animationDelay: `${rank * 0.1}s` }}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{medal}</span>
                    <span className={`font-bold text-lg ${isMe ? 'text-blue-300' : 'text-white'}`}>
                      {player} {isMe && '(moi)'}
                    </span>
                  </div>
                  <span className="text-xl font-bold font-fredoka text-transparent bg-clip-text"
                    style={{ backgroundImage: 'linear-gradient(135deg, #f59e0b, #ec4899)' }}
                  >
                    {score} pts
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3 pt-4">
            <a
              href="/"
              className="flex-1 py-3 px-6 rounded-2xl font-bold text-white text-center transition-all duration-300 active:scale-95"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
            >
              🔄 Nouvelle partie
            </a>
            <a
              href={`/?gameId=${gameId}`}
              className="flex-1 py-3 px-6 rounded-2xl font-bold text-white/80 text-center transition-all duration-300 active:scale-95 glass"
            >
              📋 Rejouer ce code
            </a>
          </div>
        </div>
      </div>
    );
  }

  // ─── ANSWERING PHASE ───

  if (phase === 'answering') {
    const elapsed = now - questionStartTime;
    const remaining = Math.max(0, questionDuration - elapsed);
    const remainingSecs = Math.floor(remaining / 1000);
    const progress = Math.max(0, remaining / questionDuration);

    return (
      <div className="min-h-screen flex flex-col p-4 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)' }}
      >
        <div className="relative z-10 max-w-lg mx-auto w-full space-y-4 pt-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{emojiRef.current}</span>
              <span className="font-bold text-white">{playerName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">👥</span>
              <span className="text-slate-300 text-sm font-semibold">{players?.length || 1}</span>
            </div>
          </div>

          {/* Progress */}
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500 ease-out"
                style={{
                  width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                  background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
                }}
              />
            </div>
            <span className="text-sm font-bold text-slate-300 font-fredoka">
              {currentQuestionIndex + 1}/{totalQuestions}
            </span>
          </div>

          {/* Timer */}
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-white/10 rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-linear"
                style={{
                  width: `${progress * 100}%`,
                  background: progress > 0.3
                    ? 'linear-gradient(90deg, #10b981, #3b82f6)'
                    : 'linear-gradient(90deg, #f59e0b, #ef4444)',
                }}
              />
            </div>
            <span className={`text-sm font-bold font-fredoka ${remainingSecs <= 5 ? 'text-red-400 animate-wiggle' : 'text-slate-300'}`}>
              {remainingSecs} s
            </span>
          </div>

          {/* Question card */}
          <div className="glass rounded-3xl p-6 space-y-5 card-glow animate-slide-up" key={currentQuestionIndex}>
            <h2 className="text-xl font-bold text-white leading-relaxed">
              {currentQuestion?.text || 'Chargement de la question...'}
            </h2>

            {currentQuestion?.illustrations ? (
              <div className="grid grid-cols-2 gap-3 rounded-2xl overflow-hidden">
                {currentQuestion.illustrations.map((src: string, i: number) => (
                  <img
                    key={i}
                    src={src}
                    alt={`Photo ${i + 1}`}
                    className="w-full h-44 object-cover rounded-xl"
                  />
                ))}
              </div>
            ) : currentQuestion?.illustration && (
              <div className="rounded-2xl overflow-hidden">
                <img
                  src={currentQuestion.illustration}
                  alt="Illustration"
                  className="w-full h-40 object-cover"
                />
              </div>
            )}

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion?.options?.map((option: string, index: number) => (
                <button
                  key={index}
                  onClick={() => handleAnswer(index)}
                  disabled={hasAnswered}
                  className={`w-full text-left glass rounded-2xl px-5 py-4 flex items-center gap-4 transition-all duration-300
                    ${!hasAnswered
                      ? 'hover:bg-white/15 cursor-pointer active:scale-[0.98]'
                      : 'cursor-default opacity-60'
                    }
                  `}
                >
                  <span className={`flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm
                    ${hasAnswered ? 'bg-white/20 text-white' : 'bg-white/10 text-slate-300'}
                  `}>
                    {String.fromCharCode(65 + index)}
                  </span>
                  <span className="flex-1 text-white">
                    {option}
                  </span>
                </button>
              ))}
            </div>

            {/* Suspense animation */}
            {hasAnswered && (
              <div className="animate-bounce-in space-y-4">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="text-5xl animate-float">🧊</div>
                    <div className="absolute -top-2 -right-2 text-2xl animate-ping">✨</div>
                  </div>
                </div>

                <div className="text-center space-y-2">
                  <p className="text-slate-300 font-semibold text-lg animate-pulse">
                    {SUSPENSE_MESSAGES[suspenseMessageIndex]}
                  </p>
                  <p className="text-slate-500 text-sm">
                    Les réponses sont gelées jusqu&apos;au verdict final ❄️
                  </p>
                </div>

                <div className="flex justify-center gap-1.5">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2.5 h-2.5 rounded-full bg-blue-400/60"
                      style={{ animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Scores */}
          <div className="glass rounded-2xl p-4 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">🏆 Scores en direct</h3>
            <div className="space-y-2">
              {players &&
                [...players]
                  .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
                  .map((player) => (
                    <div key={player} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{EMOJIS[Math.abs(player.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % EMOJIS.length]}</span>
                        <span className={`font-semibold ${player === playerName ? 'text-blue-300' : 'text-white'}`}>
                          {player}
                        </span>
                      </div>
                      <span className="text-lg font-bold font-fredoka gradient-text">{scores[player] || 0}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── VERDICT PHASE ───

  const verdictElapsed = verdictStartTime ? now - verdictStartTime : 0;
  const verdictRemaining = Math.max(0, 5000 - verdictElapsed);
  const verdictSecs = Math.ceil(verdictRemaining / 1000);

  return (
    <div className="min-h-screen flex flex-col p-4 relative overflow-hidden"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b, #312e81)' }}
    >
      {/* Confetti overlay */}
      {confettiPieces.map((p) => (
        <div
          key={p.id}
          className="absolute top-0 w-2 h-2 rounded-full animate-confetti z-50"
          style={{
            left: `${p.left}%`,
            animationDelay: `${p.delay}s`,
            backgroundColor: p.color,
          }}
        />
      ))}

      <div className="relative z-10 max-w-lg mx-auto w-full space-y-4 pt-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{emojiRef.current}</span>
            <span className="font-bold text-white">{playerName}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg">👥</span>
            <span className="text-slate-300 text-sm font-semibold">{players?.length || 1}</span>
          </div>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex-1 bg-white/10 rounded-full h-3 overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{
                width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%`,
                background: 'linear-gradient(90deg, #3b82f6, #8b5cf6, #ec4899)',
              }}
            />
          </div>
          <span className="text-sm font-bold text-slate-300 font-fredoka">
            {currentQuestionIndex + 1}/{totalQuestions}
          </span>
        </div>

        {/* Next question countdown */}
        <div className="flex items-center justify-center">
          <span className="text-sm text-slate-400 font-semibold">
            Prochaine question dans {verdictSecs}s...
          </span>
        </div>

        {/* Verdict card */}
        <div className="glass rounded-3xl p-6 space-y-5 card-glow animate-slide-up" key={`verdict-${currentQuestionIndex}`}>
          <h2 className="text-xl font-bold text-white leading-relaxed">
            {currentQuestion?.text || 'Question'}
          </h2>

          {/* Correct answer reveal */}
          {currentQuestion && (
            <div className="bg-green-500/20 border border-green-500/30 rounded-2xl p-4 text-center">
              <span className="text-sm text-green-400 font-semibold block mb-1">✅ Bonne réponse</span>
              <span className="text-lg font-bold text-green-200">
                {currentQuestion?.options[currentQuestion.correctAnswerIndex]}
              </span>
            </div>
          )}

          {/* Player results */}
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">👥 Résultats des joueurs</h3>
            {playerResults?.map(({ player, correct, hasAnswered }) => {
              const isMe = player === playerName;
              return (
                <div
                  key={player}
                  className={`glass rounded-2xl p-4 flex items-center justify-between transition-all duration-300 ${
                    isMe ? 'ring-2 ring-blue-400/50' : ''
                  } ${correct ? 'opacity-100' : 'opacity-80'}`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{correct ? '✅' : hasAnswered ? '❌' : '⏰'}</span>
                    <span className={`font-semibold ${isMe ? 'text-blue-300' : 'text-white'}`}>
                      {player} {isMe && '(moi)'}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-slate-300">
                    {correct ? '+1 pt' : hasAnswered ? '+0 pt' : 'Pas répondu'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Live Scores */}
          <div className="glass rounded-2xl p-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-3">🏆 Scores</h3>
            <div className="space-y-2">
              {players &&
                [...players]
                  .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
                  .map((player) => (
                    <div key={player} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{EMOJIS[Math.abs(player.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)) % EMOJIS.length]}</span>
                        <span className={`font-semibold ${player === playerName ? 'text-blue-300' : 'text-white'}`}>
                          {player}
                        </span>
                      </div>
                      <span className="text-lg font-bold font-fredoka gradient-text">{scores[player] || 0}</span>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Revelation animation */}
        <div className="flex justify-center text-3xl animate-bounce-in">
          🎉
        </div>
      </div>
    </div>
  );
}
