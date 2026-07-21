// Wires user clicks on the rendered board to the rules engine. Capturing is
// entirely optional (house rule, see rules-engine.js): a player may make a
// simple move even when a capture exists, and may stop after any hop of a
// capture even if another jump is immediately available — via the explicit
// endTurn() action, surfaced as an "End Turn" button while a chain is live.
// (Optionally) hands the turn to the AI. Emits lifecycle events
// (move/capture/turn/gameover) so sound/UI layers can react without this
// module knowing about them.

const AI_HOP_DELAY_MS = 550;

class MatchController {
  constructor(container, options = {}) {
    this.container = container;
    this.state = createInitialState();
    this.selection = null;
    this.activeChain = null; // nodeId mid an optional capture chain, or null
    this.chainCaptured = [];
    this.onEvent = options.onEvent || (() => {});
    this.pieceSkin = options.pieceSkin || {};
    this.pieceImages = options.pieceImages || {};
    this.aiPlayer = options.aiPlayer || null; // 'red' | 'green' | null
    this.aiDifficulty = options.aiDifficulty || 'medium';
    this._destroyed = false;

    this._clickHandler = (e) => {
      const target = e.target.closest('[data-node]');
      if (!target) return;
      this.handleNodeClick(target.getAttribute('data-node'));
    };
    this.container.addEventListener('click', this._clickHandler);

    this.render();
    this._maybeTriggerAI();
  }

  destroy() {
    this._destroyed = true;
    this.container.removeEventListener('click', this._clickHandler);
  }

  isHumanTurn() {
    return this.state.currentPlayer !== this.aiPlayer;
  }

  hasActiveChain() {
    return !!this.activeChain;
  }

  handleNodeClick(nodeId) {
    if (this.state.result) return;
    if (!this.isHumanTurn()) return;

    if (this.activeChain) {
      const opt = getImmediateCaptures(this.state.board, this.activeChain).find(c => c.to === nodeId);
      if (opt) this._applyCaptureStep(opt, this.activeChain);
      return;
    }

    const player = this.state.currentPlayer;

    if (this.state.board[nodeId] === player) {
      const selectable = pieceIsMovable(this.state.board, nodeId);
      this.selection = (this.selection === nodeId) ? null : (selectable ? nodeId : null);
      this.render();
      return;
    }

    if (this.selection) {
      const captureOpt = getImmediateCaptures(this.state.board, this.selection).find(c => c.to === nodeId);
      if (captureOpt) {
        this._applyCaptureStep(captureOpt, this.selection);
        return;
      }
      if (this.state.board[nodeId] === null && BOARD_ADJACENCY[this.selection].includes(nodeId)) {
        this._applySimpleMove({ from: this.selection, to: nodeId });
      }
    }
  }

  // Explicit action: stop an optional chain early even though another
  // capture is still available for the currently-active piece.
  endTurn() {
    if (!this.activeChain) return;
    this._finalizeCapture(this.state.board);
  }

  _applySimpleMove(move) {
    const end = applyTurn(this.state, move);
    this.selection = null;
    this.onEvent({ type: 'move' });
    this._afterTurn(end);
  }

  _applyCaptureStep(step, from) {
    const board = this.state.board;
    const mover = board[from];
    const newBoard = { ...board, [from]: null, [step.over]: null, [step.to]: mover };
    this.state.board = newBoard;
    this.chainCaptured.push(step.over);

    const further = getImmediateCaptures(newBoard, step.to);
    if (further.length > 0) {
      // Continuing is optional: stay selected on this piece, but the
      // player may call endTurn() instead of continuing. activeChain is
      // set BEFORE onEvent fires, so listeners (e.g. the End Turn button
      // visibility) see the correct, final state — not a stale one.
      this.activeChain = step.to;
      this.selection = step.to;
      this.render();
      this.onEvent({ type: 'capture' });
      return;
    }

    this.onEvent({ type: 'capture' });
    this._finalizeCapture(newBoard);
  }

  _finalizeCapture(finalBoard) {
    const end = applyTurn(this.state, { captured: this.chainCaptured, finalBoard });
    this.activeChain = null;
    this.selection = null;
    this.chainCaptured = [];
    this._afterTurn(end);
  }

  _afterTurn(end) {
    this.render();
    // Fired once per completed turn (simple move or capture sequence),
    // always AFTER the state has fully settled (currentPlayer switched,
    // result set if applicable) — distinct from the per-hop move/capture
    // sound events above, which fire before the turn is actually over.
    this.onEvent({ type: end.over ? 'gameover' : 'turn', result: this.state.result });
    if (!end.over) this._maybeTriggerAI();
  }

  _maybeTriggerAI() {
    if (this.state.result) return;
    if (this.state.currentPlayer !== this.aiPlayer) return;
    setTimeout(() => this._runAITurn(), 400);
  }

  _runAITurn() {
    if (this._destroyed) return;
    const turn = chooseAIMove(this.state, this.aiDifficulty);
    if (!turn) return;

    if (!turn.captured) {
      const end = applyTurn(this.state, turn);
      this.onEvent({ type: 'move' });
      this._afterTurn(end);
      return;
    }

    // Reveal a multi-jump AI capture one hop at a time — otherwise a long
    // chain just makes several pieces vanish at once with no visible cause.
    this._animateAIChain(turn, 0);
  }

  _animateAIChain(turn, index) {
    if (this._destroyed) return;
    const from = turn.path[index];
    const to = turn.path[index + 1];
    const over = turn.captured[index];
    const mover = this.state.board[from];
    const newBoard = { ...this.state.board, [from]: null, [over]: null, [to]: mover };
    this.state.board = newBoard;
    this.render();
    this.onEvent({ type: 'capture' });

    if (index + 1 < turn.captured.length) {
      setTimeout(() => this._animateAIChain(turn, index + 1), AI_HOP_DELAY_MS);
      return;
    }

    const end = applyTurn(this.state, { captured: turn.captured, finalBoard: newBoard });
    this._afterTurn(end);
  }

  render() {
    const canCaptureFrom = new Set(); // pieces with a capture available (informational, not mandatory)
    const movableFrom = new Set();    // pieces with ANY legal move
    const legalTo = new Set();

    if (this.activeChain) {
      movableFrom.add(this.activeChain);
      canCaptureFrom.add(this.activeChain);
      for (const c of getImmediateCaptures(this.state.board, this.activeChain)) legalTo.add(c.to);
    } else {
      const player = this.state.currentPlayer;
      for (const node of nodesOwnedBy(this.state.board, player)) {
        const captures = getImmediateCaptures(this.state.board, node);
        const hasSimple = BOARD_ADJACENCY[node].some(n => this.state.board[n] === null);
        if (captures.length > 0) canCaptureFrom.add(node);
        if (captures.length > 0 || hasSimple) movableFrom.add(node);
      }
      if (this.selection) {
        for (const c of getImmediateCaptures(this.state.board, this.selection)) legalTo.add(c.to);
        for (const n of BOARD_ADJACENCY[this.selection]) {
          if (this.state.board[n] === null) legalTo.add(n);
        }
      }
    }

    renderBoard(this.container, this.state, {
      selected: this.activeChain || this.selection,
      canCaptureFrom,
      movableFrom,
      legalTo,
      pieceSkin: this.pieceSkin,
      pieceImages: this.pieceImages,
    });
  }

  reset() {
    this.state = createInitialState();
    this.selection = null;
    this.activeChain = null;
    this.chainCaptured = [];
    this.render();
    this._maybeTriggerAI();
  }
}
