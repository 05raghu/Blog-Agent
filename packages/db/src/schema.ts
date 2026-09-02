import {
  pgTable,
  text,
  uuid,
  timestamp,
  jsonb,
  integer,
  boolean,
  decimal,
  varchar,
  index,
  primaryKey,
  foreignKey,
  check,
} from 'drizzle-orm/pg-core';
import { pgvector } from 'pgvector/drizzle-orm';

// ============================================================================
// TENANT & AUTH
// ============================================================================

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  config: jsonb('config').notNull().default({}), // strategy, settings, etc.
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const memberships = pgTable('memberships', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // Supabase auth.users.id
  role: varchar('role', { length: 16 }).notNull(), // admin, marketer, founder, sme
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// STRATEGY & CONFIGURATION
// ============================================================================

export const strategyVersions = pgTable('strategy_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  version: integer('version').notNull(), // 1, 2, 3, ...
  offerings: jsonb('offerings').notNull().default([]), // Product/service list
  icps: jsonb('icps').notNull().default([]), // Ideal customer profiles
  geographies: jsonb('geographies').notNull().default([]),
  competitors: jsonb('competitors').notNull().default([]),
  editorialVerticals: jsonb('editorial_verticals').notNull().default([]),
  contentMix: jsonb('content_mix').notNull().default({}), // { "expertPOV": 40, "searchLed": 40, "commercial": 20 }
  qualityThresholds: jsonb('quality_thresholds').notNull().default({}), // publish-readiness score thresholds
  sourcePolicy: jsonb('source_policy').notNull().default({}), // allowed sources, quarantine rules
  approvalPolicy: jsonb('approval_policy').notNull().default({}), // gate owners per role
  smePolicies: jsonb('sme_policies').notNull().default({}), // SME approval rules per content class
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const contentVerticals = pgTable('content_verticals', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  strategyVersionId: uuid('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  objectives: jsonb('objectives').notNull().default([]),
});

export const smeProfiles = pgTable('sme_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull(), // Supabase auth.users.id
  expertise: jsonb('expertise').notNull().default([]), // Topic tags
  biography: text('biography'),
  preferredTopics: jsonb('preferred_topics').notNull().default([]),
  capacityHoursPerMonth: integer('capacity_hours_per_month').default(3),
  attributionRules: jsonb('attribution_rules').notNull().default({}),
  pastContributions: jsonb('past_contributions').notNull().default([]),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// SOURCES & DOCUMENTS
// ============================================================================

export const sources = pgTable('sources', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(), // url, document, transcript, case_study
  canonicalUrl: text('canonical_url'),
  author: text('author'),
  publishedDate: timestamp('published_date'),
  contentHash: text('content_hash').notNull(), // SHA256 for deduplication
  trustTier: varchar('trust_tier', { length: 16 }).default('unreviewed'), // approved, unreviewed, quarantined
  citationPermission: boolean('citation_permission').default(false),
  crawlDate: timestamp('crawl_date'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documents = pgTable('documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'cascade' }),
  title: text('title'),
  contentPath: text('content_path').notNull(), // Path in Supabase Storage
  mimeType: text('mime_type'),
  sizeBytes: integer('size_bytes'),
  extractedText: text('extracted_text'), // Full text for searching
  status: varchar('status', { length: 16 }).default('pending'), // pending, extracted, quarantined
  quarantineReason: text('quarantine_reason'),
  uploadedBy: text('uploaded_by'), // Supabase user_id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const documentChunks = pgTable('document_chunks', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  documentId: uuid('document_id')
    .notNull()
    .references(() => documents.id, { onDelete: 'cascade' }),
  chunkIndex: integer('chunk_index').notNull(),
  text: text('text').notNull(),
  embedding: pgvector('embedding', { dimensions: 1536 }),
  metadata: jsonb('metadata').notNull().default({}),
});

// ============================================================================
// TOPICS & ARTICLES
// ============================================================================

export const topicCandidates = pgTable('topic_candidates', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  strategyVersionId: uuid('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  description: text('description'),
  angle: text('angle'),
  format: varchar('format', { length: 32 }), // blog, guide, case_study, whitepaper
  audience: jsonb('audience').notNull().default([]),
  targetVertical: uuid('target_vertical')
    .references(() => contentVerticals.id, { onDelete: 'set null' }),
  targetOffering: text('target_offering'),
  targetGeography: text('target_geography'),
  evidence: jsonb('evidence').notNull().default([]),
  cannibalizationRisk: text('cannibalization_risk'),
  recommendedSME: uuid('recommended_sme').references(() => smeProfiles.id, { onDelete: 'set null' }),
  scores: jsonb('scores').notNull().default({}), // { "relevance": 25, "audience": 15, ... }
  totalScore: decimal('total_score', { precision: 5, scale: 2 }).default('0'),
  scoreConfidence: decimal('score_confidence', { precision: 3, scale: 2 }).default('0.5'),
  status: varchar('status', { length: 32 }).default('candidate'), // candidate, shortlisted, approved, rejected, active
  rejectionReason: text('rejection_reason'),
  snoozedUntil: timestamp('snoozed_until'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const articles = pgTable('articles', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  contentId: text('content_id').notNull(), // Permanent identifier
  topicCandidateId: uuid('topic_candidate_id')
    .notNull()
    .references(() => topicCandidates.id, { onDelete: 'cascade' }),
  strategyVersionId: uuid('strategy_version_id')
    .notNull()
    .references(() => strategyVersions.id, { onDelete: 'cascade' }),
  verticalId: uuid('vertical_id')
    .notNull()
    .references(() => contentVerticals.id),
  contentClass: varchar('content_class', { length: 32 }).notNull(), // expert_pov, search_led, commercial
  assignedSME: uuid('assigned_sme').references(() => smeProfiles.id, { onDelete: 'set null' }),
  owner: text('owner').notNull(), // Supabase user_id (marketer)
  status: varchar('status', { length: 32 }).default('not_started'), // see stage state machine
  plannedPublishDate: timestamp('planned_publish_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const articleDocuments = pgTable('article_documents', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  stageType: varchar('stage_type', { length: 32 }).notNull(), // research_pack, brief, outline, draft, final
  version: integer('version').notNull(),
  canonicalContent: text('canonical_content').notNull(), // JSON of structured article
  htmlPreview: text('html_preview'),
  wordCount: integer('word_count'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const urlAliases = pgTable('url_aliases', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  canonicalUrl: text('canonical_url').notNull().unique(),
  redirects: jsonb('redirects').notNull().default([]), // List of old URLs
  status: varchar('status', { length: 16 }).default('active'),
});

// ============================================================================
// SME BRIEFING
// ============================================================================

export const interviewSessions = pgTable('interview_sessions', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  smeId: uuid('sme_id')
    .notNull()
    .references(() => smeProfiles.id, { onDelete: 'cascade' }),
  status: varchar('status', { length: 32 }).default('not_started'), // not_started, in_progress, completed, waiting_on_sme
  questionnaire: jsonb('questionnaire').notNull().default([]), // Array of questions
  currentQuestionIndex: integer('current_question_index').default(0),
  responses: jsonb('responses').notNull().default({}), // { questionId: answer }
  uploadedDocuments: jsonb('uploaded_documents').notNull().default([]),
  completedAt: timestamp('completed_at'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const insights = pgTable('insights', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  interviewSessionId: uuid('interview_session_id')
    .references(() => interviewSessions.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(), // position, anecdote, example, counterargument, caveat, quotation
  text: text('text').notNull(),
  sourcePassage: text('source_passage'), // Direct quote or reference
  attributionStatus: varchar('attribution_status', { length: 16 }).default('unconfirmed'), // unconfirmed, confirmed, rejected
  confirmedAt: timestamp('confirmed_at'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// VERSIONING & APPROVALS
// ============================================================================

export const artifactVersions = pgTable('artifact_versions', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  stageType: varchar('stage_type', { length: 32 }).notNull(), // brief, outline, draft, final, etc.
  version: integer('version').notNull(),
  content: text('content').notNull(), // JSON
  contentHash: text('content_hash').notNull(), // SHA256
  createdBy: text('created_by').notNull(), // Supabase user_id
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const approvals = pgTable('approvals', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  gate: varchar('gate', { length: 64 }).notNull(), // strategy, topic, brief, outline, claims, draft, images, final, publishing
  requiredRole: varchar('required_role', { length: 16 }).notNull(), // marketer, founder, sme
  assignedTo: text('assigned_to').notNull(), // Supabase user_id
  artifactVersionId: uuid('artifact_version_id')
    .references(() => artifactVersions.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 32 }).default('pending'), // pending, approved, rejected, changes_requested
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  rejectionReason: text('rejection_reason'),
  changesRequested: text('changes_requested'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// CLAIMS & EVIDENCE
// ============================================================================

export const claims = pgTable('claims', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' }),
  text: text('text').notNull(),
  type: varchar('type', { length: 32 }).notNull(), // factual, attributed, opinion
  claimantSME: uuid('claimant_sme').references(() => smeProfiles.id, { onDelete: 'set null' }),
  sourceId: uuid('source_id').references(() => sources.id, { onDelete: 'set null' }),
  status: varchar('status', { length: 32 }).default('unverified'), // unverified, verified, questioned, disputed
  verificationNotes: text('verification_notes'),
  flaggedForReview: boolean('flagged_for_review').default(false),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// IMAGES & ASSETS
// ============================================================================

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' }),
  type: varchar('type', { length: 32 }).notNull(), // hero_image, inline_image
  storagePath: text('storage_path').notNull(),
  imagePrompt: text('image_prompt'),
  provider: varchar('provider', { length: 32 }), // anthropic, openai, stability, placeholder
  altText: text('alt_text'),
  caption: text('caption'),
  placement: varchar('placement', { length: 32 }), // hero, inline, social
  approved: boolean('approved').default(false),
  approvedAt: timestamp('approved_at'),
  approvedBy: text('approved_by'),
  metadata: jsonb('metadata').notNull().default({}),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// LINKS & SEO
// ============================================================================

export const linkRecommendations = pgTable('link_recommendations', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  targetArticleId: uuid('target_article_id').references(() => articles.id, { onDelete: 'cascade' }),
  targetUrl: text('target_url'),
  anchorText: text('anchor_text').notNull(),
  relevanceReason: text('relevance_reason'),
  isExternal: boolean('is_external').default(false),
  approved: boolean('approved').default(false),
  position: integer('position'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// WORDPRESS PUBLICATION
// ============================================================================

export const wordPressPublications = pgTable('word_press_publications', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  postId: integer('post_id'),
  postUrl: text('post_url'),
  status: varchar('status', { length: 32 }).notNull(), // syncing, preview_ready, drifted, publish_approved, scheduled, published, failed
  publishedAt: timestamp('published_at'),
  wordPressContentHash: text('word_press_content_hash'),
  driftReason: text('drift_reason'),
  driftedAt: timestamp('drifted_at'),
  lastSyncedAt: timestamp('last_synced_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// ANALYTICS & MEASUREMENT
// ============================================================================

export const metricSnapshots = pgTable('metric_snapshots', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 16 }).notNull(), // gsc, ga4, forms
  date: timestamp('date').notNull(),
  data: jsonb('data').notNull(), // Provider-specific metrics
  syncedAt: timestamp('synced_at').notNull().defaultNow(),
});

export const contentTouches = pgTable('content_touches', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' }),
  sessionId: text('session_id'), // First-party session identifier
  firstTouchArticle: uuid('first_touch_article').references(() => articles.id),
  lastTouchArticle: uuid('last_touch_article').references(() => articles.id),
  utmSource: text('utm_source'),
  utmMedium: text('utm_medium'),
  utmCampaign: text('utm_campaign'),
  expiresAt: timestamp('expires_at'), // 90 day default
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const leadEvents = pgTable('lead_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  articleId: uuid('article_id')
    .references(() => articles.id, { onDelete: 'cascade' }),
  eventType: varchar('event_type', { length: 32 }).notNull(), // form_start, form_submit, etc.
  formId: text('form_id'),
  submissionId: text('submission_id').unique(), // For deduplication
  sourceUrl: text('source_url'),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  metadata: jsonb('metadata').notNull().default({}), // Form field values (non-PII)
});

// ============================================================================
// HEALING & ITERATIONS
// ============================================================================

export const healingProposals = pgTable('healing_proposals', {
  id: uuid('id').primaryKey().defaultRandom(),
  articleId: uuid('article_id')
    .notNull()
    .references(() => articles.id, { onDelete: 'cascade' }),
  trigger: varchar('trigger', { length: 64 }).notNull(), // metric_decline, stale_source, broken_link, weak_cta
  evidence: jsonb('evidence').notNull().default({}),
  confidence: decimal('confidence', { precision: 3, scale: 2 }),
  proposedMetric: text('proposed_metric'),
  affectedSections: jsonb('affected_sections').notNull().default([]),
  proposedDiff: text('proposed_diff'),
  impactedGates: jsonb('impacted_gates').notNull().default([]),
  rollbackVersion: uuid('rollback_version').references(() => artifactVersions.id),
  status: varchar('status', { length: 32 }).default('proposed'), // proposed, approved_for_edit, rejected, snoozed, patch_ready
  approvedBy: text('approved_by'),
  approvedAt: timestamp('approved_at'),
  republishedAt: timestamp('republished_at'),
  outcome: varchar('outcome', { length: 32 }), // improved, inconclusive, regressed
  outcomeEvaluatedAt: timestamp('outcome_evaluated_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// JOBS & AUDIT
// ============================================================================

export const jobRuns = pgTable('job_runs', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  jobType: varchar('job_type', { length: 64 }).notNull(),
  targetId: uuid('target_id'),
  status: varchar('status', { length: 32 }).notNull(), // queued, running, succeeded, failed, retried
  retryCount: integer('retry_count').default(0),
  error: text('error'),
  metadata: jsonb('metadata').notNull().default({}),
  startedAt: timestamp('started_at'),
  completedAt: timestamp('completed_at'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

export const auditEvents = pgTable('audit_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  actor: text('actor').notNull(), // Supabase user_id or service name
  actorRole: varchar('actor_role', { length: 16 }),
  action: varchar('action', { length: 64 }).notNull(), // create, update, delete, approve, publish
  entityType: varchar('entity_type', { length: 64 }).notNull(), // articles, approvals, etc.
  entityId: uuid('entity_id'),
  artifactVersion: uuid('artifact_version').references(() => artifactVersions.id),
  strategyVersion: uuid('strategy_version').references(() => strategyVersions.id),
  beforeValue: jsonb('before_value'),
  afterValue: jsonb('after_value'),
  metadata: jsonb('metadata').notNull().default({}),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
});

// ============================================================================
// INTEGRATION CONNECTIONS
// ============================================================================

export const integrationConnections = pgTable('integration_connections', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  provider: varchar('provider', { length: 64 }).notNull(), // wordpress, ga4, gsc, anthropic, etc.
  config: jsonb('config').notNull().default({}), // Encrypted credentials, endpoint, etc.
  status: varchar('status', { length: 16 }).default('pending'), // pending, active, failed, revoked
  lastTestedAt: timestamp('last_tested_at'),
  testError: text('test_error'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ============================================================================
// INDEXES
// ============================================================================

export const indexes = [
  // Workspace isolation
  index('idx_memberships_workspace_user').on(memberships.workspaceId, memberships.userId),
  index('idx_articles_workspace').on(articles.workspaceId),
  index('idx_topics_workspace').on(topicCandidates.workspaceId),
  index('idx_claims_workspace').on(claims.workspaceId),
  index('idx_audit_workspace').on(auditEvents.workspaceId),

  // Foreign key lookups
  index('idx_articles_topic').on(articles.topicCandidateId),
  index('idx_approvals_article').on(approvals.articleId),
  index('idx_artifacts_article').on(artifactVersions.articleId),
  index('idx_interview_sme').on(interviewSessions.smeId),

  // Search
  index('idx_topic_candidates_status').on(topicCandidates.status),
  index('idx_articles_status').on(articles.status),
  index('idx_approval_status').on(approvals.status),

  // Timestamps
  index('idx_articles_created').on(articles.createdAt),
  index('idx_approvals_created').on(approvals.createdAt),
];
