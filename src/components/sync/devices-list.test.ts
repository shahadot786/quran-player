import { describe, expect, it } from "vitest";
import { deviceRows } from "./devices-list";

const device = (name: string, syncedAt: number, removed = false) => ({ name, syncedAt, updatedAt: syncedAt, removed });

describe("deviceRows", () => {
  it("puts this device first and the others by their last sync, newest first", () => {
    const rows = deviceRows({ a: device("Laptop", 50), me: device("Phone", 10), b: device("Tablet", 90) }, "me");
    expect(rows.map((row) => [row.entry.name, row.mine])).toEqual([["Phone", true], ["Tablet", false], ["Laptop", false]]);
  });

  it("leaves out devices that were removed from the list", () => {
    expect(deviceRows({ a: device("Laptop", 50, true), me: device("Phone", 10) }, "me").map((row) => row.id)).toEqual(["me"]);
  });

  it("is empty before any device has synced", () => {
    expect(deviceRows({}, "me")).toEqual([]);
  });
});
