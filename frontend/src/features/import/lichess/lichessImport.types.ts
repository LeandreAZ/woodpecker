export type LichessCriteria = {
  count: number;
  minRating: number;
  maxRating: number;
  themes: string[];
  distribution: 'random' | 'custom';
  themeDistribution?: Record<string, number>;
  minMoves?: number;
  maxMoves?: number;
};
