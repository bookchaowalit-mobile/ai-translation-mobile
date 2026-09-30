/**
 * Offline English <-> Thai phrasebook translator.
 *
 * Uses longest-match segmentation against a small built-in dictionary. Thai is
 * written without spaces between words, so Thai input is segmented by
 * dictionary lookup ("maximal matching"); English input must match on word
 * boundaries. Pure TypeScript so it can be unit-tested without React Native.
 */

export type Lang = "en" | "th";

export interface Phrase {
  en: string;
  th: string;
  category: "greetings" | "basics" | "food" | "travel" | "people";
}

export const PHRASES: readonly Phrase[] = [
  { en: "hello", th: "สวัสดี", category: "greetings" },
  { en: "good morning", th: "สวัสดีตอนเช้า", category: "greetings" },
  { en: "good night", th: "ราตรีสวัสดิ์", category: "greetings" },
  { en: "thank you", th: "ขอบคุณ", category: "greetings" },
  { en: "sorry", th: "ขอโทษ", category: "greetings" },
  { en: "nice to meet you", th: "ยินดีที่ได้รู้จัก", category: "greetings" },
  { en: "see you later", th: "แล้วพบกันใหม่", category: "greetings" },
  { en: "no problem", th: "ไม่เป็นไร", category: "basics" },
  { en: "i don't understand", th: "ฉันไม่เข้าใจ", category: "basics" },
  { en: "yes", th: "ใช่", category: "basics" },
  { en: "not", th: "ไม่", category: "basics" },
  { en: "very", th: "มาก", category: "basics" },
  { en: "help", th: "ช่วย", category: "basics" },
  { en: "today", th: "วันนี้", category: "basics" },
  { en: "tomorrow", th: "พรุ่งนี้", category: "basics" },
  { en: "how much is this", th: "อันนี้ราคาเท่าไหร่", category: "basics" },
  { en: "water", th: "น้ำ", category: "food" },
  { en: "rice", th: "ข้าว", category: "food" },
  { en: "coffee", th: "กาแฟ", category: "food" },
  { en: "eat", th: "กิน", category: "food" },
  { en: "delicious", th: "อร่อย", category: "food" },
  { en: "spicy", th: "เผ็ด", category: "food" },
  { en: "not spicy", th: "ไม่เผ็ด", category: "food" },
  { en: "hot", th: "ร้อน", category: "food" },
  { en: "cold", th: "เย็น", category: "food" },
  { en: "check please", th: "เช็คบิล", category: "food" },
  { en: "toilet", th: "ห้องน้ำ", category: "travel" },
  { en: "where is the toilet", th: "ห้องน้ำอยู่ที่ไหน", category: "travel" },
  { en: "market", th: "ตลาด", category: "travel" },
  { en: "hotel", th: "โรงแรม", category: "travel" },
  { en: "airport", th: "สนามบิน", category: "travel" },
  { en: "hospital", th: "โรงพยาบาล", category: "travel" },
  { en: "i", th: "ฉัน", category: "people" },
  { en: "you", th: "คุณ", category: "people" },
  { en: "friend", th: "เพื่อน", category: "people" },
  { en: "love", th: "รัก", category: "people" },
];

export interface Segment {
  source: string;
  target: string | null;
}

export interface Translation {
  text: string;
  segments: Segment[];
  /** Share (0..1) of non-space source characters covered by the dictionary. */
  coverage: number;
  unknown: string[];
}

/**
 * Lower-cases, folds curly quotes and strips punctuation other than apostrophes.
 *
 * Also folds input quirks that made known words "unknown":
 * - full-width Latin ("ｈｅｌｌｏ") via NFKC;
 * - Thai SARA AM typed as NIKHAHIT + SARA AA ("น้ํา" vs "น้ำ"), in either mark order;
 * - zero-width spaces (common as Thai word separators), joiners and BOM, treated as spaces.
 */
