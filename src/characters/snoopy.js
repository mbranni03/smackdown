// Snoopy (Peanuts' beagle), drawn after Schulz: standing up on his hind legs, a huge white bean of a head (about three times as wide
// as his body) whose top runs in one smooth curve from the dome at the back down to a deep, round muzzle, a round black nose on its
// front, a small dash of an eye mid-head, a short smile up by his cheek, a black ear set in on the back of his head and a little
// tuft on top; a thin neck with a thin collar, a slim body with a round belly, long thin arms, long flat feet and a small tail.
// pose fields (all optional), written facing right and mirrored for face = -1 (Snoo's, snoo.js, plus his own):
//   x, y offsets · sx, sy stretch (from the floor) · rot radians (+ = lean forward, around the middle) · blink 0 (open) … 1 (shut)
//   arm = px (negative = up), or [back, front] · legs = Claw'd's four [dx, dy] foot offsets, back to front: the outer two move his feet
//   swing = radians the arms swing about the shoulders (+ = tip toward facing), or [back, front] · reach = px an arm stretches
//           forward (the front one), or [back, front] (negative = backward)
//   ears = radians the ears swing back from hanging (π = straight up, startled), or [far, near] (only the near one is drawn: one ear at a time, as Schulz shows him) · nod = radians the head tips
//          about the neck (+ = chin down) · wag = radians the tail swings (+ = up)
//   happy = 0 … 1 eyes closed in happy arcs (his dance face) · open = 0 … 1 mouth open (a bark, a yell) · squint = eyes shut tight
//   tongue = 0 … 1 his tongue stuck out (Bleah!) · shades = 0 … 1 Joe Cool's sunglasses sliding on · dizzy = a spiral for an eye
//   whirl = phase (radians): his ear spun out flat over his head like a helicopter blade, a blur ring round it
//   shield = 0 … 1 size of Linus's security blanket, hugged up to his cheek and hanging down in front of him · wear = 0 … 1 how
//            worn: holes tear through it and it fades · flap = phase of its hem rippling · shatter = 0 … 1 torn to scraps, fluttering off
//   pow = [text, x, y, t 0 … 1, colour] a comic sound word (SMAK!, WOOF!) popping up at x, y (px from bottom-centre, like hitboxes)
//         and drifting up · heart = [x, y, t 0 … 1] a little heart floating up off x, y and fading
//   earTrail = [from, to, t 0 … 1] the smear of an ear whip, ear angles from … to, fading · pow[5] = its font size (default 20)
// and for his specials and smashes:
//   ace = 0 … 1 the World War I Flying Ace's gear popping on: leather helmet, goggles up on his brow, a red scarf (scarf = phase of
//         its tails flapping out behind)
//   piano = [size 0 … 1, key phase] Schroeder's toy piano in front of him, his paws on its keys · notes = [phase, spent 0 … 1,
//           on 0 … 1] music notes streaming out ahead off it, shorter as it's spent
//   birds = [size 0 … 1, flap phase, scatter 0 … 1 or null] Woodstock and two friends flapping overhead, holding his ear up (at
//           birdY px above his feet, default -104); scattered, they fly off every way, feathers drifting · burst = 0 … 1 notes
//           bursting out in a ring over his head (the happy dance)
//   ball = [x, y, tilt, size, over] Lucy's football standing on its end, x, y = its bottom (px from his feet, like hitboxes), tilt from
//          upright, over = drawn over him (else under his paw)
//   typewriter = [size 0 … 1, key phase, ding 0 … 1 or null] his typewriter on the floor in front of him, a page in it · pages = 0 … 1
//           typed pages sliding out along the floor both ways, fading ("It was a dark and stormy night…")
const SNOOPY = '#fdfcf7', SNOOPY_EAR = '#1d1a18', SNOOPY_COLLAR = '#d8343a', BLANKET = '#8cc4ea', BLANKET_DARK = '#5b9dcc';

// his head, facing right, about the neck (0, 0 = where it meets the body), traced from Schulz: two lobes, a long muzzle with a flat top
// and a tall rounded front, and a big round cranium at the back rising well above it, a shallow saddle between them; underneath, a
// long gentle line back from the muzzle to a little jowl and the throat. [x, y] points round it from the back of the neck, smoothed
// through (Catmull-Rom). open = leave off the neck (stroking: the head sits on it)
const SNOOPY_HEAD = [[-4.5, -1.5], [-13, -4.7], [-17.4, -8.7], [-20.4, -14], [-21, -19.3], [-20.1, -28.2], [-17.4, -33.6], [-13, -37.1],
  [-5.9, -38.2], [-1.6, -37.4], [1.8, -35.4], [4.8, -32.7], [8.3, -30.6], [12, -30.3], [18.1, -30], [23.5, -28.8], [27.6, -25],
  [29.9, -19.5], [30.1, -14], [29.2, -9.8], [26.4, -7.9], [22.6, -6.6], [17, -5.8], [13.2, -5], [9.2, -3.6], [5.2, 0.2]];
