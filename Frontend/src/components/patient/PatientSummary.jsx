import Avatar from "../common/Avatar";
import calculateAge from "../../utils/calculateAge";

// Header strip shown on admission, lab, prescription and history pages
export default function PatientSummary({ patient, children }) {
  if (!patient) return null;
  const age = patient.age ?? calculateAge(patient.dob);
  return (
    <div className="psummary">
      <Avatar name={patient.name} size={52} />
      <div className="ps-main">
        <h3>{patient.name}</h3>
        <p className="muted">
          {patient.patientId} · {age ? `${age} yrs` : "-"} · {patient.gender} · {patient.phone}
        </p>
      </div>
      <div className="ps-tags">
        {patient.bloodGroup && <span className="badge badge-blue">{patient.bloodGroup}</span>}
        {patient.allergies?.length > 0 && (
          <span className="badge badge-red">Allergy: {patient.allergies.join(", ")}</span>
        )}
      </div>
      {children}
    </div>
  );
}