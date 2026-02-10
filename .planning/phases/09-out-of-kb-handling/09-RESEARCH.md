# Phase 9: Out-of-KB Handling - Research

**Researched:** 2026-02-10
**Domain:** RAG confidence detection, chatbot fallback strategies, AI SDK custom UI components
**Confidence:** HIGH

## Summary

This phase implements a graceful degradation strategy for when the chatbot cannot answer questions from its knowledge base. The implementation centers on three technical areas: (1) detecting low-confidence RAG responses using similarity scores, (2) streaming custom UI components (contact forms) alongside text responses using AI SDK v6's data parts feature, and (3) storing and displaying escalation requests in the admin panel.

The existing codebase already calculates similarity scores during RAG retrieval and tracks `answered_from_kb` boolean on messages (Phase 08-01). This phase extends that by detecting low confidence at request time and conditionally returning a contact form UI component instead of allowing the LLM to generate an ungrounded answer. The AI SDK v6 architecture supports this pattern through custom data parts that can be streamed alongside or instead of text content.

**Primary recommendation:** Use AI SDK v6's custom data parts with a `contact-form` type to stream form UI state when similarity threshold is not met. Store submissions in a new `contact_submissions` table with reference to the conversation. Render the form inline within MessageBubble using conditional logic based on message parts.

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AI SDK v6 | 6.0.77 | Custom data parts streaming | Already in use; native support for streaming structured UI data |
| @ai-sdk/react | 3.0.79 | useChat with onData callback | Already in use; handles data part reconciliation |
| React 19 | 19.1.0 | Conditional rendering | Already in use; stable inline form patterns |
| Supabase | 2.49.4 | Contact form storage | Already in use; existing conversation context |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | 0.511.0 | Form icons (AlertCircle, Send) | Already in use; consistent UI |
| clsx | 2.1.1 | Conditional form styling | Already in use; handles validation states |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| AI SDK data parts | Generative UI (streamUI) | streamUI requires Server Components and server actions; data parts work with current App Router + client components architecture |
| Inline form | Separate escalation page | Inline form maintains conversation context and reduces friction; separate page loses conversational flow |
| Custom streaming | AI SDK tools with UI | Tools are for agent actions, not UI state; data parts are designed for custom UI components |

**Installation:**
No new dependencies required. All functionality uses existing AI SDK v6 and React capabilities.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── app/api/
│   ├── chat/route.ts              # Add low-confidence detection
│   └── contact/route.ts           # NEW: Handle form submissions
├── components/chat/
│   ├── MessageBubble.tsx          # Add contact form rendering
│   └── ContactForm.tsx            # NEW: Inline contact form component
├── app/admin/
│   └── contacts/page.tsx          # NEW: Contact submissions dashboard
└── lib/
    └── supabase/
        └── contact-submissions.ts # NEW: Database operations
```

### Pattern 1: Low-Confidence Detection with Custom Data Parts

**What:** Detect similarity score below threshold and stream a custom data part instead of LLM text
**When to use:** When RAG similarity score < 0.7 (existing threshold in chat route)
**Example:**

```typescript
// In chat route.ts
import { createUIMessageStream } from 'ai';

// After RAG retrieval
const chunks = await searchSimilarChunks(userMessage, {
  threshold: 0.7,
  count: 5,
});

// Check confidence
const hasConfidentAnswer = chunks.length > 0 && chunks[0].similarity > 0.7;

if (!hasConfidentAnswer) {
  // Stream contact form data part instead of LLM response
  const stream = createUIMessageStream({
    execute: ({ writer }) => {
      // Send text explaining the limitation
      writer.write({
        type: 'text',
        text: "I don't have information about that in my knowledge base. Could you fill out this form so our team can help you?",
      });

      // Send contact form data part
      writer.write({
        type: 'data-contact-form',
        id: 'contact-form-1',
        data: {
          conversationId,
          originalQuestion: userMessage,
        },
      });
    },
  });

  return stream.toUIMessageStreamResponse({ headers });
}

// Otherwise proceed with normal RAG + LLM flow
```

### Pattern 2: Client-Side Form Rendering

**What:** Conditionally render inline contact form based on message data parts
**When to use:** When message contains `data-contact-form` part type
**Example:**

```typescript
// In MessageBubble.tsx
import { ContactForm } from './ContactForm';

interface MessageBubbleProps {
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  parts?: Array<{ type: string; data?: any }>; // NEW: data parts
}

