import { wordlist } from "@scure/bip39/wordlists/english.js";
import { describe, expect, it } from "vitest";
import { ADJECTIVES, ADVERBS, ANIMALS, COLOURS, PLACES, PREPOSITIONS, TIMES, VERBS } from "@/data/story-words";
import { cleanKey, formatKey, generateKey, hashKey, isValidKey } from "./key";

const LISTS = { ADJECTIVES, COLOURS, ANIMALS, ADVERBS, VERBS, PREPOSITIONS, PLACES, TIMES };

describe("story word lists", () => {
  it("have no repeated words and only plain lowercase letters", () => {
    for (const [name, words] of Object.entries(LISTS)) {
      expect(new Set(words).size, name).toBe(words.length);
      for (const word of words) expect(word, name).toMatch(/^[a-z]{2,12}$/);
    }
  });

  it("give at least 64 bits together with the number", () => {
    const bits = Math.log2(98) + 2 * Math.log2(ADJECTIVES.length) + [COLOURS, ANIMALS, ADVERBS, VERBS, PREPOSITIONS, PLACES, TIMES].reduce((total, words) => total + Math.log2(words.length), 0);
    expect(bits).toBeGreaterThanOrEqual(64);
  });
});

describe("generateKey", () => {
  it("reads like a sentence: a number, two describing words, animals, how and what they do, where and when", () => {
    const words = generateKey().split("-");
    expect(words).toHaveLength(12);
    expect(Number(words[0])).toBeGreaterThanOrEqual(2);
    expect(Number(words[0])).toBeLessThanOrEqual(99);
    expect(ADJECTIVES).toContain(words[1]);
    expect(COLOURS).toContain(words[2]);
    expect(ANIMALS).toContain(words[3]);
    expect(ADVERBS).toContain(words[4]);
    expect(VERBS).toContain(words[5]);
    expect(PREPOSITIONS).toContain(words[6]);
    expect(words[7]).toBe("the");
    expect(ADJECTIVES).toContain(words[8]);
    expect(PLACES).toContain(words[9]);
    expect(words[10]).toBe("at");
    expect(TIMES).toContain(words[11]);
  });

  it("never repeats and every key is valid", () => {
    const keys = new Set(Array.from({ length: 2000 }, generateKey));
    expect(keys.size).toBe(2000);
    for (const key of keys) expect(isValidKey(key)).toBe(true);
  });

  it("uses the whole of every list", () => {
    const seen = new Set(Array.from({ length: 4000 }, generateKey).map((key) => key.split("-")[9]));
    expect(seen.size).toBeGreaterThan(PLACES.length * 0.9);
  });
});

describe("isValidKey", () => {
  const story = "7-quiet-golden-camels-slowly-stroll-past-the-sunny-river-at-dawn";

  it("accepts a story key and an older eight-word key", () => {
    expect(isValidKey(story)).toBe(true);
    expect(isValidKey("abandon-ability-able-about-above-absent-absorb-abstract")).toBe(true);
  });

  it("rejects a story with a word in the wrong place, a missing word, a bad number or anything else", () => {
    const bad = [
      story.replace("camels", "river"),
      story.replace("-the-", "-a-"),
      story.replace("at-dawn", "dawn"),
      story.replace("7-", "1-"),
      story.replace("7-", "100-"),
      story.replace("7-", "07-"),
      `${story}-again`,
      story.toUpperCase(),
      "abandon-ability-able",
      "",
      5,
      null,
    ];
    for (const value of bad) expect(isValidKey(value), String(value)).toBe(false);
  });
});

describe("cleanKey and formatKey", () => {
  it("turns what a person types or pastes back into the key", () => {
    const key = generateKey();
    const sentence = formatKey(key);
    expect(sentence.split(" ")).toHaveLength(12);
    for (const typed of [key, sentence, sentence.toUpperCase(), `  ${sentence}.\n`, sentence.replace(/ /g, ", "), sentence.replace(/ /g, "\n")]) {
      expect(cleanKey(typed)).toBe(key);
    }
  });

  it("reads Bengali digits", () => {
    expect(cleanKey("৪২ quiet golden camels")).toBe("42-quiet-golden-camels");
  });

  it("keeps older eight-word keys as they were", () => {
    const old = wordlist.slice(0, 8).join("-");
    expect(cleanKey(old.replace(/-/g, " "))).toBe(old);
  });
});

describe("hashKey", () => {
  it("hashes to the known SHA-256 hex digest", async () => {
    expect(await hashKey("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});
