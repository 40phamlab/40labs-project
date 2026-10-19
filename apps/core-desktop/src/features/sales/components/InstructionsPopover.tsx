import * as React from 'react';
import type { SaleLine, DispensingInstruction } from '@40labs/types';
import { Modal, Button } from '@40labs/ui-components';
import { InstructionRow } from './InstructionRow';
import { t } from '@40labs/i18n';

export interface InstructionsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  saleId: string;
  saleLines: SaleLine[];
  medicineNames: Record<string, string>;
  existingInstructions: DispensingInstruction[];
  onSave: (instructions: DispensingInstruction[]) => Promise<void>;
}

export const InstructionsPopover: React.FC<InstructionsPopoverProps> = ({
  isOpen,
  onClose,
  saleId,
  saleLines,
  medicineNames,
  existingInstructions,
  onSave,
}) => {
  const [instructionsMap, setInstructionsMap] = React.useState<Record<string, DispensingInstruction>>({});
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isOpen) return;
    const initial: Record<string, DispensingInstruction> = {};
    const now = new Date().toISOString();

    saleLines.forEach((line) => {
      const found = existingInstructions.find((i) => i.sale_line_id === line.id);
      if (found) {
        initial[line.id] = { ...found };
      } else {
        initial[line.id] = {
          id: `inst_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          workspace_id: 'ws_default',
          branch_id: 'br_default',
          sale_id: saleId,
          sale_line_id: line.id,
          customer_id: null,
          dose: '1 tablet',
          frequency: 'once_daily',
          timing: 'after_meal',
          duration_days: 5,
          storage: ['cool_dry'],
          note: null,
          created_by: 'user_001',
          created_at: now,
          updated_by: 'user_001',
          updated_at: now,
        };
      }
    });
    setInstructionsMap(initial);
  }, [isOpen, saleLines, existingInstructions, saleId]);

  const handleRowChange = (lineId: string, updated: DispensingInstruction) => {
    setInstructionsMap((prev) => ({
      ...prev,
      [lineId]: updated,
    }));
  };

  const handleCopyFromPrevious = (currentIndex: number) => {
    if (currentIndex <= 0) return;
    const prevLineId = saleLines[currentIndex - 1]?.id;
    const currLineId = saleLines[currentIndex]?.id;
    if (!prevLineId || !currLineId) return;

    const prevInst = instructionsMap[prevLineId];
    if (!prevInst) return;

    setInstructionsMap((prev) => ({
      ...prev,
      [currLineId]: {
        ...prev[currLineId],
        dose: prevInst.dose,
        frequency: prevInst.frequency,
        timing: prevInst.timing,
        duration_days: prevInst.duration_days,
        storage: [...prevInst.storage],
        note: prevInst.note,
        updated_at: new Date().toISOString(),
      },
    }));
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const list = Object.values(instructionsMap);
      await onSave(list);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('instructions.title')}
      size="lg"
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" intent="ghost" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            type="button"
            intent="primary"
            onClick={handleSaveAll}
            loading={saving}
            className="bg-[#16A34A] hover:bg-[#15803D] text-white rounded-[8px] px-5"
          >
            {t('instructions.save')}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-1 custom-scrollbar">
        {saleLines.map((line, index) => {
          const medName = medicineNames[line.inventory_item_id] || medicineNames[line.medicine_id] || 'Medicine Item';
          const inst = instructionsMap[line.id];
          if (!inst) return null;

          return (
            <InstructionRow
              key={line.id}
              saleLine={line}
              medicineName={medName}
              instruction={inst}
              onChange={(updated) => handleRowChange(line.id, updated)}
              onCopyFromPrevious={() => handleCopyFromPrevious(index)}
              canCopy={index > 0}
            />
          );
        })}
      </div>
    </Modal>
  );
};
