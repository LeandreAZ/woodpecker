// Five distinct legal positions. The first move is the player's move (native API convention).
export const puzzles = ['a', 'b', 'c', 'd', 'e'].map((file, index) => ({
  // Keep the board legal and deterministic; external IDs distinguish the five fixtures.
  fen: '7k/8/8/8/8/8/R7/K7 w - - 0 1',
  solution: ['a2a7'],
  wrong: 'a2a3',
  source: 'woodpecker-e2e',
  externalId: `fixture-${file}`,
  themes: ['endgame', 'rookEndgame'],
  rating: 1000 + index * 100,
}));
