// Procedural sound design (Web Audio, no audio files):
// - crank ratchet clicks + door rumble during the intro
// - a reverberant "tech warehouse" ambience faded in when entering:
//   low drone, mains hum, ventilation air, random electrical crackles, distant metal clanks
// - small UI sounds (hologram boot zap, project switch blip)

const rand = (a, b) => a + Math.random() * (b - a);

export class BaseAudio {
  constructor() {
    this.ctx = null;
    this.muted = false;
    try { this.muted = localStorage.getItem('tg-muted') === '1'; } catch { /* storage unavailable */ }
    this.ambienceStarted = false;
  }

  /** Must be called from a user gesture (browser autoplay policy). */
  init() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    const ctx = (this.ctx = new AC());

    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -18;
    comp.ratio.value = 3;
    this.master.connect(comp).connect(ctx.destination);

    // big hangar reverb (generated impulse response) — the "echo"
    this.reverb = ctx.createConvolver();
    this.reverb.buffer = this.#impulse(4.5, 2.4);
    this.wet = ctx.createGain();
    this.wet.gain.value = 0.55;
    this.reverb.connect(this.wet).connect(this.master);

    // a slap-back delay for extra metallic echo
    this.delay = ctx.createDelay(1);
    this.delay.delayTime.value = 0.23;
    const fb = ctx.createGain();
    fb.gain.value = 0.32;
    const dlp = ctx.createBiquadFilter();
    dlp.type = 'lowpass';
    dlp.frequency.value = 2200;
    this.delay.connect(dlp).connect(fb).connect(this.delay);
    dlp.connect(this.reverb);
    this.delaySend = ctx.createGain();
    this.delaySend.gain.value = 0.35;
    this.delaySend.connect(this.delay);

    this.noiseBuf = this.#noiseBuffer(3, 'white');
    this.brownBuf = this.#noiseBuffer(6, 'brown');

