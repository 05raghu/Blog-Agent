# Blog Agent V1 — Architecture

## Overview

Blog Agent is a durable, workspace-isolated content operating system for Codewave. It turns approved topics into evidence-backed, brand-aligned articles; manages SME contributions; coordinates human approvals at every stage; publishes to WordPress; measures search/engagement/lead outcomes; and proposes reversible improvements.

## System Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│ Next.js Web (App Router, React 18)                              │
│ - 9 IA sections (strategy, topics, calendar, articles, briefing,│
│   knowledge, performance, settings)                              │
│ - Route handlers (webhooks, job enqueue, integrations callbacks)│
└─────────────────┬───────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────────────────┐
│ Supabase Postgres + pgvector + RLS + Auth                        │
│ - Product state, versions, approvals, audit (Drizzle schema)    │
│ - RLS policies (workspace_id-scoped row access)                 │
│ - pgvector embeddings for semantic search (future v1.1)         │
└─────────────────┬───────────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
┌───────▼──────┐    ┌──────▼────────┐
│ pg-boss      │    │ Repository    │
│ Job Queue    │    │ Layer         │
│ (Postgres)   │    │ (workspace    │
└───────┬──────┘    │  scoping)     │
        │           └───────────────┘
        │
┌───────▼────────────────────────────────────────────────────────┐
│ Node Worker Process (pg-boss consumer)                          │
│ - Ingest & research (crawl, embed, chunk, quarantine)          │
│ - Drafting (text model → draft, critic, revision)              │
│ - Image generation + link validation                            │
│ - WordPress sync (idempotent publish, drift detect)            │
│ - Analytics sync (GA4, GSC, form submissions)                  │
│ - Healing (propose/execute/evaluate patches)                   │
└────────┬─────────────────────────────────────────────────────┘
         │
