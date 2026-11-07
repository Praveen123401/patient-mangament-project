import "./InvoiceView.css";

// ---- Replace these with data from your API ----
const hospital = {
  name: "Your Hospital Name",
  regNo: "DR86486",
  address: "DP Road, Bengaluru - 560001.",
  phone: "08208064299",
  timing: "AVAILABLE 24 HOURS AND 7 DAYS.",
};

const invoice = {
  date: "2026-11-06",
  admissionNo: "000001",
  admissionDate: "2026-11-04T12:19:00",
  dischargeDate: null,
  beds: "GEN001 (GENERAL)",
  paymentMode: "UPI",
  patient: {
    uid: 1, name: "DUMMY PATIENT", gender: "Male", age: 22,
    address: "Bengaluru - 560001", contact: "9403265989",
  },
  payer: { name: "DUMMY PATIENT", address: "Bengaluru - 560001" },
  doctors: ["Dr. Akshara Raje (General Physician)"],
  amountPaid: 0,
  groups: [
    {
      title: "Room/Bed Charges", summaryCode: "100000", summaryName: "Room & Nursing Charges",
      items: [
        { code: "100000", dateTime: "2026-11-04T12:19:00", name: "Bed Charges - GENERAL (GEN001)", rate: 200, units: 1.25 },
      ],
    },
    {
      title: "Nursing Charges", summaryCode: "100000", summaryName: "Room & Nursing Charges",
      items: [
        { code: "102001", dateTime: "2026-11-04T12:19:00", name: "Bed Charges - GENERAL (GEN001)", rate: 200, units: 1.25 },
        { code: "102003", dateTime: "2026-11-05T12:54:00", name: "Nebulization - GENERAL (GEN001)", rate: 100, units: 1 },
        { code: "102004", dateTime: "2026-11-05T12:19:00", name: "Injection Charges - GENERAL (GEN001)", rate: 50, units: 1 },
      ],
    },
    {
      title: "OT Charges", summaryCode: "300000", summaryName: "OT Charges",
      items: [
        { code: "301001", dateTime: "2026-11-05T12:54:00", name: "Major OT Charge - GENERAL (GEN001)", rate: 1000, units: 1 },
      ],
    },
    {
      title: "Professional Fees", summaryCode: "500000", summaryName: "Professional Fees",
      items: [
        { code: "500000", dateTime: "2026-11-04T12:22:00", name: "Dr. Akshara Raje", rate: 500, units: 1 },
      ],
    },
  ],
};
// ------------------------------------------------

const money = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
const fmtDateTime = (d) =>
  new Date(d).toLocaleString("en-GB", { day: "2-digit", month: "2-digit", year: "2-digit", hour: "2-digit", minute: "2-digit", hour12: true });

// Indian-style amount in words
const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve",
  "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
const below100 = (n) => (n < 20 ? ones[n] : tens[Math.floor(n / 10)] + (n % 10 ? " " + ones[n % 10] : ""));
const below1000 = (n) => (n >= 100 ? ones[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + below100(n % 100) : "") : below100(n));
function toWords(num) {
  num = Math.floor(num);
  if (num === 0) return "Zero";
  const parts = [];
  const crore = Math.floor(num / 10000000); num %= 10000000;
  const lakh = Math.floor(num / 100000); num %= 100000;
  const thousand = Math.floor(num / 1000); num %= 1000;
  if (crore) parts.push(below1000(crore) + " Crore");
  if (lakh) parts.push(below100(lakh) + " Lakh");
  if (thousand) parts.push(below100(thousand) + " Thousand");
  if (num) parts.push(below1000(num));
  return parts.join(" ");
}

