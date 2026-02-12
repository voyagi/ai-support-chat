# Phase 8: Analytics Dashboard - Research

**Researched:** 2026-02-09
**Domain:** Analytics dashboard (time-series aggregations, real-time metrics, topic clustering, chart visualization)
**Confidence:** HIGH

## Summary

Analytics dashboards for chat systems require four interconnected capabilities: time-series aggregations (conversation/message counts over time), response accuracy tracking (KB-answered vs fallback rate), topic discovery via embedding clustering, and real-time updates using Supabase subscriptions. The standard approach uses PostgreSQL window functions for aggregations, Tremor/Recharts for charts, HDBSCAN clustering on OpenAI embeddings for topic detection, and Supabase Realtime for live data.

**Key findings:**

- PostgreSQL native date aggregations (date_trunc + generate_series) eliminate need for TimescaleDB for this scale
- Tremor (built on Recharts) provides Tailwind-first charts with minimal config, perfect for admin dashboards
- OpenAI embeddings + HDBSCAN clustering can identify common question topics with LLM-generated labels
- Supabase Realtime enables live metric updates without polling (requires table publications enabled)
- Continuous aggregates (if using TimescaleDB) provide 979x speedup for pre-computed queries, but overkill for <1M messages
- Response accuracy requires tracking RAG retrieval success — needs new column in messages table

**Primary recommendation:** Start with PostgreSQL date_trunc aggregations, Tremor for charts, and defer topic clustering to Phase 9 (nice-to-have). Add real-time updates via Supabase subscriptions for live metric display. Track `answered_from_kb` boolean on messages to compute accuracy metrics.

## Standard Stack

The established libraries/tools for this domain:

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tremor/react` | Latest | Chart components for dashboards | Built on Recharts, Tailwind-first design, minimal config, 139K+ weekly downloads |
| `date-fns` | Latest | Date formatting and manipulation | Lightweight (vs moment.js), tree-shakeable, excellent TypeScript support |
| Supabase Realtime | Built-in | Live database change subscriptions | Native Supabase feature, WebSocket-based, supports 10K+ concurrent connections |
| PostgreSQL window functions | Native | Time-series aggregations | Built-in to Postgres, no extensions needed for daily/weekly grouping |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `hdbscan` (Python) | Latest | Density-based clustering for topics | If implementing topic clustering (Phase 9) |
| `react-query` (TanStack Query) | Latest | Data fetching with cache invalidation | Optional: for real-time metric polling fallback |
| TimescaleDB extension | Latest | Continuous aggregates for time-series | Only if scaling to 1M+ messages, overkill for MVP |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Tremor | Recharts directly | More config boilerplate, less Tailwind integration |
| Tremor | Chart.js | Canvas-based (not SVG), harder React integration, 5.6M downloads but less React-native |
| Supabase Realtime | Polling (react-query) | Higher server load, 1-5s latency vs instant updates |
| date_trunc | TimescaleDB time_bucket | Adds extension dependency, overkill for <1M messages |
| HDBSCAN clustering | K-means | K-means requires pre-specifying cluster count, worse for variable-topic datasets |

**Installation:**

```bash
npm install @tremor/react date-fns
```

## Architecture Patterns

### Recommended Project Structure

```
src/
├── app/
│   ├── admin/
│   │   ├── analytics/
│   │   │   └── page.tsx              # Analytics dashboard page
│   │   └── page.tsx                   # Admin home (add analytics nav link)
│   └── api/
│       └── analytics/
│           ├── chat-volume/route.ts   # Daily/weekly conversation & message counts
│           ├── accuracy/route.ts      # KB-answered vs fallback percentage
│           └── topics/route.ts        # Common question topics (Phase 9)
├── components/
│   └── admin/
│       ├── ChatVolumeChart.tsx        # Line/bar chart: conversations & messages over time
│       ├── AccuracyMetrics.tsx        # Donut chart: % answered from KB
│       ├── TopicsList.tsx             # (Phase 9) Clustered question topics
│       └── RealtimeMetrics.tsx        # Live total counts (conversations, messages today)
├── lib/
│   ├── analytics/
│   │   ├── chat-volume.ts             # SQL queries for time-series aggregations
│   │   ├── accuracy.ts                # Compute KB-answered percentage
│   │   └── topics.ts                  # (Phase 9) Clustering + LLM labeling
│   └── supabase/
│       └── realtime.ts                # Realtime subscription helpers
```

### Pattern 1: Time-Series Aggregations with PostgreSQL

**What:** Use `date_trunc()` to group conversations/messages by day or week, filling gaps with `generate_series()`.

**When to use:** For all time-based metrics (conversation volume, message counts).

**Example:**

```typescript
// lib/analytics/chat-volume.ts
interface ChatVolumeRow {
  date: string;
  conversations: number;
  messages: number;
}

