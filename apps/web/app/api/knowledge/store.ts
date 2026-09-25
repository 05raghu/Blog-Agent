// In-memory store for sources and documents (MVP - demo mode)
// In production, this would use Drizzle + Postgres

declare global {
  var _sourceStore: Map<string, Source> | undefined;
  var _documentChunkStore: Map<string, DocumentChunk[]> | undefined;
  var _claimStore: Map<string, Claim> | undefined;
  var _sourceClaimStore: Map<string, Claim> | undefined;
}

export interface Source {
  id: string;
  workspaceId: string;
  type: 'url' | 'document' | 'transcript' | 'case_study';
  canonicalUrl?: string;
  title: string;
  author?: string;
  trustTier: 'approved' | 'unreviewed' | 'quarantined';
  citationPermission: boolean;
  description?: string;
  transcriptText?: string;
  // Fetched content (from URL crawling)
  fetchedContent?: string; // Main body text extracted from URL
  fetchedHeadings?: string[]; // Headings extracted from URL
  contentFetchedAt?: Date; // When content was last fetched
  contentFetchError?: string; // Error message if fetch failed
  // Classification fields
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  agentSensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  classificationConfidence?: number;
  classificationReasoning?: string;
  classificationSource?: 'agent' | 'manual';
  classifiedAt?: Date;
  // Brand alignment fields
  brandAlignmentScore?: number;
  brandAlignmentLevel?: 'excellent' | 'good' | 'fair' | 'poor';
  brandMatchedRules?: string[];
  brandViolatedRules?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentChunk {
  id: string;
  sourceId: string;
  text: string;
  chunkIndex: number;
  metadata: Record<string, any>;
}

export interface Claim {
  id: string;
  articleId: string;
  sourceId: string;
  text: string;
  type: 'factual' | 'attributed' | 'opinion';
  status: 'unverified' | 'verified' | 'questioned' | 'disputed';
  flaggedForReview: boolean;
  createdAt: Date;
}

// Sources store
const sourceStore = global._sourceStore || new Map<string, Source>();
global._sourceStore = sourceStore;

// Document chunks store
const documentChunkStore = global._documentChunkStore || new Map<string, DocumentChunk[]>();
global._documentChunkStore = documentChunkStore;

// Claims store
const claimStore = global._claimStore || new Map<string, Claim>();
global._claimStore = claimStore;

// Source claims store (to quickly find claims for a source)
const sourceClaimStore = global._sourceClaimStore || new Map<string, Claim>();
global._sourceClaimStore = sourceClaimStore;

export { sourceStore, documentChunkStore, claimStore, sourceClaimStore };
