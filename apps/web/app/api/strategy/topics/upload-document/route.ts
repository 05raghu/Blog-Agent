// API route: POST /api/strategy/topics/upload-document
// Upload a PDF/DOCX/TXT/MD draft, extract its text, and create a topic grounded in that document.
// The extracted text is stored on the topic (source_content) so it can later ground
// brief/outline/draft generation when an article is created from this topic.

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';
import { getTextModelProvider } from '@/lib/text-model';
import { getTopicScorerProvider } from '@/lib/topic-scorer';
import { getSearchDemandProvider } from '@/lib/search-demand';
import { buildTrendEvidence } from '@/lib/trend-evidence';
import { generateTopicId } from '@/lib/topic-store';
import { extractDocumentText } from '@/lib/document-extract';

export async function POST(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const strategyId = formData.get('strategyId') as string | null;
    const strategyJson = formData.get('strategy') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'file is required' }, { status: 400 });
    }
    if (!strategyId || !strategyJson) {
      return NextResponse.json({ error: 'strategyId and strategy are required' }, { status: 400 });
    }

    let strategy;
    try {
      strategy = JSON.parse(strategyJson);
    } catch {
      return NextResponse.json({ error: 'Invalid strategy JSON' }, { status: 400 });
    }

    const normalizedStrategy = {
      offerings: strategy.offerings || [],
      targetIcps: strategy.targetIcps || strategy.icps || [],
      geographies: strategy.geographies || [],
      competitors: strategy.competitors || [],
      contentMix: strategy.contentMix || {},
    };

    // Extract text from the uploaded document
    let extracted;
    try {
      extracted = await extractDocumentText(file);
    } catch (extractErr) {
      return NextResponse.json(
        { error: 'Failed to extract document text', message: (extractErr as Error).message },
        { status: 400 }
      );
    }

    const provider = await getTextModelProvider();

    // Generate a topic that accurately represents the document's actual content
    const candidate = await provider.generateTopicFromDocument({
      documentText: extracted.text,
      strategy: normalizedStrategy,
    });

    // Get real market demand data (same pattern as manual/AI topic creation)
    let searchDemand = null;
    try {
      const demandProvider = await getSearchDemandProvider();
      const demandData = await demandProvider.getSearchDemand({
        topic: candidate.title,
        keywords: candidate.angle ? [candidate.angle] : [],
      });
      searchDemand = {
        estimatedMonthlySearches: demandData.estimatedMonthlySearches,
        demandLevel: demandData.demandLevel,
        resultCount: demandData.gscImpressions,
        trending: demandData.trending,
        confidence: demandData.confidence,
      };
    } catch (demandErr) {
      console.warn('[API] Failed to get search demand for uploaded document topic:', demandErr);
    }

    // Get real-time trend evidence (LinkedIn posts, recent articles, top sources)
    let trendEvidence = null;
    try {
      trendEvidence = await buildTrendEvidence(candidate.title);
    } catch (trendErr) {
      console.warn('[API] Failed to get trend evidence for uploaded document topic:', trendErr);
    }

    // Score the topic using the same rubric as every other topic
    const scorer = await getTopicScorerProvider();
    const llmScore = await scorer.scoreTopic({
      topic: candidate,
      strategy: normalizedStrategy,
      searchDemand: searchDemand || undefined,
      trendEvidence: trendEvidence || undefined,
    });

    const topicId = generateTopicId();

    const scoredTopic = {
      id: topicId,
      title: candidate.title,
      summary: candidate.summary || '',
      format: candidate.format || 'blog',
      angle: candidate.angle,
      targetOffering: candidate.targetOffering,
      geography: candidate.geography,
      audience: candidate.audience,
      score: llmScore.totalScore,
      confidence: llmScore.confidence,
      breakdown: {
        strategicRelevance: {
          score: llmScore.breakdown.strategicRelevance.score,
          evidence: llmScore.breakdown.strategicRelevance.reasoning,
        },
        audienceIcpUsefulness: {
          score: llmScore.breakdown.audienceIcpUsefulness.score,
          evidence: llmScore.breakdown.audienceIcpUsefulness.reasoning,
        },
        availableEvidenceAndDemand: {
          score: llmScore.breakdown.availableEvidenceAndDemand.score,
          evidence: llmScore.breakdown.availableEvidenceAndDemand.reasoning,
        },
        differentiatedAngle: {
          score: llmScore.breakdown.differentiatedAngle.score,
          evidence: llmScore.breakdown.differentiatedAngle.reasoning,
        },
        smeFit: {
          score: llmScore.breakdown.smeFit.score,
          evidence: llmScore.breakdown.smeFit.reasoning,
        },
        searchContentGap: {
          score: llmScore.breakdown.searchContentGap.score,
          evidence: llmScore.breakdown.searchContentGap.reasoning,
        },
        conversionDistributionPotential: {
          score: llmScore.breakdown.conversionDistributionPotential.score,
          evidence: llmScore.breakdown.conversionDistributionPotential.reasoning,
        },
      },
      cannibalizationRisk: { exists: false },
      recommendedSmes: [],
      missingInputs: [],
      trendEvidence,
      createdAt: new Date().toISOString(),
      sourceContent: extracted.text,
      sourceFilename: extracted.filename,
    };

    const supabase = createServerClient();
    const { error: insertError } = await supabase
      .from('topic_candidates')
      .insert({
        id: scoredTopic.id,
        workspace_id: workspace.workspaceId,
        strategy_id: strategyId,
        title: scoredTopic.title,
        summary: scoredTopic.summary,
        angle: scoredTopic.angle,
        format: scoredTopic.format,
        geography: scoredTopic.geography,
        audience: scoredTopic.audience,
        target_offering: scoredTopic.targetOffering,
        score: scoredTopic.score,
        confidence: scoredTopic.confidence,
        breakdown: scoredTopic.breakdown,
        cannibalization_risk: scoredTopic.cannibalizationRisk,
        recommended_smes: scoredTopic.recommendedSmes,
        missing_inputs: scoredTopic.missingInputs,
        source_content: scoredTopic.sourceContent,
        source_filename: scoredTopic.sourceFilename,
        trend_evidence: scoredTopic.trendEvidence,
        source: 'document',
      });

    if (insertError) {
      console.error('[API] Topic-from-document insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save topic', message: insertError.message },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      topic: scoredTopic,
      message: `Topic created from "${extracted.filename}" and scored successfully`,
    });
  } catch (error) {
    console.error('[API] Upload-document topic creation error:', error);
    return NextResponse.json(
      { error: 'Failed to create topic from document', message: (error as Error).message },
      { status: 500 }
    );
  }
}
