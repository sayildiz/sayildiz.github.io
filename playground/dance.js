/* Playground: rigged SpongeBob & Patrick from rigmodels.com.
   SpongeBob plays a human dance clip retargeted onto his skeleton;
   Patrick (spine + legs only, no arm bones) bops along procedurally. */
import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';

const canvas = document.getElementById('dance');
const bubbles = document.getElementById('bubbles');
const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/* bubbles drifting up from the stage floor */
if (bubbles && !still) {
  const spawn = () => {
    const b = document.createElement('i');
    const size = 4 + Math.random() * 14;
    b.style.left = `${6 + Math.random() * 88}%`;
    b.style.width = b.style.height = `${size}px`;
    b.style.setProperty('--dx', `${(Math.random() - 0.5) * 90}px`);
    b.style.animationDuration = `${5 + Math.random() * 5}s`;
    bubbles.appendChild(b);
    b.addEventListener('animationend', () => b.remove());
  };

  for (let i = 0; i < 6; i++) setTimeout(spawn, i * 400);
  setInterval(spawn, 850);
}

/* the 3D dancers */
if (canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

  scene.add(new THREE.HemisphereLight(0xd8ccff, 0x241c33, 2.2));

  const key = new THREE.DirectionalLight(0xfff6e8, 2.5);
  key.position.set(2.5, 4, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0xa78bfa, 1.7);
  rim.position.set(-3.5, 2.2, -3);
  scene.add(rim);

  const fill = new THREE.PointLight(0xffffff, 9, 14, 2);
  fill.position.set(0, 1.4, 3);
  scene.add(fill);

  const SB_H = 1.85;          // SpongeBob's height in world units
  const PAT_H = 1.74;
  const SPACING = 0.62;

  let mixer = null;
  let sponge = null;
  let patrick = null;

  const bonesOf = (root) => {
    const map = new Map();
    root.traverse((o) => { if (o.isBone) map.set(o.name, o); });
    return map;
  };

  /* scale to `height`, centre on x/z, stand the feet on y = 0 */
  function normalize(model, height) {
    const box = new THREE.Box3().setFromObject(model);
    const size = box.getSize(new THREE.Vector3());
    const s = height / size.y;
    model.scale.setScalar(s);
    model.position.set(
      -(box.min.x + size.x / 2) * s,
      -box.min.y * s,
      -(box.min.z + size.z / 2) * s,
    );
    const holder = new THREE.Group();
    holder.add(model);
    return holder;
  }

  const loader = new FBXLoader();
  Promise.all([
    new Promise((ok, no) => loader.load('./assets/spongebob.fbx', ok, undefined, no)),
    new Promise((ok, no) => loader.load('./assets/patrick.fbx', ok, undefined, no)),
    new Promise((ok, no) => loader.load('./assets/dance.fbx', ok, undefined, no)),
  ]).then(([sb, pat, clipSource]) => {
    /* --- SpongeBob: retarget the dance clip --- */
    /* rigmodels' own fix for the rest-orientation gap between the model's
       skeleton and the clip's skeleton, bone by bone. */
    const modelBones = bonesOf(sb);
    const clipBones = bonesOf(clipSource);
    const delta = new Map();
    for (const [name, bone] of modelBones) {
      const src = clipBones.get(name);
      if (src) delta.set(name, src.quaternion.clone().invert().multiply(bone.quaternion));
    }

    const clip = clipSource.animations[0].clone();
    for (const track of clip.tracks) {
      if (!track.name.endsWith('.quaternion')) continue;
      const d = delta.get(track.name.split('.')[0]);
      if (!d) continue;
      const v = track.values;
      for (let i = 0; i < v.length; i += 4) {
        const q = new THREE.Quaternion(v[i], v[i + 1], v[i + 2], v[i + 3]).multiply(d).normalize();
        v[i] = q.x; v[i + 1] = q.y; v[i + 2] = q.z; v[i + 3] = q.w;
      }
    }

    sponge = normalize(sb, SB_H);
    sponge.position.x = -SPACING;
    scene.add(sponge);

    mixer = new THREE.AnimationMixer(sb);
    const action = mixer.clipAction(clip);
    action.play();
    if (still) {
      action.paused = true;
      action.time = 1.6;
      mixer.update(0);
    }

    /* --- Patrick: no arm bones in his rig, so he keeps the beat instead --- */
    patrick = normalize(pat, PAT_H);
    patrick.position.x = SPACING;
    patrick.rotation.y = 0;
    scene.add(patrick);

    resize();
  }).catch((err) => {
    console.error(err);
    const note = document.querySelector('.hint');
    if (note) note.textContent = 'the dancers did not show up.';
  });

  function resize() {
    const r = canvas.getBoundingClientRect();
    if (!r.width || !r.height) return;
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    /* fit both dancers, widening the shot on portrait screens */
    const fitH = 2.4, fitW = 3.3;
    const dist = Math.max(fitH, fitW / camera.aspect) / (2 * Math.tan(halfFov));
    camera.position.set(0, SB_H * 0.55, dist);
    camera.lookAt(0, SB_H * 0.5, 0);
    camera.updateProjectionMatrix();
    render();
  }

  function render() {
    renderer.render(scene, camera);
  }

  const clock = new THREE.Clock();
  function loop() {
    if (mixer) mixer.update(clock.getDelta());
    if (patrick) {
      const t = clock.elapsedTime;
      const beat = Math.sin(t * Math.PI * 2 / 1.0);
      patrick.position.y = Math.abs(beat) * 0.05;
      patrick.rotation.z = beat * 0.09;
      patrick.rotation.y = Math.sin(t * 0.9) * 0.2;
      patrick.scale.y = 1 + beat * 0.02;
    }
    render();
    requestAnimationFrame(loop);
  }

  if (window.ResizeObserver) new ResizeObserver(resize).observe(canvas);
  else window.addEventListener('resize', resize);
  resize();
  if (!still) requestAnimationFrame(loop);
}
