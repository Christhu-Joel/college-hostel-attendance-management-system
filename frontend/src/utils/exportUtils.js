import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportCSV(headers, rows, filename) {
  const escape = (v) => {
    const s = String(v ?? '');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => lines.push(r.map((c) => escape(c)).join(',')));
  downloadBlob('\uFEFF' + lines.join('\r\n'), `${filename}.csv`, 'text/csv;charset=utf-8;');
}

export function exportExcel(headers, rows, filename, sheetName = 'Report') {
  const data = rows.map((r) =>
    Object.fromEntries(headers.map((h, i) => [h, r[i] ?? '']))
  );
  const ws = XLSX.utils.json_to_sheet(data, { header: headers });
  ws['!cols'] = headers.map((h) => ({ wch: Math.max(h.length + 4, 14) }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName.slice(0, 31));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}

export function exportPDF(headers, rows, filename, { title = 'Report', subtitle = '' } = {}) {
  const doc = new jsPDF();
  doc.setFontSize(15);
  doc.text(title, 14, 18);
  doc.setFontSize(10);
  doc.setTextColor(120);
  if (subtitle) doc.text(subtitle, 14, 24);
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, subtitle ? 30 : 24);
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: subtitle ? 36 : 30,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [27, 42, 74] },
  });
  doc.save(`${filename}.pdf`);
}

export function printPage() {
  window.print();
}
