# Pitfalls Research: RAG-Powered AI Chatbot

**Domain:** RAG-powered customer support chatbot
**Researched:** 2026-02-08
**Confidence:** HIGH

## Critical Pitfalls

### Pitfall 1: Naive Fixed-Size Chunking

**What goes wrong:**
Teams default to uniform 500-token chunks without understanding semantic boundaries, causing context loss. Documents split mid-table or mid-definition, fragmenting critical information across unrelated chunks. This leads to the LLM hallucinating relationships that don't exist in the source material because it receives orphaned snippets without context headers.

**Why it happens:**
70% of enterprise teams copy-paste chunking strategies from tutorials without considering their specific document structure. The "default" 512-token window was never designed for semantic coherence.

**How to avoid:**
Use semantic chunking that respects document structure:
- Preserve tables and code blocks as atomic units
- Include contextual headers in each chunk
- Use overlapping windows (50-100 tokens) to maintain continuity
- Test chunking strategy with sample queries before full indexing
- Consider document-aware chunking (markdown sections, HTML structure)

**Warning signs:**
- Responses reference partial information from tables
- Users ask follow-up questions because first answer was incomplete
- High frequency of "I don't have enough information" responses despite relevant docs existing
- Debugging shows relevant chunks scored low in similarity search

**Phase to address:**
Phase 1 (RAG Foundation) - Implement and test chunking strategy before loading production knowledge base.

