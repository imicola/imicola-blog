# AGENTS.md
Repository operating guide for coding agents in `imicola-blog`.

## 1) Project Snapshot
- Stack: Astro 5, TypeScript, Svelte, Tailwind CSS 4.
- Package manager: `pnpm` only (`preinstall` enforces this).
- Output: static site (`astro.config.mjs` uses `output: "static"`).
- Main code areas:
  - `src/components/` (Astro/Svelte UI)
  - `src/layouts/` (page layout shells)
  - `src/pages/` (route files)
  - `src/utils/` (shared utilities)
  - `src/content/` (posts/spec markdown)
  - `src/content.config.ts` (content schemas)

## 2) Setup and Run
Run commands from repository root.

```bash
pnpm install
pnpm dev
```

Typical dev URL: `http://localhost:4321`.

## 3) Build, Lint, Format, Check, Test

### Core scripts
```bash
pnpm dev
pnpm build
pnpm preview
pnpm check
pnpm type-check
pnpm format
pnpm lint
```

### Script behavior
- `pnpm dev`: Astro dev server.
- `pnpm build`: `node scripts/update-anime.mjs && astro build && pagefind --site dist && node scripts/compress-fonts.js`.
- `pnpm preview`: preview the production build.
- `pnpm check`: Astro diagnostics (`astro check`).
- `pnpm type-check`: TS diagnostics (`tsc --noEmit --isolatedDeclarations`).
- `pnpm format`: Prettier write on `./src`.
- `pnpm lint`: `eslint ./src --fix`.

### Lint caveat
- Repo has a lint script, but no local ESLint dependency/config was found.
- Treat `pnpm lint` as environment-dependent unless ESLint is explicitly added.

### Test status
- No Jest/Vitest test suite is configured.
- Existing test-like script is utility-only:

```bash
pnpm test-font-compression
```

- Do not present this as unit/integration testing.

## 4) Single-Test / Single-File Guidance
There is currently no true single-test command.

Use project-wide validation instead:

```bash
pnpm check
pnpm type-check
```

Agent rule:
- If asked to run one test, state that no test runner exists.
- Suggest adding Vitest if per-test execution is required.

## 5) Repository Utility Scripts
```bash
pnpm new-post <filename>
pnpm sync-content
pnpm init-content
pnpm update-anime
pnpm update-bangumi
pnpm update-bilibili
pnpm compress-fonts
pnpm submit
```

These are content/data maintenance tasks.

## 6) Code Style and Conventions

### Formatting (from `.prettierrc`)
- `printWidth: 80` (CSS override: 200)
- `tabWidth: 4`, `useTabs: true` (CSS override: 2 spaces, no tabs)
- `semi: true`, `singleQuote: false`, `trailingComma: "all"`
- `endOfLine: "crlf"`
- Plugins: `prettier-plugin-astro`, `prettier-plugin-svelte`

Do not hand-format against these settings.

### Imports
- Prefer TS path aliases in `tsconfig.json`:
  - `@/*`, `@components/*`, `@utils/*`, `@i18n/*`, `@assets/*`, `@layouts/*`, `@constants/*`
- Use `import type` for type-only imports.
- In `.astro`, keep imports at top of frontmatter.
- Prefer nearby relative imports only for same-folder/sibling components.

### Naming
- Astro components: `PascalCase.astro`.
- TS utilities/modules: `kebab-case.ts`.
- Variables/functions: `camelCase`.
- Constants: `SCREAMING_SNAKE_CASE`.
- Types/interfaces/enums: `PascalCase`.

### Types and validation
- Keep explicit typing in TS and Astro frontmatter.
- Follow existing Zod schema style in `src/content.config.ts`.
- Use typed props interfaces in components.
- Avoid `any`; if unavoidable, constrain and document why.

### Astro/Svelte patterns
- Use frontmatter `---` and destructure `Astro.props` early.
- Use `class:list` for conditional classes.
- Keep heavy logic in `src/utils/*`, not in templates.
- For shared text, route through i18n keys in `src/i18n/*`.

### Error handling
- Never use empty catch blocks.
- Existing code favors `console.error`/`console.warn` + graceful fallback.
- Prefer degraded UX over hard crash for non-critical runtime failures.

### Content rules
- Posts/spec live under `src/content/posts` and `src/content/spec`.
- Respect schema fields (`title`, `published`, `draft`, `tags`, `category`, etc.).
- Keep frontmatter values compatible with `src/content.config.ts` schema.

## 7) Agent Change Scope
- Keep edits focused; avoid opportunistic refactors.
- Match existing architecture/patterns before introducing new ones.
- Do not add dependencies unless clearly necessary.
- Keep comments minimal and only for non-obvious intent.
- Do not commit unless the user explicitly asks.

## 8) Cursor/Copilot Rule Files
Checked paths:
- `.cursorrules`
- `.cursor/rules/`
- `.github/copilot-instructions.md`

Current repository status:
- No Cursor rule files found.
- No Copilot instructions file found.

If these files are added later, treat them as higher-priority local instructions and merge this guide accordingly.

## 9) Recommended Validation Sequence
For code changes, run:

```bash
pnpm format
pnpm check
pnpm type-check
pnpm build
```

If maintainers require lint, ensure ESLint is available/configured first.

## 10) Evidence Basis
This guide is based on `package.json`, `tsconfig.json`, `.prettierrc`, `.prettierignore`, `astro.config.mjs`, and representative files under `src/components`, `src/utils`, and `src/content.config.ts`.
