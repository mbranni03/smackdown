// Snoopy's moveset (drawn by snoopy.js). Every move is his own, on Claw'd's timings (clawd-moveset.js, loaded first: the game
// reads movement, dodge, ledge and reaction frames by his frame counts) and Snoo's frame data for the attacks and grabs. He's
// a beagle on his hind legs: his ears are the tell, trailing as he rises, floating up as he falls, streaming back as he runs and
// flopping forward when he brakes. He bonks with his big nose, whips his ears, kicks with his big feet, spins his ears like
// a helicopter to double jump, kisses whoever he's holding (SMAK!), puts on Joe Cool's shades to throw them away, hides behind
// Linus's security blanket to shield (Good grief! when it's torn off him) and lies on his back like on his doghouse roof when
// knocked down. His smashes: the Flying Ace's headlong tackle, the happy dance, and his typewriter's dark and stormy pages. His
// specials: Schroeder's toy piano (a held stream of notes), the Sopwith Camel sent at the Red Baron, Woodstock and friends
// lifting him by his ear, and Lucy's football (a counter: the ball's whipped away and he boots them). Pose fields as in snoopy.js; frame data and field meanings as in clawd-moveset.js.

// shared poses
const SP_CROUCH = { sx: 1.1, sy: 0.8, nod: 0.12, swing: [0.4, 0.6], legs: [[-2, 0], [0, 0], [0, 0], [2, 0]] };
const SP_SQUAT = { sx: 1.14, sy: 0.84, nod: 0.1, swing: [0.5, 0.5], ears: 0.15, legs: [[-2, 0], [0, 0], [0, 0], [2, 0]] };
const SP_TUCK = [[3, -3], [0, 0], [0, 0], [-1, -3]]; // knees pulled up under him
const SP_AIR = { swing: [-0.7, 0.7], ears: 1.4, legs: SP_TUCK }; // plain floating: what the aerials start and end on
const SP_BALL = { swing: [1.4, 1.6], nod: 0.35, ears: 0.9, wag: -0.3, blink: 1, legs: [[4, -4], [0, 0], [0, 0], [1, -4]] }; // curled up: rolls and dodges
const SP_FLAT = { rot: -Math.PI / 2, y: 20, swing: [-2.6, 2.4], ears: 1.4, legs: [[7, -2], [0, 0], [0, 0], [9, -4]] }; // flat on his back, feet up, like on his doghouse roof
// holding a grabbed foe out in both paws, leaning back a little (carry = where its bottom-centre is, as Claw'd's HOLD)
const SP_HOLD = { rot: -0.08, reach: [16, 14], arm: [-3, -3], ears: 0.2, legs: [[-3, 0], [0, 0], [0, 0], [2, 0]], carry: [46, -4, 0] };
// hanging off the ledge on Claw'd's spot (the game moves him by x / air), both arms stretched up and over to the lip, peeking over
const SP_HANG = { x: -60, air: 40, sy: 1.04, nod: -0.15, swing: [0.3, 0.36], reach: [32, 30], arm: [-2, -2], ears: 0.3, legs: legsAll(0, 3) };
const SP_PULL = { x: -60, air: 46, sx: 1.06, sy: 0.92, nod: -0.1, swing: [0.36, 0.42], reach: [36, 34], arm: [-2, -2], ears: 0.5, legs: legsAll(0, 2) };

// his run, a jaunty gallop on two legs: long strides, leaning in, arms pumping, mouth open, ears streaming back and flapping.
// Its frame 0 is where the dash hands off
const snoopyRun = (f, n = 24) => {
  const p = f / n * Math.PI * 2, y = -1.5 * (1 + Math.cos(2 * p));
  const foot = q => [7 * Math.sin(q), -6 * Math.max(0, Math.cos(q)) - y], a = foot(p), b = foot(p + Math.PI), kick = (f % (n / 2)) / 9;
  return {
    y, sx: 1.03 - 0.02 * Math.cos(2 * p), sy: 0.97 + 0.03 * Math.cos(2 * p), rot: 0.2 + 0.03 * Math.sin(2 * p), nod: -0.12 + 0.04 * Math.sin(2 * p),
    swing: [0.9 * Math.sin(p) - 0.2, -0.9 * Math.sin(p) - 0.2], ears: [1.55 + 0.3 * Math.sin(2 * p + 1), 1.4 + 0.3 * Math.sin(2 * p + 0.6)],
    wag: 0.6 + 0.3 * Math.sin(2 * p), open: 0.35, legs: [b, [0, 0], [0, 0], a], speed: 0.5, dust: kick <= 1 ? kick : null,
  };
};
// a whole jump for the preview: squat, spring with the ears trailing down, ears floating up at the peak and flying up as he drops,
// reach down, land squash (they slap back down). Only `air` differs by height; the game picks frames 7 … n - 9 by his vertical speed
const snoopyHop = (height, n) => f => {
  const up = 5, down = n - 7, u = (f - up) / (down - up);
  return {
    ...tween(f, [
      [0, {}],
      [4, SP_SQUAT],
      [up + 2, { sx: 0.88, sy: 1.16, nod: -0.15, swing: [-2.3, 2.3], ears: -0.15, legs: legsAll(0, 2) }],
      [(up + down) / 2, { sx: 1.02, sy: 0.98, swing: [-1.3, 1.3], ears: 1.5, wag: 0.5, legs: SP_TUCK }],
      [down - 1, { sx: 0.95, sy: 1.06, nod: -0.1, swing: [-2, 2], ears: 2.7, legs: legsAll(0, 2) }],
      [down + 2, { sx: 1.18, sy: 0.8, nod: 0.1, swing: [-0.5, 0.5], ears: 0.4 }],
      [n, {}],
    ]),
    air: f > up && f < down ? -height * 4 * u * (1 - u) : 0,
    puff: f >= up && f < up + 10 ? (f - up) / 10 : f >= down ? (f - down) / 7 : null,
  };
};
// a ground roll 120px toward d (1 forward, -1 back): crouch, curl into a ball, one full turn, uncurl still facing the same way
const snoopyRoll = d => f => {
  const p = tween(f, [
    [0, {}],
    [3, { sx: 1.1, sy: 0.86, rot: 0.1 * d, nod: 0.15, ears: 0.3 }],
    [6, { ...SP_BALL, x: 12 * d, sx: 0.86, sy: 0.86 }],
    [22, { ...SP_BALL, x: 112 * d, sx: 0.86, sy: 0.86 }],
    [25, { x: 120 * d, sx: 1.12, sy: 0.84, ears: 1.2, swing: [-0.5, 0.5] }],
    [30, { x: 120 * d }],
  ]);
  const e = Math.min(1, Math.max(0, (f - 4) / 18));
  return { ...p, rot: d * Math.PI * 2 * e * e * (3 - 2 * e), [d > 0 ? 'dust' : 'dustAhead']: f >= 4 && f < 16 ? (f - 4) / 12 : null };
};
// a sideways air dodge toward d: Claw'd's streak (its x, stretch and lines), balled up, ears streaming out behind
const snoopyAirDodge = d => {
  const claw = MOVESET.defense[d > 0 ? 'airDodgeForward' : 'airDodgeBack'].anim;
  return f => {
    const c = claw(f), on = f >= 3 && f < 18;
    return { x: c.x, sx: c.sx, sy: c.sy, rot: c.rot, speed: c.speed, air: c.air, squint: on,
      ...tween(f, [[0, SP_AIR], [3, { swing: [0.9, 1.1], nod: 0.2, ears: d > 0 ? 1.8 : -0.6, legs: SP_TUCK }], [16, { swing: [0.9, 1.1], nod: 0.2, ears: d > 0 ? 1.9 : -0.5, legs: SP_TUCK }], [28, SP_AIR]]) };
  };
};
// a throw: Claw'd's throwAnim (the foe carried to the release frame, then flying on in the viewer)
const snoopyWord = (text, x, y, from, len, col) => f => ({ pow: f >= from && f < from + len ? [text, x, y, (f - from) / len, col] : null });

