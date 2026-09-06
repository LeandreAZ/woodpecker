import { QueryClientContext } from '@tanstack/react-query';
import { LoadingButton } from '../../components/ui/LoadingButton';
import type { CSSProperties, FormEvent, ReactNode } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import {
  Camera,
  LoaderCircle,
  Eye,
  Languages,
  Moon,
  Palette,
  Pencil,
  Save,
  Sun,
  Trash2,
  UserRound,
  X,
} from 'lucide-react';
import { apiMultipartRequest, apiRequest } from '../../shared/api/client';
import { loadStoredSession, saveStoredSession } from '../auth/authStorage';
import { Input, Modal } from '../../components/ui';
import { LanguagePicker } from './LanguagePicker';
import {
  DEFAULT_BOARD_FEN,
  DEFAULT_DARK_SQUARE_COLOR,
  DEFAULT_LIGHT_SQUARE_COLOR,
  type BoardColorPalette,
  type SupportedLanguage,
  type SupportedTheme,
  buildDropSquareStyle,
  buildSelectedSquareStyles,
  normalizeHexColor,
} from './chessboardPreferences';
import { PageHeader } from './TrainingsViewPrimitives';
import type { UserSettingsOverview } from './trainingsTypes';
import './settings-v2.css';

type SavePayload = {
  appearance: UserSettingsOverview['appearance'];
  board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
  profile: { pseudonym: string };
  solverPreferences: UserSettingsOverview['solverPreferences'];
};

type TrainingsSettingsViewProps = {
  errorMessage?: string;
  isError: boolean;
  isLoading: boolean;
  isSaving: boolean;
  onSave: (value: SavePayload) => Promise<UserSettingsOverview>;
  saveErrorMessage?: string;
  settingsOverview: UserSettingsOverview | null;
};

type DraftSettings = {
  appearance: UserSettingsOverview['appearance'];
  board: Pick<UserSettingsOverview['board'], 'darkSquareColor' | 'lightSquareColor'>;
  profile: {
    avatarUrl: string | null;
    pseudonym: string;
  };
  solverPreferences: UserSettingsOverview['solverPreferences'];
};

type FeedbackTone = 'error' | 'info' | 'success';

type ModalState = 'board' | 'delete' | 'email' | 'password' | null;

const AVATAR_ACCEPT = '.jpg,.jpeg,.png,.webp';
const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

const THEME_STORAGE_KEY = 'woodpecker-theme';
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

