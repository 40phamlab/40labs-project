import { useConnectionStore } from '../src/stores/connection';

describe('Orbit Worker Multi-User Authorization & Security', () => {
  beforeEach(() => {
    useConnectionStore.setState({
      status: 'connected',
      activeBusinessId: 'biz-1',
      permissions: ['can_create_sale', 'can_add_lab_sample'],
      userInfo: { name: 'Dr. Anna', role: 'Pharmacist' },
    });
  });

  it('correctly tracks user permissions and roles', () => {
    const state = useConnectionStore.getState();
    expect(state.status).toBe('connected');
    expect(state.permissions).toContain('can_create_sale');
    expect(state.permissions).toContain('can_add_lab_sample');
    expect(state.permissions).not.toContain('can_adjust_stock');
    expect(state.userInfo?.name).toBe('Dr. Anna');
  });

  it('transitions to revoked status when device trust is revoked', () => {
    useConnectionStore.getState().setStatus('revoked');
    expect(useConnectionStore.getState().status).toBe('revoked');
  });
});
