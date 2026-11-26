// Abandoned-bunker exterior: weathered concrete portal, rusty door texture, cracked ground with
// puddles, rubble, leaves, grass, drums, a flickering caged lamp, moonlight and falling debris.
import * as THREE from 'three';

const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

/* ------------------------------------------------------------------ */
/* Canvas helpers                                                      */
/* ------------------------------------------------------------------ */
function canvas(w, h = w) {
  const c = document.createElement('canvas');
  c.width = w;
  c.height = h;
  return [c, c.getContext('2d')];
}
function speckle(ctx, w, h, n, colors, size = [1, 3]) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = pick(colors);
    const s = rand(...size);
    ctx.fillRect(Math.random() * w, Math.random() * h, s, s);
  }
}
function blotch(ctx, x, y, r, color) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
}
function crack(ctx, x, y, len, width = 1.6, color = 'rgba(15,14,12,0.8)') {
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.beginPath();
  ctx.moveTo(x, y);
  let a = Math.random() * Math.PI * 2;
  for (let i = 0; i < len; i++) {
    a += rand(-0.6, 0.6);
    x += Math.cos(a) * 6;
    y += Math.sin(a) * 6;
    ctx.lineTo(x, y);
    if (Math.random() < 0.06 && width > 0.8) crack(ctx, x, y, len / 3, width * 0.6, color);
  }
  ctx.stroke();
}
function toTexture(c, renderer, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* Textures                                                            */
/* ------------------------------------------------------------------ */
function concreteCanvas() {
  const S = 1024;
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#6d6b66';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 70; i++) blotch(ctx, rand(0, S), rand(0, S), rand(40, 220), pick(['rgba(255,255,255,0.05)', 'rgba(0,0,0,0.08)', 'rgba(70,60,40,0.06)']));
  // formwork board imprints
  for (let y = 0; y < S; y += 128) {
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.fillRect(0, y, S, 2);
    ctx.fillStyle = 'rgba(255,255,255,0.05)';
    ctx.fillRect(0, y + 2, S, 1);
    // form-tie holes
    for (let x = 64; x < S; x += 256) {
      ctx.fillStyle = 'rgba(20,18,16,0.7)';
      ctx.beginPath();
      ctx.arc(x + (y / 128) % 2 * 128, y + 64, 6, 0, Math.PI * 2);
      ctx.fill();
      // rust stain dripping from tie
      const g = ctx.createLinearGradient(0, y + 64, 0, y + 64 + rand(40, 140));
      g.addColorStop(0, 'rgba(110,55,20,0.45)');
      g.addColorStop(1, 'rgba(110,55,20,0)');
      ctx.fillStyle = g;
      ctx.fillRect(x + (y / 128) % 2 * 128 - 3, y + 64, 6, 140);
    }
  }
  // water streaks running down
  for (let i = 0; i < 160; i++) {
    const x = rand(0, S);
    const y0 = rand(-50, S * 0.6);
    const len = rand(80, 500);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
    g.addColorStop(0, 'rgba(25,24,20,0.25)');
    g.addColorStop(1, 'rgba(25,24,20,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, rand(1, 5), len);
  }
  // grime + moss at the bottom
  const bottom = ctx.createLinearGradient(0, S * 0.65, 0, S);
  bottom.addColorStop(0, 'rgba(30,28,20,0)');
  bottom.addColorStop(1, 'rgba(30,28,18,0.55)');
  ctx.fillStyle = bottom;
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 40; i++) blotch(ctx, rand(0, S), rand(S * 0.78, S), rand(20, 70), 'rgba(60,80,30,0.35)');
  speckle(ctx, S, S, 22000, ['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.08)', 'rgba(90,80,60,0.1)'], [1, 3]);
  for (let i = 0; i < 9; i++) crack(ctx, rand(0, S), rand(0, S), rand(15, 50), rand(1, 2.2));
  return c;
}

function groundCanvas() {
  const S = 1024;
  const [c, ctx] = canvas(S);
  const [rc, rctx] = canvas(S); // roughness map: white = rough, dark = wet/glossy
  ctx.fillStyle = '#4a4843';
  ctx.fillRect(0, 0, S, S);
  rctx.fillStyle = '#e8e8e8';
  rctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 80; i++) blotch(ctx, rand(0, S), rand(0, S), rand(40, 200), pick(['rgba(0,0,0,0.12)', 'rgba(255,255,255,0.04)', 'rgba(80,65,40,0.1)']));
  // slab joints
  ctx.fillStyle = 'rgba(15,14,12,0.7)';
  for (let i = 0; i <= S; i += 256) {
    ctx.fillRect(i - 2, 0, 4, S);
    ctx.fillRect(0, i - 2, S, 4);
  }
  // puddles (dark + glossy)
  for (let i = 0; i < 5; i++) {
    const x = rand(0, S);
    const y = rand(0, S);
    const r = rand(40, 110);
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(1, rand(0.4, 0.8));
    blotch(ctx, 0, 0, r, 'rgba(10,12,14,0.7)');
    ctx.restore();
    rctx.save();
    rctx.translate(x, y);
    rctx.scale(1, 0.6);
    blotch(rctx, 0, 0, r, 'rgba(0,0,0,0.95)');
    rctx.restore();
  }
  // oil stains
  for (let i = 0; i < 6; i++) blotch(ctx, rand(0, S), rand(0, S), rand(20, 60), 'rgba(5,5,5,0.4)');
  for (let i = 0; i < 25; i++) crack(ctx, rand(0, S), rand(0, S), rand(10, 45), rand(1, 2.5));
  // weeds in cracks / dirt
  for (let i = 0; i < 120; i++) blotch(ctx, rand(0, S), rand(0, S), rand(4, 14), pick(['rgba(70,90,35,0.5)', 'rgba(90,70,40,0.4)']));
  speckle(ctx, S, S, 40000, ['rgba(0,0,0,0.18)', 'rgba(255,255,255,0.07)', 'rgba(120,100,70,0.12)'], [1, 3]);
  return [c, rc];
}

