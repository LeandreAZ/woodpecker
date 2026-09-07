import { QueryClientContext } from '@tanstack/react-query';
import {
  Save,
  Trash2
} from 'lucide-react';
import type { FormEvent } from 'react';
import { useContext, useEffect, useMemo, useState } from 'react';
import { apiMultipartRequest, apiRequest } from '../../../shared/api/client';
import { Input, Modal } from '../../../shared/ui';
import { LoadingButton } from '../../../shared/ui/LoadingButton';
import { loadStoredSession, saveStoredSession } from '../../auth/services/authStorage';
import {
  normalizeHexColor
} from '../../solver/services/chessboardPreferences';
import { PageHeader } from '../../trainings/components/primitives/TrainingsViewPrimitives';
import { AppearanceSettingsSection } from '../components/AppearanceSettingsSection';
import { BoardSettingsSection } from '../components/BoardSettingsSection';
import { InteractiveBoardPreview } from '../components/InteractiveBoardPreview';
import { ProfileSettingsSection } from '../components/ProfileSettingsSection';
import { ModalShell } from '../components/SettingsModalShell';
import { SolverSettingsSection } from '../components/SolverSettingsSection';
import '../styles/settings.css';
import type { UserSettingsOverview } from '../types/settings.types';
import type { DraftSettings, FeedbackTone, ModalState, TrainingsSettingsViewProps } from '../types/settingsView.types';
import { applyTheme, createDraft } from '../utils/settingsDraft';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;

async function requireSessionToken() {
  const session = loadStoredSession();
  if (!session?.token) {
    throw new Error('Votre session locale n\'est plus disponible. Reconnectez-vous.');
  }

  return session;
}

function TrainingsSettingsView({ errorMessage, isError, isLoading, isSaving, onSave, saveErrorMessage, settingsOverview }: TrainingsSettingsViewProps) {
  const [draft, setDraft] = useState<DraftSettings>(() => createDraft(settingsOverview));
  const [boardDraft, setBoardDraft] = useState<DraftSettings['board']>(() => createDraft(settingsOverview).board);
  const [modal, setModal] = useState<ModalState>(null);
  const queryClient = useContext(QueryClientContext);
  const [feedback, setFeedback] = useState<{ tone: FeedbackTone; value: string } | null>(null);
  const [emailDraft, setEmailDraft] = useState({ currentPassword: '', email: settingsOverview?.user.email ?? '' });
  const [passwordDraft, setPasswordDraft] = useState({ confirmPassword: '', currentPassword: '', newPassword: '' });
  const [deleteDraft, setDeleteDraft] = useState({ currentPassword: '', email: settingsOverview?.user.email ?? '' });
  const [isSavingCredential, setIsSavingCredential] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  const [hydratedOverview, setHydratedOverview] = useState(settingsOverview);
  if (hydratedOverview !== settingsOverview) {
    const previousDraft = createDraft(hydratedOverview);
    const nextDraft = createDraft(settingsOverview);
    const identityChanged = hydratedOverview?.user.id !== settingsOverview?.user.id;
    const hydratePristine = <T,>(current: T, previous: T, next: T): T =>
      identityChanged || JSON.stringify(current) === JSON.stringify(previous) ? next : current;
    setHydratedOverview(settingsOverview);
    setDraft({
      profile: hydratePristine(draft.profile, previousDraft.profile, nextDraft.profile),
      appearance: hydratePristine(draft.appearance, previousDraft.appearance, nextDraft.appearance),
      board: hydratePristine(draft.board, previousDraft.board, nextDraft.board),
      solverPreferences: hydratePristine(draft.solverPreferences, previousDraft.solverPreferences, nextDraft.solverPreferences),
    });
    setBoardDraft(hydratePristine(boardDraft, previousDraft.board, nextDraft.board));
    const previousEmail = { currentPassword: '', email: hydratedOverview?.user.email ?? '' };
    const nextEmail = { currentPassword: '', email: settingsOverview?.user.email ?? '' };
    setEmailDraft(hydratePristine(emailDraft, previousEmail, nextEmail));
    setDeleteDraft(hydratePristine(deleteDraft, previousEmail, nextEmail));
    if (identityChanged) setPasswordDraft({ confirmPassword: '', currentPassword: '', newPassword: '' });
  }

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
            <ProfileSettingsSection draft={draft} setDraft={setDraft} settingsOverview={settingsOverview} isUploadingAvatar={isUploadingAvatar} handleAvatarUpload={handleAvatarUpload} setModal={setModal} />

            <AppearanceSettingsSection draft={draft} setDraft={setDraft} />

            <BoardSettingsSection draft={draft} settingsOverview={settingsOverview} setBoardDraft={setBoardDraft} setModal={setModal} />

            <SolverSettingsSection draft={draft} setDraft={setDraft} />
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

export { TrainingsSettingsView };

export default TrainingsSettingsView;
