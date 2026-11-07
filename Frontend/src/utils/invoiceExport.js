import { HOSPITAL_INFO, HOSPITAL_NAME } from "./constants";
import amountInWords from "./amountInWords";
import { formatCurrency } from "./formatCurrency";
import { formatDate, formatDateTime } from "./formatDate";

const rs = (n) => `Rs. ${Number(n || 0).toLocaleString("en-IN")}`;
const STATUS_LABEL = { paid: "PAID", partial: "PARTLY PAID", unpaid: "UNPAID" };
const STATUS_RGB = { paid: [22, 163, 74], partial: [217, 119, 6], unpaid: [220, 38, 38] };

const contactLines = () =>
  [
    HOSPITAL_INFO.address,
    [HOSPITAL_INFO.phone && `Phone: ${HOSPITAL_INFO.phone}`, HOSPITAL_INFO.email].filter(Boolean).join("  |  "),
    HOSPITAL_INFO.gstin && `GSTIN: ${HOSPITAL_INFO.gstin}`,
  ].filter(Boolean);

const patientLines = (p = {}) =>
  [
    p.patientId && `Patient ID: ${p.patientId}`,
    p.phone && `Phone: ${p.phone}`,
    p.address,
    [p.city, p.state, p.pincode].filter(Boolean).join(", "),
  ].filter(Boolean);

const lineTotal = (it) => it.amount * it.quantity;
const csvCell = (value) => `"${String(value ?? "").replaceAll('"', '""')}"`;

function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

/* ---------------------------- PDF ---------------------------- */
export async function exportInvoicePdf(bill, options = {}) {
  const [{ jsPDF }, atMod] = await Promise.all([import("jspdf"), import("jspdf-autotable")]);
  const autoTable = atMod.default;

  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 14;
  const balance = bill.totalAmount - bill.paidAmount;

  // header band
  doc.setFillColor(37, 99, 235);
  doc.rect(0, 0, W, 36, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text(HOSPITAL_NAME, M, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  contactLines().slice(0, 3).forEach((t, i) => doc.text(t, M, 21 + i * 4.5));
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("INVOICE", W - M, 16, { align: "right" });
  doc.setFontSize(10);
  doc.text(bill.billNo, W - M, 23, { align: "right" });

  // billed to and invoice details
  const y = 48;
  const pLines = patientLines(bill.patient);
  doc.setTextColor(100, 116, 139);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("BILLED TO", M, y);
  doc.text("INVOICE DETAILS", W / 2 + 10, y);

  doc.setTextColor(31, 41, 55);
  doc.setFontSize(12);
  doc.text(bill.patient?.name || "-", M, y + 6);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  pLines.forEach((t, i) => doc.text(t, M, y + 12 + i * 5));

  [
    ["Invoice no", bill.billNo],
    ["Date", formatDate(bill.createdAt)],
    ["Status", STATUS_LABEL[bill.status] || bill.status],
  ].forEach(([k, v], i) => {
    const ry = y + 6 + i * 6;
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(k, W / 2 + 10, ry);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...(k === "Status" ? STATUS_RGB[bill.status] || [31, 41, 55] : [31, 41, 55]));
    doc.text(String(v), W - M, ry, { align: "right" });
  });

  // items table
  autoTable(doc, {
    startY: y + 12 + Math.max(pLines.length * 5, 20) + 4,
    head: [["#", "Description", "Qty", "Rate", "Amount"]],
    body: bill.items.map((it, i) => [i + 1, it.description, it.quantity, rs(it.amount), rs(lineTotal(it))]),
    theme: "striped",
    margin: { left: M, right: M },
    styles: { fontSize: 9.5, cellPadding: 3, textColor: [31, 41, 55] },
    headStyles: { fillColor: [241, 245, 249], textColor: [71, 85, 105], fontStyle: "bold" },
    alternateRowStyles: { fillColor: [250, 251, 253] },
    columnStyles: {
      0: { cellWidth: 12 },
      2: { halign: "right", cellWidth: 16 },
      3: { halign: "right", cellWidth: 32 },
      4: { halign: "right", cellWidth: 36 },
    },
  });

  // totals
  let ty = doc.lastAutoTable.finalY + 9;
  if (ty > H - 75) {
    doc.addPage();
    ty = 20;
  }
  const wordsY = ty;
  const lx = W - M - 70;
  const put = (label, value, o = {}) => {
    doc.setFont("helvetica", o.bold ? "bold" : "normal");
    doc.setFontSize(o.size || 10);
    doc.setTextColor(...(o.color || [31, 41, 55]));
    doc.text(label, lx, ty);
    doc.text(value, W - M, ty, { align: "right" });
    ty += o.gap || 6.5;
  };
  put("Total", rs(bill.totalAmount));
  put("Paid", rs(bill.paidAmount), { gap: 3 });
  doc.setDrawColor(217, 222, 231);
  doc.line(lx, ty, W - M, ty);
  ty += 6;
  put("Balance due", rs(balance), { bold: true, size: 12, color: balance > 0 ? [220, 38, 38] : [22, 163, 74] });

  // amount in words (left of totals)
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text("AMOUNT IN WORDS", M, wordsY);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(31, 41, 55);
  doc.text(doc.splitTextToSize(amountInWords(bill.totalAmount), lx - M - 8), M, wordsY + 5);

  // payments
  if (bill.payments?.length) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text("PAYMENTS RECEIVED", M, ty + 4);
    autoTable(doc, {
      startY: ty + 7,
      head: [["Date", "Method", "Amount"]],
      body: bill.payments.map((p) => [formatDateTime(p.date), String(p.method || "").toUpperCase(), rs(p.amount)]),
      theme: "plain",
      margin: { left: M, right: M },
      styles: { fontSize: 9, cellPadding: 2.5, textColor: [31, 41, 55] },
      headStyles: { textColor: [100, 116, 139], fontStyle: "bold", lineColor: [217, 222, 231], lineWidth: { bottom: 0.3 } },
      columnStyles: { 2: { halign: "right" } },
    });
  }

  // footer on every page
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184);
    doc.text(`Thank you for choosing ${HOSPITAL_NAME}. This is a computer generated invoice.`, W / 2, H - 10, { align: "center" });
    if (pages > 1) doc.text(`Page ${i} of ${pages}`, W - M, H - 10, { align: "right" });
  }
  const pdfBlob = doc.output("blob");

  if (options.returnBlob) {
    return pdfBlob;
  }

  doc.save(`${bill.billNo}.pdf`);
}

