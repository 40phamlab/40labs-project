import React from 'react';
import { describe, expect, test, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PhoneInput, normalizeNationalDigits, formatNationalDisplay, isValidTZMobile } from './PhoneInput';

describe('PhoneInput & Normalizer', () => {
  test('normalizer handles 0-prefix, 255-prefix, +255-prefix, spaces, and digit counts', () => {
    expect(normalizeNationalDigits('0696113504')).toBe('696113504');
    expect(normalizeNationalDigits('255696113504')).toBe('696113504');
    expect(normalizeNationalDigits('+255696113504')).toBe('696113504');
    expect(normalizeNationalDigits('+255 696 113 504')).toBe('696113504');
    expect(normalizeNationalDigits('71234568')).toBe('71234568'); // 8 digits
    expect(normalizeNationalDigits('07123456789')).toBe('712345678'); // 10 digits truncated to 9
  });

  test('identifies valid vs invalid mobile first digit and length', () => {
    expect(isValidTZMobile('712345678')).toBe(true);
    expect(isValidTZMobile('696113504')).toBe(true);
    expect(isValidTZMobile('512345678')).toBe(false); // invalid first digit
    expect(isValidTZMobile('812345678')).toBe(false); // invalid first digit
    expect(isValidTZMobile('71234567')).toBe(false); // 8 digits
  });

  test('formats national digits with grouping', () => {
    expect(formatNationalDisplay('696113504')).toBe('696 113 504');
    expect(formatNationalDisplay('712345')).toBe('712 345');
    expect(formatNationalDisplay('712')).toBe('712');
  });

  test('allows entering all nine national digits in a controlled field and displays grouped format', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(event) => {
        onChange(event.target.value);
        setValue(event.target.value);
      }} />;
    }

    render(<ControlledPhone />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    await user.type(input, '712345678');

    expect(input).toHaveValue('712 345 678');
    expect(onChange).toHaveBeenLastCalledWith('+255712345678');
  });

  test.each([
    ['0712 345 678', '712 345 678', '+255712345678'],
    ['+255 712 345 678', '712 345 678', '+255712345678'],
    ['255712345678', '712 345 678', '+255712345678'],
  ])('normalizes pasted phone number %s to national grouped display and emits E.164', (pasted, expectedDisplay) => {
    function ControlledPhone() {
      const [value, setValue] = React.useState('');
      return <PhoneInput aria-label="Phone number" value={value} onChange={(e) => setValue(e.target.value)} />;
    }
    render(<ControlledPhone />);
    const input = screen.getByRole('textbox', { name: 'Phone number' });
    fireEvent.change(input, { target: { value: pasted } });
    expect(input).toHaveValue(expectedDisplay);
  });
});