export function normalize(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\u0E4D([\u0E48-\u0E4B]?)\u0E32/g, "$1\u0E33")
    .replace(/([\u0E48-\u0E4B])\u0E4D\u0E32/g, "$1\u0E33")
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, " ")
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[.,!?;:"()[\]{}]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export const other = (lang: Lang): Lang => (lang === "en" ? "th" : "en");

function dictionary(from: Lang): [string, string][] {
  const map = new Map<string, string>();
  for (const p of PHRASES) {
    const key = p[from];
    if (!map.has(key)) map.set(key, p[other(from)]);
  }
  return [...map.entries()].sort((a, b) => b[0].length - a[0].length);
}

const isThaiChar = (ch: string) => /[฀-๿]/.test(ch);

export function translate(input: string, from: Lang): Translation {
  const text = normalize(input);
  const dict = dictionary(from);
  const segments: Segment[] = [];
  let i = 0;
  let pendingUnknown = "";

  const flushUnknown = () => {
    if (pendingUnknown.trim()) segments.push({ source: pendingUnknown.trim(), target: null });
    pendingUnknown = "";
  };

  while (i < text.length) {
    if (text[i] === " ") {
      flushUnknown();
      i += 1;
      continue;
    }
    const match = dict.find(([key]) => {
      if (!text.startsWith(key, i)) return false;
      const end = i + key.length;
      // English words (and Latin text inside Thai input) must end on a word boundary.
      return isThaiChar(key[key.length - 1]) || end === text.length || text[end] === " ";
    });
    const atWordStart = i === 0 || text[i - 1] === " " || isThaiChar(text[i]);
    if (match && (atWordStart || pendingUnknown === "")) {
      flushUnknown();
      segments.push({ source: match[0], target: match[1] });
      i += match[0].length;
    } else {
      pendingUnknown += text[i];
      i += 1;
    }
  }
  flushUnknown();

  const to = other(from);
  const joiner = to === "th" ? "" : " ";
  const out = segments.map((s) => s.target ?? s.source);
  const joined =
    to === "th"
      ? out.reduce((acc, part, idx) => {
          const prevUnknown = idx > 0 && segments[idx - 1].target === null;
          const unknown = segments[idx].target === null;
          return acc + (idx > 0 && (unknown || prevUnknown) ? " " : joiner) + part;
        }, "")
      : out.join(joiner);

  const total = segments.reduce((n, s) => n + s.source.replace(/ /g, "").length, 0);
  const known = segments
    .filter((s) => s.target !== null)
    .reduce((n, s) => n + s.source.replace(/ /g, "").length, 0);

  return {
    text: joined,
    segments,
    coverage: total ? known / total : 0,
    unknown: segments.filter((s) => s.target === null).map((s) => s.source),
  };
}

/** Case-insensitive search across both languages. */
export function searchPhrases(query: string): Phrase[] {
  const q = normalize(query);
  if (!q) return [...PHRASES];
  return PHRASES.filter((p) => p.en.includes(q) || p.th.includes(q));
}

export type Category = Phrase["category"];
export const CATEGORIES: readonly Category[] = ["greetings", "basics", "food", "travel", "people"];

/** Phrasebook search narrowed to one category (null = all). */
export function filterPhrases(query: string, category: Category | null): Phrase[] {
  return searchPhrases(query).filter((p) => category === null || p.category === category);
}

export interface SavedTranslation {
  id: string;
  from: Lang;
  source: string;
  target: string;
  savedAt: number;
}

export const MAX_SAVED = 50;

/** Saves a translation at the top; the same source text (per direction) is replaced, not duplicated. */
export function saveTranslation(
  list: SavedTranslation[],
  from: Lang,
  source: string,
  target: string,
  now: number,
): SavedTranslation[] {
  const text = source.trim();
  if (!text || !target.trim()) return list;
  const key = normalize(text);
  const rest = list.filter((s) => !(s.from === from && normalize(s.source) === key));
  return [{ id: `${now.toString(36)}-${rest.length}`, from, source: text, target: target.trim(), savedAt: now }, ...rest].slice(0, MAX_SAVED);
}

export function isSaved(list: SavedTranslation[], from: Lang, source: string): boolean {
  const key = normalize(source);
  return key !== "" && list.some((s) => s.from === from && normalize(s.source) === key);
}

/** Type guard used when loading saved translations from local storage. */
export function isSavedTranslation(value: unknown): value is SavedTranslation {
  if (typeof value !== "object" || value === null) return false;
  const s = value as Record<string, unknown>;
  return (
    typeof s.id === "string" &&
    (s.from === "en" || s.from === "th") &&
    typeof s.source === "string" &&
    typeof s.target === "string" &&
    typeof s.savedAt === "number" &&
    Number.isFinite(s.savedAt)
  );
}
