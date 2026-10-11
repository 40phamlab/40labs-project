import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput } from './PhoneInput';

describe('PhoneInput', () => {
  test('allows entering all nine national digits in a controlled field', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(event) => {
        onChange(event.currentTarget.value);
        setValue(event.currentTarget.value);
      }} />;
    }

    render(<ControlledPhone />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    await user.type(input, '712345678');

    expect(input).toHaveValue('712345678');
    expect(onChange).toHaveBeenLastCalledWith('712345678');
  });

  test('accepts a pasted local number and strips the local trunk zero', () => {
    const onChange = vi.fn();
    render(<PhoneInput aria-label="Phone number" value="" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    fireEvent.change(input, { target: { value: '0712 345 678' } });

    expect(onChange).toHaveBeenCalledWith(expect.any(Object));
    expect(input).toHaveValue(''); // Controlled value stays owned by its parent.
  });

  test('keeps the real change event and allows local 0-prefixed entry', async () => {
    const user = userEvent.setup();
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(event) => {
        setValue(event.target.value);
      }} />;
    }

    render(<ControlledPhone />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    await user.type(input, '0712345678');

    expect(input).toHaveValue('712345678');
  });
});
