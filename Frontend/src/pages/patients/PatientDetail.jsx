// import { Link, useParams } from "react-router-dom";
// import { BedDouble, CalendarPlus, ClipboardList, FlaskConical, History, Pencil } from "lucide-react";
// import { getPatient } from "../../api/patientApi";
// import useFetch from "../../hooks/useFetch";
// import useDocumentTitle from "../../hooks/useDocumentTitle";
// import { useAuth } from "../../context/useAuth.js";
// import { formatDate } from "../../utils/formatDate";
// import Breadcrumb from "../../components/common/Breadcrumb";
// import Card from "../../components/common/Card";
// import Loader from "../../components/common/Loader";
// import PatientSummary from "../../components/patient/PatientSummary";

// const Row = ({ label, value }) => (
//   <div className="info-row">
//     <span>{label}</span>
//     <b>{value || "-"}</b>
//   </div>
// );

// export default function PatientDetail() {
//   const { id } = useParams();
//   const { hasRole } = useAuth();
//   const { data, loading, error } = useFetch(() => getPatient(id), [id]);
//   const p = data?.data;
//   useDocumentTitle(p ? p.name : "Patient");

//   if (loading) return <Loader />;
//   if (error) return <p className="error">{error}</p>;
//   if (!p) return null;

//   const canEdit = hasRole("admin", "receptionist", "nurse", "doctor");
//   const canAdmit = hasRole("admin", "doctor", "receptionist");
//   const canClinical = hasRole("admin", "doctor", "nurse");
//   const ec = p.emergencyContact || {};

//   return (
//     <>
//       <Breadcrumb items={[{ label: "Patients", to: "/patients" }, { label: p.name }]} />

//       <PatientSummary patient={p}>
//         {canEdit && (
//           <Link to={`/patients/${p._id}/edit`} className="btn btn-outline">
//             <Pencil size={15} /> Edit
//           </Link>
//         )}
//       </PatientSummary>

//       <div className="page-actions" style={{ marginBottom: 16 }}>
//         <Link to={`/patients/${p._id}/history`} className="btn btn-outline"><History size={16} /> Full history</Link>
//         {canEdit && (
//           <Link to={`/appointments/new?patient=${p._id}`} className="btn btn-outline"><CalendarPlus size={16} /> Book appointment</Link>
//         )}
//         {canAdmit && (
//           <Link to={`/admissions/new?patient=${p._id}`} className="btn btn-outline"><BedDouble size={16} /> Admit</Link>
//         )}
//         {canClinical && (
//           <Link to={`/records/new?patient=${p._id}`} className="btn btn-outline"><ClipboardList size={16} /> New record</Link>
//         )}
//         {hasRole("admin", "doctor") && (
//           <Link to={`/lab/orders/new?patient=${p._id}`} className="btn btn-outline"><FlaskConical size={16} /> Lab order</Link>
//         )}
//       </div>

//       <div className="info-grid">
//         <Card title="Contact details">
//           <Row label="Mobile" value={p.phone} />
//           <Row label="Email" value={p.email} />
//           <Row label="Address" value={p.address} />
//           <Row label="Date of birth" value={p.dob ? formatDate(p.dob) : ""} />
//           <Row label="Registered on" value={formatDate(p.createdAt)} />
//         </Card>

//         <Card title="Emergency contact">
//           <Row label="Name" value={ec.name} />
//           <Row label="Phone" value={ec.phone} />
//           <Row label="Relation" value={ec.relation} />
//         </Card>
//       </div>
//     </>
//   );
// } 


import { Link, useParams } from "react-router-dom";
import { BedDouble, CalendarPlus, ClipboardList, FlaskConical, History, Pencil } from "lucide-react";
import { getPatient } from "../../api/patientApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDate } from "../../utils/formatDate";
import { formatAadhaar } from "../../utils/formatId";
import Breadcrumb from "../../components/common/Breadcrumb";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import PatientSummary from "../../components/patient/PatientSummary";

const Row = ({ label, value }) => (
  <div className="info-row">
    <span>{label}</span>
    <b>{value || "-"}</b>
  </div>
);

export default function PatientDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const { data, loading, error } = useFetch(() => getPatient(id), [id]);
  const p = data?.data;
  useDocumentTitle(p ? p.name : "Patient");

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!p) return null;

  const canEdit = hasRole("admin", "receptionist", "nurse", "doctor");
  const canAdmit = hasRole("admin", "doctor", "receptionist");
  const canClinical = hasRole("admin", "doctor", "nurse");
  const ec = p.emergencyContact || {};
  const fullAccess = hasRole("admin", "receptionist");

  const place = [p.city, p.state, p.pincode].filter(Boolean).join(", ");
  const hasIds = p.aadhaarNumber || p.rationCardNumber || p.annualIncome != null;

  return (
    <>
      <Breadcrumb items={[{ label: "Patients", to: "/patients" }, { label: p.name }]} />

      <PatientSummary patient={p}>
        {canEdit && (
          <Link to={`/patients/${p._id}/edit`} className="btn btn-outline">
            <Pencil size={15} /> Edit
          </Link>
        )}
      </PatientSummary>

      <div className="page-actions" style={{ marginBottom: 16 }}>
        <Link to={`/patients/${p._id}/history`} className="btn btn-outline"><History size={16} /> Full history</Link>
        {canEdit && (
          <Link to={`/appointments/new?patient=${p._id}`} className="btn btn-outline"><CalendarPlus size={16} /> Book appointment</Link>
        )}
        {canAdmit && (
          <Link to={`/admissions/new?patient=${p._id}`} className="btn btn-outline"><BedDouble size={16} /> Admit</Link>
        )}
        {canClinical && (
          <Link to={`/records/new?patient=${p._id}`} className="btn btn-outline"><ClipboardList size={16} /> New record</Link>
        )}
        {hasRole("admin", "doctor") && (
          <Link to={`/lab/orders/new?patient=${p._id}`} className="btn btn-outline"><FlaskConical size={16} /> Lab order</Link>
        )}
      </div>

      <div className="info-grid">
        <Card title="Personal details">
          <Row label="Parent / guardian" value={p.guardianName ? `${p.guardianName}${p.guardianRelation ? ` (${p.guardianRelation})` : ""}` : ""} />
          <Row label="Date of birth" value={p.dob ? formatDate(p.dob) : ""} />
          <Row label="Marital status" value={p.maritalStatus} />
          <Row label="Occupation" value={p.occupation} />
          <Row label="Registered on" value={formatDate(p.createdAt)} />
        </Card>

        <Card title="Contact and address">
          <Row label="Mobile" value={p.phone} />
          <Row label="Alternate mobile" value={p.alternatePhone} />
          <Row label="Email" value={p.email} />
          <Row label="Address" value={p.address} />
          <Row label="City, state, pincode" value={place} />
        </Card>

        {(hasIds || fullAccess) && (
          <Card title="Identity and income">
            <Row label="Aadhaar" value={p.aadhaarNumber ? formatAadhaar(p.aadhaarNumber) : ""} />
            {fullAccess && (
              <>
                <Row label="Ration card" value={p.rationCardNumber ? `${p.rationCardNumber}${p.rationCardType ? ` (${p.rationCardType})` : ""}` : ""} />
                <Row label="Annual income" value={p.annualIncome != null ? formatCurrency(p.annualIncome) : ""} />
              </>
            )}
          </Card>
        )}

        <Card title="Emergency contact">
          <Row label="Name" value={ec.name} />
          <Row label="Phone" value={ec.phone} />
          <Row label="Relation" value={ec.relation} />
        </Card>
      </div>
    </>
  );
}