import * as React from 'react';
import { Button, Field, FieldLabel, Input, Modal } from '@40labs/ui-components';
import type { CreateTestCatalogPayload } from '../../../api/labApi';

interface Props {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTestCatalogPayload) => Promise<unknown>;
}

export const NewTestCatalogModal: React.FC<Props> = ({ isOpen, isLoading = false, onClose, onSubmit }) => {
  const [name, setName] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [referenceRange, setReferenceRange] = React.useState('');
  const [price, setPrice] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!name.trim() || !category.trim() || !price || Number(price) < 0) {
      setError('Enter a test name, category, and a non-negative price.');
      return;
    }
    setError(null);
    try {
      await onSubmit({ name: name.trim(), category: category.trim(), referenceRange: referenceRange.trim() || undefined, price: Number(price) });
      setName(''); setCategory(''); setReferenceRange(''); setPrice(''); onClose();
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Could not save this test.');
    }
  };

  return <Modal isOpen={isOpen} onClose={onClose} title="Add laboratory test" size="md" footer={<div className="flex justify-end gap-3 w-full"><Button type="button" intent="neutral" onClick={onClose} disabled={isLoading}>Cancel</Button><Button type="submit" form="new-test-catalog-form" intent="primary" disabled={isLoading}>{isLoading ? 'Saving…' : 'Save test'}</Button></div>}>
    <form id="new-test-catalog-form" onSubmit={submit} className="flex flex-col gap-4">
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <Field><FieldLabel required>Test name</FieldLabel><Input autoFocus value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Full blood count" /></Field>
      <Field><FieldLabel required>Category</FieldLabel><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. Hematology" /></Field>
      <Field><FieldLabel>Reference range</FieldLabel><Input value={referenceRange} onChange={(e) => setReferenceRange(e.target.value)} placeholder="e.g. 4.0–10.0 ×10⁹/L" /></Field>
      <Field><FieldLabel required>Price (TZS)</FieldLabel><Input type="number" min="0" step="1" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0" /></Field>
    </form>
  </Modal>;
};