export async function getChatVolume(
  period: 'day' | 'week',
  days: number = 30
): Promise<ChatVolumeRow[]> {
  const supabase = createServiceRoleClient();

  const interval = period === 'day' ? '1 day' : '1 week';
  const truncUnit = period === 'day' ? 'day' : 'week';

  // Generate full date series to fill gaps with zeros
  const { data, error } = await supabase.rpc('get_chat_volume', {
    trunc_unit: truncUnit,
    interval: interval,
    days_back: days
  });

  if (error) throw new Error(`Failed to fetch chat volume: ${error.message}`);
  return data || [];
}
```

**SQL function (add to schema.sql):**

```sql
create or replace function get_chat_volume(
  trunc_unit text,
  interval_str text,
  days_back int
)
returns table (
  date timestamptz,
  conversations bigint,
  messages bigint
)
language sql stable
as $$
  with date_series as (
    select generate_series(
      date_trunc(trunc_unit, now() - make_interval(days => days_back)),
      date_trunc(trunc_unit, now()),
      interval_str::interval
    ) as date
  ),
  conv_counts as (
    select
      date_trunc(trunc_unit, created_at) as date,
      count(*) as conversations
    from conversations
    where created_at >= now() - make_interval(days => days_back)
    group by date_trunc(trunc_unit, created_at)
  ),
  msg_counts as (
    select
      date_trunc(trunc_unit, m.created_at) as date,
      count(*) as messages
    from messages m
    where m.created_at >= now() - make_interval(days => days_back)
    group by date_trunc(trunc_unit, m.created_at)
  )
  select
    ds.date,
    coalesce(cc.conversations, 0) as conversations,
    coalesce(mc.messages, 0) as messages
  from date_series ds
  left join conv_counts cc on ds.date = cc.date
  left join msg_counts mc on ds.date = mc.date
  order by ds.date;
$$;
```

**Why this works:**

- `generate_series()` ensures all dates have rows (zero-filling gaps for clean charts)
- `date_trunc()` groups by day/week efficiently (no TimescaleDB needed)
- Left joins preserve all date_series rows even when no data exists

**Tremor chart component:**

```tsx
// components/admin/ChatVolumeChart.tsx
"use client";

import { AreaChart, Card, Title } from "@tremor/react";
import { format } from "date-fns";
import { useEffect, useState } from "react";

interface VolumeData {
  date: string;
  Conversations: number;
  Messages: number;
}

export function ChatVolumeChart({ period = "day" }: { period?: "day" | "week" }) {
  const [data, setData] = useState<VolumeData[]>([]);

  useEffect(() => {
    fetch(`/api/analytics/chat-volume?period=${period}`)
      .then(res => res.json())
      .then(rawData =>
        setData(
          rawData.map((row: { date: string; conversations: number; messages: number }) => ({
            date: format(new Date(row.date), period === "day" ? "MMM d" : "MMM d"),
            Conversations: row.conversations,
            Messages: row.messages,
          }))
        )
      );
  }, [period]);

  return (
    <Card>
      <Title>Chat Volume (Last 30 Days)</Title>
      <AreaChart
        data={data}
        index="date"
        categories={["Conversations", "Messages"]}
        colors={["blue", "green"]}
        valueFormatter={(value) => value.toString()}
        className="mt-6 h-72"
      />
    </Card>
  );
}
```

### Pattern 2: Response Accuracy Tracking

**What:** Track whether each assistant message was answered from the knowledge base (RAG retrieved chunks) or fell back to general LLM knowledge.

**When to use:** For computing "% answered from KB" metric (ANLY-03).

**Schema changes:**

```sql
-- Add column to messages table to track RAG retrieval success
alter table messages
  add column if not exists answered_from_kb boolean default true;

-- Index for faster accuracy queries
create index if not exists messages_answered_from_kb_idx
  on messages(answered_from_kb);
