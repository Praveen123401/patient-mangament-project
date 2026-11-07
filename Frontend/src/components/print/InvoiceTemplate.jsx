import { Activity } from "lucide-react";
import { HOSPITAL_INFO, HOSPITAL_NAME, INVOICE_TERMS, UPI_ID } from "../../utils/constants";
import amountInWords from "../../utils/amountInWords";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate, formatDateTime } from "../../utils/formatDate";
import { methodInfo } from "../../utils/paymentMethods";
import UpiQr from "../common/UpiQr";
import "./InvoiceTemplate.css";

const STATUS_LABEL = { paid: "Paid", partial: "Partly paid", unpaid: "Unpaid" };

export default function InvoiceTemplate({ bill }) {
  const balance = bill.totalAmount - bill.paidAmount;
  const p = bill.patient || {};
  const place = [p.city, p.state, p.pincode].filter(Boolean).join(", ");
  const contacts = [
    HOSPITAL_INFO.address,
    [HOSPITAL_INFO.phone && `Phone: ${HOSPITAL_INFO.phone}`, HOSPITAL_INFO.email].filter(Boolean).join("  |  "),
    HOSPITAL_INFO.gstin && `GSTIN: ${HOSPITAL_INFO.gstin}`,
  ].filter(Boolean);
  const last = bill.payments?.length ? bill.payments[bill.payments.length - 1] : null;
  const label = STATUS_LABEL[bill.status] || bill.status;

  return (
    <div className="invoice-sheet">
      <span className={`inv-watermark ${bill.status}`}>{label}</span>

      <div className="inv-head">
        <div className="inv-brand">
          <span className="inv-logo"><Activity size={26} /></span>
          <div>
            <h2>{HOSPITAL_NAME}</h2>
            {contacts.map((c) => (
              <p key={c}>{c}</p>
            ))}
          </div>
        </div>
        <div className="inv-title">
          <h1>INVOICE</h1>
          <span className="inv-no">{bill.billNo}</span>
        </div>
      </div>

      <div className="inv-info">
        <div className="inv-card">
          <span className="inv-label">Billed to</span>
          <strong>{p.name || "-"}</strong>
          {p.patientId && <p>Patient ID: {p.patientId}</p>}
          {p.phone && <p>Phone: {p.phone}</p>}
          {p.address && <p>{p.address}</p>}
          {place && <p>{place}</p>}
        </div>

        <div className="inv-card">
          <span className="inv-label">Invoice details</span>
          <div className="inv-kv"><span>Invoice no</span><b>{bill.billNo}</b></div>
          <div className="inv-kv"><span>Date</span><b>{formatDate(bill.createdAt)}</b></div>
          {last && <div className="inv-kv"><span>Last payment</span><b>{formatDate(last.date)}</b></div>}
        </div>

        <div className={`inv-card inv-status ${bill.status}`}>
          <span className="inv-label">Payment status</span>
          <strong>{label}</strong>
          <p>{balance > 0 ? `${formatCurrency(balance)} still due` : "Nothing due"}</p>
        </div>
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
            {bill.items.map((it, i) => (
              <tr key={it._id || i}>
                <td className="c-n">{i + 1}</td>
                <td>{it.description}</td>
                <td className="r">{it.quantity}</td>
                <td className="r">{formatCurrency(it.amount)}</td>
                <td className="r"><b>{formatCurrency(it.amount * it.quantity)}</b></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="inv-bottom">
        <div className="inv-left">
          <span className="inv-label">Amount in words</span>
          <p className="inv-words">{amountInWords(bill.totalAmount)}</p>

          {bill.payments?.length > 0 && (
            <>
              <span className="inv-label">Payments received</span>
              <ul className="inv-pay">
                {bill.payments.map((pay, i) => {
                  const m = methodInfo(pay.method);
                  return (
                    <li key={pay._id || i}>
                      <div>
                        <span className="inv-chip" style={{ color: m.color, background: m.bg }}>{m.label}</span>
                        {pay.reference && <em>Ref {pay.reference}</em>}
                        <span className="inv-date">{formatDateTime(pay.date)}</span>
                      </div>
                      <b>{formatCurrency(pay.amount)}</b>
                    </li>
                  );
                })}
              </ul>
            </>
          )}

          {balance > 0 && UPI_ID && (
            <div className="inv-paynow">
              <UpiQr amount={balance} note={bill.billNo} size={104} />
              <div>
                <strong>Pay the balance by UPI</strong>
                <p>Scan with Google Pay, PhonePe, Paytm or any UPI app.</p>
                <p><b>{UPI_ID}</b></p>
              </div>
            </div>
          )}
        </div>

        <div className="inv-totals">
          <div><span>Sub total</span><b>{formatCurrency(bill.totalAmount)}</b></div>
          <div><span>Paid</span><b>{formatCurrency(bill.paidAmount)}</b></div>
          <div className={`inv-due ${balance > 0 ? "due" : "clear"}`}>
            <span>Balance due</span>
            <b>{formatCurrency(balance)}</b>
          </div>
        </div>
      </div>

      {INVOICE_TERMS && (
        <div className="inv-terms">
          <span className="inv-label">Terms</span>
          <p>{INVOICE_TERMS}</p>
        </div>
      )}

      <div className="inv-foot">
        <p>Thank you for choosing {HOSPITAL_NAME}.<br />This is a computer generated invoice.</p>
        <div className="inv-sign"><span>Authorised signature</span></div>
      </div>
    </div>
  );
}