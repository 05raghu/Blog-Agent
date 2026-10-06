// Workspace-scoped article repository — mandatory for RLS enforcement
import { db } from '../client';
import { articles } from '../schema';
import { eq, and } from 'drizzle-orm';

export interface CreateArticleInput {
  id: string;
  workspaceId: string;
  contentId: string;
  topicId: string;
  strategyId: string;
  topicTitle?: string;
  contentClass?: 'expert_pov' | 'search_led' | 'commercial';
  assignedSME?: string;
  owner: string;
  status?: string;
  plannedPublishDate?: Date;
}

export interface UpdateArticleInput {
  topicTitle?: string;
  contentClass?: 'expert_pov' | 'search_led' | 'commercial';
  assignedSME?: string;
  owner?: string;
  status?: string;
  plannedPublishDate?: Date;
}

export class ArticleRepository {
  async create(input: CreateArticleInput) {
    const result = await db
      .insert(articles)
      .values({
        id: input.id as any,
        workspaceId: input.workspaceId,
        contentId: input.contentId,
        topicId: input.topicId,
        strategyId: input.strategyId,
        topicTitle: input.topicTitle,
        contentClass: input.contentClass || 'expert_pov',
        assignedSME: input.assignedSME,
        owner: input.owner,
        status: input.status || 'not_started',
        plannedPublishDate: input.plannedPublishDate,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return result[0];
  }

  async getById(workspaceId: string, articleId: string) {
    const result = await db
      .select()
      .from(articles)
      .where(and(
        eq(articles.id, articleId as any),
        eq(articles.workspaceId, workspaceId)
      ));

    return result[0];
  }

  async listByWorkspace(workspaceId: string) {
    return db
      .select()
      .from(articles)
      .where(eq(articles.workspaceId, workspaceId));
  }

  async listByStrategy(workspaceId: string, strategyId: string) {
    return db
      .select()
      .from(articles)
      .where(and(
        eq(articles.workspaceId, workspaceId),
        eq(articles.strategyId, strategyId)
      ));
  }

  async update(workspaceId: string, articleId: string, input: UpdateArticleInput) {
    const result = await db
      .update(articles)
      .set({
        ...input,
        updatedAt: new Date(),
      })
      .where(and(
        eq(articles.id, articleId as any),
        eq(articles.workspaceId, workspaceId)
      ))
      .returning();

    return result[0];
  }

  async delete(workspaceId: string, articleId: string) {
    await db
      .delete(articles)
      .where(and(
        eq(articles.id, articleId as any),
        eq(articles.workspaceId, workspaceId)
      ));
  }
}

export const articleRepository = new ArticleRepository();
