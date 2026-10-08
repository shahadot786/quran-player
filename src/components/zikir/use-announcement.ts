"use client";

import { useEffect, useState } from "react";

// A screen reader would read every number of a fast count, so only the value it settles on is announced.
export function useAnnouncement(message: string, delay = 700) {
  const [spoken, setSpoken] = useState("");
  useEffect(() => {
    const timer = window.setTimeout(() => setSpoken(message), delay);
    return () => window.clearTimeout(timer);
  }, [message, delay]);
  return spoken;
}
