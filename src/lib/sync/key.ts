import { wordlist } from "@scure/bip39/wordlists/english.js";

// Eight words from a 2048-word list is 88 bits: out of reach for guessing, yet easy to write down and type.
const KEY_WORDS = 8;
const WORD_SET = new Set(wordlist);

export function generateKey(): string {
  const picks = crypto.getRandomValues(new Uint16Array(KEY_WORDS));
  // 2048 divides 65536 evenly, so masking the low bits keeps every word equally likely.
  return Array.from(picks, (value) => wordlist[value & 0x7ff]).join("-");
}

// A key is typed or pasted by hand, so capitals, spaces, commas and line breaks are all accepted.
export const cleanKey = (text: string) => text.toLowerCase().split(/[^a-z]+/).filter(Boolean).join("-");

export const isValidKey = (value: unknown): value is string => {
  if (typeof value !== "string") return false;
  const words = value.split("-");
  return words.length === KEY_WORDS && words.every((word) => WORD_SET.has(word));
};

export async function hashKey(key: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(key));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}
