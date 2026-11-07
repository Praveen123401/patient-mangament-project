import { QRCodeSVG } from "qrcode.react";
import { UPI_ID, UPI_NAME } from "../../utils/constants";

const upiLink = (amount, note) =>
  `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent(UPI_NAME)}` +
  `&am=${Number(amount).toFixed(2)}&cu=INR&tn=${encodeURIComponent(note || "")}`;

// a standard UPI QR: Google Pay, PhonePe, Paytm and every other UPI app can scan it
export default function UpiQr({ amount, note, size = 150 }) {
  if (!UPI_ID || !(Number(amount) > 0)) return null;
  return <QRCodeSVG value={upiLink(amount, note)} size={size} level="M" />;
}