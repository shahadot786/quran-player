import { wordlist } from "@scure/bip39/wordlists/english.js";
import { ADJECTIVES, ADVERBS, ANIMALS, COLOURS, PLACES, PREPOSITIONS, TIMES, VERBS } from "@/data/story-words";

// A sync code is four short everyday words and a number, such as "lunar-pizza-tiger-cabin-42": easy to say, write down and type.
// About 49 bits on its own, and the device stretches it with PBKDF2 before anything is sent, so every guess costs a lot of work.
const CODE_WORDS = 4;
const NUMBER_MIN = 10;
const NUMBER_MAX = 99;
const SIMPLE_WORDS = wordlist.filter((word) => word.length >= 3 && word.length <= 6);

// A code of your own has to be long enough to resist guessing.
const OWN_MIN_WORDS = 4;
const OWN_MIN_LENGTH = 16;
const OWN_MAX_LENGTH = 100;
const OWN_WORD = /^[a-z0-9]{1,24}$/;

// Keys made before codes: a story sentence (QP-005) or eight BIP-39 words (QP-004). They are still sent as they are.
const STORY: readonly (readonly string[])[] = [ADJECTIVES, COLOURS, ANIMALS, ADVERBS, VERBS, PREPOSITIONS, ["the"], ADJECTIVES, PLACES, ["at"], TIMES];
const STORY_SETS = STORY.map((words) => new Set(words));
const LEGACY_WORDS = 8;
const LEGACY_SET = new Set(wordlist);

function randomBelow(size: number): number {
  // Values past the last whole multiple of `size` are drawn again, so every choice stays equally likely.
  const limit = Math.floor(0x1_0000_0000 / size) * size;
  for (;;) {
    const [value] = crypto.getRandomValues(new Uint32Array(1));
    if (value! < limit) return value! % size;
  }
}

export function generateKey(): string {
  for (;;) {
    const words = Array.from({ length: CODE_WORDS }, () => SIMPLE_WORDS[randomBelow(SIMPLE_WORDS.length)]!);
    // A code that repeats a word is drawn again.
    if (new Set(words).size === CODE_WORDS) return [...words, String(NUMBER_MIN + randomBelow(NUMBER_MAX - NUMBER_MIN + 1))].join("-");
  }
}

const SIMPLE_SET = new Set(SIMPLE_WORDS);

/** The shape generateKey makes: four of the simple words, then a number. */
function isGeneratedCode(parts: string[]) {
  if (parts.length !== CODE_WORDS + 1 || !parts.slice(0, CODE_WORDS).every((word) => SIMPLE_SET.has(word)) || new Set(parts.slice(0, CODE_WORDS)).size !== CODE_WORDS) return false;
  return /^[1-9]\d$/.test(parts[CODE_WORDS]!) && Number(parts[CODE_WORDS]) >= NUMBER_MIN;
}

const BENGALI_DIGITS = /[০-৯]/g;

// A code is typed or pasted by hand, so capitals, spaces, punctuation, line breaks and Bengali digits are all accepted.
export const cleanKey = (text: string) =>
  text
    .replace(BENGALI_DIGITS, (digit) => String(digit.charCodeAt(0) - 0x09e6))
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)
    .join("-");

/** The code as it is shown and copied. */
export const formatKey = (key: string) => key.replace(/-/g, " ");

function isStoryKey(parts: string[]) {
  if (parts.length !== STORY.length + 1 || !/^[1-9]\d?$/.test(parts[0]!)) return false;
  const number = Number(parts[0]);
  return number >= 2 && number <= 99 && parts.slice(1).every((word, index) => STORY_SETS[index]!.has(word));
}

const isBipKey = (parts: string[]) => parts.length === LEGACY_WORDS && parts.every((word) => LEGACY_SET.has(word));

/** A key from before codes existed. */
export const isLegacyKey = (value: unknown): boolean => {
  if (typeof value !== "string") return false;
  const parts = value.split("-");
  return isStoryKey(parts) || isBipKey(parts);
};

export type CodeProblem = "few-words" | "repeated" | "short" | "long" | "characters";

/** Why a code of the person's own is too easy to guess or can't be used; null when it is fine. */
export function codeProblem(value: string): CodeProblem | null {
  const parts = value.split("-");
  if (value.length > OWN_MAX_LENGTH) return "long";
  if (!parts.every((part) => OWN_WORD.test(part))) return "characters";
  if (parts.length < OWN_MIN_WORDS) return "few-words";
  if (new Set(parts).size < OWN_MIN_WORDS) return "repeated";
  if (value.replace(/-/g, "").length < OWN_MIN_LENGTH) return "short";
  return null;
}

export const isValidKey = (value: unknown): value is string =>
  typeof value === "string" && (isLegacyKey(value) || isGeneratedCode(value.split("-")) || codeProblem(value) === null);

// What the server is sent for a code: a long token derived on the device, so the words never leave it and a guess costs a slow derivation.
const SALT = "tilawah-sync-code-v1";
const ITERATIONS = 600_000;
const TOKEN = /^[A-Za-z0-9_-]{43}$/;

export const isAuthToken = (value: unknown): value is string => typeof value === "string" && TOKEN.test(value);

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

const tokens = new Map<string, Promise<string>>();

export function authToken(key: string): Promise<string> {
  if (isLegacyKey(key)) return Promise.resolve(key);
  let token = tokens.get(key);
  if (!token) {
    token = (async () => {
      const encoder = new TextEncoder();
      const material = await crypto.subtle.importKey("raw", encoder.encode(key), "PBKDF2", false, ["deriveBits"]);
      const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(SALT), iterations: ITERATIONS }, material, 256);
      return toBase64Url(new Uint8Array(bits));
    })();
    tokens.set(key, token);
  }
  return token;
}

export async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
