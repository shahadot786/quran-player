import type * as ThreeNamespace from "three";

export type Three = typeof ThreeNamespace;

export type SceneState = { count: number; target: number | null; ratio: number | null; complete: boolean };

export type SceneController = {
  setState: (state: SceneState) => void;
  setDark: (dark: boolean) => void;
  /** Called on every count, for the little press animation. */
  pulse: () => void;
  /** Advances animations by `dt` seconds and says whether any are still running. */
  update: (dt: number) => boolean;
  dispose?: () => void;
};

export type SceneContext = { THREE: Three; scene: ThreeNamespace.Scene; camera: ThreeNamespace.PerspectiveCamera; dark: boolean };
export type SceneBuilder = (context: SceneContext) => SceneController;
