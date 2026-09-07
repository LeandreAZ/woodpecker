import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { TrainingPuzzle } from '../../trainings/types/training.types';

export function SolverControls({ previousPuzzle, nextPuzzle, switchPuzzle }: { previousPuzzle: TrainingPuzzle | null; nextPuzzle: TrainingPuzzle | null; switchPuzzle: (trainingPuzzleIri: string) => void }) {
  return (
    <div className="wp-solver-board-nav-v2"><button className="wp-secondary wp-solver-nav-button" disabled={!previousPuzzle} type="button" onClick={() => { if (previousPuzzle) switchPuzzle(previousPuzzle['@id']); }}><ChevronLeft aria-hidden="true" size={18} strokeWidth={2} /><span>Précédent</span></button><button className="wp-primary wp-solver-nav-button" disabled={!nextPuzzle} type="button" onClick={() => { if (nextPuzzle) switchPuzzle(nextPuzzle['@id']); }}><span>Suivant</span><ChevronRight aria-hidden="true" size={18} strokeWidth={2} /></button></div>
  );
}
