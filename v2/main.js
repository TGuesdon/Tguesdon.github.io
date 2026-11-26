import * as THREE from 'three';
import { CSS3DRenderer, CSS3DObject } from 'three/addons/renderers/CSS3DRenderer.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { PROJECTS, PROFILE, ASSETS } from './content.js';
import { BaseAudio } from './audio.js';
import { buildExterior, rustCanvas, chippedHazardCanvas } from './exterior.js';

const audio = new BaseAudio();

/* ------------------------------------------------------------------ */
/* Constants & layout                                                  */
/* ------------------------------------------------------------------ */
const PX = 0.005; // world units per CSS pixel for CSS3D objects
const CYAN = new THREE.Color(0x00f0ff);
const ROOM = { halfW: 8, back: -5, front: 7.5, height: 7.5 };
const DOOR = { halfW: 4.2, height: 5.2, z: 7.15 };
const SCREEN = { w: 1000, h: 620, px: 0.0058, pos: new THREE.Vector3(0, 2.95, 0.2) };
const TANK_POS = new THREE.Vector3(-6.15, 0, -2.9);
const CONSOLE_POS = new THREE.Vector3(6.0, 2.65, -1.6);

const CAM_START = { pos: new THREE.Vector3(1.4, 2.4, 19.5), target: new THREE.Vector3(1.3, 3.0, 7.5), fov: 52 };
const CAM_END = { pos: new THREE.Vector3(0, 3.0, 6.4), target: new THREE.Vector3(0, 2.85, -0.5) };

const params = new URLSearchParams(location.search);
const MOBILE = () => innerWidth < 860 || innerWidth / innerHeight < 1.05;
let mobile = MOBILE();

/* ------------------------------------------------------------------ */
/* Renderer, scene, camera                                             */
/* ------------------------------------------------------------------ */
const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x06080b);
scene.fog = new THREE.Fog(0x080a0e, 15, 42);

const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
scene.environmentIntensity = 0.25;

const camera = new THREE.PerspectiveCamera(50, innerWidth / innerHeight, 0.05, 80);
camera.position.copy(CAM_START.pos);
const camTarget = CAM_START.target.clone();
camera.lookAt(camTarget);

// Two CSS3D layers:
//  - front (above the canvas): the hologram screen, which nothing ever covers;
//  - back (below the canvas): the project console. The WebGL scene punches a depth-tested,
//    fully transparent "hole" where the console is, so 3D objects in front of it still hide it.
const cssRenderer = new CSS3DRenderer({ element: document.getElementById('css3d') });
cssRenderer.setSize(innerWidth, innerHeight);
const cssScene = new THREE.Scene();
const cssBackRenderer = new CSS3DRenderer({ element: document.getElementById('css3d-back') });
cssBackRenderer.setSize(innerWidth, innerHeight);
const cssBackScene = new THREE.Scene();

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.6, 0.4, 0.7);
composer.addPass(bloom);
// keep the canvas alpha intact through the bloom blend (needed for the CSS "hole")
bloom.blendMaterial.blending = THREE.CustomBlending;
bloom.blendMaterial.blendSrc = THREE.OneFactor;
bloom.blendMaterial.blendDst = THREE.OneFactor;
bloom.blendMaterial.blendSrcAlpha = THREE.ZeroFactor;
bloom.blendMaterial.blendDstAlpha = THREE.OneFactor;
composer.addPass(new OutputPass());

/* ------------------------------------------------------------------ */
/* Small tween helper                                                  */
/* ------------------------------------------------------------------ */
const tweens = new Set();
const ease = {
  linear: (t) => t,
  inOutCubic: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
  outCubic: (t) => 1 - Math.pow(1 - t, 3),
  inOutSine: (t) => -(Math.cos(Math.PI * t) - 1) / 2,
};
function tween({ duration, delay = 0, easing = ease.inOutCubic, onUpdate }) {
  return new Promise((resolve) => {
    tweens.add({ start: performance.now() + delay * 1000, duration: duration * 1000, easing, onUpdate, resolve });
  });
}
function updateTweens(now) {
  for (const t of tweens) {
    if (now < t.start) continue;
    const p = Math.min(1, (now - t.start) / t.duration);
    t.onUpdate(t.easing(p), p);
    if (p >= 1) {
      tweens.delete(t);
      t.resolve();
    }
  }
}
const wait = (s) => new Promise((r) => setTimeout(r, s * 1000));

