# OpsPilot — Architecture Decision Records (ADRs)

## ADR 01: Selection of Full-Stack Framework (Next.js 15 App Router & React 19)
- **Context**: The platform requires high-performance server-rendered UI, seamless client-side reactivity for AI triaging widgets, and structured REST API routes.
- **Decision**: Adopt Next.js 15 (App Router) with TypeScript and Tailwind CSS.
- **Consequences**:
  - *Pros*: Unified codebase, zero context-switching between frontend and backend types, built-in route handlers, optimized static/dynamic rendering.
  - *Trade-off*: Server external packages require explicit configuration in `next.config.ts`.

---

## ADR 02: Relational Database & ORM (PostgreSQL + Prisma)
- **Context**: Operations management requires strong ACID consistency, strict foreign key constraints, normalized entities, unique constraints on SKUs/emails, and soft deletes.
- **Decision**: Use PostgreSQL 16 managed via Prisma ORM.
- **Consequences**:
  - *Pros*: 100% type-safe query generation, migration tooling, composite indexing support, fast batch seeder utilities.
  - *Trade-off*: Requires Prisma schema synchronization and generated client.

---

## ADR 03: Multi-Provider AI Abstraction Layer
- **Context**: Enterprise applications must avoid single-vendor lock-in (OpenAI, Gemini, Ollama) and ensure uninterrupted operation when cloud AI APIs experience latency or outages.
- **Decision**: Architect an `AIService` interface with a pluggable provider pattern and built-in deterministic heuristic fallback.
- **Consequences**:
  - *Pros*: Tests run reliably with zero external dependencies; cloud models can be switched via single environment variable `AI_PROVIDER`; zero downtime on external API failures.
  - *Trade-off*: Fallback heuristics must maintain parity with structured JSON schema contracts.

---

## ADR 04: Background Processing Queue (BullMQ + Redis with Inline Worker Failover)
- **Context**: AI analysis takes 300ms–2000ms. Synchronous execution on HTTP ticket creation would increase API latency and tie up web workers.
- **Decision**: Use BullMQ with Redis for asynchronous job processing, paired with an inline asynchronous fallback when Redis is offline.
- **Consequences**:
  - *Pros*: Immediate HTTP 201 responses; exponential backoff retries on transient LLM failures; rate limiting & concurrency throttling.
  - *Trade-off*: Requires Redis infrastructure in production container topologies.

---

## ADR 05: Layered Caching with Graceful In-Memory Fallback
- **Context**: Aggregate KPIs on the dashboard query several large tables and should be sub-5ms fast.
- **Decision**: Layered Redis caching with 60s TTL, event-driven invalidation on mutations, and an automatic in-memory LRU store fallback.
- **Consequences**:
  - *Pros*: Sub-3ms dashboard loads under 35k records; resilience when Redis restarts or is disconnected.