export function rustCanvas({ stencil = true } = {}) {
  const S = 1024;
  const [c, ctx] = canvas(S);
  ctx.fillStyle = '#5f5d58';
  ctx.fillRect(0, 0, S, S);
  // old paint (faded army green) with large rust patches
  ctx.fillStyle = 'rgba(70,78,58,0.55)';
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 140; i++) {
    const y = Math.random() < 0.5 ? rand(S * 0.6, S) : rand(0, S);
    blotch(ctx, rand(0, S), y, rand(10, 90), pick(['rgba(120,58,22,0.55)', 'rgba(90,40,15,0.6)', 'rgba(150,80,35,0.4)']));
  }
  // rust streaks
  for (let i = 0; i < 220; i++) {
    const x = rand(0, S);
    const y0 = rand(0, S);
    const len = rand(30, 260);
    const g = ctx.createLinearGradient(0, y0, 0, y0 + len);
    g.addColorStop(0, 'rgba(110,50,18,0.45)');
    g.addColorStop(1, 'rgba(110,50,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y0, rand(1, 4), len);
  }
  if (stencil) {
    ctx.save();
    ctx.globalAlpha = 0.42;
    ctx.fillStyle = '#d8d2c2';
    ctx.font = '900 260px Impact, "Arial Black", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('07', S / 2, S * 0.52);
    ctx.font = '900 64px Impact, "Arial Black", sans-serif';
    ctx.fillText('KEEP  CLEAR', S / 2, S * 0.66);
    ctx.restore();
    // chip the stencil
    for (let i = 0; i < 500; i++) blotch(ctx, rand(S * 0.2, S * 0.8), rand(S * 0.25, S * 0.7), rand(2, 9), 'rgba(80,60,40,0.7)');
  }
  // dents and scratches
  for (let i = 0; i < 25; i++) blotch(ctx, rand(0, S), rand(0, S), rand(15, 45), 'rgba(0,0,0,0.22)');
  ctx.strokeStyle = 'rgba(220,210,190,0.12)';
  for (let i = 0; i < 90; i++) {
    ctx.lineWidth = rand(0.5, 1.5);
    ctx.beginPath();
    const x = rand(0, S);
    const y = rand(0, S);
    ctx.moveTo(x, y);
    ctx.lineTo(x + rand(-80, 80), y + rand(-20, 20));
    ctx.stroke();
  }
  const g = ctx.createLinearGradient(0, S * 0.7, 0, S);
  g.addColorStop(0, 'rgba(30,22,10,0)');
  g.addColorStop(1, 'rgba(30,22,10,0.6)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  speckle(ctx, S, S, 20000, ['rgba(0,0,0,0.15)', 'rgba(140,70,30,0.15)', 'rgba(255,255,255,0.05)']);
  return c;
}

export function chippedHazardCanvas() {
  const [c, ctx] = canvas(512, 128);
  ctx.fillStyle = '#c9a20a';
  ctx.fillRect(0, 0, 512, 128);
  ctx.fillStyle = '#151412';
  for (let i = -128; i < 640; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 32, 0);
    ctx.lineTo(i + 32 + 128, 128);
    ctx.lineTo(i + 128, 128);
    ctx.fill();
  }
  // paint chips revealing grey under-layer
  for (let i = 0; i < 260; i++) blotch(ctx, rand(0, 512), rand(0, 128), rand(2, 10), 'rgba(105,100,92,0.95)');
  for (let i = 0; i < 40; i++) blotch(ctx, rand(0, 512), rand(60, 128), rand(8, 30), 'rgba(60,40,20,0.5)');
  speckle(ctx, 512, 128, 6000, ['rgba(0,0,0,0.2)', 'rgba(255,255,255,0.08)']);
  return c;
}

