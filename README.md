# Translation — Mobile

> **Template copy.** This repo is one of the name-substituted Expo SDK 53 / Expo Router
> template copies in `bookchaowalit-mobile`. The canonical template is
> [`bookchaowalit-mobile/community-hub-mobile`](https://github.com/bookchaowalit-mobile/community-hub-mobile);
> this copy keeps its own code (no shared package). Consolidation/archive is pending
> owner decision D5 (BD-033) per `repository-catalog/portfolio/MOBILE-CONSOLIDATION-2026-10.md`
> in solo-empire.

React Native mobile app (Expo) for **Translation**.

Part of [Chaowalit Greepoke](https://bookchaowalit.com)'s 101 Portfolio Projects.

## Features

- **Offline EN ⇄ TH translator** (Translate tab): type English or Thai and get an
  instant translation from a built-in phrasebook. Whole phrases win over single
  words, and unspaced Thai is segmented by longest dictionary match (so ห้องน้ำ
  is "toilet", not "room + water"). Words not in the dictionary are kept and
  listed, with a coverage percentage. Tap ⇄ to swap direction, or tap any
  phrasebook entry to use it.
- Translation logic lives in `lib/translation.ts` (pure TypeScript, unit-tested).
  It is a phrasebook, not machine translation; see `docs/UPGRADE-PLAN.md`.

## Tech Stack

- **Framework:** Expo SDK 53 + Expo Router
- **Language:** TypeScript
- **Navigation:** Expo Router (file-based)
- **UI:** React Native + Ionicons

## Getting Started

```bash
npm install
npx expo start
```

## Scripts

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # expo lint (eslint-config-expo)
npm test            # vitest unit tests for lib/
npx expo export --platform android --output-dir dist   # JS bundle smoke check
```

CI (`.github/workflows/ci.yml`) calls the shared `bookchaowalit/platform-ci-workflows`
`ci-node.yml` and `security.yml` (v1.1.1, SHA-pinned): `npm ci`, lint, typecheck, tests,
the Android JS bundle export above, plus Gitleaks, Semgrep, OSV-Scanner and Trivy.
Failures are not masked. There is no EAS / Expo cloud build in CI: that needs an
owner-linked Expo account (owner action).

## Build

```bash
# Android
npx eas build --platform android --profile preview

# iOS
npx eas build --platform ios --profile preview
```

## Related

- **Frontend:** [bookchaowalit-website/translation-frontend](https://github.com/bookchaowalit-website/translation-frontend)
- **Portfolio:** [bookchaowalit.com](https://bookchaowalit.com)

## License

MIT
