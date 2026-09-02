# Milestone 1 Scaffold — Completion Checklist

**Status:** ~40% complete (foundation solid, depth work remaining)

## ✅ Completed

### Monorepo Setup
- [x] pnpm workspace config (`pnpm-workspace.yaml`)
- [x] Root `package.json` with dev/build/test/db scripts
- [x] Root `tsconfig.json` with path aliases (`@blog-agent/*`)
- [x] `.gitignore` (node_modules, .next, .env, etc.)
- [x] `.env.example` (all integration modes + credential stubs)

### Next.js Web App
- [x] `apps/web/package.json` (Next.js 14, React 18, Tailwind, Supabase)
- [x] `apps/web/tsconfig.json` (Next.js-specific)
- [x] `apps/web/next.config.js`
- [x] `apps/web/tailwind.config.ts` (Codewave brand tokens)
- [x] `apps/web/postcss.config.js`
- [x] `apps/web/app/globals.css` (brand colors, buttons, states, motions)
- [x] `apps/web/app/layout.tsx`
- [x] `apps/web/app/page.tsx` (minimal homepage)
- [x] `apps/web/eslintrc.json`

### Database Package (Drizzle)
- [x] `packages/db/package.json` (Drizzle + pg + pgvector)
- [x] `packages/db/drizzle.config.ts`
- [x] `packages/db/src/schema.ts` (all PRD §10 entities)
  - [x] Workspaces, Memberships
  - [x] Strategy versions, content verticals, SME profiles
  - [x] Sources, documents, document chunks (pgvector)
  - [x] Topic candidates, articles, article documents
  - [x] Interview sessions, insights
  - [x] Artifact versions, approvals
  - [x] Claims, assets, links
  - [x] WordPress publications
  - [x] Metric snapshots, content touches, lead events
  - [x] Healing proposals
  - [x] Job runs, audit events
  - [x] Integration connections
  - [x] Indexes (workspace, FK, search, timestamp)
- [x] `packages/db/src/index.ts` (schema exports)
- [x] `packages/db/tsconfig.json`

### Config Package
- [x] `packages/config/package.json` (Zod)
- [x] `packages/config/src/env.ts` (Zod env schema with integration modes)
- [x] `packages/config/tsconfig.json`

### Domain Package Scaffold
- [x] `packages/domain/package.json`
- [x] `packages/domain/src/index.ts` (exports for workflow, scoring, approvals, voice)
- [x] `packages/domain/tsconfig.json`

### Integrations Package Scaffold
- [x] `packages/integrations/package.json` (Anthropic SDK)
- [x] `packages/integrations/src/text-model/index.ts` (interface defined)
- [x] `packages/integrations/tsconfig.json`

### Worker App
- [x] `apps/worker/package.json` (pg-boss, Supabase)
- [x] `apps/worker/src/index.ts` (job subscriber bootstrap)
- [x] `apps/worker/tsconfig.json`