function signCanvas() {
  const [c, ctx] = canvas(1024, 200);
  ctx.clearRect(0, 0, 1024, 200);
  ctx.fillStyle = 'rgba(230,225,210,0.75)';
  ctx.textAlign = 'center';
  ctx.font = '900 110px Impact, "Arial Black", sans-serif';
  ctx.fillText('SECTOR  07', 512, 115);
  ctx.font = '700 34px "Share Tech Mono", monospace';
  ctx.fillText('AUTHORIZED PERSONNEL ONLY', 512, 170);
  // erode the paint
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 900; i++) blotch(ctx, rand(0, 1024), rand(0, 200), rand(2, 10), 'rgba(0,0,0,0.9)');
  for (let i = 0; i < 30; i++) ctx.fillRect(rand(0, 1024), 0, rand(1, 3), 200);
  return c;
}

function grassCanvas() {
  const [c, ctx] = canvas(256);
  for (let i = 0; i < 70; i++) {
    const x = rand(20, 236);
    const h = rand(80, 240);
    const lean = rand(-50, 50);
    ctx.strokeStyle = pick(['#5c6b2e', '#6f7a3a', '#4a5a26', '#7d7a45', '#8a8150']);
    ctx.lineWidth = rand(2, 5);
    ctx.beginPath();
    ctx.moveTo(x, 256);
    ctx.quadraticCurveTo(x + lean * 0.3, 256 - h * 0.6, x + lean, 256 - h);
    ctx.stroke();
  }
  return c;
}

