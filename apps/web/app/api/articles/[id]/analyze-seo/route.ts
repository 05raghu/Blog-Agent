import { NextRequest, NextResponse } from 'next/server';

// Simple SEO analyzer without external APIs
function analyzeSEO(title: string, content: string, brief: string) {
  // Extract primary keyword from title
  const titleWords = title.toLowerCase().split(/\s+/).filter(w => w.length > 3);
  const primaryKeyword = titleWords[0] || 'article';

  // Count keyword occurrences (case-insensitive)
  const contentLower = content.toLowerCase();
  const keywordOccurrences = (contentLower.match(new RegExp(primaryKeyword, 'g')) || []).length;
  const wordCount = content.split(/\s+/).length;
  const keywordDensity = (keywordOccurrences / wordCount) * 100;

  // Readability score (simplified Flesch-Kincaid)
  const sentences = content.split(/[.!?]+/).filter(s => s.trim());
  const words = content.split(/\s+/);
  const syllables = words.reduce((sum, word) => sum + countSyllables(word), 0);

  const readabilityScore = Math.max(0, Math.min(18,
    206.835 - (1.015 * (words.length / Math.max(1, sentences.length))) -
    (84.6 * (syllables / Math.max(1, words.length)))
  ));

  // Generate meta description
  const firstSentence = content.split(/[.!?]/)[0]?.trim() || brief;
  const metaDescription = firstSentence.substring(0, 160);

  // Analyze issues
  const issues = [];

  if (title.length < 30) {
    issues.push({
      type: 'warning',
      message: 'Title is too short. Aim for 30-60 characters.',
    });
  }

  if (keywordDensity < 1) {
    issues.push({
      type: 'warning',
      message: `Primary keyword "${primaryKeyword}" appears too infrequently.`,
    });
  } else if (keywordDensity > 5) {
    issues.push({
      type: 'warning',
      message: `Primary keyword "${primaryKeyword}" is overused. Reduce repetition.`,
    });
  }

  if (wordCount < 600) {
    issues.push({
      type: 'warning',
      message: `Article is only ${wordCount} words. Aim for 600+ words for better SEO.`,
    });
  }

  if (sentences.length === 0) {
    issues.push({
      type: 'error',
      message: 'No sentences detected. Content may be empty.',
    });
  }

  // Count headings
  const headingCount = (content.match(/^#+\s/gm) || []).length;
  if (headingCount === 0) {
    issues.push({
      type: 'warning',
      message: 'No headings found. Use H2/H3 headings to structure content.',
    });
  }

  // Count links
  const linkCount = (content.match(/\[.+?\]\(.+?\)/g) || []).length;
  if (linkCount === 0) {
    issues.push({
      type: 'info',
      message: 'No links found. Consider adding relevant internal or external links.',
    });
  }

  // Calculate SEO score
  let score = 50;

  if (title.length >= 30 && title.length <= 60) score += 15;
  else if (title.length > 30) score += 10;

  if (keywordDensity >= 1 && keywordDensity <= 3) score += 15;
  else if (keywordDensity >= 0.5 && keywordDensity <= 5) score += 10;

  if (wordCount >= 600) score += 15;
  else if (wordCount >= 300) score += 8;

  if (headingCount > 0) score += 10;
  if (linkCount > 0) score += 10;
  if (metaDescription.length >= 120) score += 5;

  score = Math.min(100, score);

  // Suggestions
  const suggestions = [];
  if (title.length >= 30 && title.length <= 60) {
    suggestions.push(`✓ Title length is optimal (${title.length} characters)`);
  }
  if (keywordDensity >= 1 && keywordDensity <= 3) {
    suggestions.push(`✓ Keyword density is good (${keywordDensity.toFixed(2)}%)`);
  }
  if (wordCount >= 600) {
    suggestions.push(`✓ Article length is sufficient (${wordCount} words)`);
  }
  if (headingCount > 0) {
    suggestions.push(`✓ Proper heading structure detected (${headingCount} headings)`);
  }
  if (linkCount > 0) {
    suggestions.push(`✓ Internal links present (${linkCount} links)`);
  }

  return {
    score: Math.round(score),
    keyword: primaryKeyword,
    keywordDensity: parseFloat(keywordDensity.toFixed(2)),
    readabilityScore: Math.round(readabilityScore / 2), // Convert to grade level
    metaDescription,
    issues,
    suggestions: suggestions.length > 0 ? suggestions : ['Continue optimizing content for better results'],
  };
}

function countSyllables(word: string): number {
  const vowels = 'aeiouy';
  let syllableCount = 0;
  let previousWasVowel = false;

  for (let i = 0; i < word.length; i++) {
    const isVowel = vowels.includes(word[i].toLowerCase());
    if (isVowel && !previousWasVowel) {
      syllableCount++;
    }
    previousWasVowel = isVowel;
  }

  // Adjust for silent e
  if (word.endsWith('e')) {
    syllableCount--;
  }

  // Minimum 1 syllable per word
  return Math.max(1, syllableCount);
}

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { title, content, brief } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Title and content are required' },
        { status: 400 }
      );
    }

    const analysis = analyzeSEO(title, content, brief || '');

    return NextResponse.json(analysis);
  } catch (error) {
    console.error('[API] SEO analysis error:', error);
    return NextResponse.json(
      { error: 'Failed to analyze SEO', message: (error as Error).message },
      { status: 500 }
    );
  }
}