### Documentation
- [x] `README.md` (quick start, concepts, structure)
- [x] `SCAFFOLD_SESSION_SUMMARY.md` (this session's deliverables)
- [x] `docs/ARCHITECTURE.md` (system design, data flow, isolation, testing)
- [x] `docs/adr/001-orm-and-migrations.md` (Drizzle decision)
- [x] `docs/adr/002-integration-adapters-and-mock-mode.md` (mock/live pattern)

### Memory & Progress
- [x] `/Users/raghu/.claude/projects/-Users-raghu-React-Blog-agent/memory/project_scaffold_progress.md` (progress tracking)

---

## ⏳ In Progress / Next Session

### High Priority (Critical Path for V0 Golden Path)

#### Integration Adapters (`packages/integrations/src/`)
- [ ] **Text Model**
  - [ ] `text-model/anthropic.ts` — Anthropic Claude API integration
  - [ ] `text-model/mock.ts` — Deterministic draft/critique/revision templates
- [ ] **Image Model**
  - [ ] `image-model/index.ts` — Interface
  - [ ] `image-model/generic.ts` — HTTP adapter (Stability/OpenAI shape)
  - [ ] `image-model/mock.ts` — SVG/PNG placeholder generator
- [ ] **WordPress Client**
  - [ ] `wordpress/index.ts` — Interface (createDraft, updatePost, publishPost)
  - [ ] `wordpress/rest-api.ts` — WordPress REST API client (with idempotency locks)
  - [ ] `wordpress/mock.ts` — In-memory post store, media library, preview page
- [ ] **Search/Crawl**
  - [ ] `search-crawl/index.ts` — Interface
  - [ ] `search-crawl/http.ts` — Generic HTTP search API
  - [ ] `search-crawl/mock.ts` — Fixture corpus search
- [ ] **Analytics Adapters**
  - [ ] `analytics-ga4/` — GA4 Data API (live) + mock
  - [ ] `search-console/` — GSC API (live) + mock
  - [ ] `form-webhook/` — Signed webhook + mock endpoint

#### Domain Logic (`packages/domain/src/`)
- [ ] **Workflow State Machine** (`workflow/state-machine.ts`)
  - [ ] Stage state enum (NOT_STARTED, QUEUED, WORKING, READY_FOR_REVIEW, APPROVED, CHANGES_REQUESTED)
  - [ ] Overlay states (BLOCKED, PAUSED, CANCELLED, REOPENED)
  - [ ] Transition functions (with validation)
  - [ ] Invalidation matrix (PRD §6 table)
- [ ] **Opportunity Scoring** (`scoring/opportunity.ts`)
  - [ ] PRD §5 rubric (strategic relevance 25, audience 15, evidence 15, angle 15, SME fit 10, gap 10, conversion 10, -20 penalty)
  - [ ] Score calculation, confidence tracking
  - [ ] Factor-level breakdown
- [ ] **Publish-Readiness Scoring** (`scoring/publish-readiness.ts`)
  - [ ] PRD §5.5 dimensions (evidence 20, insight 20, ICP 15, brand 15, argument 10, SEO 10, expertise 5, CTA 5)
  - [ ] Severity tiers (P0 hard blockers, P1/P2/P3 issues)
  - [ ] Score calculation
- [ ] **Approval Gates** (`approvals/gates.ts`)
  - [ ] Gate registry (strategy, topic, brief, outline, claims, draft, images, final, publishing)
  - [ ] Approval version binding (hash-based)
  - [ ] Multiple-approver coordination (same hash required)
  - [ ] Role-based enforcement
- [ ] **Voice Analyzer** (`voice/analyzer.ts`)
  - [ ] Brand voice profile structure
  - [ ] Scoring content against voice (anti-AI, specificity, tone)
  - [ ] Criticism generation

#### Repository Layer (`packages/db/src/repositories/`)
- [ ] Base repository class (mandatory workspace_id scoping)
- [ ] Article repository (CRUD + state transitions)
- [ ] Approval repository (version binding, gate queries)
- [ ] Audit event recording on all mutations
- [ ] Workspace repository (isolation verification)

#### Auth & RBAC (`apps/web/lib/auth.ts`, middleware)
- [ ] Supabase Auth login/session
- [ ] `Membership` query (user → workspace → role)
- [ ] Role guard middleware (admin/marketer/founder/sme)
- [ ] Workspace switcher
- [ ] Logout/session refresh

#### Worker Job Handlers (`apps/worker/src/jobs/`)
- [ ] `ingest-source.ts` — Fetch, sanitize, chunk, embed
- [ ] `draft-article.ts` — Text model draft generation
- [ ] `critique-article.ts` — Text model critique + scoring
- [ ] `generate-images.ts` — Image model generation
- [ ] `wordpress-sync.ts` — Publish/update/drift detection
- [ ] Job error handling + retry logic

#### Next.js Route Handlers (`apps/web/app/api/`)
- [ ] `/api/jobs/enqueue` — Job submission from web app
- [ ] `/api/webhooks/form-submit` — Form lead capture
- [ ] `/api/webhooks/wordpress` — WordPress event notifications (post deleted, redirected, etc.)
- [ ] Error handling + workspace scoping

#### V0 Minimal UI (`apps/web/app/`)
- [ ] Workspace creation
- [ ] Source ingestion flow (URL/file upload)
- [ ] Draft preview + edit
- [ ] Approval buttons
- [ ] Mock WordPress viewer page

### Medium Priority (Fill After Golden Path)

- [ ] Strategy configuration UI (P0.1)
- [ ] Topic candidate UI + scoring display (P0.1)
- [ ] Calendar/board view (P0.2)
- [ ] SME briefing flow (P0.4)
- [ ] Brief/outline generation UI (P0.5)
- [ ] Critic loop UI (P0.5)
- [ ] Link + SEO review UI (P0.6)
- [ ] Analytics dashboard (P0.8)
- [ ] Healing proposal UI (P0.8)
- [ ] All 9 IA sections (PRD §8)

### Low Priority (Post-V1)

- [ ] Test suite (Vitest unit/integration, Playwright E2E)
- [ ] Performance optimization
- [ ] Logging/tracing
- [ ] Rate limiting
- [ ] Multi-workspace admin dashboard

---

## Key Locked Decisions (Do Not Change)

- **Data:** Supabase (Postgres + RLS + pgvector)
- **ORM:** Drizzle (migrations-as-SQL)
- **Queue:** pg-boss (Postgres-backed)
- **Build order:** PRD §15 (V0 golden path → P0.1–P0.9)
- **AI providers:** Anthropic (text), generic image API
- **Mock/live:** All integrations default to mock; env var switches to live
- **Fonts:** Free substitutes (Fraunces, Inter, IBM Plex Mono) via CSS variables

---

## How to Resume

### Session 2 Start
1. Ensure Node 20 and pnpm are available
2. Start with `packages/integrations/src/text-model/`:
   - Implement `mock.ts` first (deterministic responses, no external calls)
   - Then implement `anthropic.ts` (live Claude API)
   - These are critical path for V0
3. Implement WordPress mock (`wordpress/mock.ts`)
4. Fill in domain logic (workflow state machine, scoring)
5. Wire auth/RBAC middleware
6. Build worker job handlers
7. Create V0 minimal UI

### Testing Strategy
- **Unit:** Domain logic (state transitions, scoring calcs)
- **Integration:** Repository layer, workspace scoping, audit logging
- **E2E:** V0 golden path (topic → draft → approve → publish → form track)

### Reference Files
- Plan: `/Users/raghu/.claude/plans/i-have-attached-the-composed-bee.md`
- PRD: Attached (BLOG_AGENT_PRD.md)
- Progress: `/Users/raghu/.claude/projects/-Users-raghu-React-Blog-agent/memory/project_scaffold_progress.md`
- This checklist: `MILESTONE_1_CHECKLIST.md`

---

**Milestone 1 Status:** ✅ Foundation is solid. The schema is correct and complete. The build order is validated. All configuration plumbing is in place. Ready to fill in depth layers starting Session 2.