```

**Modify chat API to set flag:**

```typescript
// src/app/api/chat/route.ts (in onFinish handler)
onFinish: async ({ text }) => {
  const answeredFromKb = chunks.length > 0 && chunks[0].similarity > 0.7;

  await saveMessages(
    conversationId,
    userMessage,
    text,
    answeredFromKb // NEW: pass flag
  );
}
```

**Update conversation.ts:**

```typescript
// lib/chat/conversation.ts
export async function saveMessages(
  conversationId: string,
  userContent: string,
  assistantContent: string,
  answeredFromKb: boolean = true // NEW parameter
): Promise<void> {
  const supabase = createServiceRoleClient();

  const { error } = await supabase.from("messages").insert([
    {
      conversation_id: conversationId,
      role: "user",
      content: userContent,
    },
    {
      conversation_id: conversationId,
      role: "assistant",
      content: assistantContent,
      answered_from_kb: answeredFromKb, // NEW field
    },
  ]);

  if (error) throw new Error(`Failed to save messages: ${error.message}`);
}
```

**Accuracy metrics query:**

```typescript
// lib/analytics/accuracy.ts
export interface AccuracyMetrics {
  totalMessages: number;
  answeredFromKb: number;
  fallbackToGeneral: number;
  kbPercentage: number;
}

export async function getAccuracyMetrics(): Promise<AccuracyMetrics> {
  const supabase = createServiceRoleClient();

  const { data, error } = await supabase
    .from("messages")
    .select("answered_from_kb")
    .eq("role", "assistant");

  if (error) throw new Error(`Failed to fetch accuracy metrics: ${error.message}`);

  const totalMessages = data.length;
  const answeredFromKb = data.filter(m => m.answered_from_kb).length;
  const fallbackToGeneral = totalMessages - answeredFromKb;
  const kbPercentage = totalMessages > 0
    ? Math.round((answeredFromKb / totalMessages) * 100)
    : 0;

  return {
    totalMessages,
    answeredFromKb,
    fallbackToGeneral,
    kbPercentage,
  };
}
```

**Tremor donut chart:**

```tsx
// components/admin/AccuracyMetrics.tsx
"use client";

import { Card, DonutChart, Legend, Title } from "@tremor/react";
import { useEffect, useState } from "react";

export function AccuracyMetrics() {
  const [metrics, setMetrics] = useState({ kbPercentage: 0, answeredFromKb: 0, fallbackToGeneral: 0 });

  useEffect(() => {
    fetch("/api/analytics/accuracy")
      .then(res => res.json())
      .then(setMetrics);
  }, []);

  const chartData = [
    { name: "Answered from KB", value: metrics.answeredFromKb },
    { name: "Fallback to General", value: metrics.fallbackToGeneral },
  ];

  return (
    <Card>
      <Title>Response Accuracy</Title>
      <DonutChart
        data={chartData}
        category="value"
        index="name"
        colors={["green", "orange"]}
        valueFormatter={(value) => `${value} messages`}
        className="mt-6 h-72"
      />
      <div className="mt-4 text-center">
        <p className="text-3xl font-bold text-green-600 dark:text-green-400">
          {metrics.kbPercentage}%
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          answered from knowledge base
        </p>
      </div>
    </Card>
  );
}
```

### Pattern 3: Real-Time Metrics with Supabase Subscriptions

**What:** Subscribe to INSERT events on conversations and messages tables to update metrics live without polling.

**When to use:** For dashboard totals (total conversations, messages today) that should update instantly.

**Setup (Supabase Dashboard):**

1. Go to Database → Replication
2. Under "supabase_realtime" publication, enable:
   - `conversations` table
   - `messages` table

**Realtime helper:**

```typescript
// lib/supabase/realtime.ts
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export function useRealtimeMetrics() {
  const [totalConversations, setTotalConversations] = useState(0);
  const [messagesToday, setMessagesToday] = useState(0);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    // Fetch initial counts
    Promise.all([
      supabase.from("conversations").select("id", { count: "exact", head: true }),
      supabase
        .from("messages")
        .select("id", { count: "exact", head: true })
        .gte("created_at", new Date().toISOString().split("T")[0]),
    ]).then(([convResult, msgResult]) => {
      setTotalConversations(convResult.count ?? 0);
      setMessagesToday(msgResult.count ?? 0);
    });

    // Subscribe to new conversations
    const convChannel = supabase
      .channel("conversations-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "conversations" },
        () => setTotalConversations(prev => prev + 1)
      )
      .subscribe();

    // Subscribe to new messages (today only)
    const msgChannel = supabase
      .channel("messages-channel")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const createdAt = payload.new.created_at as string;
          const today = new Date().toISOString().split("T")[0];
          if (createdAt.startsWith(today)) {
            setMessagesToday(prev => prev + 1);
          }
        }
      )
      .subscribe();

    return () => {
      convChannel.unsubscribe();
      msgChannel.unsubscribe();
    };
  }, []);

  return { totalConversations, messagesToday };
}
```

**Component:**

```tsx
// components/admin/RealtimeMetrics.tsx
"use client";

