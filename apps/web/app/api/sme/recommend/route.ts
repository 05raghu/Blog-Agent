// API route: POST /api/sme/recommend
// Get recommended SMEs for a topic using PRD P0.4 scoring
// Fetches SMEs from Supabase

import { NextRequest, NextResponse } from 'next/server';
import { getWorkspaceContext, createServerClient } from '@/lib/workspace-auth';

interface SMERecommendation {
  smeId: string;
  smeName: string;
  fitScore: number;
  topicFitScore: number;
  availabilityScore: number;
  priorWorkScore: number;
  reasoning: {
    topicFit: string;
    availability: string;
    priorWork: string;
  };
}

function calculateTopicFit(topic: any, expertise: string[]): number {
  const topicText = `${topic.title} ${topic.summary || ''} ${topic.angle || ''} ${topic.targetOffering || ''}`.toLowerCase();
  const topicWords = topicText.split(/\s+/).filter((w: string) => w.length > 3);

  const matches = expertise.filter((exp) => {
    const expLower = exp.toLowerCase();
    return topicWords.some((word: string) => expLower.includes(word) || word.includes(expLower));
  });

  if (expertise.length === 0) return 30;
  const matchRatio = matches.length / expertise.length;
  return Math.round(30 + matchRatio * 70);
}

function calculateAvailability(sme: any): number {
  const capacityHours = sme.capacityHoursPerMonth || 0;
  const usedHours = sme.hoursUsed || 0;
  const availableHours = Math.max(0, capacityHours - usedHours);
  const hourNeeded = 5;

  if (availableHours >= hourNeeded * 2) return 100;
  if (availableHours >= hourNeeded) return 75;
  if (availableHours >= hourNeeded * 0.5) return 50;
  return 25;
}

function calculatePriorWork(sme: any): number {
  const priorCount = (sme.pastContributions?.length || 0);
  if (priorCount >= 3) return 100;
  if (priorCount === 2) return 80;
  if (priorCount === 1) return 60;
  return 40;
}

function recommendSMEsForTopic(topic: any, smes: any[]): SMERecommendation[] {
  const scored = smes.map((sme) => {
    const topicFitScore = calculateTopicFit(topic, sme.expertise || []);
    const availabilityScore = calculateAvailability(sme);
    const priorWorkScore = calculatePriorWork(sme);

    const fitScore = Math.round(
      topicFitScore * 0.5 + availabilityScore * 0.3 + priorWorkScore * 0.2
    );

    const offering = topic.targetOffering || 'this topic';
    const expertiseList = (sme.expertise || []).slice(0, 2).join(', ');

    let topicFitReason = '';
    if (topicFitScore >= 80) {
      topicFitReason = `Expert in ${expertiseList}. Strong match for ${offering}`;
    } else if (topicFitScore >= 60) {
      topicFitReason = `Relevant expertise in ${expertiseList}. Good fit for ${offering}`;
    } else if (topicFitScore >= 40) {
      topicFitReason = `Some relevant expertise. Can contribute to ${offering}`;
    } else {
      topicFitReason = `Limited direct expertise, but can provide perspective on ${offering}`;
    }

    const availableHours = Math.max(0, (sme.capacityHoursPerMonth || 0) - (sme.hoursUsed || 0));
    let availabilityReason = '';
    if (availabilityScore >= 75) {
      availabilityReason = `${availableHours}+ hours/month available`;
    } else if (availabilityScore >= 50) {
      availabilityReason = `${availableHours} hours/month available (limited capacity)`;
    } else {
      availabilityReason = `${availableHours} hours/month available (at capacity)`;
    }

    const priorCount = sme.pastContributions?.length || 0;
    let priorWorkReason = '';
    if (priorCount >= 3) {
      priorWorkReason = `Experienced: interviewed for ${priorCount}+ articles`;
    } else if (priorCount === 2) {
      priorWorkReason = `Familiar with process: interviewed for 2 articles`;
    } else if (priorCount === 1) {
      priorWorkReason = `Some interview experience`;
    } else {
      priorWorkReason = `First time; fresh perspective`;
    }

    return {
      smeId: sme.id,
      smeName: sme.name,
      fitScore,
      topicFitScore,
      availabilityScore,
      priorWorkScore,
      reasoning: {
        topicFit: topicFitReason,
        availability: availabilityReason,
        priorWork: priorWorkReason,
      },
    };
  });

  return scored.sort((a, b) => b.fitScore - a.fitScore).slice(0, 3);
}

export async function POST(request: NextRequest) {
  try {
    const workspace = await getWorkspaceContext(request);
    if (!workspace) {
      return NextResponse.json(
        { error: 'Unauthorized: No valid authentication token' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { topic } = body;

    if (!topic || !topic.title) {
      return NextResponse.json(
        { error: 'Topic with title is required' },
        { status: 400 }
      );
    }

    // Fetch all SMEs from Supabase for this workspace
    const supabase = createServerClient();
    const { data: smes, error } = await supabase
      .from('sme_profiles')
      .select('*')
      .eq('workspace_id', workspace.workspaceId);

    if (error) {
      console.error('[API] Error fetching SMEs:', error);
      return NextResponse.json(
        { error: 'Failed to fetch SMEs' },
        { status: 500 }
      );
    }

    if (!smes || smes.length === 0) {
      return NextResponse.json({
        success: true,
        recommendations: [],
        message: 'No SMEs available in workspace',
      });
    }

    // Map Supabase format to expected format for recommendation logic
    const formattedSmes = smes.map((sme: any) => ({
      id: sme.id,
      name: sme.name,
      expertise: sme.expertise || [],
      capacityHoursPerMonth: sme.capacity_hours_per_month || 0,
      hoursUsed: sme.hours_used || 0,
      pastContributions: sme.past_contributions || [],
    }));

    // Get recommendations
    const recommendations = recommendSMEsForTopic(topic, formattedSmes);

    return NextResponse.json({
      success: true,
      recommendations,
    });
  } catch (error) {
    console.error('[API] SME recommendation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to get SME recommendations',
        message: (error as Error).message,
      },
      { status: 500 }
    );
  }
}
