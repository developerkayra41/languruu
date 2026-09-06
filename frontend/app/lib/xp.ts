export interface LevelXpParts {
  xp: number;
  xp_into_level: number;
  xp_for_next: number;
}

export function nextLevelTotalXp({ xp, xp_into_level, xp_for_next }: LevelXpParts): number {
  return xp + Math.max(0, xp_for_next - xp_into_level);
}
