import { describe, expect, it } from "vitest";
import { encodeEnvelope, listCodec } from "../persist";
import { filterPhrases, isSaved, isSavedTranslation, MAX_SAVED, saveTranslation } from "../translation";

describe("filterPhrases", () => {
  it("narrows search results by category", () => {
    const food = filterPhrases("", "food");
    expect(food.length).toBeGreaterThan(0);
    expect(food.every((p) => p.category === "food")).toBe(true);
    expect(filterPhrases("hello", null).map((p) => p.en)).toContain("hello");
    expect(filterPhrases("hello", "food")).toEqual([]);
  });
});

describe("saved translations", () => {
  it("saves newest first and replaces the same source per direction", () => {
    let list = saveTranslation([], "en", "Hello", "สวัสดี", 1);
    list = saveTranslation(list, "th", "สวัสดี", "hello", 2);
    list = saveTranslation(list, "en", "  hello ", "สวัสดี!", 3);
    expect(list.map((s) => [s.from, s.target])).toEqual([
      ["en", "สวัสดี!"],
      ["th", "hello"],
    ]);
    expect(isSaved(list, "en", "HELLO")).toBe(true);
    expect(isSaved(list, "th", "hello")).toBe(false);
  });

  it("ignores empty text and caps the list", () => {
    expect(saveTranslation([], "en", " ", "x", 1)).toEqual([]);
    let list = saveTranslation([], "en", "a0", "x", 0);
    for (let i = 1; i < MAX_SAVED + 5; i++) list = saveTranslation(list, "en", `a${i}`, "x", i);
    expect(list).toHaveLength(MAX_SAVED);
  });

  it("round-trips through storage and drops malformed entries", () => {
    const codec = listCodec(isSavedTranslation);
    const list = saveTranslation([], "en", "thank you", "ขอบคุณ", 5);
    expect(codec.decode(codec.encode(list))).toEqual(list);
    expect(codec.decode(encodeEnvelope([{ ...list[0], from: "jp" }]))).toEqual([]);
  });
});
