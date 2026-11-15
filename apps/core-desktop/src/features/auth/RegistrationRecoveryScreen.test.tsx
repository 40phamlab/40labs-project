import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RegistrationRecoveryScreen } from './RegistrationRecoveryScreen';

const { registrationResumeResult, registrationResultAck } = vi.hoisted(() => ({
  registrationResumeResult: vi.fn(),
  registrationResultAck: vi.fn(),
}));

vi.mock('../../api/authApi', () => ({
  authApi: { registrationResumeResult, registrationResultAck },
}));

describe('RegistrationRecoveryScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    registrationResumeResult.mockResolvedValue({
      businessId: 'AFYA-TEST01',
      workspaceId: 'ws-1',
      branchId: 'br-1',
      recoveryCodes: ['ABCDE-12345', 'FGHIJ-67890'],
    });
    registrationResultAck.mockResolvedValue(undefined);
  });

  it('restores saved recovery codes and acknowledges only after confirmation', async () => {
    const onComplete = vi.fn();
    render(<RegistrationRecoveryScreen onComplete={onComplete} />);
    expect(await screen.findByText('AFYA-TEST01')).toBeTruthy();
    expect(screen.getByText('ABCDE-12345')).toBeTruthy();
    const continueButton = screen.getByRole('button', { name: /continue to sign in/i });
    expect((continueButton as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('checkbox'));
    fireEvent.click(continueButton);
    await waitFor(() => expect(registrationResultAck).toHaveBeenCalledTimes(1));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
