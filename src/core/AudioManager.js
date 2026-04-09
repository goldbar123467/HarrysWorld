// AudioManager.js — Procedural sound effects and music via Web Audio API

import gameState from './GameState.js';
import eventBus, { Events } from './EventBus.js';

class AudioManager {
  constructor() {
    this._ctx = null;
    this._initialized = false;
    this._bgmGain = null;
    this._sfxGain = null;
    this._bgmOscillators = [];
  }

  init() {
    if (this._initialized) return;
    try {
      this._ctx = new (window.AudioContext || window.webkitAudioContext)();
      this._masterGain = this._ctx.createGain();
      this._masterGain.gain.value = 0.4;
      this._masterGain.connect(this._ctx.destination);

      this._bgmGain = this._ctx.createGain();
      this._bgmGain.gain.value = 0.15;
      this._bgmGain.connect(this._masterGain);

      this._sfxGain = this._ctx.createGain();
      this._sfxGain.gain.value = 0.5;
      this._sfxGain.connect(this._masterGain);

      this._initialized = true;
      this._setupListeners();
    } catch (e) {
      console.warn('AudioManager: Web Audio API not available');
    }
  }

  _setupListeners() {
    eventBus.on(Events.GAME_START, () => this._startBGM());
    eventBus.on(Events.GAME_OVER, () => this._stopBGM());
    eventBus.on(Events.GAME_RESTART, () => this._stopBGM());
    eventBus.on(Events.PLAYER_JUMP, () => this.playJump());
    eventBus.on(Events.PLAYER_LANDED, () => this.playLand());
    eventBus.on(Events.ITEM_COLLECTED, (data) => this.playCollect(data));
    eventBus.on(Events.SPECTACLE_COMBO, (data) => this.playCombo(data));
    eventBus.on(Events.PLAYER_DIED, () => this.playDeath());
    eventBus.on(Events.PLAYER_HIT, () => this.playHit());
    eventBus.on(Events.SPECTACLE_NEAR_MISS, () => this.playNearMiss());
    eventBus.on('powerup:collected', (data) => this.playPowerup());
    eventBus.on('audio:mute', ({ muted }) => {
      this._masterGain.gain.value = muted ? 0 : 0.4;
    });
  }

  _startBGM() {
    if (!this._initialized || gameState.isMuted) return;
    this._stopBGM();

    // Simple looping melody using oscillators
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Chord progression: C major -> F major -> G major -> C major
    const chords = [
      [261.63, 329.63, 392.00], // C major
      [349.23, 440.00, 523.25], // F major
      [392.00, 493.88, 587.33], // G major
      [261.63, 329.63, 392.00], // C major
    ];

    const beatDuration = 2.0;
    const totalDuration = chords.length * beatDuration;

    this._bgmInterval = setInterval(() => {
      if (gameState.isMuted || !this._initialized) return;
      this._playChordLoop(chords, beatDuration);
    }, totalDuration * 1000);

    this._playChordLoop(chords, beatDuration);
  }

  _playChordLoop(chords, beatDuration) {
    const ctx = this._ctx;
    const now = ctx.currentTime;

    chords.forEach((chord, i) => {
      chord.forEach((freq) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.value = freq * 0.5; // One octave lower for background

        gain.gain.value = 0;
        gain.gain.setValueAtTime(0, now + i * beatDuration);
        gain.gain.linearRampToValueAtTime(0.08, now + i * beatDuration + 0.1);
        gain.gain.linearRampToValueAtTime(0.03, now + (i + 0.8) * beatDuration);
        gain.gain.linearRampToValueAtTime(0, now + (i + 1) * beatDuration);

        osc.connect(gain);
        gain.connect(this._bgmGain);
        osc.start(now + i * beatDuration);
        osc.stop(now + (i + 1) * beatDuration);

        this._bgmOscillators.push(osc);
      });

      // Bass note
      const bass = ctx.createOscillator();
      const bassGain = ctx.createGain();
      bass.type = 'sine';
      bass.frequency.value = chord[0] * 0.25;
      bassGain.gain.value = 0;
      bassGain.gain.setValueAtTime(0, now + i * beatDuration);
      bassGain.gain.linearRampToValueAtTime(0.12, now + i * beatDuration + 0.05);
      bassGain.gain.linearRampToValueAtTime(0.04, now + (i + 0.7) * beatDuration);
      bassGain.gain.linearRampToValueAtTime(0, now + (i + 1) * beatDuration);

      bass.connect(bassGain);
      bassGain.connect(this._bgmGain);
      bass.start(now + i * beatDuration);
      bass.stop(now + (i + 1) * beatDuration);
      this._bgmOscillators.push(bass);
    });
  }

  _stopBGM() {
    if (this._bgmInterval) {
      clearInterval(this._bgmInterval);
      this._bgmInterval = null;
    }
    this._bgmOscillators.forEach(osc => {
      try { osc.stop(); } catch (e) { /* already stopped */ }
    });
    this._bgmOscillators = [];
  }

  playJump() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(300, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.1);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  playLand() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.08);

    gain.gain.setValueAtTime(0.1, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.1);
  }

  playCollect(data) {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const isPass = data && data.type === 'pass';
    const baseFreq = isPass ? 880 : 660;

    // Two-tone pickup sound
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'square';
    osc1.frequency.value = baseFreq;
    osc2.type = 'square';
    osc2.frequency.value = baseFreq * 1.5;

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.setValueAtTime(0.12, now + 0.08);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(this._sfxGain);

    osc1.start(now);
    osc1.stop(now + 0.08);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.2);
  }

  playCombo(data) {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;
    const combo = data ? data.combo : 3;

    // Rising arpeggio based on combo count
    const baseFreq = 440 + (combo * 50);
    for (let i = 0; i < 3; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = baseFreq * (1 + i * 0.25);
      gain.gain.setValueAtTime(0.1, now + i * 0.06);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.06 + 0.15);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(now + i * 0.06);
      osc.stop(now + i * 0.06 + 0.15);
    }
  }

  playDeath() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Descending tone
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(80, now + 0.5);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.5);

    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.5);
  }

  playHit() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Quick harsh buzz to indicate damage
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(100, now + 0.15);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.linearRampToValueAtTime(0, now + 0.2);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  playNearMiss() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Quick whoosh sound
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.12);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.12);
  }

  playCheckpoint() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Cheerful ascending chime
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.1, now + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.08 + 0.2);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(now + i * 0.08);
      osc.stop(now + i * 0.08 + 0.2);
    });
  }

  playPowerup() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Rising sparkle sound
    for (let i = 0; i < 5; i++) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 500 + i * 200;
      gain.gain.setValueAtTime(0.08, now + i * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.05 + 0.1);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(now + i * 0.05);
      osc.stop(now + i * 0.05 + 0.1);
    }
  }

  playWin() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    // Victory fanfare
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.15, now + i * 0.15);
      gain.gain.linearRampToValueAtTime(0.05, now + i * 0.15 + 0.3);
      gain.gain.linearRampToValueAtTime(0, now + i * 0.15 + 0.45);
      osc.connect(gain);
      gain.connect(this._sfxGain);
      osc.start(now + i * 0.15);
      osc.stop(now + i * 0.15 + 0.45);
    });
  }

  playMenuClick() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 800;
    gain.gain.setValueAtTime(0.08, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.05);
  }

  playTimeWarning() {
    if (!this._initialized || gameState.isMuted) return;
    const ctx = this._ctx;
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'square';
    osc.frequency.value = 220;
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.15);
    osc.connect(gain);
    gain.connect(this._sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }
}

const audioManager = new AudioManager();
export default audioManager;
