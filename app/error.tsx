"use client";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0f172a, #1e1b4b)' }}
    >
      <div className="glass rounded-3xl max-w-md w-full p-8 text-center space-y-4 animate-bounce-in">
        <div className="text-6xl">🧊</div>
        <h1 className="text-2xl font-bold font-fredoka text-white">Oups !</h1>
        <p className="text-slate-400">
          Un problème est survenu. On relance ?
        </p>
        <button
          onClick={reset}
          className="w-full py-3 px-6 rounded-2xl font-bold text-white transition-all duration-300 active:scale-95"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          🔄 Réessayer
        </button>
        <a
          href="/"
          className="block w-full py-3 px-6 rounded-2xl font-bold text-white/80 transition-all duration-300 glass"
        >
          🏠 Retour à l&apos;accueil
        </a>
        {process.env.NODE_ENV === 'development' && (
          <details className="text-left mt-4">
            <summary className="text-sm text-slate-500 cursor-pointer">Détails techniques</summary>
            <pre className="mt-2 text-xs text-red-400 bg-black/30 rounded-xl p-3 overflow-auto max-h-40">
              {error.message}
              {error.stack}
            </pre>
          </details>
        )}
      </div>
    </div>
  );
}