function snoopyHeadPath(open, P = SNOOPY_HEAD) { // a smooth closed curve through P (his head by default)
  const at = i => P[Math.max(0, Math.min(P.length - 1, i))];
  ctx.beginPath(); ctx.moveTo(...P[0]);
  for (let i = 0; i < P.length - 1; i++) {
    const [a, b, c, d] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    ctx.bezierCurveTo(b[0] + (c[0] - a[0]) / 6, b[1] + (c[1] - a[1]) / 6, c[0] - (d[0] - b[0]) / 6, c[1] - (d[1] - b[1]) / 6, c[0], c[1]);
  }
  if (!open) ctx.closePath();
}
// an ear from its root high on the back of his head (the origin), turned a (0 = straight down, + = back): a fat oval hanging in the
// lower back of his head, the white of his dome showing above it.
// l stretches it along its length (negative flips it: a helicopter blade seen edge-on)
function snoopyEar(a, l = 1) {
  ctx.save(); ctx.rotate(a); ctx.scale(1, l); ctx.fillStyle = SNOOPY_EAR; ctx.strokeStyle = INK;
  // flung away from hanging it lifts off his head from the root: the whole ear stretches back up to meet it
  const lift = l !== 1 ? 1 : Math.min(1, Math.max(0, Math.abs(Math.sin((a - 0.4) / 2)) * 4 - 0.15));
  // Schulz's ear: a black oval inset in its own outline, a thin rim of white between
  const egg = (k, dx = 0) => { // narrow at the top, full low down; k scales it about its middle
    ctx.save(); ctx.translate(dx, 19 - 2.6 * lift); ctx.scale(k, k * (1 + 0.2 * lift)); ctx.beginPath(); ctx.moveTo(0, -14);
    ctx.bezierCurveTo(5.5, -14, 8.8, -6, 8.7, 1.5); ctx.bezierCurveTo(8.6, 8.5, 4.6, 12.5, 0, 12.5); ctx.bezierCurveTo(-4.6, 12.5, -8.6, 8.5, -8.7, 1.5); ctx.bezierCurveTo(-8.8, -6, -5.5, -14, 0, -14);
    ctx.restore();
  };
  ctx.fillStyle = SNOOPY; egg(1); ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = SNOOPY_EAR; egg(0.8, 0.4); ctx.fill();
  ctx.strokeStyle = 'rgba(255,255,255,0.45)'; ctx.lineWidth = 1; // a few white streaks in it
  for (const [x0, y0, x1, y1] of [[2.5, 13, 3.4, 20], [4, 16, 4.2, 22], [0.5, 15, 1, 19]]) { ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
  ctx.restore();
}
// a white limb from x0, y0 to x1, y1, r thick, round at both ends (arms, legs)
function snoopyLimb(x0, y0, x1, y1, r, lw = 1.9) {
  const a = Math.atan2(y1 - y0, x1 - x0), l = Math.hypot(x1 - x0, y1 - y0);
  ctx.save(); ctx.translate(x0, y0); ctx.rotate(a);
  ctx.beginPath(); ctx.arc(0, 0, r, Math.PI / 2, Math.PI * 1.5); ctx.arc(l, 0, r, -Math.PI / 2, Math.PI / 2); ctx.closePath();
  ctx.fillStyle = SNOOPY; ctx.fill(); ctx.lineWidth = lw; ctx.stroke();
  ctx.restore();
}

function drawSnoopy(cx, bottom, pose = {}, face = 1) {
  const ball = () => { const [bx, by, tilt, k] = pose.ball; snoopyFootball(cx + ((pose.x || 0) + bx) * face, bottom + by, tilt * face, k); };
  if (pose.ball && !pose.ball[4]) ball(); // under his paw
  ctx.save();
  ctx.translate(cx + (pose.x || 0) * face, bottom + (pose.y || 0)); ctx.scale(face * (pose.sx ?? 1), pose.sy ?? 1);
  ctx.translate(0, -38); ctx.rotate(pose.rot || 0); ctx.translate(0, 38); // origin back at the feet
  ctx.strokeStyle = INK; ctx.lineCap = ctx.lineJoin = 'round';

  const both = v => Array.isArray(v) ? v : [v || 0, v || 0];
  const arm = both(pose.arm), swing = both(pose.swing), reach = Array.isArray(pose.reach) ? pose.reach : [0, pose.reach || 0];
  const ears = both(pose.ears), feet = [pose.legs?.[0] || [0, 0], pose.legs?.[3] || [0, 0]];
  // an arm: long and thin, from the shoulder, hanging close by his side, swinging about it; reaching swings it out toward level and
  // stretches it, a round little paw on the end
  const drawArm = i => {
    const s = i ? 1 : -1, r = reach[i], t = Math.min(1, Math.abs(r) / 14), len = 14 + 0.62 * Math.abs(r);
    let dx = s * 0.14 * (1 - t) + Math.sign(r) * t, dy = 1 - 1.02 * t; const d = Math.hypot(dx, dy); dx /= d; dy /= d;
    ctx.save(); ctx.translate(i ? -1.5 : -4.5, -34 + arm[i]); ctx.rotate(-swing[i]);
    snoopyLimb(0, 0, dx * len, dy * len, 2.3);
    ctx.fillStyle = SNOOPY; ctx.beginPath(); ctx.ellipse(dx * (len + 0.5), dy * (len + 0.5), 3, 2.7, Math.atan2(dy, dx), 0, 6.28); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke(); // paw
    ctx.restore();
  };
  // a leg: a short stub down from the hip to a long flat foot, toes forward (a couple of toe lines on its front)
  const drawLeg = i => {
    const hx = i ? 4 : -4, [fx, fy] = feet[i], ax = hx + fx, ay = -3.5 + fy, fcx = ax + (i ? 4 : 1);
    if (fy < -1.5 || Math.abs(fx) > 3) snoopyLimb(hx, -9, ax, ay, 3);
    ctx.fillStyle = SNOOPY; ctx.beginPath(); ctx.ellipse(fcx + j(0.3), ay + 0.3, 9, 3.4, 0, 0, 6.28); ctx.fill();
    ctx.lineWidth = 1.9; ellipse(fcx, ay + 0.3, 9, 3.4, 0.25);
    ctx.lineWidth = 1.2; for (const tx of [4.5, 6.8]) line(fcx + tx, ay + 3.2, fcx + tx - 0.8, ay + 0.8, 0.15, 1);
  };

  const neck = [0, -41], nod = pose.nod || 0, headAt = () => { ctx.translate(...neck); ctx.rotate(nod); ctx.scale(1.08, 1.08); }; // (his head: a size up on the body, like Schulz's)
  const whirl = pose.whirl != null;
  if (pose.ace > 0.02) snoopyScarf(pose.ace, pose.scarf || 0, false); // its tails, streaming out behind
  drawArm(0); // the back arm, behind the body
  ctx.save(); ctx.translate(-9, -11); ctx.rotate(-(pose.wag || 0)); // tail: a small tapering flick off his rump
  ctx.fillStyle = SNOOPY; ctx.beginPath(); ctx.moveTo(0, -2.5); ctx.quadraticCurveTo(-6, -2, -11, 3.5); ctx.quadraticCurveTo(-5, 1.8, 0, 2.5); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
  ctx.restore();
  drawLeg(0);
  // body: slim from the neck, filling out to a round belly
  const body = () => { ctx.beginPath(); ctx.moveTo(-5.5, -42);
    ctx.bezierCurveTo(-7.5, -32, -11.5, -22, -10.5, -13); ctx.bezierCurveTo(-9.5, -6, -4, -5, 2, -5);
    ctx.bezierCurveTo(9, -5, 12, -9, 11, -16); ctx.bezierCurveTo(10, -25, 5.5, -32, 3.5, -42); };
  ctx.fillStyle = SNOOPY; body(); ctx.fill(); ctx.lineWidth = 2.2; body(); ctx.stroke(); // (open at the neck: the head sits on it)
  drawLeg(1);
  ctx.lineWidth = 3.4; ctx.beginPath(); ctx.moveTo(-6.5, -39.5); ctx.quadraticCurveTo(-1, -38, 4.5, -40); ctx.stroke(); // collar: a thin dark band
  if (pose.ace > 0.02) snoopyScarf(pose.ace, pose.scarf || 0, true); // the knot at his neck
  if (pose.shield > 0.05) snoopyBlanket(pose.shield, pose.wear || 0, pose.flap || 0); // hugged up under his chin
  if (pose.piano) snoopyPiano(...pose.piano);
  if (pose.typewriter) snoopyTypewriter(...pose.typewriter);

  ctx.save(); headAt();
  ctx.fillStyle = SNOOPY; snoopyHeadPath(); ctx.fill(); ctx.lineWidth = 2.4; snoopyHeadPath(true); ctx.stroke();
  ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-8, -37.6); ctx.quadraticCurveTo(-9.5, -42, -5.5, -42.8); ctx.stroke(); // the tuft on top
  ctx.fillStyle = SNOOPY_EAR; ctx.beginPath(); ctx.ellipse(31, -10.5, 3.7, 3.2, -0.2, 0, 6.28); ctx.fill(); ctx.lineWidth = 1.5; ctx.stroke(); // nose: a ball on the lower front
  ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(30.6, -11.2, 1.9, Math.PI * 1.1, Math.PI * 1.6); ctx.stroke(); ctx.strokeStyle = INK;
  // the eye: a small upright dash, a line when blinking, a happy arc, squeezed shut, or a dizzy spiral
  ctx.lineWidth = 1.8;
  if (pose.dizzy) {
    ctx.lineWidth = 1.3; ctx.beginPath();
    for (let a = 0; a <= 4 * Math.PI; a += 0.4) { const r = 3.4 * a / (4 * Math.PI), q = a + pose.dizzy * 6.28; ctx.lineTo(6.7 + Math.cos(q) * r, -22.4 + Math.sin(q) * r); }
    ctx.stroke();
  } else if (pose.squint) { ctx.beginPath(); ctx.moveTo(4.8, -25.2); ctx.lineTo(8.2, -22.4); ctx.lineTo(4.8, -19.8); ctx.stroke(); }
  else if (pose.happy > 0.5) { ctx.beginPath(); ctx.arc(6.7, -21, 2.6, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
  else { ctx.fillStyle = INK; ctx.beginPath(); ctx.ellipse(6.7, -22.4, 1.25, Math.max(0.4, 2.9 * (1 - (pose.blink || 0))), 0, 0, 6.28); ctx.fill(); }
  // the mouth: a short smile up by his cheek, hooked at the end, or the jaw dropped open (dark, his tongue in the bottom of it)
  const open = pose.open || 0;
  if (open > 0.05) {
    const mouth = () => { ctx.beginPath(); ctx.moveTo(28.5, -9.5); ctx.quadraticCurveTo(18, -7.5, 5, -9.5); ctx.quadraticCurveTo(12, -5 + 14 * open, 26, -7 + 8 * open); ctx.quadraticCurveTo(30, -8, 28.5, -9.5); };
    ctx.fillStyle = '#4a1f22'; mouth(); ctx.fill();
    ctx.save(); mouth(); ctx.clip(); ctx.fillStyle = '#e8737a'; ctx.beginPath(); ctx.ellipse(18, -4.5 + 9.5 * open, 6, 4, -0.1, 0, 6.28); ctx.fill(); ctx.restore();
    ctx.lineWidth = 2; mouth(); ctx.stroke();
  } else {
    const h = pose.happy || 0; ctx.lineWidth = 1.7;
    ctx.beginPath(); ctx.moveTo(11.5, -6.4); ctx.quadraticCurveTo(5 + h, -5 - h, 1.2, -11.5); ctx.stroke(); // sweeping up and back to his cheek
    ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(1.2, -11.5); ctx.quadraticCurveTo(0.4, -12.8, 1.4, -13.8); ctx.stroke(); // the hook at the corner
  }
  if (pose.tongue > 0.05) { // stuck out past the front of the muzzle, a line down its middle
    const k = pose.tongue; ctx.fillStyle = '#e8737a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.ellipse(27.5 + 4 * k, -7.5 + 2 * k, 2.2 + 3.5 * k, 2.8, 0.35, 0, 6.28); ctx.fill(); ctx.stroke();
    line(26.5 + 2 * k, -8 + k, 30.5 + 5 * k, -6.5 + 2.2 * k, 0.2, 1);
  }
  if (pose.shades > 0.02) snoopyShades(pose.shades);
  if (pose.ace > 0.02) snoopyHelmet(pose.ace);
  if (pose.earTrail) { // the whip's smear: a fading fan over his head, from where the ears were to where they are
    const [a0, a1, t] = pose.earTrail; ctx.save(); ctx.translate(-7.5, -31); ctx.globalAlpha *= 0.18 * (1 - t) ** 1.5; ctx.fillStyle = INK;
    ctx.beginPath(); ctx.arc(0, 0, 28, a0 + Math.PI / 2, a1 + Math.PI / 2); ctx.arc(0, 0, 8, a1 + Math.PI / 2, a0 + Math.PI / 2, true); ctx.fill(); ctx.restore();
  }
  if (whirl) snoopyWhirl(pose.whirl);
  else { ctx.translate(-7.5, -31); snoopyEar(ears[1] * 0.92 + 0.4); } // the near ear, set in on the back of his head
  ctx.restore();

  drawArm(1); // the front arm, over the body
  if (pose.notes?.[2] > 0.02) snoopyNotes(...pose.notes); // over his paws
  ctx.restore();
  if (pose.ball?.[4]) ball(); // yanked up, over him
  const mx = cx + (pose.x || 0) * face, my = bottom + (pose.y || 0);
  if (pose.shatter != null) snoopyScraps(mx + 20 * face, my - 26, pose.shatter);
  if (pose.heart) snoopyHeart(mx + pose.heart[0] * face, my + pose.heart[1], pose.heart[2]);
  if (pose.pow) snoopyPow(mx + pose.pow[1] * face, my + pose.pow[2], pose.pow[0], pose.pow[3], pose.pow[4], pose.pow[5]);
  if (pose.birds) snoopyBirds(mx, my + (pose.birdY ?? -104) * (pose.sy ?? 1), face, ...pose.birds);
  if (pose.burst != null) snoopyBurst(mx, my - 118, pose.burst);
  if (pose.pages != null) snoopyPages(cx, bottom, pose.pages);
}

// his ear spun out flat over his head like a helicopter's blade (phase ph), in the head's frame: a faint blur disc round the crown
function snoopyWhirl(ph) {
  ctx.save(); ctx.translate(-5.5, -38);
  ctx.save(); ctx.globalAlpha *= 0.3; ctx.strokeStyle = INK; ctx.lineWidth = 1.4; ellipse(0, 0, 25, 4.5, 0.5); ctx.restore();
  snoopyEar(-Math.PI / 2, Math.cos(ph)); // one ear, whirling round: out ahead, edge-on, out behind
  ctx.fillStyle = SNOOPY; ctx.beginPath(); ctx.arc(0, 0, 2.6, 0, 6.28); ctx.fill(); // the hub: where they meet on the crown
  ctx.restore();
}

// Joe Cool's sunglasses over the eye, in the head's frame, k = 0 … 1 sliding down onto his nose from above his brow
function snoopyShades(k) {
  ctx.save(); ctx.translate(0, -10 * (1 - k)); ctx.globalAlpha *= Math.min(1, k * 3);
  ctx.strokeStyle = INK; ctx.lineWidth = 1.8; line(0.5, -22.5, -8, -24, 0.2, 1); // the arm, back to his ear
  ctx.fillStyle = '#1b1a1f'; ctx.beginPath(); ctx.roundRect(0.5, -26, 12.5, 7.5, 3); ctx.fill(); ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; line(3, -23.5, 6, -24.5, 0.1, 1); // glint
  ctx.restore();
}

// Linus's blanket in Snoopy's body frame, hugged up under his chin in both paws and draped down in front of him to the floor, the hem
// rippling (flap). k = size (pinched at the top, where he hugs it); worn (0 … 1), holes tear through it (they show him through) and it
// fades a little
const BLANKET_HOLES = [[0.3, 18, 20, 4.5], [0.55, -9, 25, 4], [0.8, 8, 11, 3.5]]; // wear at which each opens, and where
function snoopyBlanket(k, wear, ph) {
  ctx.save(); ctx.translate(13, -40); ctx.scale(1.2 * k, 1.12 * k); ctx.globalAlpha *= 1 - 0.12 * wear; ctx.lineJoin = 'round';
  const hem = x => 37 + 2.2 * Math.sin(ph + x * 0.18); // the bottom edge, rippling
  const cloth = () => {
    ctx.moveTo(-3, -1); ctx.bezierCurveTo(-12, 4, -19, 8, -21, 14); // left from the pinch, sagging
    ctx.bezierCurveTo(-22, 22, -20, 30, -20, hem(-20));
    for (let x = -20; x <= 30; x += 5) ctx.quadraticCurveTo(x + 2.5, hem(x + 2.5) + 2.5, x + 5, hem(x + 5));
    ctx.bezierCurveTo(31, 28, 32, 20, 30, 12); ctx.bezierCurveTo(26, 6, 14, 3, 3, -1); // up the right side and back to the pinch
    ctx.quadraticCurveTo(0, -3, -3, -1);
  };
  ctx.beginPath(); cloth();
  for (const [at, x, y, r] of BLANKET_HOLES) if (wear >= at) { ctx.moveTo(x + r, y); for (let i = 1; i <= 9; i++) { const a = i / 9 * 6.28, rr = r * (i % 2 ? 0.75 : 1.1); ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } }
  ctx.fillStyle = BLANKET; ctx.fill('evenodd'); ctx.strokeStyle = INK; ctx.lineWidth = 2.2; ctx.stroke();
  ctx.strokeStyle = BLANKET_DARK; ctx.lineWidth = 1.6; // folds, falling from the pinch
  for (const [x0, x1] of [[-4, -10], [2, 4], [7, 17]]) { ctx.beginPath(); ctx.moveTo(x0, 4); ctx.quadraticCurveTo((x0 + x1) / 2 + 2 * Math.sin(ph), 18, x1, hem(x1) - 5); ctx.stroke(); }
  ctx.restore();
}
// the blanket torn to scraps: blue rags thrown up and out, then fluttering down, turning, fading (t 0 … 1). Never mirrored
function snoopyScraps(x, y, t) {
  ctx.save(); ctx.globalAlpha *= 1 - t; ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.lineWidth = 1.4;
  for (let i = 0; i < 7; i++) {
    const a = -Math.PI / 2 + (i - 3) * 0.5, sp = 55 + 14 * (i % 3), fall = 40 * t * t;
    ctx.save(); ctx.translate(x + Math.cos(a) * sp * t + 8 * Math.sin(t * 9 + i), y + Math.sin(a) * sp * t + fall); ctx.rotate(Math.sin(t * 7 + i * 2) * 0.9 + i);
    ctx.fillStyle = i % 3 ? BLANKET : BLANKET_DARK; path([[-7, -4], [-1, -6], [7, -3], [5, 4], [-3, 5], [-8, 2]]); ctx.fill(); ctx.stroke();
    ctx.restore();
  }
  ctx.restore();
}

// a little red heart floating up off x, y as t goes 0 … 1, swaying, and fading. Never mirrored
function snoopyHeart(x, y, t) {
  const k = 5 * (t < 0.2 ? 1.3 * t / 0.2 : 1.3 - 0.3 * Math.min(1, (t - 0.2) / 0.2));
  ctx.save(); ctx.translate(x + 4 * Math.sin(t * 8), y - 22 * t); ctx.scale(k, k); ctx.globalAlpha *= Math.min(1, 3 * (1 - t));
  ctx.beginPath(); ctx.moveTo(0, 0.9); ctx.bezierCurveTo(-1.3, 0, -0.9, -1.1, 0, -0.4); ctx.bezierCurveTo(0.9, -1.1, 1.3, 0, 0, 0.9);
  ctx.fillStyle = SNOOPY_COLLAR; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 1.6 / k; ctx.stroke();
  ctx.restore();
}

// a comic sound word (SMAK!, WOOF!) in hand lettering at x, y: pops in big and tilted, settles, drifts up and fades. Never mirrored
function snoopyPow(x, y, text, t, col = INK, size = 20) {
  const k = t < 0.15 ? 1.35 * t / 0.15 : 1.35 - 0.35 * Math.min(1, (t - 0.15) / 0.15);
  ctx.save(); ctx.translate(x, y - 12 * t); ctx.rotate(-0.12); ctx.scale(k, k); ctx.globalAlpha *= Math.min(1, 3 * (1 - t));
  ctx.font = `700 ${size}px Caveat, cursive`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeText(text, 0, 0);
  ctx.fillStyle = col; ctx.fillText(text, 0, 0);
  ctx.restore();
}

// a paw print (his respawn pad's mark, the middle of his KO burst): a pad and four toes, r = the pad's size
function snoopyPaw(x, y, r = 6, col = SNOOPY_COLLAR) {
  ctx.save(); ctx.translate(x, y); ctx.fillStyle = col;
  ctx.beginPath(); ctx.ellipse(0, r * 0.35, r * 0.75, r * 0.6, 0, 0, 6.28); ctx.fill();
  for (const [tx, ty] of [[-0.85, -0.35], [-0.32, -0.8], [0.32, -0.8], [0.85, -0.35]]) { ctx.beginPath(); ctx.ellipse(tx * r, ty * r, r * 0.26, r * 0.32, tx * 0.4, 0, 6.28); ctx.fill(); }
  ctx.restore();
}

// his select screen logo, in a 28 x 28 box: his head on a collar-red disc
function snoopyLogo() {
  ctx.fillStyle = SNOOPY_COLLAR; ctx.beginPath(); ctx.arc(14, 14, 14, 0, 6.28); ctx.fill();
  ctx.save(); ctx.translate(10.2, 22.8); ctx.scale(0.42, 0.42); ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff'; snoopyHeadPath(); ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke();
  ctx.fillStyle = SNOOPY_EAR; ctx.beginPath(); ctx.ellipse(31, -10.5, 4.2, 3.7, -0.2, 0, 6.28); ctx.fill();
  ctx.beginPath(); ctx.ellipse(6.7, -22.4, 1.8, 3.6, 0, 0, 6.28); ctx.fill();
  ctx.translate(-7.5, -31); snoopyEar(0.4);
  ctx.restore();
}

// ---------- specials and smashes ----------

// Woodstock, after Schulz: facing right, about 17 tall with his feet at the origin. One yellow outline for a big round head, its
// beak a rounded bulge off the front split by a little smile, tucked onto a small teardrop body with a crease at the back of the
// neck; three black brush-stroke spikes of hair, a dash of an eye, pointy feathered wings (flap = phase), stick legs with toes.
// goggles = the Flying Ace's mechanic's
const WOODSTOCK = '#f7d23e';
const WOODSTOCK_BODY = [[-4.2, -8.6], [-5.6, -11.4], [-5, -14.6], [-2.6, -16.8], [0.8, -17.2], [3.8, -16], [5.4, -13.8], [7.4, -12.6],
  [9.2, -11.2], [8.9, -9.6], [6.8, -8.5], [3.8, -8.4], [3, -6.8], [3.2, -4.6], [1.8, -2.8], [-0.8, -2.3], [-3.4, -3], [-4.8, -5],
  [-5, -7.2], [-4.4, -8.4]];
function woodstockWing(x, y, r, far) { // a wing from its shoulder, swept back and turned up by r: a little arm ending in three feathers
  ctx.save(); ctx.translate(x, y); ctx.rotate(r); ctx.fillStyle = far ? '#dcb52c' : WOODSTOCK;
  ctx.beginPath(); ctx.moveTo(0, -1.4); ctx.quadraticCurveTo(-3, -2.4, -6.4, -2.7); ctx.lineTo(-7.8, -2.3); ctx.lineTo(-5.9, -0.9);
  ctx.lineTo(-7.8, -0.1); ctx.lineTo(-5.7, 0.6); ctx.lineTo(-6.8, 1.8); ctx.quadraticCurveTo(-3, 1.9, 0, 1.3); ctx.closePath();
  ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke(); ctx.restore();
}
function drawWoodstock(x, y, k = 1, flap = 0, face = 1, goggles = false) {
  ctx.save(); ctx.translate(x, y); ctx.scale(face * k, k); ctx.strokeStyle = INK; ctx.lineCap = ctx.lineJoin = 'round';
  const w = Math.sin(flap); // the wing: down … up
  woodstockWing(-2, -6.8, 0.1 + 0.8 * Math.sin(flap - 0.5), true); // far wing
  ctx.lineWidth = 1; for (const s of [-1, 1]) { const fx = s * 1.2; line(fx, -3, fx + 0.3, 0, 0.1, 1); line(fx + 0.3, 0, fx + 2, 0.4, 0.1, 1); line(fx + 0.3, 0, fx - 1.2, 0.5, 0.1, 1); } // legs and toes
  ctx.fillStyle = WOODSTOCK; path([[-4.6, -4.4], [-7.4, -4.7], [-5.9, -3.6], [-7, -2.6], [-3.8, -2.9]]); ctx.fill(); ctx.lineWidth = 1.1; ctx.stroke(); // tail feathers
  snoopyHeadPath(false, WOODSTOCK_BODY); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
  ctx.fillStyle = INK; // hair: three thin tapering black wisps off the crown, the middle one tallest, each with a little bend
  for (const [bx, tx, ty, bend] of [[-1.6, -5, -20.6, -1.4], [0.3, -0.2, -22.6, 1], [2, 4.2, -20.2, -1]]) {
    const mx = (bx + tx) / 2 + bend, my = (ty - 16.6) / 2;
    ctx.beginPath(); ctx.moveTo(bx - 0.6, -16.4); ctx.quadraticCurveTo(mx - 0.35, my, tx, ty); ctx.quadraticCurveTo(mx + 0.35, my, bx + 0.6, -16.6); ctx.fill();
  }
  ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(8.7, -10.4); ctx.quadraticCurveTo(7, -9.8, 5.6, -10.6); ctx.stroke(); // the beak's smile
  ctx.lineWidth = 1.5; line(3.4, -14.3, 3.2, -12.3, 0.1, 1); // eye
  if (goggles) { ctx.lineWidth = 1.4; line(1.4, -13.6, -5.2, -12.6, 0.1, 1); ctx.fillStyle = '#9ed2ea'; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.arc(3.4, -13.3, 2.3, 0, 6.28); ctx.fill(); ctx.stroke(); }
  woodstockWing(-1.6, -6.2, 0.1 + 0.8 * w, false); // near wing
  ctx.restore();
}

// Woodstock and two friends overhead at x, y (their feet), clutching his ear, flapping like mad (flap phase); size k pops them in.
// Scattering (0 … 1), they fly off every which way and a few feathers drift down. Never mirrored (they face his way)
function snoopyBirds(x, y, face, k, flap, scatter) {
  const flock = [[-14, 3, 1, 1.3], [0, -6, 1.15, 0], [14, 2, 1, 2.1]]; // [dx, dy, size, flap offset]: Woodstock in the middle
  flock.forEach(([dx, dy, s, o], i) => {
    let bx = x + dx * face, by = y + dy, a = 1;
    if (scatter != null) { const ang = -Math.PI / 2 + (i - 1) * 0.9; bx += Math.cos(ang) * 70 * scatter * face; by += Math.sin(ang) * 60 * scatter; a = 1 - scatter; }
    ctx.save(); ctx.globalAlpha *= a; drawWoodstock(bx, by, s * k, flap * 1.7 + o, face); ctx.restore();
  });
  if (scatter != null) { // feathers, drifting down
    ctx.save(); ctx.globalAlpha *= 1 - scatter; ctx.fillStyle = WOODSTOCK; ctx.strokeStyle = INK; ctx.lineWidth = 1;
    for (let i = 0; i < 4; i++) { ctx.save(); ctx.translate(x + (i - 1.5) * 12 + 5 * Math.sin(scatter * 8 + i), y + 20 * scatter + 6 * i); ctx.rotate(Math.sin(scatter * 6 + i) * 0.8); ctx.beginPath(); ctx.ellipse(0, 0, 4, 1.6, 0, 0, 6.28); ctx.fill(); ctx.stroke(); ctx.restore(); }
    ctx.restore();
  } else { // flap lines round the middle one
    ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = 1.2; ctx.globalAlpha *= 0.5;
    for (const s of [-1, 1]) { const px = x + s * 22, py = y - 16 + 3 * Math.sin(flap * 1.7); line(px, py, px + s * 5, py - 4, 0.2, 1); line(px + s * 1, py + 5, px + s * 6, py + 3, 0.2, 1); }
    ctx.restore();
  }
}

// the Flying Ace's leather helmet, in the head's frame (k pops it on): a brown cap over his dome, goggles pushed up on the front of it
function snoopyHelmet(k) {
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 2); ctx.translate(0, -8 * (1 - k)); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.fillStyle = '#8a5a34'; ctx.beginPath(); ctx.moveTo(-21.8, -23);
  ctx.bezierCurveTo(-21.5, -34, -13, -40, -5.5, -39.8); ctx.bezierCurveTo(2, -39.6, 8, -35, 10, -30.5); ctx.quadraticCurveTo(-6, -29, -21.8, -23); ctx.closePath();
  ctx.fill(); ctx.lineWidth = 2; ctx.stroke();
  ctx.strokeStyle = '#5e3a1f'; ctx.lineWidth = 1.1; line(-15, -35, -10, -29, 0.2, 1); line(-6, -38.5, -2, -30.5, 0.2, 1); // seams
  ctx.strokeStyle = INK; ctx.lineWidth = 2.4; line(-19, -26, 6, -31.5, 0.2, 1); // goggle strap
  for (const [gx, gy] of [[1.5, -33], [7.5, -33.2]]) { ctx.fillStyle = '#b9dff0'; ctx.beginPath(); ctx.arc(gx, gy, 3.6, 0, 6.28); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke(); }
  ctx.restore();
}
// the Flying Ace's red scarf in his body frame: knotted at his neck (knot), its two tails streaming out behind, flapping (ph)
function snoopyScarf(k, ph, knot) {
  ctx.save(); ctx.globalAlpha *= Math.min(1, k * 2); ctx.strokeStyle = INK; ctx.lineJoin = 'round'; ctx.fillStyle = SNOOPY_COLLAR;
  if (knot) { ctx.beginPath(); ctx.ellipse(-1, -39, 7.5, 3, -0.05, 0, 6.28); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke(); ctx.restore(); return; }
  for (const [dy, l, o] of [[0, 26, 0], [4, 20, 1.3]]) {
    const w = t => 3 * Math.sin(ph * 0.5 + o + t * 3);
    ctx.beginPath(); ctx.moveTo(-4, -40 + dy);
    ctx.quadraticCurveTo(-4 - l * 0.5, -40 + dy + w(0.5) - 2, -4 - l * k, -41 + dy + w(1)); ctx.lineTo(-4 - l * k, -36 + dy + w(1));
    ctx.quadraticCurveTo(-4 - l * 0.5, -36 + dy + w(0.5), -4, -35.5 + dy); ctx.closePath(); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
  }
  ctx.restore();
}

// a music note, s tall, at x, y (the bottom of its head): an eighth note (one flag) or, beamed, a pair
function snoopyNote(x, y, s, pair) {
  const k = s / 14; ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.fillStyle = INK; ctx.strokeStyle = INK; ctx.lineWidth = 1.6; ctx.lineCap = 'round';
  const head = hx => { ctx.beginPath(); ctx.ellipse(hx, -2, 3, 2.2, -0.4, 0, 6.28); ctx.fill(); ctx.beginPath(); ctx.moveTo(hx + 2.7, -2.5); ctx.lineTo(hx + 2.7, -14); ctx.stroke(); };
  head(0);
  if (pair) { head(8); ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(2.7, -14); ctx.lineTo(10.7, -15.5); ctx.stroke(); }
  else { ctx.beginPath(); ctx.moveTo(2.7, -14); ctx.quadraticCurveTo(7, -11, 6, -6); ctx.stroke(); }
  ctx.restore();
}
// Schroeder's toy piano in his body frame, in front of him (size k pops it in from its middle): a little black grand on three thin
// legs, its white keys toward him, his paws coming down on them (ph)
function snoopyPiano(k, ph) {
  if (k < 0.02) return;
  ctx.save(); ctx.translate(30, -14); ctx.scale(k, k); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.lineWidth = 1.8; for (const lx of [-11, 3, 11]) line(lx, 2, lx, 14, 0.2, 1); // legs
  ctx.fillStyle = '#26221f'; ctx.beginPath(); ctx.moveTo(-14, -9); ctx.lineTo(8, -9); ctx.bezierCurveTo(16, -9, 17, 3, 12, 3); ctx.lineTo(-14, 3); ctx.closePath(); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); // body
  ctx.beginPath(); ctx.moveTo(-10, -9); ctx.lineTo(12, -19); ctx.stroke(); // the lid, propped open
  ctx.fillStyle = '#fff'; ctx.fillRect(-16, -11, 9, 4); ctx.strokeRect(-16, -11, 9, 4); // keys
  ctx.fillStyle = INK; for (let i = 0; i < 3; i++) ctx.fillRect(-15 + i * 3, -11, 1.2, 2.2);
  ctx.restore();
}
// the notes streaming ahead off the piano, in his body frame: eighth notes and beamed pairs bobbing out on a wave and fading (each
// out and gone in 16 frames, so a held loop is seamless), a flourish of staff lines under them. spent shortens it, on fades it
function snoopyNotes(ph, spent, on) {
  const L = 70 * (1 - 0.45 * spent), x0 = 40, y0 = -32;
  ctx.save(); ctx.globalAlpha *= on; ctx.strokeStyle = INK;
  ctx.save(); ctx.globalAlpha *= 0.25; ctx.lineWidth = 1; // a wisp of staff, rippling out ahead
  for (let i = 0; i < 3; i++) { ctx.beginPath(); for (let u = 0; u <= 1.001; u += 0.1) { const x = x0 + u * L, y = y0 - 6 + i * 4 + 5 * Math.sin(u * 5 - ph * 0.4) * u; u ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); }
  ctx.restore();
  for (let n = 0; n < 7; n++) {
    const u = (ph / 16 + n / 7) % 1, x = x0 + 4 + u * L, y = y0 + 4 + 9 * Math.sin(u * 6 + n * 2.1) * u;
    ctx.save(); ctx.globalAlpha *= Math.min(1, u * 6, (1 - u) * 2.5); snoopyNote(x, y, 11 + 6 * Math.min(1, u * 3), n % 3 === 1); ctx.restore();
  }
  ctx.restore();
}
// the happy dance's burst of notes, over his head at x, y: popping out all round and floating off, fading. Never mirrored
function snoopyBurst(x, y, t) {
  const e = 1 - (1 - Math.min(1, t * 2.2)) ** 3;
  ctx.save(); ctx.globalAlpha *= Math.min(1, 3 * (1 - t));
  for (let i = 0; i < 8; i++) {
    const a = -Math.PI / 2 + (i - 3.5) * 0.42, r = 18 + 46 * e;
    snoopyNote(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.8 - 10 * t, 11 + 4 * (i % 2), i % 3 === 0);
  }
  ctx.strokeStyle = INK; ctx.lineWidth = 1.6; // joy lines
  for (let i = 0; i < 6; i++) { const a = -Math.PI / 2 + (i - 2.5) * 0.5, r0 = 10 + 20 * e; line(x + Math.cos(a) * r0, y + 30 + Math.sin(a) * r0, x + Math.cos(a) * (r0 + 8), y + 30 + Math.sin(a) * (r0 + 8), 0.3, 1); }
  ctx.restore();
}

