# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working offline EN⇄TH phrasebook translator with
longest-match Thai segmentation, tested logic and honest CI; vocabulary is small.

## Backlog

- P0: Decide the online engine (the translation backend / Central AI Gateway) and
  fall back to `lib/translation.ts` when offline; never call providers directly from the app.
- P1: Grow the phrasebook (load from a JSON asset) (search/category UI done in pass 2).
- P1: Text-to-speech for the result (expo-speech).
- P1: Component tests for the translate screen (jest-expo + @testing-library/react-native).
- P2: Link the EAS project (`eas init`) so the preview build job can run.

## Done in this pass

- Fixed the app not bundling: aligned `expo-router`/`react-native`/`expo-constants`
  with SDK 53 and added missing `expo-font`, `expo-asset`, `query-string` deps.
- Translate screen backed by pure `lib/translation.ts` (normalisation, longest-match
  segmentation, coverage/unknown reporting, phrase search) with 10 vitest tests.
- CI previously failed on `cache: npm` without a lockfile; it now runs `npm ci`,
  typecheck, lint, tests and an Android JS bundle; EAS job skips without `EXPO_TOKEN`.

## Done in this pass (pass 2)

Score: 6/10 (was 5/10) — saved translations persist and the phrasebook is searchable by text and category.

- Saved translations: "Save translation" keeps source+result per direction (de-duplicated, capped at 50) with AsyncStorage (`@react-native-async-storage/async-storage` 2.1.2) via `lib/usePersistentState.ts`; tap to restore, delete per row; guard `isSavedTranslation` (tested).
- Phrasebook search box and category chips backed by new pure `filterPhrases` (tested) — part of the P1 phrasebook item; growing the vocabulary from a JSON asset is still open.
- Accessibility: save/delete/category controls labelled with state; profile links get link roles.
- Advisories: `overrides.postcss ^8.5.28` clears the high-severity PostCSS advisory in Expo metro-config (minor bump). Remaining `image-size` (metro, bundler-only), `uuid` (via `xcode`) and `decode-uri-component` (via `query-string@7`) need an Expo SDK major upgrade; deliberately not auto-fixed.
- Verified: typecheck, lint, 20 vitest tests, Android `expo export` bundle.

## Done in this pass (pass 3)

Score: 6.5/10 (was 6/10) — edge-case hunt in `lib/translation.ts` (`normalize`).

- Bug: a zero-width space between Thai words (widely used as a Thai line-break hint) or a BOM
  turned known words into "unknown" segments; they are now treated as spaces.
- Bug: Thai SARA AM typed as NIKHAHIT + SARA AA (either mark order, e.g. "น้ํา") never matched
  dictionary entries such as น้ำ / ห้องน้ำ, in both translate and phrasebook search.
- Bug: full-width Latin input ("ｈｅｌｌｏ！") was not recognised; input is now NFKC-folded.
- Verified: typecheck, `expo lint`, vitest (23), Android `expo export` bundle; new tests fail on the old code.
