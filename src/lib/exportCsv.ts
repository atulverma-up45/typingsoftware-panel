/**
 * RFC 4180-compliant CSV export utility with formula injection mitigation and UTF-8 BOM.
 */

export interface CsvColumn<T> {
  header: string;
  accessor: keyof T | ((item: T) => string | number | boolean | null | undefined);
}

/**
 * Sanitize a cell value to prevent CSV Formula Injection (CWE-1236)
 * while properly escaping quotes, commas, and newlines per RFC 4180.
 */
function escapeCsvCell(rawValue: unknown): string {
  if (rawValue === null || rawValue === undefined) {
    return '""';
  }

  let stringValue = String(rawValue);

  // Mitigate CSV injection for formula characters if they start the cell
  const firstChar = stringValue.charAt(0);
  if (['=', '+', '-', '@', '\t', '\r'].includes(firstChar)) {
    stringValue = `'${stringValue}`;
  }

  // If contains double quotes, commas, or newlines, escape internal quotes by doubling them
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return `"${stringValue}"`;
}

/**
 * Generate a CSV string and trigger a browser file download.
 *
 * @param filename Target filename (e.g. 'licenses_export.csv')
 * @param columns Array of column definitions with header label and accessor
 * @param data Data rows to export
 */
export function exportCsv<T>(
  filename: string,
  columns: CsvColumn<T>[],
  data: readonly T[],
): void {
  if (!data || data.length === 0) {
    return;
  }

  const headerRow = columns.map((col) => escapeCsvCell(col.header)).join(',');

  const dataRows = data.map((item) =>
    columns
      .map((col) => {
        const val =
          typeof col.accessor === 'function'
            ? col.accessor(item)
            : (item[col.accessor] as unknown);
        return escapeCsvCell(val);
      })
      .join(','),
  );

  // Prepend UTF-8 BOM (\uFEFF) so Excel on Windows renders UTF-8 correctly
  const csvContent = `\uFEFF${headerRow}\r\n${dataRows.join('\r\n')}\r\n`;

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const downloadUrl = URL.createObjectURL(blob);
  const linkElement = document.createElement('a');

  const safeFilename = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  linkElement.setAttribute('href', downloadUrl);
  linkElement.setAttribute('download', safeFilename);
  linkElement.style.visibility = 'hidden';

  document.body.appendChild(linkElement);
  linkElement.click();

  setTimeout(() => {
    document.body.removeChild(linkElement);
    URL.revokeObjectURL(downloadUrl);
  }, 100);
}

