import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dropdown } from './Dropdown';

describe('Dropdown Component', () => {
  test('renders trigger element', () => {
    render(
      <Dropdown
        isOpen={false}
        trigger={<button>Actions Menu</button>}
      >
        <div>Dropdown Item 1</div>
      </Dropdown>
    );

    expect(screen.getByRole('button', { name: /actions menu/i })).toBeInTheDocument();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  test('renders dropdown content in portal when isOpen is true', () => {
    render(
      <Dropdown
        isOpen={true}
        trigger={<button>Actions Menu</button>}
      >
        <button role="menuitem">Option A</button>
        <button role="menuitem">Option B</button>
      </Dropdown>
    );

    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Option A' })).toBeInTheDocument();
    expect(screen.getByRole('menuitem', { name: 'Option B' })).toBeInTheDocument();
  });

  test('handles click on dropdown options', async () => {
    const handleOptionClick = vi.fn();
    render(
      <Dropdown
        isOpen={true}
        trigger={<button>Options</button>}
      >
        <button role="menuitem" onClick={handleOptionClick}>
          Select Item
        </button>
      </Dropdown>
    );

    const option = screen.getByRole('menuitem', { name: 'Select Item' });
    await userEvent.click(option);

    expect(handleOptionClick).toHaveBeenCalledTimes(1);
  });
});
