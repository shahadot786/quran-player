"use client";

import { useEffect, type RefObject } from "react";
import { notifyHost } from "@/lib/embed/host-bridge";

/** Reports the height of the widget's own content, not the page, so a host can shrink the frame as well as grow it. */
export function useEmbedResize(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    let last = 0;
    const report = () => {
      const height = Math.ceil(element.getBoundingClientRect().height);
      if (height === last) return;
      last = height;
      notifyHost({ type: "tilawah:resize", height });
    };
    const observer = new ResizeObserver(report);
    observer.observe(element);
    report();
    return () => observer.disconnect();
  }, [ref]);
}
