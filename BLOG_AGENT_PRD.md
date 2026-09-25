# Blog Agent – Phased Product Requirements

**Status:** Draft for product and engineering validation  
**Date:** 27 August 2026  
**Initial workspace:** Codewave  
**Initial publishing target:** `codewave.com/insights/`  
**Excluded publishing target:** `/feeds/blog/`

## 1. Product summary

Blog Agent is a human-governed content operating system for founders, marketers, and subject-matter experts (SMEs). It turns a configurable content strategy and an approved topic into an evidence-backed, brand-aligned article; coordinates every human approval; publishes to WordPress; measures search, engagement, and form-lead outcomes; and proposes reversible improvements.

The initial product is for Codewave, but every strategy, source, credential, memory, workflow, and metric is isolated by workspace so it can later become a client-facing solution.

### V1 promise

> A marketer can take an approved topic through SME input, a publish-ready article, WordPress publication, performance monitoring, and an approval-based refresh while several articles run concurrently.

### V2 promise

> A continuously learning opportunity engine monitors approved feeds and sources, identifies relevant developments across configurable editorial verticals, explains and scores each opportunity from 0–100, recommends an SME, and places strong ideas into a human-reviewed candidate inbox.

## 2. Problem statement

Codewave has the ingredients for strong content—expertise, brand material, case studies, market context, analytics, and an existing WordPress corpus—but turning them into differentiated articles is slow, fragmented, and difficult to measure. Generic AI writing can increase output while weakening originality, factual trust, and brand authority; meanwhile, performance data rarely returns to the editorial workflow in a usable form.

The product must preserve the parts that require human judgment—topic selection, lived insight, attribution, and publishing accountability—while automating research synthesis, drafting, quality checks, production work, analytics, and evidence-backed improvement proposals.

## Goals

1. Take an approved topic and completed SME input to a WordPress-ready draft in seven business days or less.
2. Make every factual claim, attributed insight, approval, and published revision traceable, with zero invented experiences or quotations.
3. Let a small marketing team keep five article workflows active without losing quality, ownership, or state.
4. Connect each published article to search visibility, engagement, CTA behavior, and WordPress-form lead outcomes so performance can inform the next editorial action.
5. Validate the Codewave workflow while enforcing workspace isolation from day one, avoiding a later multi-tenant data-model rewrite.

## Prior art and reuse position

