# Technology Stack

**Analysis Date:** 2026-02-08

## Languages

**Primary:**
- TypeScript 5.8.3 - Full codebase type safety, configuration files, and Next.js integration

**Secondary:**
- JavaScript (ECMAScript 2017 target) - PostCSS configuration uses `.mjs` format

## Runtime

**Environment:**
- Node.js (version specified in `.nvmrc` or inferred from Next.js 15 requirements - LTS 18+ recommended)

**Package Manager:**
- npm - Primary package manager
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js 15.3.2 - Full-stack framework with App Router, TypeScript support, and Turbopack for fast dev builds
- React 19.1.0 - UI component library
- React DOM 19.1.0 - React rendering for web

**Styling:**
- Tailwind CSS 4.1.4 - Utility-first CSS framework
- @tailwindcss/postcss 4.1.4 - PostCSS plugin for Tailwind v4
- PostCSS - CSS transformation pipeline (configured in `postcss.config.mjs`)

**UI Utilities:**
- clsx 2.1.1 - Conditional classname utility
- tailwind-merge 3.3.0 - Merge Tailwind class conflicts
- lucide-react - SVG icon component library

## Key Dependencies

**Critical:**
- openai 5.1.0 - OpenAI API client for GPT-4o-mini and embeddings
- @supabase/supabase-js 2.49.4 - Browser Supabase client for database, auth, and storage
- @supabase/ssr 0.6.1 - Server-side Supabase client with cookie-based auth for Next.js SSR

**Development:**
- @biomejs/biome 2.0.0 - Linter and formatter (replaces ESLint + Prettier)
- TypeScript 5.8.3 - Type checker and transpiler
- @types/node 22.15.0 - Node.js type definitions
- @types/react 19.1.2 - React type definitions
- @types/react-dom 19.1.2 - React DOM type definitions

## Configuration

**Environment:**
- Configuration via `.env.local` (development) and environment variables (production)
- Required secrets: `OPENAI_API_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Optional: `NEXT_PUBLIC_APP_URL` for deployment

**Build:**
- `next.config.ts` - Next.js configuration (currently minimal/default)
- `tsconfig.json` - TypeScript compiler options with path alias `@/*` → `./src/*`
- `biome.json` - Linter and formatter configuration with git integration and import organization
- `postcss.config.mjs` - PostCSS pipeline for Tailwind CSS v4

## Platform Requirements

**Development:**
- Node.js 18+ (LTS recommended for Next.js 15 compatibility)
- npm 7+ for package management
- Windows/macOS/Linux (confirmed running on Windows 11)

**Production:**
- Deployment target: Vercel (standard Next.js hosting)
- No additional infrastructure required (Vercel handles Node.js runtime)

---

*Stack analysis: 2026-02-08*
