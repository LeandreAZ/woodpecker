import { useLayoutEffect, useRef, type ButtonHTMLAttributes } from 'react';
import { LoaderCircle } from 'lucide-react';
export function LoadingButton({ loading = false, loadingLabel, disabled, children, style, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { loading?: boolean; loadingLabel?: string }) {
  const ref = useRef<HTMLButtonElement>(null);
  const width = useRef(0);
  useLayoutEffect(() => { if (!loading && ref.current) width.current = ref.current.getBoundingClientRect().width; }, [loading, children]);
  return <button {...props} ref={ref} type={type} disabled={disabled || loading} aria-busy={loading || undefined} style={{ ...style, ...(loading && width.current ? { minWidth: `min(100%, ${width.current}px)` } : {}) }}>
    {loading ? <><LoaderCircle className="ui-spinner" aria-hidden="true" size={18} /><span>{loadingLabel ?? 'Chargement…'}</span></> : children}
  </button>;
}
