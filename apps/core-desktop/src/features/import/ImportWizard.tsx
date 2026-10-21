import * as React from 'react';
import { Dialog, Alert } from '@40labs/ui-components';
import { ArrowRight } from 'lucide-react';
import { ImportConfig, SummaryReport, ImportRowResult } from './types';
import { StepSelectFile } from './StepSelectFile';
import { StepColumnMapping } from './StepColumnMapping';
import { StepValidation } from './StepValidation';
import { StepSummary } from './StepSummary';
import { buildTemplate } from './buildTemplate';
import { executeStockImport } from './useImportStock';
import { executePatientImport } from './useImportPatients';

interface ImportWizardProps {
  isOpen: boolean;
  onClose: () => void;
  config: ImportConfig;
  existingRecords?: any[];
  onImportComplete: () => void;
}

export const ImportWizard: React.FC<ImportWizardProps> = ({
  isOpen,
  onClose,
  config,
  existingRecords = [],
  onImportComplete,
}) => {
  const [step, setStep] = React.useState<1 | 2 | 3 | 4>(1);
  const [fileName, setFileName] = React.useState<string>('');
  const [rawRows, setRawRows] = React.useState<Record<string, string>[]>([]);
  const [headers, setHeaders] = React.useState<string[]>([]);
  const [mapping, setMapping] = React.useState<Record<string, string>>({});
  const [duplicateStrategy, setDuplicateStrategy] = React.useState<'skip' | 'update' | 'new'>('skip');
  const [importing, setImporting] = React.useState(false);
  const [importProgress, setImportProgress] = React.useState({ current: 0, total: 0 });
  const [summaryReport, setSummaryReport] = React.useState<SummaryReport | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFileName('');
      setRawRows([]);
      setHeaders([]);
      setMapping({});
      setDuplicateStrategy('skip');
      setImporting(false);
      setImportProgress({ current: 0, total: 0 });
      setSummaryReport(null);
      setError(null);
    }
  }, [isOpen]);

  const handleFileLoaded = (name: string, dataRows: Record<string, string>[]) => {
    if (dataRows.length === 0) {
      setError('The uploaded file is empty.');
      return;
    }
    setFileName(name);
    const hdrs = Object.keys(dataRows[0]);
    setHeaders(hdrs);
    setRawRows(dataRows);

    const initialMapping: Record<string, string> = {};
    config.fields.forEach((field) => {
      const match = hdrs.find((h) => {
        const hNorm = h.toLowerCase().replace(/[^a-z0-9]/g, '');
        return field.synonyms.some((syn) => hNorm.includes(syn.toLowerCase().replace(/[^a-z0-9]/g, '')));
      });
      if (match) {
        initialMapping[field.key] = match;
      }
    });
    setMapping(initialMapping);
    setStep(2);
    setError(null);
  };

  const handleDownloadTemplate = () => {
    buildTemplate(config.moduleType, config.fields, config.exampleRows);
  };

  const validatedRows: ImportRowResult[] = React.useMemo(() => {
    if (rawRows.length === 0) return [];
    return rawRows.map((row, idx) => {
      const record: Record<string, any> = {};
      config.fields.forEach((field) => {
        const mappedHeader = mapping[field.key];
        const val = mappedHeader ? row[mappedHeader] : undefined;
        record[field.key] = val !== undefined && val !== null ? String(val).trim() : '';
      });

      const { errors, warnings, isDuplicate } = config.rowValidator(record, existingRecords);
      return {
        rowIdx: idx + 1,
        record,
        errors,
        warnings,
        isDuplicate,
      };
    });
  }, [rawRows, mapping, config, existingRecords]);

  const handleExecute = async () => {
    try {
      setImporting(true);
      setError(null);
      const validRowsCount = validatedRows.filter((r) => r.errors.length === 0).length;
      setImportProgress({ current: 0, total: validRowsCount });

      let report: SummaryReport;
      if (config.moduleType === 'stock') {
        report = await executeStockImport(validatedRows, duplicateStrategy, (curr, tot) => {
          setImportProgress({ current: curr, total: tot });
        });
      } else {
        report = await executePatientImport(validatedRows, duplicateStrategy, (curr, tot) => {
          setImportProgress({ current: curr, total: tot });
        });
      }

      setSummaryReport(report);
      setStep(4);
      onImportComplete();
    } catch (err: any) {
      setError(err?.message || 'Import execution failed.');
    } finally {
      setImporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={config.title} className="max-w-3xl">
      <div className="flex flex-col gap-6 p-2 font-ui">
        <div className="flex items-center justify-between px-2 text-xs font-bold text-text-muted border-b border-border pb-3">
          <span className={step >= 1 ? 'text-action-primary' : ''}>1. Select File</span>
          <ArrowRight size={14} className="opacity-40" />
          <span className={step >= 2 ? 'text-action-primary' : ''}>2. Column Mapping</span>
          <ArrowRight size={14} className="opacity-40" />
          <span className={step >= 3 ? 'text-action-primary' : ''}>3. Validation & Duplicates</span>
          <ArrowRight size={14} className="opacity-40" />
          <span className={step >= 4 ? 'text-action-primary' : ''}>4. Summary Report</span>
        </div>

        {error && (
          <Alert intent="danger" title="Import Error">
            {error}
          </Alert>
        )}

        {step === 1 && (
          <StepSelectFile
            config={config}
            onFileLoaded={handleFileLoaded}
            onError={setError}
            onDownloadTemplate={handleDownloadTemplate}
          />
        )}

        {step === 2 && (
          <StepColumnMapping
            config={config}
            fileName={fileName}
            headers={headers}
            rawRows={rawRows}
            mapping={mapping}
            setMapping={setMapping}
            onBack={() => setStep(1)}
            onNext={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <StepValidation
            config={config}
            validatedRows={validatedRows}
            duplicateStrategy={duplicateStrategy}
            setDuplicateStrategy={setDuplicateStrategy}
            onBack={() => setStep(2)}
            onExecute={handleExecute}
            isImporting={importing}
            importProgress={importProgress}
          />
        )}

        {step === 4 && summaryReport && (
          <StepSummary
            summaryReport={summaryReport}
            onDone={onClose}
          />
        )}
      </div>
    </Dialog>
  );
};
