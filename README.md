# Quran Player (কুরআন প্লেয়ার)

A modern, fast, and feature-rich Holy Quran audio player built with **Next.js 16 (App Router)**, **React 19**, **Tailwind CSS v4**, and **Serwist PWA**. Stream high-quality Quranic recitations from world-renowned Qaris with synchronized queues, A-B memorization repetition, offline caching, and an ambient Kaaba Sharif audio visualizer.

![Quran Player Banner](public/icons/icon-512.png)

## Highlights & Features

- **Immersive Dedicated Player**: Full workstation at `/player` with audio scrubbing, speed regulation (0.5×–2×), sleep timer, and auto-advance.
- **Ambient Kaaba Sharif Visualizer**: Elegant silhouette of the Holy Kaaba (الكعبة المشرفة) featuring Kiswah accents, golden Hizam band, and dynamic Tawaf acoustic wave ripples synchronized with playback.
- **Authentic Bilingual Support**: Complete language switching between **English** and **বাংলা (Bengali)** with authentic Islamic terminology (no machine-translated phrasing).
- **A-B Memorization Repetition**: Set precise segment loop points (Point A & Point B) for Hifz, Tajweed revision, and deep contemplation.
- **Comprehensive Reciter Library**: Seamlessly stream from world-famous reciters (Mishary Rashid Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly, Saud Al-Shuraim, and dozens more) with multi-style riwayahs (Hafs, Warsh, Mujawwad).
- **Persistent Global Audio Engine**: Background playback, MediaSession metadata integration for lockscreen/headset controls, and keyboard shortcuts.
- **Progressive Web App (PWA)**: Offline audio and metadata caching powered by Serwist service workers. Installable on iOS, Android, and Desktop.
- **Production-Grade SEO**: Pre-configured dynamic sitemaps (`/sitemap.xml`), crawler directives (`/robots.txt`), OpenGraph, Twitter cards, and Schema.org `WebApplication` structured data.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router, Turbopack)
- **Library**: [React 19](https://react.dev/)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
- **State Management**: [Zustand](https://zustand-demo.pmnd.rs/) with localStorage & IndexedDB persistence
- **Internationalization**: [next-intl](https://next-intl-docs.vercel.app/)
- **PWA & Offline**: [@serwist/turbopack](https://serwist.pages.dev/)
- **Testing**: [Vitest](https://vitest.dev/) & [Playwright](https://playwright.dev/)

## Getting Started

### Prerequisites

- Node.js 20 or later
- npm 10 or later

### Installation

```bash
git clone https://github.com/shahadot786/quran-player.git
cd quran-player
yarn install
cp .env.example .env.local
```

### Running Locally

```bash
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Quality Checks & Testing

Ensure all tests and type checks pass prior to opening a PR:

```bash
# Code style and linting
yarn lint

# TypeScript verification
yarn typecheck

# Unit and component test suites (Vitest)
npm test

# Production build test
yarn build

# End-to-end integration tests (Playwright)
yarn test:e2e
```

## Vercel Deployment

This project is optimized for deployment on [Vercel](https://vercel.com):

1. **Push to GitHub**: Push your changes to your GitHub repository.
2. **Import Project**: In the Vercel dashboard, click **"Add New Project"** and select `quran-player`.
3. **Environment Variables**:
   - `NEXT_PUBLIC_SITE_URL`: Set your production URL (`https://tilawah.shahadot.dev`) for accurate canonical URLs, OpenGraph image tags, and sitemap generation.
4. **Deploy**: Click **Deploy**. Vercel will build and launch your application globally.

## Contributing

Contributions are warmly welcome! Please review [CONTRIBUTING.md](CONTRIBUTING.md) for code conventions, branching model, and PR guidelines.

## License

This project is open-source under the MIT License.
