// Блок хранит ключи TanStack Query в одном месте для предсказуемого кэширования.
export const queryKeys = {
  auth: {
    all: ["auth"] as const,
    currentUser: ["auth", "current-user"] as const
  },
  admin: {
    all: ["admin"] as const,
    roadmaps: ["admin", "roadmaps"] as const,
    roadmap: (id: number) => ["admin", "roadmaps", id] as const
  },
  roadmaps: {
    all: ["roadmaps"] as const,
    list: (filters: Record<string, string>) => ["roadmaps", "list", filters] as const,
    detail: (slug: string) => ["roadmaps", "detail", slug] as const
  },
  progress: {
    all: ["progress"] as const,
    startedRoadmaps: ["progress", "started-roadmaps"] as const,
    roadmap: (roadmapSlug: string) => ["progress", "roadmap", roadmapSlug] as const
  }
};
