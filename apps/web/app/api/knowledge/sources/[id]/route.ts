// API route: PATCH /api/knowledge/sources/[id] — Update source

import { NextRequest, NextResponse } from 'next/server';
import { sourceStore, type Source } from '../../store';
import { articleStore } from '../../../articles/store';

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const {
      trustTier,
      citationPermission,
      sensitivityLevel,
      classificationConfidence,
      classificationReasoning,
      agentSensitivityLevel,
      classificationSource,
      brandAlignmentScore,
      brandAlignmentLevel,
      brandMatchedRules,
      brandViolatedRules,
      fetchedContent,
      fetchedHeadings,
      contentFetchError,
    } = body;

    const source = sourceStore.get(id);
    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    if (trustTier && ['approved', 'unreviewed', 'quarantined'].includes(trustTier)) {
      source.trustTier = trustTier as Source['trustTier'];
    }

    if (citationPermission !== undefined) {
      source.citationPermission = citationPermission;
    }

    if (sensitivityLevel) {
      source.sensitivityLevel = sensitivityLevel as Source['sensitivityLevel'];
    }

    if (classificationConfidence !== undefined) {
      source.classificationConfidence = classificationConfidence;
    }

    if (classificationReasoning) {
      source.classificationReasoning = classificationReasoning;
    }

    if (agentSensitivityLevel) {
      source.agentSensitivityLevel = agentSensitivityLevel as Source['sensitivityLevel'];
    }

    if (classificationSource) {
      source.classificationSource = classificationSource as 'agent' | 'manual';
    }

    // Brand alignment fields
    if (brandAlignmentScore !== undefined) {
      source.brandAlignmentScore = brandAlignmentScore;
    }

    if (brandAlignmentLevel) {
      source.brandAlignmentLevel = brandAlignmentLevel as Source['brandAlignmentLevel'];
    }

    if (brandMatchedRules) {
      source.brandMatchedRules = brandMatchedRules;
    }

    if (brandViolatedRules) {
      source.brandViolatedRules = brandViolatedRules;
    }

    // Fetched content fields
    if (fetchedContent) {
      source.fetchedContent = fetchedContent;
      source.contentFetchedAt = new Date();
    }

    if (fetchedHeadings) {
      source.fetchedHeadings = fetchedHeadings;
    }

    if (contentFetchError) {
      source.contentFetchError = contentFetchError;
    }

    source.updatedAt = new Date();
    sourceStore.set(id, source);

    console.log(`[API] Updated source ${id}`);

    return NextResponse.json(source);
  } catch (error) {
    console.error('[API] Source update error:', error);
    return NextResponse.json(
      { error: 'Failed to update source', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;

    if (!sourceStore.has(id)) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    // Check if source is linked to any articles
    const linkedArticles = Array.from(articleStore.values()).filter(
      (article: any) => article.linkedSources && article.linkedSources.includes(id)
    );

    if (linkedArticles.length > 0) {
      return NextResponse.json(
        {
          error: 'Cannot delete source',
          message: `This source is linked to ${linkedArticles.length} article(s). Please unlink it from all articles before deleting.`,
          linkedCount: linkedArticles.length,
        },
        { status: 409 } // Conflict status code
      );
    }

    sourceStore.delete(id);

    console.log(`[API] Deleted source ${id}`);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[API] Source delete error:', error);
    return NextResponse.json(
      { error: 'Failed to delete source', message: (error as Error).message },
      { status: 500 }
    );
  }
}

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const source = sourceStore.get(id);

    if (!source) {
      return NextResponse.json({ error: 'Source not found' }, { status: 404 });
    }

    return NextResponse.json(source);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch source', message: (error as Error).message },
      { status: 500 }
    );
  }
}
