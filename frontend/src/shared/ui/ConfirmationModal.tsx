import { LoadingButton } from './LoadingButton';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import Modal from './Modal';

type ConfirmationModalProps = {
  confirmLabel: string;
  description: string;
  isDanger?: boolean;
  isPending?: boolean;
  onClose: () => void;
  onConfirm: () => void;
  open: boolean;
  title: string;
};

export function ConfirmationModal({
  confirmLabel,
  description,
  isDanger = false,
  isPending = false,
  onClose,
  onConfirm,
  open,
  title,
}: ConfirmationModalProps) {
  return (
    <Modal open={open} onClose={isPending ? undefined : onClose}>
      <div className="ui-confirmation-modal">
        <div className="ui-confirmation-modal__icon"><AlertTriangle size={32} strokeWidth={1.9} /></div>
        <div className="ui-confirmation-modal__copy">
          <h3>{title}</h3>
          <p>{description}</p>
        </div>
        <div className="ui-confirmation-modal__divider" aria-hidden="true" />
        <div className="ui-confirmation-modal__actions">
          <button disabled={isPending} className="wp-secondary ui-confirmation-modal__cancel" type="button" onClick={onClose}>
            <X size={20} strokeWidth={1.9} />
            <span>Annuler</span>
          </button>
          <LoadingButton loadingLabel="Suppression…" loading={isPending} className={isDanger ? 'wp-secondary ui-confirmation-modal__confirm ui-confirmation-modal__confirm--danger' : 'wp-primary ui-confirmation-modal__confirm'} disabled={isPending} type="button" onClick={onConfirm}>
            <Trash2 size={20} strokeWidth={1.9} />
            <span>{isPending ? 'Suppression...' : confirmLabel}</span>
          </LoadingButton>
        </div>
      </div>
    </Modal>
  );
}

export default ConfirmationModal;
