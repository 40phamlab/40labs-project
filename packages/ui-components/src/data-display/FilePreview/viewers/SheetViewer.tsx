import * as React from 'react';
import { Spinner } from '../../../feedback/Spinner';
import { Alert } from '../../../feedback/Alert';
import { Button } from '../../../primitives/Button';
import { Badge } from '../../../primitives/Badge';
import { Table, TableHeader, TableBody, TableRow, TableCell } from '../../Table';
import { Chart } from '../../Chart';
import { Search, Download, BarChart3, FileText, Database, ArrowUpDown, Filter } from 'lucide-react';

export interface SheetViewerProps {
  url: string;
  isCsv?: boolean;
  isJson?: boolean;
  fileName?: string;
  sizeBytes?: number;
}

export function parseCsv(text: string): any[][] {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length === 0) return [];
  return lines.map((line) => {
    const row: string[] = [];
    let inQuote = false;
    let currentVal = '';
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === ',' && !inQuote) {
        row.push(currentVal.trim());
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    row.push(currentVal.trim());
    return row;
  });
}

export function parseJson(text: string): any[][] {
  const json = JSON.parse(text);
  let dataArray: any[] = [];
  if (Array.isArray(json)) {
    dataArray = json;
  } else if (json && typeof json === 'object') {
    const arrayKey = Object.keys(json).find((k) => Array.isArray(json[k]));
    if (arrayKey) {
      dataArray = json[arrayKey];
    } else {
      dataArray = [json];
    }
  }
  if (dataArray.length === 0) return [];
  const keysSet = new Set<string>();
  dataArray.forEach((item) => {
    if (item && typeof item === 'object') {
      Object.keys(item).forEach((k) => keysSet.add(k));
    }
  });
  const headers = Array.from(keysSet);
  const rows: any[][] = [headers];
  dataArray.forEach((item) => {
    const row = headers.map((h) => (item && item[h] !== undefined && item[h] !== null ? item[h] : ''));
    rows.push(row);
  });
  return rows;
}

