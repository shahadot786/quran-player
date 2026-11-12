import { describe, expect, it } from "vitest";
import { embedStyleVars } from "./theme";

describe("embedStyleVars", () => {
  it("sets only the radius when no colours are given", () => {
    expect(embedStyleVars({ colors: {}, radius: "md" })).toEqual({ "--radius": "0.75rem" });
  });

  it("maps each colour to the tokens the components read", () => {
    const vars = embedStyleVars({ colors: { accent: "#13756a", bg: "#eef6f3", card: "#ffffff", text: "#10251f" }, radius: "lg" }) as Record<string, string>;
    expect(vars["--primary"]).toBe("#13756a");
    expect(vars["--primary-foreground"]).toBe("#ffffff");
    expect(vars["--ring"]).toBe("#13756a");
    expect(vars["--background"]).toBe("#eef6f3");
    expect(vars["--card"]).toBe("#ffffff");
    expect(vars["--popover"]).toBe("#ffffff");
    expect(vars["--foreground"]).toBe("#10251f");
    expect(vars["--radius"]).toBe("1rem");
  });

  it("puts dark text on a light accent", () => {
    expect((embedStyleVars({ colors: { accent: "#ffe08a" }, radius: "sm" }) as Record<string, string>)["--primary-foreground"]).toBe("#000000");
  });
});
