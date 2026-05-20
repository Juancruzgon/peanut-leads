import * as XLSX from 'xlsx';

const prepareRows = (contacts) =>
  contacts.map((c) => ({
    Nombre: c.name || '',
    Cargo: c.title || '',
    Empresa: c.company || '',
    Industria: c.industry || '',
    País: c.country || '',
    Ubicación: c.location || '',
    Email: c.email || '',
    Teléfono: c.phone || '',
    LinkedIn: c.linkedin || '',
    Estado: c.email ? 'Email obtenido' : 'Sin email',
  }));

export default function ExportButtons({ contacts }) {
  const handleExcel = () => {
    const rows = prepareRows(contacts);
    const ws = XLSX.utils.json_to_sheet(rows);

    // Auto-width for columns
    const colWidths = Object.keys(rows[0] || {}).map((key) => ({
      wch: Math.max(key.length, ...rows.map((r) => String(r[key] || '').length), 10),
    }));
    ws['!cols'] = colWidths;

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Leads');
    XLSX.writeFile(wb, 'peanut-leads.xlsx');
  };

  const handleCSV = () => {
    const rows = prepareRows(contacts);
    const ws = XLSX.utils.json_to_sheet(rows);
    const csv = XLSX.utils.sheet_to_csv(ws);
    // BOM for proper UTF-8 encoding in Excel
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'peanut-leads.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const enrichedCount = contacts.filter((c) => c.email).length;

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium text-gray-700">Exportar datos</p>
        <p className="text-xs text-gray-400 mt-0.5">
          {contacts.length} contactos · {enrichedCount} con email
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          onClick={handleExcel}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          📊 Exportar Excel
        </button>
        <button
          onClick={handleCSV}
          className="inline-flex items-center gap-2 bg-gray-700 hover:bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          📄 Exportar CSV
        </button>
      </div>
    </div>
  );
}
