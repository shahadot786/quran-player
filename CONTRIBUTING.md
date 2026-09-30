# Contributing to Quran Player

Thank you for your interest in contributing to Quran Player! We welcome bug reports, feature suggestions, documentation enhancements, and pull requests from the community.

## Development Setup

1. **Prerequisites**
   - Node.js 20 or later
   - npm 10 or later

2. **Clone and Install**
   ```bash
   git clone https://github.com/shahadot786/quran-player.git
   cd quran-player
   yarn install
   ```

3. **Run Development Server**
   ```bash
   yarn dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to view the application.

## Quality Standards & Guidelines

Before submitting a Pull Request, make sure your code adheres to our project conventions:

- **Next.js & React Conventions**: Built on Next.js 16 App Router, React 19, and Turbopack. Keep server components as default and use `'use client'` only where interactive state or browser APIs are required.
- **Code Cleanliness**: Code should be self-documenting. Do not leave redundant explanatory comments or AI prompt artifacts in source files.
- **Tailwind CSS**: Use standard Tailwind CSS utility classes. Avoid arbitrary bracketed pixel values (e.g., `[14px]`) where existing scale values fit.
- **Internationalization (i18n)**: All UI strings must support both English and Bengali. When adding or modifying copy, update both `messages/en.json` and `messages/bn.json` with accurate, natural terminology.
- **Accessibility & Design**: Ensure components have descriptive `aria-label` attributes, keyboard navigation support, and responsive layouts that scale gracefully from mobile to desktop.

## Verification Checklist

Please run the following commands locally to verify everything passes before pushing:

```bash
# 1. Linting
yarn lint

# 2. TypeScript compilation check
yarn typecheck

# 3. Unit and component tests
npm test

# 4. Production build
yarn build

# 5. Playwright E2E tests
yarn test:e2e
```

## Pull Request Guidelines

1. Create a descriptive branch name (e.g. `feature/audio-controls`, `fix/seek-boundary`).
2. Keep pull requests focused on a single change or cohesive feature.
3. Ensure the GitHub Actions verification workflow passes completely on your PR.