/* ---------------------------- Word (.docx) ---------------------------- */
export async function exportInvoiceDocx(bill) {
  const { AlignmentType, BorderStyle, Document, Packer, Paragraph, ShadingType, Table, TableCell, TableRow, TextRun, WidthType } =
    await import("docx");

  const none = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
  const noBorders = { top: none, bottom: none, left: none, right: none };
  const grey = { style: BorderStyle.SINGLE, size: 4, color: "D9DEE7" };
  const grid = { top: grey, bottom: grey, left: grey, right: grey, insideHorizontal: grey, insideVertical: grey };
  const pct = (n) => ({ size: n, type: WidthType.PERCENTAGE });

  const para = (text, o = {}) =>
    new Paragraph({
      alignment: o.align,
      spacing: { after: o.after ?? 40 },
      children: [new TextRun({ text: String(text ?? ""), bold: o.bold, size: o.size ?? 21, color: o.color })],
    });

  const cell = (text, o = {}) =>
    new TableCell({
      width: o.w ? pct(o.w) : undefined,
      borders: o.plain ? noBorders : undefined,
      shading: o.fill ? { type: ShadingType.CLEAR, color: "auto", fill: o.fill } : undefined,
      margins: { top: 90, bottom: 90, left: 120, right: 120 },
      children: (Array.isArray(text) ? text : [text]).map((t) => para(t, { ...o, after: 0 })),
    });

  const balance = bill.totalAmount - bill.paidAmount;
  const contacts = contactLines();

  const header = new Table({
    width: pct(100),
    borders: { ...noBorders, insideHorizontal: none, insideVertical: none },
    rows: [
      new TableRow({
        children: [
          cell([HOSPITAL_NAME, ...contacts], { w: 65, plain: true, fill: "2563EB", color: "FFFFFF", bold: true, size: 24 }),
          cell(["INVOICE", bill.billNo], { w: 35, plain: true, fill: "2563EB", color: "FFFFFF", bold: true, align: AlignmentType.RIGHT, size: 26 }),
        ],
      }),
    ],
  });

  const parties = new Table({
    width: pct(100),
    borders: { ...noBorders, insideHorizontal: none, insideVertical: none },
    rows: [
      new TableRow({
        children: [
          cell(["BILLED TO", bill.patient?.name || "-", ...patientLines(bill.patient)], { w: 55, plain: true }),
          cell(
            ["INVOICE DETAILS", `Invoice no: ${bill.billNo}`, `Date: ${formatDate(bill.createdAt)}`, `Status: ${STATUS_LABEL[bill.status] || bill.status}`],
            { w: 45, plain: true }
          ),
        ],
      }),
    ],
  });

  const head = (t, w, align) => cell(t, { w, fill: "F1F5F9", bold: true, color: "475569", align });
  const items = new Table({
    width: pct(100),
    borders: grid,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [head("#", 6), head("Description", 44), head("Qty", 10, AlignmentType.RIGHT), head("Rate", 18, AlignmentType.RIGHT), head("Amount", 22, AlignmentType.RIGHT)],
      }),
      ...bill.items.map(
        (it, i) =>
          new TableRow({
            children: [
              cell(String(i + 1), { w: 6 }),
              cell(it.description, { w: 44 }),
              cell(String(it.quantity), { w: 10, align: AlignmentType.RIGHT }),
              cell(formatCurrency(it.amount), { w: 18, align: AlignmentType.RIGHT }),
              cell(formatCurrency(lineTotal(it)), { w: 22, align: AlignmentType.RIGHT, bold: true }),
            ],
          })
      ),
    ],
  });

  const totals = new Table({
    width: pct(45),
    alignment: AlignmentType.RIGHT,
    borders: grid,
    rows: [
      ["Total", formatCurrency(bill.totalAmount), false],
      ["Paid", formatCurrency(bill.paidAmount), false],
      ["Balance due", formatCurrency(balance), true],
    ].map(
      ([k, v, strong]) =>
        new TableRow({
          children: [
            cell(k, { w: 50, bold: strong, fill: strong ? "EFF4FF" : undefined }),
            cell(v, { w: 50, bold: true, align: AlignmentType.RIGHT, color: strong ? (balance > 0 ? "DC2626" : "16A34A") : undefined, fill: strong ? "EFF4FF" : undefined }),
          ],
        })
    ),
  });

  const children = [
    header,
    para("", { after: 120 }),
    parties,
    para("", { after: 120 }),
    items,
    para("", { after: 160 }),
    totals,
    para("", { after: 120 }),
    para(`Amount in words: ${amountInWords(bill.totalAmount)}`, { bold: true, after: 160 }),
  ];

  if (bill.payments?.length) {
    children.push(para("Payments received", { bold: true, color: "475569", after: 80 }));
    children.push(
      new Table({
        width: pct(70),
        borders: grid,
        rows: [
          new TableRow({ children: [head("Date", 45), head("Method", 25), head("Amount", 30, AlignmentType.RIGHT)] }),
          ...bill.payments.map(
            (p) =>
              new TableRow({
                children: [
                  cell(formatDateTime(p.date), { w: 45 }),
                  cell(String(p.method || "").toUpperCase(), { w: 25 }),
                  cell(formatCurrency(p.amount), { w: 30, align: AlignmentType.RIGHT }),
                ],
              })
          ),
        ],
      })
    );
  }

  children.push(para("", { after: 240 }));
  children.push(para(`Thank you for choosing ${HOSPITAL_NAME}. This is a computer generated invoice.`, { color: "94A3B8", size: 18, align: AlignmentType.CENTER }));

  const doc = new Document({
    styles: { default: { document: { run: { font: "Calibri", size: 21 } } } },
    sections: [{ properties: { page: { margin: { top: 720, bottom: 720, left: 900, right: 900 } } }, children }],
  });

  download(await Packer.toBlob(doc), `${bill.billNo}.docx`);
}

