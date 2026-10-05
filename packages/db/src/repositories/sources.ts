// Workspace-scoped source repository — mandatory for RLS enforcement
import { db } from '../client';
import { sources } from '../schema';
import { eq, and } from 'drizzle-orm';

export interface CreateSourceInput {
  workspaceId: string;
  type: 'url' | 'document' | 'transcript' | 'case_study';
  title: string;
  description?: string;
  canonicalUrl?: string;
  author?: string;
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  citationPermission?: boolean;
  transcriptText?: string;
  fetchedContent?: string;
  fetchedHeadings?: string[];
  contentFetchedAt?: Date;
  contentFetchError?: string;
  contentHash: string;
  trustTier?: 'approved' | 'unreviewed' | 'quarantined';
}

export interface UpdateSourceInput {
  sensitivityLevel?: 'public' | 'internal' | 'confidential' | 'restricted';
  citationPermission?: boolean;
  trustTier?: 'approved' | 'unreviewed' | 'quarantined';
  description?: string;
  title?: string;
  author?: string;
  fetchedContent?: string;
  fetchedHeadings?: string[];
  contentFetchedAt?: Date;
  contentFetchError?: string;
  brandAlignmentScore?: number;
  brandAlignmentLevel?: 'excellent' | 'good' | 'fair' | 'poor';
  brandMatchedRules?: string[];
  brandViolatedRules?: string[];
  metadata?: Record<string, any>;
}

export class SourceRepository {
  async create(input: CreateSourceInput) {
    const result = await db
      .insert(sources)
      .values({
        workspaceId: input.workspaceId,
        type: input.type,
        title: input.title,
        description: input.description,
        canonicalUrl: input.canonicalUrl,
        author: input.author,
        sensitivityLevel: input.sensitivityLevel || 'public',
        citationPermission: input.citationPermission ?? false,
        transcriptText: input.transcriptText,
        fetchedContent: input.fetchedContent,
        fetchedHeadings: input.fetchedHeadings || [],
        contentFetchedAt: input.contentFetchedAt,
        contentFetchError: input.contentFetchError,
        contentHash: input.contentHash,
        trustTier: input.trustTier || 'unreviewed',
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async getById(workspaceId: string, sourceId: string) {
    const result = await db
      .select()
      .from(sources)
      .where(and(
        eq(sources.id, sourceId),
        eq(sources.workspaceId, workspaceId)
      ));

    return result[0];
  }

  async listByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(sources)
      .where(eq(sources.workspaceId, workspaceId));
  }

  async update(workspaceId: string, sourceId: string, input: UpdateSourceInput) {
    const result = await db
      .update(sources)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(
        eq(sources.id, sourceId),
        eq(sources.workspaceId, workspaceId)
      ))
      .returning();

    return result[0];
  }

  async delete(workspaceId: string, sourceId: string) {
    await db
      .delete(sources)
      .where(and(
        eq(sources.id, sourceId),
        eq(sources.workspaceId, workspaceId)
      ));
  }
}

export const sourceRepository = new SourceRepository();
