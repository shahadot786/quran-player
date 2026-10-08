"use client";

import { useSyncExternalStore } from "react";
import { isWebGLAvailable } from "@/lib/zikir/webgl";

let cached: boolean | null = null;
const subscribe = () => () => undefined;

// null while rendering on the server, then true or false; asked once, since each check opens a short-lived GPU context.
export function useWebGL(): boolean | null {
  return useSyncExternalStore(subscribe, () => (cached ??= isWebGLAvailable()), () => null);
}
