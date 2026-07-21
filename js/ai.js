// AI opponent: minimax with alpha-beta pruning, searching over full TURNS
// (a turn = one simple move, or one complete mandatory capture chain),
// with a material + mobility evaluation.
//
// Two safety measures keep this from ever freezing the tab, without
// affecting the real game's rule fidelity:
//  1. Iterative deepening inside a per-difficulty time budget, so total
//     search time is bounded by wall-clock, not by branching factor.
//  2. Internal search nodes cap capture-chain enumeration (see
//     rules-engine.js) — some hypothetical positions minimax explores
//     many plies deep can have pathologically large branching capture
//     trees that a realistic board never approaches (verified by
//     self-play testing). The cap only affects lookahead quality at
//     those exotic internal nodes; the AI's actual root move choice and
//     every real in-game legality check still uses full, exact
//     enumeration.

const AI_TIME_BUDGET_MS = { easy: 120, medium: 350, hard: 900 };
const AI_MAX_DEPTH = { easy: 3, medium: 6, hard: 12 };
const INTERNAL_CHAIN_LIMIT = 40;

function evaluateBoard(board, aiPlayer) {
  const opponent = otherPlayer(aiPlayer);
  const myPieces = nodesOwnedBy(board, aiPlayer).length;
  const oppPieces = nodesOwnedBy(board, opponent).length;
  const myMobility = getLegalMoves(board, aiPlayer, INTERNAL_CHAIN_LIMIT).moves.length;
  const oppMobility = getLegalMoves(board, opponent, INTERNAL_CHAIN_LIMIT).moves.length;
  return (myPieces - oppPieces) * 100 + (myMobility - oppMobility) * 2;
}

function nextBoardFor(board, move) {
  return move.captured ? move.finalBoard : applySimpleMove(board, move);
}

// Thrown to unwind the search stack the instant the time budget is spent.
class SearchTimeout extends Error {}

function minimax(board, player, depth, alpha, beta, aiPlayer, deadline) {
  if (performance.now() > deadline) throw new SearchTimeout();

  const legal = getLegalMoves(board, player, INTERNAL_CHAIN_LIMIT);
  if (legal.moves.length === 0) {
    return player === aiPlayer ? -100000 - depth : 100000 + depth;
  }
  if (depth === 0) {
    return evaluateBoard(board, aiPlayer);
  }

  const opponent = otherPlayer(player);
  const maximizing = player === aiPlayer;
  let best = maximizing ? -Infinity : Infinity;

  for (const move of legal.moves) {
    if (performance.now() > deadline) throw new SearchTimeout();
    const nb = nextBoardFor(board, move);
    const val = minimax(nb, opponent, depth - 1, alpha, beta, aiPlayer, deadline);
    if (maximizing) {
      if (val > best) best = val;
      if (val > alpha) alpha = val;
    } else {
      if (val < best) best = val;
      if (val < beta) beta = val;
    }
    if (beta <= alpha) break;
  }
  return best;
}

function searchAtDepth(state, legal, depth, deadline) {
  const aiPlayer = state.currentPlayer;
  const opponent = otherPlayer(aiPlayer);
  let bestVal = -Infinity;
  let bestMoves = [];

  for (const move of legal.moves) {
    const nb = nextBoardFor(state.board, move);
    const val = minimax(nb, opponent, depth - 1, -Infinity, Infinity, aiPlayer, deadline);
    if (val > bestVal + 1e-9) {
      bestVal = val;
      bestMoves = [move];
    } else if (Math.abs(val - bestVal) <= 1e-9) {
      bestMoves.push(move);
    }
  }
  return bestMoves;
}

function chooseAIMove(state, difficulty) {
  // Root move list: the AI's real, current decision — always exact/unbounded.
  const legal = getLegalMoves(state.board, state.currentPlayer);
  if (legal.moves.length === 0) return null;
  if (legal.moves.length === 1) return legal.moves[0];

  const budget = AI_TIME_BUDGET_MS[difficulty] || AI_TIME_BUDGET_MS.medium;
  const maxDepth = AI_MAX_DEPTH[difficulty] || AI_MAX_DEPTH.medium;
  const deadline = performance.now() + budget;

  let bestMoves = [legal.moves[0]];
  for (let depth = 1; depth <= maxDepth; depth++) {
    try {
      bestMoves = searchAtDepth(state, legal, depth, deadline);
    } catch (e) {
      if (e instanceof SearchTimeout) break;
      throw e;
    }
    if (performance.now() > deadline) break;
  }

  return bestMoves[Math.floor(Math.random() * bestMoves.length)];
}
