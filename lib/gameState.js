// Game state with Supabase persistence
// State is stored as JSONB in the game_states table

import { getSupabase } from '@/lib/supabase';
import { questions } from '@/lib/questions';

const QUESTION_DURATION = 20000; // 20s par question
const VERDICT_DURATION = 5000;   // 5s d'affichage des résultats

// ─── DB helpers ───

async function loadState(gameId) {
  const sb = getSupabase();
  const { data, error } = await sb
    .from('game_states')
    .select('state')
    .eq('game_id', gameId)
    .single();

  if (error) return null;
  return data.state;
}

async function saveState(gameId, state) {
  const sb = getSupabase();
  const { error } = await sb
    .from('game_states')
    .update({ state, updated_at: new Date().toISOString() })
    .eq('game_id', gameId);

  if (error) throw new Error(`Failed to save state: ${error.message}`);
}

async function loadOrCreateState(gameId) {
  const existing = await loadState(gameId);
  if (existing) return existing;

  const newState = {
    players: [],
    currentQuestionIndex: 0,
    scores: {},
    questionPhase: 'answering',
    questionStartTime: Date.now(),
    questionDuration: QUESTION_DURATION,
    verdictStartTime: null,
    answers: {},
    playersAnswered: [],
    isActive: true,
  };

  const sb = getSupabase();
  const { error } = await sb
    .from('game_states')
    .insert({ game_id: gameId, state: newState });

  if (error) throw new Error(`Failed to create game: ${error.message}`);
  return newState;
}

// ─── Public API ───

export async function getOrCreateGameState(gameId) {
  return loadOrCreateState(gameId);
}

export async function addPlayerToGame(gameId, playerName) {
  const state = await loadOrCreateState(gameId);

  if (!state.players.includes(playerName)) {
    state.players.push(playerName);
    if (state.scores[playerName] === undefined) {
      state.scores[playerName] = 0;
    }
    await saveState(gameId, state);
  }

  return state;
}

export async function submitAnswer(gameId, playerName, answerIndex) {
  const state = await loadState(gameId);
  if (!state) return { error: 'Partie introuvable' };

  if (state.questionPhase !== 'answering') {
    return { error: 'Plus en phase de réponse' };
  }
  if (state.playersAnswered.includes(playerName)) {
    return { error: 'Déjà répondu' };
  }

  const currentQuestion = questions[state.currentQuestionIndex];
  if (!currentQuestion) return { error: 'Aucune question en cours' };

  state.answers[playerName] = answerIndex;
  state.playersAnswered.push(playerName);

  const correct = answerIndex === currentQuestion.correctAnswerIndex;
  if (correct) {
    state.scores[playerName] = (state.scores[playerName] || 0) + 1;
  }

  // Si tous les joueurs ont répondu → verdict immédiat
  if (state.playersAnswered.length >= state.players.length && state.players.length > 0) {
    state.questionPhase = 'verdict';
    state.verdictStartTime = Date.now();
  }

  await saveState(gameId, state);
  return { success: true, correct, points: correct ? 1 : 0 };
}

export async function getGameState(gameId) {
  const state = await loadState(gameId);
  if (!state) return null;

  const transitions = processPhaseTransitions(state);
  if (transitions) {
    await saveState(gameId, state);
  }

  return state;
}

export async function endGame(gameId) {
  const state = await loadState(gameId);
  if (state) {
    state.isActive = false;
    await saveState(gameId, state);
  }
}

// ─── Phase transitions (pure, modifies state in-place) ───

function processPhaseTransitions(state) {
  if (!state || !state.isActive) return false;

  const now = Date.now();
  let changed = false;

  if (state.questionPhase === 'answering') {
    const elapsed = now - state.questionStartTime;
    if (elapsed >= state.questionDuration) {
      state.questionPhase = 'verdict';
      state.verdictStartTime = now;
      changed = true;
    }
  }

  if (state.questionPhase === 'verdict') {
    const elapsed = now - state.verdictStartTime;
    if (elapsed >= VERDICT_DURATION) {
      advanceQuestion(state);
      changed = true;
    }
  }

  return changed;
}

function advanceQuestion(state) {
  state.currentQuestionIndex += 1;
  if (state.currentQuestionIndex >= questions.length) {
    state.isActive = false;
  } else {
    state.questionPhase = 'answering';
    state.questionStartTime = Date.now();
    state.questionDuration = QUESTION_DURATION;
    state.verdictStartTime = null;
    state.answers = {};
    state.playersAnswered = [];
  }
}

export { QUESTION_DURATION, VERDICT_DURATION };
