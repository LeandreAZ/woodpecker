import {
  X
} from 'lucide-react';
import type { ReactNode } from 'react';

export function ModalShell({ children, feedback, onClose, subtitle, title }: { feedback?: ReactNode; children: ReactNode; onClose: () => void; subtitle?: string; title: string; }) {
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
