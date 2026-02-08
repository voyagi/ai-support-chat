# Codebase Structure

**Analysis Date:** 2026-02-08

## Directory Layout

```
upwork-ai-chatbot/
├── src/
│   ├── app/                    # Next.js App Router pages and layouts
│   │   ├── layout.tsx          # Root layout with metadata and font setup
│   │   ├── page.tsx            # Landing page (/)
│   │   ├── globals.css         # Global Tailwind styles
│   │   ├── chat/
│   │   │   └── page.tsx        # Full-page chat interface (/chat)
│   │   ├── admin/
│   │   │   ├── page.tsx        # Admin dashboard (/admin)
│   │   │   └── upload/
│   │   │       └── page.tsx    # Document upload form (/admin/upload)
│   │   ├── widget/
│   │   │   └── page.tsx        # Widget preview and embed code (/widget)
│   │   └── api/
│   │       ├── chat/
│   │       │   └── route.ts    # POST /api/chat (streaming chat responses)
│   │       ├── documents/
│   │       │   └── route.ts    # POST /api/documents (upload + embed)
│   │       └── conversations/
│   │           └── route.ts    # GET/POST /api/conversations
│   ├── components/             # Reusable React components
│   │   ├── chat/
│   │   │   ├── ChatWindow.tsx  # Main chat UI (messages + input)
│   │   │   ├── MessageBubble.tsx # Individual message styling
│   │   │   └── ChatInput.tsx   # User input form with send button
│   │   ├── admin/
│   │   │   ├── DocumentList.tsx # List uploaded documents
│   │   │   └── UploadForm.tsx  # File upload + chunk config
│   │   ├── widget/
│   │   │   ├── WidgetBubble.tsx # Floating bubble trigger
│   │   │   └── WidgetEmbed.tsx # Iframe wrapper for embeds
│   │   └── ui/
│   │       └── (buttons, dialogs, etc) # Shared UI primitives
│   └── lib/                    # Business logic and integrations
│       ├── openai.ts           # OpenAI client singleton
│       ├── cn.ts               # Tailwind classname utility
│       ├── embeddings.ts       # Document chunking + embeddings (planned)
│       ├── rag.ts              # Vector search + prompt injection (planned)
│       └── supabase/
│           ├── client.ts       # Browser Supabase client (anon key)
│           ├── server.ts       # Server Supabase client (service role)
│           └── middleware.ts   # Auth middleware (planned)
├── .claude/                    # Claude Code configuration
│   └── skills/                 # Per-project skills
├── .planning/
│   └── codebase/               # GSD analysis documents (this folder)
├── biome.json                  # Biome linter/formatter config
├── tsconfig.json               # TypeScript compiler options
├── next.config.ts              # Next.js configuration
├── package.json                # Dependencies and scripts
├── package-lock.json           # Locked dependency versions
├── postcss.config.mjs          # PostCSS config for Tailwind
├── .env.example                # Environment variable template
├── .gitignore                  # Git ignore rules
├── CLAUDE.md                   # Project-specific instructions
└── README.md                   # Project documentation (planned)
```

## Directory Purposes

**`src/app/`:**
- Purpose: Next.js App Router pages and API routes
- Contains: Page components, layouts, API handlers
- Key files: `layout.tsx` (root), `page.tsx` (landing), `globals.css` (styles)

**`src/app/chat/`:**
- Purpose: Full-page chat interface
- Contains: Chat page component, embedded ChatWindow
- Key files: `page.tsx` for `/chat` route

**`src/app/admin/`:**
- Purpose: Knowledge base management and admin controls
- Contains: Admin dashboard, document upload, knowledge base editor
- Key files: `page.tsx` (dashboard), `upload/page.tsx` (upload form)

**`src/app/widget/`:**
- Purpose: Embeddable chat widget
- Contains: Widget preview, embed code generator, iframe wrapper
- Key files: `page.tsx` for widget configuration page

**`src/app/api/`:**
- Purpose: Backend API endpoints
- Contains: Route handlers for chat, documents, conversations
- Pattern: One subdirectory per logical endpoint (e.g., `chat/route.ts`)

**`src/components/`:**
- Purpose: Reusable React components
- Contains: Interactive UI components organized by feature
- Naming: PascalCase .tsx files (e.g., ChatWindow.tsx)

