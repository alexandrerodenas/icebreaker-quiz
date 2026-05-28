import { NextResponse } from 'next/server';
import { getOrCreateGameState, addPlayerToGame, updateScore, advanceQuestion, getGameState, endGame } from '@/lib/gameState';
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
  
  return NextResponse.json({
    gameId,
    players: Array.from(state.players),
    scores: state.scores,
    currentQuestionIndex,
    currentQuestion: currentQuestion ? {
      id: currentQuestion.id,
      text: currentQuestion.text,
      options: currentQuestion.options,
      illustration: currentQuestion.illustration
    } : null,
    isActive: state.isActive,
    startTime: state.startTime,
    duration: state.duration,
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
    
    const state = getGameState(gameId);
    if (!state) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }
    
    const currentQuestionIndex = state.currentQuestionIndex;
    const currentQuestion = questions[currentQuestionIndex];
    
    if (!currentQuestion) {
      return NextResponse.json({ error: 'No current question' }, { status: 400 });
    }
    
    let points = 0;
    if (answerIndex === currentQuestion.correctAnswerIndex) {
      points = 1; // 1 point for correct answer
    }
    
    updateScore(gameId, playerName, points);
    
    return NextResponse.json({
      success: true,
      correct: answerIndex === currentQuestion.correctAnswerIndex,
      points,
      correctAnswerIndex: currentQuestion.correctAnswerIndex,
      explanation: `The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswerIndex]}`
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
