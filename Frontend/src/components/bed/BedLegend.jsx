export default function BedLegend() {
  return (
    <div className="bed-legend">
      <span><i className="dot green" /> Available</span>
      <span><i className="dot red" /> Occupied</span>
      <span><i className="dot orange" /> Maintenance</span>
    </div>
  );
}