**Sources:**
- [Breaking up is hard to do: Chunking in RAG applications - Stack Overflow](https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/)
- [The Chunking Blind Spot - RAG About It](https://ragaboutit.com/the-chunking-blind-spot-why-your-rag-accuracy-collapses-when-context-boundaries-matter-most/)
- [Chunking Strategies for RAG | Weaviate](https://weaviate.io/blog/chunking-strategies-for-rag)

---

### Pitfall 2: Treating Evaluation as Optional

**What goes wrong:**
Teams ship RAG chatbots to production without systematic quality measurement. After the initial "wow" moment of chatting with your data, users quickly notice hallucinations and wrong answers. Without metrics, you can't tell if retrieval quality is degrading, if new documents are polluting the index, or if model changes improve/worsen performance.

**Why it happens:**
RAG implementations aren't treated with the same rigor as traditional software projects. The process of understanding requirements and expected functionality is skipped. Teams assume "it works in dev" means it works in production.

**How to avoid:**
Build evaluation pipeline from day 1:
- Create test query dataset with expected answers before building
- Measure retrieval metrics: precision@k, recall@k, MRR (Mean Reciprocal Rank)
- Measure generation metrics: relevance, factuality, completeness
- Track hallucination rate (responses contradicting source docs)
- Set up A/B testing infrastructure for prompt/chunking changes
- Monitor query latency and cost per query in production

**Warning signs:**
- No systematic way to verify if changes improve quality
- Relying on manual spot-checking for quality assurance
- User feedback shows declining satisfaction over time
- Can't answer "how good is our chatbot?" with data

**Phase to address:**
Phase 1 (RAG Foundation) - Build evaluation framework before claiming feature complete. Phase 3 (Production Hardening) - Add production monitoring and alerting.

**Sources:**
- [5 Critical Mistakes When Building a RAG Chatbot](https://softwarelogic.co/en/blog/5-critical-mistakes-when-building-a-rag-chatbot-and-how-to-avoid-them)
- [Testing Your RAG-Powered AI Chatbot - Hatchworks](https://hatchworks.com/blog/gen-ai/testing-rag-ai-chatbot/)

---

### Pitfall 3: No Hallucination Prevention Strategy

**What goes wrong:**
The chatbot confidently answers questions outside its knowledge base, inventing facts or mixing unrelated information. RAG doesn't eliminate hallucinations—it just shifts them. Hallucinations occur when Knowledge FFNs in LLMs overemphasize parametric knowledge while Copying Heads fail to integrate external knowledge from retrieved content. Users lose trust immediately when they catch one confident-but-wrong answer.

**Why it happens:**
Teams assume RAG automatically prevents hallucinations. Retrieval failures (no relevant docs found) or generation deficiencies (model ignores retrieved context) cause the LLM to fall back on training data, generating plausible-sounding but incorrect information.

**How to avoid:**
Implement multi-layer hallucination prevention:
- **Detection layer**: Use LLM prompt-based detection (75%+ accuracy) to check if answer contradicts source
- **Fallback prompting**: Explicitly instruct model to say "I don't have information on that" when retrieval returns low-confidence matches
- **Confidence scoring**: Return similarity scores with chunks; if max score < threshold (e.g., 0.7), trigger fallback
- **Citation requirement**: Force model to cite source chunk IDs; verify citations exist
- **Out-of-scope detection**: Classify query intent; reject off-topic queries before retrieval

**Warning signs:**
- Users report factually incorrect information
- Responses blend information from multiple unrelated documents
- Chatbot answers questions about topics not in knowledge base
- High response confidence scores on queries with low retrieval scores

**Phase to address:**
Phase 1 (RAG Foundation) - Implement detection and fallback mechanisms. Phase 2 (Polish & UX) - Add confidence indicators to UI.

**Sources:**
- [RAG Hallucinations Explained: Causes, Risks, and Fixes - Mindee](https://www.mindee.com/blog/rag-hallucinations-explained)
- [Detect hallucinations for RAG-based systems - AWS](https://aws.amazon.com/blogs/machine-learning/detect-hallucinations-for-rag-based-systems/)
- [Hallucination Mitigation for RAG - MDPI](https://www.mdpi.com/2227-7390/13/5/856)

---

### Pitfall 4: Mid-Stream Error Handling Failures

**What goes wrong:**
When OpenAI streaming fails mid-response, the UI shows a half-completed message with no indication of failure. HTTP status codes can't change after streaming starts, so errors arrive as Server-Sent Events (SSE) that the client may not handle. User sees "The capital of France is Par..." and assumes the chatbot is broken.

**Why it happens:**
Developers test happy-path streaming but don't simulate network failures, rate limits hit mid-stream, or context window exceeded errors during generation. Error handling logic assumes errors occur before streaming begins.

**How to avoid:**
Implement robust streaming error detection:
- Listen for `error` event type in SSE stream
- Set stream timeout (30s) to detect stalled connections
- Show "regenerate response" button if stream fails
- Store partial response in error state for debugging
- Implement exponential backoff for rate limit errors
- Display clear error messages: "Response interrupted - please try again"
- Don't append partial responses to conversation history on error

**Warning signs:**
- Users report seeing incomplete sentences with no way to retry
- No error logs when users complain about "broken" responses
- Conversation history contains partial assistant messages
- High rate of page refreshes during streaming (users don't know how else to recover)

**Phase to address:**
Phase 1 (RAG Foundation) - Implement streaming error handling in chat API. Phase 2 (Polish & UX) - Add retry UI and error state visualization.

**Sources:**
- [Streaming API responses - OpenAI](https://platform.openai.com/docs/guides/streaming-responses)
- [Best Practices for Handling Mid-Stream Errors - OpenAI Community](https://community.openai.com/t/best-practices-for-handling-mid-stream-errors-responses-api/1370883)

---

### Pitfall 5: Widget Iframe Security Holes

**What goes wrong:**
Embedding chatbot via iframe creates XSS attack surface and privacy leaks. Third-party content runs in your domain context, feeling trustworthy to users. Without proper sandboxing and CSP headers, malicious actors can inject scripts, steal cookies, or perform clickjacking attacks. Chatbot URLs exposed in iframe src are vulnerable to unauthorized access.

**Why it happens:**
Teams treat iframe embedding as "just add a script tag" without understanding cross-origin security model. Default iframe settings are permissive, allowing forms, scripts, and same-origin access.

**How to avoid:**
Implement defense-in-depth iframe security:
- **Sandbox attribute**: `<iframe sandbox="allow-scripts allow-same-origin">` (minimal permissions)
- **CSP headers**: Set `frame-ancestors` directive to whitelist allowed embedders
- **postMessage verification**: Always verify `event.origin` in message handlers
- **Signed embed tokens**: Generate time-limited JWT for each embed; verify server-side
- **HTTPS only**: Enforce TLS for widget endpoint
- **No sensitive data in iframe**: Don't expose user PII or API keys in widget context
- **Cookie isolation**: Use SameSite=Strict for session cookies

**Warning signs:**
- Widget works on any domain without authentication
- Chat history visible across different embedding sites
- Browser console shows mixed-content warnings
- No verification of postMessage origin in event handlers

**Phase to address:**
Phase 2 (Widget Implementation) - Build security model before widget goes live. Phase 3 (Production Hardening) - Security audit and penetration testing.

**Sources:**
- [2026 Iframe Security Risks and 10 Ways to Secure Them - Qrvey](https://qrvey.com/iframe-security/)
- [Securing Cross-Window Communication: A Guide to postMessage - BindBee](https://www.bindbee.dev/blog/secure-cross-window-communication)

---

### Pitfall 6: Uncontrolled API Cost Explosion

**What goes wrong:**
Demo chatbot goes viral or gets hit by bot traffic; OpenAI bill jumps from $50 to $5,000 overnight. Production chatbot using GPT-4o for all queries when GPT-4o-mini would suffice. No rate limiting means single user can drain budget with infinite requests. For portfolio demo with real public traffic, this kills the project.

**Why it happens:**
Developers optimize for functionality first, add cost controls "later." No monitoring of per-user costs, token consumption, or model routing. Streaming responses with no max_tokens limit can generate 4000-token responses to simple questions.

**How to avoid:**
Implement cost controls before public launch:
- **Model routing**: Use GPT-4o-mini (default), escalate to GPT-4o only for complex queries
- **max_tokens limit**: Cap responses at 300 tokens for chatbot (prevents verbose responses)
- **Rate limiting**: Max 20 requests/user/hour, 100 requests/day for demo
- **Prompt caching**: Cache system prompt + knowledge base context (50-90% savings on repeated content)
- **Cost monitoring**: Track spend per conversation; alert at $100/day threshold
- **Batch API for analytics**: Use 50% cheaper batch API for non-real-time processing
- **Budget alerts**: Set OpenAI usage limits; hard cap at $500/month for demo

**Warning signs:**
- Can't predict monthly OpenAI costs within 2x
- No per-user rate limiting in place
- Using GPT-4o for queries that GPT-4o-mini can handle
- Average response length > 500 tokens
- No alerting when daily spend exceeds threshold

**Phase to address:**
Phase 1 (RAG Foundation) - Implement model selection and max_tokens. Phase 3 (Production Hardening) - Add rate limiting, monitoring, cost alerts before public launch.

**Sources:**
- [Cost optimization - OpenAI](https://platform.openai.com/docs/guides/cost-optimization)
- [OpenAI Pricing in 2026 - Finout](https://www.finout.io/blog/openai-pricing-in-2026)
- [Complete LLM Pricing Comparison 2026 - CloudIDR](https://www.cloudidr.com/blog/llm-pricing-comparison-2026)

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip chunk overlap | Faster indexing, simpler code | Lost context continuity, worse retrieval quality | Never - overlap is critical for RAG |
| No reranking after retrieval | Simpler pipeline, lower latency | Lower precision, more hallucinations | Early prototyping only |
| Store all messages in single DB row | Simpler schema | DynamoDB 400KB item limit, expensive updates | Only if conversation length hard-capped at 20 messages |
| Use same model for all queries | No routing logic | 3-5x higher costs, slower responses | Never in production |
| Skip prompt caching | Simpler implementation | 50-90% higher costs on repeated context | Early MVP only (< 100 users) |
| No semantic search index (HNSW) | Works on small datasets | Linear scan breaks at 100K+ vectors | Datasets < 10K vectors |
| Client-side rate limiting only | Faster to implement | Trivial to bypass, budget unprotected | Never for public demos |

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| OpenAI API | Not handling rate limit errors (429) | Implement exponential backoff with jitter; catch and retry |
| Supabase pgvector | Forgetting to create HNSW index | `CREATE INDEX ON document_chunks USING hnsw (embedding vector_cosine_ops)` |
| OpenAI embeddings | Embedding entire documents (> 8K tokens) | Chunk first, embed chunks individually |
| Streaming responses | Appending to conversation on error | Only save to history on successful stream completion |
| Widget iframe | Allowing all origins in postMessage | Whitelist specific domains: `if (event.origin !== 'https://trusted-domain.com') return` |
| Supabase RLS | Disabling RLS for "simplicity" | Enable RLS; use service role key only server-side |

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Keeping HNSW index out of memory | Query latency spikes to 5-10s | Use pgvectorscale, ensure RAM > index size | Index size > 50% of available RAM |
| No vector search caching | Repeated similar queries hit DB | Cache top-K results with TTL | 100+ QPS |
| Retrieving 50+ chunks per query | Slow retrieval, context window overflow | Retrieve top 5, rerank to top 3 | Token count > 4K per query |
| Storing embeddings in app memory | High memory usage, slow startup | Store in pgvector, retrieve on demand | 10K+ documents |
| Linear scan on messages table | Chat history load time increases | Index on conversation_id and created_at | 1K+ conversations |
| No database connection pooling | Connection exhaustion under load | Use Supabase connection pooler | 50+ concurrent users |

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| Exposing knowledge base docs to unauthorized users | Data leak, competitive intel loss | Require authentication; check user permissions in RAG query |
| No input sanitization on chat messages | Prompt injection attacks | Sanitize user input; use separate system/user message roles |
| Storing API keys in widget client code | Key theft, unlimited API usage | Generate signed tokens server-side; validate per request |
| No rate limiting on document upload | Storage exhaustion, cost explosion | Max 10 uploads/user/day, 5MB file size limit |
| Using anon key for embeddings generation | Exposes embeddings API to public | Use service role key server-side only |
| Returning raw SQL errors to client | Information disclosure | Catch DB errors, return generic "Something went wrong" |

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| No loading state during streaming | User thinks chatbot is broken (3-5s delay) | Show typing indicator immediately on send |
| Streaming one character at a time | Jittery, hard to read | Buffer tokens; stream in 3-5 word chunks |
| No citation/source links | User can't verify information | Include "Source: [doc name]" with each response |
| Chat input disabled during streaming | User can't ask follow-up quickly | Allow queueing next message while streaming |
| No "regenerate" button on errors | User has to retype entire question | Add retry button; preserve user's original message |
| Widget covers mobile nav/CTA | Unusable on mobile, lost conversions | Test on mobile; adjust z-index and positioning |
| No conversation history persistence | User loses context on page refresh | Save to Supabase on each exchange; restore on mount |
| Error messages show technical details | Confusion, loss of trust | User-friendly: "I'm having trouble connecting. Please try again." |

## "Looks Done But Isn't" Checklist

Things that appear complete but are missing critical pieces.

- [ ] **Streaming chat:** Missing error boundary for mid-stream failures - verify error handling with network throttling
- [ ] **RAG retrieval:** Returns top-K chunks without checking similarity threshold - verify fallback when no good matches
- [ ] **Document upload:** Processes file but doesn't validate content - verify size limits, file type checks, malware scanning
- [ ] **Widget embed:** Works on localhost but CORS blocks production - verify allowed origins, CSP headers
- [ ] **Conversation history:** Saves messages but no pagination - verify performance with 100+ message conversations
- [ ] **Cost monitoring:** Tracks tokens but no budget alerts - verify alerts trigger before runaway costs
- [ ] **Mobile widget:** Renders but blocks UI elements - verify z-index, positioning, viewport behavior
- [ ] **Hallucination detection:** Implemented but no user-facing indicator - verify "low confidence" warnings in UI

## Recovery Strategies

When pitfalls occur despite prevention, how to recover.

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Poor chunking strategy in production | HIGH | Re-chunk all documents, regenerate embeddings, reindex (hours of compute) |
| No hallucination detection | MEDIUM | Add detection layer, audit conversation logs for false info, send corrections to affected users |
| Cost explosion from no rate limiting | HIGH | Implement limits, analyze usage patterns, potentially refund/explain to users hit by limits |
| Widget security hole | CRITICAL | Patch immediately, audit access logs, notify affected customers, incident report |
| pgvector index not in memory | LOW | Upgrade instance RAM or implement pgvectorscale, test with load testing |
| Mid-stream errors swallowed | LOW | Add error handlers, deploy update, clear broken messages from conversation history |
| Fake-looking demo data | MEDIUM | Replace with realistic knowledge base (research real company FAQs), regenerate test conversations |

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Naive chunking | Phase 1: RAG Foundation | Test with 20 diverse queries; measure answer quality vs. source docs |
| No evaluation pipeline | Phase 1: RAG Foundation | Metrics dashboard shows retrieval precision/recall, hallucination rate |
| No hallucination prevention | Phase 1: RAG Foundation | Test with out-of-scope queries; verify fallback responses |
| Streaming error handling | Phase 1: RAG Foundation | Simulate network failure mid-stream; verify error UI and retry |
| Widget security holes | Phase 2: Widget | Security audit checklist passed; CSP headers verified |
| API cost explosion | Phase 3: Production Hardening | Rate limits tested, cost alerts triggered in staging |
| pgvector performance | Phase 3: Production Hardening | Load test with 1000 concurrent queries; p95 latency < 500ms |
| Fake demo data | Phase 2: Polish & UX | Non-technical reviewer confirms chatbot feels "real" |

## Additional Portfolio-Specific Pitfalls

### Pitfall 7: Demo Data Looks Fake

**What goes wrong:**
Knowledge base filled with generic "Company ABC provides services" content that screams "tutorial project." Prospects evaluating your portfolio dismiss it as non-production-ready because the data quality signals amateur work.

**Why it happens:**
Developers focus on technical implementation, treat content as afterthought. Use Lorem Ipsum or minimal placeholder data.

**How to avoid:**
- Research real IT support company FAQs, service descriptions, pricing pages
- Create 15-20 realistic documents with actual troubleshooting steps, technical details
- Include variety: service descriptions, pricing tiers, troubleshooting guides, company policies
- Test chatbot with questions a real customer would ask
- Have non-technical person review: "Does this feel like a real company?"

**Warning signs:**
- Knowledge base has < 10 documents
- All docs follow same template structure
- No specific technical details (e.g., "We fix computer problems" vs. "We provide 24/7 remote desktop support for Windows 10/11 using TeamViewer or AnyDesk")
- Chatbot gives generic answers that could apply to any business

**Phase to address:**
Phase 2 (Polish & UX) - Replace placeholder content before public launch.

**Sources:**
- [Why 40% of Agentic AI Projects Fail in 2026 - Tech Edu Byte](https://www.techedubyte.com/agentic-ai-projects-fail-architecture-data-challenges-2026/)
- [Top Mistakes in Generative AI Development - Excellent Webworld](https://www.excellentwebworld.com/mistakes-in-generative-ai-development/)

---

### Pitfall 8: Stale Vector Index After Schema Changes

**What goes wrong:**
You update chunking strategy, change embedding model, or modify document processing logic, but forget to regenerate embeddings. Old vectors in pgvector don't match new processing pipeline, causing retrieval quality to silently degrade. Queries return irrelevant chunks because embedding space is inconsistent.

**Why it happens:**
No clear migration path for vector data. Schema migrations handle tables/columns, but vector regeneration is manual. Teams test changes on new docs only, miss that existing vectors are now incompatible.

**How to avoid:**
- Version your embedding pipeline (track chunking strategy, model, preprocessing in metadata)
- Detect version mismatch: compare document's embedding_version with current pipeline version
- Create migration script: "Re-embed all documents with version < X"
- Add index rebuild to deployment checklist for embedding changes
- Monitor retrieval quality metrics to detect silent degradation

**Warning signs:**
- Retrieval quality drops after "improving" chunking strategy
- New documents return better results than old documents for same query
- Similarity scores lower than expected for obvious matches
- Debugging shows embedding dimensions changed but old vectors still in DB

**Phase to address:**
Phase 3 (Production Hardening) - Add embedding version tracking and migration tooling.

**Sources:**
- Identified from Supabase pgvector research and RAG best practices
- Common issue in production RAG systems (from technical experience)

---

## Sources

**RAG Best Practices:**
- [5 Critical Mistakes When Building a RAG Chatbot](https://softwarelogic.co/en/blog/5-critical-mistakes-when-building-a-rag-chatbot-and-how-to-avoid-them)
- [Testing Your RAG-Powered AI Chatbot - Hatchworks](https://hatchworks.com/blog/gen-ai/testing-rag-ai-chatbot/)
- [The Non-Technical Challenges with RAG - Medium](https://medium.com/@DanGiannone/the-non-technical-challenges-with-rag-e91fb165565e)

**Chunking & Embeddings:**
- [Chunking Strategies for RAG | Weaviate](https://weaviate.io/blog/chunking-strategies-for-rag)
- [Breaking up is hard to do: Chunking in RAG applications - Stack Overflow](https://stackoverflow.blog/2024/12/27/breaking-up-is-hard-to-do-chunking-in-rag-applications/)
- [The Chunking Blind Spot - RAG About It](https://ragaboutit.com/the-chunking-blind-spot-why-your-rag-accuracy-collapses-when-context-boundaries-matter-most/)

**Hallucination Prevention:**
- [RAG Hallucinations Explained - Mindee](https://www.mindee.com/blog/rag-hallucinations-explained)
- [Detect hallucinations for RAG-based systems - AWS](https://aws.amazon.com/blogs/machine-learning/detect-hallucinations-for-rag-based-systems/)
- [Hallucination Mitigation for RAG - MDPI](https://www.mdpi.com/2227-7390/13/5/856)

**OpenAI API:**
- [Streaming API responses - OpenAI](https://platform.openai.com/docs/guides/streaming-responses)
- [Cost optimization - OpenAI](https://platform.openai.com/docs/guides/cost-optimization)
- [Best Practices for Handling Mid-Stream Errors - OpenAI Community](https://community.openai.com/t/best-practices-for-handling-mid-stream-errors-responses-api/1370883)

**Widget Security:**
- [2026 Iframe Security Risks and 10 Ways to Secure Them - Qrvey](https://qrvey.com/iframe-security/)
- [Securing Cross-Window Communication: A Guide to postMessage - BindBee](https://www.bindbee.dev/blog/secure-cross-window-communication)

**Performance & Scaling:**
- [Optimizing Vector Search at Scale - Medium](https://medium.com/@dikhyantkrishnadalai/optimizing-vector-search-at-scale-lessons-from-pgvector-supabase-performance-tuning-ce4ada4ba2ed)
- [pgvector 0.4.0 performance - Supabase](https://supabase.com/blog/pgvector-performance)
- [Vector Search in 2026: Pinecone vs. Supabase pgvector - Geetopadesha](https://geetopadesha.com/vector-search-in-2026-pinecone-vs-supabase-pgvector-performance-test/)

**UX & Demo Quality:**
- [Why 40% of Agentic AI Projects Fail in 2026 - Tech Edu Byte](https://www.techedubyte.com/agentic-ai-projects-fail-architecture-data-challenges-2026/)
- [Chatbot design challenges and tips for 2026 - Jotform](https://www.jotform.com/ai/agents/chatbot-design/)
- [10 Common Chatbot Mistakes - Denser.ai](https://denser.ai/blog/chatbot-mistakes/)

---
*Pitfalls research for: RAG-powered AI customer support chatbot*
*Researched: 2026-02-08*
