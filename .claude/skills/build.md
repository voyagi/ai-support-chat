# Build & Fix Skill

## Build Command

```bash
npm run build
```

## Dev Server

```bash
npm run dev
```

## Lint & Format

```bash
npm run check    # Biome check (lint + format + organize imports)
npm run lint     # Biome lint only
npm run format   # Biome format only
```

## Fix Loop

When the build or lint fails:

1. Read the error output carefully
2. Identify the file and line number
3. Fix the issue
4. Re-run the failing command
5. Repeat until clean

## Common Issues

- **Import order**: Biome auto-fixes with `npm run check`
- **Unused variables**: Remove them or prefix with `_`
- **Type errors**: Check `tsconfig.json` paths and ensure types are installed
- **Tailwind v4**: Uses `@import "tailwindcss"` not `@tailwind` directives
- **Next.js App Router**: Server components by default; add `"use client"` for client components