import { Card, Metric, Text } from "@tremor/react";
import { useRealtimeMetrics } from "@/lib/supabase/realtime";

export function RealtimeMetrics() {
  const { totalConversations, messagesToday } = useRealtimeMetrics();

  return (
    <div className="grid grid-cols-2 gap-4">
      <Card>
        <Text>Total Conversations</Text>
        <Metric>{totalConversations}</Metric>
      </Card>
      <Card>
        <Text>Messages Today</Text>
        <Metric>{messagesToday}</Metric>
      </Card>
    </div>
  );
}
```

### Pattern 4: Topic Clustering (Phase 9 - Nice-to-Have)

**What:** Cluster user messages by embedding similarity using HDBSCAN, then use GPT-4o-mini to generate human-readable topic labels for each cluster.

**When to use:** For "common questions" feature (ANLY-02), if time permits after core metrics.

**High-level approach:**

1. Fetch all user messages from messages table (role = 'user')
2. Generate embeddings for each message (reuse `generateEmbedding()` from existing RAG pipeline)
3. Cluster embeddings using HDBSCAN (density-based, no pre-specified cluster count)
4. For each cluster, sample 5-10 representative messages
5. Prompt GPT-4o-mini: "Generate a 3-5 word topic label for these questions: [samples]"
6. Display topics ranked by cluster size (most common topics first)

**Implementation notes:**

- HDBSCAN is Python-based; either:
  - Create a Python script (scripts/cluster-topics.py) and call via Node.js child_process
  - Use `sklearn.cluster.HDBSCAN` via a lightweight Python API service
- Embeddings are already 1536 dimensions; HDBSCAN handles high-dimensional data well
- Cache topic results (compute once daily via cron, store in new `topics` table)

**Defer to Phase 9:** This is listed as "nice-to-have" in Phase 8 requirements. Prioritize Patterns 1-3 first.

## Database Schema Changes

Add to `supabase/schema.sql`:

```sql
-- Add accuracy tracking column to messages
alter table messages
  add column if not exists answered_from_kb boolean default true;

create index if not exists messages_answered_from_kb_idx
  on messages(answered_from_kb);

-- Chat volume aggregation function
create or replace function get_chat_volume(
  trunc_unit text,
  interval_str text,
  days_back int
)
returns table (
  date timestamptz,
  conversations bigint,
  messages bigint
)
language sql stable
as $$
  with date_series as (
    select generate_series(
      date_trunc(trunc_unit, now() - make_interval(days => days_back)),
      date_trunc(trunc_unit, now()),
      interval_str::interval
    ) as date
  ),
  conv_counts as (
    select
      date_trunc(trunc_unit, created_at) as date,
      count(*) as conversations
    from conversations
    where created_at >= now() - make_interval(days => days_back)
    group by date_trunc(trunc_unit, created_at)
  ),
  msg_counts as (
    select
      date_trunc(trunc_unit, m.created_at) as date,
      count(*) as messages
    from messages m
    where m.created_at >= now() - make_interval(days => days_back)
    group by date_trunc(trunc_unit, m.created_at)
  )
  select
    ds.date,
    coalesce(cc.conversations, 0) as conversations,
    coalesce(mc.messages, 0) as messages
  from date_series ds
  left join conv_counts cc on ds.date = cc.date
  left join msg_counts mc on ds.date = mc.date
  order by ds.date;
$$;