/* ---------------------------- CSV (opens in Excel) ---------------------------- */
export function exportInvoiceCsv(bill) {
  const rows = [
    ...bill.items.map((it, i) => ({ n: i + 1, description: it.description, qty: it.quantity, rate: it.amount, amount: lineTotal(it) })),
    { n: "", description: "Total", qty: "", rate: "", amount: bill.totalAmount },
    { n: "", description: "Paid", qty: "", rate: "", amount: bill.paidAmount },
    { n: "", description: "Balance due", qty: "", rate: "", amount: bill.totalAmount - bill.paidAmount },
  ];
  const columns = [
    { label: "#", key: "n" },
    { label: "Description", key: "description" },
    { label: "Qty", key: "qty" },
    { label: "Rate", key: "rate" },
    { label: "Amount", key: "amount" },
  ];
  const csv = [
    columns.map(({ label }) => csvCell(label)).join(","),
    ...rows.map((row) =>
      columns.map(({ key }) => csvCell(row[key])).join(",")
    ),
  ].join("\r\n");

  download(
    new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }),
    `${bill.billNo}.csv`
  );
}

/* ---------------------------- WhatsApp message ---------------------------- */
export function shareInvoiceWhatsApp(bill) {
  const digits = String(bill.patient?.phone || "").replace(/\D/g, "");
  if (digits.length < 10) throw new Error("This patient has no valid phone number");
  const phone = digits.length === 10 ? `91${digits}` : digits; // Indian numbers get the 91 prefix
  const balance = bill.totalAmount - bill.paidAmount;

  const text = [
    `Hello ${bill.patient?.name || ""},`,
    `Your invoice ${bill.billNo} dated ${formatDate(bill.createdAt)} from ${HOSPITAL_NAME}:`,
    `Total: ${formatCurrency(bill.totalAmount)}`,
    `Paid: ${formatCurrency(bill.paidAmount)}`,
    `Balance due: ${formatCurrency(balance)}`,
    balance <= 0 ? "Thank you for your payment." : "Please clear the balance at your next visit.",
  ].join("\n");

  window.open(`https://wa.me/${phone}?text=${encodeURIComponent(text)}`, "_blank", "noopener");
}