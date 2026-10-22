<!-- sourcevision-primer fingerprint: 492d9f0157b912f9 -->

**Layout**
This is a TypeScript-only project (43 files, about 11k lines) named `ts-css`. Everything is under `src/`, apart from `vite.config.ts` at the root.
- `src/pages/`: one module per page, such as `accordion.ts`, `canvas.ts`, `about.ts` and `text-tetris.ts`. This is most of the production code.
- `src/components/`: reusable UI pieces: `source-viewer.ts`, `performance-meter.ts`, `slider.ts`, `toggle.ts` and `search.ts`.
- `src/shared/`: cross-page modules, including `pretext-helpers.ts`, `nav-data.ts`, `controls.ts`, `shell.ts`, `analytics.ts`, `museum.ts` and the `newspaper-*` files.
- `src/env.d.ts`: ambient type declarations.
- Tests are colocated with the code, not in a separate directory. The only one the analysis shows is `src/shared/nav-data.test.ts`.

**Build and test commands**
The analysis doesn't list any. The presence of `vite.config.ts` suggests Vite is the bundler. Check `package.json` for the actual scripts before you assume anything.

**Conventions**
- The code is TypeScript with ES module imports.
- Each page is a self-contained module that imports shared helpers and components.
- Nearly every page imports `src/shared/pretext-helpers.ts` and `createSourceViewer` from `src/components/source-viewer.ts`.
- `src/shared/shell.ts` wires together nav, search, controls, analytics and the museum module.
- The analysis doesn't name the test framework or any lint or formatting rules.

**Newcomer traps**
- `createSourceViewer` is called from 23 files. Changing its signature or behavior touches nearly every page, so treat it as a public API.
- `pretext-helpers.ts` is imported by about 26 files and carries the same risk.
- Zones named "Pages 2", "Pages 3" and "Pages 4" are auto-generated clusters, not real architecture. Don't look for a meaningful boundary between them and "Pages". `about.ts` and `text-tetris.ts` are each in a zone of their own for the same reason.
- `src/components/` and `src/pages/` import each other in both directions, with 15 imports one way and 8 the other. Don't assume components are leaf modules, and watch for import cycles when adding imports.
- `TrayImageDef` and `TRAY_IMAGES` in `src/shared/newspaper-images.ts` are exported but imported nowhere. Check before building on them or deleting them.
- `.sourcevision/` holds generated analysis, which is modified and untracked in the working tree. Don't hand-edit it, and keep it out of unrelated commits.

- Open `package.json` to get the real build, dev and test scripts.
- Check the `nav-data.test.ts` imports to identify the test framework.
- Grep for importers of `createSourceViewer` and `pretext-helpers.ts` before changing either.
