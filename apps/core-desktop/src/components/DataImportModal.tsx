import * as React from 'react';
import { ImportWizard } from '../features/import/ImportWizard';
import { stockImportConfig } from '../features/import/configs/stockImportConfig';
import { patientImportConfig } from '../features/import/configs/patientImportConfig';

export interface DataImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  moduleType: 'stock' | 'patients';
  onImportComplete: (importedCount: number) => void;
  existingRecords?: Array<any>;
  onExecuteImport?: any;
}

export const DataImportModal: React.FC<DataImportModalProps> = ({
  isOpen,
  onClose,
  moduleType,
  onImportComplete,
  existingRecords = [],
}) => {
  const config = moduleType === 'stock' ? stockImportConfig : patientImportConfig;

  return (
    <ImportWizard
      isOpen={isOpen}
      onClose={onClose}
      config={config}
      existingRecords={existingRecords}
      onImportComplete={() => {
        onImportComplete(1);
      }}
    />
  );
};
