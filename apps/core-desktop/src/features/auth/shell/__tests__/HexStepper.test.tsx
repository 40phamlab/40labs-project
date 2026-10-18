import '@testing-library/jest-dom/vitest';
import { describe, test, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HexStepper, type StepDef } from '../HexStepper';
import { renderWithProviders } from '../../../../../../../tests/test-utils';

const STEPS: StepDef[] = [
  { id: 1, title: 'Biashara' },
  { id: 2, title: 'Aina' },
  { id: 3, title: 'Eneo' },
];

describe('HexStepper Tests', () => {
  test('renders steps with pending, active, and complete states', () => {
    const completed = new Set([0]);
    renderWithProviders(
      <HexStepper steps={STEPS} currentStep={1} completed={completed} />
    );

    expect(screen.getByText('Biashara')).toBeInTheDocument();
    expect(screen.getByText('Aina')).toBeInTheDocument();
    expect(screen.getByText('Eneo')).toBeInTheDocument();

    const activeNode = screen.getByRole('button', { name: /Step 2: Aina/i });
    expect(activeNode).toHaveAttribute('aria-current', 'step');
  });

  test('clicking completed step invokes onStepClick', async () => {
    const handleStepClick = vi.fn();
    const completed = new Set([0]);
    renderWithProviders(
      <HexStepper
        steps={STEPS}
        currentStep={1}
        completed={completed}
        onStepClick={handleStepClick}
      />
    );

    const step1Button = screen.getByRole('button', { name: /Step 1: Biashara, completed/i });
    await userEvent.click(step1Button);

    expect(handleStepClick).toHaveBeenCalledWith(0);
  });

  test('pending nodes are not clickable', async () => {
    const handleStepClick = vi.fn();
    renderWithProviders(
      <HexStepper
        steps={STEPS}
        currentStep={0}
        completed={new Set()}
        onStepClick={handleStepClick}
      />
    );

    const step2Button = screen.getByRole('button', { name: /Step 2: Aina/i });
    expect(step2Button).toBeDisabled();
  });
});
