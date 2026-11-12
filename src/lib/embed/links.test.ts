import { describe, expect, it } from "vitest";
import { detailsUrl } from "./links";

describe("detailsUrl", () => {
  it("points at the home page when no surah is playing", () => {
    const url = new URL(detailsUrl({ host: null }));
    expect(url.pathname).toBe("/");
    expect(url.searchParams.get("utm_source")).toBe("widget");
    expect(url.searchParams.has("utm_medium")).toBe(false);
  });

  it("points at the playing surah and names the host", () => {
    const url = new URL(detailsUrl({ surah: 36, host: "metrokoi.com" }));
    expect(url.pathname).toBe("/surahs/36");
    expect(url.searchParams.get("utm_medium")).toBe("metrokoi.com");
  });
});
