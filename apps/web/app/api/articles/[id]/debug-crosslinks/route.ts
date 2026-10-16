// API route: GET /api/articles/[id]/debug-crosslinks — Debug crosslink analysis
// Fetches articles from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

function extractKeywords(text: string): Set<string> {
  const stopwords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
    'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did',
    'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can',
    'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'from', 'up',
    'about', 'into', 'through', 'during', 'before', 'after', 'above',
    'below', 'between', 'under', 'again', 'further', 'then', 'once',
    'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it',
    'we', 'they', 'what', 'which', 'who', 'when', 'where', 'why', 'how',
  ]);

  let cleaned = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/#+\s+/g, '')
    .replace(/[*_~`]/g, '')
    .toLowerCase();

  const words = cleaned
    .split(/\s+/)
    .filter(word => {
      const clean = word.replace(/[^a-z0-9]/g, '');
      return clean.length > 3 && !stopwords.has(clean);
    })
    .map(word => word.replace(/[^a-z0-9]/g, ''));

  return new Set(words);
}

function calculateSimilarity(keywords1: Set<string>, keywords2: Set<string>): number {
  if (keywords1.size === 0 || keywords2.size === 0) return 0;
  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);
  return (intersection.size / union.size) * 100;
}

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const { searchParams } = request.nextUrl;
    const strategyId = searchParams.get('strategyId');

    if (!strategyId) {
      return NextResponse.json({ error: 'strategyId required' }, { status: 400 });
    }

    const supabase = createServerClient();

    // Get current article
    const { data: currentArticle, error: currentError } = await supabase
      .from('articles')
      .select('*')
      .eq('id', params.id)
      .eq('workspace_id', workspace.workspaceId)
      .single();

    if (currentError || !currentArticle) {
      return NextResponse.json({ error: 'Article not found' }, { status: 404 });
    }

    // Get all articles in the same strategy
    const { data: strategyArticles, error: articlesError } = await supabase
      .from('articles')
      .select('id, title, content')
      .eq('workspace_id', workspace.workspaceId)
      .eq('strategy_id', strategyId)
      .neq('id', params.id);

    if (articlesError || !strategyArticles) {
      return NextResponse.json({ error: 'Failed to fetch articles' }, { status: 500 });
    }

    // Extract keywords
    const currentKeywords = extractKeywords(`${currentArticle.title} ${currentArticle.content || ''}`);

    // Calculate similarity for each
    const analyzed = strategyArticles.map((a: any) => {
      const otherKeywords = extractKeywords(`${a.title} ${a.content || ''}`);
      const similarity = calculateSimilarity(currentKeywords, otherKeywords);
      const intersection = new Set([...currentKeywords].filter(k => otherKeywords.has(k)));

      return {
        id: a.id,
        title: a.title,
        currentKeywords: Array.from(currentKeywords).slice(0, 10),
        otherKeywords: Array.from(otherKeywords).slice(0, 10),
        matchingKeywords: Array.from(intersection).slice(0, 10),
        similarity: Math.round(similarity * 100) / 100,
        hasContent: !!a.content,
      };
    });

    analyzed.sort((a, b) => b.similarity - a.similarity);

    return NextResponse.json({
      debug: {
        strategyId,
        currentArticleId: params.id,
        currentArticleTitle: currentArticle.title,
        currentKeywordCount: currentKeywords.size,
        otherArticlesAvailable: strategyArticles.length,
      },
      analysis: analyzed,
      suggestions: analyzed.filter((a) => a.similarity >= 20),
    });
  } catch (error) {
    console.error('[DEBUG] Error:', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
