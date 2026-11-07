
const nodemailer = require("nodemailer");

exports.sendInvoiceByEmail = async (invoice, pdfBuffer) => {
  const gmailUser = process.env.GMAIL_USER?.trim();
  const gmailAppPassword = process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, "");

  if (!gmailUser || !gmailAppPassword) {
    throw new Error("Gmail configuration is missing in .env");
  }

  if (!invoice.patientEmail) {
    throw new Error("Patient email address is missing.");
  }

  if (!Buffer.isBuffer(pdfBuffer)) {
    throw new Error("Invoice PDF must be provided as a Buffer.");
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: gmailUser,
      pass: gmailAppPassword,
    },
  });

  try {
    await transporter.verify();

    return await transporter.sendMail({
      from: `"Hospital Billing" <${gmailUser}>`,
      to: invoice.patientEmail,
      subject: `Hospital Invoice - ${invoice.invoiceNumber}`,
      text: `Dear ${invoice.patientName},

Your hospital invoice has been generated.

Invoice Number: ${invoice.invoiceNumber}
Total Amount: Rs. ${Number(invoice.totalAmount).toFixed(2)}
Payment Status: ${invoice.paymentStatus}

Please find your invoice PDF attached.

Thank you for choosing our hospital.
Hospital Billing Department.`,
      attachments: [
        {
          filename: `${invoice.invoiceNumber}.pdf`,
          content: pdfBuffer,
          contentType: "application/pdf",
        },
      ],
    });
  } catch (error) {
    if (error.code === "EAUTH") {
      throw new Error(
        "Gmail rejected the login. Set GMAIL_USER to the sending Gmail address and GMAIL_APP_PASSWORD to a current Google App Password (not the normal account password), then restart the backend."
      );
    }

    throw error;
  }
};
