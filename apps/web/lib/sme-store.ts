// SME profile store - workspace-scoped, persistent in globalThis
// Prevents data loss on Next.js dev hot-reloads

export interface SMEProfile {
  id: string;
  workspaceId: string;
  name: string;
  email: string;
  expertise: string[];
  biography?: string;
  capacityHoursPerMonth: number;
  hoursUsed?: number;
  pastContributions?: string[];
  createdAt: string;
}

declare global {
  var _smeStore: Map<string, SMEProfile[]> | undefined;
}

const smeStore = global._smeStore || new Map();
global._smeStore = smeStore;

export { smeStore };

export function getSMEsByWorkspace(workspaceId: string): SMEProfile[] {
  return smeStore.get(workspaceId) || [];
}

export function addSME(workspaceId: string, sme: Omit<SMEProfile, 'id' | 'createdAt'>): SMEProfile {
  const newSME: SMEProfile = {
    ...sme,
    id: `sme-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    createdAt: new Date().toISOString(),
  };

  const smes = smeStore.get(workspaceId) || [];
  smeStore.set(workspaceId, [...smes, newSME]);

  return newSME;
}

export function updateSME(workspaceId: string, smeId: string, updates: Partial<SMEProfile>): SMEProfile | null {
  const smes = smeStore.get(workspaceId) || [];
  const index = smes.findIndex((s: SMEProfile) => s.id === smeId);

  if (index === -1) return null;

  const updated = { ...smes[index], ...updates, id: smes[index].id, workspaceId };
  smes[index] = updated;
  smeStore.set(workspaceId, smes);

  return updated;
}

export function deleteSME(workspaceId: string, smeId: string): boolean {
  const smes = smeStore.get(workspaceId) || [];
  const filtered = smes.filter((s: SMEProfile) => s.id !== smeId);

  if (filtered.length === smes.length) return false;

  smeStore.set(workspaceId, filtered);
  return true;
}

export function getSMEById(workspaceId: string, smeId: string): SMEProfile | null {
  const smes = smeStore.get(workspaceId) || [];
  return smes.find((s: SMEProfile) => s.id === smeId) || null;
}
