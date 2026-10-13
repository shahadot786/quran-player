# Tilawah (তিলাওয়াত) — Quran Player

[![Verify](https://github.com/shahadot786/quran-player/actions/workflows/verify.yml/badge.svg)](https://github.com/shahadot786/quran-player/actions/workflows/verify.yml)
[![Live site](https://img.shields.io/badge/live-tilawah.shahadot.dev-1f5c48)](https://tilawah.shahadot.dev)

Listen to the whole Quran, surah by surah, in the voices of more than 230 reciters, with the Arabic text and its Bengali translation following the recitation ayah by ayah. It resumes exactly where you stopped, works offline, and keeps everything you do on your own device.

**Live:** [tilawah.shahadot.dev](https://tilawah.shahadot.dev)

![The player page in Bengali with the dark theme: Surah Al-Baqarah playing, with the Live Quran panel highlighting the ayah being recited](.github/assets/player-page.png)

<sub>The player page in Bengali (dark theme). The Live Quran panel on the right has highlighted Ayah 34 because that is the ayah being recited at 11:12.</sub>

## Features

### Listening
- **Every reciter has all 114 surahs.** Recitations that are missing surahs are dropped, and reciters that mp3quran only offers in part are filled from other free sources (see [Data sources](#data-sources)).
- **A dedicated player** at `/player`: seek, ±10s skip, previous/next, speed (0.5×–2×), repeat, volume, a sleep timer (15, 30, 45 or 60 minutes, or end of surah) and auto-advance.
- **Play all 114 surahs** in order with one button, or start from any surah and continue to An-Nas.
- **Queue manager**: reorder, remove, shuffle, clear, or save the queue as a playlist.
- **Change reciter or recitation mid-surah** and keep your place.
- **A-B loop** to repeat a passage for memorization and tajweed practice.
- **Resume anywhere**: reload the page and the player is back at the same second, paused.
- **Lock-screen and headset controls** through the Media Session API, plus keyboard shortcuts (Space, ←/→, M).

### Live Quran
- The Arabic text with the Bengali translation, with the **current ayah highlighted and scrolled into view as it is recited**.
- Tap **Play from ayah N** on any ayah to jump there.
- The highlight only follows when real ayah timings exist for that exact recording, so it never guesses. See [How the sync works](#how-the-ayah-sync-works).

### Quran progress
- **Home at a glance:** today's date with the Hijri date, Quran progress, today's listening and zikir, your streak, your khatm plan and a reminder to sync when it's been a while.
- **Khatm planner:** pick a finish date (in 30 days, by the end of Ramadan, or any day) and see about how many paras and minutes a day get you there.
- **A full picture of your khatm** at `/progress`, with a summary card on the player page: percent of the Quran heard, surahs and paras finished, ayahs heard, time listened, daily average and an estimate of the time left.
- **A grid of all 30 paras and all 114 surahs.** Tap a surah to see which parts you have heard, how many times you finished it, when you last listened, your most-used reciter and the time spent.
- **Honest numbers.** A surah counts as finished only when 95% of it was actually heard, so seeking to the end or replaying a part doesn't count. Paras that cut through a surah are labelled "estimated".
- **Khatm rounds:** finish all 114 and the round is recorded with its date, then a new one starts.
- If you used an earlier version, your finished surahs, resume points and history are carried over automatically, and your old data is never modified.

### Zikir
- **A tasbih you can count on** at `/zikir`: a 3D **bead string** (a misbaha with one bead per count of the target, up to 100, with a gold marker bead and tassel) or a 3D **dial** whose ticks follow the target, built with Three.js. Tap, press Enter or Space, or swipe, and one bead moves past with a soft click and a light vibration. With reduced motion on, the chosen 3D view stays but nothing spins. A plain 2D counter is always available and is used when WebGL isn't.
- **Ready-made zikir and groups:** SubhanAllah, Alhamdulillah, Allahu Akbar, La ilaha illallah, Astaghfirullah, salawat and more, and groups that move step by step, such as the after-salah 33, 33 and 34.
- **Morning and evening adhkar from Hisnul Muslim:** two groups that run the book's morning and evening remembrance in order (Ayat al-Kursi, the three Quls, Sayyid al-Istighfar and the rest, with each count), and every entry on its own with the Arabic, a transliteration and the meaning in English and Bengali. The wording that changes between morning and evening has its own entry for each.
- **Your own zikir and groups:** set a count or no limit, add Arabic text, transliteration and meaning, order the steps of a group, and delete anything you don't want. Built-in ones are hidden rather than lost, and "Restore removed zikir" brings them back.
- Undo, start over, finish a round by hand, optional sound and vibration, and keep-the-screen-on. An unfinished round is waiting for you when you come back.
- **Goals, streaks and a year calendar:** a daily goal per zikir or group, current and longest streak, a 7-day chart, and a full-year calendar with the Hijri date; tap a day to see what you counted and which rounds you finished.

### Your library
- Favorite reciters and surahs, playlists (create, rename, reorder, play all), and listening history.
- **Stats**: time listened, surahs completed, current and longest streak, top reciters, a 7-day chart and a **full-year listening calendar**. Tap a day to see its Hijri date and every surah you listened to, with reciter, start time and length (kept for about a year).
- **Ayah bookmarks and notes:** bookmark any ayah in Live Quran, add a note for memorizing or reflection, and find them all under Library → Bookmarks, ready to play again.
- **Reminders:** morning and evening zikir, and a daily listening goal. Notifications appear while the app is open or running in the background; one you miss waits on Home until you've done it.
- **Backup**: export, import or reset all local data as JSON.

### Cloud sync (optional)
- **Nothing leaves your device unless you press Sync.** There are no accounts: the app makes a short **sync code** in your browser, four simple words and a number such as *lunar pizza tiger cabin 42*, or you can type a phrase of your own (at least four words). The code is stretched on your device (PBKDF2, 600,000 rounds) into a long token before anything is sent, so the words themselves never leave it and every guess costs a lot of work. The cloud keeps one copy of your progress, zikir, stats and library under a hash of that token. Older long keys keep working.
- **Sync now** pulls the cloud copy, merges it with this device (progress heard on either device counts, zikir counted on two devices adds up, deleted zikir stay deleted) and saves the result in both places, so one device never overwrites another.
- **Sync automatically** (off until you turn it on, after your first sync): the first time you open the app each day it syncs for you and shows "Auto sync done". A sync you did yourself that day counts. If it can't finish, it tells you once and tries again when you next open the app or get back online.
- **Devices using this code:** the sync card lists every device that has synced, with its last sync time. Each starts with a name made from its browser (such as "Chrome · Android"); rename yours, or remove an old device from the list. A removed device comes back the next time it syncs. Only the browser and system names are stored, and "Delete my cloud data" also turns auto sync off.
- **Restore from code** brings your data to another device or after clearing the browser. **Delete my cloud data** removes the cloud copy and leaves the data on your device alone.
- Anyone who has your code can read and change your cloud copy, and a lost code can't be recovered, so keep it safe. **Copy link** makes a link that fills the code in on another device, and **Change code** moves your cloud copy to a code you prefer (a code already in use is refused). The JSON backup stays as a second safety net.
- Removing a favorite, deleting a playlist, removing a bookmark or a zikir all carry over to your other devices.
- **Save as file** keeps a copy of your code with instructions.
- Sync is off unless the server has a database configured (see Environment).

### Offline and installable
- **Download surahs** for offline listening, seeking included, and install the app on iOS, Android or desktop (PWA).

### Made for reading and listening
- **English and বাংলা** across the interface, reciter names and surah names, with light, dark and system themes.
- An ambient Kaaba visualizer on the player page.
- Server-rendered pages with a sitemap, `robots.txt`, OpenGraph and Twitter cards, and structured data.

## Data sources

| Source | Used for | Notes |
|---|---|---|
| [mp3quran.net](https://www.mp3quran.net/) | Most reciters and audio, and ayah timings | Downloadable for offline. |
| [quran.com](https://quran.com/) API v4 | A dozen more recitations, ayah timings, surah metadata | Downloadable for offline. |
| [islamic.network](https://islamic.network/) audio CDN | Reciters missing a complete recitation elsewhere | Streams, but sends no CORS headers, so these can't be downloaded. They are labeled "streaming only". |
| [alquran.cloud](https://alquran.cloud/) / quran.com | Arabic text and the Bengali translation | Cached on the device. |
| [sunnah.com](https://sunnah.com/hisn) Hisnul Muslim | The morning and evening adhkar: Arabic, transliteration, English meaning and counts | Written into the app's built-in zikir once; the Bengali text was written for this app. Typos on the source pages were fixed, and the evening wording of entries 77, 80 and 81, which the source gives only in transliteration, was derived from its footnotes. |

The three audio catalogs are merged into one list: earlier sources win, and a later source only fills in a recitation the earlier ones don't have. Details are in `src/lib/api/merge.ts`.

## How the ayah sync works

A guessed position would highlight the wrong verse, so the Live Quran panel only follows recitations with real timing data:

1. **Timings are checked strictly.** The ayah count must match the surah, ayahs must be in order, and times can't go backwards. Anything irregular is rejected whole.
2. **They are checked against the audio.** The last ayah must end within a few seconds of the end of the file. Timings made for a different recording are off by tens of seconds or more and are refused.
3. **The highlight reads the audio clock every animation frame** while playing. Against the real Alafasi recording, ayahs lit up within 4–18 ms of their true boundaries.

About 100 reciters (roughly 100 recitations) can follow along. Reciters marked **Synced** in the picker do, and there is a "Synced recitations only" filter. The others still play normally, and the panel says sync isn't available for them.

## Tech stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack) and [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/) with [shadcn/ui](https://ui.shadcn.com/)
- **3D**: [Three.js](https://threejs.org/), loaded only on the zikir counter page and only when a 3D view is shown
- **State**: [Zustand](https://zustand-demo.pmnd.rs/) persisted to localStorage, with IndexedDB and the Cache API for downloads
- **i18n**: [next-intl](https://next-intl.dev/) with `messages/en.json` and `messages/bn.json`
- **PWA and offline**: [Serwist](https://serwist.pages.dev/) (`@serwist/turbopack`)
- **Cloud sync**: route handlers with [Neon](https://neon.tech/) serverless Postgres (`@neondatabase/serverless`), only when `DATABASE_URL` is set
- **Tests**: [Vitest](https://vitest.dev/) and [Playwright](https://playwright.dev/)

## Getting started

### Prerequisites

- Node.js 22 or later
- [Yarn 1](https://classic.yarnpkg.com/) (the repo uses `yarn.lock`)

### Install and run

```bash
git clone https://github.com/shahadot786/quran-player.git
cd quran-player
yarn install
cp .env.example .env.local
yarn dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment

| Variable | Purpose | Default |
|---|---|---|
| `NEXT_PUBLIC_SITE_URL` | Canonical URLs, sitemap, `robots.txt` and OpenGraph tags | `https://tilawah.shahadot.dev` |
| `DATABASE_URL` | Neon connection string (pooled) for cloud sync. Server only. Without it, sync answers "not available" and everything else works | unset |
| `CRON_SECRET` | Secret for the weekly cleanup job at `/api/sync/cleanup`. Also used to hash addresses for rate limits. Server only | unset |

Never commit real values: they belong in `.env.local` and in your host's environment settings.

### Scripts

| Command | What it does |
|---|---|
| `yarn dev` / `yarn build` / `yarn start` | Run, build and serve the app |
| `yarn lint` | ESLint |
| `yarn typecheck` | Generates Next's route types, then runs `tsc --noEmit` |
| `yarn test` | Unit tests (Vitest) |
| `yarn test:e2e` | End-to-end tests (Playwright) on a production build at port 3100 |
| `yarn surahs` | Regenerate `src/data/surahs.json` |
| `yarn sources` | Re-check which islamic.network recitations have all 114 files (`src/data/islamic-network.json`) |
| `yarn timings` | Re-validate ayah timings for every recitation (`src/data/synced-recitations.json`) |
| `yarn db:migrate` | Create the cloud sync tables in the database named by `DATABASE_URL` (reads `.env.local`; safe to run again) |
| `yarn juzs` | Re-fetch the 30 para boundaries and check them against the surah data (`src/data/juzs.json`) |

The data files are committed. Only re-run `sources`, `timings` and `juzs` when you want to pick up upstream changes.

## Quality checks

Everything below also runs in GitHub Actions on every push and pull request:

```bash
yarn lint
yarn typecheck
yarn test
yarn build
yarn test:e2e
```

The end-to-end tests stub the audio and the timing and text APIs, so they don't depend on any CDN. They run at desktop and mobile sizes.

## Project layout

```
src/app/            routes, API routes (/api/reciters, /api/timings), manifest, sitemap, service worker
src/components/     UI: player, player-page, library, progress, stats, layout, shadcn ui
src/hooks/          audio engine, media session, ayah sync
src/lib/            audio URLs, catalog merging, timings, downloads, backup, stats, progress (src/lib/progress)
src/stores/         persisted Zustand stores (player, library, settings, stats, progress, downloads)
src/data/           bundled surah metadata, para boundaries, recitation and timing lists
messages/           en.json, bn.json
e2e/                Playwright tests
scripts/            data refresh scripts
```

## Deployment

The app deploys on [Vercel](https://vercel.com):

1. Import the `quran-player` repository.
2. Optionally set `NEXT_PUBLIC_SITE_URL` (the default is already `https://tilawah.shahadot.dev`). If you set it, use the production domain.
3. For cloud sync, create a free Neon project, run `yarn db:migrate` once against it, and set `DATABASE_URL` and `CRON_SECRET` in the Vercel project. `vercel.json` schedules the weekly cleanup of copies untouched for 12 months.
4. Deploy. The production domain is [tilawah.shahadot.dev](https://tilawah.shahadot.dev).

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for conventions, the branching model and how pull requests are merged. `master` is protected: every change goes through a pull request with passing CI.

## License

Released under the [MIT License](LICENSE).
