import { describe, expect, it } from "vitest";
import { siteLink } from "./links";

describe("siteLink", () => {
  it("opens the Quran player and says it came from the widget", () => {
    const url = new URL(siteLink("/player", null));
    expect(url.pathname).toBe("/player");
    expect(url.searchParams.get("utm_source")).toBe("widget");
    expect(url.searchParams.has("utm_medium")).toBe(false);
  });

  it("names the host that sent the visitor", () => {
    expect(new URL(siteLink("/player", "metrokoi.com")).searchParams.get("utm_medium")).toBe("metrokoi.com");
  });

  it("can point at the home page", () => {
    expect(new URL(siteLink("/", "my-app")).pathname).toBe("/");
  });
});
