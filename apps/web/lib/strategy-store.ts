// Shared in-memory strategy store (extracted from apps/web/app/api/strategy/route.ts)
// globalThis-backed to survive Next.js dev hot-reloads (like articleStore)

export interface StrategyRecord {
  id: string;
  workspaceId: string;
  title: string;
  offerings: string[];
  targetIcps: string[];
  geographies: string[];
  competitors: string[];
  contentMix: Record<string, number>;
  rubricWeights: Record<string, number>;
  description?: string;
  createdAt: Date;
  createdBy: string;
}

declare global {
  var _strategyStore: Map<string, StrategyRecord> | undefined;
}

if (!globalThis._strategyStore) {
  globalThis._strategyStore = new Map<string, StrategyRecord>();
}

export const strategyStore = globalThis._strategyStore;
