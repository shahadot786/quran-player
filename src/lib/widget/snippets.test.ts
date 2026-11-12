import { describe, expect, it } from "vitest";
import { DEFAULT_SETTINGS } from "@/lib/embed/build";
import { snippets } from "./snippets";

const origin = "https://tilawah.example";

describe("snippets", () => {
  const all = snippets(origin);

  it("point every example at the given origin and nowhere else", () => {
    for (const [name, text] of Object.entries(all)) {
      expect(text, name).toContain(origin);
      expect([...text.matchAll(/https?:\/\/[^\s"'/)]+/g)].every(([url]) => url === origin), name).toBe(true);
    }
  });

  it("give every example a host name to replace, and nothing else by default", () => {
    expect(all.script).toBe(`<script src="${origin}/embed.js" data-host="my-site"></script>`);
    expect(all.iframe).toContain(`src="${origin}/embed?host=my-site"`);
    expect(all.reactNative).toContain(`${origin}/embed?host=my-app`);
    expect(all.flutter).toContain(`${origin}/embed?host=my-app`);
  });

  it("use the message types the widget really sends", () => {
    expect(all.resize).toContain("tilawah:resize");
    expect(all.reactNative).toContain("tilawah:open");
    expect(all.flutter).toContain("'Tilawah'");
  });

  it("carry the builder's settings and the name given", () => {
    const custom = snippets(origin, { ...DEFAULT_SETTINGS, name: "https://www.Example.com/x", theme: "dark", size: "compact", accent: "#c2410c", radius: "lg" });
    expect(custom.script).toBe(`<script src="${origin}/embed.js" data-theme="dark" data-size="compact" data-accent="#c2410c" data-radius="lg" data-host="example.com"></script>`);
    expect(custom.iframe).toContain("theme=dark&size=compact&accent=%23c2410c&radius=lg&host=example.com");
    expect(custom.iframe).toContain("height:24rem");
    expect(custom.reactNative).toContain("host=example.com");
    expect(custom.flutter).toContain("theme=dark");
  });
});