┌────────▼────────────────────────────────────────────────────┐
│ Integration Adapters (provider-agnostic interfaces)         │
│ - Text model (Anthropic Claude + mock)                     │
│ - Image model (generic HTTP + mock)                        │
│ - Search/crawl (pluggable + mock)                          │
│ - WordPress (REST API + mock)                              │
│ - GA4, GSC, form webhook (live + mock)                     │
└──────────────────────────────────────────────────────────┘
```

## Core Layers

### 1. Frontend (`apps/web/`)

**Next.js 14 + React 18** with App Router.

**Design System:** Codewave Brand System
- Colors: 8 editorial inks (Ink 950, Parchment, Signal Cyan, Copper, Slate, Azure, Sulphur, Ember, Iris)
- Typography: Fraunces (display), Inter (body), IBM Plex Mono (code) — free substitutes for licensed fonts
- Controls: 45px capsule buttons, two-tier system (Primary/Secondary), text-link variant
- Motion: Collapse (640ms), Entangle (960ms), Interfere (640ms) cubic-bezier animations
- Tailwind CSS v4 with custom theme extensions

**Sections (from PRD §8):**
1. Overview — action inbox, blockers, upcoming publications, portfolio outcomes
2. Strategy — versioned priorities, offerings, ICPs, geographies, competitors, verticals, mix, objectives
3. Topics — manual + AI candidates, scores, shortlist, rejection reasons
4. Calendar — board/table views for 5 concurrent articles + SME capacity
5. Article workspace — stage rail, editable artifact, sources, claims, scores, comments, approvals
6. SME briefing — one-question-at-a-time interview with recommendations
7. Knowledge — brand material, cases, sales decks, `/insights/` registry, claims, SME profiles
8. Performance & Healing — analytics, index health, leads, alerts, proposals, rollback
9. Settings — users, roles, integrations, WordPress mappings, providers, spending limits, policies

**State Management:** Server-side caching (Supabase client + server components). Client-side state via React hooks where needed (form submission, optimistic updates). No Redux/Zustand at MVP (can add if needed).

### 2. Database (`packages/db/`)

**Drizzle ORM** for migrations-as-SQL and first-class RLS support.

**Schema (PRD §10):**
- Tenant: `workspaces`, `memberships`
- Strategy: `strategyVersions`, `contentVerticals`, `smeProfiles`
- Sources: `sources`, `documents`, `documentChunks` (pgvector)
- Topics: `topicCandidates`
- Articles: `articles`, `articleDocuments`, `urlAliases`
- Briefing: `interviewSessions`, `insights`
- Versioning: `artifactVersions`, `approvals`
- Claims: `claims`
- Assets: `assets` (images)
- Links: `linkRecommendations`
- Publishing: `wordPressPublications`
- Analytics: `metricSnapshots`, `contentTouches`, `leadEvents`
- Healing: `healingProposals`
- Admin: `jobRuns`, `auditEvents`, `integrationConnections`

**Workspace Isolation:**
- Every tenant table has `workspace_id`
- Postgres RLS policies enforce row-level access via `auth.jwt()` claims
- Repository layer (wrapper over Drizzle queries) mandatorily injects `workspace_id` on every operation
- Audit events recorded on all mutations (actor, action, entity, before/after values, timestamp)

### 3. Business Logic (`packages/domain/`)

Framework-free TypeScript — no dependencies except Zod for validation.

**Modules:**
- **Workflow:** Stage state machine (§6 states + overlays), invalidation matrix (PRD table §6)
- **Scoring:** Opportunity score (§5 rubric: 25+15+15+15+10+10+10, up to -20 penalty), publish-readiness score (§5.5: evidence 20, insight 20, ICP fit 15, brand 15, argument 10, SEO 10, expertise 5, CTA 5)
- **Approvals:** Gate binding to `artifactVersion` hashes, version-based approval locking (multiple approvers must sign same hash)
- **Voice:** Brand voice profile (principles, desired patterns, prohibited patterns, terminology, tone boundaries)

### 4. Integrations (`packages/integrations/`)

Adapter pattern: every external service has an interface + two implementations (live + mock).

**Text Model Provider**
- Live: `AnthropicTextModel` (Claude API Messages endpoint)
- Mock: `MockTextModel` (templated responses + fixture library)
- Provides: `generateDraft()`, `generateCritique()`, `generateRevision()`

**Image Model Provider**
- Live: Generic HTTP adapter (OpenAI, Stability, or another provider)
- Mock: `MockImageModel` (local SVG/PNG placeholder generator)
- Provides: `generateImage(prompt, style, dimensions)`

**Search/Crawl Provider**
- Live: Pluggable HTTP search API (e.g., Serp, SerpAPI, or internal crawler)
- Mock: Fixture search results from a local corpus
- Provides: `search(query, domain)`, `crawl(url)`

**WordPress Client**
- Live: WordPress REST API (with idempotency locks)
- Mock: `MockWordPress` (in-memory post storage, media library, preview endpoint)
- Provides: `createDraft()`, `updatePost()`, `uploadMedia()`, `publishPost()`, `getPostStatus()`

**Analytics Providers**
- **GA4:** Live (GA4 Data API), mock (seeded fixture sessions/events)
- **GSC:** Live (Google Search Console API), mock (seeded fixture impressions/clicks/position)
- **Form webhook:** Live (signed webhook + replay protection), mock (test-submission endpoint)

**Integration Mode Resolution** (`packages/config/`)
- Environment variable per integration: `*_MODE=mock|live` (default `mock`)
- Credentials are optional at startup (live mode enforces them on first call)
- Adapters are instantiated from a factory based on env config

### 5. Worker (`apps/worker/`)

Node.js process running **pg-boss** job consumer.

**Job Types (filled in later sessions):**
- `ingest-source` — crawl URL, fetch file, sanitize, chunk, embed
- `draft-article` — text model generates draft from brief + outline
- `critique-article` — text model generates critique
- `generate-images` — image model creates hero + inline images
- `wordpress-sync` — publish/update draft or live post
- `ga4-sync` — fetch and store metrics
- `gsc-sync` — fetch and store impressions/clicks
- `form-sync` — reconcile form submissions
- `healing-patch` — execute an approved healing proposal

**Guarantees:**
- **Idempotent:** All jobs can be safely retried without duplication
- **Resumable:** Job state is persisted; crashed worker can resume
- **Isolated:** Each job scoped to one article/workspace (no cross-workspace leakage)
- **Auditable:** All changes recorded in `auditEvents` table

### 6. Config (`packages/config/`)

**Environment Schema (Zod)** with validation at startup.

Defines:
- Supabase credentials
- Integration modes (text-model, image-model, search, WordPress, GA4, GSC, form)
- Live credentials (optional, fetched on-demand)
- App settings (URL, worker enabled, environment)

## Data Flow

### V0 Golden Path (topic → WordPress draft → form tracking)

```
1. Create workspace → strategy snapshot
2. Ingest source (URL/file) → job:ingest-source
   └─ Fetch, sanitize, chunk, embed, store in documentChunks
3. Create topic candidate (manually or AI)
4. Assign SME, enqueue job:draft-article
   └─ TextModel generates draft from research pack + outline
5. Marketer edits draft manually
6. Enqueue job:critique-article
   └─ TextModel scores against brand voice + publish-readiness rubric
7. Marketer approves claims + draft gate
8. Enqueue job:generate-images
   └─ ImageModel creates hero image, stores in Supabase Storage
