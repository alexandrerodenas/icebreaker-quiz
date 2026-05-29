import { NextResponse } from 'next/server';
import { getOrCreateGameState, addPlayerToGame, submitAnswer, getGameState, endGame, startGame } from '@/lib/gameState';
import { questions } from '@/lib/questions';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const gameId = searchParams.get('gameId');
  
  if (!gameId) {
    return NextResponse.json({ error: 'Game ID is required' }, { status: 400 });
  }
  
  const state = await getGameState(gameId);
  if (!state) {
    return NextResponse.json({ error: 'Game not found' }, { status: 404 });
  }
  
  const currentQuestionIndex = state.currentQuestionIndex;
  const currentQuestion = questions[currentQuestionIndex];
  
  // Compute player results during verdict phase
  let playerResults = null;
  if (state.phase === 'playing' && state.questionPhase === 'verdict' && currentQuestion) {
    playerResults = state.players.map(player => ({
      player,
      correct: state.answers[player] === currentQuestion.correctAnswerIndex,
      hasAnswered: player in state.answers,
    }));
  }
  
  return NextResponse.json({
    gameId,
    players: state.players,
    scores: { ...state.scores },
    currentQuestionIndex,
    currentQuestion: currentQuestion ? {
      id: currentQuestion.id,
      text: currentQuestion.text,
      options: currentQuestion.options,
      illustration: currentQuestion.illustration,
      illustrations: currentQuestion.illustrations,
      correctAnswerIndex: currentQuestion.correctAnswerIndex
    } : null,
    isActive: state.isActive,
    // Phase info
    phase: state.phase,
    questionPhase: state.questionPhase,
    questionStartTime: state.questionStartTime,
    questionDuration: state.questionDuration,
    verdictStartTime: state.verdictStartTime,
    playerResults,
    totalQuestions: questions.length,
    host: state.host,
  });
}

export async function POST(request) {
  try {
    const { gameId, playerName, host } = await request.json();
    
    if (!gameId || !playerName) {
      return NextResponse.json({ error: 'Game ID and player name are required' }, { status: 400 });
    }

    if (host) {
      // Creation: load or create with host
      const state = await getOrCreateGameState(gameId);
      if (!state.players.includes(playerName)) {
        state.players.push(playerName);
        if (state.scores[playerName] === undefined) {
          state.scores[playerName] = 0;
        }
      }
      state.host = playerName;
      const { getSupabase } = await import('@/lib/supabase');
      const sb = getSupabase();
      const { error } = await sb
        .from('game_states')
        .update({ state, updated_at: new Date().toISOString() })
        .eq('game_id', gameId);
      if (error) throw new Error(`Failed to save: ${error.message}`);
      
      return NextResponse.json({
        success: true,
        gameId,
        playerName,
        players: state.players,
        host: state.host,
      });
    }
    
    const state = await addPlayerToGame(gameId, playerName);
    
    return NextResponse.json({
      success: true,
      gameId,
      playerName,
      players: state.players,
      host: state.host,
    });
  } catch (error) {
    console.error('POST /api/gameState error:', error);
    return NextResponse.json({ error: 'Failed to join game' }, { status: 500 });
  }
}

export async function PATCH(request) {
  try {
    const { gameId, action, playerName } = await request.json();
    
    if (!gameId || !action) {
      return NextResponse.json({ error: 'Game ID and action are required' }, { status: 400 });
    }

    if (action === 'start') {
      const result = await startGame(gameId);
      if (result.error) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      return NextResponse.json({ success: true, message: 'Game started' });
    }
    
    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (error) {
    console.error('PATCH /api/gameState error:', error);
    return NextResponse.json({ error: 'Failed to process action' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const { gameId, playerName, answerIndex } = await request.json();
    
    if (!gameId || playerName === undefined || answerIndex === undefined) {
      return NextResponse.json({ error: 'Game ID, player name, and answer index are required' }, { status: 400 });
    }
    
    const result = await submitAnswer(gameId, playerName, answerIndex);
    
    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    const state = await getGameState(gameId);
    const currentQuestion = state ? questions[state.currentQuestionIndex] : null;
    
    return NextResponse.json({
      success: true,
      correct: result.correct,
      points: result.points,
      correctAnswerIndex: currentQuestion?.correctAnswerIndex,
      explanation: currentQuestion ? `The correct answer was: ${currentQuestion.options[currentQuestion.correctAnswerIndex]}` : '',
    });
  } catch (error) {
    console.error('PUT /api/gameState error:', error);
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
    
    await endGame(gameId);
    
    return NextResponse.json({
      success: true,
      message: 'Game ended'
    });
  } catch (error) {
    console.error('DELETE /api/gameState error:', error);
    return NextResponse.json({ error: 'Failed to end game' }, { status: 500 });
  }
}
