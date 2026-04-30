export interface RecommendationsDiff {
  added: string[];
  removed: string[];
  unchanged: string[];
}

export function diffRecommendations(prev: string[] = [], next: string[] = []): RecommendationsDiff {
  const prevSet = new Set(prev);
  const nextSet = new Set(next);
  return {
    added: next.filter((x) => !prevSet.has(x)),
    removed: prev.filter((x) => !nextSet.has(x)),
    unchanged: next.filter((x) => prevSet.has(x)),
  };
}
