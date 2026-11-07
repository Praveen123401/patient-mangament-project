import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowRightLeft, ClipboardList, FlaskConical, LogOut } from "lucide-react";
import { getAdmission } from "../../api/admissionApi";
import { getDischarge, getDischarges } from "../../api/dischargeApi";
import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { formatCurrency } from "../../utils/formatCurrency";
import { formatDateTime } from "../../utils/formatDate";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import Loader from "../../components/common/Loader";
import StatusBadge from "../../components/common/StatusBadge";
import PrintButton from "../../components/common/PrintButton";
import DischargeSummaryTemplate from "../../components/print/DischargeSummaryTemplate";

const Row = ({ label, value }) => (
  <div className="info-row">
    <span>{label}</span>
    <b>{value || "-"}</b>
  </div>
);

export default function AdmissionDetail() {
  const { id } = useParams();
  const { hasRole } = useAuth();
  const [discharge, setDischarge] = useState(null);

  const { data, loading, error } = useFetch(() => getAdmission(id), [id]);
  const adm = data?.data;
  useDocumentTitle(adm ? adm.admissionNo : "Admission");

  // for discharged patients load the full summary so it can be printed
  useEffect(() => {
    if (!adm || adm.status !== "discharged") return;
    getDischarges({ patient: adm.patient._id, limit: 50 })
      .then((r) => {
        const d = r.data.find((x) => x.admission?._id === adm._id);
        return d ? getDischarge(d._id) : null;
      })
      .then((r) => r && setDischarge(r.data))
      .catch(() => {});
  }, [adm]);

  if (loading) return <Loader />;
  if (error) return <p className="error">{error}</p>;
  if (!adm) return null;

  const admitted = adm.status === "admitted";
  const days = Math.max(1, Math.ceil((new Date(adm.dischargeDate || Date.now()) - new Date(adm.admitDate)) / 86400000));

  return (
    <>
      <Breadcrumb items={[{ label: "Admissions", to: "/admissions" }, { label: adm.admissionNo }]} />

      <PageHeader title={adm.admissionNo} subtitle={`${adm.patient?.name} · ${adm.patient?.patientId}`}>
        <StatusBadge status={adm.status} />
        {admitted && hasRole("admin", "doctor", "nurse") && (
          <Link to={`/admissions/${adm._id}/transfer`} className="btn btn-outline">
            <ArrowRightLeft size={16} /> Transfer bed
          </Link>
        )}
        {admitted && hasRole("admin", "doctor") && (
          <Link to={`/admissions/${adm._id}/discharge`} className="btn btn-primary">
            <LogOut size={16} /> Discharge
          </Link>
        )}
      </PageHeader>

      <div className="info-grid">
        <Card title="Patient">
          <Row label="Name" value={<Link className="link" to={`/patients/${adm.patient?._id}`}>{adm.patient?.name}</Link>} />
          <Row label="Patient ID" value={adm.patient?.patientId} />
          <Row label="Phone" value={adm.patient?.phone} />
          <Row label="Doctor" value={adm.doctor?.user?.name ? `Dr. ${adm.doctor.user.name}` : ""} />
        </Card>

        <Card title="Stay">
          <Row label="Ward" value={adm.ward?.name} />
          <Row label="Bed" value={adm.bed?.bedNumber} />
          <Row label="Charge per day" value={formatCurrency(adm.ward?.chargePerDay)} />
          <Row label="Admitted" value={formatDateTime(adm.admitDate)} />
          {adm.dischargeDate && <Row label="Discharged" value={formatDateTime(adm.dischargeDate)} />}
          <Row label="Days" value={days} />
        </Card>
      </div>

      <Card title="Reason and diagnosis">
        <Row label="Reason" value={adm.reason} />
        <Row label="Diagnosis" value={adm.diagnosis} />
      </Card>

      {adm.transfers?.length > 0 && (
        <>
          <div style={{ height: 14 }} />
          <Card title={`Bed transfers (${adm.transfers.length})`}>
            <ul className="transfer-list">
              {adm.transfers.map((t) => (
                <li key={t._id}>
                  {formatDateTime(t.date)}
                  {t.reason ? ` - ${t.reason}` : ""}
                </li>
              ))}
            </ul>
          </Card>
        </>
      )}

      {admitted && (
        <div className="page-actions" style={{ marginTop: 16 }}>
          {hasRole("admin", "doctor", "nurse") && (
            <Link className="btn btn-outline" to={`/records/new?patient=${adm.patient?._id}&admission=${adm._id}`}>
              <ClipboardList size={16} /> Add medical record
            </Link>
          )}
          {hasRole("admin", "doctor") && (
            <Link className="btn btn-outline" to={`/lab/orders/new?patient=${adm.patient?._id}&admission=${adm._id}`}>
              <FlaskConical size={16} /> Order lab test
            </Link>
          )}
        </div>
      )}

      {discharge && (
        <>
          <div className="page-header" style={{ marginTop: 24 }}>
            <h2 style={{ margin: 0 }}>Discharge summary</h2>
            <PrintButton title={`Discharge summary ${adm.admissionNo}`} />
          </div>
          <DischargeSummaryTemplate discharge={discharge} />
        </>
      )}
    </>
  );
}