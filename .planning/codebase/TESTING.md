# Testing Patterns

**Analysis Date:** 2026-02-08

## Test Framework

**Status:** Not yet configured

**Recommended Setup:**
- Framework: Vitest (faster, ESM-native, better for modern JavaScript)
- Alternative: Jest (if Node compatibility is critical)
- Assertion library: Vitest built-in `expect()` or add Chai for extended assertions
- Component testing: @testing-library/react for React components

**Why Vitest over Jest:**
- Native ESM support (matches Next.js/TypeScript setup)
- Faster execution and watch mode
- Better TypeScript support out-of-the-box
- Smaller dependency footprint

**Installation (when ready):**
```bash
npm install --save-dev vitest @vitest/ui @testing-library/react @testing-library/jest-dom happy-dom
```

## Test File Organization

**Location:**
- Co-located with source code in `src/` directory
- Use `__tests__/` subdirectory for shared test utilities
- Do not create separate `/tests` directory at root

**Naming:**
- Unit tests: `[filename].test.ts` or `[filename].test.tsx`
- Example: `cn.test.ts` (for `cn.ts`)
- Example: `ChatWindow.test.tsx` (for `ChatWindow.tsx`)

**Structure:**
```
src/
├── lib/
│   ├── cn.ts
│   ├── cn.test.ts              # Unit test for cn utility
│   ├── openai.ts
│   ├── openai.test.ts
│   └── supabase/
│       ├── client.ts
│       ├── client.test.ts
│       ├── server.ts
│       └── server.test.ts
├── components/
│   ├── chat/
│   │   ├── ChatWindow.tsx
│   │   ├── ChatWindow.test.tsx
│   │   └── ...
│   └── ui/
└── __tests__/                  # Shared test utilities
    ├── fixtures.ts
    ├── mocks.ts
    └── setup.ts
```

## Test Structure

**Suite Organization:**

```typescript
// Example: src/lib/cn.test.ts
import { describe, it, expect } from "vitest";
import { cn } from "./cn";

describe("cn utility", () => {
	it("merges class names correctly", () => {
		const result = cn("px-2", "px-4");
		expect(result).toBe("px-4");
	});

	it("handles undefined and null values", () => {
		const result = cn("text-lg", undefined, null, "font-bold");
		expect(result).toContain("text-lg");
		expect(result).toContain("font-bold");
	});

	it("resolves Tailwind conflicts", () => {
		const result = cn("text-red-500 text-blue-500");
		expect(result).toContain("text-blue-500");
		expect(result).not.toContain("text-red-500");
	});
});
```

**Patterns:**
- One `describe()` block per function/component
- Use `it()` for each test case (more readable than `test()`)
- Group related tests with nested `describe()` blocks
- Setup before tests with `beforeEach()` or `beforeAll()`
- Cleanup after tests with `afterEach()` or `afterAll()`

## Mocking

**Framework:** Vitest built-in mocking

**Pattern for mocking OpenAI client:**
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { openai } from "./openai";

vi.mock("./openai", () => ({
	openai: {
		chat: {
			completions: {
				create: vi.fn(),
			},
		},
	},
}));

describe("OpenAI integration", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("calls OpenAI API with correct parameters", async () => {
		const mockResponse = {
			choices: [{ message: { content: "Test response" } }],
		};
		vi.mocked(openai.chat.completions.create).mockResolvedValueOnce(mockResponse as any);

		// Test code
	});
});
```

**Pattern for mocking Supabase:**
```typescript
import { describe, it, expect, vi } from "vitest";

vi.mock("@supabase/ssr", () => ({
	createBrowserClient: vi.fn(() => ({
		from: vi.fn().mockReturnValue({
			select: vi.fn().mockResolvedValue({ data: [], error: null }),
			insert: vi.fn().mockResolvedValue({ data: null, error: null }),
		}),
	})),
}));
```

**What to Mock:**
- External API calls (OpenAI, Supabase, etc.)
- Network requests (fetch, axios)
- Filesystem operations (fs module)
- Environment variables (use `vi.stubEnv()`)

**What NOT to Mock:**
- Core utility functions (like `cn()`) — test the actual implementation
- Internal helper functions — test through public API
- Type definitions and constants
- Node built-ins unless necessary

## Fixtures and Factories

**Test Data:**

Create a `src/__tests__/fixtures.ts` file for shared test data:

```typescript
// src/__tests__/fixtures.ts
export const mockMessage = {
	id: "msg-123",
	conversationId: "conv-456",
	role: "user" as const,
	content: "Hello, how can you help?",
	createdAt: new Date("2026-02-08"),
};

export const mockConversation = {
	id: "conv-456",
	createdAt: new Date("2026-02-08"),
	messages: [mockMessage],
};

export const mockOpenAIResponse = {
	choices: [
		{
			message: {
				content: "I can help with customer support questions.",
				role: "assistant" as const,
			},
		},
	],
	usage: { prompt_tokens: 10, completion_tokens: 15, total_tokens: 25 },
};
```

**Factory Pattern for Dynamic Data:**

```typescript
// src/__tests__/factories.ts
export function createMockMessage(overrides = {}) {
	return {
		id: `msg-${Math.random()}`,
		conversationId: "conv-123",
		role: "user" as const,
		content: "Test message",
		createdAt: new Date(),
		...overrides,
	};
}

