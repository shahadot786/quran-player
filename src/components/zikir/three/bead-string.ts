import { activeBead, beadRadius, beadStep, ringOffset, shouldSnap } from "@/lib/zikir/beads";
import { smoothDamp, type Spring } from "@/lib/zikir/motion";
import type { SceneBuilder, SceneState } from "./types";

const LOOP_RADIUS = 2.9;
const TILT = -0.75;
const SMOOTH_SECONDS = 0.12;
const GOLD = 0xd4a83f;

const PALETTE = {
  light: { bead: 0x1f5c48, active: 0x2e8a6c, thread: 0x8a948f },
  dark: { bead: 0x6fbf9d, active: 0xa6e3c8, thread: 0x5f6b66 },
};

// A misbaha seen at an angle: one bead per count of the target, with a gold marker bead and a tassel. Each count turns the loop by one bead.
export const buildBeadString: SceneBuilder = ({ THREE, scene, camera, dark, beads: beadCount, still }) => {
  camera.position.set(0, 0.5, 13.6);
  camera.lookAt(0, 0, 0);

  const root = new THREE.Group();
  root.rotation.x = TILT;
  scene.add(root);
  const ring = new THREE.Group();
  root.add(ring);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x445248, 1.1));
  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(3, 5, 7);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xfff1d0, 0.7);
  rim.position.set(-4, -2, -5);
  scene.add(rim);

  const beadMaterial = new THREE.MeshStandardMaterial({ roughness: 0.3, metalness: 0.2 });
  const activeMaterial = new THREE.MeshStandardMaterial({ roughness: 0.25, metalness: 0.3, emissive: new THREE.Color(GOLD), emissiveIntensity: 0.18 });
  const markerMaterial = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.28, metalness: 0.75 });
  const threadMaterial = new THREE.MeshStandardMaterial({ roughness: 0.8 });

  ring.add(new THREE.Mesh(new THREE.TorusGeometry(LOOP_RADIUS, 0.03, 8, 128), threadMaterial));

  const radius = beadRadius(beadCount, LOOP_RADIUS);
  const beadGeometry = new THREE.SphereGeometry(radius, 28, 20);
  const step = beadStep(beadCount);
  const beads = Array.from({ length: beadCount }, (_, index) => {
    const bead = new THREE.Mesh(beadGeometry, index === 0 ? markerMaterial : beadMaterial);
    const angle = index * step;
    bead.position.set(Math.cos(angle) * LOOP_RADIUS, Math.sin(angle) * LOOP_RADIUS, 0);
    if (index === 0) bead.scale.setScalar(1.35);
    ring.add(bead);
    return bead;
  });

  const tassel = new THREE.Group();
  tassel.position.copy(beads[0]!.position);
  tassel.rotation.z = -Math.PI / 2;
  const tasselMaterial = new THREE.MeshStandardMaterial({ color: GOLD, roughness: 0.6 });
  // Local +y points away from the loop; the cone is turned so its point meets the bead and it flares outward like a tassel.
  const tasselScale = Math.max(0.6, radius / 0.2);
  const tasselCone = new THREE.Mesh(new THREE.ConeGeometry(0.17 * tasselScale, 0.62 * tasselScale, 16), tasselMaterial);
  tasselCone.position.y = 0.5 * tasselScale;
  tasselCone.rotation.z = Math.PI;
  tassel.add(tasselCone);
  ring.add(tassel);

  let state: SceneState = { count: 0, target: null, ratio: null, complete: false };
  let spring: Spring = { value: ringOffset(0, beadCount), velocity: 0 };
  let goal = spring.value;
  let active = activeBead(0, beadCount);
  let pulse = 0;
  let celebrate = 0;
  let previousActive = -1;

  const setDark = (isDark: boolean) => {
    const colours = isDark ? PALETTE.dark : PALETTE.light;
    beadMaterial.color.set(colours.bead);
    activeMaterial.color.set(colours.active);
    threadMaterial.color.set(colours.thread);
  };
  setDark(dark);

  return {
    setDark,
    setState: (next) => {
      const becameComplete = next.complete && !state.complete;
      state = next;
      goal = ringOffset(next.count, beadCount);
      if (still || shouldSnap(spring.value, goal, beadCount)) spring = { value: goal, velocity: 0 };
      active = activeBead(next.count, beadCount);
      if (becameComplete && !still) celebrate = 1;
    },
    pulse: () => {
      if (!still) pulse = 1;
    },
    update: (dt) => {
      spring = smoothDamp(spring, goal, SMOOTH_SECONDS, dt);
      ring.rotation.z = spring.value;
      pulse = Math.max(0, pulse - dt * 6);
      celebrate = Math.max(0, celebrate - dt * 1.1);
      root.scale.setScalar(1 + pulse * 0.025);
      beadMaterial.emissive.set(GOLD);
      beadMaterial.emissiveIntensity = celebrate * 0.7;

      if (active !== previousActive) {
        if (previousActive > 0) beads[previousActive]!.material = beadMaterial;
        if (active > 0) beads[active]!.material = activeMaterial;
        previousActive = active;
      }
      beads.forEach((bead, index) => {
        if (index === 0) return;
        const target = index === active ? 1.22 : 1;
        bead.scale.setScalar(still ? target : bead.scale.x + (target - bead.scale.x) * Math.min(1, dt * 18));
      });
      return Math.abs(goal - spring.value) > 0.0005 || Math.abs(spring.velocity) > 0.0005 || pulse > 0 || celebrate > 0;
    },
  };
};
