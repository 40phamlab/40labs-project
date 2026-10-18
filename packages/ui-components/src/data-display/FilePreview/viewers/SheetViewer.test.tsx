import { describe, test, expect } from 'vitest';
import { parseCsv, parseJson } from './SheetViewer';

describe('SheetViewer Parser & Data Processing', () => {
  test('parseCsv correctly parses comma-separated values with quotes', () => {
    const csvText = 'Name,Age,City\n"Alice, Smith",30,New York\nBob,25,"San Francisco, CA"';
    const rows = parseCsv(csvText);

    expect(rows).toEqual([
      ['Name', 'Age', 'City'],
      ['Alice, Smith', '30', 'New York'],
      ['Bob', '25', 'San Francisco, CA'],
    ]);
  });

  test('parseCsv handles empty or single-line input gracefully', () => {
    expect(parseCsv('')).toEqual([]);
    expect(parseCsv('Header1,Header2')).toEqual([['Header1', 'Header2']]);
  });

  test('parseJson correctly parses JSON arrays of objects', () => {
    const jsonText = JSON.stringify([
      { product: 'Aspirin', price: 10, stock: 100 },
      { product: 'Paracetamol', price: 5, stock: 250 },
    ]);
    const rows = parseJson(jsonText);

    expect(rows[0]).toContain('product');
    expect(rows[0]).toContain('price');
    expect(rows[0]).toContain('stock');
    expect(rows.length).toBe(3); // Header + 2 rows
  });

  test('parseJson handles single object or invalid json structures gracefully', () => {
    const jsonObject = JSON.stringify({ name: 'Pharmacy A', active: true });
    const rows = parseJson(jsonObject);
    expect(rows.length).toBe(2);
  });

  test('handles large data parsing efficiently', () => {
    const largeArray = Array.from({ length: 1000 }, (_, i) => ({ id: i, value: i * 10 }));
    const jsonText = JSON.stringify(largeArray);
    const rows = parseJson(jsonText);
    expect(rows.length).toBe(1001); // Header + 1000 rows
  });
});
