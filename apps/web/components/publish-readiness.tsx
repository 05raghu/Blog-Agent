'use client';

interface ScoreBreakdown {
  seo: { score: number; details: string[] };
  content: { score: number; details: string[] };
  links: { score: number; details: string[] };
  images: { score: number; details: string[] };
  claims: { score: number; details: string[] };
  cta: { score: number; details: string[] };
}

interface PublishReadinessProps {
  content: string;
  title: string;
  wordCount: number;
  hasImages: boolean;
  claimsVerified: number;
  totalClaims: number;
  hasCTA?: boolean;
}

export function PublishReadiness({
  content,
  title,
  wordCount,
  hasImages,
  claimsVerified,
  totalClaims,
  hasCTA = false,
}: PublishReadinessProps) {
  const calculateScores = (): ScoreBreakdown => {
    const scores: ScoreBreakdown = {
      seo: { score: 0, details: [] },
      content: { score: 0, details: [] },
      links: { score: 0, details: [] },
      images: { score: 0, details: [] },
      claims: { score: 0, details: [] },
      cta: { score: 0, details: [] },
    };

    // SEO Scoring
    let seoScore = 0;
    if (title.length >= 30 && title.length <= 60) {
      seoScore += 25;
      scores.seo.details.push('✓ Title length optimal (30-60 chars)');
    } else {
      scores.seo.details.push('⚠ Title should be 30-60 characters');
    }

    const headings = content.match(/^#+\s/gm) || [];
    if (headings.length >= 3) {
      seoScore += 25;
      scores.seo.details.push(`✓ Good heading structure (${headings.length} headings)`);
    } else {
      scores.seo.details.push('⚠ Add more headings for structure');
    }

    if (wordCount >= 600) {
      seoScore += 25;
      scores.seo.details.push(`✓ Sufficient content length (${wordCount} words)`);
    } else {
      scores.seo.details.push(`⚠ Expand content to 600+ words (currently ${wordCount})`);
    }

    const metaKeywords = (content.match(/keyword|important|key concept/gi) || []).length;
    if (metaKeywords >= 5) {
      seoScore += 25;
      scores.seo.details.push('✓ Good keyword distribution');
    } else {
      scores.seo.details.push('⚠ Add more key terms and concepts');
    }

    scores.seo.score = seoScore;

    // Content Scoring
    let contentScore = 0;
    if (wordCount >= 1000) {
      contentScore += 30;
      scores.content.details.push('✓ Comprehensive content');
    } else if (wordCount >= 600) {
      contentScore += 20;
      scores.content.details.push('✓ Adequate content length');
    } else {
      scores.content.details.push('⚠ Content too short');
    }

    const paragraphs = content.split('\n\n').length;
    if (paragraphs >= 5) {
      contentScore += 25;
      scores.content.details.push(`✓ Good structure (${paragraphs} paragraphs)`);
    } else {
      scores.content.details.push('⚠ Break into more paragraphs');
    }

    if (headings.length >= 3) {
      contentScore += 20;
      scores.content.details.push('✓ Clear section hierarchy');
    } else {
      scores.content.details.push('⚠ Add more section headings');
    }

    const hasQuotes = content.includes('> ');
    const hasList = content.includes('- ');
    if (hasQuotes || hasList) {
      contentScore += 25;
      scores.content.details.push('✓ Varied content format');
    } else {
      scores.content.details.push('⚠ Add quotes or lists for variety');
    }

    scores.content.score = Math.min(contentScore, 100);

    // Links Scoring
    let linksScore = 0;
    const linkMatches = content.match(/\[.*?\]\(.*?\)/g) || [];
    if (linkMatches.length >= 3) {
      linksScore += 50;
      scores.links.details.push(`✓ Good internal linking (${linkMatches.length} links)`);
    } else if (linkMatches.length > 0) {
      linksScore += 25;
      scores.links.details.push(`⚠ Add more links (currently ${linkMatches.length})`);
    } else {
      scores.links.details.push('⚠ No links found - add internal/external links');
    }

    scores.links.score = linksScore;

    // Images Scoring
    let imageScore = 0;
    if (hasImages) {
      imageScore += 100;
      scores.images.details.push('✓ Hero image added');
    } else {
      scores.images.details.push('⚠ Add a hero image');
    }

    scores.images.score = imageScore;

    // Claims Scoring
    let claimsScore = 0;
    if (totalClaims === 0) {
      claimsScore = 100;
      scores.claims.details.push('✓ No factual claims requiring verification');
    } else if (claimsVerified === totalClaims) {
      claimsScore = 100;
      scores.claims.details.push(`✓ All claims verified (${totalClaims}/${totalClaims})`);
    } else {
      const percent = Math.round((claimsVerified / totalClaims) * 100);
      claimsScore = percent;
      scores.claims.details.push(`⚠ ${totalClaims - claimsVerified} claim(s) need verification`);
    }

    scores.claims.score = claimsScore;

    // CTA Scoring
    let ctaScore = 0;
    if (hasCTA) {
      ctaScore = 100;
      scores.cta.details.push('✓ Call-to-action selected');
    } else {
      scores.cta.details.push('⚠ No call-to-action selected');
    }

    scores.cta.score = ctaScore;

    return scores;
  };

  const scores = calculateScores();
  const overallScore = Math.round(
    (scores.seo.score + scores.content.score + scores.links.score + scores.images.score + scores.claims.score + scores.cta.score) / 6
  );

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-50';
    if (score >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getBlockers = () => {
    const blockers = [];
    if (wordCount < 300) blockers.push('Content too short (min 300 words)');
    if (!title) blockers.push('Missing article title');
    if (!hasImages) blockers.push('Missing hero image');
    if (!hasCTA) blockers.push('Missing call-to-action selection');
    if (totalClaims > 0 && claimsVerified < totalClaims) blockers.push('Unverified claims found');
    return blockers;
  };

  const blockers = getBlockers();
  const canPublish = blockers.length === 0;

  return (
    <div className="space-y-4">
      {/* Overall Score */}
      <div className={`border border-slate-200 rounded-lg p-6 ${getScoreColor(overallScore)}`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium opacity-75">Publish-Readiness Score</p>
            <p className="text-4xl font-bold">{overallScore}%</p>
          </div>
          <div className="w-24 h-24 rounded-full border-4 flex items-center justify-center text-2xl font-bold"
            style={{
              borderColor: overallScore >= 80 ? '#16a34a' : overallScore >= 60 ? '#ca8a04' : '#dc2626',
            }}>
            {overallScore}
          </div>
        </div>
        <p className="text-sm mt-2">
          {overallScore >= 80 ? '✓ Ready to publish' : overallScore >= 60 ? '⚠ Needs improvements' : '❌ Not ready'}
        </p>
      </div>

      {/* Blockers */}
      {blockers.length > 0 && (
        <div className="border border-red-300 bg-red-50 rounded-lg p-4">
          <p className="font-bold text-red-900 mb-2">🚫 Publishing Blockers:</p>
          <ul className="space-y-1">
            {blockers.map((blocker, idx) => (
              <li key={idx} className="text-sm text-red-800">• {blocker}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Score Breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(scores).map(([key, { score, details }]) => (
          <div key={key} className={`border border-slate-200 rounded-lg p-4 ${getScoreColor(score)}`}>
            <div className="flex justify-between items-center mb-2">
              <p className="font-bold capitalize">{key} Score</p>
              <p className="text-2xl font-bold">{score}%</p>
            </div>
            <ul className="space-y-1">
              {details.map((detail: string, idx: number) => (
                <li key={idx} className="text-xs">
                  {detail}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Publish Status & Next Steps */}
      <div className={`rounded-lg p-4 ${canPublish ? 'bg-green-50 border border-green-200' : 'bg-yellow-50 border border-yellow-200'}`}>
        <p className={`font-bold mb-3 ${canPublish ? 'text-green-900' : 'text-yellow-900'}`}>
          {canPublish ? '✓ Content is ready for approval' : '⚠ Content needs more work before publishing'}
        </p>

        {!canPublish && (
          <div className="text-sm space-y-2">
            <p className="font-semibold text-yellow-900">Next Steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-yellow-800">
              {blockers.map((blocker: string, idx: number) => (
                <li key={idx}>{blocker}</li>
              ))}
              <li className="mt-3 text-yellow-700">
                After fixing blockers, review the score breakdown above
              </li>
              <li className="text-yellow-700">
                Aim for 80%+ score before requesting approval
              </li>
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
