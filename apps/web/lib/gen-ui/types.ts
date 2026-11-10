// Gen UI type definitions for component streaming

export interface GenUIStreamChunk {
  type: 'component' | 'tool_call' | 'complete' | 'error';
  content?: string;
  toolName?: string;
  toolInput?: Record<string, any>;
}

export interface DashboardContext {
  articleId: string;
  articleTitle: string;
  metrics: {
    impressions: number;
    clicks: number;
    ctr: number;
    avgPosition: number;
    sessions: number;
    engagementDuration: number;
    leads: number;
  };
  trends: {
    impressionTrend7d: number;
    ctrTrend7d: number;
    sessionTrend7d: number;
  };
  lastUpdated: string;
  dataCompletePercentage: number;
}

export interface HealingProposal {
  id: string;
  title: string;
  description: string;
  type: 'link_refresh' | 'cta_update' | 'content_edit' | 'source_update';
  confidence: number;
  expectedImpact: string;
  affectedSections: string[];
}
