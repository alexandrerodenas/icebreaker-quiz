"use client";

import { useState } from 'react';
import Link from 'next/link';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [gameId, setGameId] = useState('');

  const generateGameId = () => {
    return Math.random().toString(36).substring(2, 8).toUpperCase();
  };

  const handleStart = (e) => {
    e.preventDefault();
    if (!playerName.trim()) {
      alert('Please enter your name');
      return;
    }
    const id = gameId || generateGameId();
    setGameId(id);
    // Redirect to play page with gameId and player as query params
    window.location.href = `/play?gameId=${id}&player=${encodeURIComponent(playerName)}`;
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md p-8 space-y-6">
        <h1 className="text-3xl font-bold text-center text-indigo-800">
          Ice Breaker Quiz
        </h1>
        <p className="text-center text-gray-600">
          Join a game with friends or play solo. Answer fun questions and see
          who knows more!
        </p>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter your name"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Game ID (optional - leave blank to create new)
            </label>
            <input
              type="text"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter existing game ID"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <button
            onClick={handleStart}
            className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50"
          >
            Start Game
          </button>
        </div>
        <p className="text-xs text-gray-500 text-center">
          Share the Game ID with others to join the same game.
        </p>
      </div>
    </div>
  );
}
