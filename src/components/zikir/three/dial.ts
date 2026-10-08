import { litTicks } from "@/lib/zikir/beads";
import { smoothDamp, type Spring } from "@/lib/zikir/motion";
import type { SceneBuilder, SceneState } from "./types";

const TICKS = 60;
const FACE_RADIUS = 2.15;
const BEZEL_RADIUS = 2.4;
const TICK_RADIUS = 1.9;
const ARC_RADIUS = 1.62;
const PRESS_DEPTH = 0.26;
const TILT = -0.32;
const GOLD = 0xd4a83f;

const PALETTE = {
  light: { face: 0xe6efeb, tickOff: 0xb7c4be, arc: GOLD, done: 0x1f5c48 },
  dark: { face: 0x13221d, tickOff: 0x2c3d37, arc: GOLD, done: 0x6fbf9d },
};

// A tasbih counter dial: a gold bezel, a face with 60 ticks that light up with the count, and an arc that fills toward the target.
export const buildDial: SceneBuilder = ({ THREE, scene, camera, dark }) => {
  camera.position.set(0, 0, 11.8);
  camera.lookAt(0, 0, 0);

  const root = new THREE.Group();
  root.rotation.x = TILT;
  scene.add(root);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x445248, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 5, 8);
  scene.add(key);

  const bezelMaterial = new THREE.MeshStandardMaterial({ color: GOLD, metalness: 0.85, roughness: 0.28 });
  root.add(new THREE.Mesh(new THREE.TorusGeometry(BEZEL_RADIUS, 0.2, 24, 128), bezelMaterial));

  const faceMaterial = new THREE.MeshStandardMaterial({ roughness: 0.45, metalness: 0.1 });
  const face = new THREE.Mesh(new THREE.CylinderGeometry(FACE_RADIUS, FACE_RADIUS, 0.35, 72), faceMaterial);
  face.rotation.x = Math.PI / 2;
  root.add(face);

  const tickOff = new THREE.MeshStandardMaterial({ roughness: 0.6 });
  const tickOn = new THREE.MeshStandardMaterial({ color: GOLD, emissive: new THREE.Color(GOLD), emissiveIntensity: 0.55, roughness: 0.4 });
  const tickGeometry = new THREE.BoxGeometry(0.06, 0.22, 0.08);
  const ticks = Array.from({ length: TICKS }, (_, index) => {
    const angle = Math.PI / 2 - (index / TICKS) * Math.PI * 2;
    const tick = new THREE.Mesh(tickGeometry, tickOff);
    tick.position.set(Math.cos(angle) * TICK_RADIUS, Math.sin(angle) * TICK_RADIUS, 0.2);
    tick.rotation.z = angle - Math.PI / 2;
    root.add(tick);
    return tick;
  });

  const arcMaterial = new THREE.MeshStandardMaterial({ roughness: 0.35, metalness: 0.3, emissive: new THREE.Color(GOLD), emissiveIntensity: 0.25 });
  let arc: InstanceType<typeof THREE.Mesh> | null = null;
  let arcRatio = -1;

  let state: SceneState = { count: 0, target: null, ratio: null, complete: false };
  let press: Spring = { value: 0, velocity: 0 };
  let pressGoal = 0;
  let celebrate = 0;
  let lit = -1;
  let colours = dark ? PALETTE.dark : PALETTE.light;

  const setArc = (ratio: number) => {
    if (ratio === arcRatio) return;
    arcRatio = ratio;
    if (arc) {
      root.remove(arc);
      arc.geometry.dispose();
      arc = null;
    }
    if (ratio <= 0) return;
    const angle = Math.min(1, ratio) * Math.PI * 2;
    arc = new THREE.Mesh(new THREE.TorusGeometry(ARC_RADIUS, 0.07, 14, 128, angle), arcMaterial);
    // A torus arc starts at 3 o'clock and runs anticlockwise, so turning it by (quarter turn - angle) ends it at 12 o'clock.
    arc.rotation.z = Math.PI / 2 - angle;
    arc.position.z = 0.22;
    root.add(arc);
  };

  const paint = () => {
    faceMaterial.color.set(colours.face);
    tickOff.color.set(colours.tickOff);
    arcMaterial.color.set(state.complete ? colours.done : colours.arc);
  };
  paint();

  return {
    setDark: (isDark) => {
      colours = isDark ? PALETTE.dark : PALETTE.light;
      paint();
    },
    setState: (next) => {
      const becameComplete = next.complete && !state.complete;
      state = next;
      if (becameComplete) celebrate = 1;
      const filled = next.complete ? 1 : (next.ratio ?? 0);
      setArc(filled);
      const nowLit = next.complete ? TICKS : litTicks(next.ratio, TICKS);
      if (nowLit !== lit) {
        lit = nowLit;
        ticks.forEach((tick, index) => {
          tick.material = index < lit ? tickOn : tickOff;
        });
      }
      paint();
    },
    pulse: () => {
      pressGoal = PRESS_DEPTH;
    },
    update: (dt) => {
      if (pressGoal > 0 && press.value > PRESS_DEPTH * 0.9) pressGoal = 0;
      press = smoothDamp(press, pressGoal, 0.05, dt);
      face.position.z = -press.value;
      celebrate = Math.max(0, celebrate - dt * 1.1);
      bezelMaterial.emissive.set(GOLD);
      bezelMaterial.emissiveIntensity = celebrate * 0.5;
      return pressGoal > 0 || press.value > 0.002 || Math.abs(press.velocity) > 0.002 || celebrate > 0;
    },
    dispose: () => {
      arc?.geometry.dispose();
      arcMaterial.dispose();
      tickOn.dispose();
    },
  };
};
