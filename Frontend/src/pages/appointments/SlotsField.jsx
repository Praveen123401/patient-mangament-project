import { getSlots } from "../../api/doctorApi";
import useFetch from "../../hooks/useFetch";
import { toInputDate } from "../../utils/formatDate";
import TimeSlotPicker from "../../components/common/TimeSlotPicker";

const toMin = (t) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + m;
};

// Shows the doctor's free slots for the chosen day. Past times are hidden for today.
// refreshKey: change it to reload the slots (for example after a "slot already booked" error).
export default function SlotsField({ doctorId, date, value, onChange, refreshKey = 0 }) {
  const { data, loading, error } = useFetch(
    () => (doctorId && date ? getSlots(doctorId, date) : Promise.resolve(null)),
    [doctorId, date, refreshKey]
  );

  if (!doctorId || !date) {
    return <p className="muted">Choose a doctor and a date to see the free slots.</p>;
  }
  if (error) return <p className="error">{error}</p>;

  const info = data?.data;
  const now = new Date();
  const isToday = date === toInputDate();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const slots = (info?.available || []).filter((s) => !isToday || toMin(s) > nowMin);

  return (
    <div>
      <TimeSlotPicker slots={slots} value={value} onChange={onChange} loading={loading} />
      {!loading && info && slots.length === 0 && (
        <p className="slot-hint">
          No free slots on {info.day}. The doctor may not work that day, or the day is fully booked. Try another date.
        </p>
      )}
    </div>
  );
}