export function createMockConversation(messageCount = 2) {
	return {
		id: `conv-${Math.random()}`,
		createdAt: new Date(),
		messages: Array.from({ length: messageCount }, (_, i) =>
			createMockMessage({ content: `Message ${i + 1}` })
		),
	};
}
```

**Location:**
- `src/__tests__/fixtures.ts` — static test data
- `src/__tests__/factories.ts` — dynamic data generators

## Coverage

**Requirements:** Not enforced initially

**Target:** 80%+ for critical paths (API routes, RAG logic)

**View Coverage:**
```bash
vitest run --coverage
# or
vitest run --coverage --reporter=html
```

**Coverage Report Location:** `./coverage/` directory

**Areas to Prioritize:**
1. `src/lib/openai.ts` — RAG and completion logic
2. `src/lib/embeddings.ts` — document chunking (when created)
3. API routes in `src/app/api/` — all routes

## Test Types

**Unit Tests:**
- Scope: Single function or utility in isolation
- Files: `src/lib/*.test.ts`
- Examples: Testing `cn()`, utilities, parsers
- Approach: Mock all dependencies, test return values and side effects

**Integration Tests:**
- Scope: Multiple components working together (e.g., client + server)
- Files: `src/lib/*.test.ts` or dedicated `__tests__/integration/` folder
- Examples: Full RAG pipeline, upload → embed → store flow
- Approach: Use real database (test/staging instance) or advanced mocks
- Note: Start integration tests after core features are built

**API Route Tests:**
- Scope: HTTP endpoints and request/response handling
- Files: `src/app/api/[route]/route.test.ts`
- Examples: `POST /api/chat`, `POST /api/documents`
- Approach: Mock Supabase and OpenAI, test request validation and response format
- Pattern:
```typescript
import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

describe("POST /api/chat", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns 400 if message is missing", async () => {
		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			body: JSON.stringify({}),
		});

		const response = await POST(request);
		expect(response.status).toBe(400);
	});

	it("streams response on valid input", async () => {
		const request = new Request("http://localhost:3000/api/chat", {
			method: "POST",
			body: JSON.stringify({ message: "Hello" }),
		});

		const response = await POST(request);
		expect(response.status).toBe(200);
		expect(response.headers.get("content-type")).toContain("text/event-stream");
	});
});
```

**E2E Tests:**
- Framework: Playwright (when UI is ready)
- Scope: User workflows from UI through API to database
- Files: `e2e/` directory (separate from unit tests)
- Examples: Upload document → chat about it workflow
- Status: Not implemented yet (add after UI completion)

## Common Patterns

**Async Testing:**
```typescript
import { describe, it, expect } from "vitest";

describe("async operations", () => {
	it("resolves promises correctly", async () => {
		const result = await someAsyncFunction();
		expect(result).toBe(expectedValue);
	});

	it("handles promise rejection", async () => {
		await expect(failingAsyncFunction()).rejects.toThrow("Error message");
	});
});
```

**Error Testing:**
```typescript
it("throws error on invalid input", () => {
	expect(() => {
		functionThatThrows("");
	}).toThrow("Expected non-empty string");
});

it("catches and rethrows errors", async () => {
	await expect(asyncFunctionThatFails()).rejects.toThrow();
});
```

**Testing React Components (when ready):**
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ChatWindow } from "./ChatWindow";

describe("ChatWindow component", () => {
	it("renders message input", () => {
		render(<ChatWindow />);
		const input = screen.getByPlaceholderText("Type your message...");
		expect(input).toBeInTheDocument();
	});

	it("sends message on button click", async () => {
		const user = userEvent.setup();
		render(<ChatWindow />);

		const input = screen.getByPlaceholderText("Type your message...");
		const sendButton = screen.getByRole("button", { name: /send/i });

		await user.type(input, "Hello");
		await user.click(sendButton);

		expect(input).toHaveValue(""); // Should clear after send
	});
});
```

## Configuration (When Set Up)

**Vitest Config File:** `vitest.config.ts`
```typescript
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
	plugins: [react()],
	test: {
		globals: true,
		environment: "happy-dom",
		setupFiles: ["./src/__tests__/setup.ts"],
		coverage: {
			provider: "v8",
			reporter: ["text", "html", "json"],
			exclude: [
				"node_modules/",
				"src/__tests__/",
			],
		},
	},
	resolve: {
		alias: {
			"@": path.resolve(__dirname, "./src"),
		},
	},
});
```

**Setup File:** `src/__tests__/setup.ts`
```typescript
import "@testing-library/jest-dom";
import { beforeAll, afterEach, afterAll, vi } from "vitest";

// Setup environment for tests
beforeEach(() => {
	vi.stubEnv("OPENAI_API_KEY", "test-key");
	vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "http://localhost:54321");
});

afterEach(() => {
	vi.unstubAllEnvs();
});
```

## npm Scripts (When Set Up)

```json
{
	"scripts": {
		"test": "vitest run",
		"test:watch": "vitest",
		"test:ui": "vitest --ui",
		"test:coverage": "vitest run --coverage"
	}
}
```

---

*Testing analysis: 2026-02-08*
