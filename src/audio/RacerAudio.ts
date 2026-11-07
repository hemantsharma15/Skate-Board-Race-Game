export class RacerAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;

  // Wind rush node
  private windNode: AudioBufferSourceNode | null = null;
  private windGain: GainNode | null = null;
  private windFilter: BiquadFilterNode | null = null;

  // Wheel rumble node
  private rumbleNode: AudioBufferSourceNode | null = null;
  private rumbleGain: GainNode | null = null;

  // Music interval
  private musicInterval: number | null = null;
  private isMuted = false;

  public init(): void {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.85, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(0.9, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.initContinuousLoops();
    } catch (e) {
      console.warn('Web Audio API not supported:', e);
    }
  }

  public resume(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  private initContinuousLoops(): void {
    if (!this.ctx || !this.sfxGain) return;

    // 1. Procedural Wind Loop (Brown / White Noise buffer)
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    this.windNode = this.ctx.createBufferSource();
    this.windNode.buffer = noiseBuffer;
    this.windNode.loop = true;

    this.windFilter = this.ctx.createBiquadFilter();
    this.windFilter.type = 'bandpass';
    this.windFilter.frequency.setValueAtTime(400, this.ctx.currentTime);
    this.windFilter.Q.setValueAtTime(1.5, this.ctx.currentTime);

    this.windGain = this.ctx.createGain();
    this.windGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.windNode.connect(this.windFilter);
    this.windFilter.connect(this.windGain);
    this.windGain.connect(this.sfxGain);
    this.windNode.start();

    // 2. Procedural Road/Wheel Rumble Loop
    const rumbleBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const rOut = rumbleBuffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      rOut[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = rOut[i];
      rOut[i] *= 3.5;
    }

    this.rumbleNode = this.ctx.createBufferSource();
    this.rumbleNode.buffer = rumbleBuffer;
    this.rumbleNode.loop = true;

    const rFilter = this.ctx.createBiquadFilter();
    rFilter.type = 'lowpass';
    rFilter.frequency.setValueAtTime(120, this.ctx.currentTime);

    this.rumbleGain = this.ctx.createGain();
    this.rumbleGain.gain.setValueAtTime(0, this.ctx.currentTime);

    this.rumbleNode.connect(rFilter);
    rFilter.connect(this.rumbleGain);
    this.rumbleGain.connect(this.sfxGain);
    this.rumbleNode.start();
  }

  public updateSpeed(speedRatio: number, isAirborne: boolean): void {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;

    // Wind increases with speed
    if (this.windGain && this.windFilter) {
      const windTargetVol = isAirborne ? 0.35 : Math.pow(speedRatio, 1.4) * 0.28;
      this.windGain.gain.setTargetAtTime(windTargetVol, now, 0.08);

      const targetFreq = 300 + speedRatio * 900 + (isAirborne ? 300 : 0);
      this.windFilter.frequency.setTargetAtTime(targetFreq, now, 0.08);
    }

    // Wheel rumble stops in air, scales with asphalt speed
    if (this.rumbleGain) {
      const rumbleTargetVol = isAirborne ? 0 : Math.min(0.22, speedRatio * 0.18);
      this.rumbleGain.gain.setTargetAtTime(rumbleTargetVol, now, 0.05);
    }
  }

  public playDrift(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(180, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playBoost(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(160, now);
    osc.frequency.exponentialRampToValueAtTime(540, now + 0.35);

    gain.gain.setValueAtTime(0.28, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.45);
  }

  public playCoin(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const notes = [987.77, 1318.51]; // B5 -> E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.04);

      gain.gain.setValueAtTime(0.14, now + idx * 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.04 + 0.12);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.04);
      osc.stop(now + idx * 0.04 + 0.12);
    });
  }

  public playClash(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Heavy thump
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.2);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.2);
  }

  public playCrash(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(20, now + 0.4);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.4);
  }

  public playRamp(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.exponentialRampToValueAtTime(600, now + 0.22);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  public playFinish(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resume();
    const now = this.ctx.currentTime;

    // Victory fanfare chords (D, F#, A, D')
    const chord = [293.66, 369.99, 440.0, 587.33];
    chord.forEach((freq, idx) => {
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.2, now + idx * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain!);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.6);
    });
  }

  public startMusic(): void {
    if (this.musicInterval !== null || !this.ctx || !this.musicGain || this.isMuted) return;
    this.resume();

    // Upbeat electronic racing bassline / arpeggio (C minor / synthwave rhythm)
    const scale = [130.81, 155.56, 174.61, 196.0, 233.08, 261.63]; // C3, Eb3, F3, G3, Bb3, C4
    let step = 0;

    this.musicInterval = window.setInterval(() => {
      if (!this.ctx || this.isMuted) return;
      const now = this.ctx.currentTime;
      const note = scale[step % scale.length];

      // Bass punch
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = step % 4 === 0 ? 'sawtooth' : 'triangle';
      osc.frequency.setValueAtTime(note, now);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.musicGain!);
      osc.start(now);
      osc.stop(now + 0.13);

      step++;
    }, 130);
  }

  public stopMusic(): void {
    if (this.musicInterval !== null) {
      clearInterval(this.musicInterval);
      this.musicInterval = null;
    }
  }

  public stopAll(): void {
    this.stopMusic();
    if (this.windGain) this.windGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
    if (this.rumbleGain) this.rumbleGain.gain.setValueAtTime(0, this.ctx?.currentTime || 0);
  }
}

export const racerAudio = new RacerAudioEngine();
