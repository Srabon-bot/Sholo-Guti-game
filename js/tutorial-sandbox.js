// A minimal free-play sandbox for the Tutorial screen: only the Red side
// is interactive (Green pieces are just obstacles), turn never switches,
// and once the demonstrated move/capture completes the scenario freezes.
// This intentionally does NOT reuse MatchController — it has none of the
// two-player turn/AI machinery, just enough rules-engine wiring to let a
// beginner try one move or one capture safely.
//
// Scenarios come in two flavors:
//  - interactive (move/capture/chain): the user clicks Red and plays it out;
//    onComplete(kind) fires once the drill finishes (no further capture
//    available for that piece).
//  - static (setup/stalemate): nothing to click, just something to look at
//    — onComplete(kind) fires immediately on load so the tutorial's
//    checklist can mark "viewed" steps done without requiring a fake drill.

const TUTORIAL_SCENARIOS = {
  setup: {
    interactive: false,
    board: () => {
      const board = {};
      for (const nodeId of Object.keys(BOARD_NODES)) board[nodeId] = startingOwner(nodeId);
      return board;
    },
  },
  move: {
    interactive: true,
    board: () => {
      const board = emptyBoard();
      board.D2 = 'red';
      board.D4 = 'red';
      board.G2 = 'green';
      board.G4 = 'green';
      return board;
    },
  },
  capture: {
    interactive: true,
    board: () => {
      const board = emptyBoard();
      board.D2 = 'red';
      board.E2 = 'green';
      // F2 left empty: D2 jumps E2 landing on F2 (verified via JUMP_MAP).
      board.G4 = 'green';
      return board;
    },
  },
  chain: {
    interactive: true,
    board: () => {
      const board = emptyBoard();
      // D1 jumps D2 landing D3, then immediately jumps D4 landing D5 —
      // two collinear hops along row D (verified via JUMP_MAP).
      board.D1 = 'red';
      board.D2 = 'green';
      board.D4 = 'green';
      return board;
    },
  },
  stalemate: {
    interactive: false,
    // Green's only piece (I2) has every neighbor occupied (I1, I3, H2) and
    // its one possible jump — over H2 landing G3 — is also blocked by
    // occupying G3, so it has no simple move and no capture: a genuine
    // no-legal-move position, reduced to the smallest board that shows it.
    trapped: ['I2'],
    board: () => {
      const board = emptyBoard();
      board.I2 = 'green';
      board.I1 = 'red';
      board.I3 = 'red';
      board.H2 = 'red';
      board.G3 = 'red';
      return board;
    },
  },
};

function emptyBoard() {
  const board = {};
  for (const n of Object.keys(BOARD_NODES)) board[n] = null;
  return board;
}

class TutorialSandbox {
  constructor(container, onComplete) {
    this.container = container;
    this.onComplete = onComplete || (() => {});
    this.selection = null;
    this.forcedChain = null;
    this.done = false;
    this.interactive = true;
    this.trapped = [];
    this._clickHandler = (e) => {
      const t = e.target.closest('[data-node]');
      if (t) this.handleClick(t.getAttribute('data-node'));
    };
    this.container.addEventListener('click', this._clickHandler);
  }

  destroy() {
    this.container.removeEventListener('click', this._clickHandler);
  }

  loadScenario(kind) {
    const scenario = TUTORIAL_SCENARIOS[kind];
    this.kind = kind;
    this.interactive = scenario.interactive !== false;
    this.trapped = scenario.trapped || [];
    this.state = {
      board: scenario.board(),
      currentPlayer: 'red',
      noCaptureCount: 0,
      positionHistory: [],
      result: null,
    };
    this.selection = null;
    this.forcedChain = null;
    this.done = !this.interactive;
    this.render();
    if (!this.interactive) this.onComplete(this.kind);
  }

  handleClick(nodeId) {
    if (!this.interactive || this.done) return;

    if (this.forcedChain) {
      const opt = getImmediateCaptures(this.state.board, this.forcedChain).find(c => c.to === nodeId);
      if (opt) this._captureStep(opt, this.forcedChain);
      return;
    }

    if (this.state.board[nodeId] === 'red') {
      const selectable = pieceIsMovable(this.state.board, nodeId);
      this.selection = (this.selection === nodeId) ? null : (selectable ? nodeId : null);
      this.render();
      return;
    }
    if (this.selection) {
      const captureOpt = getImmediateCaptures(this.state.board, this.selection).find(c => c.to === nodeId);
      if (captureOpt) {
        this._captureStep(captureOpt, this.selection);
        return;
      }
      if (this.state.board[nodeId] === null && BOARD_ADJACENCY[this.selection].includes(nodeId)) {
        this._simpleMove({ from: this.selection, to: nodeId });
      }
    }
  }

  _simpleMove(move) {
    this.state.board = applySimpleMove(this.state.board, move);
    this.selection = null;
    this.done = true;
    soundStore.move();
    this.render();
    this.onComplete(this.kind);
  }

  _captureStep(step, from) {
    const board = this.state.board;
    const mover = board[from];
    const newBoard = { ...board, [from]: null, [step.over]: null, [step.to]: mover };
    this.state.board = newBoard;
    soundStore.capture();

    const further = getImmediateCaptures(newBoard, step.to);
    if (further.length > 0) {
      this.forcedChain = step.to;
      this.selection = step.to;
      this.render();
      return;
    }
    this.forcedChain = null;
    this.selection = null;
    this.done = true;
    this.render();
    this.onComplete(this.kind);
  }

  render() {
    const canCaptureFrom = new Set();
    const movableFrom = new Set();
    const legalTo = new Set();

    if (this.forcedChain) {
      movableFrom.add(this.forcedChain);
      canCaptureFrom.add(this.forcedChain);
      for (const c of getImmediateCaptures(this.state.board, this.forcedChain)) legalTo.add(c.to);
    } else if (this.interactive && !this.done) {
      for (const node of nodesOwnedBy(this.state.board, 'red')) {
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
      selected: this.forcedChain || this.selection,
      canCaptureFrom, movableFrom, legalTo,
      trapped: new Set(this.trapped),
    });
  }
}
