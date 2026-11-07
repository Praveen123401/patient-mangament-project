import { Download } from "lucide-react";

function csvCell(value) {
  const text = value == null ? "" : String(value);
  return `"${text.replaceAll('"', '""')}"`;
}

export default function ExportButton({ rows = [], columns = [], filename = "export.csv" }) {
  const exportCsv = () => {
    const header = columns.map((column) => csvCell(column.label)).join(",");
    const body = rows.map((row) =>
      columns.map((column) => csvCell(row[column.key])).join(",")
    );
    const csv = [header, ...body].join("\r\n");
    const blob = new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <button type="button" className="btn btn-outline" onClick={exportCsv} disabled={!rows.length}>
      <Download size={16} />
      Export
    </button>
  );
}