export const SheetViewer: React.FC<SheetViewerProps> = ({
  url,
  isCsv = false,
  isJson = false,
  fileName = 'dataset',
  sizeBytes,
}) => {
  const [rows, setRows] = React.useState<any[][]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const [activeTab, setActiveTab] = React.useState<'table' | 'analysis' | 'chart' | 'info'>('table');

  const [searchQuery, setSearchQuery] = React.useState('');
  const [sortColumnIndex, setSortColumnIndex] = React.useState<number | null>(null);
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('asc');
  const [pageSize, setPageSize] = React.useState<number>(50);
  const [currentPage, setCurrentPage] = React.useState<number>(1);

  const [xAxisCol, setXAxisCol] = React.useState<string>('');
  const [yAxisCol, setYAxisCol] = React.useState<string>('');
  const [chartType, setChartType] = React.useState<'bar' | 'line' | 'pie' | 'area'>('bar');

  React.useEffect(() => {
    let isMounted = true;
    async function loadData() {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(url);
        if (!res.ok) {
          throw new Error(`Failed to fetch file (status ${res.status})`);
        }

        if (isJson) {
          const text = await res.text();
          const parsed = parseJson(text);
          if (isMounted) {
            setRows(parsed);
            setLoading(false);
          }
        } else if (isCsv) {
          const text = await res.text();
          const parsed = parseCsv(text);
          if (isMounted) {
            setRows(parsed);
            setLoading(false);
          }
        } else {
          const blob = await res.blob();
          const readXlsxFile = (await import('read-excel-file')).default;
          const data = await readXlsxFile(blob);
          if (isMounted) {
            setRows(data);
            setLoading(false);
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err?.message || 'Failed to parse file dataset.');
          setLoading(false);
        }
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [url, isCsv, isJson]);

  const headers = React.useMemo(() => (rows.length > 0 ? rows[0].map(String) : []), [rows]);
  const rawDataRows = React.useMemo(() => rows.slice(1), [rows]);

  React.useEffect(() => {
    if (headers.length >= 2 && !xAxisCol && !yAxisCol) {
      setXAxisCol(headers[0]);
      setYAxisCol(headers[1]);
    } else if (headers.length === 1 && !xAxisCol) {
      setXAxisCol(headers[0]);
    }
  }, [headers, xAxisCol, yAxisCol]);

  const filteredAndSortedRows = React.useMemo(() => {
    let result = [...rawDataRows];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((row) =>
        row.some((cell) => String(cell ?? '').toLowerCase().includes(q))
      );
    }

    if (sortColumnIndex !== null && sortColumnIndex >= 0) {
      result.sort((a, b) => {
        const valA = a[sortColumnIndex] ?? '';
        const valB = b[sortColumnIndex] ?? '';
        const numA = Number(valA);
        const numB = Number(valB);
        let cmp = 0;
        if (!isNaN(numA) && !isNaN(numB) && String(valA).trim() !== '' && String(valB).trim() !== '') {
          cmp = numA - numB;
        } else {
          cmp = String(valA).localeCompare(String(valB));
        }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [rawDataRows, searchQuery, sortColumnIndex, sortDirection]);

  const totalPages = Math.max(1, Math.ceil(filteredAndSortedRows.length / pageSize));
  const paginatedRows = React.useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAndSortedRows.slice(start, start + pageSize);
  }, [filteredAndSortedRows, currentPage, pageSize]);

  const columnAnalysis = React.useMemo(() => {
    return headers.map((header, colIdx) => {
      const values = rawDataRows.map((r) => r[colIdx]);
      const totalCount = values.length;
      const missingCount = values.filter((v) => v === undefined || v === null || String(v).trim() === '').length;
      const uniqueCount = new Set(values).size;

      const numericValues = values
        .filter((val) => val !== undefined && val !== null && String(val).trim() !== '')
        .map((val) => Number(val))
        .filter((n) => !isNaN(n));

      const isNumeric = numericValues.length > totalCount * 0.6 && totalCount > 0;
      let sum = 0;
      let mean = 0;
      let min = 0;
      let max = 0;

      if (isNumeric && numericValues.length > 0) {
        sum = numericValues.reduce((a, b) => a + b, 0);
        mean = sum / numericValues.length;
        min = Math.min(...numericValues);
        max = Math.max(...numericValues);
      }

      return {
        header,
        colIdx,
        totalCount,
        missingCount,
        uniqueCount,
        isNumeric,
        sum,
        mean,
        min,
        max,
      };
    });
  }, [headers, rawDataRows]);

  const chartData = React.useMemo(() => {
    if (!xAxisCol || !yAxisCol || rawDataRows.length === 0) return [];
    const xIdx = headers.indexOf(xAxisCol);
    const yIdx = headers.indexOf(yAxisCol);
    if (xIdx === -1 || yIdx === -1) return [];

    const map = new Map<string, number>();
    rawDataRows.forEach((r) => {
      const xVal = String(r[xIdx] ?? 'Unknown');
      const yVal = Number(r[yIdx]) || 0;
      map.set(xVal, (map.get(xVal) || 0) + yVal);
    });

    const list: Array<Record<string, any>> = [];
    let count = 0;
    for (const [name, value] of map.entries()) {
      if (count >= 50) break;
      list.push({ name, value });
      count++;
    }
    return list;
  }, [rawDataRows, headers, xAxisCol, yAxisCol]);

  const handleExportCsv = () => {
    const csvContent = [headers.join(','), ...filteredAndSortedRows.map((r) => r.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `exported_${fileName || 'dataset'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportAnalysis = () => {
    const analysisReport = {
      fileName,
      totalRows: rawDataRows.length,
      totalColumns: headers.length,
      columns: columnAnalysis,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(analysisReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analysis_${fileName || 'dataset'}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[250px] gap-2">
        <Spinner size="md" />
        <span className="text-xs text-text-muted">Loading business dataset...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <Alert intent="danger" title="Dataset Error">
          {error}
        </Alert>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center w-full h-full min-h-[250px] text-text-muted text-xs gap-2">
        <FileText size={32} className="opacity-40" />
        <span>Empty dataset or unsupported structure</span>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col bg-surface-elevated overflow-hidden font-ui">
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-surface-secondary/40 shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-card border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'table' ? 'bg-action-primary text-text-inverse font-semibold shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Database size={14} />
            <span>Data Table ({rawDataRows.length} rows)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('analysis')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'analysis' ? 'bg-action-primary text-text-inverse font-semibold shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Filter size={14} />
            <span>Analysis Summary</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('chart')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'chart' ? 'bg-action-primary text-text-inverse font-semibold shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <BarChart3 size={14} />
            <span>Visualizer</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('info')}
            className={`px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'info' ? 'bg-action-primary text-text-inverse font-semibold shadow-sm' : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <FileText size={14} />
            <span>File Info & Export</span>
          </button>
        </div>

        {activeTab === 'table' && (
          <div className="relative flex items-center w-56">
            <Search size={14} className="absolute left-2.5 text-text-muted pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Filter rows..."
              className="w-full pl-8 pr-3 py-1 bg-app-bg border border-border rounded-md text-xs text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-focus-ring"
            />
          </div>
        )}
      </div>

      <div className="flex-1 min-h-0 overflow-auto flex flex-col p-4">
        {activeTab === 'table' && (
          <div className="flex-1 min-h-0 flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-text-muted px-1">
              <span>
                Showing {paginatedRows.length} of {filteredAndSortedRows.length} filtered rows ({rawDataRows.length} total)
              </span>
              <div className="flex items-center gap-2">
                <span>Rows per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-app-bg border border-border rounded px-2 py-0.5 text-xs text-text-primary"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={500}>500</option>
                </select>
              </div>
            </div>

            <div className="flex-1 min-h-0 overflow-auto border border-border rounded-card bg-surface-elevated shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    {headers.map((h, idx) => (
                      <TableCell
                        key={`col_${idx}`}
                        isHeader
                        onClick={() => {
                          if (sortColumnIndex === idx) {
                            setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
                          } else {
                            setSortColumnIndex(idx);
                            setSortDirection('asc');
                          }
                        }}
                        className="cursor-pointer hover:bg-surface-hover transition-colors select-none whitespace-nowrap"
                      >
                        <div className="flex items-center gap-1.5">
                          <span>{h}</span>
                          <ArrowUpDown size={12} className={sortColumnIndex === idx ? 'text-action-primary' : 'text-text-muted opacity-50'} />
                        </div>
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedRows.map((row, rIdx) => (
                    <TableRow key={`row_${rIdx}`}>
                      {headers.map((_, cIdx) => (
                        <TableCell key={`cell_${rIdx}_${cIdx}`} className="whitespace-nowrap">
                          {String(row[cIdx] !== undefined && row[cIdx] !== null ? row[cIdx] : '')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-2 shrink-0">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage <= 1}
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <span className="text-xs font-mono text-text-secondary">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentPage >= totalPages}
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analysis' && (
          <div className="flex-1 min-h-0 overflow-auto space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Total Records</span>
                <span className="text-xl font-heading font-bold text-text-primary">{rawDataRows.length}</span>
              </div>
              <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">Total Columns</span>
                <span className="text-xl font-heading font-bold text-text-primary">{headers.length}</span>
              </div>
              <div className="p-4 rounded-card bg-surface-secondary/40 border border-border flex flex-col gap-1">
                <span className="text-xs text-text-muted uppercase tracking-wider font-bold">File Format</span>
                <span className="text-xl font-heading font-bold text-text-primary uppercase">{isJson ? 'JSON' : isCsv ? 'CSV' : 'Spreadsheet'}</span>
              </div>
            </div>

            <div className="border border-border rounded-card overflow-hidden bg-surface-elevated shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableCell isHeader>Column Name</TableCell>
                    <TableCell isHeader>Type</TableCell>
                    <TableCell isHeader>Missing</TableCell>
                    <TableCell isHeader>Unique</TableCell>
                    <TableCell isHeader>Sum / Total</TableCell>
                    <TableCell isHeader>Average</TableCell>
                    <TableCell isHeader>Min / Max</TableCell>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {columnAnalysis.map((col) => (
                    <TableRow key={`col_stat_${col.colIdx}`}>
                      <TableCell className="font-bold">{col.header}</TableCell>
                      <TableCell>
                        <Badge variant={col.isNumeric ? 'success' : 'neutral'} size="sm">
                          {col.isNumeric ? 'Numeric' : 'Text'}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono">{col.missingCount}</TableCell>
                      <TableCell className="font-mono">{col.uniqueCount}</TableCell>
                      <TableCell className="font-mono">{col.isNumeric ? col.sum.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</TableCell>
                      <TableCell className="font-mono">{col.isNumeric ? col.mean.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}</TableCell>
                      <TableCell className="font-mono">{col.isNumeric ? `${col.min} / ${col.max}` : '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}

        {activeTab === 'chart' && (
          <div className="flex-1 min-h-0 flex flex-col gap-4 overflow-auto">
            <div className="flex items-center gap-3 bg-surface-secondary/40 p-3 rounded-card border border-border flex-wrap shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted">Chart Type:</span>
                <select
                  value={chartType}
                  onChange={(e) => setChartType(e.target.value as any)}
                  className="bg-app-bg border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                >
                  <option value="bar">Bar Chart</option>
                  <option value="line">Line Chart</option>
                  <option value="area">Area Chart</option>
                  <option value="pie">Pie Chart</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted">X-Axis (Category):</span>
                <select
                  value={xAxisCol}
                  onChange={(e) => setXAxisCol(e.target.value)}
                  className="bg-app-bg border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                >
                  {headers.map((h) => (
                    <option key={`x_${h}`} value={h}>{h}</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-text-muted">Y-Axis (Numeric Metric):</span>
                <select
                  value={yAxisCol}
                  onChange={(e) => setYAxisCol(e.target.value)}
                  className="bg-app-bg border border-border rounded px-2.5 py-1 text-xs text-text-primary"
                >
                  {headers.map((h) => (
                    <option key={`y_${h}`} value={h}>{h}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex-1 min-h-[350px]">
              <Chart
                data={chartData}
                type={chartType}
                xAxisKey="name"
                series={[{ dataKey: 'value', name: yAxisCol || 'Value' }]}
                title={`${yAxisCol || 'Metric'} by ${xAxisCol || 'Category'}`}
                subtitle="Local analysis chart generated from dataset"
                height={340}
              />
            </div>
          </div>
        )}

        {activeTab === 'info' && (
          <div className="flex-1 min-h-0 overflow-auto space-y-6 max-w-2xl">
            <div className="p-6 rounded-card bg-surface-secondary/40 border border-border space-y-4">
              <h3 className="text-sm font-bold text-text-primary font-heading">File Metadata</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-text-muted block">File Name</span>
                  <span className="font-bold text-text-primary">{fileName}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Format</span>
                  <span className="font-bold text-text-primary uppercase">{isJson ? 'JSON' : isCsv ? 'CSV' : 'Spreadsheet'}</span>
                </div>
                <div>
                  <span className="text-text-muted block">File Size</span>
                  <span className="font-mono text-text-primary">{sizeBytes !== undefined ? `${(sizeBytes / 1024).toFixed(1)} KB` : '—'}</span>
                </div>
                <div>
                  <span className="text-text-muted block">Dimensions</span>
                  <span className="font-mono text-text-primary">{rawDataRows.length} rows × {headers.length} columns</span>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-card bg-surface-secondary/40 border border-border space-y-4">
              <h3 className="text-sm font-bold text-text-primary font-heading">Export Dataset & Analysis</h3>
              <p className="text-xs text-text-muted">
                Export filtered tabular data or complete column analysis reports without modifying your original files.
              </p>
              <div className="flex items-center gap-3 pt-2">
                <Button size="sm" onClick={handleExportCsv} className="flex items-center gap-1.5">
                  <Download size={14} />
                  <span>Export Filtered CSV</span>
                </Button>
                <Button size="sm" variant="secondary" onClick={handleExportAnalysis} className="flex items-center gap-1.5">
                  <Download size={14} />
                  <span>Export Analysis JSON</span>
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