function createDraft(settingsOverview: UserSettingsOverview | null): DraftSettings {
  return {
    profile: {
      avatarUrl: settingsOverview?.profile.avatarUrl ?? null,
      pseudonym: (settingsOverview?.profile as { pseudonym?: string; displayName?: string } | undefined)?.pseudonym
        ?? settingsOverview?.profile.displayName
        ?? '',
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


function SettingsAvatar({ avatarUrl, pseudonym }: { avatarUrl: string | null; pseudonym: string }) {
  if (avatarUrl) {
    return <img alt={pseudonym || 'Avatar utilisateur'} className="wp-settings-v2-avatar" src={avatarUrl} />;
  }

  return (
    <div className="wp-settings-v2-avatar wp-settings-v2-avatar--fallback" aria-hidden="true">
      <UserRound size={42} strokeWidth={1.9} />
    </div>
  );
}

function ToggleRow({ checked, description, icon, label, onChange }: { checked: boolean; description: string; icon: ReactNode; label: string; onChange: (nextValue: boolean) => void; }) {
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

function InteractiveBoardPreview({ palette, showCoordinates, showLegalMoves }: { palette: BoardColorPalette; showCoordinates: boolean; showLegalMoves: boolean; }) {
  const [game] = useState(() => new Chess(DEFAULT_BOARD_FEN));
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);

  useEffect(() => {
    setSelectedSquare(null);
  }, [showLegalMoves, showCoordinates, palette.darkSquareColor, palette.lightSquareColor]);

  const legalSquares = useMemo(() => {
    if (!selectedSquare || !showLegalMoves) {
      return [] as string[];
    }

    return game.moves({ square: selectedSquare as never, verbose: true }).map((move) => move.to);
  }, [game, selectedSquare, showLegalMoves]);

  const squareStyles = useMemo(() => {
    const styles: Record<string, CSSProperties> = {};
    if (selectedSquare) {
      styles[selectedSquare] = buildSelectedSquareStyles(palette);
    }

    legalSquares.forEach((square) => {
      styles[square] = {
        ...(styles[square] ?? {}),
        ...buildDropSquareStyle(palette),
      };
    });

    return styles;
  }, [legalSquares, palette, selectedSquare]);

  return (
    <div className="wp-settings-v2-board-preview">
      <Chessboard
        options={{
          id: 'woodpecker-settings-board-preview-v2',
          position: DEFAULT_BOARD_FEN,
          allowDragging: false,
          allowDrawingArrows: false,
          showNotation: showCoordinates,
          showAnimations: true,
          animationDurationInMs: 180,
          onSquareClick: (...args) => {
            const square = typeof args[0] === 'string' ? args[0] : args[0]?.square;
            if (!square) {
              return;
            }
            const piece = game.get(square as never);
            if (selectedSquare === square) {
              setSelectedSquare(null);
              return;
            }
            if (piece && piece.color === game.turn()) {
              setSelectedSquare(square);
              return;
            }
            setSelectedSquare(null);
          },
          boardStyle: {
            aspectRatio: '1 / 1',
            border: '1px solid rgba(238, 244, 251, 0.12)',
            borderRadius: '5px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.22)',
            height: 'auto',
            width: '100%',
          },
          darkSquareStyle: { backgroundColor: palette.darkSquareColor },
          lightSquareStyle: { backgroundColor: palette.lightSquareColor },
          dropSquareStyle: buildDropSquareStyle(palette),
          squareStyles,
        }}
      />
    </div>
  );
}

function ModalShell({ children, feedback, onClose, subtitle, title }: { feedback?: ReactNode; children: ReactNode; onClose: () => void; subtitle?: string; title: string; }) {
  return (
    <div className="wp-settings-v2-modal-card">
      <div className="wp-settings-v2-modal-card__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <button aria-label="Fermer" className="ui-modal-close wp-settings-v2-modal-card__close" type="button" onClick={onClose}>
          <X size={18} strokeWidth={1.9} />
        </button>
      </div>
      <div className="wp-settings-v2-modal-card__divider" />
      <div className="wp-settings-v2-modal-card__body">{feedback}{children}</div>
    </div>
  );
}

async function requireSessionToken() {
  const session = loadStoredSession();
  if (!session?.token) {
    throw new Error('Votre session locale n\'est plus disponible. Reconnectez-vous.');
  }

  return session;
}

function TrainingsSettingsViewV2({ errorMessage, isError, isLoading, isSaving, onSave, saveErrorMessage, settingsOverview }: TrainingsSettingsViewProps) {
  const [draft, setDraft] = useState<DraftSettings>(() => createDraft(settingsOverview));
  const [boardDraft, setBoardDraft] = useState<DraftSettings['board']>(() => createDraft(settingsOverview).board);
  const [modal, setModal] = useState<ModalState>(null);
  const queryClient = useContext(QueryClientContext);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; value: string } | null>(null);
  const [emailDraft, setEmailDraft] = useState({ currentPassword: '', email: '' });
  const [passwordDraft, setPasswordDraft] = useState({ confirmPassword: '', currentPassword: '', newPassword: '' });
  const [deleteDraft, setDeleteDraft] = useState({ currentPassword: '', email: '' });
  const [isSavingCredential, setIsSavingCredential] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    const nextDraft = createDraft(settingsOverview);
    setDraft(nextDraft);
    setBoardDraft(nextDraft.board);
    setEmailDraft({ currentPassword: '', email: settingsOverview?.user.email ?? '' });
    setDeleteDraft({ currentPassword: '', email: settingsOverview?.user.email ?? '' });
    setPasswordDraft({ confirmPassword: '', currentPassword: '', newPassword: '' });
  }, [settingsOverview]);

  useEffect(() => {
    applyTheme(draft.appearance.theme);
  }, [draft.appearance.theme]);

  const isDirty = useMemo(() => JSON.stringify(createDraft(settingsOverview)) !== JSON.stringify(draft), [draft, settingsOverview]);

  async function persistDraft(nextDraft: DraftSettings, message: string) {
    setFeedback(null);
    try {
    const payload = await onSave({
      appearance: nextDraft.appearance,
      board: nextDraft.board,
      profile: { pseudonym: nextDraft.profile.pseudonym.trim() },
      solverPreferences: nextDraft.solverPreferences,
    });
    applyTheme(nextDraft.appearance.theme);
    const syncedDraft = createDraft(payload);
    setDraft(syncedDraft);
    setBoardDraft(syncedDraft.board);
    setFeedback({ tone: 'success', value: message });
    return true;
    } catch (error) {
      setFeedback({ tone: 'error', value: error instanceof Error ? error.message : 'Impossible d’enregistrer les préférences.' });
      return false;
    }
  }

  async function handleSettingsSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSaving) return;
    await persistDraft(draft, 'Préférences enregistrées.');
  }

  async function handleBoardSave() {
    if (isSaving) return;
    const nextBoard = {
      darkSquareColor: normalizeHexColor(boardDraft.darkSquareColor, draft.board.darkSquareColor),
      lightSquareColor: normalizeHexColor(boardDraft.lightSquareColor, draft.board.lightSquareColor),
    };
    const nextDraft = { ...draft, board: nextBoard };
    setBoardDraft(nextBoard);
    if (await persistDraft(nextDraft, 'Palette de l\'échiquier enregistrée.')) setModal(null);
  }

  async function handleAvatarUpload(file: File | null) {
    if (!file || isUploadingAvatar) {
      return;
    }

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setFeedback({ tone: 'error', value: 'Le format de la photo doit être JPEG, PNG ou WebP.' });
      return;
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      setFeedback({ tone: 'error', value: 'La photo de profil ne doit pas dépasser 2 Mo.' });
      return;
    }

    setIsUploadingAvatar(true);
    setFeedback(null);

    try {
      const session = await requireSessionToken();
      const formData = new FormData();
      formData.append('avatar', file);
      const payload = await apiMultipartRequest<UserSettingsOverview>('/users/me/avatar', formData, { method: 'POST', token: session.token });
      queryClient?.setQueryData(['user-settings-overview', session.email], payload);
      const nextDraft = createDraft(payload);
      setDraft(nextDraft);
      setBoardDraft(nextDraft.board);
      setFeedback({ tone: 'success', value: 'Photo de profil mise à jour.' });
    } catch (error) {
      setFeedback({ tone: 'error', value: error instanceof Error ? error.message : 'Impossible de mettre à jour la photo de profil.' });
    } finally {
      setIsUploadingAvatar(false);
    }
  }

  async function handleEmailSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingCredential) return;
    setIsSavingCredential(true);
    setFeedback(null);
    try {
      const session = await requireSessionToken();
      const payload = await apiRequest<UserSettingsOverview>('/users/me/email', {
        method: 'PUT',
        token: session.token,
        body: emailDraft,
      });
      saveStoredSession({ ...session, email: payload.user.email });
      queryClient?.setQueryData(['user-settings-overview', session.email], payload);
      setDraft(createDraft(payload));
      setModal(null);
      setEmailDraft({ currentPassword: '', email: payload.user.email });
      setFeedback({ tone: 'success', value: 'Adresse e-mail mise à jour.' });
    } catch (error) {
      setFeedback({ tone: 'error', value: error instanceof Error ? error.message : 'Impossible de mettre à jour l\'adresse e-mail.' });
    } finally {
      setIsSavingCredential(false);
    }
  }

  async function handlePasswordSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingCredential) return;
    if (passwordDraft.newPassword.length < 8) {
      setFeedback({ tone: 'error', value: 'Saisissez au moins 8 caractères.' });
      return;
    }
    setIsSavingCredential(true);
    setFeedback(null);
    try {
      const session = await requireSessionToken();
      await apiRequest<{ message: string }>('/users/me/password', {
        method: 'PUT',
        token: session.token,
        body: passwordDraft,
      });
      setPasswordDraft({ confirmPassword: '', currentPassword: '', newPassword: '' });
      setModal(null);
      setFeedback({ tone: 'success', value: 'Mot de passe mis à jour.' });
    } catch (error) {
      setFeedback({ tone: 'error', value: error instanceof Error ? error.message : 'Impossible de mettre à jour le mot de passe.' });
    } finally {
      setIsSavingCredential(false);
    }
  }

  async function handleDelete(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSavingCredential) return;
    setIsSavingCredential(true);
    setFeedback(null);
    try {
      const session = await requireSessionToken();
      await apiRequest<void>('/users/me', {
        method: 'DELETE',
        token: session.token,
        body: deleteDraft,
      });
      saveStoredSession(null);
      window.location.reload();
    } catch (error) {
      setFeedback({ tone: 'error', value: error instanceof Error ? error.message : 'Impossible de supprimer le compte.' });
      setIsSavingCredential(false);
    }
  }

  return (
    <div className="wp-page wp-settings-v2-page">
      <PageHeader title="Paramètres" description="Gérez votre profil et personnalisez votre expérience Woodpecker." />
      {isLoading ? <p className="wp-empty">Chargement des paramètres...</p> : null}
      {isError && errorMessage ? <p className="alert error-alert">{errorMessage}</p> : null}
      {saveErrorMessage ? <p className="alert error-alert">{saveErrorMessage}</p> : null}
      {feedback && !modal ? <p role={feedback.tone === 'error' ? 'alert' : 'status'} className={`alert ${feedback.tone === 'error' ? 'error-alert' : 'info-alert'}`}>{feedback.value}</p> : null}

      {settingsOverview ? (
        <form className="wp-settings-v2-form" onSubmit={handleSettingsSubmit}>
          <div className="wp-settings-v2-grid">
            <section className="wp-panel wp-settings-v2-card">
              <div className="wp-settings-v2-card__title"><UserRound size={18} strokeWidth={1.9} /><h3>Profil</h3></div>
              <div className="wp-settings-v2-profile-head">
                <label className="wp-settings-v2-avatar-wrap">
                  <input aria-label="Modifier la photo de profil" disabled={isUploadingAvatar} accept={AVATAR_ACCEPT} className="wp-settings-v2-avatar-input" type="file" onChange={(event) => void handleAvatarUpload(event.target.files?.[0] ?? null)} />
                  <SettingsAvatar avatarUrl={draft.profile.avatarUrl} pseudonym={draft.profile.pseudonym} />
                  <span className="wp-settings-v2-avatar-trigger" aria-hidden="true"><>{isUploadingAvatar ? <LoaderCircle className="ui-spinner" size={16} /> : <Camera size={16} strokeWidth={1.9} />}</></span>
                </label>
                <div className="wp-settings-v2-profile-copy">
                  <strong>{draft.profile.pseudonym || 'Profil Woodpecker'}</strong>
                  <p className="wp-settings-v2-email-value" title={settingsOverview.user.email}>{settingsOverview.user.email}</p>
                  {isUploadingAvatar ? <p>Envoi de la photo en cours...</p> : null}
                </div>
              </div>
              <label className="wp-settings-v2-field">
                <span>Pseudonyme</span>
                <Input maxLength={80} value={draft.profile.pseudonym} onChange={(event) => setDraft((current) => ({ ...current, profile: { ...current.profile, pseudonym: event.target.value } }))} />
              </label>
              <div className="wp-settings-v2-inline-action-field">
                <div className="wp-settings-v2-inline-action-field__content">
                  <span className="wp-settings-v2-inline-action-field__label">Adresse e-mail</span>
                  <strong className="wp-settings-v2-email-value" title={settingsOverview.user.email}>{settingsOverview.user.email}</strong>
                </div>
                <button aria-label="Modifier l'adresse e-mail" className="wp-secondary wp-settings-v2-icon-button" title="Modifier l'adresse e-mail" type="button" onClick={() => setModal('email')}><Pencil size={16} strokeWidth={1.9} /></button>
              </div>
              <div className="wp-settings-v2-inline-action-field">
                <div className="wp-settings-v2-inline-action-field__content">
                  <span className="wp-settings-v2-inline-action-field__label">Mot de passe</span>
                  <strong>••••••••</strong>
                </div>
                <button aria-label="Modifier le mot de passe" className="wp-secondary wp-settings-v2-icon-button" title="Modifier le mot de passe" type="button" onClick={() => setModal('password')}><Pencil size={16} strokeWidth={1.9} /></button>
              </div>
            </section>

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

            <section className="wp-panel wp-settings-v2-card">
              <div className="wp-settings-v2-card__title"><Eye size={18} strokeWidth={1.9} /><h3>Préférences du Solver</h3></div>
              <div className="wp-settings-v2-toggle-list">
                <ToggleRow checked={draft.solverPreferences.showCoordinates} description="Affiche les coordonnées sur l'échiquier du solver et l'aperçu." icon={<Languages size={18} strokeWidth={1.9} />} label="Afficher les coordonnées" onChange={(nextValue) => setDraft((current) => ({ ...current, solverPreferences: { ...current.solverPreferences, showCoordinates: nextValue } }))} />
                <ToggleRow checked={draft.solverPreferences.showLegalMoves} description="Affiche les coups légaux dans le solver et l'aperçu quand une pièce est sélectionnée." icon={<Eye size={18} strokeWidth={1.9} />} label="Afficher les coups légaux" onChange={(nextValue) => setDraft((current) => ({ ...current, solverPreferences: { ...current.solverPreferences, showLegalMoves: nextValue } }))} />
              </div>
            </section>
          </div>

          <div className="wp-settings-v2-footer-actions">
            <LoadingButton loadingLabel="Enregistrement…" loading={isSaving} className="wp-primary" disabled={!isDirty || isSaving} type="submit"><Save size={18} strokeWidth={1.9} /><span>{isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}</span></LoadingButton>
          </div>

          <section className="wp-panel wp-settings-v2-card wp-settings-v2-card--danger">
            <div className="wp-settings-v2-card__title"><Trash2 size={18} strokeWidth={1.9} /><h3>Suppression du compte</h3></div>
            <p className="wp-settings-v2-danger-copy">Cette action supprime votre compte et les données associées à vos entraînements de manière définitive.</p>
            <button className="wp-secondary wp-settings-v2-danger-button" type="button" onClick={() => setModal('delete')}><Trash2 size={16} strokeWidth={1.9} /><span>Supprimer mon compte</span></button>
          </section>
        </form>
      ) : null}

      <Modal contentClassName="ui-modal__content--plain wp-settings-v2-board-dialog" open={modal === 'board'} onClose={() => setModal(null)}>
        <ModalShell feedback={feedback?.tone === 'error' ? <p role="alert" className="alert error-alert">{feedback.value}</p> : saveErrorMessage ? <p role="alert" className="alert error-alert">{saveErrorMessage}</p> : null} onClose={() => setModal(null)} subtitle="Prévisualisez vos modifications en temps réel." title="Personnaliser l'échiquier">
          <div className="wp-settings-v2-board-modal">
            <InteractiveBoardPreview palette={boardDraft} showCoordinates={draft.solverPreferences.showCoordinates} showLegalMoves={draft.solverPreferences.showLegalMoves} />
            <div className="wp-settings-v2-board-modal__controls">
              <label className="wp-settings-v2-field"><span>Cases claires</span><div className="wp-settings-v2-color-field"><label className="wp-settings-v2-color-swatch"><input type="color" value={normalizeHexColor(boardDraft.lightSquareColor, draft.board.lightSquareColor)} onChange={(event) => setBoardDraft((current) => ({ ...current, lightSquareColor: event.target.value.toUpperCase() }))} /><span style={{ backgroundColor: normalizeHexColor(boardDraft.lightSquareColor, draft.board.lightSquareColor) }} /></label><Input maxLength={7} value={boardDraft.lightSquareColor} onChange={(event) => setBoardDraft((current) => ({ ...current, lightSquareColor: event.target.value.toUpperCase() }))} /></div></label>
              <label className="wp-settings-v2-field"><span>Cases foncées</span><div className="wp-settings-v2-color-field"><label className="wp-settings-v2-color-swatch"><input type="color" value={normalizeHexColor(boardDraft.darkSquareColor, draft.board.darkSquareColor)} onChange={(event) => setBoardDraft((current) => ({ ...current, darkSquareColor: event.target.value.toUpperCase() }))} /><span style={{ backgroundColor: normalizeHexColor(boardDraft.darkSquareColor, draft.board.darkSquareColor) }} /></label><Input maxLength={7} value={boardDraft.darkSquareColor} onChange={(event) => setBoardDraft((current) => ({ ...current, darkSquareColor: event.target.value.toUpperCase() }))} /></div></label>
              <LoadingButton loadingLabel="Enregistrement…" loading={isSaving} className="wp-primary" disabled={isSaving} type="button" onClick={() => void handleBoardSave()}><Save size={16} strokeWidth={1.9} /><span>Enregistrer les modifications</span></LoadingButton>
            </div>
          </div>
        </ModalShell>
      </Modal>

      <Modal contentClassName="ui-modal__content--plain" open={modal === 'email'} onClose={() => setModal(null)}>
        <ModalShell feedback={feedback?.tone === 'error' ? <p role="alert" className="alert error-alert">{feedback.value}</p> : saveErrorMessage ? <p role="alert" className="alert error-alert">{saveErrorMessage}</p> : null} onClose={() => setModal(null)} title="Modifier l'adresse e-mail">
          <form className="wp-settings-v2-modal-form" onSubmit={(event) => void handleEmailSave(event)}>
            <label className="wp-settings-v2-field"><span>Nouvelle adresse e-mail</span><Input required type="email" autoComplete="email" value={emailDraft.email} onChange={(event) => setEmailDraft((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="wp-settings-v2-field"><span>Mot de passe actuel</span><Input required autoComplete="current-password" type="password" value={emailDraft.currentPassword} onChange={(event) => setEmailDraft((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
            <LoadingButton loadingLabel="Enregistrement…" loading={isSavingCredential} className="wp-primary" disabled={isSavingCredential} type="submit"><Save size={16} strokeWidth={1.9} /><span>{isSavingCredential ? 'Enregistrement...' : 'Enregistrer'}</span></LoadingButton>
          </form>
        </ModalShell>
      </Modal>

      <Modal contentClassName="ui-modal__content--plain" open={modal === 'password'} onClose={() => setModal(null)}>
        <ModalShell feedback={feedback?.tone === 'error' ? <p role="alert" className="alert error-alert">{feedback.value}</p> : saveErrorMessage ? <p role="alert" className="alert error-alert">{saveErrorMessage}</p> : null} onClose={() => setModal(null)} title="Modifier le mot de passe">
          <form className="wp-settings-v2-modal-form" onSubmit={(event) => void handlePasswordSave(event)}>
            <label className="wp-settings-v2-field"><span>Mot de passe actuel</span><Input required autoComplete="current-password" type="password" value={passwordDraft.currentPassword} onChange={(event) => setPasswordDraft((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
            <label className="wp-settings-v2-field"><span>Nouveau mot de passe</span><Input required minLength={8} autoComplete="new-password" type="password" value={passwordDraft.newPassword} onChange={(event) => setPasswordDraft((current) => ({ ...current, newPassword: event.target.value }))} /></label>
            <label className="wp-settings-v2-field"><span>Confirmation</span><Input required autoComplete="new-password" type="password" value={passwordDraft.confirmPassword} onChange={(event) => setPasswordDraft((current) => ({ ...current, confirmPassword: event.target.value }))} /></label>
            <LoadingButton loadingLabel="Enregistrement…" loading={isSavingCredential} className="wp-primary" disabled={isSavingCredential} type="submit"><Save size={16} strokeWidth={1.9} /><span>{isSavingCredential ? 'Enregistrement...' : 'Enregistrer'}</span></LoadingButton>
          </form>
        </ModalShell>
      </Modal>

      <Modal contentClassName="ui-modal__content--plain" open={modal === 'delete'} onClose={() => setModal(null)}>
        <ModalShell feedback={feedback?.tone === 'error' ? <p role="alert" className="alert error-alert">{feedback.value}</p> : saveErrorMessage ? <p role="alert" className="alert error-alert">{saveErrorMessage}</p> : null} onClose={() => setModal(null)} subtitle="Cette action est irréversible." title="Supprimer le compte">
          <form className="wp-settings-v2-modal-form" onSubmit={(event) => void handleDelete(event)}>
            <label className="wp-settings-v2-field"><span>Confirmez votre adresse e-mail</span><Input required type="email" autoComplete="email" value={deleteDraft.email} onChange={(event) => setDeleteDraft((current) => ({ ...current, email: event.target.value }))} /></label>
            <label className="wp-settings-v2-field"><span>Mot de passe actuel</span><Input required autoComplete="current-password" type="password" value={deleteDraft.currentPassword} onChange={(event) => setDeleteDraft((current) => ({ ...current, currentPassword: event.target.value }))} /></label>
            <LoadingButton loadingLabel="Suppression…" loading={isSavingCredential} className="wp-secondary wp-settings-v2-danger-button" disabled={isSavingCredential} type="submit"><Trash2 size={16} strokeWidth={1.9} /><span>{isSavingCredential ? 'Suppression...' : 'Supprimer définitivement'}</span></LoadingButton>
          </form>
        </ModalShell>
      </Modal>
    </div>
  );
}

export { TrainingsSettingsViewV2 };
export default TrainingsSettingsViewV2;




