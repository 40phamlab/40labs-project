import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './Input';

describe('Input Component', () => {
  test('renders input and updates value on user input', async () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Enter medicine name" onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Enter medicine name') as HTMLInputElement;
    expect(input).toBeInTheDocument();

    await userEvent.type(input, 'Paracetamol');
    expect(handleChange).toHaveBeenCalled();
    expect(input.value).toBe('Paracetamol');
  });

  test('respects disabled state', async () => {
    const handleChange = vi.fn();
    render(<Input placeholder="Disabled field" disabled onChange={handleChange} />);

    const input = screen.getByPlaceholderText('Disabled field');
    expect(input).toBeDisabled();

    await userEvent.type(input, 'Test');
    expect(handleChange).not.toHaveBeenCalled();
  });

  test('respects readOnly state', async () => {
    render(<Input value="Read Only Value" readOnly onChange={() => {}} />);

    const input = screen.getByDisplayValue('Read Only Value') as HTMLInputElement;
    expect(input).toHaveAttribute('readonly');
  });

  test('applies error and success visual states', () => {
    const { rerender } = render(<Input placeholder="Field" error="Invalid value" />);
    let input = screen.getByPlaceholderText('Field');
    expect(input.className).toContain('border-danger');

    rerender(<Input placeholder="Field" success />);
    input = screen.getByPlaceholderText('Field');
    expect(input.className).toContain('border-success');
  });

  test('renders prefix and suffix elements', () => {
    render(
      <Input
        placeholder="Price"
        prefix={<span data-testid="prefix-icon">$</span>}
        suffix={<span data-testid="suffix-icon">TZS</span>}
      />
    );

    expect(screen.getByTestId('prefix-icon')).toBeInTheDocument();
    expect(screen.getByTestId('suffix-icon')).toBeInTheDocument();
  });
});
