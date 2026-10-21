export interface ImportFieldConfig {
  key: string;
  label: string;
  required: boolean;
  type: 'string' | 'number' | 'date';
  synonyms: string[];
  example: string;
}

export interface ImportConfig {
  moduleType: 'stock' | 'patients';
  title: string;
  fields: ImportFieldConfig[];
  exampleRows: Record<string, string>[];
  keyExtractor: (record: Record<string, any>) => string;
  validator: (record: Record<string, any>) => string[];
  rowValidator: (record: Record<string, any>, existingRecords: any[]) => { errors: string[]; warnings: string[]; isDuplicate: boolean };
}

export interface ImportRowResult {
  rowIdx: number;
  record: Record<string, any>;
  errors: string[];
  warnings: string[];
  isDuplicate: boolean;
}

export interface SummaryReport {
  imported: number;
  updated: number;
  skipped: number;
  failed: number;
  failedRows: { rowIdx: number; reason: string; data: Record<string, any> }[];
}
