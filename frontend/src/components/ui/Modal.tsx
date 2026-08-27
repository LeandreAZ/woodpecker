import type { PropsWithChildren, ReactNode } from 'react';

type ModalProps = PropsWithChildren<{
  onClose?: () => void;
  open: boolean;
  title?: ReactNode;
}>;

export function Modal({ children, onClose, open, title }: ModalProps) {
  if (!open) {
    return null;
  }

  return (
    <div aria-modal="true" className="ui-modal" role="dialog">
      <button
        aria-label="Fermer la modale"
        className="ui-modal__overlay"
        type="button"
        onClick={onClose}
      />
      <div className="ui-modal__content">
        {title ? <div className="ui-card">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

export type { ModalProps };
export default Modal;