/* ------------------------------------------------------------------ */
/* Procedural textures                                                 */
/* ------------------------------------------------------------------ */
function makeCanvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  return [c, c.getContext('2d')];
}
function noise(ctx, size, amount, alpha = 0.06) {
  for (let i = 0; i < amount; i++) {
    const v = Math.random() * 255;
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha})`;
    ctx.fillRect(Math.random() * size, Math.random() * size, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
}
function brushed(ctx, size, alpha = 0.035) {
  for (let i = 0; i < 400; i++) {
    const v = Math.random() > 0.5 ? 255 : 0;
    ctx.strokeStyle = `rgba(${v},${v},${v},${alpha * Math.random()})`;
    ctx.beginPath();
    const y = Math.random() * size;
    ctx.moveTo(0, y);
    ctx.lineTo(size, y + (Math.random() - 0.5) * 4);
    ctx.stroke();
  }
}
function texFromCanvas(c, repeat = [1, 1], srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(...repeat);
  t.anisotropy = renderer.capabilities.getMaxAnisotropy();
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function hexWallTexture() {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = '#3a3d40';
  ctx.fillRect(0, 0, size, size);
  brushed(ctx, size);
  const r = size / 4;
  const h = Math.sqrt(3) * r;
  const hex = (cx, cy, rr) => {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (Math.PI / 3) * i;
      ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    ctx.closePath();
  };
  for (let col = -1; col < 4; col++) {
    for (let row = -1; row < 4; row++) {
      const cx = col * r * 1.5 * 1.333;
      const cy = row * h * 1.333 * 0.5 * 2 + (col % 2 ? (h * 1.333) / 2 : 0);
      hex(cx, cy, r * 0.62);
      const g = ctx.createLinearGradient(cx, cy - r, cx, cy + r);
      g.addColorStop(0, '#2b2e31');
      g.addColorStop(1, '#232527');
      ctx.fillStyle = g;
      ctx.fill();
      ctx.lineWidth = 3;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      ctx.stroke();
    }
  }
  noise(ctx, size, 6000);
  return texFromCanvas(c, [4, 2]);
}

function panelTexture(base = '#34373a', lines = 'rgba(0,0,0,0.55)') {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, size, size);
  brushed(ctx, size, 0.05);
  ctx.strokeStyle = lines;
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, size - 4, size - 4);
  ctx.beginPath();
  ctx.moveTo(0, size * 0.62);
  ctx.lineTo(size, size * 0.62);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.07)';
  ctx.lineWidth = 2;
  ctx.strokeRect(6, 6, size - 12, size - 12);
  // rivets
  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  for (const [x, y] of [[20, 20], [size - 20, 20], [20, size - 20], [size - 20, size - 20]]) {
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  noise(ctx, size, 5000);
  return texFromCanvas(c);
}

function floorTexture() {
  const size = 512;
  const [c, ctx] = makeCanvas(size);
  ctx.fillStyle = '#1d1f21';
  ctx.fillRect(0, 0, size, size);
  // diamond plate pattern
  ctx.fillStyle = 'rgba(255,255,255,0.045)';
  for (let y = 0; y < size; y += 32) {
    for (let x = (y / 32) % 2 ? 16 : 0; x < size; x += 32) {
      ctx.save();
      ctx.translate(x + 8, y + 8);
      ctx.rotate(((y / 32) % 2 ? 1 : -1) * Math.PI / 4);
      ctx.fillRect(-9, -2, 18, 4);
      ctx.restore();
    }
  }
  ctx.strokeStyle = 'rgba(0,0,0,0.8)';
  ctx.lineWidth = 6;
  ctx.strokeRect(0, 0, size, size);
  noise(ctx, size, 8000, 0.05);
  return texFromCanvas(c, [8, 6]);
}

function hazardTexture() {
  const [c, ctx] = makeCanvas(256);
  ctx.fillStyle = '#d8b400';
  ctx.fillRect(0, 0, 256, 256);
  ctx.fillStyle = '#111';
  for (let i = -256; i < 512; i += 64) {
    ctx.beginPath();
    ctx.moveTo(i, 0);
    ctx.lineTo(i + 32, 0);
    ctx.lineTo(i + 32 + 256, 256);
    ctx.lineTo(i + 256, 256);
    ctx.fill();
  }
  noise(ctx, 256, 3000, 0.12);
  return texFromCanvas(c);
}

function doorTexture() {
  const [c, ctx] = makeCanvas(512);
  ctx.fillStyle = '#585c60';
  ctx.fillRect(0, 0, 512, 512);
  brushed(ctx, 512, 0.08);
  noise(ctx, 512, 6000, 0.08);
  // dirt gradient at the bottom
  const g = ctx.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, 'rgba(0,0,0,0)');
  g.addColorStop(1, 'rgba(20,15,5,0.35)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 512, 512);
  return texFromCanvas(c);
}

function glowSprite() {
  const [c, ctx] = makeCanvas(64);
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.6)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return texFromCanvas(c);
}

function nameplateTexture() {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 160;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#0b0f12';
  ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = '#00e5ff';
  ctx.lineWidth = 3;
  ctx.strokeRect(6, 6, 500, 148);
  ctx.fillStyle = '#00f0ff';
  ctx.textAlign = 'center';
  ctx.font = '700 34px Orbitron, sans-serif';
  ctx.fillText(PROFILE.name.toUpperCase(), 256, 60);
  ctx.font = '26px "Share Tech Mono", monospace';
  ctx.fillText(PROFILE.role.toUpperCase(), 256, 108);
  ctx.fillStyle = 'rgba(0,240,255,0.08)';
  for (let y = 0; y < 160; y += 4) ctx.fillRect(0, y, 512, 1);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ------------------------------------------------------------------ */
/* Materials                                                           */
/* ------------------------------------------------------------------ */
const mats = {
  wall: new THREE.MeshStandardMaterial({ map: hexWallTexture(), roughness: 0.75, metalness: 0.55 }),
  panel: new THREE.MeshStandardMaterial({ map: panelTexture(), roughness: 0.6, metalness: 0.6 }),
  floor: new THREE.MeshStandardMaterial({ map: floorTexture(), roughness: 0.45, metalness: 0.7 }),
  darkMetal: new THREE.MeshStandardMaterial({ color: 0x1c1f22, roughness: 0.35, metalness: 0.9 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x9aa1a8, roughness: 0.28, metalness: 1.0 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xd6dbe0, roughness: 0.12, metalness: 1.0 }),
  hazard: new THREE.MeshStandardMaterial({ map: hazardTexture(), roughness: 0.6, metalness: 0.2 }),
  door: new THREE.MeshStandardMaterial({ map: doorTexture(), roughness: 0.55, metalness: 0.75 }),
  neon: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.5), toneMapped: false }),
  neonSoft: new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.0), toneMapped: false }),
  ceilingLight: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.9, 0.97, 1).multiplyScalar(0.15), toneMapped: false }),
  amber: new THREE.MeshBasicMaterial({ color: new THREE.Color(1, 0.45, 0.05), toneMapped: false }),
};
const sprite = glowSprite();

function box(w, h, d, mat, x = 0, y = 0, z = 0, parent = scene) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}
function cyl(rt, rb, h, mat, x = 0, y = 0, z = 0, parent = scene, seg = 48, open = false) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg, 1, open), mat);
  m.position.set(x, y, z);
  m.castShadow = m.receiveShadow = true;
  parent.add(m);
  return m;
}

/* ------------------------------------------------------------------ */
/* Room                                                                */
/* ------------------------------------------------------------------ */
const roomDepth = ROOM.front - ROOM.back;
const roomMidZ = (ROOM.front + ROOM.back) / 2;
{
  // interior floor (the outside ground is built in exterior.js)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, roomDepth), mats.floor);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0, 0, roomMidZ);
  floor.receiveShadow = true;
  scene.add(floor);

  // ceiling
  const ceil = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, roomDepth), mats.panel.clone());
  ceil.material.map = panelTexture('#1d2023');
  ceil.material.map.repeat.set(6, 5);
  ceil.rotation.x = Math.PI / 2;
  ceil.position.set(0, ROOM.height, roomMidZ);
  ceil.castShadow = true;
  scene.add(ceil);

  // back wall (hexagons)
  const back = new THREE.Mesh(new THREE.PlaneGeometry(ROOM.halfW * 2, ROOM.height), mats.wall);
  back.position.set(0, ROOM.height / 2, ROOM.back);
  back.receiveShadow = true;
  scene.add(back);

  // side walls (panels)
  for (const s of [-1, 1]) {
    const m = mats.panel.clone();
    m.map = mats.panel.map.clone();
    m.map.repeat.set(5, 2.5);
    m.map.needsUpdate = true;
    const wall = new THREE.Mesh(new THREE.PlaneGeometry(roomDepth, ROOM.height), m);
    wall.rotation.y = -s * Math.PI / 2;
    wall.position.set(s * ROOM.halfW, ROOM.height / 2, roomMidZ);
    wall.receiveShadow = true;
    scene.add(wall);
  }

  // skirting neon strip along the back & sides
  box(ROOM.halfW * 2, 0.03, 0.03, mats.neonSoft, 0, 0.12, ROOM.back + 0.05);
  for (const s of [-1, 1]) box(0.03, 0.03, roomDepth, mats.neonSoft, s * (ROOM.halfW - 0.05), 0.12, roomMidZ);

  // ceiling beams + light strips
  for (let i = 0; i < 4; i++) {
    const z = ROOM.back + 1.8 + i * 3;
    box(ROOM.halfW * 2, 0.35, 0.45, mats.darkMetal, 0, ROOM.height - 0.18, z);
    box(ROOM.halfW * 1.4, 0.05, 0.16, mats.ceilingLight, 0, ROOM.height - 0.38, z);
  }

  // back wall details: vertical pipes and a horizontal conduit
  for (const x of [-7.2, -6.8, 6.9]) cyl(0.08, 0.08, ROOM.height, mats.metal, x, ROOM.height / 2, ROOM.back + 0.25, scene, 16);
  cyl(0.1, 0.1, ROOM.halfW * 2, mats.darkMetal, 0, 6.3, ROOM.back + 0.25, scene, 16).rotation.z = Math.PI / 2;

  // door guide rails (inside)
  for (const s of [-1, 1]) box(0.18, DOOR.height + 0.4, 0.25, mats.darkMetal, s * (DOOR.halfW + 0.05), (DOOR.height + 0.4) / 2, DOOR.z - 0.05);
}

const ext = buildExterior({ scene, renderer, ROOM, DOOR, sprite, audio });

/* ------------------------------------------------------------------ */
/* Garage door, crank, beacon                                          */
/* ------------------------------------------------------------------ */
const door = new THREE.Group();
scene.add(door);
{
  const slatH = 0.29;
  const count = Math.ceil(DOOR.height / slatH);
  const rustTex = texFromCanvas(rustCanvas());
  const hazardTex = texFromCanvas(chippedHazardCanvas());
  hazardTex.repeat.set(6, 1);
  for (let i = 0; i < count; i++) {
    const y = slatH / 2 + i * slatH;
    // each slat shows its own horizontal slice of the door texture, so the stencil reads across slats
    const map = rustTex.clone();
    map.repeat.set(1, slatH / (count * slatH));
    map.offset.set(0, i / count);
    const mat = i === 0
      ? new THREE.MeshStandardMaterial({ map: hazardTex, roughness: 0.85, metalness: 0.3 })
      : new THREE.MeshStandardMaterial({ map, bumpMap: map, bumpScale: 1.5, roughness: 0.8, metalness: 0.55 });
    box(DOOR.halfW * 2 + 0.1, slatH + 0.01, 0.08, mat, 0, y, DOOR.z, door);
    // groove
    box(DOOR.halfW * 2 + 0.1, 0.02, 0.1, mats.darkMetal, 0, y + slatH / 2 - 0.01, DOOR.z, door);
  }
  // handle bar
  box(1.2, 0.06, 0.08, mats.chrome, 0, 0.75, DOOR.z + 0.1, door);
}

const crank = new THREE.Group();
const crankPivot = new THREE.Group();
crank.position.set(5.75, 1.75, ROOM.front + 0.28);
scene.add(crank);
crank.add(crankPivot);
{
  // wall mount plate + gearbox
  const plate = box(0.9, 1.2, 0.08, mats.darkMetal, 0, -0.2, 0, crank);
  plate.position.z = -0.02;
  const gear = cyl(0.26, 0.26, 0.18, mats.metal, 0, 0, 0.08, crank, 32);
  gear.rotation.x = Math.PI / 2;
  // chain to ceiling-ish
  box(0.05, 3.5, 0.05, mats.metal, 0, 1.9, 0.02, crank);
  // the crank arm + handle (rotates)
  const hub = cyl(0.09, 0.09, 0.12, mats.chrome, 0, 0, 0.2, crankPivot, 24);
  hub.rotation.x = Math.PI / 2;
  box(0.08, 0.6, 0.06, mats.chrome, 0, 0.27, 0.25, crankPivot);
  const handleMat = mats.chrome.clone();
  const handle = cyl(0.05, 0.05, 0.3, handleMat, 0, 0.55, 0.38, crankPivot, 16);
  handle.rotation.x = Math.PI / 2;
  crank.userData.handleMat = handleMat;
  // small status led
  crank.userData.led = cyl(0.04, 0.04, 0.03, mats.amber.clone(), 0.32, -0.6, 0.04, crank, 12);
  crank.userData.led.rotation.x = Math.PI / 2;
}

// warning beacon above the door
const beacon = new THREE.Group();
beacon.position.set(2.4, ext.lintelTop + 0.12, ext.lintelFront - 0.35);
scene.add(beacon);
const beaconMat = mats.amber.clone();
cyl(0.16, 0.2, 0.1, mats.darkMetal, 0, -0.08, 0, beacon, 24);
const beaconDome = cyl(0.13, 0.15, 0.2, beaconMat, 0, 0.07, 0, beacon, 24);
const beaconLight = new THREE.PointLight(0xff7a10, 0, 9, 2);
beaconLight.position.set(0, 0, 0.4);
beacon.add(beaconLight);

/* ------------------------------------------------------------------ */
/* Bacta tank                                                          */
/* ------------------------------------------------------------------ */
const tank = new THREE.Group();
tank.position.copy(TANK_POS);
scene.add(tank);

const TANK = { r: 1.05, y0: 0.7, y1: 4.5 };
const tankUniforms = { uTime: { value: 0 }, uPower: { value: 0.35 } };
let avatar;
const bubbles = {};
{
  // base
  cyl(1.35, 1.55, 0.45, mats.darkMetal, 0, 0.225, 0, tank, 64);
  cyl(1.25, 1.35, 0.25, mats.metal, 0, 0.575, 0, tank, 64);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.2, 0.025, 8, 96), mats.neon);
  ring.rotation.x = Math.PI / 2;
  ring.position.y = TANK.y0 + 0.02;
  tank.add(ring);
  // control panel on the base front
  box(0.7, 0.22, 0.05, mats.neonSoft, 0, 0.25, 1.47, tank).rotation.x = -0.2;

  // cap
  cyl(1.25, 1.25, 0.3, mats.metal, 0, TANK.y1 + 0.15, 0, tank, 64);
  cyl(1.0, 1.3, 0.35, mats.darkMetal, 0, TANK.y1 + 0.47, 0, tank, 64);
  const ring2 = ring.clone();
  ring2.position.y = TANK.y1 - 0.02;
  tank.add(ring2);
  // pipes to the ceiling
  for (const [x, z] of [[-0.45, -0.2], [0.5, 0.1], [0, -0.55]]) {
    cyl(0.11, 0.11, ROOM.height - TANK.y1 - 0.6, mats.metal, x, (ROOM.height + TANK.y1 + 0.6) / 2, z, tank, 16);
    cyl(0.15, 0.15, 0.12, mats.darkMetal, x, TANK.y1 + 0.7, z, tank, 16);
  }

  // vertical struts
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    box(0.08, TANK.y1 - TANK.y0, 0.08, mats.chrome, Math.cos(a) * (TANK.r + 0.08), (TANK.y0 + TANK.y1) / 2, Math.sin(a) * (TANK.r + 0.08), tank);
  }

  // liquid (custom additive shader)
  const liquidMat = new THREE.ShaderMaterial({
    uniforms: tankUniforms,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    vertexShader: /* glsl */ `
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vY;
      void main(){
        vUv = uv; vY = position.y;
        vec4 mv = modelViewMatrix * vec4(position,1.0);
        vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uPower;
      varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vY;
      void main(){
        float fres = pow(1.0 - abs(dot(vN, vV)), 2.2);
        float waves = sin(vUv.y*28.0 - uTime*1.6 + sin(vUv.x*25.0+uTime)*0.8)*0.5+0.5;
        float caust = sin(vUv.x*60.0 + uTime*0.7)*sin(vUv.y*40.0 - uTime*1.1);
        float bottom = smoothstep(0.35, 0.0, vUv.y);
        vec3 col = vec3(0.05, 0.75, 0.85);
        float a = (0.10 + fres*0.55 + waves*0.05 + caust*0.03 + bottom*0.25) * uPower;
        gl_FragColor = vec4(col * a, a);
      }`,
  });
  const liquidH = TANK.y1 - TANK.y0 - 0.25;
  const liquid = new THREE.Mesh(new THREE.CylinderGeometry(TANK.r - 0.02, TANK.r - 0.02, liquidH, 64, 1, true), liquidMat);
  liquid.position.y = TANK.y0 + liquidH / 2;
  liquid.renderOrder = 2;
  tank.add(liquid);
  // liquid surface
  const surf = new THREE.Mesh(new THREE.CircleGeometry(TANK.r - 0.02, 64), liquidMat);
  surf.rotation.x = -Math.PI / 2;
  surf.position.y = TANK.y0 + liquidH;
  surf.renderOrder = 2;
  tank.add(surf);

  // glass
  const glass = new THREE.Mesh(
    new THREE.CylinderGeometry(TANK.r, TANK.r, TANK.y1 - TANK.y0, 64, 1, true),
    new THREE.MeshPhysicalMaterial({
      color: 0xcfffff, roughness: 0.04, metalness: 0, transparent: true, opacity: 0.14,
      clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 3, depthWrite: false, side: THREE.FrontSide,
    }),
  );
  glass.position.y = (TANK.y0 + TANK.y1) / 2;
  glass.renderOrder = 3;
  tank.add(glass);

  // avatar billboard (placeholder until a real 3D model is provided)
  const tex = new THREE.TextureLoader().load(`${ASSETS}images/3d.PNG`, () => assetLoaded());
  tex.colorSpace = THREE.SRGBColorSpace;
  const ah = 3.0;
  avatar = new THREE.Mesh(
    new THREE.PlaneGeometry(ah * (305 / 607), ah),
    new THREE.MeshBasicMaterial({ map: tex, alphaTest: 0.45, color: new THREE.Color(0.55, 0.92, 1.0) }),
  );
  avatar.position.y = TANK.y0 + 0.2 + ah / 2;
  tank.add(avatar);

  // bubbles
  const N = 120;
  const pos = new Float32Array(N * 3);
  const speed = new Float32Array(N);
  for (let i = 0; i < N; i++) {
    const a = Math.random() * Math.PI * 2;
    const r = Math.sqrt(Math.random()) * (TANK.r - 0.1);
    pos[i * 3] = Math.cos(a) * r;
    pos[i * 3 + 1] = TANK.y0 + Math.random() * liquidH;
    pos[i * 3 + 2] = Math.sin(a) * r;
    speed[i] = 0.25 + Math.random() * 0.6;
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({
    map: sprite, size: 0.05, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    color: new THREE.Color(0.6, 1.4, 1.6),
  }));
  pts.renderOrder = 4;
  tank.add(pts);
  Object.assign(bubbles, { pos, speed, geo: g, top: TANK.y0 + liquidH, N });

  // name plate above the tank
  const plate = new THREE.Mesh(
    new THREE.PlaneGeometry(1.8, 0.56),
    new THREE.MeshBasicMaterial({ map: nameplateTexture(), toneMapped: false }),
  );
  plate.position.set(0, TANK.y1 + 1.05, 0.95);
  tank.add(plate);
  box(1.9, 0.66, 0.06, mats.darkMetal, 0, TANK.y1 + 1.05, 0.91, tank);
  document.fonts?.ready.then(() => {
    plate.material.map = nameplateTexture();
    plate.material.needsUpdate = true;
  });
}
const tankLight = new THREE.PointLight(0x00e8ff, 6, 7, 1.6);
tankLight.position.set(TANK_POS.x, 2.4, TANK_POS.z + 0.2);
scene.add(tankLight);

/* ------------------------------------------------------------------ */
/* Hologram projector: pylons, beams, glowing backplate                */
/* ------------------------------------------------------------------ */
const holoUniforms = { uTime: { value: 0 }, uPower: { value: 0 } };
const SW = SCREEN.w * SCREEN.px;
const SH = SCREEN.h * SCREEN.px;
{
  const pylonX = SW / 2 + 0.75;
  for (const s of [-1, 1]) {
    const g = new THREE.Group();
    g.position.set(s * pylonX, 0, SCREEN.pos.z);
    scene.add(g);
    box(0.8, 0.25, 0.8, mats.darkMetal, 0, 0.125, 0, g);
    box(0.55, 0.15, 0.55, mats.metal, 0, 0.32, 0, g);
    const col = box(0.32, 5.1, 0.32, mats.metal, 0, 2.85, 0, g);
    col.material = mats.chrome;
    box(0.4, 0.2, 0.4, mats.darkMetal, 0, 5.45, 0, g);
    // inner neon strips
    box(0.03, 4.3, 0.06, mats.neon, -s * 0.17, 2.8, 0.08, g);
    box(0.03, 4.3, 0.06, mats.neon, -s * 0.17, 2.8, -0.08, g);
    // emitter head
    const emitter = box(0.22, 0.7, 0.22, mats.darkMetal, -s * 0.24, SCREEN.pos.y, 0, g);
    box(0.02, 0.55, 0.12, mats.neon, -s * 0.36, SCREEN.pos.y, 0, g);
    const glow = new THREE.Sprite(new THREE.SpriteMaterial({
      map: sprite, color: new THREE.Color(0.1, 0.7, 0.85), blending: THREE.AdditiveBlending, depthWrite: false, transparent: true,
    }));
    glow.scale.set(0.6, 1.1, 1);
    glow.position.set(-s * 0.4, SCREEN.pos.y, 0);
    g.add(glow);
    g.userData = { emitter, glow };

    // beam fan from the emitter to the screen edge
    const ex = s * (pylonX - 0.38);
    const sx = s * (SW / 2);
    const y = SCREEN.pos.y;
    const z = SCREEN.pos.z;
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute([
      ex, y - 0.25, z, sx, y - SH / 2, z, sx, y + SH / 2, z, ex, y + 0.25, z,
    ], 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute([0, 0, 1, 0, 1, 1, 0, 1], 2));
    geo.setIndex([0, 1, 2, 0, 2, 3]);
    const beam = new THREE.Mesh(geo, new THREE.ShaderMaterial({
      uniforms: holoUniforms,
      transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
      vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: /* glsl */ `
        uniform float uTime; uniform float uPower; varying vec2 vUv;
        void main(){
          float fall = mix(1.0, 0.25, vUv.x);
          float stripes = 0.6 + 0.4*sin(vUv.y*80.0 + uTime*3.0);
          float pulse = 0.85 + 0.15*sin(uTime*7.0 + vUv.x*10.0);
          float edge = smoothstep(0.0, 0.15, vUv.y) * smoothstep(1.0, 0.85, vUv.y);
          float a = 0.28 * fall * stripes * pulse * edge * uPower;
          gl_FragColor = vec4(vec3(0.0,0.9,1.0)*a*1.6, a);
        }`,
    }));
    beam.renderOrder = 5;
    scene.add(beam);
  }

  // glowing backplate (rendered in WebGL so it blooms; the readable text is CSS3D on top)
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(SW + 0.08, SH + 0.08), new THREE.ShaderMaterial({
    uniforms: holoUniforms,
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: `varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uTime; uniform float uPower; varying vec2 vUv;
      float rand(vec2 c){ return fract(sin(dot(c, vec2(12.9898,78.233))) * 43758.5453); }
      void main(){
        vec2 d = min(vUv, 1.0 - vUv);
        float border = 1.0 - smoothstep(0.0, 0.012, min(d.x * 1.6, d.y));
        float inner = 0.05 + 0.02*sin(vUv.y*600.0 - uTime*8.0);
        float sweep = smoothstep(0.03, 0.0, abs(fract(vUv.y - uTime*0.12) - 0.5)) * 0.08;
        float flick = 0.94 + 0.06*rand(vec2(floor(uTime*24.0), 1.0));
        float a = (border*0.9 + inner + sweep) * uPower * flick;
        gl_FragColor = vec4(vec3(0.0,0.85,1.0)*a*1.4, a);
      }`,
  }));
  plate.position.copy(SCREEN.pos).add(new THREE.Vector3(0, 0, -0.02));
  plate.renderOrder = 5;
  scene.add(plate);

  // base console between the pylons
  box(SW + 1.2, 0.35, 0.9, mats.darkMetal, 0, 0.175, SCREEN.pos.z);
  box(SW + 0.6, 0.04, 0.04, mats.neon, 0, 0.37, SCREEN.pos.z + 0.38);
}
const holoLight = new THREE.PointLight(0x00e5ff, 0, 9, 1.5);
holoLight.position.set(0, SCREEN.pos.y, SCREEN.pos.z + 1.2);
scene.add(holoLight);

/* ------------------------------------------------------------------ */
/* Project console (right) – physical housing                          */
/* ------------------------------------------------------------------ */
const CONSOLE = { w: 400, h: 620 };
const consoleGroup = new THREE.Group();
consoleGroup.position.copy(CONSOLE_POS);
consoleGroup.rotation.y = -0.5;
scene.add(consoleGroup);
{
  const w = CONSOLE.w * PX;
  const h = CONSOLE.h * PX;
  box(w + 0.25, h + 0.25, 0.14, mats.darkMetal, 0, 0, -0.1, consoleGroup);
  box(w + 0.05, 0.03, 0.03, mats.neon, 0, h / 2 + 0.1, -0.01, consoleGroup);
  box(w + 0.05, 0.03, 0.03, mats.neon, 0, -h / 2 - 0.1, -0.01, consoleGroup);
  // stand
  box(0.18, CONSOLE_POS.y - h / 2, 0.18, mats.metal, 0, -(CONSOLE_POS.y + h / 2) / 2, -0.15, consoleGroup);
  box(0.9, 0.08, 0.6, mats.darkMetal, 0, -CONSOLE_POS.y + 0.04, -0.15, consoleGroup);
  // on desktop: transparent depth-writing hole where the (behind-canvas) CSS console shows through
  const fill = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    mobile
      ? new THREE.MeshBasicMaterial({ color: 0x02080b })
      : new THREE.MeshBasicMaterial({ color: 0x000000, opacity: 0, blending: THREE.NoBlending, fog: false, toneMapped: false }),
  );
  fill.position.z = 0;
  consoleGroup.add(fill);
}

/* ------------------------------------------------------------------ */
/* Interior lights                                                     */
/* ------------------------------------------------------------------ */
const hemi = new THREE.HemisphereLight(0xa8c8ff, 0x101010, 0.08);
scene.add(hemi);
const interior = [];
function addSpot(color, intensity, pos, target, angle = Math.PI / 5) {
  const l = new THREE.SpotLight(color, 0, 18, angle, 0.55, 1.4);
  l.position.copy(pos);
  l.target.position.copy(target);
  l.castShadow = true;
  l.shadow.mapSize.set(1024, 1024);
  l.shadow.bias = -0.0005;
  scene.add(l, l.target);
  interior.push({ light: l, max: intensity });
  return l;
}
addSpot(0xdff4ff, 70, new THREE.Vector3(0, ROOM.height - 0.4, 2.5), new THREE.Vector3(0, 0, -1.2), Math.PI / 4);
addSpot(0xc8f6ff, 55, new THREE.Vector3(TANK_POS.x + 0.5, ROOM.height - 0.4, TANK_POS.z + 1.5), TANK_POS);
addSpot(0xdff4ff, 45, new THREE.Vector3(CONSOLE_POS.x - 1, ROOM.height - 0.4, CONSOLE_POS.z + 2), new THREE.Vector3(CONSOLE_POS.x, 0, CONSOLE_POS.z));
const fillLight = new THREE.PointLight(0x8fb8d0, 0, 20, 1.2);
fillLight.position.set(0, 4, 4);
scene.add(fillLight);
interior.push({ light: fillLight, max: 8 });

function setInteriorPower(p) {
  for (const { light, max } of interior) light.intensity = max * p;
  mats.ceilingLight.color.setRGB(0.9, 0.97, 1).multiplyScalar(0.15 + p * 2.2);
  hemi.intensity = 0.08 + p * 0.25;
  tankUniforms.uPower.value = 0.35 + p * 0.65;
  tankLight.userData.base = 3 + p * 6;
}
setInteriorPower(0);

/* ------------------------------------------------------------------ */
/* DOM: hologram screen + project console                              */
/* ------------------------------------------------------------------ */
const ICONS = {
  mail: '<svg viewBox="0 0 24 24"><path d="M3 5h18v14H3z" fill="none" stroke="currentColor" stroke-width="2"/><path d="m3 6 9 7 9-7" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  github: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.04-.71.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.76 2.7 1.25 3.36.96.1-.75.4-1.25.73-1.54-2.55-.29-5.24-1.28-5.24-5.68 0-1.25.45-2.28 1.19-3.08-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.8 1.19 1.83 1.19 3.08 0 4.41-2.7 5.38-5.26 5.67.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24"><path fill="currentColor" d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9.5h4V21H3zM9.5 9.5h3.8v1.6h.06c.53-1 1.83-2.06 3.76-2.06 4.02 0 4.76 2.65 4.76 6.08V21h-4v-5.2c0-1.24-.02-2.84-1.73-2.84-1.73 0-2 1.35-2 2.75V21h-4z"/></svg>',
};

const screenEl = document.createElement('div');
screenEl.className = 'holo';
screenEl.style.width = `${SCREEN.w}px`;
screenEl.style.height = `${SCREEN.h}px`;
screenEl.innerHTML = `
  <header class="holo-head">
    <span class="dot"></span><span>HOLO-LINK // <b class="status">STANDBY</b></span>
    <span class="grow"></span><span class="idx"></span>
  </header>
  <div class="holo-body" tabindex="0"><article></article></div>
  <footer class="holo-foot">
    <button type="button" class="nav prev" aria-label="Previous project">&lsaquo; PREV</button>
    <div class="readout"><b></b><i></i></div>
    <button type="button" class="nav next" aria-label="Next project">NEXT &rsaquo;</button>
  </footer>`;

const consoleEl = document.createElement('div');
consoleEl.className = 'console';
consoleEl.style.width = `${CONSOLE.w}px`;
consoleEl.style.height = `${CONSOLE.h}px`;
consoleEl.innerHTML = `
  <div class="console-head">
    <div class="who">${PROFILE.name}</div>
    <div class="role">${PROFILE.role}</div>
  </div>
  <div class="console-label">// PROJECT ARCHIVE</div>
  <nav class="list">${PROJECTS.map((p, i) => `
    <button type="button" data-id="${p.id}"><span class="n">${String(i + 1).padStart(2, '0')}</span>${p.label}</button>`).join('')}
  </nav>
  <div class="socials">${PROFILE.socials.map((s) => `
    <a href="${s.href}" target="_blank" rel="noopener" aria-label="${s.label}" title="${s.label}">${ICONS[s.icon]}</a>`).join('')}
  </div>`;

let screenObj, consoleObj;
if (mobile) {
  document.body.classList.add('mobile');
  const overlay = document.getElementById('overlay');
  overlay.append(consoleEl, screenEl);
} else {
  // wrap so CSS animations on .holo don't fight the CSS3D transform
  const wrapS = document.createElement('div');
  wrapS.className = 'css3d-wrap';
  wrapS.append(screenEl);
  const wrapC = document.createElement('div');
  wrapC.className = 'css3d-wrap';
  wrapC.append(consoleEl);
  screenObj = new CSS3DObject(wrapS);
  screenObj.position.copy(SCREEN.pos);
  screenObj.scale.setScalar(SCREEN.px);
  cssScene.add(screenObj);
  consoleObj = new CSS3DObject(wrapC);
  consoleObj.position.copy(CONSOLE_POS);
  consoleObj.rotation.y = consoleGroup.rotation.y;
  consoleObj.scale.setScalar(PX);
  cssBackScene.add(consoleObj);
}

const article = screenEl.querySelector('article');
const body = screenEl.querySelector('.holo-body');
let current = -1;

function renderProject(i, { instant = false } = {}) {
  i = (i + PROJECTS.length) % PROJECTS.length;
  if (i === current) return;
  current = i;
  const p = PROJECTS[i];
  const apply = () => {
    article.innerHTML = `
      <h1>${p.title}</h1>
      ${p.subtitle.map((s) => `<div class="sub">${s}</div>`).join('')}
      <div class="content">${p.html}</div>`;
    body.scrollTop = 0;
    screenEl.querySelector('.idx').textContent = `${String(i + 1).padStart(2, '0')} / ${String(PROJECTS.length).padStart(2, '0')}`;
    screenEl.querySelector('.readout b').textContent = p.label.toUpperCase();
    screenEl.querySelector('.readout i').textContent = `${String(i + 1).padStart(2, '0')} : ${String(PROJECTS.length).padStart(2, '0')}`;
  };
  consoleEl.querySelectorAll('.list button').forEach((b) => b.classList.toggle('active', b.dataset.id === p.id));
  history.replaceState(null, '', `#/${p.id}`);
  if (instant) return apply();
  audio.blip();
  screenEl.classList.remove('glitch');
  void screenEl.offsetWidth;
  screenEl.classList.add('glitch');
  holoUniforms.uPower.value = 0.4;
  setTimeout(apply, 140);
  tween({ duration: 0.5, delay: 0.15, easing: ease.outCubic, onUpdate: (t) => (holoUniforms.uPower.value = 0.4 + 0.6 * t) });
}

