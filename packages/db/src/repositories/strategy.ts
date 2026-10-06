// Workspace-scoped strategy repository — mandatory for RLS enforcement
import { db } from '../client';
import { strategyVersions } from '../schema';
import { eq, and } from 'drizzle-orm';

export interface CreateStrategyInput {
  id: string;
  workspaceId: string;
  version: number;
  offerings?: any[];
  icps?: any[];
  geographies?: any[];
  competitors?: any[];
  editorialVerticals?: any[];
  contentMix?: Record<string, any>;
  qualityThresholds?: Record<string, any>;
  sourcePolicy?: Record<string, any>;
  approvalPolicy?: Record<string, any>;
  smePolicies?: Record<string, any>;
}

export interface UpdateStrategyInput {
  offerings?: any[];
  icps?: any[];
  geographies?: any[];
  competitors?: any[];
  editorialVerticals?: any[];
  contentMix?: Record<string, any>;
  qualityThresholds?: Record<string, any>;
  sourcePolicy?: Record<string, any>;
  approvalPolicy?: Record<string, any>;
  smePolicies?: Record<string, any>;
}

export class StrategyRepository {
  async create(input: CreateStrategyInput) {
    const result = await db
      .insert(strategyVersions)
      .values({
        id: input.id as any,
        workspaceId: input.workspaceId as any,
        version: input.version,
        offerings: input.offerings || [],
        icps: input.icps || [],
        geographies: input.geographies || [],
        competitors: input.competitors || [],
        editorialVerticals: input.editorialVerticals || [],
        contentMix: input.contentMix || {},
        qualityThresholds: input.qualityThresholds || {},
        sourcePolicy: input.sourcePolicy || {},
        approvalPolicy: input.approvalPolicy || {},
        smePolicies: input.smePolicies || {},
        createdAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async getById(workspaceId: string, strategyId: string) {
    const result = await db
      .select()
      .from(strategyVersions)
      .where(and(
        eq(strategyVersions.id, strategyId as any),
        eq(strategyVersions.workspaceId, workspaceId as any)
      ));

    return result[0];
  }

  async listByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(strategyVersions)
      .where(eq(strategyVersions.workspaceId, workspaceId as any));
  }

  async update(workspaceId: string, strategyId: string, input: UpdateStrategyInput) {
    const result = await db
      .update(strategyVersions)
      .set(input)
      .where(and(
        eq(strategyVersions.id, strategyId as any),
        eq(strategyVersions.workspaceId, workspaceId as any)
      ))
      .returning();

    return result[0];
  }

  async delete(workspaceId: string, strategyId: string) {
    await db
      .delete(strategyVersions)
      .where(and(
        eq(strategyVersions.id, strategyId as any),
        eq(strategyVersions.workspaceId, workspaceId as any)
      ));
  }
}

export const strategyRepository = new StrategyRepository();
