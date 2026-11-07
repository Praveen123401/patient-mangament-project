
const Invoice = require("../models/Invoice");
const { generateInvoicePDF } = require("../utils/generateInvoicePDF");
const { sendInvoiceByEmail } = require("../utils/emailService");

// CREATE INVOICE AND SEND EMAIL
exports.createInvoice = async (req, res) => {
  try {
    const {
      patientId,
      patientName,
      patientEmail,
      patientPhone,
      items,
      discount = 0,
      tax = 0,
      paymentStatus = "PENDING",
      paymentMethod,
    } = req.body;

    if (
      !patientName?.trim() ||
      !patientEmail?.trim() ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Patient details and invoice items are required.",
      });
    }

    const validItems = items.map((item) => {
      const quantity = Number(item.quantity);
      const price = Number(item.price);

      if (
        !item.description?.trim() ||
        !Number.isInteger(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(price) ||
        price < 0
      ) {
        throw new Error("Invalid invoice item.");
      }

      return {
        description: item.description.trim(),
        quantity,
        price,
        amount: Math.round(quantity * price * 100) / 100,
      };
    });

    const subtotal = validItems.reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const discountAmount = Number(discount);
    const taxAmount = Number(tax);

    if (
      !Number.isFinite(discountAmount) ||
      !Number.isFinite(taxAmount) ||
      discountAmount < 0 ||
      taxAmount < 0 ||
      discountAmount > subtotal
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid discount or tax amount.",
      });
    }

    const totalAmount =
      Math.round((subtotal - discountAmount + taxAmount) * 100) / 100;

    const invoice = await Invoice.create({
      invoiceNumber: `INV-${Date.now()}`,
      patientId: patientId || null,
      patientName: patientName.trim(),
      patientEmail: patientEmail.trim(),
      patientPhone,
      items: validItems,
      subtotal,
      discount: discountAmount,
      tax: taxAmount,
      totalAmount,
      paymentStatus,
      paymentMethod,
      emailStatus: "PENDING",
    });

    try {
      const pdfBuffer = await generateInvoicePDF(invoice);

      await sendInvoiceByEmail(invoice, pdfBuffer);

      invoice.emailStatus = "SENT";
      invoice.emailSentAt = new Date();
      invoice.emailError = null;

      await invoice.save();

      return res.status(201).json({
        success: true,
        message: "Invoice generated and sent to patient's Gmail.",
        invoice,
      });
    } catch (emailError) {
      console.error("Invoice email error:", emailError);

      invoice.emailStatus = "FAILED";
      invoice.emailError = emailError.message;

      await invoice.save();

      return res.status(201).json({
        success: true,
        message: "Invoice saved, but email delivery failed. You can retry.",
        invoice,
      });
    }
  } catch (error) {
    console.error("Create invoice error:", error);

    return res.status(400).json({
      success: false,
      message: error.message || "Unable to generate invoice.",
    });
  }
};

// GET ALL INVOICES
exports.getInvoices = async (req, res) => {
  try {
    const invoices = await Invoice.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: invoices.length,
      invoices,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Unable to fetch invoices.",
    });
  }
};

// RESEND INVOICE EMAIL
exports.resendInvoiceEmail = async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found.",
      });
    }

    const pdfBuffer = await generateInvoicePDF(invoice);

    await sendInvoiceByEmail(invoice, pdfBuffer);

    invoice.emailStatus = "SENT";
    invoice.emailSentAt = new Date();
    invoice.emailError = null;

    await invoice.save();

    return res.status(200).json({
      success: true,
      message: "Invoice email sent successfully.",
      invoice,
    });
  } catch (error) {
    console.error("Resend invoice error:", error);

    await Invoice.findByIdAndUpdate(req.params.id, {
      emailStatus: "FAILED",
      emailError: error.message,
    });

    return res.status(500).json({
      success: false,
      message: "Unable to resend invoice email.",
    });
  }
};