9. Marketer approves images
10. Marketer approves final package (all gates complete)
11. Enqueue job:wordpress-sync
    └─ REST API creates draft post, stores post_id + WordPress metadata
12. Marketer approves publishing gate
13. Enqueue job:wordpress-sync (publish=true)
    └─ REST API publishes post, records published_at
14. job:ga4-sync runs on schedule → stores MetricSnapshot
15. job:gsc-sync runs on schedule → stores MetricSnapshot
16. Form submission → webhook calls /api/lead-submit, stores LeadEvent
17. (Later) Healing detects 20% CTR decline → proposes patch
18. Marketer approves healing patch → job:healing-patch re-drafts section
19. job:wordpress-sync updates post → republish_approval gate
20. Evaluate healing outcome at 30/90 days
```

### Approval Flow

```
Article enters stage → Gate requires [role] approval
  ↓
ArtifactVersion created with contentHash
  ↓
Approval record created (gate, assignedTo, status=pending)
  ↓
Approver reviews, signs (approvedBy, approvedAt)
  ↓
Gate status changes to approved
  ↓
If changes requested → same artifact stored as next version
  → Downstream gates reopen per invalidation matrix
  ↓
If approved → next stage can proceed
```

## Isolation & Security

### Workspace Isolation

- **Database:** Postgres RLS policies on workspace_id, plus repository-layer injection
- **Auth:** Supabase Auth + Membership table (user → workspace → role)
- **Storage:** Supabase Storage paths prefixed by workspace_id
- **Job queue:** Jobs tagged with workspace_id; worker validates scoping
- **Audit:** Every AuditEvent records workspace_id

### Role-Based Access (RBAC)

| Role | Permissions |
|------|-------------|
| admin | All; manage users, integrations, spending limits |
| marketer | Operate calendar, approve (non-founder) gates, publish, monitor |
| founder | Review/contribute to flagship content, optional strategy approval |
| sme | Complete briefing for assigned articles, confirm attributed insights, view outcomes |

### Untrusted Data Handling

- Web scraped content → untrusted, quarantined until manually approved
- File uploads → MIME-type verified, sandboxed parsing, size limits, no archives in V1
- Model outputs → treated as generated content, require human approval before publishing
- User input → Zod validated, SQL injection impossible (Drizzle + prepared statements)

### Audit Trail

Every mutation recorded in `auditEvents`:
- Actor (user_id or service name)
- Action (create, update, approve, publish)
- Entity and entity_id
- Before/after values (jsonb)
- Timestamp

Enables: full traceability, rollback capability, compliance, debugging.

## Deployment

**Local Development:**
```bash
pnpm install
# Supabase local via CLI, or mock mode (default)
pnpm dev      # Web on :3000
pnpm worker   # Worker consumer
```

**Production (not yet built, post-V1):**
- Web: Node.js/Next.js on Vercel or similar
- Worker: Container on Kubernetes or Fly.io
- Database: Supabase cloud (managed Postgres)
- Storage: Supabase Storage (S3-compatible)
- Job queue: Postgres tables (pg-boss)

## Future Extensibility

**V1.1 — High-value fast follows:**
- SME contribution leaderboard
- CRM connector for qualified leads
- Richer batch calendar operations
- Provider/cost/latency controls per stage
- More proactive recommendations

**V2 — Continuous strategy & opportunity brain:**
- RSS feed monitoring
- Autonomous opportunity candidate inbox
- Learning from outcomes → weight auto-adjustment
- Policy-controlled automation ladder

Design maintains extensibility:
- Scoring rubric is data (strategyVersion.qualityThresholds), not code
- Source connectors are pluggable (integrationConnections)
- Approval rules are configurable (strategyVersion.approvalPolicy)
- Stage definitions live in domain package, reusable per gate

## Testing Strategy

- **Unit (Vitest):** Domain logic, scoring calculations, state transitions
- **Integration (Vitest + local DB):** Repository layer, RLS policies, workspace isolation
- **E2E (Playwright):** V0 golden path, multi-step workflows, approval flows

See `tests/` directory for structure (populated during implementation).

## Documentation

- `README.md` — Quick start, monorepo overview, concepts
- `ARCHITECTURE.md` — This file, system design
- `docs/adr/` — Architecture Decision Records (ORM choice, queue choice, etc.)
- `SCAFFOLD_SESSION_SUMMARY.md` — Deliverables for scaffold phase
- PRD (`BLOG_AGENT_PRD.md`) — Product requirements, all gates, all workflows

---

**Last updated:** 2026-09-01 (Scaffold session)
