import { NextResponse } from 'next/server';
import { getOrCreateGameState, addPlayerToGame, submitAnswer, getGameState, endGame } from '@/lib/gameState';
import { questions } from '@/lib/questions';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  
  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
  }
  
  const state = getGameState(gameId);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  
  const currentQuestionIndex = state.currentQuestionIndex;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Compute player answers distribution during verdict phase
  let playerAnswers = null;
  if (state.questionPhase === 'verdict' && currentQuestion) {
    playerAnswers = Array.from(state.players).map(player => ({
      player,
      answerIndex: state.answers[player] ?? -1,
      answerText: state.answers[player] !== undefined
        ? currentQuestion.options[state.answers[player]]
        : null,
      hasAnswered: player in state.answers,
    }));
  }
  
  return NextResponse.json({
    gameId,
    players: Array.from(state.players),
    scores: { ...state.scores },
    currentQuestionIndex,
    currentQuestion: currentQuestion ? {
      id: currentQuestion.id,
      text: currentQuestion.text,
      options: currentQuestion.options,
      illustration: currentQuestion.illustration,
      illustrations: currentQuestion.illustrations,
      // Pour les icebreakers, on cache la "bonne réponse" — 
      // le correctAnswerIndex est arbitraire
      correctAnswerIndex: -1
    } : null,
    isActive: state.isActive,
    // Phase info
    phase: state.questionPhase,
    questionStartTime: state.questionStartTime,
    questionDuration: state.questionDuration,
    verdictStartTime: state.verdictStartTime,
    playerAnswers,
    totalQuestions: questions.length
  });
}

export async function POST(request) {
  try {
    const { gameId, playerName } = await request.json();
    
    if (!gameId || !playerName) {
      return NextResponse.json({ error: 'Game ID and player name are required' }, { status: 400 });
    }
    
    const state = addPlayerToGame(gameId, playerName);
    
    return NextResponse.json({
      success: true,
      gameId,
      playerName,
      players: Array.from(state.players)
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { gameId, playerName, answerIndex } = await request.json();
    
    if (!gameId || playerName === undefined || answerIndex === undefined) {
      return NextResponse.json({ error: 'Game ID, player name, and answer index are required' }, { status: 400 });
    }
    
    const result = submitAnswer(gameId, playerName, answerIndex);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    const state = getGameState(gameId);
    const currentQuestion = state ? questions[state.currentQuestionIndex] : null;
    
    return NextResponse.json({
      success: true,
      correct: result.correct,
      points: result.points,
      correctAnswerIndex: currentQuestion?.correctAnswerIndex,
      explanation: currentQuestion ? `The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswerIndex]}` : '',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit answer' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const gameId = searchParams.get('gameId');
    
    if (!gameId) {
      return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
    }
    
    endGame(gameId);
    
    return NextResponse.json({
      success: true,
      message: 'Game ended'
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to end game' }, { status: 500 });
  }
}
