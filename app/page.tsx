"use client";

import { useState } from 'react';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const generateGameId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleStart = (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Entre ton nom pour commencer ! 🎮');
      return;
    }
    const id = gameId || generateGameId();
    setGameId(id);
    window.location.href = `/play?gameId=${id}&player=${encodeURIComponent(playerName)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 30%, #312e81 60%, #1e3a5f 100%)'
      }}
    >
      {/* Floating decorations */}
      <div className="absolute top-12 left-[10%] text-5xl opacity-20 animate-float">❄️</div>
      <div className="absolute top-20 right-[15%] text-4xl opacity-20 animate-float-delayed">🧊</div>
      <div className="absolute bottom-20 left-[20%] text-5xl opacity-20 animate-float">🌟</div>
      <div className="absolute bottom-32 right-[10%] text-4xl opacity-20 animate-float-delayed">✨</div>
      <div className="absolute top-1/3 right-[8%] text-3xl opacity-15 animate-float">🎯</div>
      <div className="absolute top-2/3 left-[5%] text-3xl opacity-15 animate-float-delayed">🏆</div>

      <div className="relative z-10 w-full max-w-md">
        {/* Logo / Title card */}
        <div className="text-center mb-8 animate-slide-up">
          <div className="text-6xl mb-4 animate-bounce-in">🧊</div>
          <h1 className="text-5xl font-bold font-fredoka gradient-text mb-2">
            Ice Breaker
          </h1>
          <p className="text-xl text-slate-300">
            Le quiz qui brise la glace ! ❄️
          </p>
        </div>

        {/* Form card */}
        <div className="glass rounded-3xl p-8 space-y-6 card-glow animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <form onSubmit={handleStart} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-wide uppercase">
                👤 Ton pseudo
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Ex: GlacialMaster"
                className="w-full px-5 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent
                  transition-all duration-300 text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2 tracking-wide uppercase">
                🆔 Code de la partie
              </label>
              <input
                type="text"
                value={gameId}
                onChange={(e) => setGameId(e.target.value.toUpperCase())}
                placeholder="Laisse vide pour créer une partie"
                className="w-full px-5 py-3.5 bg-white/10 border border-white/20 rounded-2xl text-white placeholder-slate-400 
                  focus:outline-none focus:ring-2 focus:ring-blue-400/60 focus:border-transparent
                  transition-all duration-300 text-lg tracking-widest uppercase"
              />
              <p className="text-xs text-slate-500 mt-2 ml-1">
                🔗 Partage ce code avec tes potes pour qu&apos;ils rejoignent !
              </p>
            </div>

            <button
              type="submit"
              className="w-full py-4 px-6 rounded-2xl text-lg font-bold font-fredoka text-white
                transition-all duration-300 active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899)',
                boxShadow: '0 4px 20px rgba(59, 130, 246, 0.4)'
              }}
              onMouseOver={(e) => e.currentTarget.style.boxShadow = '0 6px 30px rgba(59, 130, 246, 0.6)'}
              onMouseOut={(e) => e.currentTarget.style.boxShadow = '0 4px 20px rgba(59, 130, 246, 0.4)'}
            >
              🚀 C&apos;est parti !
            </button>
          </form>
        </div>

        {/* Features */}
        <div className="mt-6 grid grid-cols-3 gap-3 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          {[
            { emoji: '👥', text: 'Multijoueur' },
            { emoji: '🧠', text: 'Questions fun' },
            { emoji: '⚡', text: 'Temps réel' },
          ].map(({ emoji, text }) => (
            <div key={text} className="glass rounded-2xl p-4 text-center card-glow">
              <div className="text-2xl mb-1">{emoji}</div>
              <div className="text-xs text-slate-400 font-semibold">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
