// the game's sound, all synthesized on the spot with Web Audio (no sound files). The brand ones are sound-alikes of the apps' own,
// rebuilt from their notes: Discord's message ping, join / leave / mute / deafen bloops and soundboard airhorn, Duolingo's F#5 → A#5
// "correct" ding, buzzer and lesson-complete fanfare, Tesla's three-beep Autopilot chime, the Chrome dino's jump and score blips,
// Messenger's pop-ding, Twitter's chirp, LEGO clicks and stud pickups … each played by the moves named after them (BRAND).
// The game calls sfx.enter (a state starts: dodges, shields, landings, jumps, a special with no startup), sfx.out (a move's first
// active frame), sfx.hit (a hit lands) and sfx.play (anything else). Browsers keep audio asleep until the first key / click, which
// wakes it. The menus' sound item switches it off (kept in localStorage). No Web Audio (tools/cpu-check.js): every call does nothing
const sfx = (() => {
  let ac, bus, mus, noise, on = true;
  try { on = localStorage.getItem('sound') !== 'off'; } catch {}
  const last = {}; // when each sound last started: the same one again within 30 ms is skipped (a blast hitting three at once)
  function wake() {
    if (!ac) {
      const A = window.AudioContext || window.webkitAudioContext; if (!A) return;
      ac = new A(); bus = ac.createGain(); bus.gain.value = 0.7; mus = ac.createGain(); mus.gain.value = 0;
      const comp = ac.createDynamicsCompressor(); bus.connect(comp).connect(ac.destination); mus.connect(comp); // (a hit's sound ducks the music a little)
      noise = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); const d = noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      setInterval(tick, 50);
    }
    if (ac.state === 'suspended') ac.resume();
  }
  addEventListener('keydown', wake, true); addEventListener('pointerdown', wake, true);

  // one voice: [kind, f, t, d, g, o]. kind = an oscillator ('sine', 'triangle', 'square', 'sawtooth') or noise through a filter ('bp'
  // band, 'lp' low, 'hp' high) at f · f = Hz, or [from, to] slid over the voice (o.slide s) · starts t s from now, lasts d s, peaks at
  // gain g after o.a s (5 ms), holds there o.hold of the way, then dies away · o.q = the filter's Q, o.lp = a low-pass on an
  // oscillator, o.vib = [rate, depth Hz] of vibrato
  const FILTER = { bp: 'bandpass', lp: 'lowpass', hp: 'highpass' };
  const glide = (p, [a, b = a], t0, d) => { p.setValueAtTime(a, t0); if (b !== a) p.exponentialRampToValueAtTime(b, t0 + d); };
  function voice(dest, kind, f, t, d, g, o = {}) {
    const t0 = ac.currentTime + t, end = t0 + d, env = ac.createGain(), fs = [].concat(f);
    let src, head;
    if (FILTER[kind]) {
      src = ac.createBufferSource(); src.buffer = noise; src.loop = true;
      head = ac.createBiquadFilter(); head.type = FILTER[kind]; head.Q.value = o.q ?? 1; glide(head.frequency, fs, t0, o.slide ?? d); src.connect(head);
      src.start(t0, Math.random());
    } else {
      src = head = ac.createOscillator(); src.type = kind; glide(src.frequency, fs, t0, o.slide ?? d);
      if (o.vib) { const l = ac.createOscillator(), lg = ac.createGain(); l.frequency.value = o.vib[0]; lg.gain.value = o.vib[1]; l.connect(lg).connect(src.frequency); l.start(t0); l.stop(end); }
      if (o.lp) { head = ac.createBiquadFilter(); head.frequency.value = o.lp; src.connect(head); }
      src.start(t0);
    }
    env.gain.setValueAtTime(0.0001, t0); env.gain.exponentialRampToValueAtTime(g, t0 + (o.a ?? 0.005));
    if (o.hold) env.gain.setValueAtTime(g, t0 + d * o.hold);
    env.gain.exponentialRampToValueAtTime(0.0001, end);
    head.connect(env).connect(dest); src.stop(end + 0.05);
  }

  const bell = (f, t, d, g) => [['sine', f, t, d, g], ['sine', f * 2.76, t, d * 0.3, g * 0.25]]; // a struck bar: glockenspiel-ish chime
  const arp = (fs, step, one) => fs.flatMap((f, i) => one(f, i * step)); // one(f, t) = a note's voices, each step s after the last
  const rnd = (a = 0.08) => 1 + (Math.random() - 0.5) * a; // a little different every time
  const key = (t, g = 1, f = 2600) => [['bp', f * rnd(0.25), t, 0.025, 0.5 * g, { q: 1.2 }], ['sine', [320, 160], t, 0.03, 0.12 * g]]; // a keyboard clack (f 1700: Enter)
  const brick = (t, g = 1) => [['bp', 2800 * rnd(0.1), t, 0.025, 0.5 * g, { q: 1.5 }], ['bp', 1900 * rnd(0.1), t + 0.016, 0.03, 0.42 * g, { q: 1.5 }], ['sine', [900, 700], t, 0.03, 0.08 * g]]; // two clicks as it seats
  const whoosh = (lo, hi, t, d, g) => ['bp', [lo, hi], t, d, g, { q: 1.3, a: d * 0.35 }];

  // every sound, by name: its voices, or a function of k (how hard: damage, tier) giving them
  const S = {
    // menus and the fight around the moves
    tick: [['sine', 1400, 0, 0.03, 0.17]],
    select: [['triangle', 660, 0, 0.09, 0.12], ['triangle', 990, 0.07, 0.14, 0.12]],
    back: [['triangle', 990, 0, 0.09, 0.1], ['triangle', 660, 0.07, 0.14, 0.1]],
    vs: [whoosh(250, 3500, 0, 0.45, 0.3), ['sine', [110, 40], 0.42, 0.5, 0.3], ['lp', 1400, 0.42, 0.3, 0.25]],
    go: [...[523, 659, 784].map(f => ['square', f, 0, 0.4, 0.05, { lp: 2500, hold: 0.5 }]), ...bell(1047, 0, 0.5, 0.1)],
    win: [...arp([523, 659, 784], 0.12, (f, t) => [['square', f, t, 0.14, 0.06, { lp: 2400 }]]), ...[523, 659, 784, 1047].map(f => ['square', f, 0.38, 0.9, 0.05, { lp: 2400, hold: 0.5 }]), ...bell(2093, 0.38, 0.8, 0.05)],
    lose: [...arp([233, 220, 208], 0.34, (f, t) => [['sawtooth', f, t, 0.3, 0.09, { lp: 900, hold: 0.6 }]]), ['sawtooth', 196, 1.02, 1.1, 0.09, { lp: 900, hold: 0.7, vib: [5.5, 5] }]], // sad trombone
    swing: k => { const h = Math.min(1, k / 16), r = rnd(0.15); return [whoosh((650 - 300 * h) * r, (2400 - 900 * h) * r, 0, 0.08 + 0.12 * h, 0.65 + 0.3 * h)]; },
    hit: k => { const h = Math.min(1, k / 20), r = rnd(); return [['sine', [170 * r, 55], 0, 0.1 + 0.15 * h, 0.35 + 0.35 * h], ['lp', 1600 * r, 0, 0.06 + 0.06 * h, 0.4 + 0.3 * h], ['hp', 2500, 0, 0.03 + 0.03 * h, 0.12 + 0.2 * h]]; },
    block: [['sine', 1850, 0, 0.14, 0.19], ['sine', 2780, 0, 0.09, 0.11], ['hp', 5000, 0, 0.03, 0.15]],
    shieldUp: [['sine', [320, 640], 0, 0.09, 0.09], ['hp', 3500, 0, 0.05, 0.05]],
    shatter: [['hp', 2500, 0, 0.35, 0.3], ...arp([2600, 3300, 4100, 3700], 0.04, (f, t) => [['sine', f, t + 0.02, 0.2, 0.06]])],
    dodge: [['hp', [2000, 5500], 0, 0.14, 0.14, { a: 0.04 }]],
    jump: [['sine', [240, 480], 0, 0.09, 0.1], ['lp', 900, 0, 0.05, 0.17]],
    djump: [['sine', [340, 680], 0, 0.09, 0.08], whoosh(800, 1800, 0, 0.1, 0.28)],
    land: [['lp', 450, 0, 0.07, 0.25], ['sine', [130, 60], 0, 0.06, 0.1]],
    knockdown: [['lp', 380, 0, 0.16, 0.45], ['sine', [110, 40], 0, 0.15, 0.3]],
    tech: [['sine', 1400, 0, 0.07, 0.14], ['sine', 2100, 0.03, 0.08, 0.1]],
    ledge: [['bp', 1200, 0, 0.04, 0.75, { q: 3 }], ['sine', 420, 0, 0.04, 0.1]],
    snatch: [whoosh(1200, 3200, 0, 0.08, 0.5)],
    grabbed: [['lp', 900, 0, 0.06, 0.55], ['sine', [230, 110], 0, 0.06, 0.2]],
    throw: [whoosh(350, 1700, 0, 0.2, 0.5)],
    ko: [['sine', [120, 28], 0, 1.1, 0.6], ['lp', [1600, 120], 0, 1.2, 0.6], ['hp', 3500, 0, 0.25, 0.25], ...bell(1760, 0.05, 0.6, 0.06)],
    boom: [['sine', [95, 30], 0, 0.7, 0.5], ['lp', [2000, 150], 0, 0.8, 0.5], ['hp', 3000, 0, 0.12, 0.15]],
    respawn: [['bp', [3000, 900], 0, 0.5, 0.25, { q: 0.8, a: 0.1 }]], // the platform lowering in

    // Claw'd: Claude Code at the terminal
    clack: key(0),
    git: [...arp([0, 1, 2], 0.045, (i, t) => key(t, 0.8)), ...key(0.15, 1, 1700)], // a git command typed, then Enter
    resume: [...arp([0, 1, 2, 3, 4], 0.05, (i, t) => key(t, 0.8)), ...key(0.28, 1, 1700), ...bell(1319, 0.36, 0.3, 0.06)], // > claude --resume ⏎
    hum: [['sine', 220, 0, 0.45, 0.04, { vib: [4, 3], a: 0.1 }]], // thinking…
    think: k => [...arp([392, 523, 659, 784, 1047].slice(0, k + 2).map(f => f * 2 ** ((k - 1) / 6)), 0.05, (f, t) => bell(f, t, 0.35, 0.06)), ['sine', [300 * k, 900 * k], 0, 0.3, 0.03]], // a thinking tier reached
    claudeSpark: [['sine', [1500, 3000], 0, 0.12, 0.13], ['hp', 5000, 0, 0.08, 0.18], ...bell(2093, 0.03, 0.2, 0.09)],
    tether: [whoosh(800, 3000, 0, 0.2, 0.4), ['sine', [400, 1200], 0, 0.2, 0.03]],
    linked: [...bell(1047, 0, 0.12, 0.1), ...bell(1568, 0.08, 0.3, 0.11)],
    refused: [['square', [330, 220], 0, 0.22, 0.11, { lp: 1200 }]],
    subagent: [['sine', [600, 1200], 0, 0.06, 0.24], ['sine', 1600, 0.08, 0.04, 0.12], ['sine', 1900, 0.12, 0.04, 0.12]],
    overflow: [...arp([880, 660, 440], 0.05, (f, t) => [['square', f, t, 0.04, 0.05, { lp: 2000 }]]), ['hp', 3000, 0.15, 0.1, 0.1]],

    // Grok Bot: X, xAI, Tesla, SpaceX, the Boring Company
    bonk: () => [['sine', [820 * rnd(), 420], 0, 0.07, 0.4], ['bp', 1200, 0, 0.03, 0.7, { q: 6 }]],
    note: [...bell(1175, 0, 0.14, 0.1), ...bell(1568, 0.07, 0.25, 0.1)],
    trending: [whoosh(300, 3000, 0, 0.35, 0.4), ...arp([784, 988, 1175, 1568], 0.05, (f, t) => [['sine', f, t + 0.1, 0.1, 0.06]])],
    drill: [['sawtooth', [85, 110], 0, 0.7, 0.07, { lp: 1400, vib: [32, 12] }], ['lp', 1200, 0, 0.7, 0.25]],
    breakout: [['lp', [2200, 300], 0, 0.3, 0.45]],
    imagine: [['sine', [800, 1600], 0, 0.3, 0.05], ...arp([1568, 1976, 2349, 2794], 0.04, (f, t) => [['sine', f, t, 0.25, 0.04]])],
    ignite: [['lp', [200, 700], 0, 0.6, 0.3, { a: 0.1 }], ['sawtooth', 55, 0, 0.6, 0.05, { lp: 250 }]],
    launch: [['lp', [400, 1600], 0, 1.3, 0.45, { a: 0.03 }], ['hp', 3000, 0, 0.8, 0.1], ['sine', [60, 110], 0, 1.1, 0.25]],
    chip: [['sine', 2000, 0, 0.04, 0.14], ['sine', 3000, 0.06, 0.05, 0.14]],
    zap: [['square', 110, 0, 0.18, 0.07, { vib: [55, 45], lp: 3000 }], ['hp', 4500, 0, 0.14, 0.2]],
    autopilot: [...arp([523, 659, 784], 0.16, (f, t) => [['sine', f, t, 0.1, 0.12]]), ['sine', [280, 1100], 0.1, 1, 0.035, { a: 0.2 }]], // Tesla's engage chime, then the motor
    tractor: [['sine', 600, 0, 0.35, 0.11, { vib: [12, 120] }]],
    factCheck: [['bp', 3000, 0, 0.02, 0.9, { q: 1.5 }], ['sine', 1976, 0.02, 0.05, 0.08]],
    chirp: [['sine', [2600, 4200], 0, 0.05, 0.13, { vib: [40, 150] }], ['sine', [2900, 4600], 0.07, 0.06, 0.13]], // the old tweet
    blocked: [['square', [220, 110], 0, 0.16, 0.15, { lp: 900 }]],
    viral: arp([523, 659, 784, 1047, 1319, 1568], 0.035, (f, t) => [['sine', f, t, 0.1, 0.07]]),
    verified: [...bell(1568, 0, 0.1, 0.07), ...bell(2093, 0.05, 0.18, 0.07)],
    rateLimited: [['square', [300, 150], 0, 0.2, 0.06, { lp: 1200 }], ['square', [300, 150], 0.24, 0.3, 0.06, { lp: 1200 }]],
    online: [['sine', [200, 900], 0, 0.3, 0.08], ...bell(1319, 0.25, 0.3, 0.1)],
    splash: [['bp', [2600, 500], 0, 0.3, 0.5, { q: 0.8 }], ['lp', 600, 0, 0.1, 0.2]],

    // Wumpus: Discord
    ping: [...bell(880, 0, 0.12, 0.16), ...bell(1175, 0.08, 0.3, 0.18)], // the message ping: A5 → D6
    everyone: [...bell(880, 0, 0.1, 0.14), ...bell(1175, 0.07, 0.2, 0.16), ...bell(880, 0.16, 0.1, 0.14), ...bell(1175, 0.23, 0.3, 0.16)],
    join: [...bell(659, 0, 0.12, 0.14), ...bell(880, 0.09, 0.25, 0.14)], // into the voice channel: E5 → A5; leaving is the same, down
    leave: [...bell(880, 0, 0.12, 0.14), ...bell(659, 0.09, 0.25, 0.14)],
    mute: [['sine', 740, 0, 0.07, 0.12], ['sine', 494, 0.06, 0.1, 0.12]],
    unmute: [['sine', 494, 0, 0.07, 0.12], ['sine', 740, 0.06, 0.1, 0.12]],
    deafen: [['sawtooth', [523, 494], 0, 0.3, 0.07, { lp: 900 }], ['sawtooth', [392, 370], 0.22, 0.45, 0.07, { lp: 700 }]],
    undeafen: [['sawtooth', [392, 415], 0, 0.3, 0.07, { lp: 900 }], ['sawtooth', [523, 554], 0.22, 0.5, 0.07, { lp: 1100 }]],
    airhorn: [0, 0.27, 0.54].flatMap((t, i) => { const d = i < 2 ? 0.2 : 0.95; return [...[233, 294, 349, 466].map(f => ['sawtooth', i < 2 ? f : [f, f * 0.94], t, d, 0.05, { lp: 3200, hold: 0.8, vib: [6, 2], a: 0.01 }]), ['bp', 1800, t, d, 0.15, { q: 0.8, hold: 0.8 }]]; }), // BWAP BWAP BWAAAAP
    disconnect: [...bell(880, 0, 0.1, 0.1), ...bell(659, 0.08, 0.14, 0.1), ['sine', [330, 110], 0.18, 0.35, 0.11]],
    nitro: [whoosh(400, 4000, 0, 0.35, 0.4), ...arp([1047, 1319, 1568, 2093, 2637], 0.045, (f, t) => bell(f, t + 0.1, 0.18, 0.05))],
    slowmode: [['sawtooth', [420, 110], 0, 0.7, 0.07, { lp: 1000, a: 0.02 }]],
    reaction: arp([784, 988, 1175, 1568], 0.035, (f, t) => [['sine', [f, f * 1.5], t, 0.08, 0.1]]),
    pin: [['lp', 700, 0, 0.05, 0.4], ...bell(1319, 0.04, 0.25, 0.1)],
    spinner: [['triangle', 560, 0, 0.35, 0.1, { vib: [16, 90] }]],
    raise: [['sine', [480, 960], 0, 0.07, 0.33]],
    boop: [['sine', [760, 480], 0, 0.07, 0.35]],
    reconnect: arp([659, 659, 988], 0.07, (f, t) => [['sine', f, t, 0.05, 0.08]]),
    afk: arp([880, 659, 523], 0.08, (f, t) => bell(f, t, 0.15, 0.1)),

    // Android: Google
    tap: [['bp', 2200, 0, 0.025, 0.5, { q: 1.2 }], ['bp', 2200, 0.09, 0.025, 0.5, { q: 1.2 }]],
    rocketFist: [whoosh(500, 2200, 0, 0.22, 0.45), ['lp', 800, 0, 0.2, 0.15]],
    search: [...arp([0, 1, 2, 3], 0.045, (i, t) => key(t, 0.8)), whoosh(600, 2600, 0.18, 0.15, 0.4)], // typed into the bar, then swung
    dino: [['square', [330, 660], 0, 0.1, 0.2, { lp: 5000, slide: 0.06 }]], // the Chrome dino's jump
    dinoScore: [['square', 988, 0, 0.05, 0.1, { lp: 5000 }], ['square', 1319, 0.07, 0.12, 0.1, { lp: 5000 }]], // … and its 100 points
    lucky: [...arp([1, 2, 3, 4, 5, 6, 7], 0.045, (i, t) => [['sine', 1100 + 90 * i, t, 0.025, 0.06]]), ...bell(1568, 0.34, 0.35, 0.12)],
    chromeRoll: [['triangle', 160, 0, 0.45, 0.1, { vib: [22, 40] }]],
    maps: [...bell(587, 0, 0.16, 0.13), ...bell(784, 0.17, 0.35, 0.13)], // the navigation prompt
    charge: [['sine', [440, 880], 0, 0.14, 0.12], ...bell(1319, 0.1, 0.25, 0.06)], // power connected
    circle: [['sine', [1000, 2200], 0, 0.3, 0.08], ['hp', 5000, 0.05, 0.25, 0.07]],
    captcha: [['bp', 2500, 0, 0.02, 0.9, { q: 1.5 }], ['sine', 1760, 0.02, 0.06, 0.1]],
    swipe: [['hp', [1500, 4500], 0, 0.13, 0.14, { a: 0.04 }]],
    upload: [['sine', [300, 1200], 0, 0.3, 0.08], whoosh(600, 3000, 0, 0.3, 0.3)],
    uninstall: [['sine', [800, 180], 0, 0.3, 0.1], ['bp', 1500, 0.05, 0.15, 0.25, { q: 0.7 }]],
    error: [['square', 440, 0, 0.09, 0.05, { lp: 1600 }], ['square', 330, 0.11, 0.16, 0.05, { lp: 1400 }]],
    boot: [['sine', [200, 800], 0, 0.35, 0.06], ['sine', 784, 0.3, 0.1, 0.12], ['sine', 988, 0.42, 0.14, 0.12]], // powering up, then the Assistant's two tones

    // Duo: Duolingo
    correct: [...bell(740, 0, 0.16, 0.14), ...bell(932, 0.13, 0.4, 0.15)], // "dong-ding": F#5 → A#5
    wrong: [['square', 185, 0, 0.12, 0.06, { lp: 700 }], ['square', 175, 0.14, 0.22, 0.06, { lp: 600 }]],
    quiz: () => S[P.roll === false ? 'wrong' : 'correct'], // the pop quiz comes up right or wrong
    complete: [...arp([523, 659, 784], 0.1, (f, t) => [['sawtooth', f, t, 0.12, 0.05, { lp: 2200 }]]), ...[523, 659, 784, 1047].map(f => ['sawtooth', f, 0.3, 0.8, 0.04, { lp: 2400, hold: 0.5 }]), ...arp([1047, 1319, 1568, 2093], 0.05, (f, t) => bell(f, t + 0.3, 0.5, 0.05)), ['lp', 250, 0.3, 0.35, 0.4]],
    streak: [whoosh(300, 1400, 0, 0.4, 0.5), ...bell(1047, 0.22, 0.2, 0.08), ...bell(1568, 0.3, 0.4, 0.09)], // the flame, then the ding
    streakLost: arp([784, 659, 523, 392], 0.09, (f, t) => [['triangle', f, t, 0.14, 0.09]]),
    freeze: [['hp', 6000, 0, 0.3, 0.05, { a: 0.05 }], ...arp([2637, 3136, 2794, 3520], 0.05, (f, t) => [['sine', f, t, 0.25, 0.04]])],
    hoot: [['sine', [440, 390], 0, 0.2, 0.1, { a: 0.03 }], ['sine', [420, 360], 0.24, 0.3, 0.1, { a: 0.03 }]],
    xp: [...bell(1319, 0, 0.1, 0.1), ...bell(1760, 0.07, 0.2, 0.1)],
    levelUp: arp([523, 659, 784, 1047, 1319], 0.05, (f, t) => [['triangle', f, t, 0.12, 0.09]]),
    heart: [['sawtooth', [1200, 200], 0, 0.16, 0.06, { lp: 3000 }], ['sine', [620, 300], 0.08, 0.3, 0.14]],
    reminder: [...bell(784, 0, 0.12, 0.12), ...bell(1047, 0.1, 0.3, 0.13)],
    ad: [['hp', 2500, 0, 0.12, 0.12], ...arp([1047, 1319, 1568], 0.08, (f, t) => bell(f, t + 0.1, 0.2, 0.1))],
    tsk: [['bp', 2600, 0, 0.025, 0.5, { q: 2 }], ['bp', 2600, 0.13, 0.025, 0.5, { q: 2 }]],
    schoolBell: arp([1568, 1568, 1568, 1568, 1568], 0.045, (f, t) => bell(f, t, 0.08, 0.06)),
    dun: [['sawtooth', 196, 0, 0.16, 0.08, { lp: 800 }], ['sawtooth', 185, 0.2, 0.16, 0.08, { lp: 800 }], ['sawtooth', 147, 0.42, 0.9, 0.09, { lp: 800, hold: 0.5, vib: [5, 3] }]], // dun dun DUNNN
    flap: [whoosh(500, 1300, 0, 0.09, 0.75)],
    peck: [['bp', 1800, 0, 0.03, 0.9, { q: 1.2 }], ['sine', [700, 400], 0, 0.03, 0.1]],
    powerDown: [['sine', [880, 110], 0, 0.5, 0.12]],

    // Snoo: Reddit
    upvote: [['sine', [520, 1040], 0, 0.08, 0.35], ['sine', 1320, 0.05, 0.08, 0.12]],
    downvote: [['sine', [820, 360], 0, 0.1, 0.35]],
    karma: [['sine', [300, 1200], 0, 0.35, 0.08], ...arp([1319, 1760, 2093], 0.06, (f, t) => bell(f, t + 0.15, 0.2, 0.05))],
    mail: [...bell(1319, 0, 0.15, 0.1), ...bell(1760, 0.1, 0.35, 0.11)],
    gavel: [['bp', 900, 0, 0.06, 0.6, { q: 5 }], ['sine', [200, 90], 0, 0.15, 0.3], ['lp', 700, 0, 0.1, 0.35]],
    frontPage: [['triangle', 392, 0, 0.1, 0.07], ['triangle', 523, 0.1, 0.1, 0.07], ...[659, 784, 1047].map(f => ['triangle', f, 0.2, 0.45, 0.05, { hold: 0.4 }])],
    poof: [['bp', [1600, 300], 0, 0.3, 0.4, { q: 0.8, a: 0.02 }], ['sine', [600, 200], 0, 0.25, 0.06]],
    ufo: [['sine', [300, 1100], 0, 0.6, 0.1, { vib: [9, 60] }]],
    restored: () => [...S.upvote, ...bell(1568, 0.08, 0.3, 0.07)],
    tooMuch: [['square', 150, 0, 0.12, 0.06, { lp: 1000 }], ['square', 150, 0.16, 0.2, 0.06, { lp: 1000 }]],

    // Lego Man: LEGO
    brick: () => brick(0),
    stud: () => { const f = [2093, 2349, 2637][Math.floor(Math.random() * 3)]; return [['sine', [f, f * 1.06], 0, 0.14, 0.2, { slide: 0.03 }], ['sine', f * 1.5, 0.01, 0.1, 0.1]]; }, // a stud picked up
    tower: arp([0, 1, 2, 3], 0.06, (i, t) => [['bp', 2000 + 400 * i, t, 0.025, 0.45, { q: 1.5 }], ['bp', 1500 + 300 * i, t + 0.014, 0.03, 0.35, { q: 1.5 }]]),
    clatter: () => Array.from({ length: 7 }, () => ['bp', 1500 + Math.random() * 2500, Math.random() * 0.3, 0.025, 0.4, { q: 2 }]),
    page: [['bp', [1500, 4000], 0, 0.12, 0.3, { q: 0.7, a: 0.03 }], ['bp', [2000, 5000], 0.12, 0.1, 0.25, { q: 0.7, a: 0.03 }]],
    gold: [...arp([1047, 1319, 1568, 2093, 2637], 0.05, (f, t) => bell(f, t, 0.5, 0.06)), ['hp', 7000, 0, 0.5, 0.04, { a: 0.1 }]],
    mech: () => [['sawtooth', [140, 320], 0, 0.4, 0.06, { lp: 900 }], ...brick(0.12), ...brick(0.3)],
    wrecking: [whoosh(200, 900, 0, 0.45, 0.6), ['sine', [90, 60], 0.1, 0.4, 0.15]],
    fuse: [whoosh(800, 2600, 0, 0.3, 0.4)],
    spin: [['triangle', 330, 0, 0.4, 0.1, { vib: [18, 90] }]],
    headPop: () => [['sine', [400, 1600], 0, 0.05, 0.2], ...S.clatter()],
    hooray: [['triangle', 784, 0, 0.1, 0.1], ['triangle', 1047, 0.1, 0.2, 0.1]],

    // Muse: Meta
    like: [['sine', [1400, 500], 0, 0.06, 0.5, { slide: 0.04 }], ['bp', 1500, 0, 0.025, 0.5]], // Facebook's like pop
    love: [['sine', [700, 1500], 0, 0.08, 0.35], ['sine', 1760, 0.06, 0.1, 0.12]],
    messenger: [['sine', [1300, 500], 0, 0.05, 0.16], ...bell(1319, 0.05, 0.3, 0.1)], // Messenger's pop-ding
    poke: [...bell(988, 0, 0.12, 0.1), ...bell(1319, 0.08, 0.25, 0.1)],
    shared: [whoosh(600, 2400, 0, 0.18, 0.4), ['sine', [1400, 500], 0.15, 0.06, 0.15, { slide: 0.04 }]],
    unfriend: arp([659, 494, 392], 0.12, (f, t) => [['triangle', f, t, 0.15, 0.09]]),
    saber: [['sawtooth', [120, 90], 0, 0.45, 0.07, { lp: 1200, vib: [7, 4] }], ['hp', [2500, 7500], 0.05, 0.15, 0.2, { a: 0.02 }]], // Beat Saber's hum and slice
    shutter: [['bp', 3200, 0, 0.02, 0.5, { q: 1 }], ['bp', 1800, 0.06, 0.035, 0.45, { q: 1 }]],
    metaSpark: [['sine', [700, 1400], 0, 0.5, 0.05, { vib: [20, 60] }], ['hp', 4500, 0, 0.45, 0.06, { a: 0.05 }]],
    balloons: [['sawtooth', [300, 720], 0, 0.35, 0.05, { lp: 2500, vib: [26, 25] }], ['sine', [1200, 1700], 0.32, 0.15, 0.06, { vib: [30, 40] }]], // party blower, then a squeak
    scroll: arp([0, 1, 2, 3], 0.035, (i, t) => [['sine', 1800 - 100 * i, t, 0.012, 0.11]]),
    glitch: [['square', [800, 200], 0, 0.1, 0.05, { lp: 3000 }], ['hp', 3000, 0.1, 0.08, 0.12], ['square', [600, 150], 0.18, 0.12, 0.05, { lp: 3000 }]],

    // Snoopy: Peanuts
    bark: () => [['square', [520 * rnd(), 300], 0, 0.1, 0.07, { lp: 1400 }], ['bp', [900, 500], 0, 0.09, 0.45, { q: 2 }], ['square', [460 * rnd(), 260], 0.14, 0.12, 0.07, { lp: 1300 }], ['bp', [800, 450], 0.14, 0.1, 0.4, { q: 2 }]], // woof woof
    smak: [['bp', 2200, 0, 0.02, 0.6, { q: 3 }], ['sine', [900, 300], 0, 0.06, 0.2], ...bell(1568, 0.05, 0.2, 0.05)], // a big wet kiss, and a little twinkle
    bleah: [['sawtooth', [150, 120], 0, 0.4, 0.07, { lp: 900, vib: [28, 18] }], ['bp', 700, 0, 0.35, 0.18, { q: 1 }]], // a raspberry
    copter: [['sawtooth', [80, 110], 0, 0.4, 0.06, { lp: 600, vib: [24, 30] }], whoosh(400, 1400, 0, 0.4, 0.35)], // ears whirring
    whip: [whoosh(500, 2400, 0, 0.16, 0.5)],
    blanket: [whoosh(250, 900, 0, 0.25, 0.35)],
    cool: [['sawtooth', 392, 0, 0.16, 0.05, { lp: 1100, vib: [5, 6] }], ['sawtooth', 311, 0.17, 0.35, 0.05, { lp: 1000, vib: [5, 8] }]], // a lazy sax: Joe Cool
    grief: arp([523, 440, 349], 0.13, (f, t) => [['triangle', f, t, 0.2, 0.1], ['sine', f / 2, t, 0.2, 0.06]]), // good grief
    piano: arp([659, 622, 659, 622, 659, 494, 587, 523, 440], 0.11, (f, t) => [['triangle', f, t, 0.35, 0.09], ['sine', f * 2, t, 0.12, 0.03]]), // Schroeder's Beethoven: Für Elise
    propeller: [['sawtooth', [110, 150], 0, 0.55, 0.06, { lp: 900, vib: [30, 25] }], whoosh(300, 1200, 0, 0.5, 0.3)], // the Sopwith Camel puttering off
    chirps: arp([0, 1, 2, 3], 0.07, (i, t) => [['sine', [2300 + 150 * i, 3300], t, 0.05, 0.1]]), // Woodstock and friends
    aaugh: [['sawtooth', [420, 170], 0, 0.45, 0.06, { lp: 1600, vib: [9, 25] }], ['bp', [1200, 500], 0, 0.4, 0.15, { q: 2 }]],
    boot: [['sine', [170, 55], 0, 0.16, 0.45], ['bp', 900, 0, 0.04, 0.5, { q: 2 }]],
    ace: [['sawtooth', [90, 150], 0, 0.45, 0.07, { lp: 800, vib: [28, 20] }], whoosh(300, 2000, 0.05, 0.4, 0.4)], // throttle open, and away
    dance: arp([523, 659, 784, 659, 880, 1047], 0.075, (f, t) => [['triangle', f, t, 0.12, 0.09]]),
    typewriter: () => [...key(0), ...key(0.06), ...key(0.12, 1, 1700), ...bell(2093, 0.18, 0.5, 0.1)], // clack clack clack, DING
  };

  // what every fighter's states sound like, by state (and the few beats that aren't one: jump, djump, grabbed), then each one's own on
  // top (BRAND, by fighter id); hit = its accent when that move lands (_ = any of its hits). A move with a hitbox and no sound of
  // its own gets a whoosh sized by its damage
  const BASE = { jump: 'jump', djump: 'djump', land: 'land', landLag: 'land', knockdown: 'knockdown', tech: 'tech', ledgeGrab: 'ledge',
    spotDodge: 'dodge', rollForward: 'dodge', rollBack: 'dodge', airDodge: 'dodge', shield: 'shieldUp', shieldBreak: 'shatter', respawn: 'respawn',
    grab: 'snatch', dashGrab: 'snatch', grabbed: 'grabbed', forwardThrow: 'throw', backThrow: 'throw', upThrow: 'throw', downThrow: 'throw' };
  const BRAND = {
    clawd: { neutralSpecial: 'hum', sideSpecial: 'claudeSpark', upSpecial: 'tether', downSpecial: 'subagent', upSmash: 'clack', pummel: 'clack',
      forwardThrow: 'git', backThrow: 'git', upThrow: 'git', downThrow: 'git', shield: 'clack', shieldBreak: 'overflow', respawn: 'resume' },
    grok: { forwardSmash: 'note', upSmash: 'trending', downSmash: 'drill', tunnelOut: 'breakout', imagine: 'imagine', rocketCharge: 'ignite', rocket: 'launch',
      neuralink: 'chip', neuralZap: 'zap', sideSpecial: 'autopilot', grab: 'tractor', dashGrab: 'tractor', pummel: 'factCheck', forwardThrow: 'chirp',
      backThrow: 'blocked', upThrow: 'viral', shield: 'verified', shieldBreak: 'rateLimited', respawn: 'online',
      hit: { jab1: 'bonk', jab2: 'bonk', upTilt: 'bonk', upAir: 'bonk', downAir: 'splash' } },
    wumpus: { upTilt: 'raise', downTilt: 'boop', getupAttack: 'reconnect', forwardSmash: 'reaction', upSmash: 'unmute', downSmash: 'pin', neutralSpecial: 'airhorn',
      sideSpecial: 'slowmode', upSpecial: 'nitro', downSpecial: 'deafen', downSpecialHit: 'undeafen', grabbed: 'ping', forwardThrow: 'afk', backThrow: 'leave',
      upThrow: 'join', downThrow: 'mute', neutralAir: 'spinner', shield: 'mute', shieldBreak: 'disconnect', respawn: 'join',
      hit: { jab1: 'ping', jab2: 'ping', jab3: 'everyone', dashAttack: 'ping', forwardAir: 'everyone', pummel: 'ping' } },
    android: { jab2: 'tap', forwardTilt: 'rocketFist', upTilt: 'zap', getupAttack: 'zap', neutralAir: 'zap', upAir: 'rocketFist', forwardSmash: 'search', upSmash: 'dino',
      neutralSpecial: 'lucky', sideSpecial: 'chromeRoll', upSpecial: 'maps', downSpecial: 'charge', grab: 'circle', dashGrab: 'circle', pummel: 'captcha',
      forwardThrow: 'swipe', backThrow: 'swipe', upThrow: 'upload', downThrow: 'uninstall', shield: 'charge', shieldBreak: 'error', respawn: 'boot',
      hit: { upSmash: 'dinoScore' } },
    duo: { dashAttack: 'streak', forwardTilt: 'schoolBell', downTilt: 'tsk', neutralAir: 'hoot', forwardAir: 'wrong', backAir: 'reminder', upAir: 'levelUp',
      downAir: 'streakLost', forwardSmash: 'quiz', upSmash: 'streak', downSmash: 'ad', neutralSpecial: 'heart', sideSpecial: 'reminder', upSpecial: 'freeze',
      downSpecial: 'streak', djump: 'flap', grab: 'flap', dashGrab: 'flap', pummel: 'peck', forwardThrow: 'swipe', backThrow: 'wrong', upThrow: 'complete',
      downThrow: 'dun', ledgeAttack: 'schoolBell', shieldBreak: 'powerDown', respawn: 'streak',
      hit: { jab3: 'correct', upTilt: 'xp' } },
    snoo: { upTilt: 'upvote', downTilt: 'downvote', upAir: 'upvote', downAir: 'downvote', upThrow: 'upvote', downThrow: 'downvote', upSmash: 'frontPage',
      downSmash: 'poof', neutralSpecial: 'karma', sideSpecial: 'mail', upSpecial: 'ufo', downSpecial: 'poof', shieldBreak: 'tooMuch', respawn: 'restored',
      hit: { forwardSmash: 'gavel' } },
    lego: { jab3: 'brick', forwardAir: 'brick', forwardSmash: 'brick', upSmash: 'tower', downSmash: 'clatter', booklet: 'page', wreckingBall: 'wrecking', rocket: 'fuse',
      goldBrick: 'gold', mech: 'mech', headToss: 'spin', stairs: 'brick', counter: 'brick', reassemble: 'clatter', upAir: 'hooray', upThrow: 'brick',
      spotDodge: 'page', airDodge: 'clatter', shield: 'brick', shieldBreak: 'headPop', respawn: 'brick',
      hit: { _: 'stud' } },
    muse: { jab2: 'boop', upSmash: 'shutter', downSmash: 'saber', neutralSpecial: 'metaSpark', sideSpecial: 'poke', upSpecial: 'balloons', downSpecial: 'imagine',
      forwardThrow: 'shared', backThrow: 'unfriend', shield: 'scroll', shieldBreak: 'glitch', respawn: 'messenger',
      hit: { upTilt: 'like', upAir: 'like', pummel: 'like', upThrow: 'like', downTilt: 'love', downAir: 'love', downThrow: 'love' } },
    snoopy: { djump: 'copter', upTilt: 'whip', dashAttack: 'bark', pummel: 'smak', forwardThrow: 'bleah', backThrow: 'cool', upThrow: 'bark',
      forwardSmash: 'ace', upSmash: 'dance', downSmash: 'typewriter', neutralSpecial: 'piano', sideSpecial: 'propeller', upSpecial: 'chirps',
      football: 'blanket', kickoff: 'aaugh', shield: 'blanket', shieldBreak: 'grief', respawn: 'bark',
      hit: { jab3: 'bonk', downAir: 'bonk', forwardTilt: 'bonk', kickoff: 'boot', forwardSmash: 'bonk' } },
  };
  const brand = () => BRAND[ROSTER.find(id => FIGHTER[id] === fighter)] || {}; // the fighter in play's

  // ---------- music: an original loop, 144 BPM in C (Am F C G, like the go / win jingles), scheduled a little ahead on the audio clock.
  // Menus: mallets, a pad, a soft beat. A fight: the full groove (four on the floor, octave bass, offbeat stabs, a square-wave lead with
  // a sparkle over it every other time round), from the top with a crash. Paused: the same, turned down. Won / lost: quiet, so the
  // fanfare plays alone. Its volume (0 … 1, 0 = off) is a menu setting, kept in localStorage
  let level = 0.6, mood = null, step = 0, nextT = 0, loops = 0, crash = false;
  try { const v = localStorage.getItem('music'); if (v != null && +v >= 0 && +v <= 1) level = +v; } catch {}
  const hz = m => 440 * 2 ** ((m - 69) / 12), STEP = 60 / 144 / 4; // a 16th
  const CHORDS = [ // root (the bass's upper octave), stab, mallets (8ths): Am F C G
    [45, [57, 60, 64], [57, 60, 64, 69, 72, 69, 64, 60]], [41, [57, 60, 65], [53, 57, 60, 65, 69, 65, 60, 57]],
    [48, [55, 60, 64], [60, 64, 67, 72, 76, 72, 67, 64]], [43, [55, 59, 62], [55, 59, 62, 67, 71, 67, 62, 59]]];
  const MELODY = { // 16th of the loop: [note, 16ths] · C E A . G E . . | F . E D C . D E | C E G . A G . . | D . B D G . F E
    0: [72, 2], 2: [76, 2], 4: [81, 4], 8: [79, 2], 10: [76, 6], 16: [77, 4], 20: [76, 2], 22: [74, 2], 24: [72, 4], 28: [74, 2], 30: [76, 2],
    32: [72, 2], 34: [76, 2], 36: [79, 4], 40: [81, 2], 42: [79, 6], 48: [74, 4], 52: [71, 2], 54: [74, 2], 56: [79, 4], 60: [77, 2], 62: [76, 2] };
  const kick = g => [['sine', [150, 46], 0, 0.38, g, { slide: 0.13 }], ['hp', 3000, 0, 0.012, g / 4]];
  const snare = g => [['bp', 2300, 0, 0.17, 0.6 * g, { q: 0.8 }], ['hp', 6000, 0, 0.07, 0.25 * g], ['triangle', [210, 150], 0, 0.1, 0.35 * g, { slide: 0.08 }]];
  function notes(i, fight) { // the voices on 16th i (0 … 63) of the loop
    const [root, stab, arp] = CHORDS[i >> 4], p = i & 15, v = [];
    if (!fight) {
      if (!(p & 1)) v.push(['sine', hz(arp[p >> 1]), 0, 0.42, p & 2 ? 0.1 : 0.15], ['sine', hz(arp[p >> 1]) * 4, 0, 0.07, 0.03], ['hp', 9500, 0, 0.035, p & 2 ? 0.05 : 0.03]);
      if (p === 0) v.push(...kick(0.25), ['sawtooth', hz(root - 12), 0, 1.6, 0.12, { lp: 500, a: 0.02 }], ...stab.map(m => ['sawtooth', hz(m), 0, 1.6, 0.03, { lp: 1300, a: 0.25, hold: 0.7 }]));
      if (p === 8) v.push(...kick(0.2));
      return v;
    }
    if (!(p & 3)) v.push(...kick(0.45));
    if (i >= 60) v.push(...snare(0.5 + 0.13 * (i - 60))); else if (p === 4 || p === 12) v.push(...snare(0.9)); // a fill into the top
    if ((p & 3) === 2) v.push(['hp', 7500, 0, 0.14, 0.17], ...stab.map(m => ['sawtooth', hz(m), 0, 0.17, 0.12, { lp: 1600 }])); else if (p & 1) v.push(['hp', 9500, 0, 0.035, 0.07]);
    if (!(p & 1)) { const f = hz(p & 2 ? root : root - 12); v.push(['sawtooth', f, 0, 0.19, 0.38, { lp: 700 }], ['sine', f, 0, 0.19, 0.22]); }
    const n = MELODY[i];
    if (n) { v.push(['square', hz(n[0]), 0, n[1] * STEP, 0.07, { lp: 3200, hold: 0.8, vib: [5.5, hz(n[0]) * 0.006] }]); if (loops & 1) v.push(['sine', hz(n[0] + 12), 0, 0.45, 0.06]); }
    return v;
  }
  function tick() { // every 50 ms: the next 0.2 s of 16ths
    const want = level * 0.2 * (mood === 'menu' ? 2 : mood === 'pause' ? 0.35 : mood ? 1 : 0), now = ac.currentTime; // (fight: ~7 dB under the sounds at 60 %; the menus' quieter mallets up to match)
    mus.gain.setTargetAtTime(want, now, 0.15);
    if (!want || document.hidden) { nextT = 0; return; }
    if (nextT < now) nextT = now + 0.05; // (behind, or just starting: from here)
    try {
      for (; nextT < now + 0.2; nextT += STEP) {
        if (crash) { crash = false; voice(mus, 'hp', 4500, nextT - now, 1.8, 0.18, { q: 0.6 }); voice(mus, 'bp', 9000, nextT - now, 1, 0.09); }
        for (const [kind, f, t, ...r] of notes(step, mood !== 'menu')) voice(mus, kind, f, nextT - now + t, ...r);
        step = (step + 1) & 63; if (!step) loops++;
      }
    } catch (e) { console.warn('music', e); level = 0; }
  }
  function music(m) { // the game's state, every frame: 'menu', 'fight', 'pause' or null (over)
    if (m === mood) return;
    if (m === 'fight' ? mood !== 'pause' : m === 'menu') { step = loops = 0; crash = m === 'fight'; } // a fight starts: from the top
    mood = m;
  }

  // play one, panned toward x (world px across the screen; none = the middle). A sound that goes wrong stays quiet rather than
  // throwing into the game's frame (that would stop it)
  function play(name, k = 1, x) {
    const r = S[name];
    if (!ac || !on || !r || ac.currentTime - (last[name] ?? -1) < 0.03) return;
    last[name] = ac.currentTime;
    try {
      let dest = bus;
      if (x != null && ac.createStereoPanner) { dest = ac.createStereoPanner(); dest.pan.value = Math.max(-1, Math.min(1, (x - cam.vx) * cam.vz / (W / 2))) * 0.7; dest.connect(bus); }
      for (const v of typeof r === 'function' ? r(k) : r) voice(dest, ...v);
    } catch (e) { console.warn('sound ' + name, e); }
  }
  const cue = (s, m) => { // the fighter in play's s: the base sound (else a whoosh, for an attack), and its own over it
    const x = P.x + P.w / 2;
    play(BASE[s] ?? (m?.hitbox ? 'swing' : null), m?.damage ?? 6, x); play(brand()[s], 1, x);
  };
  return {
    play,
    enter: s => { if (ac && !(MOVES[s]?.startup > 0)) cue(s); }, // a move with a startup sounds when it comes out instead (out)
    out: s => { if (ac) cue(s, MOVES[s]); },
    hit: dmg => { if (!ac) return; const h = brand().hit || {}, x = P.x + P.w / 2; play('hit', dmg, x); play(h[P.state] ?? h._, 1, x); },
    toggle() { on = !on; try { localStorage.setItem('sound', on ? 'on' : 'off'); } catch {} },
    get on() { return on; },
    music,
    musicStep(d, wrap) { level = Math.round(Math.max(0, wrap && level >= 1 ? 0 : Math.min(1, level + d * 0.2)) * 5) / 5; try { localStorage.setItem('music', level); } catch {} }, // ± 20 %; wrap: 100 % → off
    get musicLevel() { return level; },
  };
})();
