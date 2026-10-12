import * as THREE from "three";
import type { SceneBuilder, SceneController } from "./types";

const MAX_PIXEL_RATIO = 2;
const MAX_FRAME_SECONDS = 0.05;
const FOV = 30;

export type Host = { controller: SceneController; invalidate: () => void; dispose: () => void };

function disposeScene(scene: THREE.Scene) {
  scene.traverse((object) => {
    if (!(object instanceof THREE.Mesh)) return;
    object.geometry.dispose();
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
  });
}

// Owns the renderer and the frame loop. It draws only while something is moving, and not at all when hidden or scrolled away.
export function mountScene(parent: HTMLElement, build: SceneBuilder, options: { dark: boolean; beads: number; still: boolean; onFail: () => void }): Host | null {
  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  } catch {
    options.onFail();
    return null;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement;
  canvas.style.cssText = "display:block;width:100%;height:100%";
  parent.appendChild(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(FOV, 1, 0.1, 100);
  const controller = build({ THREE, scene, camera, dark: options.dark, beads: options.beads, still: options.still });

  let frame = 0;
  let last = 0;
  let visible = true;
  let onScreen = true;

  const draw = (time: number) => {
    frame = 0;
    const dt = last === 0 ? 0 : Math.min(MAX_FRAME_SECONDS, (time - last) / 1000);
    last = time;
    const animating = controller.update(dt);
    renderer.render(scene, camera);
    if (animating) invalidate();
    else last = 0;
  };

  function invalidate() {
    if (frame === 0 && visible && onScreen) frame = requestAnimationFrame(draw);
  }

  const resize = () => {
    const width = parent.clientWidth;
    const height = parent.clientHeight;
    if (width === 0 || height === 0) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  };

  const resizeObserver = new ResizeObserver(resize);
  resizeObserver.observe(parent);
  const intersectionObserver = new IntersectionObserver(([entry]) => {
    onScreen = entry?.isIntersecting ?? true;
    invalidate();
  });
  intersectionObserver.observe(parent);
  const onVisibility = () => {
    visible = !document.hidden;
    invalidate();
  };
  const onContextLost = (event: Event) => {
    event.preventDefault();
    options.onFail();
  };
  document.addEventListener("visibilitychange", onVisibility);
  canvas.addEventListener("webglcontextlost", onContextLost);
  resize();

  return {
    controller,
    invalidate,
    dispose: () => {
      if (frame !== 0) cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("webglcontextlost", onContextLost);
      controller.dispose?.();
      disposeScene(scene);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
