import { describe, expect, it } from "vitest";
import { hostFromReferrer } from "./host";

describe("hostFromReferrer", () => {
  it("returns the embedding site's host name", () => {
    expect(hostFromReferrer("https://www.MetroKoi.com/app/more/prayer?x=1", "tilawah.shahadot.dev")).toBe("metrokoi.com");
  });

  it("ignores an empty or broken referrer and the widget's own site", () => {
    expect(hostFromReferrer("", "tilawah.shahadot.dev")).toBeNull();
    expect(hostFromReferrer("not a url", "tilawah.shahadot.dev")).toBeNull();
    expect(hostFromReferrer("https://tilawah.shahadot.dev/surahs", "tilawah.shahadot.dev")).toBeNull();
  });
});
