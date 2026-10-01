import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { listCodec } from "../../lib/persist";
import {
  CATEGORIES,
  type Category,
  filterPhrases,
  isSaved,
  isSavedTranslation,
  type Lang,
  other,
  saveTranslation,
  type SavedTranslation,
  translate,
} from "../../lib/translation";
import { usePersistentState } from "../../lib/usePersistentState";

const savedCodec = listCodec(isSavedTranslation);

const LABEL: Record<Lang, string> = { en: "English", th: "ไทย (Thai)" };

export default function TranslateScreen() {
  const [from, setFrom] = useState<Lang>("en");
  const [input, setInput] = useState("Where is the toilet?");
  const result = useMemo(() => translate(input, from), [input, from]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<Category | null>(null);
  const phrases = useMemo(() => filterPhrases(query, category), [query, category]);
  const [saved, setSaved] = usePersistentState<SavedTranslation[]>("translate.saved.v1", [], savedCodec);
  const to = other(from);
  const alreadySaved = isSaved(saved, from, input);
  const canSave = input.trim() !== "" && result.text.trim() !== "" && !alreadySaved;

  const swap = () => {
    setInput(result.text);
    setFrom(to);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.langRow}>
        <Text style={styles.lang}>{LABEL[from]}</Text>
        <Pressable
          accessibilityLabel={`Swap to ${LABEL[to]} input`}
          accessibilityRole="button"
          hitSlop={8}
          onPress={swap}
          style={styles.swap}
        >
          <Text style={styles.swapText}>⇄</Text>
        </Pressable>
        <Text style={styles.lang}>{LABEL[to]}</Text>
      </View>

      <TextInput
        accessibilityLabel={`Text in ${LABEL[from]}`}
        autoCorrect={false}
        multiline
        onChangeText={setInput}
        placeholder={from === "en" ? "Type English…" : "พิมพ์ภาษาไทย…"}
        style={styles.input}
        value={input}
      />

      <View accessibilityLiveRegion="polite" style={styles.output}>
        <Text selectable style={styles.outputText}>
          {result.text || "—"}
        </Text>
        {result.segments.length > 0 && (
          <Text style={styles.coverage}>
            Dictionary coverage {Math.round(result.coverage * 100)}%
            {result.unknown.length > 0 && ` · not found: ${result.unknown.join(", ")}`}
          </Text>
        )}
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={alreadySaved ? "Translation already saved" : "Save this translation"}
        accessibilityState={{ disabled: !canSave }}
        disabled={!canSave}
        onPress={() => setSaved((list) => saveTranslation(list, from, input, result.text, Date.now()))}
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
      >
        <Text style={styles.saveText}>{alreadySaved ? "★ Saved" : "☆ Save translation"}</Text>
      </Pressable>

      {saved.length > 0 && (
        <>
          <Text style={styles.section}>Saved ({saved.length})</Text>
          {saved.map((s) => (
            <View key={s.id} style={[styles.phrase, styles.savedRow]}>
              <Pressable
                accessibilityHint="Puts this saved text back in the input"
                accessibilityRole="button"
                onPress={() => {
                  setFrom(s.from);
                  setInput(s.source);
                }}
                style={styles.flex}
              >
                <Text style={styles.phraseMain}>{s.source}</Text>
                <Text style={styles.phraseSub}>{s.target}</Text>
              </Pressable>
              <Pressable
                accessibilityLabel={`Delete saved translation ${s.source}`}
                accessibilityRole="button"
                hitSlop={8}
                onPress={() => setSaved((list) => list.filter((x) => x.id !== s.id))}
              >
                <Text style={styles.delete}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </>
      )}

      <Text style={styles.section}>Phrasebook</Text>
      <TextInput
        accessibilityLabel="Search phrasebook in English or Thai"
        autoCorrect={false}
        onChangeText={setQuery}
        placeholder="Search phrases…"
        style={styles.search}
        value={query}
      />
      <View style={styles.chips}>
        {[null, ...CATEGORIES].map((c) => (
          <Pressable
            accessibilityLabel={c === null ? "All categories" : `Category ${c}`}
            accessibilityRole="button"
            accessibilityState={{ selected: category === c }}
            key={c ?? "all"}
            onPress={() => setCategory(c)}
            style={[styles.chip, category === c && styles.chipActive]}
          >
            <Text style={[styles.chipText, category === c && styles.chipTextActive]}>{c ?? "all"}</Text>
          </Pressable>
        ))}
      </View>
      {phrases.length === 0 && <Text style={styles.phraseSub}>No phrases match.</Text>}
      {phrases.map((p) => (
        <Pressable
          accessibilityHint="Puts this phrase in the input"
          accessibilityRole="button"
          key={p.en}
          onPress={() => setInput(p[from])}
          style={styles.phrase}
        >
          <Text style={styles.phraseMain}>{p[from]}</Text>
          <Text style={styles.phraseSub}>
            {p[to]} · {p.category}
          </Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F5F5F5" },
  content: { padding: 16, gap: 10 },
  langRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  lang: { flex: 1, textAlign: "center", fontWeight: "600", color: "#333" },
  swap: { backgroundColor: "#2F6DB5", borderRadius: 20, width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  swapText: { color: "#fff", fontSize: 20 },
  input: {
    backgroundColor: "#fff",
    borderColor: "#ccc",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    minHeight: 90,
    fontSize: 17,
    textAlignVertical: "top",
  },
  output: { backgroundColor: "#E8F0FA", borderRadius: 8, padding: 12, gap: 6 },
  outputText: { fontSize: 20, color: "#1A1A1A" },
  coverage: { fontSize: 12, color: "#555" },
  section: { marginTop: 8, fontSize: 16, fontWeight: "700", color: "#333" },
  phrase: { backgroundColor: "#fff", borderRadius: 8, padding: 12 },
  phraseMain: { fontSize: 16, color: "#222" },
  phraseSub: { fontSize: 13, color: "#666", marginTop: 2 },
  saveButton: { alignSelf: "flex-start", backgroundColor: "#2F6DB5", borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  saveButtonDisabled: { backgroundColor: "#8A9BB0" },
  saveText: { color: "#fff", fontWeight: "600" },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  flex: { flex: 1 },
  delete: { color: "#B00020", fontWeight: "600" },
  search: { backgroundColor: "#fff", borderColor: "#ccc", borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, fontSize: 15 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { borderRadius: 14, borderWidth: 1, borderColor: "#2F6DB5", paddingHorizontal: 10, paddingVertical: 4 },
  chipActive: { backgroundColor: "#2F6DB5" },
  chipText: { color: "#2F6DB5", textTransform: "capitalize" },
  chipTextActive: { color: "#fff" },

});
