# ADR 002: Integration Adapters and Mock Mode by Default

**Status:** Accepted  
**Date:** 2026-09-01  
**Deciders:** Product + Engineering  

## Context

The PRD (§9, V0 exit criteria) requires that Blog Agent be usable without real external credentials (WordPress, GA4, GSC, text models, image APIs). This is needed for:
- Local development without onboarding
- Seeded/historical data testing (healing workflows, analytics)
- Demo/sandbox environments
- Gradual credential onboarding (swap integrations one at a time)

## Decision

**Every external dependency is defined as a small TypeScript interface with one live implementation and one mock implementation, chosen at runtime via environment variables.**

**Pattern:**
```typescript
// Provider interface (packages/integrations/src/*/index.ts)
export interface TextModelProvider {
  generateDraft(params): Promise<string>;
  generateCritique(params): Promise<Critique>;
}

// Live implementation (*.ts)
export class AnthropicTextModel implements TextModelProvider { ... }

// Mock implementation (mock.ts)
export class MockTextModel implements TextModelProvider { ... }

// Factory (packages/config/src/providers.ts)
const provider = process.env.TEXT_MODEL_MODE === 'live'
  ? new AnthropicTextModel(apiKey)
  : new MockTextModel();
```

**Integrations:**
1. **Text Model** (draft, critique, revision) — Anthropic Claude (live) + deterministic templates (mock)
2. **Image Model** (hero, inline) — Generic HTTP adapter (live) + SVG/PNG placeholders (mock)
3. **Search/Crawl** (research) — Pluggable HTTP API (live) + fixture corpus (mock)
4. **WordPress** (publish, update, draft) — REST API (live) + in-memory store with idempotency (mock)
5. **GA4** (metrics) — Data API (live) + seeded fixture sessions/events (mock)
6. **GSC** (impressions/clicks) — API (live) + seeded fixture data (mock)
7. **Form Webhook** (leads) — Signed webhook handler (live) + test endpoint (mock)

**Environment Config:**
```bash
# .env.local (all default to mock for zero-credential startup)
TEXT_MODEL_MODE=mock              # or live
IMAGE_MODEL_MODE=mock
SEARCH_CRAWL_MODE=mock
WORDPRESS_MODE=mock
GA4_MODE=mock
GSC_MODE=mock
FORM_WEBHOOK_MODE=mock

# Live credentials (only loaded if corresponding MODE=live)
ANTHROPIC_API_KEY=sk-...
WORDPRESS_REST_USERNAME=...
GA4_PROPERTY_ID=...
```

## Rationale

1. **Zero-credential startup.** Developers can run `pnpm install && pnpm dev` with no WordPress, API keys, or GA4 account.

2. **E2E testing without flakey externals.** Mock adapters are deterministic; all V0 exit criteria can be validated locally (idempotent publish, drift detection, form tracking).

3. **Gradual credential onboarding.** Swap one adapter to live without touching product code (env var only).

4. **Seeded data validation.** Analytics/healing workflows tested against realistic mock data before real accounts exist.

5. **Type safety.** Both implementations satisfy the same interface; swaps are compile-checked.

## Alternatives Considered

### Feature flags within product code
- **Cons:** Conditional logic scattered throughout; harder to test both paths; credentials in code

### Separate CLI tools for setup
- **Cons:** Extra learning curve; harder to iterate during development

### Moto/LocalStack for AWS services
- **Cons:** Overkill for a single app; doesn't help WordPress or GA4

## Consequences

- **Good:** Dev-friendly, testable, phased rollout, no deleted code for prod (just env swap).
- **Neutral:** Mock implementations need to be realistic (especially WordPress' idempotency and GA4 shape). But this is validated by E2E tests.
- **Bad:** None significant; mocks are cheap to build.

## Follow-up

- Verify WordPress mock idempotency matches REST API retry semantics.
- Build GA4/GSC mock fixtures with realistic field values and timezones.
- Document integration-switch checklist for when a credential is available.
