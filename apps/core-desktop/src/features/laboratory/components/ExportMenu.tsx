import * as React from 'react';
import {
  Dropdown,
  DropdownMenuItem,
  Button,
  IconButton,
} from '@40labs/ui-components';
import { Download, FileText, FileSpreadsheet, Code, Printer } from 'lucide-react';
import type { LabResult, LabOrder, Customer, TestCatalogEntry, LabSample } from '@40labs/types';
import { saveResultPdf } from '../export/resultPdf';
import { downloadResultsCsv } from '../export/resultCsv';
import { downloadResultsJson } from '../export/resultJson';

export interface ExportMenuProps {
  results: LabResult[];
  orders: LabOrder[];
  customers: Customer[];
  testCatalog: TestCatalogEntry[];
  samples: LabSample[];
  singleResult?: LabResult; // if provided, export single result
  variant?: 'button' | 'icon';
  label?: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({
  results,
  orders,
  customers,
  testCatalog,
  samples,
  singleResult,
  variant = 'button',
  label = 'Download / Export',
}) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const activeResults = singleResult ? [singleResult] : results;

  const handlePdf = async () => {
    setIsOpen(false);
    if (singleResult) {
      const order = orders.find((o) => o.id === singleResult.lab_order_id);
      const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
      const sample = samples.find((s) => s.lab_order_id === singleResult.lab_order_id);
      const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
      await saveResultPdf({ result: singleResult, order, customer, sample, test });
    } else {
      // Export first or batch PDF
      for (const res of activeResults.slice(0, 10)) {
        const order = orders.find((o) => o.id === res.lab_order_id);
        const customer = order ? customers.find((c) => c.id === order.customer_id) : undefined;
        const sample = samples.find((s) => s.lab_order_id === res.lab_order_id);
        const test = order ? testCatalog.find((t) => t.id === order.test_catalog_id) : undefined;
        await saveResultPdf({ result: res, order, customer, sample, test });
      }
    }
  };

  const handleCsv = () => {
    setIsOpen(false);
    downloadResultsCsv(activeResults, orders, customers, testCatalog, samples, singleResult ? `Lab_Result_${singleResult.id}.csv` : 'Lab_Results_Export.csv');
  };

  const handleJsonFull = async () => {
    setIsOpen(false);
    await downloadResultsJson(activeResults, orders, customers, testCatalog, samples, 'full', singleResult ? `Lab_Result_${singleResult.id}_full.json` : 'Lab_Results_full_export.json');
  };

  const handleJsonDeidentified = async () => {
    setIsOpen(false);
    await downloadResultsJson(activeResults, orders, customers, testCatalog, samples, 'deidentified', singleResult ? `Lab_Result_${singleResult.id}_deidentified.json` : 'Lab_Results_deidentified_export.json');
  };

  const handlePrint = () => {
    setIsOpen(false);
    window.print();
  };

  const trigger =
    variant === 'icon' ? (
      <IconButton
        icon={<Download size={16} />}
        label="Export / Download"
        intent="ghost"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      />
    ) : (
      <Button
        type="button"
        intent="neutral"
        size="sm"
        leftIcon={<Download size={14} />}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
      >
        {label}
      </Button>
    );

  return (
    <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      trigger={trigger}
    >
      <DropdownMenuItem
        label="Export as PDF"
        icon={<FileText size={14} className="text-primary" />}
        onClick={handlePdf}
      />
      <DropdownMenuItem
        label="Export as CSV"
        icon={<FileSpreadsheet size={14} className="text-primary" />}
        onClick={handleCsv}
      />
      <DropdownMenuItem
        label="Export JSON (Full PII)"
        icon={<Code size={14} className="text-primary" />}
        onClick={handleJsonFull}
      />
      <DropdownMenuItem
        label="Export JSON (De-identified for AI)"
        icon={<Code size={14} className="text-accent" />}
        onClick={handleJsonDeidentified}
      />
      <DropdownMenuItem
        label="Print Report"
        icon={<Printer size={14} className="text-text-muted" />}
        onClick={handlePrint}
      />
    </Dropdown>
  );
};
