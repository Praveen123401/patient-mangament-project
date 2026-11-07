import { useState } from "react";
import { ChevronDown, Download, FileDown, FileSpreadsheet, FileText, MessageCircle, Printer } from "lucide-react";
import toast from "react-hot-toast";
import Dropdown from "../common/Dropdown";
import printPage from "../../utils/printPage";
import {
  exportInvoiceCsv, exportInvoiceDocx, exportInvoicePdf, shareInvoiceWhatsApp,
} from "../../utils/invoiceExport";

export default function InvoiceActions({ bill }) {
  const [busy, setBusy] = useState("");

  const run = async (key, fn, message) => {
    setBusy(key);
    try {
      await fn(bill);
      if (message) toast.success(message);
    } catch (err) {
      toast.error(err.message || "Could not create the file");
    } finally {
      setBusy("");
    }
  };

  const items = [
    { label: "PDF document (.pdf)", icon: <FileDown size={16} />, onClick: () => run("pdf", exportInvoicePdf, "PDF downloaded") },
    { label: "Word document (.docx)", icon: <FileText size={16} />, onClick: () => run("docx", exportInvoiceDocx, "Word file downloaded") },
    { label: "Excel / CSV (.csv)", icon: <FileSpreadsheet size={16} />, onClick: () => run("csv", exportInvoiceCsv, "CSV downloaded") },
  ];

  return (
    <div className="inv-toolbar no-print">
      <button className="btn btn-outline" onClick={() => printPage(`Invoice ${bill.billNo}`)}>
        <Printer size={16} /> Print
      </button>

      <Dropdown
        align="left"
        items={items}
        trigger={
          <button className="btn btn-primary" disabled={!!busy}>
            <Download size={16} /> {busy ? "Preparing file..." : "Download"} <ChevronDown size={15} />
          </button>
        }
      />

      <button className="btn btn-outline" onClick={() => run("wa", shareInvoiceWhatsApp)}>
        <MessageCircle size={16} /> WhatsApp
      </button>
    </div>
  );
}