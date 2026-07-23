# Sholo Guti (ষোল গুটি)

A browser-based version of **Sholo Guti** ("Sixteen Pieces"), a traditional Bangladeshi strategy board game, built so friends anywhere can learn and play it — no board, no local opponent, and no prior knowledge of the rules required.

**Play it here:** https://srabon-bot.github.io/Sholo-Guti_6_U222_U224_U202/

No install, no build step, no dependencies — it's a static site that runs entirely in the browser.

## The Game

Two players, Red and Green, each start with 16 pieces on a 37-point board (a 5×5 grid with a 6-point triangle fused to the top and bottom). Pieces move one step along a drawn line in any direction; capture by jumping an adjacent enemy piece into the empty point beyond it. Chain captures are allowed but never forced, and capturing itself is optional even mid-chain — a deliberate house-rule twist on the traditional mandatory-capture version. A player wins by capturing all 16 enemy pieces or leaving the opponent with no legal move; the game is a draw after 50 moves with no capture, or if a position repeats three times.

## Features

- **Local Play** — two players, one device, pass-and-play
- **vs AI** — three difficulty levels, with moves paced and animated to be human-visible instead of instant
- **Guided Tutorial** — a six-step interactive walkthrough (setup, movement, capturing, chain captures, winning, recap) with real practice drills, not just text
- **Live Piece Tracker** — both sides show remaining and captured pieces at a glance
- **Character Design** — customize each side's piece skin, including uploading your own photo
- **Trilingual UI** — English, Bangla, and Korean, switchable at any time
- **Sound & Celebration** — move/capture/win sound effects with a mute toggle, and a confetti finish on victory
- **Fully responsive** — playable on desktop and mobile

## Running Locally

Clone the repo and open `index.html` directly in a browser, or serve the folder with any static file server, e.g.:

```bash
npx serve .
```

## Project Structure

```
index.html              Screens: Home, Tutorial, Local Play, vs AI, Character Design
css/styles.css          All styling — theme, layout, board, animations
js/board-data.js        The 37-node / 76-edge board graph and capture (jump) map
js/rules-engine.js      Move/capture legality, chain captures, win/draw detection
js/game-state.js        Game state and the single state-mutation entry point
js/ai.js                Minimax + alpha-beta AI opponent with iterative deepening
js/board-render.js      SVG board rendering
js/interaction.js       Click handling, turn flow, AI move animation
js/tutorial-sandbox.js  Standalone practice-board logic for the tutorial
js/i18n.js              English / Bangla / Korean translations
js/sound.js             Sound effects
js/confetti.js          Win-screen confetti effect
js/app.js               App shell: navigation, nav bar, screen wiring
```

## Tech Stack

Vanilla HTML, CSS, and JavaScript — no framework, no bundler, no npm dependencies. The board is rendered as SVG, driven entirely by the node/edge graph in `board-data.js` rather than a fixed image, so highlighting, animation, and responsive sizing all fall out of the same data.

## Team

Team 6 — U222, U224, U202
