import { useEffect, useId, useRef, type PropsWithChildren, type ReactNode } from 'react';

type ModalProps = PropsWithChildren<{
  contentClassName?: string;
  onClose?: () => void;
  open: boolean;
  title?: ReactNode;
}>;

export function Modal({ children, contentClassName, onClose, open, title }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  const titleId = useId();
  useEffect(() => {
    if (!open || !dialogRef.current) return;
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const heading = dialog.querySelector('h1,h2,h3');
    if (heading) { if (!heading.id) heading.id = titleId; dialog.setAttribute('aria-labelledby', heading.id); }
    document.body.style.overflow = 'hidden';
    const focusable = () => Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled):not(.ui-modal__overlay),input:not(:disabled),select:not(:disabled),textarea:not(:disabled),a[href],[tabindex="0"]')).filter((element) => !element.hidden && element.getAttribute('type') !== 'hidden');
    (focusable()[0] ?? dialog).focus();
    function handleKey(event: KeyboardEvent) {
      if (document.querySelectorAll('.ui-modal')[document.querySelectorAll('.ui-modal').length - 1] !== dialog) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current?.(); }
      if (event.key !== 'Tab') return;
      const items = focusable(); const first = items[0]; const last = items[items.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); }
      else if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', handleKey);
    return () => { document.removeEventListener('keydown', handleKey); document.body.style.overflow = previousOverflow; if (previousFocus?.isConnected) previousFocus.focus(); };
  }, [open, titleId]);
  if (!open) {
    return null;
  }

  return (
    <div ref={dialogRef} tabIndex={-1} aria-modal="true" className="ui-modal" role="dialog">
      <button
        aria-label="Fermer la modale"
        tabIndex={-1}
        className="ui-modal__overlay"
        type="button"
        onClick={onClose}
      />
      <div className={contentClassName ? "ui-modal__content " + contentClassName : "ui-modal__content"}>
        {title ? <div className="ui-card">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

export type { ModalProps };
export default Modal;