export function MessageBubble({ role, content, sources, parts }: MessageBubbleProps) {
  const contactFormPart = parts?.find(p => p.type === 'data-contact-form');

  return (
    <div className={/* existing styles */}>
      {/* Existing content rendering */}
      <div className="prose">{content}</div>

      {/* NEW: Inline contact form rendering */}
      {contactFormPart && (
        <div className="mt-4">
          <ContactForm
            conversationId={contactFormPart.data.conversationId}
            originalQuestion={contactFormPart.data.originalQuestion}
          />
        </div>
      )}

      {/* Existing sources rendering */}
    </div>
  );
}
```

### Pattern 3: Contact Form Submission API

**What:** POST endpoint that saves contact submissions and marks conversation for admin follow-up
**When to use:** When user submits the inline contact form
**Example:**

```typescript
// In app/api/contact/route.ts
export async function POST(req: Request) {
  const { conversationId, name, email, question } = await req.json();

  // Validate inputs
  if (!name || !email || !question) {
    return Response.json({ error: 'All fields required' }, { status: 400 });
  }

  // Basic email validation
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return Response.json({ error: 'Invalid email' }, { status: 400 });
  }

  const supabase = createServiceRoleClient();

  // Insert contact submission
  const { data, error } = await supabase
    .from('contact_submissions')
    .insert({
      conversation_id: conversationId,
      name,
      email,
      original_question: question,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: 'Failed to save' }, { status: 500 });
  }

  return Response.json({ success: true, id: data.id });
}
```

### Anti-Patterns to Avoid

- **Hallucinating low-confidence answers:** Never let the LLM generate text when similarity < 0.7. Users prefer "I don't know" over wrong information. (Source: [UX Content - Chatbot Fallbacks](https://uxcontent.com/designing-chatbots-fallbacks/))
- **Separate escalation page:** Breaking conversation flow by redirecting to a different page loses context and frustrates users. Inline forms maintain conversational continuity.
- **No confidence threshold:** Relying solely on LLM to refuse to answer is unreliable. RAG similarity scores provide objective, measurable confidence thresholds.
- **Reusing message content field:** Don't embed contact forms in the text content string. Use data parts for proper type safety and conditional rendering.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streaming custom UI | Custom SSE parser | AI SDK v6 data parts | Handles reconciliation, transient vs persistent parts, type safety |
| Form validation | Manual regex/checks | Browser native validation + simple server-side checks | Email/required validation built-in, reduces bundle |
| Similarity threshold detection | LLM-based confidence | pgvector cosine similarity scores | Objective, measurable, no extra LLM call needed |
| Contact form spam prevention | Custom CAPTCHA | Honeypot field + rate limiting | Simple, effective, no UX friction for real users |

**Key insight:** AI SDK v6 already solved the hard problems of streaming custom UI components and reconciling updates. The data parts API provides exactly what's needed for conditional form rendering without complex state management or custom streaming protocols.

## Common Pitfalls

### Pitfall 1: Threshold Too Strict or Too Loose

**What goes wrong:** Setting threshold at 0.9 triggers contact form too often (including for questions that could be partially answered). Setting at 0.5 allows weak hallucinations through.

**Why it happens:** Similarity scores vary by embedding model and domain. Without evaluation, the threshold is a guess.

**How to avoid:** The existing codebase uses 0.7 threshold (established in Phase 3). This is a reasonable default based on RAG best practices. LlamaIndex documentation suggests 0.75 as an example cutoff. (Source: [Meisin Lee - Better RAG Retrieval](https://meisinlee.medium.com/better-rag-retrieval-similarity-with-threshold-a6dbb535ef9e))

**Warning signs:** High contact form submission rate, or users complaining about unhelpful/wrong answers. Monitor the `answered_from_kb` metric from Phase 08 analytics.

### Pitfall 2: Losing Conversation Context

**What goes wrong:** Contact form submission doesn't link to the conversation, making it impossible for admins to see chat history when following up.

**Why it happens:** Forgetting to pass conversationId through the data part and into the submission record.

**How to avoid:** Always include conversationId in the contact form data part. Store it in the `contact_submissions` table with a foreign key to `conversations`. Admin dashboard should display full conversation thread alongside contact details.

**Warning signs:** Admin complaints about lack of context, or duplicate questions in follow-ups because they don't know what was already discussed.

### Pitfall 3: Data Part Not Persisting in Message History

**What goes wrong:** Contact form appears during streaming but disappears when user refreshes or revisits conversation.

**Why it happens:** Using transient data parts (transient: true) instead of regular persistent parts.

**How to avoid:** Omit the `transient` flag when writing the contact form data part. Regular data parts are automatically added to message.parts and persist across sessions. (Source: [AI SDK - Streaming Custom Data](https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data))

**Warning signs:** Contact form only visible during initial stream, not present in conversation history when loading past messages.

### Pitfall 4: Race Condition on Conversation Creation

**What goes wrong:** First message creates conversation, second request (contact submission) happens before conversation is saved, causing foreign key constraint error.

**Why it happens:** Fire-and-forget persistence pattern in existing chat route creates conversation ID in memory but persists async.

**How to avoid:** The existing code already handles this correctly (line 94 in chat route: conversation created BEFORE streaming). Contact submissions will always have a valid conversationId because the form only appears after initial message streaming completes.

**Warning signs:** Intermittent database constraint errors on contact_submissions insert.

### Pitfall 5: No Visual Distinction for Low-Confidence State

**What goes wrong:** Users don't understand why they're seeing a contact form instead of an answer, leading to frustration.

**Why it happens:** The text message doesn't clearly explain the limitation before showing the form.

**How to avoid:** Always prefix the contact form with explicit text: "I don't have information on that in my knowledge base." Use an AlertCircle icon or warning badge to visually signal the fallback state. Modern chatbot best practices require explicit acknowledgment of limitations. (Source: [Cobbai - Escalation Best Practices](https://cobbai.com/blog/chatbot-escalation-best-practices))

**Warning signs:** User confusion, repeated similar questions, or negative feedback about "broken" bot.

## Code Examples

Verified patterns from official sources:

### Custom Data Parts Type Definition

```typescript
// Source: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data
import type { UIMessage } from 'ai';

