// Green = available, red = occupied, orange = maintenance
export default function BedTile({ bed, onClick }) {
  const patientName = bed.currentAdmission?.patient?.name;
  return (
    <button type="button" className={`bed bed-${bed.status}`} onClick={() => onClick?.(bed)} title={patientName || bed.status}>
      <strong>{bed.bedNumber}</strong>
      <small>{bed.status === "occupied" ? patientName || "Occupied" : bed.status}</small>
    </button>
  );
}