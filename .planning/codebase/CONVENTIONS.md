# Coding Conventions

**Analysis Date:** 2026-02-08

## Naming Patterns

**Files:**
- React components: PascalCase (e.g., `ChatWindow.tsx`, `MessageBubble.tsx`)
- Utilities and libraries: camelCase (e.g., `cn.ts`, `openai.ts`)
- Layout and page files: lowercase with appropriate descriptors (e.g., `layout.tsx`, `page.tsx`)
- Page route files follow Next.js naming convention: `page.tsx` in route directory

**Functions:**
- camelCase for all function names
- Descriptive, single-purpose names
- Example: `createClient()`, `createServerSupabaseClient()`, `cn()`

**Variables:**
- camelCase for all variables and constants
- `const` by default, only use `let` when reassignment is necessary
- Example: `const supabaseUrl`, `const supabaseAnonKey`

**Types:**
- PascalCase for type names (imported from React, Next.js, etc.)
- Example: `Metadata`, `ReactNode`, `ClassValue`

## Code Style

**Formatting:**
- Tool: Biome 2.0.0
- Indent: tabs (configured in `biome.json`)
- Quote style: double quotes for JavaScript/TypeScript
- Configured via: `biome.json`

**Linting:**
- Tool: Biome (recommended rules enabled)
- Configuration: `biome.json` with `linter.rules.recommended: true`
- Run: `npm run lint` to lint, `npm run format` to format, `npm run check` for both

**Biome Rules:**
- All recommended rules enabled via `"recommended": true` in `linter.rules`
- VCS integration enabled to use `.gitignore` for file exclusion
- File includes: `src/**`, `*.ts`, `*.tsx`, `*.json`

## Import Organization

**Order:**
1. External dependencies (React, Next.js, third-party libraries)
2. Type imports (using `type` keyword)
3. Internal utilities and libraries
4. CSS/styles

**Example (from `src/app/layout.tsx`):**
```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
```

**Path Aliases:**
- Root alias: `@/*` resolves to `./src/*` (configured in `tsconfig.json`)
- Use for importing from `src/` directory: `import { cn } from "@/lib/cn"`

**Auto-organization:**
- Biome's `assist.actions.source.organizeImports` is enabled
- Imports are automatically organized when formatting

## Error Handling

**Patterns:**
- No explicit error handling currently in place (scaffold stage)
- For API routes and async operations: use try-catch blocks
- Re-throw errors with context added
- Log errors before throwing (once logging is implemented)
- Never swallow errors silently

**Expected Pattern (for future implementation):**
```typescript
try {
	const result = await someAsyncOperation();
	return result;
} catch (error) {
	console.error("Failed to perform operation:", error);
	throw new Error(`Operation failed: ${error instanceof Error ? error.message : "Unknown error"}`);
}
```

## Logging

**Framework:** console (standard Node.js/browser console)

**Patterns:**
- Minimal logging in current scaffold
- Once implemented: use `console.error()` for errors, `console.warn()` for warnings
- Use structured logging when debug output is needed
- Never log sensitive data (API keys, tokens, user credentials)

**Expected Format:**
```typescript
console.error("Operation failed:", errorDetails);
console.warn("Deprecation notice:", message);
```

## Comments

**When to Comment:**
- Explain complex logic or non-obvious decisions
- Clarify why, not what (code shows what)
- Mark TODOs for future work: `// TODO: implement feature X`
- Mark FIXMEs for known issues: `// FIXME: handle edge case Y`

**JSDoc/TSDoc:**
- Use for exported functions and components
- Include @param and @returns for clarity
- Example format (expected):
```typescript
/**
 * Combines class names with Tailwind CSS merge support.
 * @param inputs - Class values to merge
 * @returns Merged and resolved class string
 */
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

## Function Design

**Size:** Keep functions small and focused
- Single responsibility principle
- If explaining requires "and", split into separate functions

**Parameters:**
- Maximum 2-3 parameters; use objects for more complex parameter sets
- Use destructuring where applicable

**Return Values:**
- Explicitly typed (TypeScript strict mode enforced)
- Async functions return Promise<T>
- No implicit undefined returns

**Example (from `src/lib/cn.ts`):**
```typescript
export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}
```

## Module Design

**Exports:**
- Prefer named exports over default exports
- One exported entity per file is preferred
- Utilities can export multiple related functions if logically grouped

**Barrel Files:**
- Use in `src/components/ui/` and similar directories for organizing exports
- Example: `index.ts` that re-exports from sibling files

**File Organization:**
- Each significant utility/library in its own file
- Related utilities grouped in subdirectories (`src/lib/supabase/`)
- Components organized by feature/domain in `src/components/`

## TypeScript Configuration

**Strict Mode:** Enabled
- `strict: true` in `tsconfig.json`
- `noEmit: true` — no output, relies on Next.js build
- `isolatedModules: true` — safe transpilation for each file

**Module Resolution:**
- `moduleResolution: "bundler"` for Next.js compatibility
- Path aliases configured: `@/*` → `./src/*`

## Environment Variables

**Public Variables:**
- Prefix with `NEXT_PUBLIC_` (accessible in browser)
- Examples: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_APP_URL`

**Private Variables:**
- No prefix (server-only)
- Examples: `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
- Access only in API routes or server actions

**Defaults:**
- Use nullish coalescing for safety: `process.env.VAR ?? "default"`
- Validate on startup, not on every access

**Example (from `src/lib/supabase/client.ts`):**
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
```

## Client vs Server Code

**Client Components:**
- Default in Next.js 13+ App Router
- No `"use client"` directive needed unless using hooks/browser APIs
- React components in `src/components/`

**Server Components:**
- Default for pages and layouts
- Can access databases, services directly
- No browser APIs or hooks (useState, useEffect, etc.)
- Example: `src/app/layout.tsx`

**Server Actions:**
- Mark with `"use server"` directive
- Used for API operations that need server-side secrets
- Example: document upload, embedding generation, chat requests

---

*Convention analysis: 2026-02-08*
