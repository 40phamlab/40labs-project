import * as React from 'react';
import { Checkbox } from '@40labs/ui-components';

interface SelectionCheckboxProps {
  checked: boolean;
  indeterminate?: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClick?: (e: React.MouseEvent<HTMLInputElement>) => void;
  'aria-label'?: string;
}

export const SelectionCheckbox: React.FC<SelectionCheckboxProps> = ({
  checked,
  indeterminate,
  onChange,
  onClick,
  'aria-label': ariaLabel = 'Select row',
}) => {
  return (
    <div onClick={(e) => e.stopPropagation()} className="flex items-center justify-center">
      <Checkbox
        checked={checked}
        indeterminate={indeterminate}
        onChange={onChange}
        onClick={onClick}
        aria-label={ariaLabel}
        className="accent-primary"
      />
    </div>
  );
};
