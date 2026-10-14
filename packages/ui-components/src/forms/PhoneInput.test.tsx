import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput } from './PhoneInput';

describe('PhoneInput', () => {
  test('allows entering all nine national digits in a controlled field and displays grouped format', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(eventOrVal) => {
        const val = typeof eventOrVal === 'string' ? eventOrVal : eventOrVal.target.value;
        onChange(val);
        setValue(val);
      }} />;
    }

    render(<ControlledPhone />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    await user.type(input, '712345678');

    expect(input).toHaveValue('712 345 678');
    expect(onChange).toHaveBeenLastCalledWith('+255712345678');
  });

  test.each([
    ['0712 345 678', '712 345 678'],
    ['+255 712 345 678', '712 345 678'],
    ['255712345678', '712 345 678'],
  ])('normalizes pasted phone number %s to national grouped digits', (pasted, expected) => {
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(e: any) => setValue(typeof e === 'string' ? e : e.target.value)} />;
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
    expect(onChange).toHaveBeenCalled();
    expect(input).toHaveValue('712 345 678');
  });
});
