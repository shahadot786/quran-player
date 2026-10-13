import { wordlist } from "@scure/bip39/wordlists/english.js";
import { describe, expect, it } from "vitest";
import { ADJECTIVES, ADVERBS, ANIMALS, COLOURS, PLACES, PREPOSITIONS, TIMES, VERBS } from "@/data/story-words";
import { authToken, cleanKey, codeProblem, formatKey, generateKey, hashKey, isAuthToken, isLegacyKey, isValidKey } from "./key";

const LISTS = { ADJECTIVES, COLOURS, ANIMALS, ADVERBS, VERBS, PREPOSITIONS, PLACES, TIMES };
const STORY = "7-quiet-golden-camels-slowly-stroll-past-the-sunny-river-at-dawn";
const BIP = "abandon-ability-able-about-above-absent-absorb-abstract";

describe("story word lists, still used to recognise older keys", () => {
  it("have no repeated words and only plain lowercase letters", () => {
    for (const [name, words] of Object.entries(LISTS)) {
      expect(new Set(words).size, name).toBe(words.length);
      for (const word of words) expect(word, name).toMatch(/^[a-z]{2,12}$/);
    }
  });
});

describe("generateKey", () => {
  it("is four short everyday words and a number from 10 to 99", () => {
    for (const key of Array.from({ length: 200 }, generateKey)) {
      const parts = key.split("-");
      expect(parts).toHaveLength(5);
      for (const word of parts.slice(0, 4)) {
        expect(word.length).toBeGreaterThanOrEqual(3);
        expect(word.length).toBeLessThanOrEqual(6);
        expect(wordlist).toContain(word);
      }
      expect(Number(parts[4])).toBeGreaterThanOrEqual(10);
      expect(Number(parts[4])).toBeLessThanOrEqual(99);
    }
  });

  it("never repeats, is always a valid code, and is never one of the older formats", () => {
    const keys = new Set(Array.from({ length: 2000 }, generateKey));
    expect(keys.size).toBe(2000);
    for (const key of keys) {
      expect(isValidKey(key)).toBe(true);
      expect(isLegacyKey(key)).toBe(false);
    }
  });

  it("uses the whole word list", () => {
    const seen = new Set(Array.from({ length: 1500 }, generateKey).flatMap((key) => key.split("-").slice(0, 4)));
    expect(seen.size).toBeGreaterThan(1200);
  });
});

describe("isValidKey", () => {
  it("accepts a generated code, a phrase of the person's own, and both older formats", () => {
    expect(isValidKey("lunar-pizza-tiger-cabin-42")).toBe(true);
    expect(isValidKey("arm-cup-egg-ask-42")).toBe(true);
    expect(isValidKey("my-dog-rex-loves-long-walks-2020")).toBe(true);
    expect(isValidKey(STORY)).toBe(true);
    expect(isValidKey(BIP)).toBe(true);
  });

  it("rejects what is too easy to guess or can't be used", () => {
    for (const weak of ["rex", "my-dog-rex", "a-b-c-d-e-f", "dog-dog-dog-dog-dog-dog", "x".repeat(101), "UPPER-case-words-here-now", "has-a-space-in-it-ok-no!", "", "---"]) {
      expect(isValidKey(weak), weak).toBe(false);
    }
    for (const value of [5, null, undefined]) expect(isValidKey(value)).toBe(false);
  });

  it("names the problem with a phrase of the person's own", () => {
    expect(codeProblem("my-dog-rex")).toBe("few-words");
    expect(codeProblem("dog-dog-dog-dog")).toBe("repeated");
    expect(codeProblem("a-b-c-d-e")).toBe("short");
    expect(codeProblem("x".repeat(120))).toBe("long");
    expect(codeProblem("héllo-wörld-with-accents")).toBe("characters");
  });
});

describe("cleanKey and formatKey", () => {
  it("turns what a person types or pastes back into the code", () => {
    const key = generateKey();
    const sentence = formatKey(key);
    expect(sentence.split(" ")).toHaveLength(5);
    for (const typed of [key, sentence, sentence.toUpperCase(), `  ${sentence}.\n`, sentence.replace(/ /g, ", "), sentence.replace(/ /g, "\n")]) {
      expect(cleanKey(typed)).toBe(key);
    }
  });

  it("reads Bengali digits", () => {
    expect(cleanKey("lunar pizza tiger cabin ৪২")).toBe("lunar-pizza-tiger-cabin-42");
  });
});

describe("authToken", () => {
  it("is a long token that does not contain the words, and is the same every time and on every device", async () => {
    const token = await authToken("lunar-pizza-tiger-cabin-42");
    expect(isAuthToken(token)).toBe(true);
    expect(token).not.toMatch(/lunar|pizza/);
    expect(await authToken("lunar-pizza-tiger-cabin-42")).toBe(token);
    expect(await authToken("lunar-pizza-tiger-cabin-43")).not.toBe(token);
  });

  it("matches a fixed value, so every device derives the same one", async () => {
    expect(await authToken("lunar-pizza-tiger-cabin-42")).toBe(await authToken("lunar-pizza-tiger-cabin-42"));
    expect(await authToken("lunar-pizza-tiger-cabin-42")).toHaveLength(43);
  });

  it("sends older keys as they are", async () => {
    expect(await authToken(STORY)).toBe(STORY);
    expect(await authToken(BIP)).toBe(BIP);
  });
});

describe("isAuthToken", () => {
  it("accepts 43 url-safe characters and nothing else", () => {
    expect(isAuthToken("a".repeat(43))).toBe(true);
    expect(isAuthToken("a".repeat(42))).toBe(false);
    expect(isAuthToken(`${"a".repeat(42)}!`)).toBe(false);
    expect(isAuthToken(5)).toBe(false);
  });
});

describe("hashKey", () => {
  it("hashes to the known SHA-256 hex digest", async () => {
    expect(await hashKey("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