function leafCanvas() {
  const [c, ctx] = canvas(64);
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.ellipse(32, 32, 26, 13, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(0,0,0,0.4)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(8, 40);
  ctx.lineTo(56, 24);
  ctx.stroke();
  return c;
}

/* ------------------------------------------------------------------ */
/* Debris: clods of earth heaped against the foot of the door.         */
/* They sit there from the start; the door's first lurches free them   */
/* and they tumble out onto the apron.                                 */
/* ------------------------------------------------------------------ */
class Debris {
  constructor(scene, audio, { halfW, z, count = 12 }) {
    this.audio = audio;
    this.items = [];
    const mats = [0x5a3f26, 0x6b4a2c, 0x4a3420, 0x7a5634, 0x3f2d1c].map(
      (c) => new THREE.MeshStandardMaterial({ color: c, roughness: 1, metalness: 0, flatShading: true }),
    );
    // two or three small heaps along the door
    const heaps = [rand(-halfW + 0.8, -1.2), rand(-0.6, 0.6), rand(1.2, halfW - 0.8)];
    for (let i = 0; i < count; i++) {
      // each clod: a small 7-, 8- or 9-faced prism (5-7 sides + 2 caps), slightly tapered
      const faces = pick([7, 8, 9]);
      const r = rand(0.1, 0.2);
      const h = r * rand(0.7, 1.4);
      const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r * rand(0.55, 0.95), r, h, faces - 2, 1), pick(mats));
      const stacked = i > 5 && Math.random() < 0.6;
      const rest = Math.min(r, h) * 0.5;
      mesh.position.set(heaps[i % heaps.length] + rand(-0.4, 0.4), rest + (stacked ? rest * 1.4 : 0), z + r + rand(0, 0.12));
      mesh.rotation.set(rand(0, 6), rand(0, 6), rand(0, 6));
      mesh.castShadow = mesh.receiveShadow = true;
      scene.add(mesh);
      this.items.push({ mesh, r: rest, state: 'pile', vel: new THREE.Vector3(), ang: new THREE.Vector3() });
    }
  }

  /** free n clods from the heap: they get shoved out from under the rising door */
  burst(n) {
    const pile = this.items.filter((it) => it.state === 'pile');
    for (let i = 0; i < n && pile.length; i++) {
      const it = pile.splice(Math.floor(Math.random() * pile.length), 1)[0];
      it.state = 'fly';
      it.delay = rand(0, 0.18);
      it.vel.set(rand(-0.5, 0.5), rand(0.4, 1.6), rand(0.9, 2.4));
      it.ang.set(rand(-9, 9), rand(-4, 4), rand(-9, 9));
    }
  }

  update(dt) {
    for (const it of this.items) {
      if (it.state === 'pile' || it.state === 'rest') continue;
      if (it.delay > 0) {
        it.delay -= dt;
        continue;
      }
      const p = it.mesh.position;
      if (it.state === 'fly') it.vel.y -= 9.8 * dt;
      p.addScaledVector(it.vel, dt);
      it.mesh.rotation.x += it.ang.x * dt;
      it.mesh.rotation.y += it.ang.y * dt;
      it.mesh.rotation.z += it.ang.z * dt;
      if (it.state === 'fly' && p.y < it.r) {
        p.y = it.r;
        const impact = Math.abs(it.vel.y);
        if (impact > 0.6 && this.audio) this.audio.pebble(Math.min(1, impact / 4));
        it.vel.y = -it.vel.y * 0.28;
        it.vel.x *= 0.7;
        it.vel.z *= 0.7;
        it.ang.multiplyScalar(0.6);
        if (it.vel.y < 0.3) {
          it.vel.y = 0;
          it.state = 'roll'; // slides/rolls along the ground until friction stops it
        }
      } else if (it.state === 'roll') {
        const f = Math.exp(-dt * 3.2);
        it.vel.x *= f;
        it.vel.z *= f;
        it.ang.multiplyScalar(f);
        if (Math.hypot(it.vel.x, it.vel.z) < 0.04) it.state = 'rest';
      }
    }
  }
}

