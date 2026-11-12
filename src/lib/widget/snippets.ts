import { embedEntries, embedUrl, hostFor, DEFAULT_SETTINGS, type Settings } from "@/lib/embed/build";

export type Snippets = Record<"script" | "iframe" | "resize" | "reactNative" | "flutter", string>;

/** Copy-ready examples written against the address the widget is served from and the builder's settings. */
export function snippets(origin: string, settings: Settings = DEFAULT_SETTINGS): Snippets {
  const web = hostFor(settings, "web");
  const app = hostFor(settings, "app");
  const attributes = [...embedEntries(settings), ["host", web]].map(([name, value]) => ` data-${name}="${value}"`).join("");
  const height = settings.size === "compact" ? "24rem" : "40rem";

  return {
    script: `<script src="${origin}/embed.js"${attributes}></script>`,
    iframe: `<iframe
  id="tilawah"
  src="${embedUrl(origin, settings, [["host", web]])}"
  title="Tilawah"
  allow="autoplay; encrypted-media"
  style="width:100%;max-width:36rem;height:${height};border:0"
></iframe>`,
    resize: `window.addEventListener("message", (event) => {
  if (event.origin !== "${origin}") return;
  if (event.data && event.data.type === "tilawah:resize") {
    document.getElementById("tilawah").style.height = event.data.height + "px";
  }
});`,
    reactNative: `import { Linking } from "react-native";
import { WebView } from "react-native-webview";

<WebView
  source={{ uri: "${embedUrl(origin, settings, [["host", app]])}" }}
  allowsInlineMediaPlayback
  mediaPlaybackRequiresUserAction={false}
  setSupportMultipleWindows={false}
  onShouldStartLoadWithRequest={(request) => {
    if (request.url.startsWith("${origin}/embed")) return true;
    Linking.openURL(request.url);
    return false;
  }}
  onMessage={(event) => {
    const message = JSON.parse(event.nativeEvent.data);
    if (message.type === "tilawah:open") Linking.openURL(message.url);
    if (message.type === "tilawah:resize") setHeight(message.height);
  }}
/>`,
    flutter: `final controller = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..addJavaScriptChannel('Tilawah', onMessageReceived: (message) {
    final data = jsonDecode(message.message);
    if (data['type'] == 'tilawah:open') launchUrl(Uri.parse(data['url']));
    if (data['type'] == 'tilawah:resize') {
      setState(() => height = (data['height'] as num).toDouble());
    }
  })
  ..loadRequest(Uri.parse('${embedUrl(origin, settings, [["host", app]])}'));

// In build(): SizedBox(height: height, child: WebViewWidget(controller: controller))`,
  };
}
