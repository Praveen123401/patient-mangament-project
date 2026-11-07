
const PDFDocument = require("pdfkit");

exports.generateInvoicePDF = (invoice) => {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margin: 50,
    });

    const chunks = [];

    doc.on("data", (chunk) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    const money = (amount) =>
      `Rs. ${Number(amount).toFixed(2)}`;

    // Hospital heading
    doc
      .fontSize(23)
      .font("Helvetica-Bold")
      .text("HOSPITAL INVOICE", { align: "center" });

    doc.moveDown();

    doc.fontSize(10).font("Helvetica");
    doc.text("Hospital Billing Department", { align: "center" });
    doc.text("Official Patient Invoice", { align: "center" });

    doc.moveDown(2);

    // Invoice information
    doc.font("Helvetica-Bold").text("Invoice Details");
    doc.moveDown(0.5);

    doc.font("Helvetica");
    doc.text(`Invoice Number: ${invoice.invoiceNumber}`);
    doc.text(
      `Invoice Date: ${new Date(invoice.createdAt).toLocaleDateString("en-IN")}`
    );

    doc.moveDown();

    // Patient details
    doc.font("Helvetica-Bold").text("Patient Information");
    doc.moveDown(0.5);

    doc.font("Helvetica");
    doc.text(`Patient Name: ${invoice.patientName}`);
    doc.text(`Email: ${invoice.patientEmail}`);

    if (invoice.patientPhone) {
      doc.text(`Phone: ${invoice.patientPhone}`);
    }

    doc.moveDown(2);

    // Table heading
    const startX = 50;
    const descriptionX = 50;
    const quantityX = 310;
    const priceX = 370;
    const amountX = 460;

    const drawTableHeader = (y) => {
      doc.font("Helvetica-Bold").fontSize(10);

      doc.text("Description", descriptionX, y);
      doc.text("Qty", quantityX, y);
      doc.text("Price", priceX, y);
      doc.text("Amount", amountX, y);

      doc.moveTo(startX, y + 18)
        .lineTo(545, y + 18)
        .stroke();
    };

    let y = doc.y + 10;
    drawTableHeader(y);
    y += 30;

    doc.font("Helvetica").fontSize(9);

    invoice.items.forEach((item) => {
      if (y > 700) {
        doc.addPage();
        y = 60;
        drawTableHeader(y);
        y += 30;
        doc.font("Helvetica").fontSize(9);
      }

      doc.text(item.description, descriptionX, y, {
        width: 245,
      });

      doc.text(String(item.quantity), quantityX, y);
      doc.text(money(item.price), priceX, y);
      doc.text(money(item.amount), amountX, y);

      y += 25;
    });

    // Totals
    y += 15;

    if (y > 690) {
      doc.addPage();
      y = 60;
    }

    doc.moveTo(350, y).lineTo(545, y).stroke();

    y += 15;

    doc.fontSize(10).font("Helvetica");
    doc.text(`Subtotal: ${money(invoice.subtotal)}`, 350, y);
    y += 20;

    doc.text(`Discount: ${money(invoice.discount)}`, 350, y);
    y += 20;

    doc.text(`Tax: ${money(invoice.tax)}`, 350, y);
    y += 25;

    doc.font("Helvetica-Bold").fontSize(13);
    doc.text(`TOTAL: ${money(invoice.totalAmount)}`, 350, y);

    y += 35;

    doc.font("Helvetica").fontSize(10);
    doc.text(`Payment Status: ${invoice.paymentStatus}`, 50, y);

    if (invoice.paymentMethod) {
      doc.text(`Payment Method: ${invoice.paymentMethod}`, 50, y + 18);
    }

    doc.moveDown(4);

    doc.fontSize(9).text(
      "Thank you for choosing our hospital. Please contact the billing department for any invoice queries.",
      50,
      Math.min(doc.y, 760),
      { align: "center", width: 495 }
    );

    doc.end();
  });
};
