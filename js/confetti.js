// Lightweight, dependency-free confetti burst for the win overlay.
// Creates a short-lived, pointer-events-none layer of falling pieces, then
// removes itself — no canvas, no external library.

const CONFETTI_COLORS = ['#d8a13a', '#b3311f', '#3f6b2e', '#f3dfc0', '#e8c468', '#7a1c10'];

function launchConfetti(count = 70) {
  const layer = document.createElement('div');
  layer.className = 'confetti-layer';
  document.body.appendChild(layer);

  for (let i = 0; i < count; i++) {
    const piece = document.createElement('div');
    piece.className = 'confetti-piece';
    const size = 6 + Math.random() * 7;
    piece.style.setProperty('--left', `${Math.random() * 100}vw`);
    piece.style.setProperty('--delay', `${Math.random() * 0.5}s`);
    piece.style.setProperty('--duration', `${2.2 + Math.random() * 1.6}s`);
    piece.style.setProperty('--rotate', `${Math.random() * 720 - 360}deg`);
    piece.style.setProperty('--drift', `${(Math.random() - 0.5) * 180}px`);
    piece.style.width = `${size}px`;
    piece.style.height = `${size * 0.4}px`;
    piece.style.background = CONFETTI_COLORS[Math.floor(Math.random() * CONFETTI_COLORS.length)];
    layer.appendChild(piece);
  }

  setTimeout(() => layer.remove(), 4200);
}