export type CustomUIMessage = UIMessage<
  never, // No custom metadata
  {
    'contact-form': {
      conversationId: string;
      originalQuestion: string;
      submitted?: boolean; // For reconciliation after submission
    };
  }
>;
```

### Contact Form Component with Submission

```typescript
// Source: React conditional rendering + Supabase patterns
'use client';

import { useState } from 'react';
import { AlertCircle, Send } from 'lucide-react';

interface ContactFormProps {
  conversationId: string;
  originalQuestion: string;
}

export function ContactForm({ conversationId, originalQuestion }: ContactFormProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId,
          name,
          email,
          question: originalQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit');
      }

      setSubmitted(true);
    } catch (err) {
      setError('Failed to send. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <p className="text-green-800 text-sm">
          Thanks! Our team will get back to you soon.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-2 mb-3">
        <AlertCircle className="text-amber-600 mt-0.5" size={18} />
        <div>
          <p className="text-sm text-amber-900 font-medium">
            I don't have information on that
          </p>
          <p className="text-xs text-amber-700 mt-1">
            Our team can help. Please provide your contact info:
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-xs text-gray-700 mb-1">
            Name *
          </label>
          <input
            id="name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Your name"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-xs text-gray-700 mb-1">
            Email *
          </label>
          <input
            id="email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="your@email.com"
          />
        </div>

        {error && (
          <p className="text-xs text-red-600">{error}</p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full flex items-center justify-center gap-2 bg-amber-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
        >
          {submitting ? 'Sending...' : 'Send to Team'}
          {!submitting && <Send size={14} />}
        </button>
      </form>
    </div>
  );
}
```

### Database Schema

```sql
-- Contact submissions for out-of-KB escalation
CREATE TABLE contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  original_question TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('pending', 'contacted', 'resolved')),
  admin_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin dashboard queries
CREATE INDEX idx_contact_submissions_status_created
  ON contact_submissions(status, created_at DESC);

-- Index for looking up submissions by conversation
CREATE INDEX idx_contact_submissions_conversation
  ON contact_submissions(conversation_id);
```

### Admin Dashboard List Query

```typescript
// Source: Supabase query patterns
import { createServiceRoleClient } from '@/lib/supabase/server';

export async function getContactSubmissions(status?: string) {
  const supabase = createServiceRoleClient();

  let query = supabase
    .from('contact_submissions')
    .select(`
      id,
      name,
      email,
      original_question,
      status,
      created_at,
      conversation_id,
      conversations (
        id,
        created_at
      )
    `)
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LLM refuses to answer | Similarity threshold detection | RAG systems adoption (2024+) | More reliable, measurable confidence detection |
| Separate escalation page | Inline contact form | Modern chat UX (2025+) | Maintains conversational flow, reduces friction |
| Custom streaming protocol | AI SDK data parts | AI SDK 3.0+ (2024) | Type-safe, reconciliation built-in, less code |
| Generic fallback message | Context-aware escalation | Chatbot UX research (2025) | Users get immediate path forward instead of dead end |

**Deprecated/outdated:**
- **Generic "I don't know" with no follow-up**: Modern best practice requires offering escalation path or alternative. (Source: [ChatBench - Chatbot Metrics](https://www.chatbench.org/what-are-the-most-important-metrics-for-assessing-ai-chatbot-performance/))
- **LLM-only confidence detection**: Unreliable and costs extra tokens. Similarity scores provide objective measure.
- **Separate contact page**: Breaks conversation context. Inline forms preserve conversational continuity.

## Open Questions

1. **Should the contact form be pre-filled with the user's question?**
   - What we know: originalQuestion is available in data part, could be shown as read-only context
   - What's unclear: Whether showing the question again helps or feels redundant
   - Recommendation: Display it as read-only context above the form ("About your question: ...") to maintain clarity for both user and admin

2. **How to handle spam prevention on the contact form?**
   - What we know: Common approaches include honeypot fields, rate limiting, and CAPTCHA
   - What's unclear: What level of protection is needed for a portfolio demo vs production
   - Recommendation: Implement honeypot field (simple, no UX impact) and rate limit by conversation ID (1 submission per conversation). Skip CAPTCHA for demo to avoid friction. (Source: [PaperStreet - Contact Form Validation](https://www.paperstreet.com/blog/contact-form-validation-options-checking-user-data/))

3. **Should submitted contact forms be editable?**
   - What we know: Form shows "submitted" confirmation state after send
   - What's unclear: Whether users should be able to edit/resubmit or create a new submission
   - Recommendation: Make submission final (not editable) but allow user to send another message in chat to clarify. Simpler implementation, avoids update logic complexity.

## Sources

### Primary (HIGH confidence)
- AI SDK v6 Official Docs - Streaming Custom Data: https://ai-sdk.dev/docs/ai-sdk-ui/streaming-data
- AI SDK v6 Official Docs - UIMessage Reference: https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message
- AI SDK RSC Official Docs - Streaming React Components: https://ai-sdk.dev/docs/ai-sdk-rsc/streaming-react-components
- React Official Docs - Conditional Rendering: https://react.dev/learn/conditional-rendering
- Existing project codebase (chat/route.ts, ChatWindow.tsx, similarity-search.ts)

### Secondary (MEDIUM confidence)
- Meisin Lee - Better RAG Retrieval with Similarity Thresholds: https://meisinlee.medium.com/better-rag-retrieval-similarity-with-threshold-a6dbb535ef9e
- UX Content - Designing Chatbot Fallbacks: https://uxcontent.com/designing-chatbots-fallbacks/
- Cobbai - Chatbot Escalation Best Practices: https://cobbai.com/blog/chatbot-escalation-best-practices
- PaperStreet - Contact Form Validation Options (2026): https://www.paperstreet.com/blog/contact-form-validation-options-checking-user-data/
- ChatBench - AI Chatbot Performance Metrics (2026): https://www.chatbench.org/what-are-the-most-important-metrics-for-assessing-ai-chatbot-performance/
- Robylon - Rule-Based vs AI Chatbots 2026: https://www.robylon.ai/blog/rule-based-vs-ai-chatbots-2026

### Tertiary (LOW confidence)
- Vercel Blog - AI SDK 6 Announcement: https://vercel.com/blog/ai-sdk-6
- LogRocket - React Conditional Rendering: https://blog.logrocket.com/react-conditional-rendering-9-methods/
- Social Intents - AI Chatbot Human Handoff (2026): https://www.socialintents.com/blog/ai-chatbot-with-human-handoff/

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already in project, verified versions
- Architecture: HIGH - AI SDK data parts documented and tested approach
- Pitfalls: MEDIUM - Based on general RAG/chatbot best practices and documentation, not project-specific testing

**Research date:** 2026-02-10
**Valid until:** 2026-03-10 (30 days - stable ecosystem)
