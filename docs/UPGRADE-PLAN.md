# Upgrade Plan

## Current state

Score: 5/10 (was 2/10) — working offline EN⇄TH phrasebook translator with
longest-match Thai segmentation, tested logic and honest CI; vocabulary is small.

## Backlog

- P0: Decide the online engine (the translation backend / Central AI Gateway) and
  fall back to `lib/translation.ts` when offline; never call providers directly from the app.
- P1: Grow the phrasebook (load from a JSON asset) and add categories filter/search UI
  (`searchPhrases` already exists).
- P1: Text-to-speech for the result (expo-speech).
- P1: Component tests for the translate screen (jest-expo + @testing-library/react-native).
- P2: History/favourites persisted with AsyncStorage.
- P2: Link the EAS project (`eas init`) so the preview build job can run.

## Done in this pass

- Fixed the app not bundling: aligned `expo-router`/`react-native`/`expo-constants`
  with SDK 53 and added missing `expo-font`, `expo-asset`, `query-string` deps.
- Translate screen backed by pure `lib/translation.ts` (normalisation, longest-match
  segmentation, coverage/unknown reporting, phrase search) with 10 vitest tests.
- CI previously failed on `cache: npm` without a lockfile; it now runs `npm ci`,
  typecheck, lint, tests and an Android JS bundle; EAS job skips without `EXPO_TOKEN`.
