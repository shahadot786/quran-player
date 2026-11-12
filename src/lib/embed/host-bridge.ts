export type HostMessage = { type: "tilawah:resize"; height: number } | { type: "tilawah:open"; url: string };

type Bridges = {
  ReactNativeWebView?: { postMessage: (text: string) => void };
  Tilawah?: { postMessage: (text: string) => void };
};

/** Tells whatever embeds the widget: a parent page (iframe), React Native, or a Flutter/Android channel named Tilawah. */
export function notifyHost(message: HostMessage) {
  if (typeof window === "undefined") return;
  const text = JSON.stringify(message);
  const bridges = window as unknown as Bridges;
  bridges.ReactNativeWebView?.postMessage(text);
  bridges.Tilawah?.postMessage(text);
  if (window.parent !== window) window.parent.postMessage(message, "*");
}
