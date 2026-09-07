import { useId, useState, type InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement> & { error?: string };
function validationMessage(input: HTMLInputElement) {
  if (input.validity.valueMissing) return 'Ce champ est requis.';
  if (input.validity.typeMismatch && input.type === 'email') return 'Saisissez une adresse e-mail valide.';
  if (input.validity.tooShort) return `Saisissez au moins ${input.minLength} caractères.`;
  if (!input.validity.valid) return 'Vérifiez la valeur de ce champ.';
  return '';
}
export function Input({ className, error, onInvalid, onChange, onBlur, ...props }: InputProps) {
  const id = useId();
  const [localError, setLocalError] = useState('');
  const message = error || localError;
  return <><input {...props} className={['ui-input', className].filter(Boolean).join(' ')}
    aria-invalid={message ? true : props['aria-invalid']}
    aria-describedby={[props['aria-describedby'], message ? id : null].filter(Boolean).join(' ') || undefined}
    onInvalid={(event) => { event.preventDefault(); setLocalError(validationMessage(event.currentTarget)); onInvalid?.(event); }}
    onBlur={(event) => { if (event.currentTarget.value || localError) setLocalError(validationMessage(event.currentTarget)); onBlur?.(event); }}
    onChange={(event) => { if (localError) setLocalError(validationMessage(event.currentTarget)); onChange?.(event); }}
  />{message && <span className="ui-field-error" id={id} role="alert">{message}</span>}</>;
}
export type { InputProps };
export default Input;
