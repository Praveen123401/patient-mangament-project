
export default function TimeSlotPicker({
  slots = [],
  value = "",
  onChange,
  loading = false,
}) {
  if (loading) {
    return <p className="muted">Loading available slots...</p>;
  }

  if (!slots.length) {
    return <p className="muted">No available time slots.</p>;
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {slots.map((slot) => (
        <button
          key={slot}
          type="button"
          onClick={() => onChange(slot)}
          className={`rounded-lg border px-4 py-3 text-sm ${
            value === slot
              ? "bg-blue-600 text-white border-blue-600"
              : "border-gray-300 hover:border-blue-500"
          }`}
        >
          {slot}
        </button>
      ))}
    </div>
  );
}
