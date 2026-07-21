// Simple UI sound effects via Web Audio (no external assets). One shared
// AudioContext, created lazily on first user gesture (browsers block
// autoplay audio contexts before any interaction).

const soundStore = {
  enabled: true,
  ctx: null,

  _ensureCtx() {
    if (!this.ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      this.ctx = new AC();
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    return this.ctx;
  },

  _tone(freq, duration, type = 'sine', gainPeak = 0.18, delay = 0) {
    if (!this.enabled) return;
    const ctx = this._ensureCtx();
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(0, t0);
    gain.gain.linearRampToValueAtTime(gainPeak, t0 + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + duration + 0.02);
  },

  toggle() {
    this.enabled = !this.enabled;
    return this.enabled;
  },

  move() {
    this._tone(392, 0.11, 'triangle', 0.15);
  },

  capture() {
    this._tone(587, 0.09, 'square', 0.16);
    this._tone(784, 0.13, 'square', 0.12, 0.06);
  },

  win() {
    [523, 659, 784, 1046].forEach((f, i) => this._tone(f, 0.28, 'sine', 0.18, i * 0.11));
  },

  draw() {
    this._tone(330, 0.35, 'sine', 0.14);
  },

  click() {
    this._tone(220, 0.05, 'sine', 0.08);
  },
};
