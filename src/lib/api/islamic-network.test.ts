import { describe, expect, it } from "vitest";
import editions from "@/data/islamic-network.json";
import { islamicNetworkReciters, toIslamicNetworkReciter } from "./islamic-network";

describe("islamic.network editions", () => {
  it("maps an edition to a stream-only, unpadded, complete recitation", () => {
    const reciter = toIslamicNetworkReciter({ id: 200001, identifier: "ar.husarymujawwad", name: "Husary (Mujawwad)" });
    expect(reciter.name).toBe("Husary");
    expect(reciter.moshafs[0]).toMatchObject({
      id: 200001,
      name: "Mujawwad",
      server: "https://cdn.islamic.network/quran/audio-surah/128/ar.husarymujawwad/",
      padded: false,
      downloadable: false,
    });
    expect(reciter.moshafs[0]!.surahs).toHaveLength(114);
  });

  it("defaults the recitation name and capitalises variants", () => {
    expect(toIslamicNetworkReciter({ id: 1, identifier: "x", name: "Ahmed Saber" }).moshafs[0]!.name).toBe("Murattal");
    expect(toIslamicNetworkReciter({ id: 1, identifier: "x", name: "Azazi (with children)" }).moshafs[0]!.name).toBe("With children");
  });

  it("bundles editions with unique ids clear of the other sources", () => {
    const ids = editions.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(Math.min(...ids)).toBeGreaterThan(200_000);
    expect(islamicNetworkReciters()).toHaveLength(editions.length);
  });
});
