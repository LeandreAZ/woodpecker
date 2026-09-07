import type { SelectHTMLAttributes } from 'react';

type SelectProps = SelectHTMLAttributes<HTMLSelectElement>;

function joinClassNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function Select({ children, className, ...props }: SelectProps) {
  return (
    <select {...props} className={joinClassNames('ui-select', className)}>
      {children}
    </select>
  );
}

export type { SelectProps };
export default Select;