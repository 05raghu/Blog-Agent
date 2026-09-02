# Blog Agent V1 — Content Operating System for Codewave

A durable, human-governed content operating system that turns approved topics into evidence-backed, brand-aligned articles published to WordPress, with measurable outcomes and approval-gated healing.

**Status:** Scaffold phase (40% complete) — Architecture and foundational layers in place. V0 golden path implementation ongoing.

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 8+
- (Optional for local dev) Supabase CLI for local Postgres + pgvector

### Setup

```bash
# Install dependencies
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase URL/keys (or use mock defaults)

# Start Next.js dev server
pnpm dev
# Visit http://localhost:3000

# (Optional) Start worker in separate terminal
pnpm worker
```

### Monorepo Structure

```
apps/
  web/          ← Next.js frontend (dev server)
  worker/       ← Node.js job consumer (pg-boss)

packages/
  db/           ← Drizzle schema, migrations, repository layer
  domain/       ← Framework-free business logic (scoring, workflow, approvals)
  config/       ← Environment schema, integration-mode resolution
  integrations/ ← Provider adapters (text model, images, WordPress, analytics)

tests/
  unit/         ← Vitest unit tests
  integration/  ← Vitest + local DB integration tests
  e2e/          ← Playwright golden-path tests
```

## Architecture

- **Frontend:** Next.js 14 (App Router) + React 18 + Tailwind CSS v4
- **Backend:** Supabase Postgres + pgvector, Drizzle ORM, pg-boss job queue
- **Design system:** Codewave brand tokens (colors, type scale, motion, button tiers)
- **Auth:** Supabase Auth + role-based access (admin/marketer/founder/sme)
- **Integrations:** Adapter pattern for all external services (mock by default)

### Design Decisions

- **Mock/demo mode by default** — All integrations are mockable; environment variables choose live providers.
- **Workspace isolation** — Postgres RLS + repository-layer scoping on every query.
- **Audit trail** — Every mutation recorded in `audit_events` table.
- **Versioned content** — Articles, strategies, approvals, and claims all versioned; history is never deleted.
- **State machine** — Workflow uses explicit stage state (NOT_STARTED, QUEUED, WORKING, READY_FOR_REVIEW, APPROVED, etc.) + overlays (BLOCKED, PAUSED, CANCELLED, REOPENED).

## Brand Compliance

The app uses the Codewave Brand System (`cw-new-brand-system.netlify.app`):

- **Colors:** Ink 950, Parchment, Signal Cyan, Oxidised Copper, Pewter Slate, Vivid Azure, Sulphur Yellow, Ember Orange, Iris Violet
- **Typography:** Fraunces (display), Inter (body), IBM Plex Mono (code) — substitutes for licensed Signifier/Söhne
- **Controls:** 45px radius buttons, two-tier system (Resolved Primary / Quiet Secondary)
- **Motion:** Collapse (640ms), Entangle (960ms), Interfere (640ms)

All tokens are CSS variables in `apps/web/app/globals.css`, ready for swapping licensed fonts later.

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your credentials:

```bash
cp apps/web/.env.example apps/web/.env.local
```

Key variables:
- **OpenAI API Key:** `OPENAI_API_KEY` (for live text generation; optional, uses mock by default)
- **Supabase:** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `DATABASE_URL` (optional for full V1; not needed for MVP demo)

The system runs in **mock mode by default** — no API keys required to test the demo.

## Key Concepts

### Workspace
Isolated tenant container for a single customer (Codewave initially). All content, users, integrations, and metrics are scoped by `workspace_id`.

### Strategy & Versions
Configurable priorities (offerings, ICPs, geographies, competitors, verticals, content mix). Each change creates a new `strategyVersion`. In-flight articles snapshot the strategy used when they entered production.

### Article Workflow
Topic → SME briefing → Brief/Outline → Draft → Critic loop → Claims review → Images → Final review → WordPress → Monitoring → Healing.

Each stage has explicit approval gates; hard blockers (invented claims, missing SME confirmation) cannot be overridden by score.

### Approval Gates
Every stage binds to an `artifactVersion` hash. Changes reopen downstream gates per an invalidation matrix (PRD §6).

### Healing
Automatic proposals when performance declines (e.g., 20% CTR drop). Human-approved patches are tracked, republished, and evaluated for outcome (improved/inconclusive/regressed).

## Development

### Running Tests

```bash
# Unit tests
pnpm test:unit

# Integration tests (requires local Postgres)
pnpm test:integration

# E2E tests
pnpm test:e2e

# All tests
pnpm test
```

### TypeScript & Linting

```bash
# Type-check entire monorepo
pnpm type-check

# Lint
pnpm lint
```

### Database Migrations

```bash
# Generate a migration after schema changes
pnpm db:generate

# Push to local Supabase
pnpm db:push

# Open Drizzle Studio
pnpm db:studio
```

## Documentation

- **Architecture:** See `docs/architecture.md` for system design, adapter pattern, and RLS strategy
- **Implementation Roadmap:** Follow the PRD sections P0.1–P0.9 for feature sequencing

## Current Status

✅ **Completed:**
- V0 MVP demo (blog article generation + AI critique)
- OpenAI GPT-4o-mini integration
- Codewave brand system applied
- Mock fallback (no API keys required)

📍 **Next Milestones (PRD sequence):**
1. **P0.1–P0.4:** Strategy configuration, workspace/RBAC, topic scoring, knowledge ingestion, SME briefing
2. **P0.5–P0.6:** Draft → Edit → Approve workflow, SEO, internal links, image selection
3. **P0.7–P0.8:** WordPress publishing, analytics, healing proposals
4. **P0.9:** Cross-workspace isolation, audit logging, compliance

## License

TBD (same as Codewave)

## Contact

Questions? Refer to the PRD or reach out to the product team.
