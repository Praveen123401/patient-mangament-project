import { ArrowLeftRight, Banknote, CreditCard, FileText, Globe, ShieldCheck, Smartphone } from "lucide-react";

// upi: true      -> the QR code is shown
// ref            -> the reference box is shown (refLabel is its label)
// refRequired    -> the reference must be filled in
export const PAYMENT_METHODS = [
  { value: "gpay", label: "Google Pay", group: "UPI apps", badge: "G", color: "#1a73e8", bg: "#e8f0fe", upi: true, ref: true, refLabel: "UPI transaction ID" },
  { value: "phonepe", label: "PhonePe", group: "UPI apps", badge: "Pe", color: "#5f259f", bg: "#f1e8fb", upi: true, ref: true, refLabel: "UPI transaction ID" },
  { value: "paytm", label: "Paytm", group: "UPI apps", badge: "P", color: "#00839f", bg: "#e0f5fa", upi: true, ref: true, refLabel: "UPI transaction ID" },
  { value: "upi", label: "Other UPI", group: "UPI apps", icon: Smartphone, color: "#0f766e", bg: "#e6f7f4", upi: true, ref: true, refLabel: "UPI transaction ID" },

  { value: "card", label: "Debit / credit card", group: "Cards and banking", icon: CreditCard, color: "#b45309", bg: "#fff4e0", ref: true, refLabel: "Card slip or approval number" },
  { value: "netbanking", label: "Net banking", group: "Cards and banking", icon: Globe, color: "#1d4ed8", bg: "#eaf1ff", ref: true, refLabel: "Transaction reference" },
  { value: "bank_transfer", label: "Bank transfer", group: "Cards and banking", icon: ArrowLeftRight, color: "#4338ca", bg: "#eceefe", ref: true, refLabel: "UTR number (NEFT, RTGS, IMPS)" },
  { value: "cheque", label: "Cheque", group: "Cards and banking", icon: FileText, color: "#475569", bg: "#eef2f6", ref: true, refRequired: true, refLabel: "Cheque number" },

  { value: "cash", label: "Cash", group: "Cash and others", icon: Banknote, color: "#15803d", bg: "#ecfdf3" },
  { value: "insurance", label: "Insurance", group: "Cash and others", icon: ShieldCheck, color: "#be185d", bg: "#fdeaf3", ref: true, refLabel: "Claim or policy number" },
];

export const METHOD_GROUPS = ["UPI apps", "Cards and banking", "Cash and others"];

export const methodInfo = (value) =>
  PAYMENT_METHODS.find((m) => m.value === value) || { value, label: String(value || "-"), color: "#475569", bg: "#f1f5f9" };

export const methodLabel = (value) => methodInfo(value).label;

// "Google Pay (T2611031234)", used by the PDF and Word downloads
export const paymentText = (p) => {
  const label = methodLabel(p.method);
  return p.reference ? `${label} (${p.reference})` : label;
};