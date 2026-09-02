# ADR 001: ORM and Migrations Strategy

**Status:** Accepted  
**Date:** 2026-09-01  
**Deciders:** Engineering  

## Context

The PRD specifies (§9) that Blog Agent should use a modular monolith with Postgres + RLS for workspace isolation. The choice of ORM affects:
- Ease of expressing RLS policies and pgvector queries
- Migration workflow (SQL-first vs. ORM-first)
- Query flexibility for complex domain operations
- Type safety and developer experience

## Decision

**Use Drizzle ORM** (not Prisma, not raw SQL).

**Rationale:**

1. **First-class RLS support.** Drizzle supports raw SQL escape hatches for complex policy definition. Prisma restricts raw SQL; documenting RLS outside the ORM is error-prone.

2. **pgvector integration.** Drizzle has `pgvector()` column type built-in. Prisma requires workarounds.

3. **Migrations as SQL.** Drizzle generates SQL migrations; developers review and commit them. This fits the audit/versioning-heavy schema where every change is an event. Prisma's hidden migration history is harder to trace.

4. **Lightweight runtime.** Drizzle has no runtime service discovery or introspection overhead. Prisma's engine is heavier.

5. **Type safety without ORM lock-in.** Generated types from schema; code can drop to raw SQL when needed (cluster stats, complex aggregations).

## Alternatives Considered

### Prisma
- **Pros:** Large ecosystem, strong community, excellent docs
- **Cons:** Weaker RLS support, pgvector workarounds, hidden migration history, harder to review SQL

### Raw SQL + query builder (e.g., Knex)
- **Pros:** Maximum flexibility
- **Cons:** No type safety, migration management DIY, audit trail burden

### TypeORM
- **Pros:** Decorators, some RLS-like row-level security patterns
- **Cons:** Overkill for a single DB, less mature pgvector support

## Consequences

- **Good:** Easy to review and understand RLS policies (they're SQL, in the codebase). Type-safe queries. Migrations are readable, auditable, and reversible.
- **Neutral:** Smaller ecosystem than Prisma; fewer third-party integrations (but we don't need many).
- **Bad:** None significant; Drizzle is stable and well-maintained.

## Follow-up

- Verify Drizzle + RLS policy performance under load (not MVP concern).
- Consider Supabase's Postgres Inspector if debugging becomes common.
