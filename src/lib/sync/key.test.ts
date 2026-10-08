import { wordlist } from "@scure/bip39/wordlists/english.js";
import { describe, expect, it } from "vitest";
import { cleanKey, generateKey, hashKey, isValidKey } from "./key";

describe("sync key", () => {
  it("is eight words from the list joined by dashes, and never repeats", () => {
    const keys = new Set(Array.from({ length: 200 }, generateKey));
    expect(keys.size).toBe(200);
    for (const key of keys) {
      const words = key.split("-");
      expect(words).toHaveLength(8);
      expect(words.every((word) => wordlist.includes(word))).toBe(true);
      expect(isValidKey(key)).toBe(true);
    }
  });

  it("uses the whole list, not just the start of it", () => {
    const seen = new Set(Array.from({ length: 400 }, generateKey).flatMap((key) => key.split("-")));
    expect(seen.size).toBeGreaterThan(600);
    expect([...seen].some((word) => wordlist.indexOf(word) > 1500)).toBe(true);
  });

  it("rejects anything that is not a key", () => {
    const real = generateKey();
    const bad = ["", "short", "abandon-ability-able", `${real}-able`, real.replace(/^[a-z]+/, "notaword"), real.toUpperCase(), real.replace(/-/g, " "), 5, null, undefined];
    for (const value of bad) expect(isValidKey(value)).toBe(false);
  });

  it("hashes to the known SHA-256 hex digest", async () => {
    expect(await hashKey("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });

  it("turns what a person types or pastes back into the key", () => {
    const key = generateKey();
    for (const typed of [key, key.toUpperCase(), ` ${key.replace(/-/g, " ")}\n`, key.replace(/-/g, ", "), key.replace(/-/g, "\n")]) {
      expect(cleanKey(typed)).toBe(key);
    }
  });
});
