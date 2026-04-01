# Contributing to Learn Pretext

Thanks for your interest in contributing to Learn Pretext! This is an open-source learning resource for [@chenglou/pretext](https://github.com/chenglou/pretext), maintained by [En Dash Consulting](https://endash.us).

## Getting started

```bash
git clone https://github.com/en-dash-consulting/learn-pretext.git
cd learn-pretext
npm install
npm run dev
```

The dev server starts at `http://localhost:5173`. The site uses Vite in MPA (multi-page application) mode — each page is a separate HTML entry point.

## Project structure

- `index.html` + `pages/*.html` — HTML entry points (one per page)
- `src/pages/*.ts` — Page-specific TypeScript logic
- `src/shared/` — Shell (header/sidebar/footer), navigation data, analytics, CSS
- `src/components/` — Reusable components (search, source viewer, slider, toggle, performance meter)
- `public/` — Static assets (favicons, OG image, robots.txt, sitemap)
- `docs/` — Research and planning documents

## How to contribute

### Bug reports

Open an issue with:
- What you expected to happen
- What actually happened
- Browser and OS version
- Screenshots if applicable

### Feature requests

Open an issue describing the feature and why it would be useful for learners.

### Pull requests

1. Fork the repo and create a branch from `main`
2. Make your changes
3. Ensure `npm run build` succeeds with no TypeScript errors
4. Run `npm test` and verify tests pass
5. Open a pull request with a clear description of the change

### Adding a new demo page

1. Create `pages/your-page.html` following the SEO template from existing pages
2. Create `src/pages/your-page.ts` with the demo logic
3. Add the page entry to `vite.config.ts` under `build.rollupOptions.input`
4. Add the page to `src/shared/nav-data.ts` in the appropriate track
5. Add the page to `public/sitemap.xml`

## Code style

- **TypeScript strict mode** — no `any`, no type assertions unless truly necessary
- **Vanilla JS** — no frameworks, keep dependencies minimal
- **Self-contained demos** — each page should work independently
- **Annotated source** — demos should include source viewers showing how they work

## Testing

```bash
npm test          # Run tests once
npm run test:watch  # Watch mode
```

Tests use Vitest with jsdom environment.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
