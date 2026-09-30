import { useMemo, useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { type Lang, other, searchPhrases, translate } from "../../lib/translation";

const LABEL: Record<Lang, string> = { en: "English", th: "ไทย (Thai)" };

export default function TranslateScreen() {
  const [from, setFrom] = useState<Lang>("en");
  const [input, setInput] = useState("Where is the toilet?");
  const result = useMemo(() => translate(input, from), [input, from]);
  const phrases = useMemo(() => searchPhrases(""), []);
  const to = other(from);

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

      <Text style={styles.section}>Phrasebook</Text>
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
});
