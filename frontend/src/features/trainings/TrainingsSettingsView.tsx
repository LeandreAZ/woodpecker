import type { FormEvent, ReactNode } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { Chessboard } from 'react-chessboard';
import {
  Eye,
  Languages,
  Moon,
  Palette,
  Save,
  Sun,
  UserRound,
} from 'lucide-react';
import { Input, Modal, Select } from '../../components/ui';
import {
  DEFAULT_BOARD_FEN,
  DEFAULT_DARK_SQUARE_COLOR,
  DEFAULT_LIGHT_SQUARE_COLOR,
  type SupportedLanguage,
  type SupportedTheme,
  buildDropSquareStyle,
  normalizeHexColor,
} from './chessboardPreferences';
import { PageHeader } from './TrainingsViewPrimitives';
import type { UserSettingsOverview } from './trainingsTypes';
import './settings.css';

type TrainingsSettingsViewProps = {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (value: {
    appearance: UserSettingsOverview['appearance'];
    board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
    profile: Pick<UserSettingsOverview['profile'], 'displayName'>;
    solverPreferences: UserSettingsOverview['solverPreferences'];
  }) => Promise<unknown>;
  saveErrorMessage?: string;
  settingsOverview: UserSettingsOverview | null;
};

type DraftSettings = {
  appearance: UserSettingsOverview['appearance'];
  board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
  profile: Pick<UserSettingsOverview['profile'], 'displayName'>;
  solverPreferences: UserSettingsOverview['solverPreferences'];
};

const THEME_STORAGE_KEY = 'woodpecker-theme';
const LANGUAGE_OPTIONS: Array<{ available: boolean; code: SupportedLanguage; label: string }> = [
  { available: true, code: 'fr', label: '🇫🇷 Français' },
  { available: false, code: 'en', label: '🇬🇧 English' },
  { available: false, code: 'es', label: '🇪🇸 Español' },
  { available: false, code: 'pt', label: '🇵🇹 Português' },
  { available: false, code: 'de', label: '🇩🇪 Deutsch' },
  { available: false, code: 'ru', label: '🇷🇺 Русский' },
  { available: false, code: 'zh', label: '🇨🇳 中文' },
  { available: false, code: 'ja', label: '🇯🇵 日本語' },
  { available: false, code: 'ko', label: '🇰🇷 한국어' },
];

function createDraft(settingsOverview: UserSettingsOverview | null): DraftSettings {
  return {
    profile: {
      displayName: settingsOverview?.profile.displayName ?? '',
    },
    appearance: {
      language: settingsOverview?.appearance.language ?? 'fr',
      theme: settingsOverview?.appearance.theme ?? 'dark',
    },
    board: {
      lightSquareColor: settingsOverview?.board.lightSquareColor ?? DEFAULT_LIGHT_SQUARE_COLOR,
      darkSquareColor: settingsOverview?.board.darkSquareColor ?? DEFAULT_DARK_SQUARE_COLOR,
    },
    solverPreferences: {
      showLegalMoves: settingsOverview?.solverPreferences.showLegalMoves ?? true,
      showCoordinates: settingsOverview?.solverPreferences.showCoordinates ?? true,
      animateMoves: settingsOverview?.solverPreferences.animateMoves ?? true,
      showRightClickTargets: settingsOverview?.solverPreferences.showRightClickTargets ?? true,
    },
  };
}

function applyTheme(theme: SupportedTheme) {
  document.documentElement.dataset.theme = theme;
  document.body.dataset.theme = theme;
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
}

