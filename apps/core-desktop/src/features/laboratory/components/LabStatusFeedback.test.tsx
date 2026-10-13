import { afterEach, describe, expect, test, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { LabSample } from '@40labs/types';
import { LabSamplesList } from './LabSamplesList';

afterEach(cleanup);

describe('laboratory status feedback', () => {
  test('shows an IPC error and no success toast when sample status update fails', async () => {
    const updateSample = vi.fn().mockRejectedValue(new Error('Permission denied'));
    const sample = {
      id: 'sample-1', workspace_id: 'ws', branch_id: 'br', created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(), lab_order_id: 'order-1', collected_by_user_id: 'user-1',
      collected_at: new Date().toISOString(), sample_label: 'Blood', status: 'collected',
    } as LabSample;

    render(<LabSamplesList samples={[sample]} orders={[]} customers={[]} testCatalog={[]} onUpdateSampleStatus={updateSample} />);
    await userEvent.click(screen.getByRole('button', { name: 'Sample actions' }));
    await userEvent.click(screen.getByText('Used'));

    expect(await screen.findByText('Permission denied')).toBeDefined();
    expect(screen.queryByText('Sample Blood status updated to Used.')).toBeNull();
    expect(updateSample).toHaveBeenCalledTimes(1);
  });
});
