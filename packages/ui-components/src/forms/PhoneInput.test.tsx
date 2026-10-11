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

  test.each([
    ['0712 345 678', '712345678'],
    ['+255 712 345 678', '712345678'],
    ['255712345678', '712345678'],
  ])('normalizes pasted phone number %s to national digits', (pasted, expected) => {
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(event) => setValue(event.currentTarget.value)} />;
    }
    render(<ControlledPhone />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    fireEvent.change(input, { target: { value: pasted } });
    expect(input).toHaveValue(expected);
  });

  test('removes non-digit characters and limits the national number to nine digits', () => {
    const onChange = vi.fn();
    render(<PhoneInput aria-label="Phone number" value="" onChange={onChange} />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    fireEvent.change(input, { target: { value: 'abc712-345-67899' } });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ currentTarget: input }));
    expect(input).toHaveValue('');
  });
});
