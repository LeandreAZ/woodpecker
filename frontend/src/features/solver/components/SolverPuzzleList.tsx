import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import * as AppIcons from '../../../shared/icons/AppIcons';
import type { CyclePuzzle, TrainingPuzzle } from '../../trainings/types/training.types';
import { getPuzzleListStatus } from '../domain/solverViewModel';

export function SolverPuzzleList({ isPuzzleListOpen, setIsPuzzleListOpen, selectedPosition, trainingPuzzles, visibleTrainingPuzzles, cyclePuzzles, selectedTrainingPuzzle, switchPuzzle, showPagination, puzzlePage, pageCount, setPuzzlePage }: { isPuzzleListOpen: boolean; setIsPuzzleListOpen: Dispatch<SetStateAction<boolean>>; selectedPosition: number | null; trainingPuzzles: TrainingPuzzle[]; visibleTrainingPuzzles: TrainingPuzzle[]; cyclePuzzles: CyclePuzzle[]; selectedTrainingPuzzle: TrainingPuzzle | null; switchPuzzle: (trainingPuzzleIri: string) => void; showPagination: boolean; puzzlePage: number; pageCount: number; setPuzzlePage: Dispatch<SetStateAction<number>> }) {
  return (
    <aside className={`wp-panel wp-solver-list-v2${isPuzzleListOpen ? ' is-open' : ''}`}>
      <div className="wp-solver-list-v2__header"><div><h3>{selectedPosition ? `Puzzle ${selectedPosition} / ${trainingPuzzles.length}` : 'Puzzle'}</h3></div><button className="wp-solver-list-v2__toggle wp-solver-list-v2__toggle--mobile" type="button" aria-label="Afficher la liste des puzzles" onClick={() => setIsPuzzleListOpen((current) => !current)}><AppIcons.BarsIcon /></button></div>
      <div className="wp-solver-list-v2__body">
        {visibleTrainingPuzzles.map((trainingPuzzle) => {
          const cyclePuzzle = cyclePuzzles.find((item) => item.trainingPuzzle === trainingPuzzle['@id']);
          const status = getPuzzleListStatus(cyclePuzzle);
          const isSelected = trainingPuzzle['@id'] === selectedTrainingPuzzle?.['@id'];
          const className = ['wp-solver-list-v2__row', isSelected ? 'is-active' : '', status.tone === 'solved' ? 'is-solved' : '', status.tone === 'failed' ? 'is-failed' : ''].filter(Boolean).join(' ');
          return <button className={className} key={trainingPuzzle['@id']} type="button" onClick={() => switchPuzzle(trainingPuzzle['@id'])}><span className={`wp-solver-list-v2__index tone-${status.tone}`} aria-hidden="true" /><span className="wp-solver-list-v2__position">{trainingPuzzle.position + 1}</span><span className="wp-solver-list-v2__status"><strong>{status.label}</strong></span></button>;
        })}
      </div>
      {showPagination ? <div className="wp-solver-list-v2__pager"><button className="wp-solver-list-v2__pager-button" disabled={puzzlePage === 0} type="button" onClick={() => setPuzzlePage((current) => Math.max(0, current - 1))}><ChevronLeft aria-hidden="true" size={18} strokeWidth={2} /><span>Précédent</span></button><button className="wp-solver-list-v2__pager-button" disabled={puzzlePage >= pageCount - 1} type="button" onClick={() => setPuzzlePage((current) => Math.min(pageCount - 1, current + 1))}><span>Suivant</span><ChevronRight aria-hidden="true" size={18} strokeWidth={2} /></button></div> : null}
    </aside>
  );
}
