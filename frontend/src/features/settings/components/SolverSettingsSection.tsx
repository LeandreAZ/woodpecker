import {
  Eye,
  Languages
} from 'lucide-react';
import type { Dispatch, ReactNode, SetStateAction } from 'react';
import type { DraftSettings } from '../types/settingsView.types';

export function ToggleRow({ checked, description, icon, label, onChange }: { checked: boolean; description: string; icon: ReactNode; label: string; onChange: (nextValue: boolean) => void; }) {
  return (
    <label className="wp-settings-v2-toggle">
      <span className="wp-settings-v2-toggle__copy">
        <span className="wp-settings-v2-toggle__icon">{icon}</span>
        <span>
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </span>
      <span className={`wp-settings-v2-switch${checked ? ' is-on' : ''}`}>
        <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <span className="wp-settings-v2-switch__track"><span className="wp-settings-v2-switch__thumb" /></span>
      </span>
    </label>
  );
}

export function SolverSettingsSection({ draft, setDraft }: { draft: DraftSettings; setDraft: Dispatch<SetStateAction<DraftSettings>> }) {
  return (
    <section className="wp-panel wp-settings-v2-card">
      <div className="wp-settings-v2-card__title"><Eye size={18} strokeWidth={1.9} /><h3>Préférences du Solver</h3></div>
      <div className="wp-settings-v2-toggle-list">
        <ToggleRow checked={draft.solverPreferences.showCoordinates} description="Affiche les coordonnées sur l'échiquier du solver et l'aperçu." icon={<Languages size={18} strokeWidth={1.9} />} label="Afficher les coordonnées" onChange={(nextValue) => setDraft((current) => ({ ...current, solverPreferences: { ...current.solverPreferences, showCoordinates: nextValue } }))} />
        <ToggleRow checked={draft.solverPreferences.showLegalMoves} description="Affiche les coups légaux dans le solver et l'aperçu quand une pièce est sélectionnée." icon={<Eye size={18} strokeWidth={1.9} />} label="Afficher les coups légaux" onChange={(nextValue) => setDraft((current) => ({ ...current, solverPreferences: { ...current.solverPreferences, showLegalMoves: nextValue } }))} />
      </div>
    </section>
  );
}
