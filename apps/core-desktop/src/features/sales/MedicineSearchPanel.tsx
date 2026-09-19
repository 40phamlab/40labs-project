import * as React from 'react';
import { MedicinePicker, Button } from '@40labs/ui-components';
import { MedicineWithInventory } from '@40labs/types';

export interface MedicineSearchPanelProps {
  medicines: MedicineWithInventory[];
  onAdd: (medicine: MedicineWithInventory) => void;
}

export const MedicineSearchPanel: React.FC<MedicineSearchPanelProps> = ({
  medicines,
  onAdd,
}) => {
  const [selected, setSelected] = React.useState<MedicineWithInventory | null>(
    null
  );

  const handleAdd = React.useCallback(() => {
    if (selected) {
      onAdd(selected);
      setSelected(null);
    }
  }, [selected, onAdd]);

  return (
    <div className="flex flex-col gap-4">
      <MedicinePicker
        value={selected}
        onChange={setSelected}
        medicines={medicines}
        requireAvailableStock
        showStock
        showPrice
      />
      <Button
        intent="primary"
        fullWidth
        disabled={!selected}
        onClick={handleAdd}
      >
        Add to Cart
      </Button>
    </div>
  );
};
