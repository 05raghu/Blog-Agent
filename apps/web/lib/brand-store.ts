// Brand guidelines and voice profile storage — uses globalThis for persistence across hot-reloads

export interface VoiceProfile {
  id: string;
  workspaceId: string;
  principles: string[];
  desiredPatterns: string[];
  prohibitedPatterns: string[];
  terminology: Record<string, string>; // preferred term -> explanation
  toneBoundaries: string[];
  exemplars: {
    strong: string[]; // examples of good writing
    weak: string[];   // examples of what to avoid
  };
  approved: boolean;
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export const brandStore = (() => {
  if (typeof globalThis === 'undefined') {
    return new Map<string, VoiceProfile>();
  }

  if (!(globalThis as any)._brandStore) {
    (globalThis as any)._brandStore = new Map<string, VoiceProfile>();
  }

  return (globalThis as any)._brandStore as Map<string, VoiceProfile>;
})();

export function getVoiceProfile(workspaceId: string): VoiceProfile | null {
  return brandStore.get(workspaceId) || null;
}

export function setVoiceProfile(workspaceId: string, profile: VoiceProfile): VoiceProfile {
  brandStore.set(workspaceId, profile);
  return profile;
}

export function synthesizeVoiceProfile(
  principles: string[],
  desiredPatterns: string[],
  prohibitedPatterns: string[],
  terminology: Record<string, string>,
  toneBoundaries: string[],
  exemplars: { strong: string[]; weak: string[] }
): Omit<VoiceProfile, 'id' | 'workspaceId'> {
  return {
    principles,
    desiredPatterns,
    prohibitedPatterns,
    terminology,
    toneBoundaries,
    exemplars,
    approved: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
