// Simple in-memory game state store
// In a real app, you would use a database or WebSocket service

import { questions } from '@/lib/questions';

const gameStates = new Map();

export function getOrCreateGameState(gameId) {
  if (!gameStates.has(gameId)) {
    gameStates.set(gameId, {
      players: new Set(),
      currentQuestionIndex: 0,
      scores: {}, // playerName => score
      startTime: Date.now(),
      duration: 10 * 60 * 1000, // 10 minutes in milliseconds
      isActive: true,
    });
  }
  return gameStates.get(gameId);
}

export function addPlayerToGame(gameId, playerName) {
  const state = getOrCreateGameState(gameId);
  state.players.add(playerName);
  if (!state.scores[playerName]) {
    state.scores[playerName] = 0;
  }
  return state;
}

export function updateScore(gameId, playerName, points) {
  const state = gameStates.get(gameId);
  if (state && state.scores[playerName] !== undefined) {
    state.scores[playerName] += points;
  }
}

export function advanceQuestion(gameId) {
  const state = gameStates.get(gameId);
  if (state) {
    state.currentQuestionIndex += 1;
    if (state.currentQuestionIndex >= questions.length) {
      state.isActive = false;
    }
  }
}

export function getGameState(gameId) {
  return gameStates.get(gameId);
}

export function endGame(gameId) {
  const state = gameStates.get(gameId);
  if (state) {
    state.isActive = false;
  }
}
