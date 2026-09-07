export const QUICK_PUZZLE_COUNTS = [100, 300, 500, 1000] as const;
export const LICHESS_THEME_OPTIONS = [
  { label: 'Attaque sur f2 ou f7', value: 'attackingf2f7' },
  { label: 'Mat de Balestra', value: 'balestramate' },
  { label: 'Mat des deux cochons', value: 'blindswinemate' },
  { label: 'Capture du défenseur', value: 'capturingdefender' },
  { label: 'Coup colinéaire', value: 'collinearmove' },
  { label: 'Mat du coin', value: 'cornermate' },
  { label: 'Avantage décisif', value: 'crushing' },
  { label: 'Échec à la découverte', value: 'discoveredcheck' },
  { label: 'Prise en passant', value: 'enpassant' },
  { label: 'Mat des épaulettes', value: 'epaulettemate' },
  { label: 'Mat de la boîte', value: 'killboxmate' },
  { label: 'Long', value: 'long' },
  { label: 'Maître contre maître', value: 'mastervsmaster' },
  { label: 'Mat de Morphy', value: 'morphysmate' },
  { label: 'Mat de l’opéra', value: 'operamate' },
  { label: 'Mat de Pillsbury', value: 'pillsburysmate' },
  { label: 'Promotion', value: 'promotion' },
  { label: 'Coup calme', value: 'quietmove' },
  { label: 'Super grand maître', value: 'supergm' },
  { label: 'Mat de la queue d’hirondelle', value: 'swallowstailmate' },
  { label: 'Mat du triangle', value: 'trianglemate' },
  { label: 'Mat de Vuković', value: 'vukovicmate' },

  { label: 'Pion avancé', value: 'advancedpawn' },
  { label: 'Avantage', value: 'advantage' },
  { label: 'Mat d’Anastasie', value: 'anastasiamate' },
  { label: 'Mat arabe', value: 'arabianmate' },
  { label: 'Attraction', value: 'attraction' },
  { label: 'Mat du couloir', value: 'backrankmate' },
  { label: 'Finale de fous', value: 'bishopendgame' },
  { label: 'Mat de Boden', value: 'bodenmate' },
  { label: 'Petit roque', value: 'castling' },
  { label: 'Déblayage', value: 'clearance' },
  { label: 'Coup défensif', value: 'defensivemove' },
  { label: 'Déviation', value: 'deflection' },
  { label: 'Attaque à la découverte', value: 'discoveredattack' },
  { label: 'Double attaque', value: 'doubleattack' },
  { label: 'Double échec', value: 'doublecheck' },
  { label: 'Mat aux deux fous', value: 'doublebishopmate' },
  { label: 'Mat aux deux tours', value: 'doublerookmate' },
  { label: 'Mat du couloir diagonal', value: 'dovetailmate' },
  { label: 'Égalité', value: 'equality' },
  { label: 'Roi exposé', value: 'exposedking' },
  { label: 'Fourchette', value: 'fork' },
  { label: 'Pièce en prise', value: 'hangingpiece' },
  { label: 'Mat du crochet', value: 'hookmate' },
  { label: 'Interférence', value: 'interference' },
  { label: 'Coup intermédiaire', value: 'intermezzo' },
  { label: 'Attaque à l’aile roi', value: 'kingsideattack' },
  { label: 'Finale de cavaliers', value: 'knightendgame' },
  { label: 'Fourchette de cavalier', value: 'knightfork' },
  { label: 'Maître', value: 'master' },
  { label: 'Mat', value: 'mate' },
  { label: 'Mat en 1', value: 'matein1' },
  { label: 'Mat en 2', value: 'matein2' },
  { label: 'Mat en 3', value: 'matein3' },
  { label: 'Mat en 4', value: 'matein4' },
  { label: 'Mat en 5', value: 'matein5' },
  { label: 'Milieu de jeu', value: 'middlegame' },
  { label: 'Un coup', value: 'onemove' },
  { label: 'Ouverture', value: 'opening' },
  { label: 'Finale de pions', value: 'pawnendgame' },
  { label: 'Clouage', value: 'pin' },
  { label: 'Attaque à l’aile dame', value: 'queensideattack' },
  { label: 'Finale de dames', value: 'queenendgame' },
  { label: 'Finale dame-tour', value: 'queenrookendgame' },
  { label: 'Finale de tours', value: 'rookendgame' },
  { label: 'Sacrifice', value: 'sacrifice' },
  { label: 'Court', value: 'short' },
  { label: 'Enfilade', value: 'skewer' },
  { label: 'Mat étouffé', value: 'smotheredmate' },
  { label: 'Technique', value: 'technical' },
  { label: 'Pièce piégée', value: 'trappedpiece' },
  { label: 'Sous-promotion', value: 'underpromotion' },
  { label: 'Très long', value: 'verylong' },
  { label: 'Attaque aux rayons X', value: 'xrayattack' },
  { label: 'Zugzwang', value: 'zugzwang' },
  { label: 'Finale', value: 'endgame' },
] as const;

export function normalizeSearchText(value: string) {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

export function normalizeThemeDistribution(current: Record<string, number>, themes: string[]) {
  if (!themes.length) {
    return {};
  }

  const baseValue = Math.floor(100 / themes.length);
  let remaining = 100;
  const next: Record<string, number> = {};

  themes.forEach((theme, index) => {
    const fallback = index === themes.length - 1 ? remaining : baseValue;
    const value = current[theme] ?? fallback;
    next[theme] = value;
    remaining -= value;
  });

  if (remaining !== 0) {
    const lastTheme = themes[themes.length - 1];
    next[lastTheme] = Math.max(0, (next[lastTheme] ?? 0) + remaining);
  }

  return next;
}

