import type { TextareaHTMLAttributes } from 'react';

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Textarea({ className, ...props }: TextareaProps) {
  return <textarea {...props} className={joinClassNames('ui-textarea', className)} />;
}

export type { TextareaProps };
export default Textarea;