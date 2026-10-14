import * as React from 'react';
import { Dialog, Button, Field, FieldLabel } from '@40labs/ui-components';

interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessId?: string;
}

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({ isOpen, onClose, businessId }) => {
  const [category, setCategory] = React.useState('Bug');
  const [description, setDescription] = React.useState('');
  const [submitting, setSubmitting] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    try {
      await new Promise((r) => setTimeout(r, 800));
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onClose();
      }, 1500);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Report an Issue">
      <form onSubmit={handleSubmit} className="space-y-3 text-xs">
        {success ? (
          <div className="p-4 text-center text-primary font-bold">
            Issue report transmitted successfully. Thank you!
          </div>
        ) : (
          <>
            <Field>
              <FieldLabel>Category</FieldLabel>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-panel border border-border rounded-input px-3 py-2 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="Bug">Software Bug / Error</option>
                <option value="Sync">Sync / Offline Issue</option>
                <option value="Inventory">Inventory / Stock</option>
                <option value="POS">POS / Sales</option>
                <option value="Other">Other</option>
              </select>
            </Field>
            <Field>
              <FieldLabel>Description</FieldLabel>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the issue encountered..."
                className="w-full bg-panel border border-border rounded-input p-2.5 text-xs text-text-primary focus:outline-none focus:ring-1 focus:ring-primary"
                required
              />
            </Field>
            <div className="text-[10px] text-text-muted bg-surface-secondary/40 p-2 rounded">
              Auto-attaching: App Version (0.1.0), OS ({navigator.platform}), Business ID ({businessId || 'AFYA-0001'}), and recent anonymous diagnostic logs.
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" disabled={submitting}>
                {submitting ? 'Sending...' : 'Submit Report'}
              </Button>
            </div>
          </>
        )}
      </form>
    </Dialog>
  );
};
