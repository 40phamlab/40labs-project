import * as React from 'react';
import { Spinner } from '../../../feedback/Spinner';
import { Alert } from '../../../feedback/Alert';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../Table';

export interface SheetViewerProps {
  url: string;
  isCsv?: boolean;
}

export const SheetViewer: React.FC<SheetViewerProps> = ({ url, isCsv = false }) => {
  const [rows, setRows] = React.useState<any[][]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    async function loadSheet() {
      try {
        setLoading(true);
        const res = await fetch(url);
        const blob = await res.blob();
        const readXlsxFile = (await import('read-excel-file')).default;
        const data = await readXlsxFile(blob);
        if (isMounted) {
          setRows(data.slice(0, 500));
          setLoading(false);
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to parse spreadsheet.');
          setLoading(false);
        }
      }
    }
    loadSheet();
    return () => {
      isMounted = false;
    };
  }, [url]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-[60vh]">
        <Spinner size="md" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert intent="danger" title="Error">
          {error}
        </Alert>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center w-full h-[60vh] text-text-muted">
        Empty spreadsheet
      </div>
    );
  }

  const headers = rows[0] || [];
  const dataRows = rows.slice(1);

  return (
    <div className="w-full h-[75vh] overflow-auto bg-surface-elevated border border-border rounded-card p-4 shadow-sm flex flex-col gap-4">
      <div className="flex items-center justify-between border-b border-border pb-2">
        <span className="text-xs font-bold text-text-muted uppercase tracking-wider font-ui">
          {isCsv ? 'CSV Preview (Max 500 rows)' : 'Spreadsheet Preview (Max 500 rows)'}
        </span>
      </div>
      <div className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {headers.map((h: any, idx: number) => (
                <TableCell key={`col_${idx}`} isHeader>
                  {String(h || `Column ${idx + 1}`)}
                </TableCell>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {dataRows.map((row: any[], rIdx: number) => (
              <TableRow key={`row_${rIdx}`}>
                {headers.map((_: any, idx: number) => (
                  <TableCell key={`cell_${rIdx}_${idx}`}>
                    {String(row[idx] !== undefined && row[idx] !== null ? row[idx] : '')}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
