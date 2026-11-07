import { HOSPITAL_NAME } from "../../utils/constants";
import { formatDate } from "../../utils/formatDate";
import calculateAge from "../../utils/calculateAge";

// rx = getPrescription() result (patient and doctor.user populated)
export default function PrescriptionTemplate({ rx }) {
  const p = rx.patient;
  return (
    <div className="print-area doc">
      <div className="doc-head">
        <h2>{HOSPITAL_NAME}</h2>
        <p>Dr. {rx.doctor?.user?.name} · {rx.doctor?.specialization}</p>
      </div>

      <div className="doc-grid">
        <div><b>Patient:</b> {p.name}</div>
        <div><b>ID:</b> {p.patientId}</div>
        <div><b>Age / Sex:</b> {p.age ?? calculateAge(p.dob)} / {p.gender}</div>
        <div><b>Date:</b> {formatDate(rx.createdAt)}</div>
      </div>

      <h3>Rx</h3>
      <table className="doc-table">
        <thead>
          <tr><th>#</th><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th><th>Instructions</th></tr>
        </thead>
        <tbody>
          {rx.medicines.map((m, i) => (
            <tr key={m._id || i}>
              <td>{i + 1}</td>
              <td><b>{m.name}</b></td>
              <td>{m.dosage || "-"}</td>
              <td>{m.frequency || "-"}</td>
              <td>{m.duration || "-"}</td>
              <td>{m.instructions || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {rx.advice && (
        <p><b>Advice:</b> {rx.advice}</p>
      )}

      <div className="doc-sign"><span /><span>Doctor's signature</span></div>
    </div>
  );
}