/* SpongeBob & Patrick dancing in 3D — three.js, no external models. */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

(() => {
  const canvas = document.getElementById('dance');
  if (!canvas) return;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  } catch (e) {
    canvas.style.display = 'none';
    return;
  }

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 60);

  /* ---------- materials ---------- */

  const mat = (color, opts = {}) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0, ...opts });

  const M = {
    ink: mat(0x1a1224, { roughness: 0.45 }),
    yellow: mat(0xf2d84a),
    yellowDeep: mat(0xd9bb35),
    white: mat(0xfbf7ec),
    brown: mat(0x9a6634),
    red: mat(0xc9433f),
    blue: mat(0x3f93cf),
    pink: mat(0xf2a8c3),
    pinkDeep: mat(0xe290b1),
    green: mat(0x77bd5b),
    purple: mat(0x8f6bbf),
    flowerCenter: mat(0xf3d75c),
    black: mat(0x141018, { roughness: 0.5 }),
    blush: new THREE.MeshStandardMaterial({ color: 0xdd8fa6, transparent: true, opacity: 0.55, roughness: 0.9 })
  };

  /* ---------- helpers ---------- */

  function add(parent, geo, material, x = 0, y = 0, z = 0) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  }

  const box = (w, h, d, r = 0.08) => new RoundedBoxGeometry(w, h, d, 3, r);
  const ball = (r, seg = 24) => new THREE.SphereGeometry(r, seg, Math.floor(seg * 0.7));
  const disc = (r, seg = 24) => new THREE.CircleGeometry(r, seg);
  const cyl = (rt, rb, h, seg = 20) => new THREE.CylinderGeometry(rt, rb, h, seg);

  function limb(parent, material, x, y, z, length, radius) {
    const pivot = new THREE.Group();
    pivot.position.set(x, y, z);
    parent.add(pivot);
    const m = add(pivot, cyl(radius, radius * 0.92, length), material, 0, -length / 2, 0);
    return { pivot, mesh: m, length };
  }

  function place(parent, mesh, x, y, z) {
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }

  function extrude(shape, depth, material) {
    const geo = new THREE.ExtrudeGeometry(shape, {
      depth, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03, bevelSegments: 2, curveSegments: 18
    });
    geo.translate(0, 0, -depth / 2);
    const m = new THREE.Mesh(geo, material);
    m.castShadow = true;
    m.receiveShadow = true;
    return m;
  }

  function blinkAmount(t, offset) {
    const p = (t + offset) % 4.3;
    if (p > 0.18) return 1;
    return Math.max(0.06, Math.abs(Math.cos(p / 0.18 * Math.PI)));
  }

  function eye(parent, x, y, z, r, irisScale = 0.46) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    parent.add(g);
    add(g, ball(r), M.ink, 0, 0, -0.015);        // outline shell
    add(g, ball(r * 0.93), M.white, 0, 0, 0.035);
    const iris = add(g, ball(r * irisScale, 16), M.blue, 0, 0, r * 0.92);
    iris.scale.z = 0.45;
    const pupil = add(g, ball(r * irisScale * 0.5, 14), M.black, 0, 0, r * 1.06);
    pupil.scale.z = 0.45;
    const glint = add(g, ball(r * 0.1, 10), M.white, -r * 0.12, r * 0.13, r * 1.06);
    glint.castShadow = false;
    return g;
  }

  /* ---------- SpongeBob ---------- */

  function buildSponge() {
    const root = new THREE.Group();
    const hips = new THREE.Group();
    hips.position.y = 0.95;
    root.add(hips);

    const torso = new THREE.Group();
    hips.add(torso);

    // body
    add(torso, box(1.5, 1.78, 0.72, 0.14), M.yellow, 0, 0.85, 0);

    // sponge holes
    const holeSpots = [
      [-0.55, 1.45, 0.08], [-0.6, 0.55, 0.06], [0.58, 1.5, 0.07],
      [0.62, 0.52, 0.075], [-0.35, 0.28, 0.05], [0.34, 0.3, 0.045],
      [0.12, 1.6, 0.05], [-0.18, 0.42, 0.045]
    ];
    for (const [hx, hy, hr] of holeSpots) {
      const d = add(torso, disc(hr, 16), M.yellowDeep, hx, hy, 0.365);
      d.castShadow = false;
    }

    // shirt + pants
    add(torso, box(1.56, 0.42, 0.78, 0.1), M.white, 0, 0.33, 0);
    add(torso, box(1.56, 0.36, 0.78, 0.1), M.brown, 0, -0.03, 0);
    add(torso, box(1.58, 0.05, 0.8, 0.02), M.ink, 0, 0.12, 0);

    // collar + tie
    const collar = new THREE.Shape();
    collar.moveTo(-0.2, 0.0); collar.lineTo(0.0, -0.2); collar.lineTo(0.2, 0.0);
    collar.lineTo(0.08, 0.06); collar.lineTo(0.0, -0.04); collar.lineTo(-0.08, 0.06);
    collar.closePath();
    place(torso, extrude(collar, 0.03, M.white), 0, 0.55, 0.4);

    const tie = new THREE.Shape();
    tie.moveTo(0, 0.02); tie.lineTo(0.07, -0.08); tie.lineTo(0.0, -0.26);
    tie.lineTo(-0.07, -0.08); tie.closePath();
    place(torso, extrude(tie, 0.03, M.red), 0, 0.52, 0.41);

    // eyes
    const eyes = [];
    for (const ex of [-0.29, 0.29]) {
      const e = eye(torso, ex, 1.36, 0.34, 0.25);
      eyes.push(e);
      // lashes
      for (const [dx, dz, ang] of [[-0.12, 0.0, -0.5], [0.0, 0.02, 0], [0.12, 0.0, 0.5]]) {
        const l = add(torso, cyl(0.012, 0.012, 0.14, 6), M.ink, ex + dx, 1.36 + 0.24, 0.4);
        l.rotation.z = ang;
        l.castShadow = false;
      }
    }

    // nose
    const nose = add(torso, ball(0.16, 18), M.yellow, 0, 1.14, 0.36);
    nose.scale.set(1, 0.85, 1.25);

    // mouth + teeth
    const mouth = new THREE.Shape();
    mouth.moveTo(-0.38, 0.0);
    mouth.quadraticCurveTo(-0.27, -0.3, 0, -0.31);
    mouth.quadraticCurveTo(0.27, -0.3, 0.38, 0.0);
    mouth.quadraticCurveTo(0, -0.18, -0.38, 0.0);
    place(torso, extrude(mouth, 0.03, M.ink), 0, 0.94, 0.4);
    for (const tx of [-0.09, 0.03]) {
      add(torso, box(0.11, 0.15, 0.03, 0.015), M.white, tx, 0.86, 0.42);
    }

    // cheeks
    for (const cx of [-0.58, 0.58]) {
      const c = add(torso, disc(0.09, 16), M.blush, cx, 1.02, 0.372);
      c.castShadow = false;
    }

    // arms
    const armL = limb(torso, M.yellow, -0.8, 0.38, 0, 0.64, 0.115);
    const armR = limb(torso, M.yellow, 0.8, 0.38, 0, 0.64, 0.115);
    for (const a of [armL, armR]) {
      add(a.pivot, ball(0.125, 16), M.yellow, 0, -a.length - 0.02, 0);
    }

    // legs
    const legL = limb(root, M.white, -0.24, 0.95, 0, 0.78, 0.1);
    const legR = limb(root, M.white, 0.24, 0.95, 0, 0.78, 0.1);
    for (const l of [legL, legR]) {
      for (const [sy, col] of [[0.42, M.red], [0.5, M.blue]]) {
        const ring = add(l.pivot, new THREE.TorusGeometry(0.1, 0.022, 8, 20), col, 0, -sy, 0);
        ring.rotation.x = Math.PI / 2;
        ring.castShadow = false;
      }
      add(l.pivot, box(0.46, 0.2, 0.62, 0.08), M.black, 0, -0.86, 0.09);
    }

    return { root, hips, torso, armL, armR, legL, legR, eyes };
  }

  /* ---------- Patrick ---------- */

  function starShape(outer = 1.14, inner = 0.5, topR = 0, legR = 0) {
    const pts = [];
    for (let i = 0; i < 10; i++) {
      const a = Math.PI / 2 + i * Math.PI / 5;
      let r = i % 2 ? inner : (i === 0 && topR ? topR : outer);
      if (legR && (i === 4 || i === 6)) r = legR;
      pts.push([Math.cos(a) * r, Math.sin(a) * r]);
    }
    const rad = 0.24, shape = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const p = pts[i], pv = pts[(i - 1 + 10) % 10], nx = pts[(i + 1) % 10];
      const l1 = Math.hypot(pv[0] - p[0], pv[1] - p[1]);
      const l2 = Math.hypot(nx[0] - p[0], nx[1] - p[1]);
      const d1 = Math.min(rad, l1 * 0.45), d2 = Math.min(rad, l2 * 0.45);
      const a = [p[0] + (pv[0] - p[0]) / l1 * d1, p[1] + (pv[1] - p[1]) / l1 * d1];
      const b = [p[0] + (nx[0] - p[0]) / l2 * d2, p[1] + (nx[1] - p[1]) / l2 * d2];
      if (i === 0) shape.moveTo(a[0], a[1]); else shape.lineTo(a[0], a[1]);
      shape.quadraticCurveTo(p[0], p[1], b[0], b[1]);
    }
    shape.closePath();
    return shape;
  }

  function drawFlower(parent, x, y, z, r) {
    for (let i = 0; i < 5; i++) {
      const a = i * Math.PI * 2 / 5 - Math.PI / 2;
      const p = add(parent, disc(r * 0.58, 14), M.purple, x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, z);
      p.castShadow = false;
    }
    const c = add(parent, disc(r * 0.34, 12), M.flowerCenter, x, y, z + 0.002);
    c.castShadow = false;
  }

  function buildPatrick() {
    const root = new THREE.Group();
    const hips = new THREE.Group();
    hips.position.y = 1.22;
    root.add(hips);
    const torso = new THREE.Group();
    torso.position.y = 0.78;
    hips.add(torso);

    // star body
    torso.add(extrude(starShape(1.14, 0.5, 1.05, 0.96), 0.58, M.pink));

    // shorts
    add(torso, box(1.34, 0.56, 0.72, 0.16), M.green, 0, -0.44, 0);
    add(torso, box(0.05, 0.5, 0.74, 0.02), M.green.clone(), 0, -0.44, 0.001).material.color.set(0x5c9c44);
    drawFlower(torso, -0.33, -0.44, 0.372, 0.1);
    drawFlower(torso, 0.33, -0.44, 0.372, 0.1);

    // face
    const eyes = [];
    for (const ex of [-0.27, 0.27]) {
      eyes.push(eye(torso, ex, 0.34, 0.3, 0.19));
    }
    for (const bx of [-0.27, 0.27]) {
      const brow = add(torso, box(0.2, 0.035, 0.04, 0.015), M.ink, bx, 0.55, 0.33);
      brow.castShadow = false;
    }
    const mouth = new THREE.Shape();
    mouth.moveTo(-0.32, 0.0);
    mouth.quadraticCurveTo(0, -0.26, 0.32, 0.0);
    mouth.quadraticCurveTo(0, -0.15, -0.32, 0.0);
    place(torso, extrude(mouth, 0.03, M.ink), 0, 0.02, 0.33);
    add(torso, box(0.14, 0.14, 0.03, 0.02), M.white, 0, -0.05, 0.355);

    // legs
    const legL = limb(root, M.pink, -0.33, 1.36, 0, 1.12, 0.135);
    const legR = limb(root, M.pink, 0.33, 1.36, 0, 1.12, 0.135);
    for (const l of [legL, legR]) {
      add(l.pivot, ball(0.145, 16), M.pink, 0, -0.02, 0);
      const foot = add(l.pivot, ball(0.19, 16), M.pinkDeep, 0, -1.16, 0.06);
      foot.scale.set(1.15, 0.6, 1.5);
    }

    return { root, hips, torso, legL, legR, eyes };
  }

  /* ---------- scene assembly ---------- */

  const sponge = buildSponge();
  const patrick = buildPatrick();
  sponge.root.position.x = -1.24;
  patrick.root.position.x = 1.24;
  scene.add(sponge.root, patrick.root);

  const hemi = new THREE.HemisphereLight(0xd8ccff, 0x241c33, 0.75);
  scene.add(hemi);

  const key = new THREE.DirectionalLight(0xfff6e8, 2.7);
  key.position.set(3.4, 6.2, 4.6);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -3.6;
  key.shadow.camera.right = 3.6;
  key.shadow.camera.top = 4.4;
  key.shadow.camera.bottom = -1;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 18;
  key.shadow.bias = -0.0012;
  key.shadow.radius = 3;
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xa78bfa, 1.7);
  rim.position.set(-4.5, 3.2, -4);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffffff, 3.6, 14, 2);
  fill.position.set(0, 1.2, 3.2);
  scene.add(fill);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(7, 64).rotateX(-Math.PI / 2),
    new THREE.ShadowMaterial({ opacity: 0.42 })
  );
  floor.position.y = 0.002;
  floor.receiveShadow = true;
  scene.add(floor);


  /* ---------- layout ---------- */

  const FIT_H = 3.45, FIT_W = 5.0;

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const dist = Math.max(FIT_H, FIT_W / camera.aspect) / (2 * Math.tan(halfFov)) * 1.08;
    camera.position.set(0, 2.05, dist);
    camera.lookAt(0, 1.5, 0);
    camera.updateProjectionMatrix();
    render();
  }

  /* ---------- dance ---------- */

  const BEAT = 60 / 122;
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const clock = new THREE.Clock();

  function pose(t) {
    const b = t / BEAT;
    const s = Math.sin(Math.PI * b);

    // SpongeBob
    sponge.root.position.y = 0.05 + 0.07 * Math.abs(s);
    sponge.hips.rotation.z = -0.06 * s;
    sponge.hips.rotation.y = 0.12 * Math.sin(Math.PI * b / 2);
    sponge.torso.rotation.z = 0.09 * s;
    sponge.torso.rotation.x = 0.04 * Math.sin(2 * Math.PI * b);
    const raiseL = Math.max(0, s), raiseR = Math.max(0, -s);
    sponge.armL.pivot.rotation.z = -(0.5 + 1.05 * raiseL);
    sponge.armR.pivot.rotation.z = 0.5 + 1.05 * raiseR;
    sponge.armL.pivot.rotation.x = 0.35 * Math.sin(2 * Math.PI * b);
    sponge.armR.pivot.rotation.x = -0.35 * Math.sin(2 * Math.PI * b);
    sponge.legL.pivot.rotation.x = 0.32 * s;
    sponge.legR.pivot.rotation.x = -0.32 * s;
    sponge.legL.pivot.rotation.z = 0.05;
    sponge.legR.pivot.rotation.z = -0.05;

    // Patrick — half a beat behind, wider sway
    const pb = b + 0.5;
    const ps = Math.sin(Math.PI * pb);
    patrick.root.position.y = 0.04 + 0.08 * Math.abs(ps);
    patrick.hips.rotation.z = 0.13 * ps;
    patrick.hips.rotation.y = -0.1 * Math.sin(Math.PI * pb / 2 + 0.5);
    patrick.torso.rotation.z = -0.1 * ps;
    patrick.torso.rotation.y = 0.3 * Math.sin(Math.PI * pb / 2 + 0.4);
    patrick.torso.rotation.x = 0.05 * Math.sin(2 * Math.PI * pb);
    patrick.torso.scale.y = 1 + 0.035 * Math.sin(2 * Math.PI * pb);
    patrick.legL.pivot.rotation.x = 0.4 * ps;
    patrick.legR.pivot.rotation.x = -0.4 * ps;
    patrick.legL.pivot.rotation.z = -0.07;
    patrick.legR.pivot.rotation.z = 0.07;

    // blinking
    const bs = blinkAmount(t, 0.4), bp = blinkAmount(t, 2.2);
    for (const e of sponge.eyes) e.scale.y = bs;
    for (const e of patrick.eyes) e.scale.y = bp;
  }

  function render() {
    renderer.render(scene, camera);
  }

  let raf = 0;
  function loop() {
    pose(still ? 0.75 : clock.getElapsedTime());
    render();
    if (!still) raf = requestAnimationFrame(loop);
  }

  resize();
  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);

  if (still) { pose(0.75); render(); }
  else requestAnimationFrame(loop);
})();