function BoardPreview({ darkSquareColor, lightSquareColor }: Pick<DraftSettings['board'], 'darkSquareColor' | 'lightSquareColor'>) {
  return (
    <div className="wp-settings-board-preview">
      <Chessboard
        options={{
          id: 'woodpecker-settings-board-preview',
          position: DEFAULT_BOARD_FEN,
          allowDragging: false,
          allowDrawingArrows: false,
          showNotation: true,
          animationDurationInMs: 180,
          showAnimations: true,
          boardStyle: {
            aspectRatio: '1 / 1',
            border: '1px solid rgba(238, 244, 251, 0.12)',
            borderRadius: '18px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
            height: 'auto',
            width: '100%',
          },
          darkSquareStyle: { backgroundColor: darkSquareColor },
          lightSquareStyle: { backgroundColor: lightSquareColor },
          dropSquareStyle: buildDropSquareStyle({ darkSquareColor, lightSquareColor }),
        }}
      />
    </div>
  );
}

function ToggleRow({
  checked,
  description,
  icon,
  label,
  onChange,
}: {
  checked: boolean;
  description: string;
  icon: ReactNode;
  label: string;
  onChange: (nextValue: boolean) => void;
}) {
  return (
    <label className="wp-settings-toggle">
      <span className="wp-settings-toggle__copy">
        <span className="wp-settings-toggle__icon">{icon}</span>
        <span>
          <strong>{label}</strong>
          <small>{description}</small>
        </span>
      </span>
      <span className={`wp-settings-switch${checked ? ' is-on' : ''}`}>
        <input checked={checked} type="checkbox" onChange={(event) => onChange(event.target.checked)} />
        <span className="wp-settings-switch__track">
          <span className="wp-settings-switch__thumb" />
        </span>
      </span>
    </label>
  );
}

