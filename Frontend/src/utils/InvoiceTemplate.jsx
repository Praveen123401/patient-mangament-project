
import { Activity, ShieldCheck } from "lucide-react";
import { HOSPITAL_INFO, HOSPITAL_NAME } from "../../utils/constants";
import amountInWords from "../../utils/amountInWords";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import "./InvoiceTemplate.css";

const STATUS_LABEL = {
  paid: "Paid",
  partial: "Partly Paid",
  unpaid: "Unpaid",
};

export default function InvoiceTemplate({ bill }) {
  if (!bill) return null;

  const balance = Math.max(
    Number(bill.totalAmount || 0) - Number(bill.paidAmount || 0),
    0
  );

  const p = bill.patient || {};
  const payments = bill.payments || [];
  const items = bill.items || [];

  const place = [p.city, p.state, p.pincode]
    .filter(Boolean)
    .join(", ");

  const contacts = [
    HOSPITAL_INFO.address,
    [
      HOSPITAL_INFO.phone && `Phone: ${HOSPITAL_INFO.phone}`,
      HOSPITAL_INFO.email,
    ]
      .filter(Boolean)
      .join(" | "),
    HOSPITAL_INFO.gstin && `GSTIN: ${HOSPITAL_INFO.gstin}`,
  ].filter(Boolean);

  const status = bill.status || "unpaid";
  const statusLabel = STATUS_LABEL[status] || status;

  return (
    <div className="invoice-page">
      <div className="invoice-sheet">

        {/* Header */}
        <header className="inv-head">
          <div className="inv-brand">
            <div className="inv-logo">
              <Activity size={30} />
            </div>

            <div className="inv-hospital-info">
              <h2>{HOSPITAL_NAME}</h2>
              <p className="inv-tagline">
                Quality Healthcare • Compassionate Care
              </p>

              {contacts.map((contact, index) => (
                <p key={index}>{contact}</p>
              ))}
            </div>
          </div>

          <div className="inv-title">
            <span className="inv-title-label">BILLING DOCUMENT</span>
            <h1>INVOICE</h1>
            <strong>{bill.billNo}</strong>
            <span className={`inv-pill ${status}`}>
              {statusLabel}
            </span>
          </div>
        </header>

        <div className="inv-divider" />

        {/* Invoice and patient information */}
        <section className="inv-meta">

          <div className="inv-patient-card">
            <span className="inv-section-label">BILLED TO</span>

            <h3>{p.name || "Patient"}</h3>

            <p>
              <strong>Patient ID:</strong>{" "}
              {p.patientId || "N/A"}
            </p>

            {p.phone && (
              <p>
                <strong>Phone:</strong> {p.phone}
              </p>
            )}

            {p.email && (
              <p>
                <strong>Email:</strong> {p.email}
              </p>
            )}

            {p.address && <p>{p.address}</p>}
            {place && <p>{place}</p>}
          </div>

          <div className="inv-details-card">
            <span className="inv-section-label">INVOICE DETAILS</span>

            <div className="inv-kv">
              <span>Invoice Number</span>
              <b>{bill.billNo}</b>
            </div>

            <div className="inv-kv">
              <span>Invoice Date</span>
              <b>{formatDate(bill.createdAt)}</b>
            </div>

            <div className="inv-kv">
              <span>Invoice Time</span>
              <b>{formatDateTime(bill.createdAt)}</b>
            </div>

            {bill.dueDate && (
              <div className="inv-kv">
                <span>Due Date</span>
                <b>{formatDate(bill.dueDate)}</b>
              </div>
            )}

            <div className="inv-kv">
              <span>Payment Status</span>
              <b className={`inv-status-text ${status}`}>
                {statusLabel}
              </b>
            </div>
          </div>
        </section>

        {/* Billing items */}
        <section className="inv-items-section">
          <div className="inv-section-heading">
            <h3>Billing Details</h3>
            <span>Itemized Statement</span>
          </div>

          <div className="inv-table-wrap">
            <table className="inv-table">
              <thead>
                <tr>
                  <th className="c-n">#</th>
                  <th>Description</th>
                  <th className="r">Qty</th>
                  <th className="r">Rate</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>

              <tbody>
                {items.length > 0 ? (
                  items.map((item, index) => (
                    <tr key={item._id || index}>
                      <td className="c-n">{index + 1}</td>
                      <td>{item.description}</td>
                      <td className="r">{item.quantity}</td>
                      <td className="r">
                        {formatCurrency(item.amount)}
                      </td>
                      <td className="r inv-item-amount">
                        {formatCurrency(
                          Number(item.amount || 0) *
                          Number(item.quantity || 1)
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="inv-empty">
                      No billing items available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* Payment and totals */}
        <section className="inv-bottom">

          <div className="inv-left">

            <div className="inv-words-box">
              <span className="inv-section-label">
                AMOUNT IN WORDS
              </span>
              <p>{amountInWords(bill.totalAmount)}</p>
              <small>Indian Rupees Only</small>
            </div>

            <div className="inv-payment-section">
              <h3>Payment History</h3>

              {payments.length > 0 ? (
                <div className="inv-payment-list">
                  {payments.map((payment, index) => (
                    <div
                      className="inv-payment-item"
                      key={payment._id || index}
                    >
                      <div className="inv-payment-info">
                        <strong>
                          {String(payment.method || "N/A")
                            .replaceAll("_", " ")
                            .toUpperCase()}
                        </strong>

                        <span>
                          {payment.date
                            ? formatDateTime(payment.date)
                            : "Date unavailable"}
                        </span>

                        {payment.transactionId && (
                          <small>
                            Transaction ID: {payment.transactionId}
                          </small>
                        )}
                      </div>

                      <b>{formatCurrency(payment.amount)}</b>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="inv-no-payment">
                  No payments recorded yet.
                </p>
              )}
            </div>
          </div>

          {/* Amount summary */}
          <div className="inv-totals">
            <h3>Payment Summary</h3>

            <div className="inv-total-row">
              <span>Total Amount</span>
              <b>{formatCurrency(bill.totalAmount)}</b>
            </div>

            <div className="inv-total-row inv-paid">
              <span>Amount Paid</span>
              <b>{formatCurrency(bill.paidAmount)}</b>
            </div>

            <div className={`inv-total-row inv-due ${balance > 0 ? "due" : "clear"}`}>
              <span>Balance Due</span>
              <b>{formatCurrency(balance)}</b>
            </div>

            <div className="inv-grand-total">
              <span>Invoice Total</span>
              <strong>{formatCurrency(bill.totalAmount)}</strong>
            </div>

            <div className="inv-payment-status">
              <ShieldCheck size={17} />
              <span>{statusLabel}</span>
            </div>
          </div>
        </section>

        {/* Signature */}
        <section className="inv-foot">
          <div className="inv-thankyou">
            <h3>Thank You!</h3>
            <p>
              Thank you for choosing {HOSPITAL_NAME}.
            </p>
            <p>
              We wish you good health and a speedy recovery.
            </p>
          </div>

          <div className="inv-sign">
            <div className="inv-sign-line" />
            <strong>Authorized Signature</strong>
            <span>Hospital Billing Department</span>
          </div>
        </section>

        {/* Footer */}
        <footer className="inv-footer">
          <p>
            This is a computer-generated invoice.
            Please retain it for your records.
          </p>
          <strong>{HOSPITAL_NAME}</strong>
          <span>Thank you for your trust in our care.</span>
        </footer>

      </div>
    </div>
  );
}
