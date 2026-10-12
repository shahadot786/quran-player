import { wordlist } from "@scure/bip39/wordlists/english.js";
import { ADJECTIVES, ADVERBS, ANIMALS, COLOURS, PLACES, PREPOSITIONS, TIMES, VERBS } from "@/data/story-words";

const NUMBER_MIN = 2;
const NUMBER_MAX = 99;

// "7 quiet golden camels slowly stroll past the sunny river at dawn": one number, then a word from each list in order.
const STORY: readonly (readonly string[])[] = [ADJECTIVES, COLOURS, ANIMALS, ADVERBS, VERBS, PREPOSITIONS, ["the"], ADJECTIVES, PLACES, ["at"], TIMES];
const STORY_SETS = STORY.map((words) => new Set(words));

// Keys made before story keys were eight BIP-39 words; devices that have one keep it.
const LEGACY_WORDS = 8;
const LEGACY_SET = new Set(wordlist);

function randomBelow(size: number): number {
  // Values past the last whole multiple of `size` are drawn again, so every word stays equally likely.
  const limit = Math.floor(0x1_0000_0000 / size) * size;
  for (;;) {
    const [value] = crypto.getRandomValues(new Uint32Array(1));
    if (value! < limit) return value! % size;
  }
}

export function generateKey(): string {
  const number = NUMBER_MIN + randomBelow(NUMBER_MAX - NUMBER_MIN + 1);
  return [String(number), ...STORY.map((words) => words[randomBelow(words.length)]!)].join("-");
}

const BENGALI_DIGITS = /[০-৯]/g;

// A key is typed or pasted by hand, so capitals, spaces, punctuation, line breaks and Bengali digits are all accepted.
export const cleanKey = (text: string) =>
  text
    .replace(BENGALI_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x09e6))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-");

/** The key as a sentence, for showing and copying. */
export const formatKey = (key: string) => key.replace(/-/g, " ");

function isStoryKey(parts: string[]) {
  if (parts.length !== STORY.length + 1 || !/^[1-9]\d?$/.test(parts[0]!)) return false;
  const number = Number(parts[0]);
  return number >= NUMBER_MIN && number <= NUMBER_MAX && parts.slice(1).every((word, index) => STORY_SETS[index]!.has(word));
}

const isLegacyKey = (parts: string[]) => parts.length === LEGACY_WORDS && parts.every((word) => LEGACY_SET.has(word));

export const isValidKey = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const parts = value.split("-");
  return isStoryKey(parts) || isLegacyKey(parts);
};

export async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
