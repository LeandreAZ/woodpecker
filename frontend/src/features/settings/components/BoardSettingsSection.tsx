import {
  Palette
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import type { UserSettingsOverview } from '../types/settings.types';
import type { DraftSettings, ModalState } from '../types/settingsView.types';
import { InteractiveBoardPreview } from './InteractiveBoardPreview';

export function BoardSettingsSection({ draft, settingsOverview, setBoardDraft, setModal }: { draft: DraftSettings; settingsOverview: UserSettingsOverview; setBoardDraft: Dispatch<SetStateAction<DraftSettings['board']>>; setModal: Dispatch<SetStateAction<ModalState>> }) {
  return (
    <section className="wp-panel wp-settings-v2-card">
      <div className="wp-settings-v2-card__title"><Palette size={18} strokeWidth={1.9} /><h3>Échiquier</h3></div>
      <InteractiveBoardPreview palette={draft.board} showCoordinates={draft.solverPreferences.showCoordinates} showLegalMoves={draft.solverPreferences.showLegalMoves} />
      <div className="wp-settings-v2-board-meta">
        <div>
          <strong>Thème actuel</strong>
          <p>{settingsOverview.board.themeLabel}</p>
        </div>
        <div className="wp-settings-v2-color-pills"><span style={{ backgroundColor: draft.board.lightSquareColor }} /><span style={{ backgroundColor: draft.board.darkSquareColor }} /></div>
      </div>
      <button className="wp-secondary" type="button" onClick={() => { setBoardDraft(draft.board); setModal('board'); }}>Personnaliser l'échiquier</button>
    </section>
  );
}