const SNOOPY_MOVESET = {
  movement: {
    ...MOVESET.movement,
    idle: {
      ...MOVESET.movement.idle,
      anim: (f, n) => { // two slow breaths, the tail ticking over, the ears lifting a hair with each breath, one blink near the end
        const b = (1 - Math.cos(f / n * Math.PI * 4)) / 2;
        return {
          sx: 1 + 0.02 * b, sy: 1 - 0.03 * b, nod: -0.03 * b, swing: [-0.08 * b, 0.08 * b], ears: 0.05 * b,
          wag: 0.15 + 0.2 * Math.sin(f / n * Math.PI * 12), blink: f >= 100 && f < 106 ? 1 : 0,
        };
      },
    },
    walk: {
      ...MOVESET.movement.walk,
      anim: (f, n) => { // a jaunty stroll: feet lifted high, arms swinging against them, head and ears bobbing a beat behind, tail wagging
        const p = f / n * Math.PI * 2, y = -0.9 * (1 + Math.cos(2 * p));
        const foot = q => [4.5 * Math.sin(q), -4 * Math.max(0, Math.cos(q)) - y], a = foot(p), b = foot(p + Math.PI);
        return {
          y, sx: 1 - 0.01 * Math.cos(2 * p), sy: 1 + 0.02 * Math.cos(2 * p), rot: 0.04 + 0.015 * Math.sin(2 * p), nod: -0.03 + 0.05 * Math.sin(2 * p + 0.8),
          swing: [0.5 * Math.sin(p), -0.5 * Math.sin(p)], ears: 0.12 + 0.14 * Math.sin(2 * p - 0.6), wag: 0.35 * Math.sin(2 * p), legs: [b, [0, 0], [0, 0], a],
        };
      },
    },
    dash: {
      ...MOVESET.movement.dash,
      anim: f => ({ // crouch, burst off leaning in, arms flung back, ears streaming, into the run's first frame (the game hands off at 16)
        ...tween(f, [
          [0, {}],
          [3, { x: -2, sx: 1.08, sy: 0.9, rot: -0.06, nod: 0.08, swing: [0.5, 0.5], ears: 0.15, legs: [[1, 0], [0, 0], [0, 0], [-1, 0]] }],
          [6, { x: 8, y: -3, sx: 1.08, sy: 0.94, rot: 0.26, nod: -0.14, swing: [-1.2, 1.1], ears: 1.5, wag: 0.8, open: 0.3, legs: [[-10, -3], [0, 0], [0, 0], [8, -2]], speed: 1 }],
          [11, { x: 7, y: -3, sx: 1.06, sy: 0.95, rot: 0.24, nod: -0.12, swing: [-1.1, 1], ears: 1.6, wag: 0.7, open: 0.3, legs: [[-9, -2], [0, 0], [0, 0], [7, -2]], speed: 1 }],
          [16, { ...snoopyRun(0), dust: undefined }],
          [20, {}],
        ]),
        dust: f >= 5 && f < 17 ? (f - 5) / 12 : null,
      }),
    },
    run: { ...MOVESET.movement.run, anim: snoopyRun },
    skid: {
      ...MOVESET.movement.skid,
      anim: f => ({ // heels dug in, leaning back, arms thrown out in front, ears flopping forward over his face; then flips round
        ...tween(f, [
          [0, { rot: 0.18, nod: -0.1, swing: [-0.6, -0.6], ears: 1.5, speed: 0.5 }],
          [4, { x: 4, rot: -0.22, sx: 1.08, sy: 0.9, nod: -0.12, swing: [1, 1.2], ears: -0.3, open: 0.4, legs: [[2, 0], [0, 0], [0, 0], [9, 0]] }],
          [13, { x: 10, rot: -0.16, sx: 1.06, sy: 0.92, nod: -0.08, swing: [0.9, 1.1], ears: -0.2, open: 0.3, legs: [[2, 0], [0, 0], [0, 0], [8, 0]] }],
          [17, { x: 10, sx: 0.15, sy: 1.05, ears: 0.3 }],
          [21, { x: 10, sx: -1.08, sy: 0.94, ears: 0.6 }],
          [26, { x: 10, sx: -1 }],
        ]),
        dustAhead: f >= 3 && f < 15 ? (f - 3) / 12 : null,
      }),
    },
    crouch: {
      ...MOVESET.movement.crouch,
      anim: f => { // down low, head tucked, paws in, breathing (the game loops 5 … 50)
        const p = tween(f, [[0, {}], [5, SP_CROUCH], [50, SP_CROUCH], [60, {}]]);
        if (f > 5 && f < 50) p.sy += 0.012 * Math.sin((f - 5) / 45 * Math.PI * 4);
        return p;
      },
    },
    crouchWalk: {
      ...MOVESET.movement.crouchWalk,
      anim: (f, n) => { // sneaking: low, leaning in on tiptoe, paws up in front of him, eyes narrowed, tail down
        const p = f / n * Math.PI * 2, y = -0.6 * (1 + Math.cos(2 * p));
        const foot = q => [3 * Math.sin(q), -3.5 * Math.max(0, Math.cos(q)) - y], a = foot(p), b = foot(p + Math.PI);
        return {
          y, sx: 1.06, sy: 0.84 - 0.01 * Math.cos(2 * p), rot: 0.12, nod: 0.05 + 0.03 * Math.sin(2 * p), arm: [-2, -2],
          swing: [1.6 + 0.2 * Math.sin(p), 1.8 - 0.2 * Math.sin(p)], blink: 0.4, ears: 0.05 + 0.06 * Math.sin(2 * p), wag: -0.25, legs: [b, [0, 0], [0, 0], a],
        };
      },
    },
    jumpSquat: {
      ...MOVESET.movement.jumpSquat,
      anim: f => ({
        ...tween(f, [
          [0, {}],
          [4, SP_SQUAT],
          [6, { ...SP_SQUAT, sx: 1.18, sy: 0.8, nod: 0.12, swing: [0.6, 0.6] }],
          [9, { sx: 0.88, sy: 1.18, nod: -0.15, swing: [-2.3, 2.3], ears: -0.1, air: -6, legs: legsAll(0, 2) }],
          [14, {}],
        ]),
        puff: f >= 6 ? (f - 6) / 8 : null,
      }),
    },
    fullHop: { ...MOVESET.movement.fullHop, anim: snoopyHop(110, 64) },
    shortHop: { ...MOVESET.movement.shortHop, anim: snoopyHop(45, 40) },
    doubleJump: {
      ...MOVESET.movement.doubleJump,
      anim: f => ({ // spins his ears up over his head like helicopter blades and lifts off, grinning
        ...tween(f, [
          [0, { air: -50, swing: [-1.5, 1.5], ears: 2, legs: legsAll(0, 1) }],
          [3, { air: -52, sx: 1.1, sy: 0.9, swing: [-0.5, 0.5], ears: 1.2, legs: SP_TUCK }],
          [7, { air: -75, sx: 0.92, sy: 1.1, swing: [-0.3, 0.3], happy: 1, wag: 0.8, legs: legsAll(0, 3) }],
          [22, { air: -112, swing: [-0.45, 0.45], happy: 1, wag: 0.8, legs: legsAll(0, 2) }],
          [28, { air: -100, swing: [-1.2, 1.2], ears: 1.8, legs: legsAll(0, 1) }],
          [36, { air: -50, swing: [-1.5, 1.5], ears: 2, legs: legsAll(0, 1) }],
        ]),
        whirl: f >= 4 && f < 26 ? (f - 4) * 1.15 : null, speed: 0,
      }),
    },
    fall: {
      ...MOVESET.movement.fall,
      anim: (f, n) => { // dropping: ears floating up and fluttering, arms up, feet paddling
        const p = f / n * Math.PI * 2, s = Math.sin(2 * p);
        return {
          air: -80 + 3 * Math.sin(p), sx: 0.98, sy: 1.03, swing: [-2.1 - 0.25 * s, 2.1 + 0.25 * s],
          ears: [2.6 + 0.25 * Math.sin(2 * p + 1), 2.8 + 0.25 * s], legs: [[0, 2 + 1.5 * s], [0, 0], [0, 0], [0, 2 - 1.5 * s]],
        };
      },
    },
    fastFall: {
      ...MOVESET.movement.fastFall,
      anim: (f, n) => { // stretched like a dart, arms and ears straight up, feet pointed down
        const p = f / n * Math.PI * 2;
        return {
          air: -70, sx: 0.9, sy: 1.12, nod: -0.1, swing: [-2.5, 2.5], ears: [3.05 + 0.08 * Math.sin(4 * p), 3.15 + 0.08 * Math.sin(4 * p + 1)],
          legs: legsAll(0, 3 + 0.5 * Math.sin(p * 2)), fallLines: 0.75 + 0.25 * Math.sin(p * 2),
        };
      },
    },
    land: {
      ...MOVESET.movement.land,
      anim: f => ({ // touch down stretched, squash, ears slap down and flop forward past hanging, wobble back
        ...tween(f, [
          [0, { air: -20, sx: 0.94, sy: 1.08, swing: [-2, 2], ears: 2.6, legs: legsAll(0, 2) }],
          [3, { sx: 1.2, sy: 0.78, nod: 0.12, swing: [-0.7, 0.7], ears: 1.3 }],
          [6, { sx: 0.96, sy: 1.05, nod: -0.04, swing: [-0.2, 0.2], ears: -0.3 }],
          [10, { sx: 1.02, sy: 0.98, ears: 0.12 }],
          [18, {}],
        ]),
        puff: f >= 3 ? (f - 3) / 15 : null,
      }),
    },
    platformDrop: {
      ...MOVESET.movement.platformDrop,
      anim: f => tween(f, [ // a dip, then down through the platform, arms and ears going up
        [0, {}],
        [4, { sx: 1.08, sy: 0.88, nod: 0.1, swing: [0.3, 0.3], ears: 0.05 }],
        [8, { air: 6, sx: 0.94, sy: 1.06, swing: [-2, 2], ears: 1.2, legs: legsAll(0, 1) }],
        [30, { air: 55, sx: 0.96, sy: 1.06, swing: [-2.2, 2.2], ears: 2.7, legs: legsAll(0, 2) }],
        [40, { air: 55, sx: 0.96, sy: 1.06, swing: [-2.2, 2.2], ears: 2.7, legs: legsAll(0, 2) }],
      ]),
    },
  },

  groundAttacks: {
    jab1: { // a quick straight jab with the front paw, feet planted
      name: 'Paw Jab', input: 'light', startup: 3, active: 2, endlag: 14, damage: 2.5, kb: { base: 8, growth: 25, angle: 40 },
      hitbox: { x: 16, y: -44, w: 30, h: 20 },
      anim: f => ({
        ...tween(f, [
          [0, {}],
          [2, { x: -2, sx: 1.02, sy: 0.98, rot: -0.06, reach: [0, -3], swing: [0, 0.2], ears: 0.1 }],
          [3, { x: 3, sx: 1.04, sy: 0.97, rot: 0.08, nod: 0.04, reach: [0, 21], arm: [0, -3], ears: 0.35, legs: [[-3, 0], [0, 0], [0, 0], [2, 0]] }],
          [6, { x: 3, sx: 1.03, sy: 0.98, rot: 0.07, nod: 0.04, reach: [0, 20], arm: [0, -3], ears: 0.3, legs: [[-3, 0], [0, 0], [0, 0], [2, 0]] }],
          [11, { x: 1, rot: 0.02, reach: [0, 3], ears: 0.1 }],
          [19, {}],
        ]),
        speed: f >= 3 && f < 6 ? 0.4 : 0,
      }),
    },
    jab2: { // the back paw follows through across his chest: a one-two
      name: 'Other Paw', input: 'light (after jab1)', startup: 3, active: 2, endlag: 16, damage: 2, kb: { base: 10, growth: 25, angle: 45 },
      hitbox: { x: 14, y: -44, w: 30, h: 20 },
      anim: f => tween(f, [
        [0, {}],
        [2, { x: -1, rot: -0.04, reach: [2, 0], swing: [0.2, 0], ears: 0.05 }],
        [3, { x: 5, sx: 1.04, sy: 0.97, rot: 0.12, nod: 0.05, reach: [25, -3], arm: [-3, 2], ears: 0.45, legs: [[-5, 0], [0, 0], [0, 0], [3, 0]] }],
        [6, { x: 5, sx: 1.03, sy: 0.98, rot: 0.11, nod: 0.05, reach: [24, -3], arm: [-3, 2], ears: 0.4, legs: [[-5, 0], [0, 0], [0, 0], [3, 0]] }],
        [12, { x: 2, rot: 0.03, reach: [5, 0], ears: 0.15 }],
        [21, {}],
      ]),
    },
    jab3: { // finisher: rears back, then throws his big head forward nose first, eyes squeezed shut, ears flung back: BONK!
      name: 'Nose Bonk', input: 'light (after jab2)', step: 220, startup: 5, active: 3, endlag: 24, damage: 4.5, kb: { base: 40, growth: 80, angle: 40 },
      hitbox: { x: 16, y: -70, w: 36, h: 36 },
      anim: f => ({
        ...tween(f, [
          [0, {}],
          [4, { x: -5, sx: 0.96, sy: 1.04, rot: -0.22, nod: -0.3, swing: [-0.6, -0.4], ears: 0.2, legs: legsAll(3, 0) }],
          [5, { x: 10, sx: 1.06, sy: 0.95, rot: 0.3, nod: 0.4, swing: [-1.3, -1.1], ears: 1.9, legs: [[-10, 0], [0, 0], [0, 0], [3, 0]] }],
          [8, { x: 11, sx: 1.05, sy: 0.96, rot: 0.28, nod: 0.38, swing: [-1.2, -1], ears: 2, legs: [[-10, 0], [0, 0], [0, 0], [3, 0]] }],
          [16, { x: 7, rot: 0.1, nod: 0.1, swing: [-0.3, -0.2], ears: 0.6, legs: [[-5, 0], [0, 0], [0, 0], [1, 0]] }],
          [32, {}],
        ]),
        squint: f >= 5 && f < 12, speed: f >= 5 && f < 12 ? 1 - (f - 5) / 7 : 0, dust: f >= 5 && f < 17 ? (f - 5) / 12 : null,
        ...snoopyWord('BONK!', 48, -66, 5, 18)(f),
      }),
    },
    dashAttack: { // out of a run: dives and belly-slides along the floor like he's heard the supper dish, arms out ahead, grinning
      name: 'Suppertime Slide', input: 'light while running', startup: 6, active: 8, endlag: 20, damage: 7, kb: { base: 35, growth: 60, angle: 55 },
      hitbox: { x: 10, y: -42, w: 54, h: 40 },
      anim: f => ({
        ...tween(f, [
          [0, { ...snoopyRun(0), dust: undefined, speed: 0 }],
          [4, { x: -3, sx: 1.06, sy: 0.9, rot: -0.12, nod: 0.1, swing: [0.4, 0.4], ears: 0.2 }],
          [6, { x: 12, y: 6, sx: 1.04, sy: 0.96, rot: 1.3, nod: -0.9, swing: [2.3, 2.4], ears: 0.9, happy: 1, open: 0.5, wag: 1, legs: [[-4, -3], [0, 0], [0, 0], [-4, -3]] }],
          [14, { x: 14, y: 8, sx: 1.04, sy: 0.96, rot: 1.32, nod: -0.9, swing: [2.3, 2.4], ears: 1, happy: 1, open: 0.5, wag: 1, legs: [[-4, -3], [0, 0], [0, 0], [-4, -3]] }],
          [22, { x: 8, y: 2, rot: 0.5, nod: -0.3, swing: [0.6, 0.6], ears: 0.9, happy: 1 }],
          [34, {}],
        ]),
        speed: f >= 6 && f < 20 ? 1 - (f - 6) / 14 : 0, dust: f >= 6 && f < 18 ? (f - 6) / 12 : null,
      }),
    },
    forwardTilt: { // rocks back and kicks one big foot up and out in front, arms flung up for balance
      name: 'Beagle Kick', input: 'forward + light', step: 200, startup: 6, active: 3, endlag: 18, damage: 8, kb: { base: 20, growth: 70, angle: 35 },
      hitbox: { x: 18, y: -46, w: 32, h: 32 },
      anim: f => ({
        ...tween(f, [
          [0, {}],
          [5, { x: -3, sx: 0.97, sy: 1.03, rot: 0.08, swing: [-0.3, 0.4], ears: 0.1, legs: [[2, 0], [0, 0], [0, 0], [-3, -2]] }],
          [6, { x: 2, y: 2, rot: -0.42, nod: 0.2, swing: [-1.6, 1.9], ears: 1.1, legs: [[-3, 0], [0, 0], [0, 0], [20, -12]] }],
          [9, { x: 2, y: 2, rot: -0.4, nod: 0.2, swing: [-1.5, 1.8], ears: 1, legs: [[-3, 0], [0, 0], [0, 0], [19, -12]] }],
          [16, { x: 1, y: 1, rot: -0.14, nod: 0.05, swing: [-0.4, 0.5], ears: 0.3, legs: [[-1, 0], [0, 0], [0, 0], [3, -2]] }],
          [27, {}],
        ]),
        speed: f >= 6 && f < 10 ? 0.5 : 0,
      }),
    },
    upTilt: { // springs up tall and whips his ear up behind his head till it stands straight up
      name: 'Ear Whip', input: 'up + light', startup: 5, active: 4, endlag: 16, damage: 6, kb: { base: 25, growth: 80, angle: 88 },
      hitbox: { x: -24, y: -98, w: 60, h: 46 },
      anim: f => ({ ...tween(f, [
        [0, {}],
        [4, { sx: 1.08, sy: 0.9, nod: 0.15, swing: [0.3, 0.3], ears: -0.25 }],
        [5, { y: -3, sx: 0.94, sy: 1.1, nod: -0.25, swing: [-0.8, 0.8], ears: 1.5, legs: legsAll(0, 2) }],
        [9, { y: -2, sx: 0.95, sy: 1.08, nod: -0.3, swing: [-1, 1], ears: 3.15, legs: legsAll(0, 2) }],
        [16, { nod: -0.05, swing: [-0.3, 0.3], ears: 1.5 }],
        [25, {}],
      ]), earTrail: f >= 5 && f < 16 ? [0.3, 3.15, (f - 5) / 11] : null }),
    },
    downTilt: { // from the crouch: sweeps one big foot out low along the floor
      name: 'Foot Sweep', input: 'down + light', startup: 5, active: 3, endlag: 12, damage: 5, kb: { base: 15, growth: 50, angle: 20 },
      hitbox: { x: 12, y: -18, w: 30, h: 18 },
      anim: f => ({
        ...tween(f, [
          [0, SP_CROUCH],
          [4, { ...SP_CROUCH, x: -2, rot: -0.05, legs: [[0, 0], [0, 0], [0, 0], [-3, 0]] }],
          [5, { ...SP_CROUCH, x: 4, rot: -0.1, nod: 0.05, ears: 0.5, legs: [[-4, 0], [0, 0], [0, 0], [20, 0]] }],
          [8, { ...SP_CROUCH, x: 4, rot: -0.1, nod: 0.05, ears: 0.45, legs: [[-4, 0], [0, 0], [0, 0], [19, 0]] }],
          [14, { ...SP_CROUCH, x: 1, legs: [[-1, 0], [0, 0], [0, 0], [5, 0]] }],
          [20, SP_CROUCH],
        ]),
        dustAhead: f >= 5 && f < 15 ? (f - 5) / 10 : null,
      }),
    },
    getupAttack: { // from flat on his back: rocks, spins up breakdancing, feet kicking out both sides, and lands grinning, arms wide.
      // Can't be hurt until the hit comes out; knockback goes away from Snoopy
      name: 'Breakdance', input: 'light / heavy (from knockdown)', startup: 12, active: 4, endlag: 16, damage: 6, kb: { base: 50, growth: 40, angle: 30 },
      hitbox: { x: -60, y: -34, w: 120, h: 34 }, both: true, intangible: [0, 12],
      anim: f => ({
        ...tween(f, [
          [0, SP_FLAT],
          [6, { ...SP_FLAT, rot: -Math.PI / 2 - 0.3, sx: 1.08, sy: 0.9, legs: [[10, -6], [0, 0], [0, 0], [12, -8]] }],
          [11, { rot: Math.PI, y: -14, sx: 0.92, sy: 1.08, swing: [-2, 2], ears: 2.6, legs: [[-6, -5], [0, 0], [0, 0], [6, -5]] }],
          [12, { rot: Math.PI * 2, sx: 1.2, sy: 0.84, reach: [-14, 14], ears: 2, happy: 1, legs: [[-9, -3], [0, 0], [0, 0], [9, -3]] }],
          [16, { rot: Math.PI * 2, sx: 1.18, sy: 0.86, reach: [-13, 13], ears: 1.6, happy: 1, legs: [[-9, -3], [0, 0], [0, 0], [9, -3]] }],
          [22, { rot: Math.PI * 2, sx: 1.06, sy: 0.94, reach: [-4, 4], ears: 0.6, happy: 1 }],
          [32, { rot: Math.PI * 2 }],
        ]),
        puff: f >= 12 ? (f - 12) / 10 : null,
      }),
    },
  },

  aerials: {
    // drawn with a preview-only air: -40 so they float in the viewer; frame 0 / the last frame = the plain airborne pose
    neutralAir: { // curls up, then spins a full turn with his arms flung out both ways and his ears flying: hits all around
      name: 'Beagle Spin', input: 'light (airborne)', startup: 4, active: 8, endlag: 14, damage: 6, kb: { base: 20, growth: 60, angle: 45 },
      hitbox: { x: -42, y: -78, w: 84, h: 80 }, landingLag: 8,
      anim: f => {
        const p = tween(f, [[0, SP_AIR], [3, { sx: 0.92, sy: 1.06, swing: [0.6, 0.6], ears: 0.8, legs: SP_TUCK }],
          [4, { reach: [-14, 14], ears: 1.7, happy: 1, legs: [[-6, -3], [0, 0], [0, 0], [6, -3]] }], [12, { reach: [-14, 14], ears: 1.8, happy: 1, legs: [[-6, -3], [0, 0], [0, 0], [6, -3]] }], [26, SP_AIR]]);
        const e = 1 - (1 - Math.min(1, Math.max(0, (f - 4) / 9))) ** 2; // spin eases out
        return { ...p, rot: f < 4 ? -0.05 * f : -0.2 + (Math.PI * 2 + 0.2) * e, air: -40 };
      },
    },
    forwardAir: { // raises the front paw back over his head, then chops it down in front, ears flung up behind
      name: 'Paw Chop', input: 'forward + light (airborne)', startup: 7, active: 4, endlag: 16, damage: 9, kb: { base: 25, growth: 80, angle: 40 },
      hitbox: { x: 14, y: -58, w: 36, h: 46 }, landingLag: 10,
      anim: f => ({
        ...tween(f, [
          [0, SP_AIR],
          [6, { x: -3, sx: 0.96, sy: 1.04, rot: -0.2, nod: -0.1, swing: [-0.5, 3.4], ears: 1.1, legs: SP_TUCK }],
          [7, { x: 4, sx: 1.06, sy: 0.95, rot: 0.25, nod: 0.15, swing: [-0.8, 1.3], reach: [0, 6], ears: 2, legs: legsAll(-3, -2) }],
          [11, { x: 4, sx: 1.05, sy: 0.96, rot: 0.28, nod: 0.15, swing: [-0.8, 0.9], reach: [0, 6], ears: 1.9, legs: legsAll(-3, -2) }],
          [18, { x: 2, rot: 0.1, swing: [-0.6, 0.7], ears: 1.5, legs: SP_TUCK }],
          [27, SP_AIR],
        ]),
        squint: f >= 7 && f < 12, speed: f >= 7 && f < 11 ? 0.5 : 0, air: -40,
      }),
    },
    backAir: { // tips forward and bucks both big feet out behind him, ears flopping forward
      name: 'Buck Kick', input: 'back + light (airborne)', startup: 6, active: 4, endlag: 14, damage: 10, kb: { base: 30, growth: 85, angle: 145 },
      hitbox: { x: -46, y: -38, w: 32, h: 32 }, landingLag: 9,
      anim: f => ({
        ...tween(f, [
          [0, SP_AIR],
          [5, { x: 3, rot: -0.15, swing: [-0.4, 0.4], ears: 1.6, legs: [[4, -4], [0, 0], [0, 0], [3, -3]] }],
          [6, { x: -4, rot: 0.55, nod: -0.35, swing: [-1.4, 1.6], ears: 0.4, legs: [[-14, -3], [0, 0], [0, 0], [-12, -5]] }],
          [10, { x: -4, rot: 0.53, nod: -0.33, swing: [-1.3, 1.5], ears: 0.5, legs: [[-13, -3], [0, 0], [0, 0], [-11, -5]] }],
          [16, { x: -1, rot: 0.2, ears: 1, legs: [[-5, -3], [0, 0], [0, 0], [-4, -3]] }],
          [24, SP_AIR],
        ]),
        squint: f >= 6 && f < 11, air: -40,
      }),
    },
    upAir: { // a quick backflip: his big feet sweep up over his head, front to back
      name: 'Flip Kick', input: 'up + light (airborne)', startup: 5, active: 5, endlag: 14, damage: 7, kb: { base: 22, growth: 80, angle: 90 },
      hitbox: { x: -38, y: -94, w: 76, h: 50 }, landingLag: 7,
      anim: f => {
        const p = tween(f, [[0, SP_AIR], [4, { sx: 1.08, sy: 0.9, swing: [0.4, 0.4], legs: SP_TUCK }],
          [5, { swing: [-1.8, 1.8], ears: 2.4, legs: legsAll(0, 3) }], [10, { swing: [-1.8, 1.8], ears: 2.4, legs: legsAll(0, 3) }], [24, SP_AIR]]);
        let u = Math.min(1, Math.max(0, (f - 2) / 12)); u = u * u * (3 - 2 * u);
        return { ...p, rot: -Math.PI * 2 * u, air: -40 };
      },
    },
    downAir: { // knees up, then stomps both big feet straight down, arms and ears flung up. Spikes
      name: 'Big Foot Stomp', input: 'down + light (airborne)', startup: 8, active: 6, endlag: 18, damage: 11, kb: { base: 20, growth: 70, angle: 285 },
      hitbox: { x: -22, y: -14, w: 44, h: 22 }, landingLag: 14,
      anim: f => ({
        ...tween(f, [
          [0, SP_AIR],
          [7, { y: -10, sx: 0.94, sy: 1.06, nod: 0.1, swing: [-1.6, 1.6], ears: 1.8, legs: [[2, -5], [0, 0], [0, 0], [-1, -5]] }],
          [8, { y: -6, sx: 0.92, sy: 1.1, swing: [-2.4, 2.4], ears: 3, legs: legsAll(0, 7) }],
          [14, { y: -6, sx: 0.93, sy: 1.09, swing: [-2.3, 2.3], ears: 2.9, legs: legsAll(0, 6.5) }],
          [22, { swing: [-1.2, 1.2], ears: 2, legs: SP_TUCK }],
          [32, SP_AIR],
        ]),
        squint: f >= 8 && f < 15, fallLines: f >= 8 && f < 16 ? 1 - (f - 8) / 8 : 0, air: -40,
      }),
    },
  },

  // hold the button to charge (chargeFrames, chargeMult, chargeAt as Snoo's); c = 0 … 1 charge held so far (the game passes it)
  smashAttacks: {
    forwardSmash: { // the World War I Flying Ace: helmet, goggles and scarf pop on, he crouches, leaning back (charge holds here, frame
      // 12: lower the longer it charges), then launches himself headlong at them like the Sopwith Camel, scarf streaming
      name: 'Flying Ace Tackle', input: 'heavy (X / K), hold to charge', step: 260, startup: 16, active: 4, endlag: 30, damage: 15, kb: { base: 32, growth: 102, angle: 40 },
      hitbox: { x: 14, y: -72, w: 56, h: 64 }, chargeFrames: 60, chargeMult: 1.4, chargeAt: 12,
      anim: (f, n, c = 0) => {
        const p = tween(f, [
          [0, {}],
          [6, { x: -2, sx: 1.04, sy: 0.94, rot: -0.1, nod: -0.1, swing: [-0.6, -0.4], ears: 0.3, blink: 0.35 }],
          [12, { x: -6, sx: 1.1, sy: 0.84, rot: -0.2, nod: -0.15, swing: [-1.2, -1], ears: 0.4, blink: 0.35, legs: [[4, 0], [0, 0], [0, 0], [-2, 0]] }],
          [15, { x: -7, sx: 1.12, sy: 0.82, rot: -0.22, nod: -0.15, swing: [-1.25, -1.05], ears: 0.4, blink: 0.35, legs: [[4, 0], [0, 0], [0, 0], [-2, 0]] }],
          [16, { x: 14, y: -10, sx: 1.04, sy: 0.96, rot: 1.05, nod: -0.85, swing: [2.3, 2.45], ears: 1.1, blink: 0.35, legs: [[-6, -4], [0, 0], [0, 0], [-7, -4]] }], // launch!
          [20, { x: 16, y: -8, sx: 1.04, sy: 0.96, rot: 1.08, nod: -0.85, swing: [2.3, 2.45], ears: 1.2, blink: 0.35, legs: [[-6, -4], [0, 0], [0, 0], [-7, -4]] }],
          [30, { x: 12, y: 2, rot: 0.5, nod: -0.4, swing: [0.8, 1], ears: 1 }], // skidding down
          [42, { x: 4, rot: 0.1, swing: [0.2, 0.3], ears: 0.4 }],
          [50, {}],
        ]);
        if (f >= 6 && f < 16) { p.sy -= 0.06 * c; p.sx += 0.05 * c; p.y = (p.y || 0) + 0; }
        return {
          ...p, ace: tween(f, [[0, { k: 0 }], [5, { k: 1 }], [44, { k: 1 }], [50, { k: 0 }]]).k, scarf: f * (f >= 16 && f < 30 ? 1.8 : 0.8),
          speed: f >= 16 && f < 26 ? 1 - (f - 16) / 10 : 0, dust: f >= 16 && f < 28 ? (f - 16) / 12 : null, puff: f >= 28 && f < 38 ? (f - 28) / 10 : null,
        };
      },
    },
    upSmash: { // the happy dance: crouches (charge holds here, frame 8), then springs up into it, nose in the air, eyes shut, arms out,
      // kicking up one foot and then the other, and a burst of notes pops out over his head, launching whatever's above or beside him
      name: 'Happy Dance', input: 'up + heavy (X / K), hold to charge', startup: 12, active: 6, endlag: 24, damage: 13, kb: { base: 32, growth: 98, angle: 90 },
      hitbox: { x: -45, y: -160, w: 90, h: 160 }, chargeFrames: 60, chargeMult: 1.4, chargeAt: 8,
      anim: (f, n, c = 0) => {
        const kickA = { happy: 1, open: 0.6, nod: -0.5, swing: [-2.3, 1.7], ears: 2.4, legs: [[-2, -5], [0, 0], [0, 0], [9, -12]] };
        const kickB = { happy: 1, open: 0.6, nod: -0.4, swing: [-1.6, 2.4], ears: 2.2, legs: [[-10, -11], [0, 0], [0, 0], [2, -4]] };
        const p = tween(f, [
          [0, {}],
          [6, { sx: 1.12, sy: 0.84, nod: 0.15, swing: [0.6, 0.6], ears: 0.2, happy: 1, legs: [[-3, 0], [0, 0], [0, 0], [3, 0]] }],
          [11, { sx: 1.14, sy: 0.82, nod: 0.18, swing: [0.7, 0.7], ears: 0.2, happy: 1, legs: [[-3, 0], [0, 0], [0, 0], [3, 0]] }],
          [12, { ...kickA, y: -10, sx: 0.9, sy: 1.14 }],
          [17, { ...kickA, y: -8, sx: 0.92, sy: 1.1 }],
          [21, { ...kickB, y: -5, sx: 0.95, sy: 1.06 }],
          [25, { ...kickA, y: -4, sx: 0.96, sy: 1.04 }],
          [29, { ...kickB, y: -2 }],
          [42, {}],
        ]);
        if (f >= 6 && f < 12) { p.sx += 0.08 * c; p.sy -= 0.08 * c; }
        return { ...p, wag: f >= 12 && f < 32 ? 0.8 * Math.sin(f) : 0, burst: f >= 11 && f < 38 ? (f - 11) / 27 : null, puff: f === 12 ? 0 : f > 12 && f < 24 ? (f - 12) / 12 : null };
      },
    },
    downSmash: { // it was a dark and stormy night: kneels at his typewriter and pecks at the keys (charge holds here, frame 8: typing
      // away), then slams the carriage return, DING, and his typed pages shoot out along the floor both ways. Hits both sides;
      // knockback goes away from Snoopy
      name: 'Dark and Stormy Night', input: 'down + heavy (X / K), hold to charge', startup: 12, active: 4, endlag: 22, damage: 13, kb: { base: 30, growth: 95, angle: 20 },
      hitbox: { x: -90, y: -24, w: 180, h: 24 }, both: true, chargeFrames: 60, chargeMult: 1.4, chargeAt: 8,
      anim: (f, n, c = 0) => {
        const hunch = { sx: 1.06, sy: 0.84, rot: 0.12, nod: 0.3, swing: [0.55, 0.65], reach: [8, 8], ears: 0.1, blink: 0.3, legs: [[-4, 0], [0, 0], [0, 0], [-2, 0]] };
        const p = tween(f, [
          [0, {}],
          [4, hunch],
          [11, hunch],
          [12, { sx: 1.1, sy: 0.9, rot: -0.08, nod: -0.1, swing: [0.3, 2], reach: [4, 6], ears: 1.2, happy: 1, legs: [[-4, 0], [0, 0], [0, 0], [-2, 0]] }], // DING
          [18, { sx: 1.06, sy: 0.93, rot: -0.05, nod: -0.05, swing: [0.3, 1.8], reach: [4, 6], ears: 0.8, happy: 1 }],
          [30, { sx: 1.03, sy: 0.96, swing: [0.3, 0.5], ears: 0.2 }],
          [38, {}],
        ]);
        if (f >= 2 && f < 12) { const tap = Math.sin(f * 2.2); p.arm = [-2 + 3 * Math.max(0, tap), -2 + 3 * Math.max(0, -tap)]; p.nod += 0.04 * tap; } // pecking at the keys
        if (f >= 6 && f < 12) p.sy -= 0.04 * c;
        return {
          ...p, typewriter: f < 38 ? [tween(f, [[0, { k: 0 }], [4, { k: 1 }], [30, { k: 1 }], [37, { k: 0 }]]).k, f, f >= 12 ? (f - 12) / 10 : null] : null,
          pages: f >= 12 && f < 36 ? (f - 12) / 24 : null, puff: f >= 12 && f < 22 ? (f - 12) / 10 : null,
        };
      },
    },
  },

  // usable on the ground and in the air; extra fields as in snoo-moveset.js, plus hold / loop (Muse's held stream), counter (Lego
  // Man's) with, on its follow-up, turn = he turns to face whoever hit him, and slip = a sticker left on them
  specials: {
    neutralSpecial: { // Schroeder's piano: his toy piano pops up in front of him and he plays it, eyes shut, rocking to it, and a stream
      // of notes pours out ahead, hitting over and over. Hold B to keep playing (loop: frames 10 … 22, for up to chargeFrames in all),
      // the stream shorter the longer he plays, like Muse's sparks
      name: "Schroeder's Piano", input: 'B (V / L), no direction · hold to keep playing, ground or air', startup: 8, active: 16, endlag: 18, damage: 1.2, every: 4,
      kb: { base: 8, growth: 10, angle: 30 }, hitbox: { x: 34, y: -62, w: 76, h: 44 }, grow: { w: -26 }, landingLag: 10,
      hold: 'special', loop: [10, 22], chargeFrames: 120,
      anim: (f, n, c = 0) => {
        const play = { sx: 1.02, sy: 0.94, rot: 0.1, nod: 0.12, swing: [0.95, 0.85], reach: [6, 6], happy: 1, ears: 0.15, legs: [[-3, 0], [0, 0], [0, 0], [1, 0]] };
        const p = tween(f, [[0, {}], [6, { ...play, happy: 0, blink: 0.3 }], [9, play], [24, play], [42, {}]]);
        if (f >= 8 && f < 24) { const tap = Math.sin(f * 1.3); p.arm = [-2 + 2.5 * Math.max(0, tap), -2 + 2.5 * Math.max(0, -tap)]; p.nod += 0.05 * Math.sin(f * 0.65); p.ears += 0.1 * Math.sin(f * 0.65 + 1); } // playing, rocking to it
        return {
          ...p, piano: f < 42 ? [tween(f, [[0, { k: 0 }], [5, { k: 1 }], [32, { k: 1 }], [40, { k: 0 }]]).k, f] : null,
          notes: [f, c, f < 8 ? 0 : f < 10 ? (f - 8) / 2 : f < 24 ? 1 : Math.max(0, 1 - (f - 24) / 6)],
        };
      },
    },
    sideSpecial: { // Curse you, Red Baron!: pulls on his Flying Ace gear, shakes his fist at the sky, then sends the Sopwith Camel (his
      // doghouse, Woodstock at the controls) puttering off ahead in a wobbly line; flak bursts wherever it hits
      name: 'Curse You, Red Baron!', input: 'B (V / L) + ← →, ground or air · turns that way first', startup: 14, active: 2, endlag: 20, damage: 8, kb: { base: 25, growth: 55, angle: 40 },
      hitbox: null, landingLag: 10,
      projectile: { x: 40, y: -46, speed: 440, life: 1.4, r: 14, wave: [10, 0.7], draw: drawSopwith, hitFx: { draw: snoopyFlak, dur: 0.6 } },
      anim: f => {
        const p = tween(f, [
          [0, {}],
          [5, { rot: -0.08, nod: -0.25, swing: [-0.3, 2.7], arm: [0, -3], ears: 0.3, open: 0.6 }], // fist up at the sky
          [12, { rot: -0.1, nod: -0.3, swing: [-0.3, 2.9], arm: [0, -3], ears: 0.4, open: 0.8 }],
          [14, { x: 3, rot: 0.12, nod: 0.05, swing: [-0.5, 1.5], reach: [0, 12], ears: 0.8, legs: [[-4, 0], [0, 0], [0, 0], [3, 0]] }], // away it goes
          [24, { x: 2, rot: 0.08, swing: [-0.3, 1.3], reach: [0, 8], ears: 0.4 }],
          [36, {}],
        ]);
        if (f >= 5 && f < 13) p.swing = [p.swing[0], p.swing[1] + 0.15 * Math.sin(f * 2.5)]; // shaking it
        return { ...p, ace: tween(f, [[0, { k: 0 }], [4, { k: 1 }], [30, { k: 1 }], [36, { k: 0 }]]).k, scarf: f * 0.8,
          pow: f >= 2 && f < 34 ? ['Curse you, Red Baron!', 10, -112, (f - 2) / 32, INK, 15] : null };
      },
    },
    upSpecial: { // Woodstock airlift: Woodstock and two friends flap down, grab his ear and haul him up (steer with ← →), pecking
      // whatever's above; they tire and scatter at the top (the last, bigger hit) and he drops helpless
      name: 'Woodstock Airlift', input: 'B (V / L) + ↑, ground or air · steer with ← → · falls helpless after', startup: 6, active: 40, endlag: 6, damage: 2, every: 10,
      kb: { base: 20, growth: 20, angle: 85 }, finisher: { damage: 5, kb: { base: 40, growth: 60, angle: 88 } },
      hitbox: { x: -32, y: -132, w: 64, h: 60 }, landingLag: 16, burst: { vy: -330, frames: 40 }, helpless: true,
      anim: f => {
        const lifted = { sx: 0.96, sy: 1.06, swing: [-0.6, 0.6], ears: Math.PI, happy: 1, wag: 0.5, legs: legsAll(0, 3) };
        const p = tween(f, [[0, {}], [4, { sx: 1.06, sy: 0.94, ears: 1.6, nod: -0.2 }], [7, lifted], [44, lifted], [48, { swing: [-2, 2], ears: 2.4, open: 0.5, legs: legsAll(0, 2) }], [58, { swing: [-2.1, 2.1], ears: 2.7, legs: legsAll(0, 2) }]]);
        if (f >= 7 && f < 46) { p.rot = 0.07 * Math.sin((f - 7) / 8); const k = Math.sin((f - 7) / 5); p.legs = [[0, 3 + 1.5 * k], [0, 0], [0, 0], [0, 3 - 1.5 * k]]; } // dangling, feet paddling
        return { ...p, birds: f < 58 ? [Math.min(1, f / 5), f * 0.9, f >= 46 ? (f - 46) / 12 : null] : null, birdY: -100 };
      },
    },
    downSpecial: { state: 'football', // Lucy's football: kneels and holds it up on its end, grinning. Anyone who swings at him in the
      // window (the active frames) gets it pulled away (see kickoff)
      name: "Lucy's Football", input: 'B (V / L) + ↓, ground or air · a counter', startup: 4, active: 24, endlag: 16, landingLag: 10, counter: 'kickoff',
      anim: f => {
        const kneel = { sx: 1.04, sy: 0.9, rot: 0.2, nod: 0.02, swing: [0.3, -0.6], reach: [0, 18], blink: 0.35, legs: [[-5, 0], [0, 0], [0, 0], [-2, 0]] };
        const p = tween(f, [[0, {}], [4, kneel], [28, kneel], [44, {}]]);
        return { ...p, ball: [27, 0, -0.1, 1.3 * tween(f, [[0, { k: 0 }], [4, { k: 1 }], [30, { k: 1 }], [38, { k: 0 }]]).k], wag: f >= 4 && f < 28 ? 0.4 * Math.sin(f / 2) : 0 };
      },
    },
    kickoff: { // countered: he whips the ball away as they swing (AAUGH! on them), turns on them and boots them sky-high. Can't be
      // hurt till the kick's out
      name: 'Kickoff', input: 'a hit during the football', startup: 10, active: 4, endlag: 22, landingLag: 8, intangible: [0, 14], turn: true,
      slip: { secs: 1.1, draw: drawAaugh },
      damage: 14, kb: { base: 72, growth: 100, angle: 50 }, hitbox: { x: 6, y: -64, w: 58, h: 64 },
      anim: f => {
        const p = tween(f, [
          [0, { sx: 1.04, sy: 0.9, rot: 0.2, swing: [0.3, -0.6], reach: [0, 18], blink: 0.35, legs: [[-5, 0], [0, 0], [0, 0], [-2, 0]] }],
          [4, { rot: -0.1, nod: -0.1, swing: [-0.4, 2.4], ears: 1, happy: 1, open: 0.4 }], // yank!
          [9, { x: -3, rot: 0.12, nod: 0.05, swing: [-0.6, -0.5], ears: 0.4, legs: [[1, 0], [0, 0], [0, 0], [-8, -4]] }], // leg back
          [10, { x: 4, y: 2, rot: -0.45, nod: 0.2, swing: [-1.7, 1.9], ears: 1.6, squint: 1, legs: [[-3, 0], [0, 0], [0, 0], [21, -20]] }], // BOOT
          [14, { x: 4, y: 2, rot: -0.42, nod: 0.2, swing: [-1.6, 1.8], ears: 1.5, squint: 1, legs: [[-3, 0], [0, 0], [0, 0], [20, -19]] }],
          [24, { x: 2, rot: -0.12, swing: [-0.4, 0.5], ears: 0.5, happy: 1, legs: [[-1, 0], [0, 0], [0, 0], [3, -2]] }],
          [36, {}],
        ]);
        const u = Math.min(1, f / 6); // the ball: yanked up and away behind him, spinning, then gone
        return {
          ...p, squint: f >= 10 && f < 16, speed: f >= 10 && f < 14 ? 0.6 : 0,
          ball: f < 16 ? [27 - 58 * u * u, -200 * u + 110 * u * u, -0.1 - 5 * u, 1.3 * (f < 10 ? 1 : 1 - (f - 10) / 6), true] : null,
          ...snoopyWord('BOOT!', 52, -70, 10, 18)(f),
        };
      },
    },
  },

  grabs: {
    grab: { // both paws shoot out in front and clamp; a whiff snaps them back empty
      name: 'Paw Grab', input: 'grab (G / I), or shield + light', startup: 7, active: 3, endlag: 22, hitbox: { x: 14, y: -46, w: 44, h: 40 }, grab: true,
      anim: f => tween(f, [
        [0, {}],
        [5, { x: -2, sx: 0.97, sy: 1.03, rot: -0.08, reach: [-3, -2], arm: [-2, -2], ears: 0.15 }],
        [7, { x: 4, sx: 1.05, sy: 0.96, rot: 0.12, nod: 0.08, reach: [22, 20], arm: [-4, -4], ears: 0.6, legs: [[-4, 0], [0, 0], [0, 0], [3, 0]] }],
        [10, { x: 4, sx: 1.04, sy: 0.97, rot: 0.12, nod: 0.08, reach: [21, 19], arm: [-4, -4], ears: 0.55, legs: [[-4, 0], [0, 0], [0, 0], [3, 0]] }],
        [17, { x: 2, rot: 0.04, reach: [6, 5], ears: 0.2 }],
        [32, {}],
      ]),
    },
    dashGrab: { // out of a run: dives forward paws first, sliding on the momentum
      name: 'Diving Grab', input: 'grab while running', startup: 9, active: 3, endlag: 28, hitbox: { x: 20, y: -44, w: 60, h: 40 }, grab: true,
      anim: f => ({
        ...tween(f, [
          [0, { ...snoopyRun(0), dust: undefined, speed: 0 }],
          [5, { x: -2, sx: 1.06, sy: 0.92, rot: -0.04, reach: [-2, -2], ears: 0.4 }],
          [9, { x: 12, y: -2, sx: 1.06, sy: 0.93, rot: 0.35, nod: -0.15, reach: [26, 24], arm: [-6, -6], ears: 1.6, legs: [[-9, -3], [0, 0], [0, 0], [4, 0]] }],
          [12, { x: 14, sx: 1.05, sy: 0.94, rot: 0.32, nod: -0.13, reach: [25, 23], arm: [-6, -6], ears: 1.4, legs: [[-9, -2], [0, 0], [0, 0], [4, 0]] }],
          [24, { x: 8, rot: 0.1, reach: [8, 6], ears: 0.5 }],
          [40, {}],
        ]),
        speed: f >= 9 && f < 20 ? 1 - (f - 9) / 11 : 0, dust: f >= 9 && f < 21 ? (f - 9) / 12 : null,
      }),
    },
    hold: { // got it: held out in both paws, leaning back a little, tail going
      ...MOVESET.grabs.hold, input: 'grab connects',
      anim: (f, n = 60) => {
        const b = Math.sin(f / n * Math.PI * 4);
        return { ...SP_HOLD, rot: -0.08 + 0.02 * b, sx: 1.01 + 0.01 * b, sy: 0.99 - 0.01 * b, ears: 0.2 + 0.06 * b, wag: 0.5 + 0.4 * Math.sin(f / n * Math.PI * 8), carry: [46, -4 + b, 0] };
      },
    },
    pummel: { // leans in and plants a big kiss on it: SMAK!
      name: 'Slobber Kiss', input: 'light (holding)', startup: 5, active: 1, endlag: 10, damage: 1.5,
      anim: f => ({
        ...tween(f, [
          [0, SP_HOLD],
          [4, { ...SP_HOLD, rot: -0.12, nod: -0.1, ears: 0.1 }],
          [5, { ...SP_HOLD, rot: 0.18, nod: 0.25, blink: 1, ears: 0.6, carry: [47, -3, 0.05] }],
          [16, SP_HOLD],
        ]),
        ...snoopyWord('SMAK!', 40, -86, 5, 11, SNOOPY_COLLAR)(f), heart: f >= 5 ? [30, -62, (f - 5) / 11] : null,
      }),
    },
    forwardThrow: { // pulls it in, shoves it away with both paws and sticks his tongue out after it: Bleah!
      name: 'Bleah!', input: 'forward (holding)', startup: 12, active: 1, endlag: 20, damage: 7, kb: { base: 55, growth: 55, angle: 35 },
      anim: throwAnim({ at: 12, n: 33, fly: [12, -5, 0.15], keys: [
        [0, SP_HOLD],
        [6, { x: -3, sx: 0.96, sy: 1.04, rot: -0.2, nod: -0.1, reach: [4, 2], swing: [-0.4, -0.3], ears: 0.1, carry: [40, -6, -0.1] }],
        [10, { x: -4, sx: 0.95, sy: 1.05, rot: -0.24, nod: -0.12, swing: [-0.6, -0.5], ears: 0.1, carry: [38, -8, -0.15] }],
        [12, { x: 6, sx: 1.08, sy: 0.93, rot: 0.2, nod: 0.1, reach: [22, 20], arm: [-3, -3], ears: 1.4, legs: [[-8, 0], [0, 0], [0, 0], [3, 0]], carry: [70, -12, 0.2] }], // shove
        [20, { x: 5, rot: 0.1, nod: -0.15, reach: [8, 6], ears: 0.6 }],
        [28, { x: 2, nod: -0.1, ears: 0.2 }],
        [33, {}],
      ], extra: f => ({ speed: f >= 12 && f < 20 ? 1 - (f - 12) / 8 : 0, tongue: f >= 14 && f < 30 ? Math.min(1, (f - 14) / 3, (30 - f) / 4) : 0, ...snoopyWord('BLEAH!', 40, -86, 14, 18)(f) }) }),
    },
    backThrow: { // Joe Cool: slips on his shades, hoists it overhead and flips it away behind him without looking
      name: 'Joe Cool', input: 'back (holding)', startup: 16, active: 1, endlag: 20, damage: 9, kb: { base: 60, growth: 62, angle: 42 },
      anim: throwAnim({ at: 16, n: 37, fly: [-12, -4, -0.15], keys: [
        [0, SP_HOLD],
        [8, { rot: -0.05, sx: 0.96, sy: 1.06, nod: -0.1, swing: [-1.6, 1.6], ears: 0.3, carry: [30, -58, -0.8] }],
        [13, { rot: -0.3, nod: -0.2, swing: [-2.3, 2.3], ears: 1, carry: [-14, -78, -2.2] }],
        [16, { rot: -0.38, sx: 1.06, sy: 0.94, nod: -0.2, swing: [-1.2, 1.2], ears: 1.6, carry: [-56, -26, -3] }],
        [22, { rot: -0.2, nod: -0.12, swing: [0.2, 0.3], ears: 0.5 }],
        [37, {}],
      ], extra: f => ({ shades: tween(f, [[0, { k: 0 }], [7, { k: 1 }], [31, { k: 1 }], [37, { k: 0 }]]).k }) }),
    },
    upThrow: { // tosses it straight up and barks after it: WOOF!
      name: 'Woof!', input: 'up (holding)', startup: 14, active: 1, endlag: 20, damage: 6, kb: { base: 70, growth: 45, angle: 90 },
      anim: throwAnim({ at: 14, n: 35, fly: [0, -14, 0.05], keys: [
        [0, SP_HOLD],
        [6, { sx: 1.1, sy: 0.9, nod: 0.15, swing: [0.4, 0.4], reach: [12, 10], ears: 0.1, carry: [40, -12, 0] }],
        [10, { sx: 1.12, sy: 0.88, nod: -0.1, swing: [-1.6, 1.6], carry: [26, -66, 0.2] }], // up it goes
        [14, { y: -8, sx: 0.9, sy: 1.16, nod: -0.45, swing: [-2.3, 2.3], ears: 2.2, open: 1, legs: legsAll(0, 3), carry: [10, -94, 0.3] }], // bark
        [20, { y: -5, sx: 0.93, sy: 1.1, nod: -0.35, swing: [-2, 2], ears: 1.8, open: 0.8, legs: legsAll(0, 2) }],
        [35, {}],
      ], extra: snoopyWord('WOOF!', 10, -112, 14, 20) }),
    },
    downThrow: { // drops it, then pounces on it with both big feet, where it bounces up
      name: 'Pounce', input: 'down (holding)', startup: 14, active: 1, endlag: 20, damage: 6, kb: { base: 45, growth: 50, angle: 80 },
      anim: throwAnim({ at: 14, n: 35, fly: [2, -9, 0.1], keys: [
        [0, SP_HOLD],
        [6, { y: -4, sx: 0.92, sy: 1.1, nod: -0.1, reach: [14, 12], arm: [-8, -8], ears: 0.3, carry: [44, -30, -0.1] }],
        [11, { y: -8, sx: 0.9, sy: 1.12, reach: [14, 12], arm: [-10, -10], ears: 0.6, legs: SP_TUCK, carry: [46, -40, 0] }],
        [14, { x: 8, y: -6, sx: 1.18, sy: 0.84, rot: 0.35, nod: 0.2, reach: [18, 16], arm: [2, 2], ears: 1.8, legs: [[-6, -4], [0, 0], [0, 0], [2, -2]], carry: [52, 0, 0] }], // pounce
        [22, { x: 4, sx: 1.06, sy: 0.94, rot: 0.1, ears: 0.8 }],
        [35, {}],
      ], extra: f => ({ squint: f >= 14 && f < 20, puff: f >= 14 ? (f - 14) / 10 : null }) }),
    },
  },

  ledge: { // Claw'd's x / air path (it's the game's root motion there), Snoopy's arms stretched up over the lip
    ledgeGrab: {
      ...MOVESET.ledge.ledgeGrab,
      anim: f => tween(f, [ // catches it with both paws, drops and stretches (ears flying up, then flopping), settles into the hang
        [0, { x: -60, air: 28, sx: 0.92, sy: 1.12, nod: -0.2, swing: [0.3, 0.36], reach: [28, 26], ears: 2.2, legs: legsAll(0, 3) }],
        [4, { x: -60, air: 46, sx: 1.04, sy: 0.96, nod: -0.1, swing: [0.34, 0.42], reach: [36, 34], ears: -0.2, legs: legsAll(0, 5) }],
        [10, SP_HANG],
      ]),
    },
    ledgeHang: {
      ...MOVESET.ledge.ledgeHang,
      anim: (f, n) => { // dangling, peeking over the lip: slow sway, feet trailing, ears and tail swinging with it
        const s = Math.sin(f / n * Math.PI * 2);
        return { ...SP_HANG, rot: 0.04 * s, ears: 0.3 + 0.15 * s, wag: 0.3 * Math.sin(f / n * Math.PI * 4), legs: [[-s, 3], [0, 0], [0, 0], [-s, 3]], blink: f >= 40 && f < 46 ? 1 : 0 };
      },
    },
    ledgeGetup: {
      ...MOVESET.ledge.ledgeGetup,
      anim: f => ({ // dips, hauls up over the lip arms flung up, squashes down onto the stage
        ...tween(f, [
          [0, SP_HANG],
          [5, SP_PULL],
          [11, { x: -46, air: -6, sx: 0.9, sy: 1.12, rot: 0.25, swing: [-1.8, 1.8], ears: 1.6, legs: SP_TUCK }],
          [16, { x: -14, air: -4, rot: 0.15, swing: [-1.3, 1.3], ears: 1.2, legs: SP_TUCK }],
          [19, { sx: 1.14, sy: 0.82, swing: [-0.4, 0.4], ears: 0.3 }],
          [24, {}],
        ]),
        puff: f >= 19 ? (f - 19) / 5 : null,
      }),
    },
    ledgeJump: {
      ...MOVESET.ledge.ledgeJump,
      anim: f => tween(f, [ // pulls down, springs straight up arms first, drifts over the stage
        [0, SP_HANG],
        [4, { ...SP_PULL, air: 48, sx: 1.08, sy: 0.9 }],
        [6, { x: -58, air: 40, sx: 0.88, sy: 1.18, nod: -0.15, swing: [-2.3, 2.3], ears: -0.1, legs: legsAll(0, 3) }],
        [20, { x: -40, air: -90, sx: 1.02, sy: 0.98, swing: [-1.3, 1.3], ears: 1.5, legs: SP_TUCK }],
        [34, { x: -24, air: -40, sx: 0.95, sy: 1.06, swing: [-2, 2], ears: 2.6, legs: legsAll(0, 2) }],
        [40, { x: -20, air: -30, sx: 0.95, sy: 1.06, swing: [-2, 2], ears: 2.6, legs: legsAll(0, 2) }],
      ]),
    },
    ledgeRoll: {
      ...MOVESET.ledge.ledgeRoll,
      anim: f => { // hauls up, curls into a ball and rolls a full turn onto the stage, pops up standing well inland
        const p = tween(f, [
          [0, SP_HANG],
          [5, SP_PULL],
          [10, { ...SP_BALL, x: -40, air: -10, sx: 0.86, sy: 0.86 }],
          [25, { ...SP_BALL, x: 72, air: -4, sx: 0.86, sy: 0.86 }],
          [28, { x: 84, sx: 1.12, sy: 0.84, swing: [-0.5, 0.5], ears: 1 }],
          [36, { x: 90 }],
        ]);
        const e = Math.min(1, Math.max(0, (f - 9) / 17));
        return { ...p, rot: Math.PI * 2 * e * e * (3 - 2 * e), puff: f >= 26 && f < 32 ? (f - 26) / 6 : null };
      },
    },
    ledgeAttack: {
      ...MOVESET.ledge.ledgeAttack, name: 'Ledge Kick', hitbox: { x: 12, y: -34, w: 40, h: 30 },
      anim: f => ({ // hauls up, lands low and kicks a big foot out along the stage
        ...tween(f, [
          [0, SP_HANG],
          [4, SP_PULL],
          [9, { x: -44, air: -8, sx: 0.9, sy: 1.12, rot: 0.25, swing: [-1.8, 1.8], ears: 1.6, legs: SP_TUCK }],
          [13, { x: -16, air: -4, rot: -0.1, swing: [-0.6, 0.6], ears: 1, legs: SP_TUCK }],
          [15, { x: -6, sx: 1.1, sy: 0.86, rot: 0.1, swing: [-0.8, 0.8], ears: 0.5, legs: [[2, 0], [0, 0], [0, 0], [-3, -3]] }],
          [16, { x: 4, rot: -0.35, nod: 0.15, swing: [-1.5, 1.8], ears: 1.1, legs: [[-3, 0], [0, 0], [0, 0], [18, -8]] }],
          [20, { x: 4, rot: -0.33, nod: 0.15, swing: [-1.4, 1.7], ears: 1, legs: [[-3, 0], [0, 0], [0, 0], [17, -8]] }],
          [28, { x: 2, rot: -0.1, ears: 0.4, legs: [[-1, 0], [0, 0], [0, 0], [3, -1]] }],
          [36, {}],
        ]),
        speed: f >= 16 && f < 20 ? 0.6 : 0,
        puff: f >= 15 && f < 21 ? (f - 15) / 6 : null,
      }),
    },
    ledgeDrop: {
      ...MOVESET.ledge.ledgeDrop,
      anim: f => tween(f, [ // lets go: arms stay up, ears fly up as he slides down the wall
        [0, SP_HANG],
        [4, { x: -62, air: 50, sx: 0.92, sy: 1.1, swing: [-2.3, 2.3], ears: 1.5, legs: legsAll(0, 3) }],
        [16, { x: -66, air: 110, sx: 0.96, sy: 1.04, swing: [-2.1, 2.1], ears: 2.7, legs: legsAll(0, 2) }],
        [24, { x: -66, air: 110, sx: 0.96, sy: 1.04, swing: [-2.1, 2.1], ears: 2.7, legs: legsAll(0, 2) }],
      ]),
    },
  },

  defense: {
    ...MOVESET.defense,
    shield: { // hugs Linus's security blanket up under his chin, eyes shut, nuzzling it, and it hangs down in front of him (in the game
      // it shrinks, tears and fades as the shield wears down)
      name: 'Security Blanket', input: 'hold dodge (Shift / Z)', frames: 60,
      anim: f => {
        const hug = { sx: 1.02, sy: 0.96, blink: 1, happy: 0.4, nod: 0.12, swing: [2.1, 1.95], arm: [-2, -2], ears: 0.05, wag: -0.2, legs: [[-2, 0], [0, 0], [0, 0], [2, 0]], shield: 1 };
        const p = tween(f, [[0, {}], [4, hug], [50, hug], [57, {}], [60, {}]]);
        if (f > 4 && f < 50) { const s = Math.sin((f - 4) / 46 * Math.PI * 2); p.nod += 0.04 * s; p.sy += 0.01 * s; } // nuzzling
        return { ...p, blink: p.blink > 0.5 ? 1 : p.blink, flap: (f - 4) / 46 * Math.PI * 4, wear: Math.min(1, Math.max(0, (f - 4) / 46)) }; // preview wears it out over the hold (the game uses the real shield health)
      },
    },
    shieldBreak: { // the blanket's torn away in scraps; he pops up, arms and ears up, yelling, and lands dizzy: good grief
      ...MOVESET.defense.shieldBreak, name: 'Good Grief!', oops: [['Good grief!', 'someone took your blanket']],
      anim: f => {
        const p = tween(f, [
          [0, { sx: 0.9, sy: 1.12, swing: [-2.2, 2.2], ears: 2.8, open: 1, legs: legsAll(0, 2) }],
          [14, { sx: 0.96, sy: 1.05, swing: [-1.8, 1.8], ears: 2.4, open: 0.6, legs: SP_TUCK }],
          [28, { sx: 0.94, sy: 1.08, swing: [-2, 2], ears: 2.7, legs: legsAll(0, 2) }],
          [32, { sx: 1.16, sy: 0.82, swing: [-0.6, 0.6], ears: 0.4 }],
          [40, { sx: 1.04, sy: 0.96, nod: 0.2, swing: [0.2, 0.3], ears: 0.1 }],
          [140, { sx: 1.04, sy: 0.96, nod: 0.2, swing: [0.2, 0.3], ears: 0.1 }],
          [150, {}],
        ]);
        const dizzy = f >= 32 && f < 144;
        return {
          ...p, air: f < 28 ? -60 * Math.sin(Math.PI * f / 28) : 0, // preview-only pop; the game launches him for real
          rot: dizzy ? 0.1 * Math.sin((f - 32) / 9) : 0, dizzy: dizzy ? 0.01 + (f - 32) / 40 : 0, ...(dizzy ? { ears: 0.1 + 0.15 * Math.sin((f - 32) / 9 + 1) } : {}),
          shatter: f < 30 ? f / 30 : null, puff: f >= 28 && f < 34 ? (f - 28) / 6 : null,
          oops: Math.min(1, Math.max(0, Math.min((f - 32) / 6, (110 - f) / 10))), oopsMsg: ['Good grief!', 'someone took your blanket'],
        };
      },
    },
    spotDodge: {
      ...MOVESET.defense.spotDodge,
      anim: f => ({ ...tween(f, [ // ducks, shrinks and squeezes his eyes shut: if he can't see you, you can't see him
        [0, {}],
        [3, { sx: 1.1, sy: 0.86, nod: 0.1, ears: 0.2 }],
        [6, { sx: 0.84, sy: 0.84, nod: 0.35, swing: [0.6, 0.8], ears: -0.3, legs: [[-1, 0], [0, 0], [0, 0], [1, 0]] }],
        [16, { sx: 0.84, sy: 0.84, nod: 0.35, swing: [0.6, 0.8], ears: -0.3, legs: [[-1, 0], [0, 0], [0, 0], [1, 0]] }],
        [21, { sx: 1.06, sy: 0.94, ears: 0.5 }],
        [26, {}],
      ]), squint: f >= 5 && f < 18 }),
    },
    rollForward: { ...MOVESET.defense.rollForward, anim: snoopyRoll(1) },
    rollBack: { ...MOVESET.defense.rollBack, anim: snoopyRoll(-1) },
    airDodgeForward: { ...MOVESET.defense.airDodgeForward, anim: snoopyAirDodge(1) },
    airDodgeBack: { ...MOVESET.defense.airDodgeBack, anim: snoopyAirDodge(-1) },
    airDodge: {
      ...MOVESET.defense.airDodge,
      anim: f => ({
        ...tween(f, [
          [0, SP_AIR],
          [2, { sx: 1.1, sy: 0.9, swing: [0.5, 0.5], ears: 1, legs: SP_TUCK }],
          [5, { ...SP_BALL, sx: 0.84, sy: 0.84 }],
          [18, { ...SP_BALL, sx: 0.84, sy: 0.84 }],
          [24, { sx: 1.05, sy: 0.97, swing: [-0.6, 0.6], ears: 1.2, legs: SP_TUCK }],
          [28, SP_AIR],
        ]),
        air: -40,
      }),
    },
  },

  reactions: { // Claw'd's timings; getting hit sends Snoopy's ears flying
    hitstun: {
      ...MOVESET.reactions.hitstun,
      anim: (f, n = 30) => { // snaps back, ears thrown up, mouth open, shudders, shakes it off (the game stretches this over the hitstun)
        const t = f / n * 30, p = tween(t, [
          [0, { x: -4, sx: 0.88, sy: 1.12, rot: -0.26, nod: -0.3, swing: [-2, 2], ears: 2.6, open: 0.7, legs: [[-3, -2], [0, 0], [0, 0], [3, -2]] }],
          [5, { x: -6, sx: 0.92, sy: 1.08, rot: -0.2, nod: -0.2, swing: [-1.6, 1.6], ears: 2.2, open: 0.5, legs: [[-2, -1], [0, 0], [0, 0], [2, -1]] }],
          [22, { x: -3, sx: 1.03, sy: 0.97, rot: -0.05, nod: 0.05, swing: [-0.3, 0.3], ears: 0.3 }],
          [30, {}],
        ]);
        if (t < 10) p.x += f % 2 ? 1.5 : -1.5;
        return { ...p, squint: t < 20 };
      },
    },
    tumble: {
      ...MOVESET.reactions.tumble,
      anim: (f, n = 40) => { // launched hard: head over heels, arms, legs and ears flailing
        const p = f / n * Math.PI * 2, s = Math.sin(2 * p);
        return {
          rot: -p, sx: 0.94, sy: 1.06, swing: [-1.4 + s, 1.4 + s], ears: [1.5 + 1.2 * Math.sin(3 * p), 1.8 + 1.2 * Math.sin(3 * p + 1)],
          legs: [[-3, -3 * s], [0, 0], [0, 0], [3, 3 * s]], squint: true, open: 0.5, air: -30,
        };
      },
    },
    knockdown: {
      ...MOVESET.reactions.knockdown,
      anim: f => { // slams down flat on his back like on his doghouse roof, bounces, then lies there seeing stars, feet kicking
        const kick = i => f >= 14 ? 2 + 2 * Math.sin((f - 14) / 3 + i * 1.7) : 0;
        return {
          ...SP_FLAT,
          ...tween(f, [[0, { y: 20, sx: 1.1, sy: 0.72 }], [6, { y: 6, sx: 0.96, sy: 1.04 }], [12, { y: 20, sx: 1.08, sy: 0.82 }], [18, { y: 20, sx: 1.02, sy: 0.95 }]]),
          legs: [[7 + kick(0), -2], [0, 0], [0, 0], [9 + kick(3), -4]], // (on his back, + dx lifts them)
          squint: f < 14, dizzy: f >= 14 ? 0.01 + (f - 14) / 40 : 0, puff: f < 8 ? f / 8 : f >= 12 && f < 18 ? (f - 12) / 6 : null,
        };
      },
    },
    tech: {
      ...MOVESET.reactions.tech,
      anim: f => ({ // slaps the floor and pops straight back onto his feet
        ...tween(f, [
          [0, { sx: 1.3, sy: 0.66, ears: 1.6, swing: [-1, 1] }],
          [5, { y: -18, sx: 0.9, sy: 1.12, swing: [-2, 2], ears: 2.4, legs: SP_TUCK }],
          [11, { sx: 1.14, sy: 0.84, swing: [-0.5, 0.5], ears: 0.5 }],
          [22, {}],
        ]),
        ring: f < 12 ? f / 12 : null, squint: f < 5,
      }),
    },
    getup: {
      ...MOVESET.reactions.getup,
      anim: f => ({ // off his back: rocks back, sits up with a swing of the arms and hops onto his feet
        ...tween(f, [
          [0, SP_FLAT],
          [5, { ...SP_FLAT, rot: -Math.PI / 2 - 0.25, sx: 1.06, sy: 0.9, legs: [[10, -6], [0, 0], [0, 0], [12, -8]] }],
          [13, { rot: -0.35, y: -16, sx: 0.92, sy: 1.08, swing: [-1.8, 1.8], ears: 2, legs: SP_TUCK }],
          [18, { sx: 1.16, sy: 0.82, swing: [-0.4, 0.4], ears: 0.5 }],
          [26, {}],
        ]),
        puff: f >= 18 ? (f - 18) / 8 : null,
      }),
    },
    ko: {
      ...MOVESET.reactions.ko,
      anim: f => f < 20 // spins off shrinking, then a burst of ink and collar red round a spinning paw print
        ? { x: 7 * f, air: -5 * f, rot: -f / 4, sx: 1 - f / 40, sy: 1 - f / 40, swing: [-2, 2], ears: 2.6, open: 0.8, squint: true }
        : { x: 140, air: -100, blast: [(f - 20) / 60, Math.PI - 0.6, SNOOPY_COLLAR, (x, y, r, spin) => { ctx.save(); ctx.translate(x, y); ctx.rotate(spin * 0.3); snoopyPaw(0, 0, r * 0.75); ctx.restore(); }] },
    },
    respawn: { // lowered in on the platform (his paw print on it), barking hello
      ...MOVESET.reactions.respawn, name: 'Back for Supper', say: 'Woof!', mark: (x, y, r) => snoopyPaw(x, y, r * 0.9),
      anim: f => { const p = MOVESET.reactions.respawn.anim(f); return { ...SNOOPY_MOVESET.movement.idle.anim(f % 120, 120), air: p.air, pad: p.pad, padMark: (x, y, r) => snoopyPaw(x, y, r * 0.9), say: ['Woof!', p.say[1]] }; },
    },
  },
};
