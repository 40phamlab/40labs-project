import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Dialog } from './Dialog';

describe('Dialog Component', () => {
  test('does not render when isOpen is false', () => {
    render(
      <Dialog isOpen={false} onClose={() => {}} title="Test Dialog">
        <p>Dialog Body Content</p>
      </Dialog>
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.queryByText('Test Dialog')).not.toBeInTheDocument();
  });

  test('renders title, description, content, and footer when isOpen is true', () => {
    render(
      <Dialog
        isOpen={true}
        onClose={() => {}}
        title="Confirm Stock Delete"
        description="This action will deactivate the batch."
        footer={<button>Confirm</button>}
      >
        <p>Are you sure you want to delete this batch?</p>
      </Dialog>
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText('Confirm Stock Delete')).toBeInTheDocument();
    expect(screen.getByText('This action will deactivate the batch.')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to delete this batch?')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /confirm/i })).toBeInTheDocument();
  });

  test('triggers onClose when close button is clicked', async () => {
    const handleClose = vi.fn();
    render(
      <Dialog isOpen={true} onClose={handleClose} title="Closable Dialog">
        <div>Content</div>
      </Dialog>
    );

    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    await userEvent.click(closeButton);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });
});