-- (Phase 9 only) Topics cache table for clustering results
create table if not exists topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  message_count int not null,
  sample_messages text[] not null,
  computed_at timestamptz default now()
);
```

## API Routes Design

### GET /api/analytics/chat-volume

**Query params:**
- `period` (string): "day" | "week" (default: "day")
- `days` (number): How many days back to query (default: 30)

**Response:**

```json
[
  { "date": "2026-01-10T00:00:00Z", "conversations": 12, "messages": 45 },
  { "date": "2026-01-11T00:00:00Z", "conversations": 8, "messages": 30 },
  ...
]
```

### GET /api/analytics/accuracy

**Response:**

```json
{
  "totalMessages": 234,
  "answeredFromKb": 198,
  "fallbackToGeneral": 36,
  "kbPercentage": 85
}
```

### GET /api/analytics/topics (Phase 9)

**Response:**

```json
[
  {
    "label": "Pricing & Plans",
    "messageCount": 45,
    "sampleMessages": ["How much does Pro cost?", "Is there a free trial?"]
  },
  {
    "label": "Integration Setup",
    "messageCount": 32,
    "sampleMessages": ["How do I connect Slack?", "Can I use API keys?"]
  }
]
```

## Key Decision Points

### 1. TimescaleDB vs Native PostgreSQL?

**Context:** TimescaleDB provides continuous aggregates (pre-computed queries) that are 979x faster than standard views.

**Decision:** Use **native PostgreSQL** for MVP.

**Rationale:**
- Project scale: Expected <10K conversations, <50K messages (demo/portfolio project)
- date_trunc queries on indexed created_at columns are fast enough (<100ms) at this scale
- TimescaleDB adds deployment complexity (extension installation, hypertables migration)
- Can always migrate to TimescaleDB later if scaling to 1M+ messages

**When to reconsider:** If query times exceed 500ms or dataset grows beyond 100K messages.

### 2. Tremor vs Recharts vs Chart.js?

**Context:** Need chart library for time-series line/area charts and donut charts.

**Decision:** Use **Tremor** (@tremor/react).

**Rationale:**
- Built on Recharts (26K stars, proven library), so inherits stability
- Tailwind-first design matches project's Tailwind CSS v4 stack
- Minimal boilerplate (pre-styled components vs raw Recharts config)
- Perfect for admin dashboards (not end-user data viz)
- Dark mode support via Tailwind

**Alternatives rejected:**
- **Recharts directly:** More config, less Tailwind integration
- **Chart.js:** Canvas-based (not SVG), harder React integration, no Tailwind theming

### 3. Real-Time Updates: Supabase Subscriptions vs Polling?

**Context:** Dashboard should show live metrics as new conversations happen.

**Decision:** Use **Supabase Realtime subscriptions** (WebSocket-based).

**Rationale:**
- Native Supabase feature (no additional library)
- Zero server load (WebSocket connection vs repeated HTTP polling)
- Instant updates (<100ms latency vs 1-5s polling interval)
- Handles 10K+ concurrent connections
- Requires enabling table publications (one-time dashboard setting)

**Fallback:** If Realtime proves unreliable, fall back to react-query with 30s polling interval.

### 4. Topic Clustering in Phase 8 or Phase 9?

**Context:** ANLY-02 requires "common questions" feature. Clustering is complex (HDBSCAN + LLM labeling).

**Decision:** **Defer to Phase 9** (nice-to-have).

**Rationale:**
- Core metrics (ANLY-01, ANLY-03) deliver more value: volume trends + accuracy
- Clustering requires Python tooling (HDBSCAN) or heavy JS alternatives
- LLM labeling adds OpenAI API cost per dashboard load (unless cached)
- Phase 8 success criteria don't strictly require topic discovery (can show "top 10 questions" as plain list initially)

**Phase 8 alternative:** Show simple list of most recent user messages (no clustering) as placeholder.

## Performance Considerations

### Query Optimization

- **Index created_at columns:** Both conversations.created_at and messages.created_at should be indexed (likely already indexed by default via Supabase)
- **Limit date ranges:** Always use WHERE clauses to restrict queries to last 30/60/90 days (avoid full table scans)
- **Use RPC functions:** date_trunc aggregations are faster as stored functions (query plan caching)

### Realtime Subscription Limits

- **10K concurrent connections:** Supabase Realtime handles this well, but portfolio demo won't exceed 10 concurrent admins
- **Authorization overhead:** Every INSERT triggers 1 auth check per subscriber. For admin-only dashboard, this is negligible (<10 checks/insert)
- **Filter server-side:** Use Realtime filters (e.g., `created_at >= today`) to reduce client-side processing

### Chart Rendering

- **Tremor uses SVG:** Performant for <1000 data points (our max is 90 days daily = 90 points)
- **Memoize chart data:** Use React.useMemo to prevent re-renders when data hasn't changed
- **Debounce real-time updates:** If message rate is high (>10/sec), batch updates every 1-2 seconds to prevent chart thrashing

## Testing Strategy

### Manual Testing Checklist

1. **Chat volume chart:**
   - [ ] Displays correct counts for last 30 days
   - [ ] Zero-fills gaps (days with no conversations show "0", not missing)
   - [ ] Switches between daily/weekly view correctly
   - [ ] Dark mode renders legibly

2. **Accuracy metrics:**
   - [ ] Donut chart shows correct percentage (matches raw SQL query)
   - [ ] Handles 0 messages gracefully (shows "0%" not NaN)
   - [ ] Updates after new conversations

3. **Real-time updates:**
   - [ ] Total conversations increments immediately after new chat starts
   - [ ] Messages today increments after each message sent
   - [ ] Doesn't break if Realtime connection drops (graceful fallback)

### Test Data Requirements

- **Seed historical data:** Create script to insert conversations/messages with past timestamps (use generate_series for 30 days of data)
- **Varied accuracy:** Mix of high-similarity (>0.7) and low-similarity (<0.7) RAG retrievals
- **Edge cases:**
  - Zero conversations on some days (test gap filling)
  - All messages answered from KB (100% accuracy)
  - No KB answers (0% accuracy)

## Known Limitations & Risks

### Limitations

1. **Topic clustering deferred:** Phase 8 won't show clustered common questions (just recent messages list)
2. **No historical backfill for answered_from_kb:** Existing messages in production will default to `true` (can't retroactively compute)
3. **Realtime requires table publications:** Admin must enable in Supabase dashboard (not automatic)
4. **Single admin only:** Dashboard metrics are global (not per-admin or per-bot)

### Risks

1. **Realtime connection failures:** If WebSocket drops, metrics won't update until page refresh
   - **Mitigation:** Add connection status indicator, auto-reconnect logic
2. **Date_trunc performance degradation:** If dataset grows to 100K+ messages, queries may slow
   - **Mitigation:** Monitor query times, add EXPLAIN ANALYZE tests, migrate to TimescaleDB if needed
3. **OpenAI API rate limits:** If implementing topic clustering (Phase 9), LLM labeling could hit rate limits
   - **Mitigation:** Cache topic labels, compute once daily via background job

## Open Questions for Planning

1. **Date range selector:** Should dashboard support custom date ranges (e.g., "Last 7 days", "Last 90 days") or fixed 30-day view?
   - **Recommendation:** Start with fixed 30-day view, add selector in Phase 9 if time permits

2. **Export functionality:** Should admin be able to export metrics as CSV/PDF?
   - **Recommendation:** Out of scope for Phase 8 (portfolio demo doesn't need exports)

3. **Multi-bot analytics:** If supporting multiple bots (future feature), should analytics be per-bot or aggregated?
   - **Recommendation:** Aggregated for Phase 8 (single demo bot), defer multi-bot to future phases

4. **Message type breakdown:** Should analytics separate user vs assistant messages in charts?
   - **Recommendation:** Show both on same chart (Tremor supports multi-category area charts)

## Sources

- [Using Realtime with Next.js | Supabase Docs](https://supabase.com/docs/guides/realtime/realtime-with-nextjs)
- [Realtime Chart with Supabase and Tremor | Medium](https://medium.com/shiwaforce/realtime-chart-with-supabase-and-tremor-169600a99bf6)
- [Best React chart libraries (2025 update) | LogRocket](https://blog.logrocket.com/best-react-chart-libraries-2025/)
- [Tremor – Tailwind CSS UI Components for Charts](https://www.tremor.so/)
- [Using Next.js and Tremor for charts | Eric Howey](https://www.erichowey.dev/writing/using-nextjs-tremor-for-charts-graphs-data-visualization/)
- [Clustering Documents with OpenAI embeddings, HDBSCAN | Dylan Castillo](https://dylancastillo.co/posts/clustering-documents-with-openai-langchain-hdbscan.html)
- [Text Clustering and Topic Modeling with LLMs | Medium](https://medium.com/@piyushkashyap045/text-clustering-and-topic-modeling-with-llms-446dd7657366)
- [Postgres Changes | Supabase Docs](https://supabase.com/docs/guides/realtime/postgres-changes)
- [How PostgreSQL Data Aggregation Works | Tiger Data](https://www.tigerdata.com/learn/data-aggregation-postgresql)
- [How to Generate Time Series Data in PostgreSQL](https://oneuptime.com/blog/post/2026-01-25-postgresql-generate-time-series/view)
