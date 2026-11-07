import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";
import { addPayment, getBill } from "../api/billingApi";
import { errMsg } from "../api/axios";
import useFetch from "../hooks/useFetch";
import useDocumentTitle from "../hooks/useDocumentTitle";
import { UPI_ID } from "../utils/constants";
import { formatCurrency } from "../utils/formatCurrency";
import { methodInfo } from "../utils/paymentMethods";
import Breadcrumb from "../components/common/Breadcrumb";
import PageHeader from "../components/common/PageHeader";
import Card from "../components/common/Card";
import FormField from "../components/common/FormField";
import Loader from "../components/common/Loader";
import StatusBadge from "../components/common/StatusBadge";
import PaymentMethodPicker from "../components/common/PaymentMethodPicker";
import UpiQr from "../components/common/UpiQr";

export default function AddPayment() {
  useDocumentTitle("Record payment");
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, loading, error } = useFetch(() => getBill(id), [id]);
  const bill = data?.data;
  const balance = bill ? bill.totalAmount - bill.paidAmount : 0;

  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("cash");
  const [reference, setReference] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // start with the full balance filled in
  useEffect(() => {
    if (bill && amount === "") setAmount(String(balance));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bill]);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!bill) return null;

  if (balance <= 0) {
    return (
      <>
        <Breadcrumb items={[{ label: "Billing", to: "/billing" }, { label: bill.billNo, to: `/billing/${id}` }, { label: "Payment" }]} />
        <p>
          {bill.totalAmount === 0 ? "This bill has no charges yet." : "This bill is fully paid."}{" "}
          <button className="link" style={{ background: "none", border: 0, cursor: "pointer" }} onClick={() => navigate(`/billing/${id}`)}>
            Back to bill
          </button>
        </p>
      </>
    );
  }

  const info = methodInfo(method);
  const value = Number(amount);
  const validAmount = value >= 1 && value <= balance;

  const pickMethod = (m) => {
    setMethod(m);
    setReference("");
    setErrors((e) => ({ ...e, reference: "" }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (!(value >= 1)) errs.amount = "Enter an amount of at least ₹1";
    else if (value > balance) errs.amount = `Amount cannot be more than the balance (${formatCurrency(balance)})`;
    if (info.refRequired && !reference.trim()) errs.reference = `${info.refLabel} is required`;
    setErrors(errs);
    if (Object.keys(errs).length) return;

    setSaving(true);
    try {
      await addPayment(id, { amount: value, method, reference: reference.trim() });
      toast.success(value === balance ? "Bill fully paid" : "Payment recorded");
      navigate(`/billing/${id}`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Billing", to: "/billing" }, { label: bill.billNo, to: `/billing/${id}` }, { label: "Record payment" }]} />
      <PageHeader title="Record payment" subtitle={`${bill.patient?.name} · ${bill.patient?.patientId}`}>
        <StatusBadge status={bill.status} />
      </PageHeader>

      <form onSubmit={onSubmit} noValidate>
        <div className="pay-layout">
          <div>
            <Card title="1. Amount">
              <FormField
                label="Amount (₹)"
                name="amount"
                type="number"
                min="1"
                max={balance}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setErrors((er) => ({ ...er, amount: "" })); }}
                error={errors.amount}
                required
              />
              <div className="page-actions">
                <button type="button" className="btn btn-outline btn-sm" onClick={() => setAmount(String(balance))}>Full balance</button>
                {balance >= 2 && (
                  <button type="button" className="btn btn-outline btn-sm" onClick={() => setAmount(String(Math.floor(balance / 2)))}>Half</button>
                )}
              </div>
            </Card>

            <div style={{ height: 14 }} />

            <Card title="2. Payment method">
              <PaymentMethodPicker value={method} onChange={pickMethod} />
            </Card>

            {(info.ref || info.upi) && (
              <>
                <div style={{ height: 14 }} />
                <Card title="3. Payment details">
                  {info.upi && (
                    UPI_ID ? (
                      validAmount ? (
                        <div className="qr-box">
                          <UpiQr amount={value} note={bill.billNo} size={150} />
                          <div>
                            <strong>Scan to pay {formatCurrency(value)}</strong>
                            <p className="muted">Open {info.value === "upi" ? "any UPI app" : info.label} on the patient's phone and scan this code. After the payment, type the transaction ID below.</p>
                            <p className="muted">Paying to <b>{UPI_ID}</b></p>
                          </div>
                        </div>
                      ) : (
                        <p className="muted">Enter a valid amount to show the QR code.</p>
                      )
                    ) : (
                      <p className="form-note">
                        Tip: set <b>UPI_ID</b> in <code>utils/constants.js</code> to show a scan-and-pay QR code here.
                      </p>
                    )
                  )}

                  {info.ref && (
                    <FormField
                      label={`${info.refLabel}${info.refRequired ? "" : " (recommended)"}`}
                      name="reference"
                      autoComplete="off"
                      maxLength={60}
                      value={reference}
                      onChange={(e) => { setReference(e.target.value); setErrors((er) => ({ ...er, reference: "" })); }}
                      error={errors.reference}
                      required={!!info.refRequired}
                    />
                  )}
                </Card>
              </>
            )}
          </div>

          <div className="pay-summary">
            <Card title="Bill summary">
              <div className="info-row"><span>Bill no</span><b>{bill.billNo}</b></div>
              <div className="info-row"><span>Total</span><b>{formatCurrency(bill.totalAmount)}</b></div>
              <div className="info-row"><span>Already paid</span><b>{formatCurrency(bill.paidAmount)}</b></div>
              <div className="info-row big"><span>Balance due</span><b className="due">{formatCurrency(balance)}</b></div>
              <div className="info-row"><span>Paying now</span><b>{validAmount ? formatCurrency(value) : "-"}</b></div>
              <div className="info-row"><span>Method</span><b>{info.label}</b></div>
              <div className="info-row"><span>Left after this</span><b>{validAmount ? formatCurrency(balance - value) : "-"}</b></div>

              <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 16 }} disabled={saving}>
                {saving ? "Saving..." : "Record payment"}
              </button>
              <button type="button" className="btn btn-outline" style={{ width: "100%", marginTop: 8 }} onClick={() => navigate(-1)}>
                Cancel
              </button>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}