/* SpongeBob & Patrick dancing — hand-drawn on canvas, no assets. */
(() => {
  const canvas = document.getElementById('dance');
  if (!canvas) return;
  const g = canvas.getContext('2d');

  let W = 0, H = 0;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const INK = '#1a1224';

  /* ---------- drawing primitives ---------- */

  function rr(x, y, w, h, r) {
    g.beginPath();
    g.roundRect(x, y, w, h, r);
  }

  function outline(fill, lw = 4) {
    g.fillStyle = fill;
    g.fill();
    g.lineWidth = lw;
    g.strokeStyle = INK;
    g.stroke();
  }

  function ellipse(cx, cy, rx, ry, rot = 0) {
    g.beginPath();
    g.ellipse(cx, cy, rx, ry, rot, 0, Math.PI * 2);
  }

  function line(pts, color, width) {
    g.beginPath();
    g.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.strokeStyle = INK;
    g.lineWidth = width + 6;
    g.stroke();
    g.strokeStyle = color;
    g.lineWidth = width;
    g.stroke();
  }

  function starPath(cx, cy, outer, inner, topR) {
    const pts = [];
    const off = -Math.PI / 2;
    for (let i = 0; i < 10; i++) {
      const a = off + i * Math.PI / 5;
      const r = i % 2 ? inner : (i === 0 && topR ? topR : outer);
      pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
    }
    const n = pts.length, radius = 30;
    g.beginPath();
    for (let i = 0; i < n; i++) {
      const p = pts[i], pv = pts[(i + n - 1) % n], nx = pts[(i + 1) % n];
      const l1 = Math.hypot(pv[0] - p[0], pv[1] - p[1]);
      const l2 = Math.hypot(nx[0] - p[0], nx[1] - p[1]);
      const rad = i === 0 ? 46 : radius;
      const d1 = Math.min(rad, l1 * 0.45), d2 = Math.min(rad, l2 * 0.45);
      const a = [p[0] + (pv[0] - p[0]) / l1 * d1, p[1] + (pv[1] - p[1]) / l1 * d1];
      const b = [p[0] + (nx[0] - p[0]) / l2 * d2, p[1] + (nx[1] - p[1]) / l2 * d2];
      if (i === 0) g.moveTo(a[0], a[1]); else g.lineTo(a[0], a[1]);
      g.quadraticCurveTo(p[0], p[1], b[0], b[1]);
    }
    g.closePath();
  }

  // 0..1 eye openness, blinking every few seconds
  function openness(t, seed) {
    const period = 4.2, p = (t + seed) % period;
    if (p > 0.18) return 1;
    return Math.max(0.06, Math.abs(Math.cos(p / 0.18 * Math.PI)));
  }

  /* ---------- SpongeBob ---------- */

  const HOLES = [
    [-57, -277, 9, 7, 0.4], [-62, -166, 10, 7, -0.3], [-50, -252, 6, 5, 1.1],
    [58, -270, 8, 6, -0.5], [64, -196, 9, 7, 0.3], [43, -152, 7, 5, 0.7],
    [-30, -140, 6, 5, 0.2]
  ];

  function drawSponge(t) {
    const beat = t * 2.4;
    const bob = Math.abs(Math.sin(beat)) * 8;
    const squash = 1 + Math.sin(beat * 2) * 0.035;
    const tilt = Math.sin(beat) * 0.045;

    g.save();
    g.rotate(tilt);
    g.translate(0, -bob);
    g.scale(1 / squash, squash);

    // legs (kick alternately)
    const kickL = Math.max(0, Math.sin(beat)) * 9;
    const kickR = Math.max(0, Math.sin(beat + Math.PI)) * 9;
    for (const [lx, kick] of [[-26, kickL], [26, kickR]]) {
      line([[lx, -78], [lx, -26 + kick]], '#fdf7e2', 15);
      // sock stripes
      g.lineWidth = 5;
      g.strokeStyle = '#c9524b';
      g.beginPath(); g.moveTo(lx - 8, -42 + kick); g.lineTo(lx + 8, -42 + kick); g.stroke();
      g.strokeStyle = '#4a72a8';
      g.beginPath(); g.moveTo(lx - 8, -34 + kick); g.lineTo(lx + 8, -34 + kick); g.stroke();
      // shoe
      rr(lx - 20, -22 + kick, 40, 21, 9);
      outline('#161018', 4);
    }

    // arms (behind the body)
    const wave = Math.sin(beat * 2);
    const armL = [[-68, -112], [-104, -150 + wave * 8], [-110 + wave * 14, -204 + wave * 12]];
    const armR = [[68, -112], [104, -144 - wave * 8], [114 - wave * 14, -192 - wave * 12]];
    for (const arm of [armL, armR]) {
      line(arm, '#f2dc4b', 11);
      ellipse(arm[2][0], arm[2][1], 10, 10);
      outline('#f2dc4b', 4);
    }

    // sponge body
    rr(-76, -292, 152, 176, 26);
    const grad = g.createLinearGradient(0, -292, 0, -116);
    grad.addColorStop(0, '#f8e768');
    grad.addColorStop(1, '#e6cd3e');
    outline(grad, 4.5);
    g.save();
    rr(-76, -292, 152, 176, 26); g.clip();
    for (const [hx, hy, rx, ry, rot] of HOLES) {
      ellipse(hx, hy, rx, ry, rot);
      g.fillStyle = 'rgba(196,168,40,0.75)';
      g.fill();
      g.lineWidth = 2;
      g.strokeStyle = 'rgba(150,124,20,0.7)';
      g.stroke();
    }
    // spongy dimples
    g.fillStyle = 'rgba(255,255,255,0.28)';
    for (const [hx, hy] of [[-20, -286], [30, -286], [-70, -220], [66, -232], [-8, -130], [22, -186], [-56, -196]]) {
      ellipse(hx, hy, 4, 3); g.fill();
    }
    g.restore();

    // shirt + pants
    rr(-76, -126, 152, 42, 6);
    outline('#f4f2ee', 4);
    rr(-76, -90, 152, 30, 6);
    outline('#9d6b3a', 4);
    // belt line
    g.strokeStyle = INK; g.lineWidth = 2.5;
    g.beginPath(); g.moveTo(-76, -90); g.lineTo(76, -90); g.stroke();
    // collar
    g.beginPath();
    g.moveTo(-26, -126); g.lineTo(0, -104); g.lineTo(26, -126);
    g.closePath(); outline('#e6e3dc', 3.5);
    // tie
    g.beginPath();
    g.moveTo(0, -120); g.lineTo(11, -106); g.lineTo(0, -82); g.lineTo(-11, -106);
    g.closePath(); outline('#c9433f', 3.5);

    // face
    const open = openness(t, 0.6);
    for (const ex of [-32, 32]) {
      ellipse(ex, -252, 25, 27 * open + 1.5);
      outline('#ffffff', 4);
      if (open > 0.35) {
        ellipse(ex, -250, 13, 13 * open);
        g.fillStyle = '#3f93cf'; g.fill();
        ellipse(ex, -250, 7, 7 * open);
        g.fillStyle = '#161018'; g.fill();
        ellipse(ex - 4, -255, 3.5, 3.5 * open);
        g.fillStyle = '#fff'; g.fill();
      }
      // eyelashes
      g.strokeStyle = INK; g.lineWidth = 3; g.lineCap = 'round';
      for (const [dx, dy, ex2, ey2] of [[-14, -1, -20, -9], [0, -1, 0, -11], [14, -1, 20, -9]]) {
        g.beginPath();
        g.moveTo(ex + dx, -252 - 27 * open + dy);
        g.lineTo(ex + ex2, -252 - 27 * open + ey2);
        g.stroke();
      }
    }

    // nose
    g.beginPath();
    g.moveTo(-14, -226); g.quadraticCurveTo(0, -194, 14, -226);
    g.quadraticCurveTo(0, -212, -14, -226);
    outline('#f8e45e', 4.5);

    // freckles
    g.fillStyle = '#b99a2b';
    for (const [fx, fy] of [[-58, -216], [-49, -226], [-52, -205], [58, -216], [49, -226], [52, -205]]) {
      ellipse(fx, fy, 3, 3); g.fill();
    }

    // mouth with two buck teeth
    g.beginPath();
    g.moveTo(-50, -193);
    g.quadraticCurveTo(-34, -148, 0, -145);
    g.quadraticCurveTo(34, -148, 50, -193);
    g.quadraticCurveTo(0, -164, -50, -193);
    outline('#5b2730', 3.5);
    for (const tx of [-16, 2]) {
      rr(tx, -185, 14, 19, 3);
      outline('#fffdf5', 2.5);
    }
    // cheek blush
    g.fillStyle = 'rgba(224,120,120,0.45)';
    ellipse(-63, -208, 10, 6); g.fill();
    ellipse(63, -208, 10, 6); g.fill();

    g.restore();
  }

  /* ---------- Patrick ---------- */

  function flower(cx, cy, r) {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 - Math.PI / 2;
      ellipse(cx + Math.cos(a) * r * 0.7, cy + Math.sin(a) * r * 0.7, r * 0.6, r * 0.6);
      g.fillStyle = '#8f6bbf'; g.fill();
    }
    ellipse(cx, cy, r * 0.38, r * 0.38);
    g.fillStyle = '#f0d060'; g.fill();
  }

  function drawPatrick(t) {
    const beat = t * 2.4 + 0.7;
    const bob = Math.abs(Math.sin(beat)) * 9;
    const squash = 1 + Math.sin(beat * 2) * 0.04;
    const tilt = Math.sin(beat) * -0.06;

    g.save();
    g.rotate(tilt);
    g.translate(0, -bob);
    g.scale(1 / squash, squash);

    // legs
    const kickL = Math.max(0, Math.sin(beat)) * 10;
    const kickR = Math.max(0, Math.sin(beat + Math.PI)) * 10;
    for (const [lx, kick, sgn] of [[-32, kickL, -1], [32, kickR, 1]]) {
      line([[lx, -136], [lx + sgn * 6, -24 + kick]], '#f2aac6', 21);
      ellipse(lx + sgn * 6, -12 + kick, 17, 11);
      outline('#e58cb0', 3.5);
    }

    // body
    starPath(0, -192, 108, 46, 100);
    const grad = g.createLinearGradient(0, -298, 0, -110);
    grad.addColorStop(0, '#f9bcd3');
    grad.addColorStop(1, '#ea95b5');
    outline(grad, 4.5);
    g.save();
    starPath(0, -192, 108, 46, 100); g.clip();
    // dot texture
    g.fillStyle = 'rgba(255,255,255,0.22)';
    for (const [dx, dy, r] of [[-62, -228, 6], [-44, -262, 4], [50, -262, 5], [66, -222, 4],
      [-74, -186, 5], [76, -180, 5], [-24, -158, 4], [22, -150, 5], [0, -286, 3], [-68, -150, 3],
      [34, -292, 3], [-36, -296, 3]]) {
      ellipse(dx, dy, r, r); g.fill();
    }
    g.restore();

    // shorts
    g.beginPath();
    g.moveTo(-60, -158);
    g.lineTo(60, -158);
    g.lineTo(55, -112);
    g.quadraticCurveTo(50, -104, 38, -105);
    g.lineTo(16, -105);
    g.quadraticCurveTo(7, -128, 0, -128);
    g.quadraticCurveTo(-7, -128, -16, -105);
    g.lineTo(-38, -105);
    g.quadraticCurveTo(-50, -104, -55, -112);
    g.closePath();
    outline('#7cc25e', 4);
    flower(-38, -138, 11);
    flower(38, -138, 11);
    flower(0, -148, 9);

    // face
    const open = openness(t, 2.1);
    for (const ex of [-22, 22]) {
      ellipse(ex, -222, 14.5, 17 * open + 1);
      outline('#ffffff', 3.5);
      if (open > 0.35) {
        ellipse(ex - 1, -221, 7.5, 8 * open);
        g.fillStyle = '#161018'; g.fill();
      }
    }
    // cheeks
    g.fillStyle = 'rgba(214,102,140,0.3)';
    ellipse(-44, -206, 9, 6); g.fill();
    ellipse(44, -206, 9, 6); g.fill();
    // mouth
    g.beginPath();
    g.moveTo(-36, -201);
    g.quadraticCurveTo(0, -167 + Math.sin(beat * 2) * 2, 36, -201);
    g.quadraticCurveTo(0, -183, -36, -201);
    outline('#7a3346', 3.5);
    // one tooth
    rr(-9, -197, 18, 16, 3);
    outline('#fffdf5', 2.5);

    g.restore();
  }

  /* ---------- scene ---------- */

  const NOTES = [
    { x: 0.29, y: 0.46, s: 22, ph: 0.0, dx: -0.05 },
    { x: 0.50, y: 0.26, s: 16, ph: 0.45, dx: 0.04 },
    { x: 0.71, y: 0.50, s: 26, ph: 0.8, dx: 0.06 },
    { x: 0.61, y: 0.20, s: 14, ph: 0.25, dx: -0.03 },
    { x: 0.39, y: 0.18, s: 18, ph: 0.65, dx: 0.02 }
  ];

  function drawScene(t) {
    g.clearRect(0, 0, W, H);

    const s = clamp(Math.min(W / 560, H / 350), 0.34, 1.8);
    const ground = H * 0.94;
    // keep the pair centred in the stage
    const halfSpan = (108 + 106) * s + 24 * s;
    const cxSp = W / 2 - halfSpan + 104 * s;
    const cxPa = W / 2 + halfSpan - 102 * s;

    // shadows
    g.fillStyle = 'rgba(0,0,0,0.45)';
    for (const [cx, ph] of [[cxSp, 0], [cxPa, 2.4]]) {
      const k = 0.75 + 0.25 * Math.sin(t * 2.4 + ph);
      ellipse(cx, ground + 4, 74 * s * k, 12 * s * k);
      g.fill();
    }

    // dancing figures
    g.save();
    g.translate(cxSp, ground);
    g.scale(s, s);
    drawSponge(t);
    g.restore();

    g.save();
    g.translate(cxPa, ground);
    g.scale(s, s);
    drawPatrick(t);
    g.restore();

    // floating notes
    for (const n of NOTES) {
      const p = ((t * 0.28 + n.ph) % 1);
      const y = H * n.y - p * H * 0.3;
      const x = W * n.x + Math.sin(p * 8 + n.ph * 6) * 14 + p * W * n.dx;
      g.globalAlpha = Math.sin(p * Math.PI) * 0.75;
      g.fillStyle = '#a78bfa';
      g.font = `${n.s}px "Jetbrains Mono", monospace`;
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillText(p < 0.5 ? '♪' : '♫', x, y);
      g.globalAlpha = 1;
    }
  }

  function fit() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    W = r.width; H = r.height;
    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let start = null;

  function frame(now) {
    if (start === null) start = now;
    drawScene(still ? 0.9 : (now - start) / 1000);
    if (!still) requestAnimationFrame(frame);
  }

  fit();
  if (window.ResizeObserver) new ResizeObserver(() => { fit(); if (still) drawScene(0.9); }).observe(canvas);
  else window.addEventListener('resize', () => { fit(); if (still) drawScene(0.9); });

  if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (still) drawScene(0.9); });
  requestAnimationFrame(frame);
})();
