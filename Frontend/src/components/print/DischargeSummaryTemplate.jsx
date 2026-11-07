import { HOSPITAL_NAME } from "../../utils/constants";
import { formatDate } from "../../utils/formatDate";
import calculateAge from "../../utils/calculateAge";
import "../../pages/admissions/DischargeSummary.css";

// discharge = getDischarge() result (patient, admission, bill populated)
export default function DischargeSummaryTemplate({ discharge }) {
  const p = discharge.patient;
  const a = discharge.admission;
  return (
    <article className="discharge-summary print-area">
      <header className="hospital-header">
        <h1>{HOSPITAL_NAME}</h1>
      </header>

      <h2 className="report-title">Discharge Summary</h2>

      <section className="summary-section">
        <h3>Patient information</h3>
        <div className="patient-info">
          <div className="info-item"><strong>Patient:</strong> {p.name}</div>
          <div className="info-item"><strong>Patient ID:</strong> {p.patientId}</div>
          <div className="info-item"><strong>Age / Sex:</strong> {p.age ?? calculateAge(p.dob)} / {p.gender}</div>
          <div className="info-item"><strong>Admission No:</strong> {a?.admissionNo || "-"}</div>
          <div className="info-item"><strong>Admitted:</strong> {formatDate(a?.admitDate)}</div>
          <div className="info-item"><strong>Discharged:</strong> {formatDate(discharge.dischargeDate)}</div>
          <div className="info-item"><strong>Days stayed:</strong> {discharge.daysStayed}</div>
          <div className="info-item">
            <strong>Condition:</strong>{" "}
            <span className="condition">{discharge.condition || "-"}</span>
          </div>
        </div>
      </section>

      <section className="summary-section">
        <h3>Final diagnosis</h3>
        <p className="summary-text">{discharge.finalDiagnosis || "-"}</p>
      </section>

      <section className="summary-section">
        <h3>Treatment given</h3>
        <p className="summary-text">{discharge.treatmentGiven || "-"}</p>
      </section>

      <section className="summary-section">
        <h3>Summary</h3>
        <p className="summary-text">{discharge.summary || "-"}</p>
      </section>

      {discharge.medicinesOnDischarge?.length > 0 && (
        <section className="summary-section">
          <h3>Medicines on discharge</h3>
          <table className="doc-table">
            <thead><tr><th>Medicine</th><th>Dosage</th><th>Frequency</th><th>Duration</th></tr></thead>
            <tbody>
              {discharge.medicinesOnDischarge.map((m, i) => (
                <tr key={m._id || i}>
                  <td>{m.name}</td><td>{m.dosage}</td><td>{m.frequency}</td><td>{m.duration}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {discharge.followUpDate && (
        <section className="summary-section">
          <h3>Follow-up</h3>
          <p className="summary-text">{formatDate(discharge.followUpDate)}</p>
        </section>
      )}

      <footer className="summary-footer">
        <div className="signature">Doctor's signature</div>
      </footer>
    </article>
  );
}