import type { IntelligenceProjectOption } from "@/lib/intelligence/project-options";

const CACHE_TTL_MS = 5 * 60 * 1000;
const CACHE_VERSION = 2;

type ProjectOptionsCache = {
  version: number;
  projects: IntelligenceProjectOption[];
  fetchedAt: number;
};

let cache: ProjectOptionsCache | null = null;
let inflight: Promise<IntelligenceProjectOption[]> | null = null;

export function readIntelligenceProjectCache(): IntelligenceProjectOption[] | null {
  if (!cache) return null;
  if (cache.version !== CACHE_VERSION) {
    cache = null;
    return null;
  }
  if (Date.now() - cache.fetchedAt > CACHE_TTL_MS) {
    cache = null;
    return null;
  }
  return cache.projects;
}

export function prefetchIntelligenceProjects(): void {
  void loadIntelligenceProjects();
}

export async function loadIntelligenceProjects(options?: {
  force?: boolean;
}): Promise<IntelligenceProjectOption[]> {
  if (!options?.force) {
    const cached = readIntelligenceProjectCache();
    if (cached) return cached;
    if (inflight) return inflight;
  }

  inflight = fetch("/api/intelligence/projects", { cache: "no-store" })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Could not load projects.");
      }
      const payload = (await response.json()) as {
        projects: IntelligenceProjectOption[];
      };
      const projects = payload.projects ?? [];
      cache = { version: CACHE_VERSION, projects, fetchedAt: Date.now() };
      return projects;
    })
    .finally(() => {
      inflight = null;
    });

  return inflight;
}

export function clearIntelligenceProjectCache(): void {
  cache = null;
  inflight = null;
}