function TrainingsSettingsView({
  errorMessage,
  isError,
  isLoading,
  isSaving,
  onSave,
  saveErrorMessage,
  settingsOverview,
}: TrainingsSettingsViewProps) {
  const [draft, setDraft] = useState<DraftSettings>(() => createDraft(settingsOverview));
  const [boardDraft, setBoardDraft] = useState<DraftSettings['board']>(() => createDraft(settingsOverview).board);
  const [isBoardModalOpen, setIsBoardModalOpen] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  useEffect(() => {
    const nextDraft = createDraft(settingsOverview);
    setDraft(nextDraft);
    setBoardDraft(nextDraft.board);
  }, [settingsOverview]);

  useEffect(() => {
    applyTheme(draft.appearance.theme);
  }, [draft.appearance.theme]);

  const isDirty = useMemo(() => {
    const initial = createDraft(settingsOverview);
    return JSON.stringify(initial) !== JSON.stringify(draft);
  }, [draft, settingsOverview]);

  async function persistDraft(nextDraft: DraftSettings, message: string) {
    setFeedbackMessage(null);
    await onSave(nextDraft);
    applyTheme(nextDraft.appearance.theme);
    setDraft(nextDraft);
    setFeedbackMessage(message);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await persistDraft(draft, 'Paramètres enregistrés.');
  }

  async function handleBoardSave() {
    const nextBoard = {
      lightSquareColor: normalizeHexColor(boardDraft.lightSquareColor, draft.board.lightSquareColor),
      darkSquareColor: normalizeHexColor(boardDraft.darkSquareColor, draft.board.darkSquareColor),
    };
    const nextDraft = {
      ...draft,
      board: nextBoard,
    };

    setBoardDraft(nextBoard);
    await persistDraft(nextDraft, 'Palette de l’échiquier enregistrée.');
    setIsBoardModalOpen(false);
  }

  function updateBoardDraft(key: keyof DraftSettings['board'], value: string) {
    setBoardDraft((current) => ({
      ...current,
      [key]: value.toUpperCase(),
    }));
  }

  return (
    <div className="wp-page wp-settings-page">
      <PageHeader
        title="Paramètres"
        description="Gérez votre profil et personnalisez votre expérience Woodpecker."
      />

      {isLoading ? <p className="wp-empty">Chargement des paramètres...</p> : null}
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
      {saveErrorMessage ? <p className="alert error-alert">{saveErrorMessage}</p> : null}
      {feedbackMessage ? <p className="alert info-alert">{feedbackMessage}</p> : null}

      {settingsOverview ? (
        <form className="wp-settings-layout" onSubmit={handleSubmit}>
          <section className="wp-panel wp-settings-card">
            <div className="wp-settings-card__title"><Eye aria-hidden="true" size={18} strokeWidth={1.9} /><h3>Profil</h3></div>
            <p className="wp-settings-card__description">Gérez les informations visibles associées à votre compte.</p>
            <div className="wp-settings-profile">
              <div className="wp-settings-avatar" aria-hidden="true">
                <UserRound size={44} strokeWidth={1.9} />
              </div>
              <div>
                <strong>{draft.profile.displayName || 'Profil Woodpecker'}</strong>
                <p>{settingsOverview.user.email}</p>
              </div>
            </div>
            <label className="wp-settings-field">
              <span>Nom affiché</span>
              <Input
                maxLength={80}
                value={draft.profile.displayName}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  profile: { ...current.profile, displayName: event.target.value },
                }))}
              />
            </label>
            <label className="wp-settings-field">
              <span>Adresse e-mail</span>
              <Input className="wp-settings-input--disabled" disabled value={settingsOverview.user.email} />
            </label>
            <button className="wp-primary" disabled={!isDirty || isSaving} type="submit">
              <Save aria-hidden="true" size={18} strokeWidth={1.9} />
              <span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span>
            </button>
          </section>

          <section className="wp-panel wp-settings-card">
            <div className="wp-settings-card__title"><Languages aria-hidden="true" size={18} strokeWidth={1.9} /><h3>Apparence</h3></div>
            <p className="wp-settings-card__description">Adaptez l'interface à vos préférences.</p>
            <div className="wp-settings-theme-grid">
              <button
                className={`wp-settings-theme-option${draft.appearance.theme === 'dark' ? ' is-selected' : ''}`}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, appearance: { ...current.appearance, theme: 'dark' } }))}
              >
                <Moon aria-hidden="true" size={18} strokeWidth={1.9} />
                <span>Sombre</span>
              </button>
              <button
                className={`wp-settings-theme-option${draft.appearance.theme === 'light' ? ' is-selected' : ''}`}
                type="button"
                onClick={() => setDraft((current) => ({ ...current, appearance: { ...current.appearance, theme: 'light' } }))}
              >
                <Sun aria-hidden="true" size={18} strokeWidth={1.9} />
                <span>Clair</span>
              </button>
            </div>
            <label className="wp-settings-field">
              <span>Langue</span>
              <Select
                value={draft.appearance.language}
                onChange={(event) => setDraft((current) => ({
                  ...current,
                  appearance: { ...current.appearance, language: event.target.value as SupportedLanguage },
                }))}
              >
                {LANGUAGE_OPTIONS.map((option) => (
                  <option disabled={!option.available} key={option.code} value={option.code}>
                    {option.available ? option.label : `${option.label} · Bientôt disponible`}
                  </option>
                ))}
              </Select>
            </label>
          </section>

          <section className="wp-panel wp-settings-card">
            <div className="wp-settings-card__title"><Palette aria-hidden="true" size={18} strokeWidth={1.9} /><h3>Échiquier</h3></div>
            <p className="wp-settings-card__description">Personnalisez l'apparence de votre échiquier.</p>
            <BoardPreview darkSquareColor={draft.board.darkSquareColor} lightSquareColor={draft.board.lightSquareColor} />
            <div className="wp-settings-board-meta">
              <div>
                <strong>Thème actuel</strong>
                <p>{settingsOverview.board.themeLabel}</p>
              </div>
              <div className="wp-settings-color-pills">
                <span style={{ background: draft.board.lightSquareColor }} />
                <span style={{ background: draft.board.darkSquareColor }} />
              </div>
            </div>
            <button
              className="wp-secondary"
              type="button"
              onClick={() => {
                setBoardDraft(draft.board);
                setIsBoardModalOpen(true);
              }}
            >
              Personnaliser l'échiquier
            </button>
          </section>

          <section className="wp-panel wp-settings-card">
            <div className="wp-settings-card__title"><Eye aria-hidden="true" size={18} strokeWidth={1.9} /><h3>Préférences du solver</h3></div>
            <p className="wp-settings-card__description">Choisissez les aides visibles pendant la résolution.</p>
            <div className="wp-settings-toggle-list">
              <ToggleRow
                checked={draft.solverPreferences.showCoordinates}
                description="Affiche les coordonnées a-h et 1-8 sur l'échiquier du solver."
                icon={<Languages size={18} strokeWidth={1.9} />}
                label="Afficher les coordonnées"
                onChange={(nextValue) => setDraft((current) => ({
                  ...current,
                  solverPreferences: { ...current.solverPreferences, showCoordinates: nextValue },
                }))}
              />
              <ToggleRow
                checked={draft.solverPreferences.showLegalMoves}
                description="Affiche les coups légaux quand une pièce est sélectionnée."
                icon={<Eye size={18} strokeWidth={1.9} />}
                label="Afficher les coups légaux"
                onChange={(nextValue) => setDraft((current) => ({
                  ...current,
                  solverPreferences: { ...current.solverPreferences, showLegalMoves: nextValue },
                }))}
              />
            </div>
          </section>

          <section className="wp-panel wp-settings-card wp-settings-card--wide">
            <div className="wp-settings-card__title"><UserRound aria-hidden="true" size={18} strokeWidth={1.9} /><h3>Compte et sécurité</h3></div>
            <p className="wp-settings-card__description">Les actions sécurisées du compte restent à finaliser côté interface et côté API dans cette passe.</p>
          </section>

          <Modal
            open={isBoardModalOpen}
            onClose={() => setIsBoardModalOpen(false)}
            title={<div className="wp-settings-modal-title"><h3>Personnaliser l'échiquier</h3><p>Prévisualisez vos modifications en temps réel.</p></div>}
          >
            <div className="ui-card wp-settings-modal">
              <BoardPreview darkSquareColor={boardDraft.darkSquareColor} lightSquareColor={boardDraft.lightSquareColor} />
              <div className="wp-settings-modal__controls">
                <label className="wp-settings-field">
                  <span>Cases claires</span>
                  <div className="wp-settings-color-field">
                    <label className="wp-settings-color-swatch">
                      <input
                        type="color"
                        value={normalizeHexColor(boardDraft.lightSquareColor, draft.board.lightSquareColor)}
                        onChange={(event) => updateBoardDraft('lightSquareColor', event.target.value)}
                      />
                      <span style={{ background: normalizeHexColor(boardDraft.lightSquareColor, draft.board.lightSquareColor) }} />
                    </label>
                    <Input
                      maxLength={7}
                      value={boardDraft.lightSquareColor}
                      onChange={(event) => updateBoardDraft('lightSquareColor', event.target.value)}
                    />
                  </div>
                </label>
                <label className="wp-settings-field">
                  <span>Cases foncées</span>
                  <div className="wp-settings-color-field">
                    <label className="wp-settings-color-swatch">
                      <input
                        type="color"
                        value={normalizeHexColor(boardDraft.darkSquareColor, draft.board.darkSquareColor)}
                        onChange={(event) => updateBoardDraft('darkSquareColor', event.target.value)}
                      />
                      <span style={{ background: normalizeHexColor(boardDraft.darkSquareColor, draft.board.darkSquareColor) }} />
                    </label>
                    <Input
                      maxLength={7}
                      value={boardDraft.darkSquareColor}
                      onChange={(event) => updateBoardDraft('darkSquareColor', event.target.value)}
                    />
                  </div>
                </label>
                <div className="wp-inline-actions wp-settings-modal__actions">
                  <button className="wp-secondary" type="button" onClick={() => setIsBoardModalOpen(false)}>Fermer</button>
                  <button className="wp-primary" disabled={isSaving} type="button" onClick={() => void handleBoardSave()}>
                    Enregistrer les modifications
                  </button>
                </div>
              </div>
            </div>
          </Modal>
        </form>
      ) : null}
    </div>
  );
}

export { TrainingsSettingsView };
export default TrainingsSettingsView;