    // continuous door rumble (gain driven by crank speed)
    this.rumble = ctx.createGain();
    this.rumble.gain.value = 0;
    const rsrc = this.#loop(this.brownBuf);
    const rlp = ctx.createBiquadFilter();
    rlp.type = 'lowpass';
    rlp.frequency.value = 220;
    rsrc.connect(rlp).connect(this.rumble);
    this.rumble.connect(this.master);
    this.rumble.connect(this.reverb);
    // metallic rattle on top of the rumble
    const rat = this.#loop(this.noiseBuf);
    const rbp = ctx.createBiquadFilter();
    rbp.type = 'bandpass';
    rbp.frequency.value = 900;
    rbp.Q.value = 6;
    const ratG = ctx.createGain();
    ratG.gain.value = 0.25;
    rat.connect(rbp).connect(ratG).connect(this.rumble);
  }

  setMuted(m) {
    this.muted = m;
    try { localStorage.setItem('tg-muted', m ? '1' : '0'); } catch { /* ignore */ }
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(t);
    this.master.gain.setTargetAtTime(m ? 0 : 0.9, t, 0.15);
  }

  /* ---------------- intro sounds ---------------- */

  click(strength = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = rand(2600, 3400);
    bp.Q.value = 8;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.5 * strength, t + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
    src.connect(bp).connect(g);
    g.connect(this.master);
    g.connect(this.delaySend);
    src.start(t, rand(0, 2), 0.06);
    // tiny metallic ping
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.value = rand(1700, 2100);
    const og = ctx.createGain();
    og.gain.setValueAtTime(0.06 * strength, t);
    og.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    o.connect(og).connect(this.master);
    o.start(t);
    o.stop(t + 0.1);
  }

  setRumble(level) {
    if (!this.ctx) return;
    this.rumble.gain.setTargetAtTime(Math.min(1, level) * 0.6, this.ctx.currentTime, 0.08);
  }

  doorSlam() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(90, t);
    o.frequency.exponentialRampToValueAtTime(38, t + 0.5);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.9, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.reverb);
    o.start(t);
    o.stop(t + 1);
    this.#burst({ freq: 600, q: 1.5, dur: 0.25, gain: 0.5, send: 1 });
  }

  /** heavy lurch of the door: metal clunk + chain rattle + debris */
  jolt(strength = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.setValueAtTime(rand(85, 110), t);
    o.frequency.exponentialRampToValueAtTime(40, t + 0.25);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.7 * strength, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.45);
    o.connect(g);
    g.connect(this.master);
    g.connect(this.reverb);
    o.start(t);
    o.stop(t + 0.5);
    this.#burst({ freq: rand(350, 600), q: 2.5, dur: 0.18, gain: 0.6 * strength, send: 0.8 });
    // chain rattle
    for (let i = 0; i < 7; i++) setTimeout(() => this.click(0.5 * strength), 25 + i * rand(18, 35));
    // falling grit
    this.#burst({ freq: 5000, q: 0.7, dur: 0.6, gain: 0.08 * strength, send: 0.5 });
  }

  /** small stone hitting the ground */
  pebble(strength = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    this.#burst({ freq: rand(1400, 3200), q: 3, dur: 0.05, gain: 0.25 * strength, send: 0.4 });
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.frequency.value = rand(500, 900);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.08 * strength, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.04);
    o.connect(g).connect(this.master);
    o.start(t);
    o.stop(t + 0.05);
  }

  /** outside wind: gusty band-passed noise + faint whistle */
  startWind() {
    const ctx = this.ctx;
    if (!ctx || this.wind) return;
    const t = ctx.currentTime;
    const bus = (this.wind = ctx.createGain());
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(1, t + 2);
    bus.connect(this.master);
    const src = this.#loop(this.brownBuf);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 420;
    bp.Q.value = 0.5;
    const gust = ctx.createGain();
    gust.gain.value = 0.12;
    src.connect(bp).connect(gust).connect(bus);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.13;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.08;
    lfo.connect(lfoG).connect(gust.gain);
    lfo.start();
    const lfo2 = ctx.createOscillator();
    lfo2.frequency.value = 0.05;
    const lfo2G = ctx.createGain();
    lfo2G.gain.value = 250;
    lfo2.connect(lfo2G).connect(bp.frequency);
    lfo2.start();
    const wh = this.#loop(this.noiseBuf);
    const whBp = ctx.createBiquadFilter();
    whBp.type = 'bandpass';
    whBp.frequency.value = 1300;
    whBp.Q.value = 14;
    const whG = ctx.createGain();
    whG.gain.value = 0.03;
    wh.connect(whBp).connect(whG).connect(bus);
    lfo2G.connect(whBp.frequency);
  }

  stopWind(fade = 3) {
    if (!this.wind) return;
    const t = this.ctx.currentTime;
    this.wind.gain.cancelScheduledValues(t);
    this.wind.gain.setValueAtTime(Math.max(0.0001, this.wind.gain.value), t);
    this.wind.gain.exponentialRampToValueAtTime(0.0001, t + fade);
  }

  /* ---------------- ambience ---------------- */

  startAmbience(fade = 4) {
    const ctx = this.ctx;
    if (!ctx || this.ambienceStarted) return;
    this.ambienceStarted = true;
    const t = ctx.currentTime;
    const bus = (this.ambience = ctx.createGain());
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(1, t + fade);
    bus.connect(this.master);
    const send = ctx.createGain();
    send.gain.value = 0.6;
    bus.connect(send).connect(this.reverb);

    // low drone: detuned sines + slow filter breathing
    const droneLp = ctx.createBiquadFilter();
    droneLp.type = 'lowpass';
    droneLp.frequency.value = 320;
    const droneG = ctx.createGain();
    droneG.gain.value = 0.16;
    droneLp.connect(droneG).connect(bus);
    for (const [f, type, gain] of [[55, 'sine', 0.8], [55.35, 'sine', 0.7], [82.4, 'triangle', 0.25], [110.2, 'sawtooth', 0.06]]) {
      const o = ctx.createOscillator();
      o.type = type;
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = gain;
      o.connect(g).connect(droneLp);
      o.start();
    }
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.07;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 140;
    lfo.connect(lfoG).connect(droneLp.frequency);
    lfo.start();

    // mains hum (100 Hz buzz with harmonics), slightly unstable
    const hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 100;
    const humBp = ctx.createBiquadFilter();
    humBp.type = 'bandpass';
    humBp.frequency.value = 300;
    humBp.Q.value = 1.2;
    this.humGain = ctx.createGain();
    this.humGain.gain.value = 0.018;
    hum.connect(humBp).connect(this.humGain).connect(bus);
    hum.start();

    // ventilation air: filtered brown noise with a slow sweep
    const air = this.#loop(this.brownBuf);
    const airBp = ctx.createBiquadFilter();
    airBp.type = 'bandpass';
    airBp.frequency.value = 500;
    airBp.Q.value = 0.6;
    const airG = ctx.createGain();
    airG.gain.value = 0.11;
    air.connect(airBp).connect(airG).connect(bus);
    const alfo = ctx.createOscillator();
    alfo.frequency.value = 0.045;
    const alfoG = ctx.createGain();
    alfoG.gain.value = 260;
    alfo.connect(alfoG).connect(airBp.frequency);
    alfo.start();

    this.#scheduleCrackle();
    this.#scheduleClank();
  }

  #scheduleCrackle() {
    setTimeout(() => {
      if (!this.muted && this.ctx.state === 'running') this.crackle();
      this.#scheduleCrackle();
    }, rand(900, 5500));
  }

  #scheduleClank() {
    setTimeout(() => {
      if (!this.muted && this.ctx.state === 'running') this.clank();
      this.#scheduleClank();
    }, rand(7000, 18000));
  }

  /** a short burst of electrical crackling (series of tiny noise ticks) */
  crackle(intensity = 1) {
    const ctx = this.ctx;
    if (!ctx) return;
    let t = ctx.currentTime + 0.01;
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-0.9, 0.9);
    const out = ctx.createGain();
    out.gain.value = 0.22 * intensity;
    out.connect(pan);
    pan.connect(this.master);
    pan.connect(this.reverb);
    const n = Math.floor(rand(4, 16));
    for (let i = 0; i < n; i++) {
      const src = ctx.createBufferSource();
      src.buffer = this.noiseBuf;
      const hp = ctx.createBiquadFilter();
      hp.type = 'bandpass';
      hp.frequency.value = rand(2500, 7000);
      hp.Q.value = rand(0.8, 3);
      const g = ctx.createGain();
      const d = rand(0.002, 0.018);
      g.gain.setValueAtTime(rand(0.3, 1), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      src.connect(hp).connect(g).connect(out);
      src.start(t, rand(0, 2.5), d + 0.01);
      t += rand(0.004, 0.07);
    }
    // the hum swells briefly with the arc
    if (this.humGain) {
      const n0 = ctx.currentTime;
      this.humGain.gain.setTargetAtTime(0.05, n0, 0.01);
      this.humGain.gain.setTargetAtTime(0.018, n0 + 0.15, 0.2);
    }
  }

  /** distant metallic clank, heavily reverberated */
  clank() {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const pan = ctx.createStereoPanner();
    pan.pan.value = rand(-1, 1);
    const g = ctx.createGain();
    g.gain.value = 0.12;
    g.connect(pan);
    pan.connect(this.reverb);
    pan.connect(this.delaySend);
    for (const f of [rand(180, 260), rand(420, 520), rand(910, 1150)]) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const og = ctx.createGain();
      og.gain.setValueAtTime(0.5, t);
      og.gain.exponentialRampToValueAtTime(0.0001, t + rand(0.4, 1.2));
      o.connect(og).connect(g);
      o.start(t);
      o.stop(t + 1.3);
    }
  }

  /* ---------------- UI sounds ---------------- */

  zap() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(60, t);
    o.frequency.exponentialRampToValueAtTime(900, t + 0.5);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.setValueAtTime(200, t);
    bp.frequency.exponentialRampToValueAtTime(3000, t + 0.5);
    bp.Q.value = 4;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.25, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.8);
    o.connect(bp).connect(g);
    g.connect(this.master);
    g.connect(this.reverb);
    o.start(t);
    o.stop(t + 0.9);
    this.crackle(1.6);
  }

  blip() {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = 'square';
    o.frequency.setValueAtTime(1400, t);
    o.frequency.setValueAtTime(700, t + 0.04);
    o.frequency.setValueAtTime(1050, t + 0.08);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 3000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.05, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.16);
    o.connect(lp).connect(g);
    g.connect(this.master);
    g.connect(this.delaySend);
    o.start(t);
    o.stop(t + 0.18);
    this.#burst({ freq: 4000, q: 2, dur: 0.05, gain: 0.12 });
  }

  /* ---------------- helpers ---------------- */

  #burst({ freq, q, dur, gain, send = 0.3 }) {
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const src = ctx.createBufferSource();
    src.buffer = this.noiseBuf;
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = freq;
    bp.Q.value = q;
    const g = ctx.createGain();
    g.gain.setValueAtTime(gain, t);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    src.connect(bp).connect(g);
    g.connect(this.master);
    const s = ctx.createGain();
    s.gain.value = send;
    g.connect(s).connect(this.reverb);
    src.start(t, rand(0, 2), dur + 0.05);
  }

  #loop(buffer) {
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    src.start(0, Math.random() * buffer.duration);
    return src;
  }

  #noiseBuffer(seconds, color) {
    const ctx = this.ctx;
    const len = Math.floor(seconds * ctx.sampleRate);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') {
        last = (last + 0.02 * w) / 1.02;
        d[i] = last * 3.5;
      } else d[i] = w;
    }
    return buf;
  }

  #impulse(seconds, decay) {
    const ctx = this.ctx;
    const len = Math.floor(seconds * ctx.sampleRate);
    const buf = ctx.createBuffer(2, len, ctx.sampleRate);
    for (let c = 0; c < 2; c++) {
      const d = buf.getChannelData(c);
      for (let i = 0; i < len; i++) {
        const t = i / len;
        // early reflections + diffuse tail
        const early = i < ctx.sampleRate * 0.08 && Math.random() < 0.004 ? 1 : 0;
        d[i] = ((Math.random() * 2 - 1) * Math.pow(1 - t, decay) + early * 0.6) * 0.5;
      }
    }
    return buf;
  }
}
