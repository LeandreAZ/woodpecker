import type { ReactNode } from 'react';
import { ArrowLeft, FileX2, LockKeyhole, ServerCrash, WifiOff, CodeXml, Inbox, RotateCcw } from 'lucide-react';
import { ApiError, NetworkError } from '../../shared/api/client';
import { LoadingButton } from './LoadingButton';

type StateKind = '404' | '403' | '500' | 'network' | 'api' | 'empty';
const states = {
  '404': { icon: FileX2, title: 'Page introuvable', description: 'Cette page n’existe pas ou a été déplacée.' },
  '403': { icon: LockKeyhole, title: 'Accès refusé', description: 'Vous n’avez pas les permissions nécessaires pour accéder à cette ressource.' },
  '500': { icon: ServerCrash, title: 'Erreur serveur', description: 'Une erreur est survenue côté serveur. Veuillez réessayer plus tard.' },
  network: { icon: WifiOff, title: 'Connexion impossible', description: 'Impossible de communiquer avec le serveur. Vérifiez votre connexion puis réessayez.' },
  api: { icon: CodeXml, title: 'Erreur API', description: 'Une erreur est survenue lors de la récupération des données. Veuillez réessayer.' },
  empty: { icon: Inbox, title: 'Aucun entraînement', description: 'Vous n’avez pas encore créé d’entraînement. Commencez dès maintenant !' },
};
export function StatePanel({ kind, title, description, action, onBack, onRetry, retrying = false, compact = false }: {
  kind: StateKind; title?: ReactNode; description?: ReactNode; action?: ReactNode;
  onBack?: () => void; onRetry?: () => void; retrying?: boolean; compact?: boolean;
}) {
  const state = states[kind];
  const Icon = state.icon;
  return <section className={`ui-state-panel${compact ? ' ui-state-panel--compact' : ''}`} role={kind === 'empty' ? 'status' : 'alert'}>
    <div className="ui-state-panel__icon"><Icon aria-hidden="true" size={64} strokeWidth={1.8} /></div>
    {['404', '403', '500'].includes(kind) ? <strong className="ui-state-panel__code">{kind}</strong> : null}
    <h2>{title ?? state.title}</h2><p>{description ?? state.description}</p>
    <div className="ui-state-panel__actions">
      {action}
      {onRetry ? <LoadingButton className="wp-secondary" loading={retrying} loadingLabel="Chargement…" onClick={onRetry}><RotateCcw aria-hidden="true" size={18} /><span>Réessayer</span></LoadingButton> : null}
      {onBack ? <button className="wp-secondary" type="button" onClick={onBack}><ArrowLeft aria-hidden="true" size={18} /><span>Retour aux entraînements</span></button> : null}
    </div>
  </section>;
}
export function ErrorState({ error, title, ...props }: { error: unknown; title?: string; onRetry?: () => void; onBack?: () => void; retrying?: boolean; compact?: boolean }) {
  const kind: StateKind = error instanceof NetworkError ? 'network' : error instanceof ApiError && error.status === 404 ? '404' : error instanceof ApiError && error.status === 403 ? '403' : error instanceof ApiError && error.status >= 500 ? '500' : 'api';
  return <StatePanel {...props} kind={kind} title={kind === 'api' ? title : undefined} />;
}
