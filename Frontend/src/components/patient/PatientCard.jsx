import { Phone, Droplet } from "lucide-react";
import Avatar from "../common/Avatar";
import calculateAge from "../../utils/calculateAge";

export default function PatientCard({ patient, onClick }) {
  const age = patient.age ?? calculateAge(patient.dob);
  return (
    <div
      className={`pcard ${onClick ? "clickable" : ""}`}
      onClick={() => onClick?.(patient)}
    >
      <Avatar name={patient.name} size={44} />
      <div className="pcard-info">
        <strong>{patient.name}</strong>
        <small className="muted">
          {patient.patientId} · {age ? `${age} yrs` : "-"} · {patient.gender}
        </small>
        <div className="pcard-meta">
          <span><Phone size={13} /> {patient.phone}</span>
          {patient.bloodGroup && <span><Droplet size={13} /> {patient.bloodGroup}</span>}
        </div>
      </div>
    </div>
  );
}