export default function InvoiceView() {
  const { patient, payer, groups } = invoice;

  const groupTotal = (g) => g.items.reduce((s, i) => s + i.rate * i.units, 0);

  // Provisional bill summary: combine groups by summary code
  const summary = Object.values(
    groups.reduce((acc, g) => {
      acc[g.summaryCode] ??= { code: g.summaryCode, name: g.summaryName, amount: 0 };
      acc[g.summaryCode].amount += groupTotal(g);
      return acc;
    }, {})
  );

  const total = summary.reduce((s, r) => s + r.amount, 0);
  const balance = total - invoice.amountPaid;

  return (
    <div className="invoice-wrap">
      <div className="invoice-toolbar no-print">
        <button onClick={() => window.print()}>Print / Save as PDF</button>
      </div>

      <div className="invoice">
        {/* Header */}
        <header className="inv-header">
          <div className="inv-logo">✚</div>
          <div>
            <h1>{hospital.name}</h1>
            <p>Reg. No. {hospital.regNo}</p>
            <p>{hospital.address}</p>
            <p>Ph: {hospital.phone}, Timing: {hospital.timing}</p>
          </div>
        </header>

        {/* Patient + admission */}
        <section className="inv-info">
          <div>
            <p><b>Patient UID:</b> {patient.uid}</p>
            <p><b>Name:</b> {patient.name} ({patient.gender})</p>
            <p><b>Age:</b> {patient.age} years</p>
            <p><b>Address:</b> {patient.address}, <b>Contact No:</b> {patient.contact}</p>
            <p className="gap"><b>Payer Details</b></p>
            <p><b>Name:</b> {payer.name}</p>
            <p><b>Address:</b> {payer.address}</p>
            <p><b>Consulting Doctors:</b></p>
            {invoice.doctors.map((d) => <p key={d} className="indent">- {d}</p>)}
          </div>
          <div>
            <p><b>Date:</b> {fmtDate(invoice.date)}</p>
            <p className="gap"><b>Admission No:</b> {invoice.admissionNo}</p>
            <p><b>Admission Date:</b> {fmtDateTime(invoice.admissionDate)}</p>
            <p><b>Discharge Date:</b> {invoice.dischargeDate ? fmtDateTime(invoice.dischargeDate) : "-- / -- / --"}</p>
            <p><b>Bed No(s):</b> {invoice.beds}</p>
            <p><b>Payment Mode:</b> {invoice.paymentMode}</p>
          </div>
        </section>

        {/* Provisional bill */}
        <h2 className="inv-title">PROVISIONAL BILL</h2>
        <table className="inv-table">
          <thead>
            <tr><th>Primary Code</th><th>Particulars</th><th className="r">Amount</th></tr>
          </thead>
          <tbody>
            {summary.map((r) => (
              <tr key={r.code}>
                <td>{r.code}</td><td>{r.name}</td><td className="r">{money(r.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="inv-totals">
          <p><span>Total Bill Amount:</span> <b>{money(total)}</b></p>
          <p><span>Amount Payable:</span> <b>{money(total)}</b></p>
          <p><span>Amount Paid:</span> <b>{money(invoice.amountPaid)}</b></p>
          <p><span>Balance:</span> <b>{money(balance)}</b></p>
          <p><span>Paid amount in words:</span> <b>{toWords(invoice.amountPaid)}</b></p>
        </div>

        {/* Detailed breakup */}
        <h2 className="inv-title">DETAILED BREAKUP</h2>
        <table className="inv-table detail">
          <thead>
            <tr>
              <th>Code</th><th>Date &amp; Time</th><th>Particulars</th>
              <th className="r">Rate</th><th className="c">Units</th><th className="r">Amount</th>
            </tr>
          </thead>
          {groups.map((g) => (
            <tbody key={g.title}>
              <tr className="group-row"><td colSpan="6">{g.title}</td></tr>
              {g.items.map((i) => (
                <tr key={i.code}>
                  <td>{i.code}</td>
                  <td>{fmtDateTime(i.dateTime)}</td>
                  <td>{i.name}</td>
                  <td className="r">{money(i.rate)}</td>
                  <td className="c">{i.units}</td>
                  <td className="r">{money(i.rate * i.units)}</td>
                </tr>
              ))}
              <tr className="subtotal">
                <td colSpan="4"></td>
                <td className="r">Subtotal:</td>
                <td className="r">{money(groupTotal(g))}</td>
              </tr>
            </tbody>
          ))}
        </table>
      </div>
    </div>
  );
}