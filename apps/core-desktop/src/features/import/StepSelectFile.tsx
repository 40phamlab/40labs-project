import * as React from 'react';
import { Button, Badge, Table, TableHeader, TableBody, TableRow, TableCell } from '@40labs/ui-components';
import { Upload, Download, FileSpreadsheet } from 'lucide-react';
import { ImportConfig } from './types';

interface StepSelectFileProps {
  config: ImportConfig;
  onFileLoaded: (name: string, rows: Record<string, string>[]) => void;
  onError: (msg: string | null) => void;
  onDownloadTemplate: () => void;
}

export const StepSelectFile: React.FC<StepSelectFileProps> = ({
  config,
  onFileLoaded,
  onError,
  onDownloadTemplate,
}) => {
  const [isDragging, setIsDragging] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  const processFile = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      onError('File too large (max 10MB)');
      return;
    }
    try {
      onError(null);
      const { parseSpreadsheet } = await import('./parseSpreadsheet');
      const { rows } = await parseSpreadsheet(file);
      if (rows.length === 0) {
        onError('The uploaded file contains no data rows.');
        return;
      }
      if (rows.length > 5000) {
        onError('File exceeds maximum limit of 5,000 rows.');
        return;
      }
      onFileLoaded(file.name, rows);
    } catch (err: any) {
      onError(err?.message || 'Failed to parse spreadsheet file.');
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
    e.target.value = '';
  };

  return (
    <div className="flex flex-col gap-5">
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-card gap-4 transition-colors ${
          isDragging ? 'border-action-primary bg-action-primary/5' : 'border-border bg-surface-secondary/20'
        }`}
      >
        <FileSpreadsheet size={44} className="text-action-primary opacity-80" />
        <div className="text-center space-y-1">
          <h3 className="text-sm font-bold text-text-primary">Choose Spreadsheet File</h3>
          <p className="text-xs text-text-muted">Drag and drop CSV or Excel file here</p>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button
            type="button"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 bg-action-primary text-text-inverse cursor-pointer"
          >
            <Upload size={14} />
            <span>Choose Spreadsheet File</span>
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleFileInput}
            className="hidden"
          />

          <Button variant="secondary" size="sm" onClick={onDownloadTemplate} className="flex items-center gap-1.5">
            <Download size={14} />
            <span>Download Template</span>
          </Button>
        </div>
      </div>

      {/* Required fields example table */}
      <div className="flex flex-col gap-2">
        <h4 className="text-xs font-bold text-text-secondary uppercase">Required Fields Reference</h4>
        <div className="max-h-[220px] overflow-auto border border-border rounded-card bg-surface-elevated">
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell isHeader>Field</TableCell>
                <TableCell isHeader>Status</TableCell>
                <TableCell isHeader>Example</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {config.fields.map((f) => {
                const exampleRow = config.exampleRows[0] || {};
                const exampleVal = exampleRow[f.key] || f.example;
                return (
                  <TableRow key={f.key}>
                    <TableCell className="font-bold text-xs">{f.label}</TableCell>
                    <TableCell>
                      <Badge variant={f.required ? 'success' : 'outline'} size="sm">
                        {f.required ? 'Required' : 'Optional'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-text-primary">{exampleVal}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};
