// Workspace-scoped SME profile repository — mandatory for RLS enforcement
import { db } from '../client';
import { smeProfiles } from '../schema';
import { eq, and } from 'drizzle-orm';

export interface CreateSMEInput {
  id: string;
  workspaceId: string;
  userId: string;
  name: string;
  email?: string;
  expertise?: string[];
  biography?: string;
  preferredTopics?: string[];
  capacityHoursPerMonth?: number;
  attributionRules?: Record<string, any>;
  pastContributions?: string[];
}

export interface UpdateSMEInput {
  name?: string;
  email?: string;
  expertise?: string[];
  biography?: string;
  preferredTopics?: string[];
  capacityHoursPerMonth?: number;
  attributionRules?: Record<string, any>;
  pastContributions?: string[];
}

export class SMERepository {
  async create(input: CreateSMEInput) {
    const result = await db
      .insert(smeProfiles)
      .values({
        id: input.id as any,
        workspaceId: input.workspaceId as any,
        userId: input.userId,
        name: input.name,
        email: input.email,
        expertise: input.expertise || [],
        biography: input.biography,
        preferredTopics: input.preferredTopics || [],
        capacityHoursPerMonth: input.capacityHoursPerMonth || 3,
        attributionRules: input.attributionRules || {},
        pastContributions: input.pastContributions || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async getById(workspaceId: string, smeId: string) {
    const result = await db
      .select()
      .from(smeProfiles)
      .where(and(
        eq(smeProfiles.id, smeId as any),
        eq(smeProfiles.workspaceId, workspaceId as any)
      ));

    return result[0];
  }

  async listByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(smeProfiles)
      .where(eq(smeProfiles.workspaceId, workspaceId as any));
  }

  async update(workspaceId: string, smeId: string, input: UpdateSMEInput) {
    const result = await db
      .update(smeProfiles)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(
        eq(smeProfiles.id, smeId as any),
        eq(smeProfiles.workspaceId, workspaceId as any)
      ))
      .returning();

    return result[0];
  }

  async delete(workspaceId: string, smeId: string) {
    await db
      .delete(smeProfiles)
      .where(and(
        eq(smeProfiles.id, smeId as any),
        eq(smeProfiles.workspaceId, workspaceId as any)
      ));
  }
}

export const smeRepository = new SMERepository();
