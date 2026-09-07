import {
  Camera,
  LoaderCircle,
  Pencil,
  UserRound
} from 'lucide-react';
import type { Dispatch, SetStateAction } from 'react';
import { Input } from '../../../shared/ui';
import type { UserSettingsOverview } from '../types/settings.types';
import type { DraftSettings, ModalState } from '../types/settingsView.types';

export const AVATAR_ACCEPT = '.jpg,.jpeg,.png,.webp';

export function SettingsAvatar({ avatarUrl, pseudonym }: { avatarUrl: string | null; pseudonym: string }) {
  if (avatarUrl) {
    return <img alt={pseudonym || 'Avatar utilisateur'} className="wp-settings-v2-avatar" src={avatarUrl} />;
  }

  return (
    <div className="wp-settings-v2-avatar wp-settings-v2-avatar--fallback" aria-hidden="true">
      <UserRound size={42} strokeWidth={1.9} />
    </div>
  );
}

export function ProfileSettingsSection({ draft, setDraft, settingsOverview, isUploadingAvatar, handleAvatarUpload, setModal }: { draft: DraftSettings; setDraft: Dispatch<SetStateAction<DraftSettings>>; settingsOverview: UserSettingsOverview; isUploadingAvatar: boolean; handleAvatarUpload: (file: File | null) => Promise<void>; setModal: Dispatch<SetStateAction<ModalState>> }) {
  return (
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
  );
}
