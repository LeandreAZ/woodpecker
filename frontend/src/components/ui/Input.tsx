import type { InputHTMLAttributes } from 'react';

type InputProps = InputHTMLAttributes<HTMLInputElement>;

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Input({ className, ...props }: InputProps) {
  return <input {...props} className={joinClassNames('ui-input', className)} />;
}

export type { InputProps };
export default Input;