"use client";

import { useEffect, useState } from 'react';
import useSWR from 'swr';

const fetcher = (url) => fetch(url).then((res) => res.json());

export default function PlayPage() {
  // In a real app, we would get gameId and player from the URL query params
  // For simplicity, we'll use placeholder values and later extract from URL
  const [gameId, setGameId] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [initialized, setInitialized] = useState(false);

  // Extract query params from URL (client-side)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const id = urlParams.get('gameId');
    const player = urlParams.get('player');
    if (id) setGameId(id);
    if (player) setPlayerName(decodeURIComponent(player));
    if (id || player) setInitialized(true);
  }, []);

  if (!initialized) {
    return <div>Loading...</div>;
  }

  if (!gameId || !playerName) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-indigo-800">
            Game Not Found
          </h1>
          <p className="text-center text-gray-600">
            Please go back and enter a valid Game ID and player name.
          </p>
          <a
            href="/"
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors block text-center"
          >
            Go Back
          </a>
        </div>
      </div>
    );
  }

  const { data: gameState, isLoading, error } = useSWR(
    `/api/gameState?gameId=${gameId}`,
    fetcher,
    {
      refreshInterval: 3000, // Poll every 3 seconds
    }
  );

  if (isLoading) return <div>Loading game...</div>;
  if (error) return <div>Failed to load game.</div>;

  const {
    players,
    scores,
    currentQuestionIndex,
    currentQuestion,
    isActive,
    startTime,
    duration,
  } = gameState;

  // Calculate remaining time
  const elapsed = Date.now() - startTime;
  const remaining = Math.max(0, duration - elapsed);
  const minutes = Math.floor(remaining / 60000);
  const seconds = Math.floor((remaining % 60000) / 1000);

  // Check if game is over (time's up or no more questions)
  const isGameOver = !isActive || remaining <= 0 || currentQuestionIndex >= 5; // Assuming 5 questions

  // Handle answer submission
  const handleAnswer = async (answerIndex) => {
    if (!isActive) return;
    try {
      await fetch(`/api/gameState`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          playerName,
          answerIndex,
        }),
      });
      // SWR will revalidate on its own due to refreshInterval, or we can trigger manually
    } catch (err) {
      console.error('Failed to submit answer:', err);
    }
  };

  if (isGameOver) {
    // Show final scores
    const sortedScores = Object.entries(scores)
      .sort(([, a], [, b]) => b - a)
      .map(([player, score], index) => ({
        player,
        score,
        rank: index + 1,
      }));

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6">
          <h1 className="text-2xl font-bold text-center text-indigo-800">
            Game Over!
          </h1>
          <p className="text-center text-gray-600">
            Thanks for playing. Here are the final scores:
          </p>
          <div className="space-y-4">
            {sortedScores.map(({ player, score, rank }) => (
              <div
                key={player}
                className={`flex justify-between items-center p-3 border rounded-lg ${
                  rank === 1 ? 'bg-yellow-50' : ''
                }`}
              >
                <div>
                  <span className="font-medium">#{rank} {player}</span>
                </div>
                <span className="font-bold text-indigo-600">{score} pts</span>
              </div>
            ))}
          </div>
          <div className="space-y-3">
            <a
              href="/"
              className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors block text-center"
            >
              Play Again
            </a>
            <a
              href={`/?gameId=${gameId}`}
              className="w-full bg-gray-300 text-gray-800 py-3 px-6 rounded-lg font-medium hover:bg-gray-400 transition-colors block text-center"
            >
              Same Game ID
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-xl font-bold text-indigo-800">
              Ice Breaker Quiz
            </h1>
            <p className="text-sm text-gray-500">
              Game ID: {gameId}
            </p>
          </div>
          <div className="text-right">
            <div className="text-sm font-medium text-indigo-600">
              Time Left: {minutes}:{seconds.toString().padStart(2, '0')}
            </div>
          </div>
        </div>

        <div className="border-t pt-4">
          {currentQuestion ? (
            <>
              <p className="text-lg font-semibold text-gray-800 mb-4">
                {currentQuestion.text}
              </p>
              {currentQuestion.illustration && (
                <div className="mb-4">
                  <img
                    src={currentQuestion.illustration}
                    alt="Illustration"
                    className="rounded-lg w-full h-48 object-cover"
                  />
                </div>
              )}
              <div className="space-y-3">
                {currentQuestion.options.map((option, index) => (
                  <button
                    key={index}
                    onClick={() => handleAnswer(index)}
                    className={`w-full text-left bg-gray-50 hover:bg-gray-100 border border-gray-300 rounded-lg px-4 py-3 flex items-start space-x-3 ${
                      // Disable button if game is not active
                      !isActive ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                  >
                    <span className="flex-shrink-0">
                      {String.fromCharCode(65 + index)}.
                    </span>
                    <span>{option}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="text-gray-500">No current question.</p>
          )}
        </div>

        <div className="border-t pt-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Scores
          </h2>
          <div className="space-y-2">
            {players &&
              Array.from(players)
                .sort((a, b) => (scores[b] || 0) - (scores[a] || 0))
                .map((player) => (
                  <div key={player} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{player}</span>
                    <span className="text-indigo-600">{scores[player] || 0} pts</span>
                  </div>
                ))}
          </div>
        </div>
      </div>
    </div>
  );
}
