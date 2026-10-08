import { describe, expect, it } from "vitest";
import bn from "../messages/bn.json";
import en from "../messages/en.json";

type Tree = { [key: string]: string | Tree };

function leaves(tree: Tree, prefix = ""): [string, string][] {
  return Object.entries(tree).flatMap(([key, value]) =>
    typeof value === "string" ? [[`${prefix}${key}`, value] as [string, string]] : leaves(value, `${prefix}${key}.`),
  );
}

// An argument is a name followed by "}" or ",", which skips the plain text inside plural branches.
const placeholders = (text: string) => [...text.matchAll(/\{(\w+)\s*[,}]/g)].map((match) => match[1]!).sort();

describe("message files", () => {
  const english = new Map(leaves(en as Tree));
  const bengali = new Map(leaves(bn as Tree));

  it("have exactly the same keys", () => {
    expect([...bengali.keys()].sort()).toEqual([...english.keys()].sort());
  });

  it("use the same placeholders in both languages", () => {
    for (const [key, text] of english) expect(placeholders(bengali.get(key) ?? ""), key).toEqual(placeholders(text));
  });

  it("have no empty text", () => {
    for (const [key, text] of [...english, ...bengali]) expect(text.trim(), key).not.toBe("");
  });
});
