import { create } from 'zustand';

interface StepUpModalState {
  isOpen: boolean;
  permission: string | null;
  tier: 'self' | 'sudo' | null;
  onSuccess?: (grantToken: string) => void;
  onCancel?: () => void;
}

interface AuthUIState {
  isLocked: boolean;
  stepUpModal: StepUpModalState;
  createPinOpen: boolean;
  recoveryCodesOpen: boolean;
  forcedPasswordChangeOpen: boolean;

  setLocked: (locked: boolean) => void;
  openStepUp: (permission: string, tier: 'self' | 'sudo', onSuccess?: (token: string) => void, onCancel?: () => void) => void;
  closeStepUp: () => void;
  setCreatePinOpen: (open: boolean) => void;
  setRecoveryCodesOpen: (open: boolean) => void;
  setForcedPasswordChangeOpen: (open: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthUIState>((set) => ({
  isLocked: false,
  stepUpModal: {
    isOpen: false,
    permission: null,
    tier: null,
  },
  createPinOpen: false,
  recoveryCodesOpen: false,
  forcedPasswordChangeOpen: false,

  setLocked: (locked) => set({ isLocked: locked }),
  openStepUp: (permission, tier, onSuccess, onCancel) =>
    set({
      stepUpModal: {
        isOpen: true,
        permission,
        tier,
        onSuccess,
        onCancel,
      },
    }),
  closeStepUp: () =>
    set({
      stepUpModal: {
        isOpen: false,
        permission: null,
        tier: null,
      },
    }),
  setCreatePinOpen: (open) => set({ createPinOpen: open }),
  setRecoveryCodesOpen: (open) => set({ recoveryCodesOpen: open }),
  setForcedPasswordChangeOpen: (open) => set({ forcedPasswordChangeOpen: open }),
  reset: () =>
    set({
      isLocked: false,
      stepUpModal: { isOpen: false, permission: null, tier: null },
      createPinOpen: false,
      recoveryCodesOpen: false,
      forcedPasswordChangeOpen: false,
    }),
}));
