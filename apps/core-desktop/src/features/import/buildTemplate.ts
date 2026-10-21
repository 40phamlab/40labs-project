import { ImportFieldConfig } from './types';

export function buildTemplate(moduleType: 'stock' | 'patients', fields: ImportFieldConfig[], exampleRows: Record<string, string>[]): void {
  const headerRow = fields.map((f) => f.key).join(',');
  const exampleLines = exampleRows.map((row) => fields.map((f) => `"${row[f.key] || ''}"`).join(','));
  const csvContent = '\uFEFF' + [headerRow, ...exampleLines].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${moduleType}_import_template.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
