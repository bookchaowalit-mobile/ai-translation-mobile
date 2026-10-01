import { describe, expect, it } from "vitest";
import { PHRASES, normalize, other, searchPhrases, translate } from "../translation";

describe("normalize", () => {
  it("lower-cases and strips punctuation", () => {
    expect(normalize("  Hello,   World! ")).toBe("hello world");
    expect(normalize("I don’t understand.")).toBe("i don't understand");
  });
});

describe("translate en -> th", () => {
  it("prefers whole phrases over single words", () => {
    expect(translate("Where is the toilet?", "en").text).toBe("ห้องน้ำอยู่ที่ไหน");
    expect(translate("not spicy", "en").text).toBe("ไม่เผ็ด");
  });

  it("combines words and reports full coverage", () => {
    const r = translate("I love you", "en");
    expect(r.text).toBe("ฉันรักคุณ");
    expect(r.coverage).toBe(1);
    expect(r.unknown).toEqual([]);
  });

  it("respects word boundaries", () => {
    // "i" must not match the start of "ice"
    const r = translate("ice coffee", "en");
    expect(r.unknown).toEqual(["ice"]);
    expect(r.text).toBe("ice กาแฟ");
    expect(r.coverage).toBeCloseTo(6 / 9);
  });
});

describe("translate th -> en", () => {
  it("segments unspaced Thai with longest match", () => {
    // ห้องน้ำ (toilet) must win over น้ำ (water)
    expect(translate("ห้องน้ำ", "th").text).toBe("toilet");
    expect(translate("ฉันรักคุณ", "th").text).toBe("i love you");
  });

  it("keeps unknown runs", () => {
    const r = translate("ขอบคุณครับ", "th");
    expect(r.text).toBe("thank you ครับ");
    expect(r.unknown).toEqual(["ครับ"]);
  });

  it("round-trips every phrase", () => {
    for (const p of PHRASES) {
      expect(translate(p.en, "en").text).toBe(p.th);
    }
  });
});

describe("helpers", () => {
  it("swaps languages", () => {
    expect(other("en")).toBe("th");
    expect(other("th")).toBe("en");
  });

  it("searches both languages", () => {
    expect(searchPhrases("coffee").map((p) => p.th)).toEqual(["กาแฟ"]);
    expect(searchPhrases("น้ำ").length).toBeGreaterThanOrEqual(3);
    expect(searchPhrases("")).toHaveLength(PHRASES.length);
  });

  it("handles empty input", () => {
    expect(translate("   ", "en")).toMatchObject({ text: "", coverage: 0, unknown: [] });
  });
});

describe("pass 3 edge cases", () => {
  it("treats zero-width spaces between Thai words as word breaks", () => {
    const r = translate("ขอบคุณ\u200Bมาก\uFEFF", "th");
    expect(r.unknown).toEqual([]);
    expect(r.text).toBe("thank you very");
  });
  it("recognises SARA AM typed as NIKHAHIT + SARA AA", () => {
    // "น้ำ" (water) keyed as น + ้ + ํ + า, and as น + ํ + ้ + า.
    expect(translate("\u0E19\u0E49\u0E4D\u0E32", "th").text).toBe("water");
    expect(translate("\u0E19\u0E4D\u0E49\u0E32", "th").text).toBe("water");
    expect(searchPhrases("\u0E19\u0E49\u0E4D\u0E32").map((p) => p.en)).toContain("water");
  });
  it("folds full-width Latin input", () => {
    expect(translate("ｈｅｌｌｏ！", "en").text).toBe("สวัสดี");
  });
});