/* ------------------------------------------------------------------ */
/* Build                                                               */
/* ------------------------------------------------------------------ */
export function buildExterior({ scene, renderer, ROOM, DOOR, sprite, audio }) {
  const concreteTex = toTexture(concreteCanvas(), renderer);
  const concreteBump = toTexture(concreteTex.image, renderer, false);
  const concrete = (rx, ry) => {
    const map = concreteTex.clone();
    map.repeat.set(rx, ry);
    const bump = concreteBump.clone();
    bump.repeat.set(rx, ry);
    return new THREE.MeshStandardMaterial({ map, bumpMap: bump, bumpScale: 2.5, roughness: 0.95, metalness: 0 });
  };
  const box = (w, h, d, mat, x, y, z, ry = 0) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
    m.position.set(x, y, z);
    m.rotation.y = ry;
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  const cbox = (w, h, d, x, y, z, ry = 0) => box(w, h, d, concrete(Math.max(w, d) / 4, h / 4), x, y, z, ry);

  const fz = ROOM.front; // wall center plane
  const t = 0.5;
  const outer = fz + t / 2; // outer face of the front wall
  const sideW = ROOM.halfW - DOOR.halfW;

  /* ---- front wall + facade (concrete) ---- */
  for (const s of [-1, 1]) cbox(sideW, ROOM.height, t, s * (DOOR.halfW + sideW / 2), ROOM.height / 2, fz);
  cbox(DOOR.halfW * 2, ROOM.height - DOOR.height, t, 0, DOOR.height + (ROOM.height - DOOR.height) / 2, fz);
  for (const s of [-1, 1]) cbox(12, ROOM.height + 1.5, t + 0.4, s * (ROOM.halfW + 6), (ROOM.height + 1.5) / 2, fz + 0.2);
  cbox(ROOM.halfW * 2 + 24, 1.5, t + 0.4, 0, ROOM.height + 0.75, fz + 0.2);

  /* ---- bunker portal: thick pillars + overhanging lintel slab ---- */
  const pillarW = 0.75;
  const pillarD = 1.15;
  const lintelH = 1.15;
  const pillarH = DOOR.height + lintelH;
  for (const s of [-1, 1]) {
    cbox(pillarW, pillarH, pillarD, s * (DOOR.halfW + pillarW / 2), pillarH / 2, outer + pillarD / 2);
    // chipped hazard band at the base of each pillar
    const hz = toTexture(chippedHazardCanvas(), renderer);
    hz.repeat.set(1, 1);
    hz.rotation = Math.PI / 2;
    const band = new THREE.Mesh(new THREE.PlaneGeometry(pillarW, 1.3), new THREE.MeshStandardMaterial({ map: hz, roughness: 0.9 }));
    band.position.set(s * (DOOR.halfW + pillarW / 2), 0.65, outer + pillarD + 0.005);
    scene.add(band);
  }
  const lintelW = DOOR.halfW * 2 + pillarW * 2 + 0.8;
  const lintelD = 1.9;
  cbox(lintelW, lintelH, lintelD, 0, DOOR.height + lintelH / 2, outer + lintelD / 2);
  // chamfer strip under the slab (dark gap shadow)
  box(lintelW - 0.2, 0.06, lintelD - 0.1, new THREE.MeshStandardMaterial({ color: 0x1a1918, roughness: 1 }), 0, DOOR.height - 0.02, outer + lintelD / 2);

  // stencil sign on the slab front
  const sign = new THREE.Mesh(
    new THREE.PlaneGeometry(4.6, 0.9),
    new THREE.MeshStandardMaterial({ map: toTexture(signCanvas(), renderer), transparent: true, roughness: 0.9, depthWrite: false }),
  );
  sign.position.set(0, DOOR.height + lintelH / 2, outer + lintelD + 0.01);
  scene.add(sign);

  /* ---- wing retaining walls, splayed outward and sloping down ---- */
  const slopedWall = (len, hNear, hFar, thick) => {
    const g = new THREE.BoxGeometry(len, 1, thick, 8, 1, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const u = p.getX(i) / len + 0.5;
      const h = THREE.MathUtils.lerp(hNear, hFar, u);
      p.setY(i, (p.getY(i) + 0.5) * h);
    }
    g.computeVertexNormals();
    return g;
  };
  for (const s of [-1, 1]) {
    const len = 7;
    const ang = s * -0.9;
    const m = new THREE.Mesh(s > 0 ? slopedWall(len, 4.2, 0.9, 0.7) : slopedWall(len, 0.9, 4.2, 0.7), concrete(len / 4, 1));
    const x0 = s * 7.2;
    m.position.set(x0 + s * Math.cos(0.9) * len / 2, 0, outer + Math.sin(0.9) * len / 2);
    m.rotation.y = ang;
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
  }

  /* ---- ground: cracked slabs with puddles ---- */
  const [gc, rc] = groundCanvas();
  const gmap = toTexture(gc, renderer);
  const rmap = toTexture(rc, renderer, false);
  gmap.repeat.set(5, 4);
  rmap.repeat.set(5, 4);
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(44, 22.5),
    new THREE.MeshStandardMaterial({ map: gmap, roughnessMap: rmap, bumpMap: gmap, bumpScale: 1.2, roughness: 1, metalness: 0.15 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(0, 0.001, fz + 11.25);
  ground.receiveShadow = true;
  scene.add(ground);

  /* ---- rubble ---- */
  const rubbleMat = concrete(0.3, 0.3);
  const rubbleGeo = new THREE.DodecahedronGeometry(1, 0);
  const rubble = new THREE.InstancedMesh(rubbleGeo, rubbleMat, 90);
  const m4 = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  const v = new THREE.Vector3();
  const sc = new THREE.Vector3();
  const spots = [];
  for (let i = 0; i < 90; i++) {
    // cluster near the walls/pillars, some scattered
    const cluster = pick([[-5.6, 8.4], [5.9, 8.6], [-8.6, 10.5], [8.4, 11], [rand(-6, 7), rand(9, 15)]]);
    const s = Math.random() < 0.12 ? rand(0.18, 0.4) : rand(0.03, 0.12);
    v.set(cluster[0] + rand(-0.8, 0.8), s * 0.5, cluster[1] + rand(-0.6, 0.6));
    if (Math.abs(v.x) < DOOR.halfW && v.z < outer + 1.2) v.x += Math.sign(v.x || 1) * DOOR.halfW;
    spots.push(v.clone());
    e.set(rand(0, 6), rand(0, 6), rand(0, 6));
    q.setFromEuler(e);
    sc.set(s, s * rand(0.5, 1), s * rand(0.7, 1.3));
    rubble.setMatrixAt(i, m4.compose(v, q, sc));
  }
  rubble.castShadow = rubble.receiveShadow = true;
  scene.add(rubble);
  // a broken slab leaning against the left wing
  const slab = cbox(2.2, 0.25, 1.4, -6.4, 0.45, 10.6);
  slab.rotation.set(0.2, 0.5, -0.35);

  /* ---- leaves ---- */
  const leafTex = toTexture(leafCanvas(), renderer);
  const leaves = new THREE.InstancedMesh(
    new THREE.PlaneGeometry(0.16, 0.16),
    new THREE.MeshStandardMaterial({ alphaMap: leafTex, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9, color: 0xffffff }),
    260,
  );
  const leafColors = [0x6b4a22, 0x7a5a2a, 0x4e3a1c, 0x8a6a30, 0x5a4a2a];
  for (let i = 0; i < 260; i++) {
    // drift against the walls and in the door's corner
    const nearWall = Math.random() < 0.6;
    v.set(nearWall ? rand(-8, 9) : rand(-9, 9), 0.01 + Math.random() * 0.02, nearWall ? outer + rand(0, 1.4) + (Math.abs(v.x) < 5 ? 1 : 0) : rand(outer, outer + 12));
    e.set(-Math.PI / 2 + rand(-0.3, 0.3), 0, rand(0, Math.PI * 2));
    q.setFromEuler(e);
    const s = rand(0.6, 1.4);
    leaves.setMatrixAt(i, m4.compose(v, q, sc.set(s, s, s)));
    leaves.setColorAt(i, new THREE.Color(pick(leafColors)));
  }
  leaves.receiveShadow = true;
  scene.add(leaves);

  /* ---- grass tufts (crossed alpha planes) ---- */
  const grassTex = toTexture(grassCanvas(), renderer);
  const tuftGeo = new THREE.PlaneGeometry(0.7, 0.55);
  tuftGeo.translate(0, 0.27, 0);
  const tuft2 = tuftGeo.clone().rotateY(Math.PI / 2);
  const grassGeo = new THREE.BufferGeometry();
  {
    const a = tuftGeo.toNonIndexed();
    const b = tuft2.toNonIndexed();
    const merge = (name) => {
      const arr = new Float32Array(a.attributes[name].array.length + b.attributes[name].array.length);
      arr.set(a.attributes[name].array);
      arr.set(b.attributes[name].array, a.attributes[name].array.length);
      grassGeo.setAttribute(name, new THREE.BufferAttribute(arr, a.attributes[name].itemSize));
    };
    ['position', 'normal', 'uv'].forEach(merge);
  }
  const grassMat = new THREE.MeshStandardMaterial({ map: grassTex, alphaTest: 0.4, side: THREE.DoubleSide, roughness: 1 });
  const grass = new THREE.InstancedMesh(grassGeo, grassMat, 130);
  for (let i = 0; i < 130; i++) {
    const along = Math.random() < 0.65;
    let x = along ? rand(-16, 16) : rand(-9, 9);
    if (along && Math.abs(x) < DOOR.halfW + 0.8) x += Math.sign(x || 1) * (DOOR.halfW + 0.8);
    v.set(x, 0, along ? outer + rand(0.05, 0.6) : rand(outer + 1.5, outer + 13));
    e.set(0, rand(0, Math.PI), 0);
    q.setFromEuler(e);
    const s = rand(0.4, 1.0);
    grass.setMatrixAt(i, m4.compose(v, q, sc.set(s, s * rand(0.7, 1.4), s)));
  }
  scene.add(grass);

  /* ---- rusty drums & barrier ---- */
  const drumMat = new THREE.MeshStandardMaterial({ map: toTexture(rustCanvas({ stencil: false }), renderer), color: 0xb05a3a, roughness: 0.8, metalness: 0.5 });
  const drum = (x, y, z, rx, rz) => {
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 1.25, 24), drumMat);
    m.position.set(x, y, z);
    m.rotation.set(rx, rand(0, 3), rz);
    m.castShadow = m.receiveShadow = true;
    scene.add(m);
    for (const h of [-0.3, 0.3]) {
      const r = new THREE.Mesh(new THREE.TorusGeometry(0.43, 0.025, 6, 32), drumMat);
      r.rotation.x = Math.PI / 2;
      r.position.y = h;
      m.add(r);
    }
  };
  drum(-6.3, 0.625, 8.7, 0, 0);
  drum(-5.4, 0.625, 8.5, 0, 0.04);
  drum(-4.7, 0.42, 10.6, Math.PI / 2, 0.3);
  {
    const shape = new THREE.Shape();
    shape.moveTo(-0.35, 0);
    shape.lineTo(0.35, 0);
    shape.lineTo(0.12, 0.25);
    shape.lineTo(0.1, 0.85);
    shape.lineTo(-0.1, 0.85);
    shape.lineTo(-0.12, 0.25);
    shape.closePath();
    const g = new THREE.ExtrudeGeometry(shape, { depth: 2.4, bevelEnabled: false });
    g.translate(0, 0, -1.2);
    const barrier = new THREE.Mesh(g, concrete(0.6, 0.3));
    barrier.position.set(7.4, 0, 12.4);
    barrier.rotation.y = 1.25;
    barrier.castShadow = barrier.receiveShadow = true;
    scene.add(barrier);
  }

  /* ---- drooping cables from the slab to the facade ---- */
  const cableMat = new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6 });
  for (const [a, b, sag] of [
    [[-5.2, 6.1, outer + 0.1], [-2.3, 6.2, outer + 0.1], 0.9],
    [[2.8, DOOR.height + lintelH - 0.1, outer + lintelD], [6.6, 5.2, outer + 0.1], 1.3],
    [[3.1, DOOR.height + lintelH - 0.1, outer + lintelD], [6.0, 2.9, outer + 0.15], 0.4],
  ]) {
    const p0 = new THREE.Vector3(...a);
    const p2 = new THREE.Vector3(...b);
    const p1 = p0.clone().lerp(p2, 0.5);
    p1.y -= sag;
    const curve = new THREE.QuadraticBezierCurve3(p0, p1, p2);
    const m = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.025, 6), cableMat);
    m.castShadow = true;
    scene.add(m);
  }

  /* ---- flickering caged lamp on the left pillar ---- */
  const lamp = new THREE.Group();
  lamp.position.set(-(DOOR.halfW + pillarW / 2), 4.4, outer + pillarD + 0.02);
  scene.add(lamp);
  const lampMetal = new THREE.MeshStandardMaterial({ color: 0x2a2826, roughness: 0.7, metalness: 0.6 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.3, 0.08), lampMetal);
  lamp.add(base);
  const bulbMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.6, 0.25), toneMapped: false });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 12), bulbMat);
  bulb.position.z = 0.15;
  lamp.add(bulb);
  for (let i = 0; i < 4; i++) {
    const bar = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.008, 4, 16, Math.PI), lampMetal);
    bar.rotation.set(0, (i / 4) * Math.PI, Math.PI / 2);
    bar.position.z = 0.15;
    lamp.add(bar);
  }
  const lampLight = new THREE.PointLight(0xffa04a, 0, 9, 1.8);
  lampLight.position.set(0, -0.05, 0.4);
  lampLight.castShadow = true;
  lampLight.shadow.mapSize.set(512, 512);
  lamp.add(lampLight);
  let lampOn = 1;
  let lampTimer = 0;

  /* ---- moonlight + cold fill ---- */
  const moon = new THREE.SpotLight(0x8fa8d8, 140, 45, 0.55, 0.7, 1.2);
  moon.position.set(-9, 18, 24);
  moon.target.position.set(1, 0, outer + 2);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  moon.shadow.bias = -0.0004;
  moon.shadow.camera.near = 10;
  moon.shadow.camera.far = 50;
  scene.add(moon, moon.target);
  const skyFill = new THREE.PointLight(0x46587a, 12, 25, 1.4);
  skyFill.position.set(3, 5, outer + 9);
  scene.add(skyFill);

  const debris = new Debris(scene, audio, { halfW: DOOR.halfW, z: DOOR.z + 0.05 });

  return {
    debris,
    pillarW,
    lintelTop: DOOR.height + lintelH,
    lintelFront: outer + lintelD,
    update(dt, t) {
      debris.update(dt);
      // sodium lamp: mostly on, with nervous flicker bursts and occasional dropouts
      lampTimer -= dt;
      if (lampTimer <= 0) {
        const r = Math.random();
        if (r < 0.55) { lampOn = 1; lampTimer = rand(0.8, 4); }
        else if (r < 0.85) { lampOn = -1; lampTimer = rand(0.25, 0.9); if (audio) audio.crackle(0.35); }
        else { lampOn = 0; lampTimer = rand(0.3, 1.5); }
      }
      let k = lampOn === 1 ? 1 : lampOn === 0 ? 0.04 : (Math.random() < 0.5 ? 1 : 0.05);
      k *= 0.92 + Math.sin(t * 120) * 0.04;
      lampLight.intensity = 14 * k;
      bulbMat.color.setRGB(1, 0.6, 0.25).multiplyScalar(0.25 + 2.5 * k);
    },
    resize() {
    },
  };
}