// the Sopwith Camel (his doghouse) in flight, a projectile (drawSpark's arguments + the shot): the red doghouse end on, its black
// arched door, a propeller whirring on its nose, Woodstock in goggles riding on the ridge, puffs of exhaust behind it
function drawSopwith(x, y, r = 12, spin = 0, sh = null) {
  const d = Math.sign(sh?.vx ?? 1) || 1, k = r / 9.5, t = (sh?.t ?? 0) * 60;
  ctx.save(); ctx.translate(x, y); ctx.scale(k, k); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.save(); ctx.globalAlpha *= 0.5; ctx.fillStyle = '#cfc8bb'; for (let i = 0; i < 3; i++) { const u = ((t / 12) + i / 3) % 1; ctx.beginPath(); ctx.arc(-d * (16 + 26 * u), 4 - 4 * u, 3 + 4 * u, 0, 6.28); ctx.globalAlpha *= 1 - u * 0.5; ctx.fill(); } ctx.restore(); // exhaust
  ctx.rotate(d * (0.06 * Math.sin(t / 7) - 0.05)); // a wobble as it flies
  ctx.fillStyle = '#c8322c'; ctx.beginPath(); ctx.rect(-11, -6, 22, 14); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); // the end wall
  ctx.fillStyle = '#9b2320'; path([[-14, -5], [0, -16], [14, -5]]); ctx.fill(); ctx.stroke(); // the roof
  ctx.fillStyle = INK; ctx.beginPath(); ctx.moveTo(-4, 8); ctx.lineTo(-4, 1); ctx.arc(0, 1, 4, Math.PI, 0); ctx.lineTo(4, 8); ctx.fill(); // the door
  ctx.save(); ctx.translate(d * 13, 1); ctx.fillStyle = '#7a5230'; ctx.beginPath(); ctx.arc(0, 0, 2, 0, 6.28); ctx.fill(); ctx.stroke(); // the propeller hub
  ctx.globalAlpha *= 0.45; ctx.fillStyle = '#b5ab9a'; ctx.beginPath(); ctx.ellipse(d * 1.5, 0, 2, 11, 0, 0, 6.28); ctx.fill(); ctx.restore(); // its blur
  ctx.lineWidth = 1.6; line(d * 13.5, 1 + 10 * Math.sin(t * 1.3), d * 13.5, 1 - 10 * Math.sin(t * 1.3), 0.2, 1); // a blade
  drawWoodstock(0, -14, 0.7, t * 0.5, d, true); // the pilot
  ctx.fillStyle = SNOOPY_COLLAR; ctx.beginPath(); ctx.moveTo(-d * 2, -20); ctx.quadraticCurveTo(-d * 8, -22 + 2 * Math.sin(t / 3), -d * 13, -20 + 2 * Math.sin(t / 3 + 1)); ctx.lineTo(-d * 12, -18); ctx.quadraticCurveTo(-d * 7, -19, -d * 2, -18); ctx.fill(); // his scarf
  ctx.restore();
}
// where the Sopwith Camel hits: a burst of black flak puffs and a BANG!, fading (t 0 … 1). Never mirrored
function snoopyFlak(x, y, t) {
  ctx.save(); ctx.globalAlpha *= Math.min(1, 3 * (1 - t)); ctx.strokeStyle = INK; ctx.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) { const a = i * 1.26 + 0.4, r = 6 + 16 * t; ctx.fillStyle = i % 2 ? '#3a3431' : '#5c5450'; ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r - 10 * t, 6 + 5 * t, 0, 6.28); ctx.fill(); ctx.stroke(); }
  ctx.restore();
  snoopyPow(x, y - 30, 'BANG!', t);
}