consoleEl.querySelector('.list').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-id]');
  if (b) renderProject(PROJECTS.findIndex((p) => p.id === b.dataset.id));
});
screenEl.querySelector('.prev').addEventListener('click', () => renderProject(current - 1));
screenEl.querySelector('.next').addEventListener('click', () => renderProject(current + 1));

// lightbox for screenshots
const lightbox = document.getElementById('lightbox');
article.addEventListener('click', (e) => {
  const img = e.target.closest('img');
  if (!img) return;
  lightbox.querySelector('img').src = img.src;
  lightbox.hidden = false;
});
lightbox.addEventListener('click', () => (lightbox.hidden = true));

const startId = location.hash.replace(/^#\/?/, '');
renderProject(Math.max(0, PROJECTS.findIndex((p) => p.id === startId)), { instant: true });

/* ------------------------------------------------------------------ */
/* Intro sequence                                                      */
/* ------------------------------------------------------------------ */
let state = 'loading';
const hint = document.getElementById('hint');
const hintText = document.getElementById('hint-text');
const skipBtn = document.getElementById('skip');
const introUI = document.getElementById('intro-ui');
const ring = document.getElementById('crank-ring');
const ringFill = ring.querySelector('.fill');
const RING_LEN = 2 * Math.PI * 46;
ringFill.style.strokeDasharray = RING_LEN;

let pending = 1;
function assetLoaded() {
  if (--pending > 0) return;
  document.getElementById('loader').classList.add('done');
  if (params.has('skip')) return finishIntro();
  state = 'intro';
  introUI.classList.add('visible');
}

/* ---------------- Crank QTE ----------------
   The visitor grabs the crank and draws circles (clockwise) around it.
   Each turn raises the door a bit; if they stop, the door slowly slides back down. */
const CRANK_TURNS = 4; // full turns needed to open the door
const crankState = {
  progress: 0, angle: 0, grabbing: false, lastAngle: 0, lastTurn: 0, clickAcc: 0, speed: 0,
  // the door doesn't follow the crank smoothly: it sticks, then lurches (stick-slip)
  doorLevel: 0, joltFrom: 0, joltT: 1, joltUp: true, shake: 0,
  push: 0, camPush: 0, // camera creeps closer at each lurch (never moves back)
  tilt: 0, tiltFrom: 0, tiltTo: 0, jolts: 0, // the door jams crooked now and then
};
const JOLT_STEP = 0.14; // how much crank progress builds up before the door lurches
const JOLT_TIME = 0.3;
const easeOutBack = (x) => 1 + 2.4 * Math.pow(x - 1, 3) + 1.4 * Math.pow(x - 1, 2);

function crankScreenCenter() {
  const v = crank.localToWorld(new THREE.Vector3(0, 0, 0.2)).project(camera);
  return { x: (v.x * 0.5 + 0.5) * innerWidth, y: (-v.y * 0.5 + 0.5) * innerHeight };
}
function crankScreenRadius() {
  const c = crankScreenCenter();
  const v = crank.localToWorld(new THREE.Vector3(0, 0.6, 0.2)).project(camera);
  return Math.max(60, Math.hypot((v.x * 0.5 + 0.5) * innerWidth - c.x, (-v.y * 0.5 + 0.5) * innerHeight - c.y) * 1.35);
}

function turnCrank(delta) {
  // delta in radians, positive = clockwise on screen
  if (delta <= 0) return;
  const cs = crankState;
  cs.angle += delta;
  cs.progress = Math.min(1, cs.progress + delta / (CRANK_TURNS * Math.PI * 2));
  cs.lastTurn = performance.now();
  cs.speed = Math.min(1, cs.speed + delta * 0.6);
  cs.clickAcc += delta;
  while (cs.clickAcc > 0.45) {
    cs.clickAcc -= 0.45;
    audio.click(0.6 + Math.random() * 0.4);
  }
}

const rnd = (a, b) => a + Math.random() * (b - a);
function jolt(to) {
  const cs = crankState;
  const up = to > cs.doorLevel;
  cs.joltFrom = doorShown();
  cs.tiltFrom = cs.tilt;
  cs.doorLevel = to;
  cs.joltT = 0;
  cs.joltUp = up;
  cs.shake = 1;
  if (up) {
    cs.jolts++;
    cs.push = Math.min(1.4, cs.push + 0.22);
    // jams crooked mostly in the first lurches, then straightens as it frees itself
    const side = Math.random() < 0.5 ? -1 : 1;
    if (to >= 1) cs.tiltTo = 0;
    else if (cs.jolts <= 3) cs.tiltTo = Math.random() < 0.75 ? side * rnd(0.035, 0.07) : 0;
    else cs.tiltTo = Math.random() < 0.2 ? side * rnd(0.01, 0.025) : 0;
    // clods of earth heaped at the foot of the door get shoved out, only at the very beginning
    const chunks = [0, 7, 5][cs.jolts] || 0;
    if (chunks) ext.debris.burst(chunks);
  } else {
    cs.tiltTo = Math.random() < 0.5 ? (Math.random() < 0.5 ? -1 : 1) * rnd(0.02, 0.045) : cs.tilt;
  }
  audio.jolt(up ? 1 : 0.7);
}
function doorShown() {
  const cs = crankState;
  const k = Math.min(1, cs.joltT);
  const e = cs.joltUp ? easeOutBack(k) : ease.outCubic(k);
  cs.tilt = cs.tiltFrom + (cs.tiltTo - cs.tiltFrom) * e;
  return cs.joltFrom + (cs.doorLevel - cs.joltFrom) * e;
}
const camDir = new THREE.Vector3();
if (params.has('debug')) window.__debug = { crankState, door, ext };

function updateCrank(dt, t) {
  if (state !== 'intro') return;
  const cs = crankState;
  const idle = performance.now() - cs.lastTurn > 450;
  // door slips back down when the visitor stops cranking
  if (idle && cs.progress > 0) {
    const back = dt * 0.09;
    cs.progress = Math.max(0, cs.progress - back);
    cs.angle -= back * CRANK_TURNS * Math.PI * 2;
  }
  cs.speed = Math.max(0, cs.speed - dt * 2.5);
  audio.setRumble(cs.speed > 0.05 && !idle ? 0.08 + cs.speed * 0.25 : 0);

  // stick-slip: lurch up once enough tension built up, drop when it slipped back far enough
  if (cs.joltT >= 1) {
    if (cs.progress >= 1 && cs.doorLevel < 1) jolt(1);
    else if (cs.progress - cs.doorLevel >= JOLT_STEP) jolt(cs.progress);
    else if (cs.doorLevel - cs.progress >= JOLT_STEP) jolt(cs.progress);
  }
  cs.joltT += dt / JOLT_TIME;
  if (cs.doorLevel >= 1 && cs.joltT >= 1.4) return enterBase();
  const shown = doorShown();

  crankPivot.rotation.z = -cs.angle;
  // crooked door pivots on its lower corner, so the low side stays on its level
  door.rotation.z = cs.tilt;
  door.position.y = shown * (DOOR.height + 0.2) + Math.abs(Math.sin(cs.tilt)) * DOOR.halfW;
  door.position.x = Math.sin(t * 70) * 0.03 * cs.shake;
  cs.shake *= Math.exp(-dt * 5);
  setInteriorPower(shown * 0.22);

  // camera: a slight zoom-in at each lurch that stays (no recoil)
  cs.camPush += (cs.push - cs.camPush) * (1 - Math.exp(-dt * 7));
  camDir.subVectors(CAM_START.target, CAM_START.pos).normalize();
  camera.position.copy(CAM_START.pos).addScaledVector(camDir, cs.camPush);

  // beacon: idle blink, spins faster while the door moves
  const active = cs.progress > 0;
  const f = active ? 0.5 + 0.5 * Math.sin(t * 9) : Math.sin(t * 3) > 0.6 ? 1 : 0.15;
  beaconMat.color.setRGB(1, 0.45, 0.05).multiplyScalar(0.4 + f * (active ? 2.6 : 1.6));
  beaconLight.intensity = f * (active ? 22 : 6);
  const led = active ? [0.1, 2, 0.4] : [1, 0.45, 0.05];
  crank.userData.led.material.color.setRGB(...led).multiplyScalar(Math.sin(t * 6) > 0 || active ? 1.5 : 0.4);

  // on-screen ring around the crank
  const c = crankScreenCenter();
  const r = crankScreenRadius();
  ring.style.transform = `translate(${c.x - r}px, ${c.y - r}px)`;
  ring.style.width = ring.style.height = `${r * 2}px`;
  ringFill.style.strokeDashoffset = RING_LEN * (1 - cs.progress);
  ring.classList.toggle('active', cs.grabbing);
  hintText.textContent = cs.grabbing || cs.progress > 0.02
    ? (idle ? 'Keep turning — the door is slipping!' : `Opening… ${Math.round(cs.progress * 100)}%`)
    : 'Grab the crank and turn it clockwise';
}

async function enterBase() {
  if (state !== 'intro') return;
  state = 'opening';
  crankState.grabbing = false;
  document.body.style.cursor = '';
  introUI.classList.remove('visible');
  audio.setRumble(0);
  audio.doorSlam();
  audio.stopWind(5);
  crank.userData.led.material.color.setRGB(0.1, 2, 0.4);

  // finish the roll-up and let the beacon wind down
  const y0 = door.position.y;
  const r0 = door.rotation.z;
  tween({
    duration: 0.5, easing: ease.outCubic,
    onUpdate: (t) => {
      door.position.y = y0 + t * 0.3;
      door.rotation.z = r0 * (1 - t);
    },
  }).then(() => (door.visible = false));
  tween({
    duration: 1.6, easing: ease.linear,
    onUpdate: (_, p) => {
      const f = 0.5 + 0.5 * Math.sin(p * 30);
      beaconLight.intensity = 22 * f * (1 - p);
      beaconMat.color.setRGB(1, 0.45, 0.05).multiplyScalar(0.4 + 2.6 * f * (1 - p));
    },
  });
  tween({ duration: 1.5, onUpdate: (t) => setInteriorPower(0.22 + t * 0.08) });

  // walk in — the warehouse ambience fades in as we cross the threshold
  await wait(0.6);
  audio.startAmbience(4.5);
  const fromPos = camera.position.clone();
  const fromTarget = camTarget.clone();
  const fromFov = camera.fov;
  await tween({
    duration: 3.6, easing: ease.inOutCubic,
    onUpdate: (t) => {
      camera.position.lerpVectors(fromPos, CAM_END.pos, t);
      camera.position.y += Math.sin(t * Math.PI * 4) * 0.025 * (1 - t);
      camTarget.lerpVectors(fromTarget, CAM_END.target, t);
      camera.fov = THREE.MathUtils.lerp(fromFov, endFov, t);
      camera.updateProjectionMatrix();
    },
  });
  await powerOn();
}

async function powerOn() {
  // flickering neon power-up, each flicker crackles
  const steps = [0.6, 0.1, 0.8, 0.3, 1];
  for (const s of steps) {
    setInteriorPower(s);
    if (s > 0.5) audio.crackle(0.8);
    await wait(0.07 + Math.random() * 0.08);
  }
  await wait(0.25);
  // hologram boots
  audio.zap();
  document.body.classList.add('holo-on');
  screenEl.querySelector('.status').textContent = 'ACTIVE';
  await tween({
    duration: 1.1, easing: ease.outCubic,
    onUpdate: (t) => {
      holoUniforms.uPower.value = t * (0.8 + 0.2 * Math.random());
      holoLight.intensity = t * 5;
    },
  });
  holoUniforms.uPower.value = 1;
  state = 'ready';
}

function finishIntro() {
  tweens.clear();
  door.visible = false;
  introUI.classList.remove('visible');
  document.body.style.cursor = '';
  camera.position.copy(CAM_END.pos);
  camTarget.copy(CAM_END.target);
  camera.fov = endFov;
  camera.updateProjectionMatrix();
  setInteriorPower(1);
  beaconLight.intensity = 0;
  beaconMat.color.setRGB(0.2, 0.08, 0);
  document.body.classList.add('holo-on');
  screenEl.querySelector('.status').textContent = 'ACTIVE';
  holoUniforms.uPower.value = 1;
  holoLight.intensity = 5;
  state = 'ready';
  audio.setRumble(0);
  audio.stopWind(1);
  if (audio.ctx) audio.startAmbience(2);
}
skipBtn.addEventListener('click', () => {
  audio.init();
  finishIntro();
});

/* ---------------- Sound toggle ---------------- */
const soundBtn = document.getElementById('sound');
const syncSoundBtn = () => {
  soundBtn.classList.toggle('off', audio.muted);
  soundBtn.setAttribute('aria-pressed', String(!audio.muted));
  soundBtn.title = audio.muted ? 'Sound off' : 'Sound on';
};
syncSoundBtn();
soundBtn.addEventListener('click', () => {
  audio.init();
  audio.setMuted(!audio.muted);
  if (state === 'ready') audio.startAmbience(1.5);
  syncSoundBtn();
});
// any first interaction unlocks audio (needed when arriving with ?skip)
const unlock = () => {
  audio.init();
  if (state === 'intro') audio.startWind();
  if (state === 'ready') audio.startAmbience(2);
};
addEventListener('pointerdown', unlock, { once: true });
addEventListener('keydown', unlock, { once: true });

/* ------------------------------------------------------------------ */
/* Interaction                                                         */
/* ------------------------------------------------------------------ */
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const mouse = new THREE.Vector2();
const parallax = new THREE.Vector2();

function setPointer(e) {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
}
function nearCrank(e) {
  // generous hit zone: the crank mesh, or anywhere inside the on-screen ring
  setPointer(e);
  raycaster.setFromCamera(pointer, camera);
  if (raycaster.intersectObject(crank, true).length) return true;
  const c = crankScreenCenter();
  return Math.hypot(e.clientX - c.x, e.clientY - c.y) < crankScreenRadius();
}
const pointerAngle = (e) => {
  const c = crankScreenCenter();
  return Math.atan2(e.clientY - c.y, e.clientX - c.x); // screen space: increasing = clockwise
};

addEventListener('pointermove', (e) => {
  setPointer(e);
  mouse.copy(pointer);
  if (state !== 'intro') return;
  const cs = crankState;
  if (cs.grabbing) {
    const a = pointerAngle(e);
    let d = a - cs.lastAngle;
    if (d > Math.PI) d -= Math.PI * 2;
    if (d < -Math.PI) d += Math.PI * 2;
    cs.lastAngle = a;
    turnCrank(d);
    return;
  }
  const hover = nearCrank(e);
  document.body.style.cursor = hover ? 'grab' : '';
  crank.userData.handleMat.emissive.setRGB(0, hover ? 0.5 : 0, hover ? 0.6 : 0);
});
addEventListener('pointerdown', (e) => {
  if (state !== 'intro' || e.target.closest?.('button')) return;
  if (!nearCrank(e)) return;
  audio.init();
  audio.startWind();
  crankState.grabbing = true;
  crankState.lastAngle = pointerAngle(e);
  document.body.style.cursor = 'grabbing';
  e.preventDefault();
});
addEventListener('pointerup', () => {
  if (!crankState.grabbing) return;
  crankState.grabbing = false;
  document.body.style.cursor = '';
});
addEventListener('keydown', (e) => {
  // keyboard fallback: mash Space / Enter
  if (state === 'intro' && (e.key === 'Enter' || e.key === ' ')) {
    e.preventDefault();
    audio.init();
    audio.startWind();
    turnCrank(0.55);
  }
  if (state === 'ready') {
    if (e.key === 'ArrowRight') renderProject(current + 1);
    if (e.key === 'ArrowLeft') renderProject(current - 1);
  }
  if (e.key === 'Escape') lightbox.hidden = true;
});

/* ------------------------------------------------------------------ */
/* Resize & loop                                                       */
/* ------------------------------------------------------------------ */
let endFov = 50;
// tan(horizontal half-FOV) wanted for each phase; converted to a vertical FOV for the current aspect
const vfovFor = (tanH, aspect, max) => THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(tanH / aspect)), 40, max);
function fitCamera() {
  const aspect = innerWidth / innerHeight;
  camera.aspect = aspect;
  endFov = vfovFor(mobile ? 0.55 : 0.92, aspect, mobile ? 80 : 68);
  CAM_START.fov = vfovFor(0.8, aspect, 95);
  if (state === 'ready') camera.fov = endFov;
  else if (state !== 'opening') camera.fov = CAM_START.fov;
  camera.updateProjectionMatrix();
}
function onResize() {
  renderer.setSize(innerWidth, innerHeight);
  composer.setSize(innerWidth, innerHeight);
  bloom.setSize(innerWidth, innerHeight);
  cssRenderer.setSize(innerWidth, innerHeight);
  cssBackRenderer.setSize(innerWidth, innerHeight);
  ext.resize();
  fitCamera();
}
addEventListener('resize', onResize);
fitCamera();

