import { NextRequest, NextResponse } from 'next/server';
import { articleStore } from '../../store';

// Calculate Jaccard similarity between two sets of keywords
function calculateSimilarity(keywords1: Set<string>, keywords2: Set<string>): number {
  if (keywords1.size === 0 || keywords2.size === 0) return 0;

  const intersection = new Set([...keywords1].filter(k => keywords2.has(k)));
  const union = new Set([...keywords1, ...keywords2]);

  return (intersection.size / union.size) * 100;
}

// Extract keywords from text
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

  // Remove markdown syntax first
  let cleaned = text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // Extract text from [text](url)
    .replace(/#+\s+/g, '') // Remove heading markers
    .replace(/[*_~`]/g, '') // Remove emphasis markers
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

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, content, strategyId } = body;

    if (!title || !strategyId) {
      return NextResponse.json(
        { error: 'Title and strategyId are required' },
        { status: 400 }
      );
    }

    // Get all articles in the same strategy
    const allArticles = Array.from(articleStore.values()).filter(
      (a) => a.strategyId === strategyId && a.id !== params.id
    );

    if (allArticles.length === 0) {
      return NextResponse.json({ suggestions: [] });
    }

    // Extract keywords from current article
    const currentKeywords = extractKeywords(`${title} ${content || ''}`);

    // Calculate similarity scores
    const suggestions = allArticles
      .map((article) => {
        const articleKeywords = extractKeywords(`${article.title} ${article.content || ''}`);
        const similarity = calculateSimilarity(currentKeywords, articleKeywords);

        return {
          id: article.id,
          title: article.title,
          similarity: Math.round(similarity * 100) / 100, // Round to 2 decimals
          suggestedAnchor: `Learn more about ${article.title.toLowerCase()}`,
        };
      })
      .filter((s) => s.similarity >= 15) // Only suggest if 15%+ similar
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 8); // Top 8 suggestions

    return NextResponse.json({ suggestions });
  } catch (error) {
    console.error('[API] Crosslink suggestion error:', error);
    return NextResponse.json(
      { error: 'Failed to suggest links', message: (error as Error).message },
      { status: 500 }
    );
  }
}
