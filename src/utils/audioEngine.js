/**
 * Generative Ambient Sound Engine for Aravalli Retreat
 * Synthesizes a tranquil Rajasthani desert wind drone + peaceful chime resonance.
 * 100% royalty-free, zero external audio dependencies.
 */

class AudioEngine {
  constructor() {
    this.ctx = null;
    this.isPlaying = false;
    this.masterGain = null;
    this.droneGain = null;
    this.oscillators = [];
    this.chimeInterval = null;
  }

  init() {
    if (this.ctx) return;
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    this.ctx = new AudioContext();

    this.masterGain = this.ctx.createGain();
    this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
    this.masterGain.connect(this.ctx.destination);
  }

  start() {
    this.init();
    if (!this.ctx) return;

    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isPlaying = true;
    const now = this.ctx.currentTime;

    // Master volume smooth fade-in
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.35, now + 3.0);

    // 1. Warm Drone Base (Tanpura C#2 and G#2 fundamental frequencies)
    const baseFreqs = [69.30, 103.83, 138.59, 207.65]; // C#2, G#2, C#3, G#3
    this.droneGain = this.ctx.createGain();
    this.droneGain.gain.setValueAtTime(0.18, now);

    // Low-pass warm desert filter
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, now);
    filter.Q.setValueAtTime(2.0, now);

    this.droneGain.connect(filter);
    filter.connect(this.masterGain);

    baseFreqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, now);

      // Subtle LFO detune for natural acoustic shimmer
      const lfo = this.ctx.createOscillator();
      lfo.frequency.setValueAtTime(0.1 + idx * 0.05, now);
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.setValueAtTime(1.5, now);
      lfo.connect(lfoGain);
      lfoGain.connect(osc.frequency);
      lfo.start(now);

      osc.connect(this.droneGain);
      osc.start(now);
      this.oscillators.push(osc, lfo);
    });

    // 2. Soft Wind / Shimmer Noise Generator
    this.startSoftWind(now);

    // 3. Periodic Meditative Temple Chimes (every 6-12s)
    this.scheduleChimes();
  }

  startSoftWind(now) {
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      output[i] = (lastOut + 0.02 * white) / 1.02; // Pink noise approx
      lastOut = output[i];
      output[i] *= 3.5;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;
    whiteNoise.loop = true;

    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(450, now);
    bandpass.Q.setValueAtTime(3.0, now);

    const windGain = this.ctx.createGain();
    windGain.gain.setValueAtTime(0.04, now);

    whiteNoise.connect(bandpass);
    bandpass.connect(windGain);
    windGain.connect(this.masterGain);
    whiteNoise.start(now);
    this.oscillators.push(whiteNoise);
  }

  playChime() {
    if (!this.isPlaying || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Pentatonic Rajasthani Raag frequencies (Bhogawati / Marwa notes)
    const chimeFreqs = [554.37, 659.25, 830.61, 987.77, 1108.73, 1318.51];
    const freq = chimeFreqs[Math.floor(Math.random() * chimeFreqs.length)];

    const osc = this.ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    // Harmonics
    const osc2 = this.ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2.76, now);

    const chimeGain = this.ctx.createGain();
    chimeGain.gain.setValueAtTime(0.08, now);
    chimeGain.gain.exponentialRampToValueAtTime(0.0001, now + 4.5);

    osc.connect(chimeGain);
    osc2.connect(chimeGain);
    chimeGain.connect(this.masterGain);

    osc.start(now);
    osc2.start(now);
    osc.stop(now + 4.6);
    osc2.stop(now + 4.6);
  }

  scheduleChimes() {
    const trigger = () => {
      if (!this.isPlaying) return;
      this.playChime();
      const nextDelay = (6 + Math.random() * 8) * 1000;
      this.chimeInterval = setTimeout(trigger, nextDelay);
    };
    this.chimeInterval = setTimeout(trigger, 3000);
  }

  stop() {
    if (!this.isPlaying || !this.ctx) return;
    this.isPlaying = false;
    clearTimeout(this.chimeInterval);

    const now = this.ctx.currentTime;
    this.masterGain.gain.cancelScheduledValues(now);
    this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, now);
    this.masterGain.gain.linearRampToValueAtTime(0.0001, now + 1.5);

    setTimeout(() => {
      this.oscillators.forEach(osc => {
        try { osc.stop(); } catch (e) {}
        try { osc.disconnect(); } catch (e) {}
      });
      this.oscillators = [];
    }, 1600);
  }

  toggle() {
    if (this.isPlaying) {
      this.stop();
      return false;
    } else {
      this.start();
      return true;
    }
  }
}

export const soundscape = new AudioEngine();
