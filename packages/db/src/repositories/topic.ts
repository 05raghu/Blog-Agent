// Workspace-scoped topic repository — mandatory for RLS enforcement
import { db } from '../client';
import { topicCandidates } from '../schema';
import { eq, and } from 'drizzle-orm';

export interface CreateTopicInput {
  id: string;
  workspaceId: string;
  strategyId: string;
  title: string;
  summary?: string;
  angle?: string;
  format?: 'blog' | 'guide' | 'case_study' | 'whitepaper';
  geography?: string;
  audience?: string;
  targetOffering?: string;
  score?: number;
  confidence?: number;
  breakdown?: Record<string, any>;
  cannibalizationRisk?: Record<string, any>;
  recommendedSmes?: any[];
  missingInputs?: string[];
}

export interface UpdateTopicInput {
  title?: string;
  summary?: string;
  angle?: string;
  format?: 'blog' | 'guide' | 'case_study' | 'whitepaper';
  geography?: string;
  audience?: string;
  targetOffering?: string;
  score?: number;
  confidence?: number;
  breakdown?: Record<string, any>;
  cannibalizationRisk?: Record<string, any>;
  recommendedSmes?: any[];
  missingInputs?: string[];
}

export class TopicRepository {
  async create(input: CreateTopicInput) {
    const result = await db
      .insert(topicCandidates)
      .values({
        id: input.id,
        workspaceId: input.workspaceId,
        strategyId: input.strategyId,
        title: input.title,
        summary: input.summary,
        angle: input.angle,
        format: input.format || 'blog',
        geography: input.geography,
        audience: input.audience,
        targetOffering: input.targetOffering,
        score: input.score || 0,
        confidence: input.confidence || 0,
        breakdown: input.breakdown || {
          strategicRelevance: { score: 50, evidence: '' },
          audienceIcpUsefulness: { score: 50, evidence: '' },
          availableEvidenceAndDemand: { score: 50, evidence: '' },
          differentiatedAngle: { score: 50, evidence: '' },
          smeFit: { score: 50, evidence: '' },
          searchContentGap: { score: 50, evidence: '' },
          conversionDistributionPotential: { score: 50, evidence: '' },
        },
        cannibalizationRisk: input.cannibalizationRisk || { exists: false },
        recommendedSmes: input.recommendedSmes || [],
        missingInputs: input.missingInputs || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async getById(workspaceId: string, topicId: string) {
    const result = await db
      .select()
      .from(topicCandidates)
      .where(and(
        eq(topicCandidates.id, topicId),
        eq(topicCandidates.workspaceId, workspaceId)
      ));

    return result[0];
  }

  async listByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(topicCandidates)
      .where(eq(topicCandidates.workspaceId, workspaceId));
  }

  async listByStrategy(workspaceId: string, strategyId: string) {
    return db
      .select()
      .from(topicCandidates)
      .where(and(
        eq(topicCandidates.workspaceId, workspaceId),
        eq(topicCandidates.strategyId, strategyId)
      ));
  }

  async update(workspaceId: string, topicId: string, input: UpdateTopicInput) {
    const result = await db
      .update(topicCandidates)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(
        eq(topicCandidates.id, topicId),
        eq(topicCandidates.workspaceId, workspaceId)
      ))
      .returning();

    return result[0];
  }

  async delete(workspaceId: string, topicId: string) {
    await db
      .delete(topicCandidates)
      .where(and(
        eq(topicCandidates.id, topicId),
        eq(topicCandidates.workspaceId, workspaceId)
      ));
  }
}

export const topicRepository = new TopicRepository();
