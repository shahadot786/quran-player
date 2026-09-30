# Contributing to Tilawah

Thank you for your interest in contributing! Bug reports, feature suggestions, documentation improvements and pull requests are all welcome.

## Development setup

1. **Prerequisites**
   - Node.js 22 or later
   - [Yarn 1](https://classic.yarnpkg.com/) (the repo is locked with `yarn.lock`; please don't add a `package-lock.json`)

2. **Clone and install**
   ```bash
   git clone https://github.com/shahadot786/quran-player.git
   cd quran-player
   yarn install
   cp .env.example .env.local
   ```

3. **Run the development server**
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000).

## Conventions

- **Next.js and React**: Next.js 16 (App Router, Turbopack) and React 19. Keep server components as the default and add `'use client'` only where state or browser APIs are needed. Next 16 has breaking changes, so read the relevant guide in `node_modules/next/dist/docs/` before using an API.
- **Comments**: write self-documenting code. Only comment a non-obvious *why*, such as a hidden constraint or a workaround, and keep it to a line.
- **Tailwind CSS**: use the standard scale. Avoid arbitrary pixel values such as `p-[13px]`; pick the closest scale value instead.
- **i18n**: every user-facing string goes through `useTranslations` or `getTranslations`. Add each new key to **both** `messages/en.json` and `messages/bn.json`, with natural wording in both languages.
- **Accessibility and layout**: give controls descriptive labels, keep them keyboard-operable, and check the layout from a 375px phone up to desktop, in light and dark themes.
- **Audio data**: every recitation shown in the app has all 114 surahs. If you touch the catalog code in `src/lib/api/`, keep that guarantee and see [Data and sync](#data-and-sync).

## Verify before you push

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn test:e2e
```

These are exactly the steps of the **Verify** GitHub Action, so a green run locally means a green run on your pull request. `yarn typecheck` generates Next's route types first, so it works on a fresh checkout.

The e2e tests stub the audio, timing and text APIs, so they need no network access beyond the initial `yarn build`. Install the browser once with `yarn playwright install chromium`.

## Data and sync

Three committed data files come from scripts that call public APIs. Re-run them only when you want to pick up upstream changes, and commit the result together with the reason:

| Command | Updates | Why |
|---|---|---|
| `yarn surahs` | `src/data/surahs.json` | Surah names, verse counts, revelation place |
| `yarn sources` | `src/data/islamic-network.json` | Keeps only islamic.network recitations whose 114 files all exist |
| `yarn timings` | `src/data/synced-recitations.json` | Lists recitations whose ayah timings are valid, which decides which ones show the "Synced" badge and can highlight ayahs |

The ayah highlight must never show the wrong verse, so timings are rejected unless they pass the strict checks in `src/lib/timings.ts`. If you change those rules, update the tests in `src/lib/timings.test.ts` and `e2e/live-sync.spec.ts` and explain the measured reason in the PR.

## Pull requests

`master` is protected by a repository ruleset. You can't push to it directly, force-push it or delete it. Changes reach it through a pull request that:

- comes from a branch named for the change (`feature/audio-controls`, `fix/seek-boundary`),
- is up to date with `master`,
- passes the **Lint, Typecheck, Test & Build** check, and
- has one approving review (repository admins may merge their own pull requests without one).

Keep each pull request focused on one change or one cohesive feature, and describe what you verified: which commands you ran and, for UI changes, which screen sizes and themes you looked at.
