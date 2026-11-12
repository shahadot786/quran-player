import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./embed.css";

export const metadata: Metadata = {
  title: "Tilawah",
  robots: { index: false, follow: false },
};

export default function EmbedLayout({ children }: { children: ReactNode }) {
  return children;
}