// Lucy's football in his body frame, standing on its end with its bottom at x, y, tilted from upright, k = size: brown, white laces
function snoopyFootball(x, y, tilt, k) {
  if (k < 0.02) return;
  ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(k, k); ctx.strokeStyle = INK;
  ctx.fillStyle = '#8b4f2a'; ctx.beginPath(); ctx.ellipse(0, -9, 5.5, 9, 0, 0, 6.28); ctx.fill(); ctx.lineWidth = 1.8; ctx.stroke();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.2; line(1.5, -14, 1.5, -4, 0.1, 1); for (let i = 0; i < 4; i++) line(0, -12.5 + i * 2.5, 3, -12.5 + i * 2.5, 0.1, 1); // laces
  ctx.restore();
}
// AAUGH!, stuck on whoever swung at him while he held the ball (a sticker: x, y where, rot its tilt, a fading): Charlie Brown's yell
// as the ball's pulled away. Never mirrored
function drawAaugh(x, y, rot, a) {
  ctx.save(); ctx.globalAlpha *= a; ctx.translate(x + Math.sin(a * 40) * 1.5, y - 48); ctx.rotate(-0.08 + rot * 0.2);
  ctx.font = '700 24px Caveat, cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.strokeText('AAUGH!', 0, 0); ctx.fillStyle = INK; ctx.fillText('AAUGH!', 0, 0);
  ctx.restore();
}