**`src/lib/`:**
- Purpose: Shared business logic and utility functions
- Contains: Client factories, API wrappers, pure functions
- Naming: camelCase .ts files (e.g., openai.ts, cn.ts)

## Key File Locations

**Entry Points:**
- `src/app/layout.tsx`: Root HTML layout, metadata, font setup
- `src/app/page.tsx`: Landing page (/)
- `src/app/chat/page.tsx`: Chat interface (/chat)
- `src/app/admin/page.tsx`: Admin dashboard (/admin)

**Configuration:**
- `biome.json`: Linter/formatter rules (tabs, double quotes, recommended rules)
- `tsconfig.json`: TypeScript strict mode, path aliases (@/*)
- `next.config.ts`: Next.js app config (currently empty)
- `.env.example`: Template for required environment variables

**Core Logic:**
- `src/lib/openai.ts`: OpenAI client initialization
- `src/lib/supabase/client.ts`: Browser Supabase client factory
- `src/lib/supabase/server.ts`: Server Supabase client factory + service role
- `src/lib/cn.ts`: Tailwind class merge utility
- `src/lib/embeddings.ts`: Document chunking + OpenAI embeddings (planned)

**Styles:**
- `src/app/globals.css`: Global Tailwind v4 import
- `postcss.config.mjs`: PostCSS pipeline for Tailwind

**Dependencies:**
- `package.json`: Next.js 15, React 19, OpenAI, Supabase, Tailwind, Biome

## Naming Conventions

**Files:**
- Page routes: `page.tsx` (lowercase)
- API routes: `route.ts` (lowercase)
- React components: `PascalCase.tsx` (e.g., ChatWindow.tsx)
- Utilities/modules: `camelCase.ts` (e.g., openai.ts, cn.ts)
- CSS modules: `ComponentName.module.css` (if used; currently all Tailwind)

**Directories:**
- Feature-based: `chat/`, `admin/`, `widget/` (plural or function name, lowercase)
- Layer-based: `components/`, `lib/`, `api/` (lowercase)
- Subdirectory grouping: `supabase/` for related clients

**Identifiers:**
- TypeScript: camelCase for variables/functions, PascalCase for types/classes, UPPER_SNAKE_CASE for constants
- CSS classes: Tailwind utilities (e.g., `flex`, `items-center`); custom classes via `cn()` utility

## Where to Add New Code

**New Feature (e.g., ratings/feedback):**
- Primary code: `src/app/api/feedback/route.ts` (API), `src/components/feedback/FeedbackWidget.tsx` (UI)
- Tests: `src/app/api/feedback/route.test.ts` (co-located with handler)
- Types: Inline in route.ts or create `src/types/feedback.ts`

**New Component/Module:**
- Implementation: `src/components/{feature}/{ComponentName}.tsx` for UI, `src/lib/{featureName}.ts` for logic
- Import in page via: `import { ComponentName } from "@/components/{feature}/ComponentName"`
- Use path alias `@/` (configured in tsconfig.json) to avoid relative imports

**New Utility Function:**
- Shared helpers: `src/lib/{category}.ts` (e.g., `src/lib/validation.ts` for form validators)
- Export as named export: `export function myHelper() { ... }`

**New API Endpoint:**
- Create `src/app/api/{resource}/route.ts` (or `route.ts` subdirectory for HTTP method-specific handlers)
- Import integrations: `import { openai } from "@/lib/openai"`, `import { createServerSupabaseClient } from "@/lib/supabase/server"`
- Return JSON responses with status codes

**Database Migrations:**
- Run migrations via Supabase dashboard or `supabase migration` CLI
- Document new tables/functions in CLAUDE.md schema section

## Special Directories

**`.next/`:**
- Purpose: Next.js build output and cache
- Generated: Yes (by `npm run build`)
- Committed: No (.gitignore)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (.gitignore)

**`.claude/`:**
- Purpose: Claude Code project configuration
- Contains: Skills, build instructions, custom agents
- Committed: Yes

**`.planning/`:**
- Purpose: GSD planning documents
- Contains: ARCHITECTURE.md, STRUCTURE.md, CONCERNS.md, etc.
- Committed: Yes

---

*Structure analysis: 2026-02-08*
