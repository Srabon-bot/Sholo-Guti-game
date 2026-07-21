# Product Requirements Document: Sholo Guti (ষোল গুটি) — Web Game

**Version:** 1.0
**Status:** Draft for build
**Owner:** [Project owner]

---

## 1. Overview

### 1.1 What
A 2D, browser-based digital adaptation of **Sholo Guti** (ষোল গুটি), a traditional Bangladeshi two-player strategy board game (regionally known as Sixteen Soldiers / Bead 16). The game is played on a 37-point board formed from a 5×5 Alquerque grid with a 6-point triangular extension on the top and bottom edges. Each player starts with 16 pieces; the objective is to capture all of the opponent's pieces or leave them with no legal move, via straight-line jumps over adjacent enemy pieces.

### 1.2 Why
The primary goal is cultural: to let the owner's Korean friends abroad **try, learn, and play** a rural Bangladeshi traditional game that would otherwise be inaccessible to them (no physical board, no local players, no English/Korean rule explanations available). The game is also being built against a 100-point evaluation rubric (Core Rules, UI/UX & Cultural Flavor, Creativity) — see Section 8.

### 1.3 Who
- **Primary audience:** People who already know Sholo Guti (can jump straight into play)
- **Secondary audience:** Complete beginners — specifically the owner's international (Korean) friends — who need an in-app tutorial and clear guidance to learn the rules from scratch
- Mixed/general audience overall; the product must serve both without friction

### 1.4 Where
- Runs entirely in a web browser, **no installation required**
- Fully responsive: desktop and mobile browsers
- Distribution: works by opening `index.html` directly, and deployable via GitHub Pages

### 1.5 When
No hard deadline; usable anytime, offline-first (no backend/server dependency for core gameplay)

### 1.6 How
- Visual direction: traditional Bangladeshi rural aesthetic — true to the reference board (parchment/clay board texture, warm palette, red vs. green pieces, hand-drawn-line feel), not a generic checkers skin
- Rules implemented exactly as specified by the owner (see Section 5) — not the looser Sri Lankan/Wikipedia variant
- Multilingual UI: English, Bangla, Korean

---

## 2. Goals & Success Criteria

- A friend with zero prior exposure to Sholo Guti can open the game, read/watch the tutorial, and correctly play a full match within minutes
- The rules engine is 100% faithful to the traditional Bangladeshi ruleset the owner specified (mandatory capture, mandatory chain capture, no promotions, etc.) — verified against the owner's reference board image
- Playable fully in-browser with no install, on both desktop and mobile
- Scores well against the evaluation checklist in Section 8

---

## 3. Information Architecture / App Structure

### 3.1 Home Page
Landing screen with navigation into the following sections:
- **Tutorial** — how to play, rules walkthrough
- **Local Play** — 2-player pass-and-play on one device
- **vs AI** — 1 player against computer opponent
- **Character Design** — select/customize piece appearance (see 3.4)

### 3.2 Navigation Bar (persistent across screens)
- **Sound on/off toggle**
- **Language switch:** Korean / English / Bangla
- **New Game button** — returns to Home Page (abandons current match state)

### 3.3 Tutorial Section
- Explains board, setup, movement, capturing, mandatory capture/chain capture, and win conditions
- Should use visuals (board diagram) alongside text, given the audience includes total beginners
- Optionally: an interactive/guided mini-board so beginners can practice a move and a capture before playing a real match

### 3.4 Character Design Section
- Lets players customize/select the visual identity of their pieces (e.g. piece skin/color variant, or a themed pawn design) before starting a match
- Exact scope (cosmetic-only vs. named "characters") to be defined during build — flagged as an open question, see Section 9

### 3.5 Local Play (2P Pass & Play)
- Both players share one device, alternating turns
- Full rules enforcement, turn indicator, mandatory-capture highlighting

### 3.6 vs AI
- Single player against a computer opponent
- AI respects full rule set (mandatory capture, forced chain continuation)
- Difficulty consideration: open question, see Section 9

---

## 4. Board Specification (derived from the owner's reference board image)

