import { useState } from 'react';
import * as XLSX from 'xlsx';

export default function VlookupBuilder() {
  const [result, setResult] = useState<string | null>(null);

  const handleFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length < 2) return;

    // Read both files
    const [wb1, wb2] = await Promise.all(
      Array.from(files).map(async (f) => {
        const buf = await f.arrayBuffer();
        return XLSX.read(buf, { type: 'array' });
      })
    );

    const ws1 = wb1.Sheets[wb1.SheetNames[0]];
    const ws2 = wb2.Sheets[wb2.SheetNames[0]];

    const data1 = XLSX.utils.sheet_to_json(ws1, { header: 1 }) as any[][];
    const data2 = XLSX.utils.sheet_to_json(ws2, { header: 1 }) as any[][];

    // Simple left-join on first column
    const joined = data1.map((row) => {
      const key = row[0];
      const match = data2.find((r) => r[0] === key);
      return match ? [...row, ...match.slice(1)] : [...row, null];
    });

    const newWs = XLSX.utils.aoa_to_sheet(joined);
    const newWb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(newWb, newWs, 'Merged');
    const blob = XLSX.write(newWb, { bookType: 'xlsx', type: 'array' });

    const url = URL.createObjectURL(new Blob([blob], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
    setResult(url);
  };

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold mb-4">Auto-VLOOKUP Builder</h2>
      <p className="mb-4">Upload two Excel files (first sheet only). We’ll left-join on the first column.</p>

      <input
        type="file"
        accept=".xlsx,.xls"
        multiple
        onChange={handleFiles}
        className="mb-4"
      />

      {result && (
        <a
          href={result}
          download="Merged.xlsx"
          className="inline-block bg-sky-600 text-white px-4 py-2 rounded hover:bg-sky-700"
        >
          Download merged file
        </a>
      )}
    </div>
  );
}
