// Shared in-memory store for articles (replace with DB later)
// Use globalThis to persist across module reloads in development
declare global {
  var _articleStore: Map<string, any> | undefined;
}

if (!globalThis._articleStore) {
  globalThis._articleStore = new Map<string, any>();
}

export const articleStore = globalThis._articleStore;