- **37 nodes total**, laid out as: a 5×5 Alquerque grid (25 points, rows C–G) + a 6-point triangle fused to the top edge (rows A–B) + a 6-point triangle fused to the bottom edge (rows H–I)
- **76 edges total**, extracted directly from the reference board image (not assumed/generic) — includes the alternating-diagonal pattern within the square (checkerboard-style diagonals, not a full X in every cell) plus the triangle connections converging into the square's center-top and center-bottom hub points
- The board must be modeled as an **explicit point graph**, not a regular grid — every legal move and capture is validated only along the real drawn connections
- **Starting setup:**
  - Player "Red" (top): 16 pieces filling rows A, B, C, D (triangle + two nearest rows of the square)
  - Player "Green" (bottom): 16 pieces filling rows F, G, H, I (mirrored)
  - Row E (the square's middle row, 5 points) starts empty
  - Red moves first

---

## 5. Core Game Rules (authoritative — owner-specified Bangladeshi ruleset)

> **Owner's rules summary (verbatim):** At the start of a Sholo Guti match, 32 total pieces are placed on the board, with each player occupying 16 points on their respective side—spanning their triangular extension and the first two rows of the central grid—leaving the central horizontal line empty. The first turn is decided randomly, often through mutual agreement or a coin toss. Players then alternate turns moving a single piece one step along marked grid lines in any direction (forward, backward, sideways, or diagonally) to an adjacent empty node. A capture is executed by leaping over an adjacent enemy piece into a vacant intersection directly beyond it, removing the jumped counter from the board. Players can chain multiple jumps in a single turn if a landing position immediately opens up another valid capture path. A player secures victory by capturing all 16 of the opponent's pieces or completely immobilizing the opponent so that no legal moves remain.

> ⚠️ **Open conflict to resolve:** this note says the first turn is **decided randomly** (coin toss / mutual agreement). The rules given earlier in this doc (and reflected in Section 4's setup) say **Red always moves first**. These two can't both be implemented as written — pick one before build: (a) Red always starts, or (b) a coin-toss/random first-player at the start of each match. The itemized rules below currently follow (a); update point 1 if you want (b).

1. Players alternate turns; Red moves first.
2. On a normal turn, a player moves one piece exactly one step along a connected board line to an **adjacent empty point**. Pieces cannot move through empty space or skip a line that isn't drawn.
3. **Capturing:** a piece captures by jumping over an adjacent opponent piece to the empty point immediately beyond it, along the same straight line (as defined by the real board graph, not a generic grid direction).
4. **Capturing is mandatory** — if any of a player's pieces has a legal capture available, the player must capture (cannot make a simple move instead).
5. **Chain captures are mandatory to continue** — if the same piece can capture again immediately after a capture, it must keep capturing until no further capture is possible for that piece.
6. **No maximum-capture rule** — when multiple capturing pieces/paths are available, the player may freely choose which piece and which path to use.
7. All pieces are identical — no promotions, kings, or special abilities.
8. **Win condition:** a player wins when the opponent has zero pieces remaining, or the opponent has no legal move on their turn.
9. **Draw handling** (digital-only addition, since traditional play settles draws by mutual agreement): threefold repetition of the same position, or 50 consecutive moves without a capture, ends the game as a draw.

---

## 6. Functional Requirements

### 6.1 Core Rules Engine (maps to rubric Section 1 — 40 pts)
- [ ] Correct implementation of movement along the real 37-node/76-edge board graph
- [ ] Correct turn order and move/capture validation
- [ ] Correct win/lose detection (no pieces / no legal moves)
- [ ] Correct special-rule behavior: mandatory capture, mandatory chain capture, free choice among capture options, draw conditions

### 6.2 UI/UX & Cultural Flavor (maps to rubric Section 2 — 40 pts)
- [ ] Board and pieces are clearly legible at a glance, on both desktop and mobile
- [ ] Controls are intuitive: click/tap to select a piece, legal destinations highlighted, mandatory-capture pieces indicated
- [ ] Visual design reflects Bangladeshi rural/traditional aesthetic (not a generic checkers skin)
- [ ] Sound design: on/off toggle in nav bar, plus at least move/capture/win sound feedback
- [ ] Simple animation/victory effect on win

### 6.3 Creativity (maps to rubric Section 3 — 20 pts)
- [ ] Character Design section giving the game a personal, "made-by-you" identity beyond stock pieces
- [ ] Any additional personal touches (story framing, custom piece art, etc.) — open for the owner's input

### 6.4 Platform / Navigation
- [ ] Home page with Tutorial / Local Play / vs AI / Character Design entry points
- [ ] Persistent nav bar: Sound toggle, Language switch (EN/BN/KO), New Game (→ Home)
- [ ] Fully responsive layout
- [ ] Runs standalone from `index.html`; deployable to GitHub Pages

### 6.5 Localization
- [ ] All UI text (nav, tutorial, in-game prompts, win/draw messages) available in English, Bangla, and Korean
- [ ] Language switch applies immediately without reload where possible

---

## 7. Technical Approach

- Single-page web app, no required backend
- Board/graph data hardcoded from the owner's reference image (37 nodes with coordinates, 76 edges)
- Client-side rules engine: legal move/capture generation, mandatory-capture and chain-capture enforcement, win/draw detection
- AI opponent: search-based (minimax with alpha-beta pruning) over full "turns" (a turn = one simple move, or one complete mandatory capture chain), with a material + mobility evaluation
- Rendering: SVG or canvas-based board driven by the node graph, not a hardcoded image, so highlighting/animation/responsiveness are straightforward
- State management: in-memory game state (board position, turn, move history for undo and draw detection); no persistence required unless requested later

---

## 8. Evaluation Checklist Mapping (100 points)

| Category | Points | Covered by |
|---|---|---|
| Core rules correctly implemented | 10 | Section 5, 6.1 |
| Turns, moves, scoring follow the specified rules | 10 | Section 5, 6.1 |
| Win/lose conditions work correctly | 10 | Section 5.8, 6.1 |
| Special rules (mandatory capture, chain capture) work | 10 | Section 5.4–5.6, 6.1 |
| Board/field clear and easy to see | 10 | Section 6.2 |
| Controls and buttons intuitive | 10 | Section 6.2 |
| Design reflects the game's cultural feel | 10 | Section 1.6, 6.2 |
| Sound, animation, or victory effect included | 10 | Section 6.2 |
| Creativity — personal touches, custom characters, story, or a twist only the owner would add | 20 | Section 3.4, 6.3 |

---

## 9. Open Questions

1. **AI difficulty:** single fixed difficulty, or selectable (e.g. Easy/Medium/Hard via search depth)?
2. **Character Design scope:** purely cosmetic piece skins, or literal "characters" with names/art/lore tied to the cultural theme?
3. **Sound assets:** use royalty-free traditional-instrument-styled sounds, or simple UI sound effects?
4. **Undo:** should Local Play / vs AI allow move undo, or is that out of scope for authenticity?
5. **Tutorial format:** static text + diagram, or an interactive guided practice board?

---

## 10. Out of Scope (v1)

- Online/networked multiplayer (explicitly deferred — Local Play and vs AI only)
- Persistent accounts, leaderboards, or match history storage
- Any monetization