const clock = new THREE.Clock();
const tmp = new THREE.Vector3();
function loop(now) {
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;
  updateTweens(now);

  tankUniforms.uTime.value = t;
  holoUniforms.uTime.value = t;

  // avatar floats gently and faces the camera on the Y axis
  avatar.position.y = TANK.y0 + 0.2 + 1.5 + Math.sin(t * 0.9) * 0.06;
  avatar.rotation.z = Math.sin(t * 0.6) * 0.015;
  tmp.copy(camera.position);
  tank.worldToLocal(tmp);
  avatar.rotation.y = Math.atan2(tmp.x, tmp.z);

  // bubbles
  const { pos, speed, top, N } = bubbles;
  for (let i = 0; i < N; i++) {
    pos[i * 3 + 1] += speed[i] * dt;
    pos[i * 3] += Math.sin(t * 3 + i) * 0.002;
    if (pos[i * 3 + 1] > top) pos[i * 3 + 1] = TANK.y0 + 0.05;
  }
  bubbles.geo.attributes.position.needsUpdate = true;

  // tank light shimmer
  tankLight.intensity = tankLight.userData.base * (1 + Math.sin(t * 13) * 0.04 + Math.sin(t * 2.1) * 0.06);

  ext.update(dt, t);
  updateCrank(dt, t);

  // subtle mouse parallax once inside
  if (state === 'ready') {
    parallax.lerp(mouse, 0.04);
    camera.position.set(CAM_END.pos.x + parallax.x * 0.35, CAM_END.pos.y + parallax.y * 0.18, CAM_END.pos.z);
  }
  camera.lookAt(camTarget);

  composer.render();
  if (!mobile) {
    cssRenderer.render(cssScene, camera);
    cssBackRenderer.render(cssBackScene, camera);
  }
  requestAnimationFrame(loop);
}
requestAnimationFrame(loop);
