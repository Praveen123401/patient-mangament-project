import { HOSPITAL_NAME } from "../../utils/constants";
import { formatDateTime } from "../../utils/formatDate";
import calculateAge from "../../utils/calculateAge";
import ResultFlagBadge from "./ResultFlagBadge";

// order = getLabOrder() result with populated patient and tests.test
export default function LabReportTemplate({ order }) {
  const p = order.patient;
  return (
    <div className="print-area doc">
      <div className="doc-head">
        <h2>{HOSPITAL_NAME}</h2>
        <p>Laboratory Report</p>
      </div>

      <div className="doc-grid">
        <div><b>Patient:</b> {p.name}</div>
        <div><b>Patient ID:</b> {p.patientId}</div>
        <div><b>Age / Sex:</b> {p.age ?? calculateAge(p.dob)} / {p.gender}</div>
        <div><b>Order No:</b> {order.orderNo}</div>
        <div><b>Collected:</b> {formatDateTime(order.sampleCollectedAt)}</div>
        <div><b>Reported:</b> {formatDateTime(order.completedAt)}</div>
      </div>

      <table className="doc-table">
        <thead>
          <tr><th>Test</th><th>Result</th><th>Unit</th><th>Normal range</th><th>Flag</th></tr>
        </thead>
        <tbody>
          {order.tests.map((t) => (
            <tr key={t._id}>
              <td>{t.test.name}</td>
              <td><b>{t.value ?? "-"}</b></td>
              <td>{t.test.unit || "-"}</td>
              <td>{t.test.normalRange ? `${t.test.normalRange.min ?? ""} - ${t.test.normalRange.max ?? ""}` : "-"}</td>
              <td><ResultFlagBadge flag={t.flag} /></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="doc-sign">
        <span>Lab Technician</span>
        <span>Pathologist</span>
      </div>
    </div>
  );
}