'use client';

/** يصدّر مصفوفة كائنات إلى ملف Excel. */
export async function exportRows(rows: Record<string, any>[], sheetName: string, fileBase: string) {
  const XLSX = await import('xlsx');
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 30));
  XLSX.writeFile(wb, `${fileBase}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