// his typewriter on the floor in front of him, in his body frame (size k): a grey machine, its keys, a page standing in the roller
// with a few typed lines on it (more the longer he types: ph), the carriage bell ringing (ding 0 … 1)
function snoopyTypewriter(k, ph, ding) {
  if (k < 0.02) return;
  ctx.save(); ctx.translate(28, 0); ctx.scale(k, k); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.rect(-8, -30, 18, 16); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke(); // the page
  ctx.strokeStyle = '#8d857a'; ctx.lineWidth = 1; for (let i = 0; i < Math.min(4, 1 + Math.floor(ph / 3)); i++) line(-6, -27 + i * 3, 4 - (i % 2) * 4, -27 + i * 3, 0.1, 1);
  ctx.strokeStyle = INK;
  ctx.fillStyle = '#6d6a66'; path([[-15, 0], [15, 0], [12, -12], [-12, -12]]); ctx.fill(); ctx.lineWidth = 2; ctx.stroke(); // the body
  ctx.fillStyle = '#4c4946'; ctx.beginPath(); ctx.roundRect(-13, -16, 26, 5, 2.5); ctx.fill(); ctx.stroke(); // the roller
  ctx.fillStyle = '#fff'; for (let r = 0; r < 2; r++) for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.arc(-8 + i * 4 + r * 2, -7 + r * 3.5, 1.3, 0, 6.28); ctx.fill(); } // keys
  line(13, -14, 19, -18, 0.2, 1); // the carriage lever
  if (ding != null && ding < 1) { ctx.save(); ctx.globalAlpha *= 1 - ding; ctx.lineWidth = 1.4; for (let i = 0; i < 3; i++) { const a = -2.2 + i * 0.5, r = 6 + 8 * ding; line(20 + Math.cos(a) * r, -20 + Math.sin(a) * r, 20 + Math.cos(a) * (r + 4), -20 + Math.sin(a) * (r + 4), 0.2, 1); } ctx.restore(); }
  ctx.restore();
}
// his typed pages sliding out along the floor both ways from cx and fading (t 0 … 1), the top one reading "It was a dark and stormy
// night…". Never mirrored, so it reads
function snoopyPages(cx, floor, t) {
  ctx.save(); ctx.globalAlpha *= Math.min(1, 3 * (1 - t)); ctx.strokeStyle = INK; ctx.lineJoin = 'round';
  for (const d of [-1, 1]) for (let i = 2; i >= 0; i--) {
    const x = cx + d * (30 + (70 + 22 * i) * (1 - (1 - t) ** 2)), y = floor - 9 - i * 2;
    ctx.save(); ctx.translate(x, y); ctx.rotate(d * (0.08 + 0.1 * i) - 0.05);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.rect(-17, -9, 34, 18); ctx.fill(); ctx.lineWidth = 1.6; ctx.stroke();
    if (i === 0) { ctx.fillStyle = INK; ctx.font = '700 4.6px ui-monospace, Menlo, monospace'; ctx.textAlign = 'left'; ctx.fillText('It was a dark', -15, -3.5); ctx.fillText('and stormy', -15, 1.5); ctx.fillText('night...', -15, 6.5); }
    else { ctx.strokeStyle = '#8d857a'; ctx.lineWidth = 1; for (let l = 0; l < 3; l++) line(-14, -4 + l * 4, 10 - l * 5, -4 + l * 4, 0.1, 1); ctx.strokeStyle = INK; }
    ctx.restore();
    ctx.lineWidth = 1.3; line(x - d * 22, y - 3, x - d * 32, y - 3, 0.3, 1); // a speed dash behind it
  }
  ctx.restore();
}