[Claude Blog](https://claude-blog.md/) is useful prior art for research, writing, critic, scoring, template, SEO, and image-generation patterns. V0 should test selective reuse under its published license, but Blog Agent should not be architected as a GUI wrapper around a terminal process. Its differentiated product layer is durable workflow state, knowledge and claim provenance, SME collaboration, approvals, publishing safety, attribution, performance learning, and workspace isolation.

## 3. Product principles

1. **Strategy is configuration, not code.** Offerings, ICPs, geographies, competitors, editorial verticals, goals, content mix, scoring weights, and approval policies are versioned workspace settings.
2. **AI proposes; humans remain accountable.** The core strategy, topic, brief, outline, claims, draft, images, final-package, and publishing gates cannot be disabled in V1. Settings may change owners or add reviewers, but cannot remove these gates. An agent may research, recommend, draft, score, and revise, but it cannot approve its own work.
3. **Human insight is never fabricated.** Personal experience, opinions, quotations, customer facts, and case-study outcomes must come from an identified human or an approved source.
4. **Quality beats output volume.** Specificity, evidence, argument quality, and usefulness outrank keyword density and publishing frequency.
5. **Automation is earned by stage and content type.** Low edit rates and stable outcomes may justify future automation. Opinion pieces always retain human topic, attribution, and final-publishing decisions.
6. **Everything important is traceable.** Sources, claims, prompts, model runs, costs, scores, edits, approvals, publications, and healing changes remain auditable and reversible.
7. **APIs first, computer control second.** Model and WordPress APIs are the primary execution path. Browser/computer automation is a fallback for unsupported operations.
8. **Models are replaceable; product state is not.** Content and workflows remain editable and usable without another API call and are not locked to Claude, OpenAI, or another provider.
9. **Ingested material is untrusted data.** Web pages and uploaded documents cannot issue instructions to the system; anomalous, spammy, or unsafe content is quarantined.

## 4. Personas and ownership

### Founder / editorial sponsor

- Reviews strategy and high-importance content.
- Supplies or approves original viewpoints for founder and flagship pieces.
- Sees publishing plans and business outcomes without managing every operational step.

### Marketer / operator

- Owns workspace configuration, topic shortlisting, the content calendar, operational approvals, research policy, WordPress publishing, and performance follow-up.
- Manages multiple concurrent articles and resolves blockers.

### SME / contributor

- Has an expertise profile and a default capacity of 2–4 hours per month.
- Completes one-at-a-time in-app briefing questions or provides an existing document/transcript.
- Confirms any attributed insight, technical assertion, anecdote, or quotation.
- Targets at least one article contribution per month, with 1–2 articles being a realistic starting range.

### Workspace admin

- Manages users, roles, API credentials, integrations, workspace isolation, retention, and spending limits. In V1 this role may be held by a marketer.

## User stories

### Marketer

- As a marketer, I want to update offerings, ICPs, geographies, editorial verticals, objectives, and content mix in settings so that the system follows current strategy without code changes.
- As a marketer, I want evidence-backed topic candidates with explainable scores and cannibalization warnings so that I can confidently shortlist work.
- As a marketer, I want several independently gated articles visible in one calendar so that I can manage owners, SMEs, deadlines, and blockers.
- As a marketer, I want an editable, scored, sourced article package and WordPress preview so that I can approve and publish without rebuilding the content manually.
- As a marketer, I want the system to propose an exact, reversible improvement when performance changes so that I can heal content without surrendering editorial control.

### Founder

- As a founder, I want to contribute and approve a distinctive position without operating the whole workflow so that flagship pieces retain a genuine human point of view.
- As a founder, I want to see upcoming high-importance content and its resulting visibility and leads so that editorial effort stays connected to company outcomes.

### SME

- As an SME, I want a short, one-question-at-a-time briefing with recommended options and free text so that contributing expertise is focused and manageable.
- As an SME, I want the system to digest my existing document or transcript so that I do not have to repeat material it already has.
- As an SME, I want final control over attributed insights and quotations so that the published article accurately represents my knowledge and position.
- As an SME, I want to see the outcomes of my contributions so that I understand which expertise creates useful audience impact.

### Workspace admin

- As a workspace admin, I want every source, credential, model run, artifact, and metric isolated by workspace so that Codewave can later offer the product safely to clients.

## 5. Content model

The default editorial mix is editable in settings:

| Content class | Default mix | SME policy | Typical outcome |
|---|---:|---|---|
| Expert POV / thought leadership | 40% | Named SME required | Authority, outbound, brand differentiation |
| Search-led education | 40% | Optional, configurable; evidence review remains mandatory | Qualified non-brand discovery |
| Commercial, use-case, or case-led | 20% | SME or evidence owner required | CTA action and leads |

Editorial verticals are also configurable and need not map directly to a service. Codewave may run distinct lanes for design, technology, culture, self-management, industries, and company or market commentary. Every article stores the exact strategy version, vertical, objective, ICP, geography, offering, and content class used when it entered production.

## 6. End-to-end workflow

```text
Active strategy
  → Topic candidate and shortlist approval
  → SME recommendation, assignment, and attribution approval when required
  → Research pack and brief approval
  → Outline approval
  → Draft and critic/editor loop
  → Claims and evidence approval
  → Draft approval
  → SEO, links, CTA, and metadata review
  → Image approval
  → Final package approval
  → WordPress draft and preview
  → Publish approval
  → Published and monitored
  → Healing proposal and exact diff
  → Impacted approvals
  → Republish approval
  → Monitoring
```

### Default gate owners

| Gate | Required human approval |
|---|---|
| Strategy | Marketer; optional founder requirement in settings |
| Topic shortlist | Marketer |
| Attributed SME insights | Named SME |
| Brief | Marketer |
| Outline | Marketer |
| General sourced claims | Marketer |
| Technical, personal, or attributed claims | Named SME |
| Draft | Marketer |
| Images | Marketer |
| Final package | Marketer; founder additionally for founder/flagship content |
| Publishing | Marketer with WordPress permission |
| Healing patch | Marketer plus every owner of an invalidated gate |

An approval is bound to an immutable artifact version. Any change covered by the invalidation matrix creates a new version and reopens the listed downstream gates. Final and publishing approval always reopen after a change to the publishable package. Rollback creates a new version from an older one; history is never deleted.

### Stage states and safe editing

Every stage uses the same explicit substate model:

```text
NOT_STARTED → QUEUED/WORKING → READY_FOR_REVIEW → APPROVED
                              → CHANGES_REQUESTED → WORKING
QUEUED/WORKING → FAILED_RETRYABLE → QUEUED
```

Global overlays are `BLOCKED`, `PAUSED`, `CANCELLED`, and `REOPENED`. Topic `REJECTED` is terminal for that candidate; a gate-level `CHANGES_REQUESTED` returns the current artifact for revision.

Manual edits and agent jobs use optimistic version checks. A late agent result or approval cannot overwrite or approve a newer human version; it is stored as a stale branch that may be compared or discarded. When two approvers are required, both must approve the same artifact hash.

### Approval invalidation rules

| Changed artifact | Gates that reopen |
|---|---|
| Strategy or approved topic | Topic plus every downstream gate; SME may be reassigned |
| Attributed SME insight | SME attribution plus brief, outline, claims, draft, final, and publishing |
| Brief | Brief, outline, claims, draft, final, and publishing |
| Outline | Outline, claims, draft, final, and publishing |
| Article body or factual assertion | Claims, draft, final, and publishing |
| Links, CTA, SEO metadata, or schema | SEO/package review, final, and publishing |
| Image, caption, or alt text | Images, final, and publishing |
| WordPress-side draft change | Final and publishing after drift reconciliation |

Research-pack review is part of the brief gate. SEO, links, CTA, metadata, and schema are one package-review gate immediately before final approval.

## 7. Phase scope

### V0 – Prerequisites and golden-path spike

**Suggested time-box:** 3–5 working days for an integration spike, not a polished product.

- Create one Codewave workspace with editable strategy, content mix, source policy, brand guidance, and initial SME profiles.
- Build a sanitized, allowlisted pilot corpus from canonical `/insights/` pages and inventory the remainder for follow-up. Explicitly exclude `/feeds/blog/`; V0 does not promise to remediate the full historical site.
- Quarantine unrelated, duplicate, injected, or suspicious material before it can enter brand memory or internal-link recommendations.
- Connect one text-model API, one image API, WordPress REST, GA4, Google Search Console, and the active WordPress form mechanism.
- Assign a permanent `content_id` to every article and preserve it in WordPress metadata, analytics, controlled-distribution UTMs, and form submissions.
- Capture current content and analytics baselines.
- Prove one thin path: source pack → editable draft → WordPress draft → attributable test form submission.
- Run a short reuse spike against Claude Blog. Reuse prompts, templates, or scoring patterns only where licensing and integration are straightforward; do not make the product architecture dependent on its terminal workflow.

#### V0 exit criteria

- One clean Codewave workspace exists.
- A test document and URL can be ingested and retrieved.
- One editable article reaches WordPress without duplicate creation on retry.
- One image is generated, uploaded, and attached to the correct WordPress draft.
- GA4 and GSC each return one authenticated test dataset with visible timezone and last-sync metadata.
- The active SEO and form plugins complete one required test read/write or are explicitly documented as needing a fallback.
- One external search/crawl request completes through the selected provider.
- One test form submission is associated with the correct `content_id` without storing form PII in analytics.

### V1 – Must-have product

#### P0.1 Configurable strategy and on-demand topic intelligence

- Settings support offerings, ICPs, company stages, industries, geographies, competitors, editorial verticals, objectives, content classes, mix targets, sources, quality thresholds, and gate owners. Pilot provider credentials and spending limits are admin-only; stage-level provider selection is deferred.
- Strategy changes create a new version. In-flight articles keep their original snapshot unless a marketer explicitly migrates them.
- A marketer can enter a seed topic, upload a source pack, or submit a bounded set of URLs.
- On-demand research can use workspace knowledge, the approved `/insights/` corpus, GSC/GA4 signals, competitors, case studies, sales material, and authoritative web sources.
- Topic candidates include an explainable 0–100 opportunity score, suggested format, angle, audience, geography, offering, evidence, cannibalization risk, CTA, and recommended SME.
- Only a user with topic-approval permission can move a candidate into production. Marketers have it by default; a founder may be granted it without changing the workflow.

The fixed V1 opportunity rubric is strategic relevance 25, audience/ICP usefulness 15, available evidence and demand 15, differentiated angle 15, SME fit 10, search/content gap 10, and conversion/distribution potential 10, with up to a 20-point duplication or source-risk penalty. The UI shows confidence separately; missing inputs lower confidence rather than being silently treated as negative evidence. Score weights become fully configurable with the continuous V2 strategy engine.

**Acceptance criteria**

- Changing a workspace priority does not require a deployment.
- A candidate shows factor-level scoring and source evidence, not only a final number.
- The same topic cannot enter production twice without a visible overlap warning or human override reason.

#### P0.2 Parallel content calendar and durable workflow

- Calendar and board views show owner, SME, article class, vertical, objective, current stage, next approver, blocker, due date, and planned publish date.
- A blocked card shows the blocking stage, responsible person, due date, retry/reassign action, and whether any downstream work is safe to continue.
- Five article workflows can remain active concurrently without source, state, or output leakage; heavy model jobs may run through a smaller controlled worker pool.
- Background work is resumable, retryable, cancelable, idempotent, and visible to the user.
- A failed article never blocks unrelated work.
- SME capacity warnings use the configured 2–4 hours/month default but do not hard-block assignment.

**Acceptance criteria**

- Five active articles can progress independently and retain the correct strategy, sources, artifacts, and approvers while at least two heavy model jobs execute concurrently.
- Retrying a failed stage cannot duplicate its stored artifact or WordPress post.
- Changing a calendar item's planned date changes timing only; it cannot bypass an approval.

#### P0.3 Knowledge corpus, brand memory, and source governance

- Accept approved URLs, pasted text, PDF, DOCX, PPTX, Markdown, TXT, and transcripts. If a deck cannot be parsed faithfully, V1 requires a PDF export and clearly reports that limitation.
- Preserve canonical URL, author, date, content hash, crawl date, trust tier, citation permission, and source type.
- Ingest brand guidelines plus strong and weak writing exemplars, then synthesize an editable voice profile covering principles, desired patterns, prohibited patterns, terminology, tone boundaries, and examples. A marketer must approve the profile before it scores content.
- Maintain a claim/evidence ledger linking factual claims to sources and personal claims to approved SME input.
- Competitors may inform trend and gap analysis but are not automatically treated as factual authorities or copied.
- External competitor links are permitted only if the workspace policy allows them and they are genuinely the best supporting source.
- Prefer current primary sources, then authoritative secondary sources. Show authority tier, relevance, publication date, and why a source was chosen.
- All verbatim reuse must be quoted and cited. Detected unquoted overlap of 12 or more consecutive source words and high semantic similarity are flagged; confirmed unattributed verbatim reuse is a non-overridable blocker, while common phrases and proper names are not treated as plagiarism.
- Retrieved web content is treated as untrusted data and cannot alter system instructions.
- URL ingestion blocks private/internal network ranges, revalidates every redirect, restricts crawler egress, removes active HTML/scripts, and enforces fetch limits. File ingestion verifies MIME type, limits original and expanded size, rejects archives in V1, uses sandboxed parsers, and scans uploads before extraction.
- Update the canonical registry after every Blog Agent publication and periodically reconcile WordPress edits, redirects, deletions, canonical changes, and link health.

**Acceptance criteria**

- Every factual claim detected by the system or added by a reviewer is traceable or visibly unresolved before the claims gate.
- The claims gate can pass only when every detected or reviewer-added blocking claim is supported, removed, or explicitly converted to a clearly identified opinion. Approval is recorded per claim and against the resulting ledger version.
- No content from `/feeds/blog/` appears in brand memory or internal-link suggestions.
- Quarantined content cannot be retrieved for drafting until a human approves it.
- Brand review highlights the exact voice rule or exemplar behind each material deviation.

#### P0.4 SME matching and in-app briefing

- SME profiles include expertise, biography, preferred topics, capacity, attribution rules, and past contributions.
- The system recommends 1–3 SMEs using topic fit, evidence needs, availability, and prior work; a marketer confirms the assignment.
- Preliminary research runs before the interview. For an expert POV article, the default completion goal is at least one distinct position, one grounded example, one caveat or counterargument, and one actionable recommendation.
- The system prepares a bounded question set from preliminary research, then presents one question at a time with recommended options, rationale, and an open text response. V1 allows up to two targeted follow-ups rather than an open-ended autonomous interview.
- Controls include use recommendation, choose another option, add free text, skip, request another question, autosave, and resume later.
- Default briefing length is 5–8 questions or roughly 15–30 minutes. Skips are allowed, but the system shows which insight goals remain uncovered and may ask a bounded follow-up.
- Existing documents or transcripts can prefill candidate insights and reduce repetitive questions.
- Each extracted insight links to the exact source passage and carries an attribution status; uploading material is not consent to attribute it.
- The final insight packet classifies positions, anecdotes, examples, counterarguments, caveats, and potential quotations for SME confirmation.
- An incomplete assignment enters `WAITING_ON_SME` with owner and due date. A marketer can extend, accept a documented insight gap where the content policy permits it, or reassign the article.

**Acceptance criteria**

- Nothing is attributed to an SME until that person confirms, rewrites, or rejects it.
- A marketer cannot materially rewrite an approved attributed statement without reopening SME approval.
- The system never converts competitor commentary into a Codewave employee's personal experience.
- Upload/parse failures preserve the interview state, show a retry path, and never silently omit the affected source.

#### P0.5 Authoring, manual editing, and publish-readiness loop

- Generate an editable research pack, brief, outline, article, title options, excerpt, CTA, and WordPress/SEO metadata.
- All generated content is stored as normal editable content. Users can edit it without an additional API call.
- Keep one canonical structured article document in Blog Agent; derive preview HTML and a deterministic, documented subset of Gutenberg blocks from it. WordPress HTML is not the canonical source. V0 must round-trip the supported headings, paragraphs, lists, quotes, tables, images, captions, links, and CTA block without loss.
- Run a capped writer–critic–editor loop, defaulting to two passes and allowing a maximum of three before surfacing unresolved issues.
- Keep content, evidence, brand, SEO, and conversion criticism distinct so a single opaque score cannot hide a serious weakness.
- Every stage supports manual edits, scoped agent revisions, comments, change requests, approval identity, rejection reason, timestamps, version history, and rollback. Reviewable diffs cover structured brief/outline fields, claims, body text, links, SEO metadata, image choice/alt text, WordPress mappings, and healing patches—not only prose.

##### Publish-readiness score

| Dimension | Weight |
|---|---:|
| Evidence, factual integrity, and source fidelity | 20 |
| Original insight, specificity, and non-commodity value | 20 |
| ICP, geography, objective, and intent fit | 15 |
| Brand voice and readability | 15 |
| Argument structure and usefulness | 10 |
| Search optimization and internal linking | 10 |
| Expertise and trust signals | 5 |
| CTA and conversion alignment | 5 |

Default readiness target: **80/100**, with minimums of 16/20 for evidence, 14/20 for original insight, and 10/15 for brand voice. The score is advisory and cannot approve content. A below-threshold article may proceed only through an explicit marketer override with a recorded reason; founder/flagship pieces additionally require founder approval. Unsupported claims, invented experience or attribution, unapproved source reuse, missing required insight approval, or an incomplete mandatory gate are hard blockers regardless of score and cannot be overridden.

The pilot calibrates the rubric after the first ten completed articles by comparing scores with structural edit distance, rejection reasons, factual failures, and human quality decisions. Weight or threshold changes create a new scoring version and do not rewrite historical scores.

"Anti-AI" means removing generic filler, clichés, false certainty, repetitive structures, and unsupported synthesis while increasing specificity, grounded examples, real human insight, caveats, and natural editorial quality. AI-detector scores are not used as a release gate.

**Acceptance criteria**

- Manual edits persist without triggering a model call.
- A hard blocker prevents WordPress handoff even when the numeric score exceeds the threshold.
- The final review shows all component scores, unresolved issues, evidence, and the exact version being approved.

#### P0.6 SEO, cross-linking, CTA, and images

- Validate intent match, title, heading structure, slug, excerpt, meta description, canonical target, keyword overuse, readability, schema fields supported by WordPress, and cannibalization.
- Assess entity clarity, passage-level answerability, and source fidelity for AI answer surfaces without promising citations or rankings.
- Recommend 2–4 contextually relevant internal links from the approved `/insights/` registry and validate target health.
- Recommend 1–2 primary or reputable external sources when they materially support the reader. External-link count is not a quota.
- Readability and argument quality override keyword-density optimization.
- Generate one hero image and infer 0–2 inline images based on length, flagship importance, conceptual complexity, and whether a visual improves comprehension.
- Preserve image prompt/provider provenance and produce alt text, caption, placement, dimensions, and WordPress-ready metadata.
- Validate brand-style fit, aspect ratio, accessibility, rights/provenance policy, and configured restrictions on trademarks, logos, or identifiable people.

**Acceptance criteria**

- Every suggested link includes anchor text and a relevance rationale.
- Broken, quarantined, or excluded pages cannot be recommended.
- No generated image enters the final package without image approval.

#### P0.7 WordPress `/insights/` publishing

- Use the WordPress REST API for draft creation/update, media upload, featured image, author, excerpt, slug, categories, tags, scheduling, and publishing.
- Generate Gutenberg-compatible content for the Codewave configuration discovered in V0.
- Support the installed SEO plugin's exposed title, description, canonical, and schema fields. If V0 proves standard REST insufficient, evaluate a small Codewave bridge plugin or a documented manual fallback before expanding scope.
- Store `wordpress_post_id` and WordPress revision identifiers. Repeated sync updates the same post idempotently.
- Register `content_id` as searchable WordPress metadata, query it before every create, and guard creation with a local idempotency record/lock so a lost API response cannot cause a duplicate.
- Show a WordPress preview and preflight report before the distinct publishing gate.
- Immediately before every update, publish, or schedule, re-fetch `modified_gmt` and the WordPress content hash and compare them with the approved preview. WordPress-side drift blocks the operation until it is imported as a new Blog Agent version or deliberately discarded and re-synced, reopening final and publishing approval.
- Use explicit lifecycle states: `SYNCING`, `PREVIEW_READY`, `DRIFTED`, `PUBLISH_APPROVED`, `SCHEDULED`, `PUBLISHED`, and `PUBLISH_FAILED`. Polling or a webhook reconciles scheduled posts and retries safely.
- Browser/computer automation is a contingency for unsupported operations, not a committed primary path.

**Acceptance criteria**

- A retry cannot create a duplicate post.
- A post is never marked published until WordPress confirms the requested state.
- No publication occurs without an explicit human publishing approval.
- Publishing approval is valid only for the exact WordPress revision shown in the approved preview.

#### P0.8 Measurement and approval-based healing

- Record the exact published article version, canonical URL, strategy mapping, `content_id`, SME, and publication time.
- Import GSC impressions, clicks, CTR, position, queries, country, and device dimensions.
- Import GA4 landing-page `sessions`, `engagedSessions`, `userEngagementDuration`, configured CTA event counts, and lead key events using the GA4 property timezone.
- Normalize GSC page URLs to the canonical article registry and surface query-row limitations. Register `content_id` as a GA4 custom dimension/event parameter if it is required in reports; GSC remains URL-mapped.
- Capture WordPress form starts only when an explicit frontend event exists. Capture submissions through a signed webhook with replay protection and submission-id deduplication; validate `content_id` server-side rather than trusting a hidden field.
- Preserve consented first/last landing article and available UTM context in a first-party content-touch record. The pilot attribution window and cookie expiry default to 90 days only after privacy approval.
- Display URL inspection/index state where the Search Console API permits it; do not imply access to unavailable crawl statistics.
- Every dashboard shows source timezone, last successful sync, expected provider delay, permission failures, data completeness, and webhook deduplication state.
- Monitor technical health immediately and performance at configurable 7-, 30-, and 90-day checkpoints. Performance-driven healing defaults to an article age of at least 28 days and either 200 GSC impressions or 50 organic sessions across comparable windows; sparse data extends the comparison to 90 days or produces `INSUFFICIENT_DATA`.
- Detect explainable issues such as a ≥20% click/CTR decline across comparable windows, indexation fault, newly ranking query, stale source, broken link, weak CTA, or cannibalization. Seasonality and wider site movement are shown before a performance alert is actionable.
- The edit agent creates an isolated proposal with trigger, evidence, confidence, expected metric, affected sections, exact diff, impacted gates, and rollback version.
- A healing proposal cannot change a live page until the relevant humans approve the patch and republish it.
- Healing separates intent from implementation: `PROPOSED → APPROVED_FOR_EDIT | REJECTED | SNOOZED → PATCH_READY → IMPACTED_GATES → REPUBLISH_APPROVAL`.
- After republishing, annotate the intervention and evaluate it at the agreed comparison window as `IMPROVED`, `INCONCLUSIVE`, or `REGRESSED`. Rollback is a new reviewed version followed by WordPress verification, never a silent restore.

**Acceptance criteria**

- Organic attribution does not depend on UTMs; landing article and `content_id` are retained separately.
- V1 reports raw form leads and content-influenced submissions without claiming qualified pipeline or revenue attribution.
- Seeded or historical data can verify the complete healing workflow before launch; actual outcome validation occurs at 30/90 days after the first live intervention.
- ICP fit is an editorial mapping, not measured visitor identity. Firmographic or qualified-ICP outcomes are reported only when form fields, CRM enrichment, or another consented source supports them.

#### P0.9 Workspace isolation and auditability

- Every tenant-owned record, storage path, integration, retrieval query, background job, and model run is scoped by `workspace_id`.
- Row-level security is supplemented by mandatory workspace-scoped repository methods. Worker, webhook, and admin/service-role paths validate the job workspace against every referenced entity and prohibit unscoped queries; service credentials cannot rely on RLS alone.
- Support minimal login, invitation, role assignment, access revocation, and role-enforced actions. Admins manage strategy/integrations/users; marketers operate and publish; founders review assigned strategy/flagship gates; SMEs see only assigned briefings, source context needed for them, attribution review, and their outcomes.
- Workspace credentials are stored in a managed secrets vault/KMS, support rotation and revocation, and are never included in model prompts or application logs.
- Sources, embeddings, prompts, analytics, and learning never cross workspaces.
- Transcripts, case studies, SME profiles, source snapshots, and attribution records have workspace-defined consent, access, retention, deletion, and redaction controls. Form PII remains in the form/CRM system and is not copied into GA4 or the Blog Agent analytics store.
- Audit events record workspace, actor, role, action, entity, artifact/strategy version, source/model/prompt version where relevant, token/cost metadata, before/after references, and timestamp.

**Acceptance criteria**

- Automated tests cover web requests, workers, webhooks, and admin/service-role paths and prove that one workspace cannot retrieve another workspace's sources, artifacts, metrics, or credentials.
- Role tests prove that an SME cannot change strategy or publish, a founder cannot access unassigned private source packs without permission, and a revoked user loses access immediately.
- Every approval and publication can be traced to actor, artifact version, strategy version, and timestamp.

### V1.1 – High-value fast follows

- SME contribution dashboard and leaderboard. Article count is secondary; outcomes are normalized by article type, age, impressions, clicks, engagement, form leads, and later qualified pipeline.
- Richer inline review, assignments, reminders, notifications, and approval links.
- Better batch calendar operations and capacity planning.
- Stage-specific model routing, fallback providers, prompt/version experiments, and cost/latency controls.
- More proactive metadata, link, and refresh recommendations.
- CRM connector for qualified-lead and content-influenced pipeline reporting.
- Reusable workspace templates and import/export for client onboarding.
- A second WordPress configuration only after the Codewave `/insights/` path is stable.
- Rich bidirectional WordPress reconciliation that can import post-publication manual edits as structured Blog Agent versions.
- Automation-readiness score per content class and stage, based on edit distance, rejected gates, factual failures, score stability, and outcome history.

### V2 – Continuous strategy and opportunity brain

V2 continuously monitors approved RSS feeds, research publications, competitors, industry news, and other curated source lists. It deduplicates new items, maps them to the current workspace strategy and editorial verticals, identifies an original angle, checks existing coverage and cannibalization, recommends an SME, and creates an explainable opportunity.

#### Suggested opportunity score

| Factor | Weight |
|---|---:|
| Workspace relevance | 25 |
| Current strategic fit | 20 |
| ICP or audience usefulness | 15 |
| Novelty and content gap | 15 |
| Timeliness and momentum | 10 |
| Source authority and evidence | 10 |
| Available SME fit | 5 |
| Duplication, source, or reputation penalty | Up to –20 |

Weights and thresholds are workspace settings. A candidate above a configurable threshold may enter the **AI-suggested candidate inbox** automatically, but it does not become an active article until a marketer approves it.

The inbox applies source and angle deduplication, freshness decay, per-vertical daily/weekly caps, expiry, and remembered snooze/rejection reasons. A high score alone cannot flood the backlog or repeatedly revive a rejected angle without new evidence.

The strategy brain records accepted/rejected ideas, rejection reasons, human edit patterns, failed claims, SME participation, search performance, engagement, and lead outcomes. At Codewave's expected volume it initially **proposes** explainable weight changes rather than mutating them automatically. Automatic recalibration requires at least 30 relevant completed articles, a confidence check, and explicit admin approval. Every learned change remains workspace-specific, versioned, inspectable, reversible, and resettable.

V2 can introduce a policy-controlled automation ladder for repeatable, low-risk content. Opinion pieces always retain human topic selection, SME mapping, attributed-insight approval, and final publishing approval.

## 8. GUI information architecture

1. **Overview** – action inbox, blockers, upcoming publications, failed jobs, and portfolio outcomes.
2. **Strategy** – versioned priorities, offerings, ICPs, geographies, competitors, verticals, content mix, objectives, source and approval policy.
3. **Topics** – manual and AI candidates, scores, shortlist, rejection, and snooze reasons.
4. **Calendar** – calendar and pipeline views for concurrent articles and SME capacity.
5. **Article workspace** – stage rail, editable artifact/diff, sources, claims, scores, comments, approvals, and agent activity.
6. **SME briefing** – one-question-at-a-time interview, recommendations, free text, uploads, progress, and attribution review.
7. **Knowledge** – brand material, cases, sales decks, canonical `/insights/` index, approved sources, claims, and SME profiles.
8. **Performance & Healing** – article and portfolio analytics, index health, leads, alerts, proposals, experiments, and rollback.
9. **Settings** – users, roles, integrations, WordPress mappings, providers, spending limits, quality thresholds, and workspace policies.

### Article workspace layout

- **Left rail:** stages, status, owner, next approver, and blockers.
- **Center:** current artifact, rich editor, preview, or side-by-side diff.
- **Right rail:** sources, claim ledger, component scores, comments, approvals, and agent/model activity.

## 9. Recommended lean technical shape

Use a modular monolith rather than a microservice or open-ended autonomous-agent platform:

```text
Next.js + TypeScript web application
  ├─ GUI, editor, API routes, webhooks
  ├─ shared product/domain modules
          │
PostgreSQL + pgvector + Postgres-backed job queue
  ├─ product state, versions, approvals, jobs, audit
  ├─ tenant-scoped source chunks and embeddings
  ├─ daily analytics snapshots
          │
Node worker
  ├─ ingestion and research
  ├─ drafting and critic/editor stages
  ├─ image generation and link checks
  ├─ WordPress sync
  ├─ GA4/GSC/form synchronization

Object storage
  ├─ documents, transcripts, images, and exports
```

Engineering hypothesis to validate during V0: Next.js, TypeScript, TipTap, Supabase/PostgreSQL with row-level security and `pgvector`, Supabase Storage/Auth, and a Postgres-backed worker queue such as `pg-boss` or Graphile Worker. Deploy one web process and one worker process initially. The worker/queue uses a direct or session PostgreSQL connection rather than a transaction-mode pooler.

Start with one strong default provider per capability behind small interfaces for text, embeddings, images, search/crawl, WordPress, and analytics. Avoid Redis, Kafka, Temporal, Kubernetes, and separate agent services in V1.

## 10. Core data objects

`Workspace`, `Membership`, `IntegrationConnection`, `StrategyVersion`, `ContentVertical`, `SMEProfile`, `Source`, `Document`, `TopicCandidate`, `Article`, `ArticleDocument`, `UrlAlias`, `InterviewSession`, `Insight`, `ArtifactVersion`, `Claim`, `Approval`, `JobRun`, `Asset`, `LinkRecommendation`, `WordPressPublication`, `MetricSnapshot`, `ContentTouch`, `LeadEvent`, `HealingProposal`, and `AuditEvent`.

Every content record carries `workspace_id`; every article also carries a permanent `content_id` and immutable `strategy_version_id`.

## 11. Success metrics

### Leading indicators: product and workflow

| Metric | 90-day target |
|---|---:|
| Sustainable output | 4 published pieces/month |
| Active concurrent workflows | 5 |
| Approved topic + completed SME input to WordPress-ready draft | ≤7 business days |
| Drafts approved without structural rewrite | ≥60%, progressing toward ≥80% after 15–20 articles |
| Substantive human edit distance | Track baseline; target ≤25% by pilot end |
| Mandatory approvals completed | 100% |
| Factual/personal claim traceability | 100% |
| Confirmed invented-experience or quotation incidents | 0 |
| Duplicate WordPress posts caused by retry | 0 |

### Lagging indicators: content and business hypotheses

These are provisional Codewave pilot hypotheses, not universal industry benchmarks. They must be recalibrated after the 30-day baseline and first ten published articles.

- Capture a 30-day instrumented baseline before committing to growth targets.
- Target 15–25% growth in non-brand clicks across priority services and geographies over six months, using matched periods.
- Treat qualified visits, meaningful CTA actions, leads, and content influence as primary outcomes; raw traffic is diagnostic.
- Pilot a 0.5–1% direct form-lead rate across organic blog sessions and 1–2% for high-intent articles, then recalibrate from Codewave data.
- Measure first-touch, landing-article, and content-influenced form submissions separately.
- Reserve 20–30% of steady-state capacity for evidence-backed refreshes once sufficient content is being monitored.

Full qualified-lead, opportunity, and revenue measurement requires a CRM integration and is therefore V1.1 unless the WordPress form flow already carries those states.

### Benchmark notes

- A recent B2B benchmark found many teams producing roughly 10–20 blog posts per quarter, supporting a quality-first four-per-month pilot rather than a volume race: [Contentful Benchmarker Report 2026](https://www.contentful.com/resources/benchmarker-report-2026/).
- Google emphasizes original, people-first, expert content and warns against scaled generation that adds little value: [helpful content guidance](https://developers.google.com/search/docs/fundamentals/creating-helpful-content) and [generative-AI guidance](https://developers.google.com/search/docs/fundamentals/using-gen-ai-content).
- GA4 provides standard lead-lifecycle events, but Blog Agent must separate form submissions from later qualified pipeline until a CRM is connected: [GA4 recommended events](https://support.google.com/analytics/answer/9267735).
- Campaign parameters are case-sensitive and useful for controlled distribution; they do not replace landing-article attribution for organic discovery: [Google campaign URL guidance](https://support.google.com/analytics/answer/10917952).

## 12. Explicit V1 non-goals

- Continuous RSS monitoring or self-directed strategy.
- Fully autonomous topic approval or publishing.
- Replacing SMEs or inventing personal insight.
- Managing, learning from, linking to, or optimizing `/feeds/blog/`.
- A general-purpose technical SEO crawler or site-remediation suite.
- Ranking guarantees, keyword stuffing, or AI-detector evasion.
- Multiple CMS platforms.
- Social, email, paid-media, or outbound distribution automation.
- Full SaaS client onboarding, white-labelling, billing, and self-service administration.
- Qualified pipeline or revenue attribution without CRM data.
- A large autonomous-agent framework when explicit stages and direct APIs are sufficient.

## 13. V1 ship bar

V1 is ready when Codewave can:

1. Configure and version its current priorities without changing code.
2. Keep five article workflows active safely while at least two heavy model jobs execute concurrently.
3. Take an approved topic through SME input and every mandatory gate.
4. Produce an editable, sourced, differentiated, brand-aligned article with approved links and images.
5. Publish or schedule it idempotently to `/insights/` after explicit approval.
6. Observe search, engagement, index, CTA, and WordPress-form lead metrics associated with the correct article.
7. Demonstrate the full generate/approve/republish/measure/rollback healing workflow with seeded or historical data, then validate a live intervention at 30/90 days.
8. Demonstrate that no source, content, credential, embedding, or metric can leak between workspaces.

## 14. Open questions

### Blocking during V0

- **[Engineering/Marketing]** Which WordPress editor/theme, SEO plugin, form plugin, post type, author mapping, and category/tag conventions power `/insights/`?
- **[Security/Website owner]** Can the public casino/betting content currently visible on the [crawler-facing Insights page](https://codewave.com/insights/) be removed and the corpus reviewed before ingestion?
- **[Product/Engineering]** Which one text model, image model, embedding model, and search/crawl provider should be the pilot defaults, and what spending limit should apply?
- **[Marketing/Legal]** Which service, case-study, portfolio, brand, and sales-document sources may be ingested in addition to `/insights/`?
- **[Data/Engineering]** Which GA4 event currently represents a successful WordPress form submission, if any?
- **[Legal/Data/Product]** Is the proposed 90-day anonymous content-touch window acceptable, what consent mechanism applies, and what deletion/retention policy governs transcripts, source snapshots, SME data, and attribution records?

### Non-blocking defaults to validate during the pilot

- **[Product/Design]** Should SMEs use normal accounts or expiring direct briefing/approval links?
- **[Brand/Marketing]** What image style, dimensions, and licensed-asset rules should become the Codewave default?
- **[Marketing/Sales/Data]** Which CRM should receive a V1.1 connector for qualification, opportunity, and revenue outcomes?
- **[Product/Data]** What minimum sample and normalization formula should govern the SME outcomes leaderboard?

## 15. Suggested delivery sequence

| Time-box | Outcome |
|---|---|
| V0: 3–5 days | Connections, sanitized pilot corpus, golden-path article, WordPress draft, test form attribution |
| Weeks 1–2 | Strategy/settings, RBAC, knowledge ingestion, topics, calendar, SME profiles, briefing, versions and approvals |
| Weeks 3–4 | Brief/outline/draft, evidence ledger, critic/editor loop, manual editing, links, SEO package and images |
| Weeks 5–6 | WordPress preview/publishing safety, GA4/GSC/form dashboards, health rules, seeded healing and rollback pilot |
| Week 7 contingency | WordPress/plugin edge cases, security/isolation tests, pilot defects and launch hardening |
| V1.1 | Outcome leaderboard, notifications, CRM, richer review and provider/cost controls |
| V2 | Continuous RSS/source monitoring, opportunity brain, learning, and policy-controlled autonomy |

This is a **5–7 week pilot target for one or two focused builders**, with prompt/model access, timely WordPress/Google credentials, and quick stakeholder feedback. A solo build or unexpected WordPress-plugin work may extend it. Live content-outcome validation continues for 30/90 days after launch and is separate from functional ship acceptance.
