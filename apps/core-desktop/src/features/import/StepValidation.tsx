import * as React from 'react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableCell } from '@40labs/ui-components';
import { ImportConfig, ImportRowResult } from './types';

interface StepValidationProps {
  config: ImportConfig;
  validatedRows: ImportRowResult[];
  duplicateStrategy: 'skip' | 'update' | 'new';
  setDuplicateStrategy: (strategy: 'skip' | 'update' | 'new') => void;
  onBack: () => void;
  onExecute: () => void;
  isImporting: boolean;
  importProgress: { current: number; total: number };
}

export const StepValidation: React.FC<StepValidationProps> = ({
  config,
  validatedRows,
  duplicateStrategy,
  setDuplicateStrategy,
  onBack,
  onExecute,
  isImporting,
  importProgress,
}) => {
  const validRowCount = validatedRows.filter((r) => r.errors.length === 0).length;
  const errorRowCount = validatedRows.filter((r) => r.errors.length > 0).length;
  const duplicateRowCount = validatedRows.filter((r) => r.isDuplicate).length;

  const percent = importProgress.total > 0 ? Math.min(100, Math.round((importProgress.current / importProgress.total) * 100)) : 0;

  return (
    <div className="flex flex-col gap-4">
      {isImporting && (
        <div className="p-4 rounded-card bg-surface-secondary border border-border flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs font-bold text-text-primary">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 border-2 border-action-primary border-t-transparent rounded-full animate-spin" />
              <span>Writing data to database...</span>
            </span>
            <span className="font-mono">{percent}% ({importProgress.current} / {importProgress.total})</span>
          </div>
          <div className="w-full h-2 bg-border/50 rounded-full overflow-hidden">
            <div
              className="h-full bg-action-primary transition-all duration-200 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Badge variant="success" size="sm">{validRowCount} Valid</Badge>
          {errorRowCount > 0 && <Badge variant="danger" size="sm">{errorRowCount} Errors</Badge>}
          {duplicateRowCount > 0 && <Badge variant="warning" size="sm">{duplicateRowCount} Duplicates</Badge>}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-text-muted">Duplicate Strategy:</span>
          <select
            value={duplicateStrategy}
            disabled={isImporting}
            onChange={(e) => setDuplicateStrategy(e.target.value as any)}
            className="bg-app-bg border border-border rounded px-2 py-1 text-xs text-text-primary"
          >
            <option value="skip">Skip duplicates</option>
            {config.moduleType === 'patients' && <option value="update">Update existing records</option>}
            <option value="new">Import as new records</option>
          </select>
        </div>
      </div>

      <div className="max-h-[280px] overflow-auto border border-border rounded-card bg-surface-elevated">
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell isHeader>Row</TableCell>
              <TableCell isHeader>Name / Item</TableCell>
              <TableCell isHeader>Status</TableCell>
              <TableCell isHeader>Issues</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {validatedRows.slice(0, 150).map((r) => (
              <TableRow key={`val_row_${r.rowIdx}`}>
                <TableCell className="font-mono">{r.rowIdx}</TableCell>
                <TableCell className="font-bold">
                  {r.record.medicineName || r.record.fullName || '—'}
                </TableCell>
                <TableCell>
                  {r.errors.length > 0 ? (
                    <Badge variant="danger" size="sm">Error</Badge>
                  ) : r.isDuplicate ? (
                    <Badge variant="warning" size="sm">Duplicate</Badge>
                  ) : (
                    <Badge variant="success" size="sm">Valid</Badge>
                  )}
                </TableCell>
                <TableCell className="text-xs">
                  {r.errors.length > 0 ? (
                    <span className="text-danger">{r.errors.join(', ')}</span>
                  ) : r.warnings.length > 0 ? (
                    <span className="text-warning">{r.warnings.join(', ')}</span>
                  ) : r.isDuplicate ? (
                    <span className="text-warning">Duplicate match</span>
                  ) : (
                    <span className="text-success">Ready</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between pt-2">
        <Button variant="secondary" size="sm" disabled={isImporting} onClick={onBack}>Back to Mapping</Button>
        <Button
          size="sm"
          disabled={isImporting || validRowCount === 0}
          onClick={onExecute}
          className="flex items-center gap-1.5 bg-action-primary text-text-inverse"
        >
          {isImporting && <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />}
          <span>Execute Import ({validRowCount} records)</span>
        </Button>
      </div>
    </div>
  );
};
