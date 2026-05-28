// In-memory game state store with per-question phases
// 20s answering → 5s verdict → next question

import { questions } from '@/lib/questions';

const QUESTION_DURATION = 20000; // 20s par question
const VERDICT_DURATION = 5000;   // 5s d'affichage des résultats

const gameStates = new Map();

export function getOrCreateGameState(gameId) {
  if (!gameStates.has(gameId)) {
    gameStates.set(gameId, {
      players: new Set(),
      currentQuestionIndex: 0,
      scores: {},
      questionPhase: 'answering',
      questionStartTime: Date.now(),
      questionDuration: QUESTION_DURATION,
      verdictStartTime: null,
      answers: {},
      playersAnswered: new Set(),
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

export function submitAnswer(gameId, playerName, answerIndex) {
  const state = gameStates.get(gameId);
  if (!state) return { error: 'Partie introuvable' };

  if (state.questionPhase !== 'answering') {
    return { error: 'Plus en phase de réponse' };
  }
  if (state.playersAnswered.has(playerName)) {
    return { error: 'Déjà répondu' };
  }

  const currentQuestion = questions[state.currentQuestionIndex];
  if (!currentQuestion) return { error: 'Aucune question en cours' };

  state.answers[playerName] = answerIndex;
  state.playersAnswered.add(playerName);

  const correct = answerIndex === currentQuestion.correctAnswerIndex;
  if (correct) {
    state.scores[playerName] = (state.scores[playerName] || 0) + 1;
  }

  // Si tous les joueurs ont répondu → verdict immédiat
  if (state.playersAnswered.size >= state.players.size) {
    state.questionPhase = 'verdict';
    state.verdictStartTime = Date.now();
  }

  return { success: true, correct, points: correct ? 1 : 0 };
}

export function processPhaseTransitions(gameId) {
  const state = gameStates.get(gameId);
  if (!state || !state.isActive) return;

  const now = Date.now();

  // Fin du temps de réponse → verdict
  if (state.questionPhase === 'answering') {
    const elapsed = now - state.questionStartTime;
    if (elapsed >= state.questionDuration) {
      state.questionPhase = 'verdict';
      state.verdictStartTime = now;
    }
  }

  // Fin du verdict → question suivante
  if (state.questionPhase === 'verdict') {
    const elapsed = now - state.verdictStartTime;
    if (elapsed >= VERDICT_DURATION) {
      advanceQuestion(gameId);
    }
  }
}

export function advanceQuestion(gameId) {
  const state = gameStates.get(gameId);
  if (!state) return;

  state.currentQuestionIndex += 1;
  if (state.currentQuestionIndex >= questions.length) {
    state.isActive = false;
  } else {
    state.questionPhase = 'answering';
    state.questionStartTime = Date.now();
    state.questionDuration = QUESTION_DURATION;
    state.verdictStartTime = null;
    state.answers = {};
    state.playersAnswered = new Set();
  }
}

export function getGameState(gameId) {
  const state = gameStates.get(gameId);
  if (!state) return null;
  processPhaseTransitions(gameId);
  return gameStates.get(gameId);
}

export function endGame(gameId) {
  const state = gameStates.get(gameId);
  if (state) {
    state.isActive = false;
  }
}

export { QUESTION_DURATION, VERDICT_DURATION };
