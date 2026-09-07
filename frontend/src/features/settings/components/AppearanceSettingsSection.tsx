import {
  Languages,
  Moon,
  Sun
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import {
  type SupportedLanguage
} from '../../solver/services/chessboardPreferences';
import { LanguagePicker } from '../components/LanguagePicker';
import type { DraftSettings } from '../types/settingsView.types';

const LANGUAGE_OPTIONS: Array<{ available: boolean; code: SupportedLanguage; countryCode: string; label: string }> = [
  { available: true, code: 'fr', countryCode: 'FR', label: 'Français' },
  { available: false, code: 'en', countryCode: 'GB', label: 'English' },
  { available: false, code: 'es', countryCode: 'ES', label: 'Español' },
  { available: false, code: 'pt', countryCode: 'PT', label: 'Português' },
  { available: false, code: 'de', countryCode: 'DE', label: 'Deutsch' },
  { available: false, code: 'ru', countryCode: 'RU', label: 'Русский' },
  { available: false, code: 'zh', countryCode: 'CN', label: '中文' },
  { available: false, code: 'ja', countryCode: 'JP', label: '日本語' },
  { available: false, code: 'ko', countryCode: 'KR', label: '한국어' },
];

export function AppearanceSettingsSection({ draft, setDraft }: { draft: DraftSettings; setDraft: Dispatch<SetStateAction<DraftSettings>> }) {
  return (
    <section className="wp-panel wp-settings-v2-card">
      <div className="wp-settings-v2-card__title"><Languages size={18} strokeWidth={1.9} /><h3>Apparence</h3></div>
      <div className="wp-settings-v2-theme-grid">
        <button disabled title="Le choix du thème sera disponible prochainement." aria-disabled="true" className={`wp-settings-v2-theme-option${draft.appearance.theme === 'dark' ? ' is-selected' : ''}`} type="button"><Moon size={18} strokeWidth={1.9} /><span>Sombre</span></button>
        <button disabled title="Le choix du thème sera disponible prochainement." aria-disabled="true" className={`wp-settings-v2-theme-option${draft.appearance.theme === 'light' ? ' is-selected' : ''}`} type="button"><Sun size={18} strokeWidth={1.9} /><span>Clair</span></button>
      </div>
      <label className="wp-settings-v2-field">
        <span>Langue</span>
        <LanguagePicker
          options={LANGUAGE_OPTIONS}
          value={draft.appearance.language}
          onChange={(nextLanguage) => setDraft((current) => ({
            ...current,
            appearance: { ...current.appearance, language: nextLanguage },
          }))}
        />
      </label>
    </section>
  );
}
