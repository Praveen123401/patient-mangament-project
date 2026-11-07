import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import { errMsg } from "../../api/axios";
import {
  getDoctor,
  setAvailability as updateDoctorAvailability,
} from "../../api/doctorApi";
import Breadcrumb from "../../components/common/Breadcrumb";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";
import PageHeader from "../../components/common/PageHeader";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { WEEK_DAYS } from "../../utils/constants";

const EMPTY_SCHEDULE = {
  day: "Monday",
  startTime: "09:00",
  endTime: "17:00",
  slotDuration: 15,
};

const normalizeSchedule = (schedule) => ({
  day: schedule.day,
  startTime: schedule.startTime || "09:00",
  endTime: schedule.endTime || "17:00",
  slotDuration: Number(schedule.slotDuration) || 15,
});

export default function DoctorAvailability() {
  const { id } = useParams();
  const navigate = useNavigate();

  useDocumentTitle("Doctor availability");

  const [doctor, setDoctor] = useState(null);
  const [availability, setAvailability] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    getDoctor(id)
      .then(({ data }) => {
        setDoctor(data);
        setAvailability((data.availability || []).map(normalizeSchedule));
      })
      .catch((err) => setError(errMsg(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const updateSchedule = (index, field, value) => {
    setAvailability((current) =>
      current.map((schedule, scheduleIndex) =>
        scheduleIndex === index
          ? { ...schedule, [field]: value }
          : schedule
      )
    );
  };

  const saveAvailability = async (event) => {
    event.preventDefault();
    setError("");

    if (!availability.length) {
      setError("Add at least one weekly schedule before saving.");
      return;
    }

    const invalidSchedule = availability.some(
      ({ day, startTime, endTime, slotDuration }) =>
        !WEEK_DAYS.includes(day) ||
        !startTime ||
        !endTime ||
        endTime <= startTime ||
        !Number.isInteger(Number(slotDuration)) ||
        Number(slotDuration) < 1
    );
    if (invalidSchedule) {
      setError("Check each schedule has a valid day, time range and slot duration.");
      return;
    }

    setSaving(true);
    try {
      await updateDoctorAvailability(
        id,
        availability.map((schedule) => ({
          ...schedule,
          slotDuration: Number(schedule.slotDuration),
        }))
      );
      toast.success("Doctor availability saved");
      navigate("/doctors");
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  const doctorName = doctor?.user?.name || doctor?.name || "this doctor";

  if (error && !doctor) {
    return (
      <>
        <Breadcrumb items={[{ label: "Doctors", to: "/doctors" }, { label: "Availability" }]} />
        <p className="error">{error}</p>
      </>
    );
  }

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Doctors", to: "/doctors" },
          { label: doctorName },
          { label: "Availability" },
        ]}
      />
      <PageHeader
        title="Doctor availability"
        subtitle={`Set the weekly appointment hours for ${doctorName}.`}
      />

      <Card title="Weekly schedule">
        <p className="form-note">
          Add one row for each working session. Appointment slots are generated
          using the session duration.
        </p>

        <form onSubmit={saveAvailability}>
          {availability.map((schedule, index) => (
            <div className="sched-row" key={`${schedule.day}-${index}`}>
              <FormField
                as="select"
                label="Day"
                name={`day-${index}`}
                value={schedule.day}
                options={WEEK_DAYS}
                onChange={(event) => updateSchedule(index, "day", event.target.value)}
              />
              <FormField
                label="Start time"
                name={`start-${index}`}
                type="time"
                value={schedule.startTime}
                onChange={(event) => updateSchedule(index, "startTime", event.target.value)}
              />
              <FormField
                label="End time"
                name={`end-${index}`}
                type="time"
                value={schedule.endTime}
                onChange={(event) => updateSchedule(index, "endTime", event.target.value)}
              />
              <FormField
                label="Slot duration (minutes)"
                name={`duration-${index}`}
                type="number"
                min="1"
                step="1"
                value={schedule.slotDuration}
                onChange={(event) => updateSchedule(index, "slotDuration", event.target.value)}
              />
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() =>
                  setAvailability((current) =>
                    current.filter((_, scheduleIndex) => scheduleIndex !== index)
                  )
                }
                aria-label={`Remove ${schedule.day} schedule`}
              >
                Remove
              </button>
            </div>
          ))}

          {!availability.length && (
            <p className="muted">No weekly hours have been configured yet.</p>
          )}

          <div className="form-actions" style={{ justifyContent: "space-between" }}>
            <button
              className="btn btn-outline"
              type="button"
              onClick={() =>
                setAvailability((current) => [...current, { ...EMPTY_SCHEDULE }])
              }
            >
              Add working session
            </button>
            <div className="form-actions" style={{ marginTop: 0 }}>
              <button
                className="btn btn-outline"
                type="button"
                onClick={() => navigate("/doctors")}
              >
                Cancel
              </button>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? "Saving..." : "Save availability"}
              </button>
            </div>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
        </form>
      </Card>
    </>
  );
}
