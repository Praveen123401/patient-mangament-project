
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { CalendarPlus } from "lucide-react";
import toast from "react-hot-toast";

import { bookAppointment } from "../../api/appointmentApi";
import { getPatient, getPatients } from "../../api/patientApi";
import { getDoctors } from "../../api/doctorApi";
import { getDepartments } from "../../api/departmentApi";
import { errMsg } from "../../api/axios";

import useDocumentTitle from "../../hooks/useDocumentTitle";

import { formatCurrency } from "../../utils/formatCurrency";
import { formatDay, toInputDate } from "../../utils/formatDate";

import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import SelectSearch from "../../components/common/SelectSearch";
import PatientSummary from "../../components/patient/PatientSummary";
import SlotsField from "./SlotsField";

// Supports direct arrays, API response objects and Axios responses.
const extractArray = (response) => {
  let result = response;

  for (let i = 0; i < 3; i++) {
    if (Array.isArray(result)) return result;

    if (result && Array.isArray(result.data)) {
      return result.data;
    }

    if (result?.data) {
      result = result.data;
    } else {
      break;
    }
  }

  return Array.isArray(result) ? result : [];
};

const doctorName = (doctor) => {
  const name = doctor?.name || doctor?.user?.name || "Unnamed doctor";
  return name.replace(/^Dr\.?\s*/i, "");
};

export default function BookAppointment() {
  useDocumentTitle("Book appointment");

  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [patient, setPatient] = useState(null);
  const [department, setDepartment] = useState("");
  const [doctorId, setDoctorId] = useState(params.get("doctor") || "");
  const [date, setDate] = useState(toInputDate());
  const [slot, setSlot] = useState("");
  const [reason, setReason] = useState("");

  const [departmentList, setDepartmentList] = useState([]);
  const [allDoctors, setAllDoctors] = useState([]);

  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errors, setErrors] = useState({});
  const [refreshKey, setRefreshKey] = useState(0);

  // Load departments and doctors.
  useEffect(() => {
    let active = true;

    const loadData = async () => {
      try {
        setLoadingDoctors(true);
        setLoadingDepartments(true);

        const [doctorResponse, departmentResponse] =
          await Promise.all([
            getDoctors({ limit: 100 }),
            getDepartments(),
          ]);

        if (!active) return;

        const doctors = extractArray(doctorResponse);
        const departments = extractArray(departmentResponse);

        setAllDoctors(doctors);
        setDepartmentList(departments);

        console.log("Loaded doctors:", doctors);
        console.log("Loaded departments:", departments);
      } catch (error) {
        if (active) {
          console.error("Loading appointment data failed:", error);
          toast.error(errMsg(error));
        }
      } finally {
        if (active) {
          setLoadingDoctors(false);
          setLoadingDepartments(false);
        }
      }
    };

    loadData();

    return () => {
      active = false;
    };
  }, []);

  // Load patient if selected from the patient page.
  useEffect(() => {
    const id = params.get("patient");

    if (!id) return;

    let active = true;

    getPatient(id)
      .then((response) => {
        if (active) {
          setPatient(response?.data || response);
        }
      })
      .catch((error) => {
        console.error("Patient loading failed:", error);
        if (active) toast.error("Unable to load patient");
      });

    return () => {
      active = false;
    };
  }, [params]);

  // Find the selected department.
  const selectedDepartment = departmentList.find(
    (d) => String(d._id) === String(department)
  );

  // Filter doctors by department ID or department name.
  const doctorList = department
    ? allDoctors.filter((d) => {
        const docDepartment = d.department;

        const docDepartmentId =
          typeof docDepartment === "object"
            ? docDepartment?._id
            : "";

        const docDepartmentName =
          typeof docDepartment === "object"
            ? docDepartment?.name
            : docDepartment;

        return (
          String(docDepartmentId) === String(department) ||
          String(docDepartmentName || "").trim().toLowerCase() ===
            String(selectedDepartment?.name || "").trim().toLowerCase()
        );
      })
    : allDoctors;

  const doctor = allDoctors.find(
    (d) => String(d._id) === String(doctorId)
  );

  // If the selected doctor is not in the selected department, clear it.
  useEffect(() => {
    if (!doctorId || !department || !selectedDepartment) return;

    const isValid = doctorList.some(
      (d) => String(d._id) === String(doctorId)
    );

    if (!isValid) {
      setDoctorId("");
      setSlot("");
    }
  }, [department, selectedDepartment, doctorId, doctorList]);

  const maxDate = toInputDate(
    new Date(Date.now() + 90 * 86400000)
  );

  // Book appointment.
  const onSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = {};

    if (!patient?._id) {
      validationErrors.patient = "Select a patient";
    }

    if (!doctorId) {
      validationErrors.doctor = "Select a doctor";
    }

    if (!date) {
      validationErrors.date = "Select a date";
    }

    if (!slot) {
      validationErrors.slot = "Select a time slot";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) return;

    try {
      setSaving(true);

      const response = await bookAppointment({
        patient: patient._id,
        doctor: doctorId,
        date,
        timeSlot: slot,
        reason: reason.trim(),
      });

      const appointment = response?.data || response;

      toast.success("Appointment booked successfully!");

      if (appointment?._id) {
        navigate(`/appointments/${appointment._id}`);
      } else {
        navigate("/appointments");
      }
    } catch (error) {
      console.error("Appointment booking error:", error);
      toast.error(errMsg(error));

      if (error.response?.status === 409) {
        setSlot("");
        setRefreshKey((key) => key + 1);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Appointments", to: "/appointments" },
          { label: "Book appointment" },
        ]}
      />

      <PageHeader
        title="Book appointment"
        subtitle="Pick a doctor and a free time slot"
      />

      <form onSubmit={onSubmit} noValidate>
        <div className="book-layout">
          <div>
            {/* Patient */}
            <Card title="1. Patient">
              {patient ? (
                <>
                  <PatientSummary patient={patient} />

                  {!params.get("patient") && (
                    <button
                      type="button"
                      className="btn btn-outline btn-sm"
                      onClick={() => setPatient(null)}
                    >
                      Change patient
                    </button>
                  )}
                </>
              ) : (
                <SelectSearch
                  label="Search patient"
                  placeholder="Name, patient ID or phone"
                  fetcher={(q) =>
                    getPatients({ search: q, limit: 8 }).then(
                      extractArray
                    )
                  }
                  getLabel={(p) => p.name}
                  getSub={(p) => p.patientId}
                  value={patient}
                  onSelect={(p) => {
                    setPatient(p);
                    setErrors((old) => ({
                      ...old,
                      patient: "",
                    }));
                  }}
                />
              )}

              {errors.patient && (
                <small className="error">{errors.patient}</small>
              )}
            </Card>

            <div style={{ height: 14 }} />

            {/* Doctor and date */}
            <Card title="2. Doctor and date">
              <div className="form-grid">
                <FormField
                  as="select"
                  label="Department (optional)"
                  name="department"
                  value={department}
                  onChange={(e) => {
                    setDepartment(e.target.value);
                    setDoctorId("");
                    setSlot("");
                  }}
                  options={[
                    {
                      value: "",
                      label: loadingDepartments
                        ? "Loading departments..."
                        : "All Departments",
                    },
                    ...departmentList.map((d) => ({
                      value: d._id,
                      label: d.name,
                    })),
                  ]}
                />

                <FormField
                  as="select"
                  label="Doctor"
                  name="doctor"
                  value={doctorId}
                  onChange={(e) => {
                    setDoctorId(e.target.value);
                    setSlot("");

                    setErrors((old) => ({
                      ...old,
                      doctor: "",
                    }));
                  }}
                  error={errors.doctor}
                  required
                  options={[
                    {
                      value: "",
                      label: loadingDoctors
                        ? "Loading doctors..."
                        : "Select a doctor",
                    },
                    ...doctorList.map((d) => ({
                      value: d._id,
                      label: `Dr. ${doctorName(d)} (${d.specialization || "General"})`,
                    })),
                  ]}
                />

                <FormField
                  label="Date"
                  name="date"
                  type="date"
                  min={toInputDate()}
                  max={maxDate}
                  value={date}
                  onChange={(e) => {
                    setDate(e.target.value);
                    setSlot("");

                    setErrors((old) => ({
                      ...old,
                      date: "",
                    }));
                  }}
                  error={errors.date}
                  required
                />
              </div>

              {!loadingDoctors && allDoctors.length === 0 && (
                <p className="slot-hint">
                  No doctors found. Please check GET /api/doctors.
                </p>
              )}

              {!loadingDoctors &&
                department &&
                doctorList.length === 0 && (
                  <p className="slot-hint">
                    No doctors found in this department.
                  </p>
                )}

              {doctor && (
                <div className="doc-box">
                  <strong>Dr. {doctorName(doctor)}</strong>
                  <span>{doctor.specialization}</span>

                  {doctor.qualification && (
                    <span> · {doctor.qualification}</span>
                  )}

                  {doctor.experience != null && (
                    <span> · {doctor.experience} years</span>
                  )}

                  <span>
                    {" · "}Fee {formatCurrency(doctor.consultationFee)}
                  </span>
                </div>
              )}
            </Card>

            <div style={{ height: 14 }} />

            {/* Available slots */}
            <Card title="3. Time slot">
              <SlotsField
                doctorId={doctorId}
                date={date}
                value={slot}
                onChange={(selectedSlot) => {
                  setSlot(selectedSlot);
                  setErrors((old) => ({
                    ...old,
                    slot: "",
                  }));
                }}
                refreshKey={refreshKey}
              />

              {errors.slot && (
                <small className="error">{errors.slot}</small>
              )}
            </Card>

            <div style={{ height: 14 }} />

            {/* Reason */}
            <Card title="4. Reason for visit">
              <FormField
                as="textarea"
                label="Reason (optional)"
                name="reason"
                placeholder="e.g. Fever for 3 days, follow-up visit"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
              />
            </Card>
          </div>

          {/* Summary */}
          <div className="book-summary">
            <Card title="Summary">
              <div className="info-row">
                <span>Patient</span>
                <b>{patient?.name || "-"}</b>
              </div>

              <div className="info-row">
                <span>Doctor</span>
                <b>
                  {doctor ? `Dr. ${doctorName(doctor)}` : "-"}
                </b>
              </div>

              <div className="info-row">
                <span>Date</span>
                <b>{date ? formatDay(date) : "-"}</b>
              </div>

              <div className="info-row">
                <span>Time</span>
                <b>{slot || "-"}</b>
              </div>

              <div className="info-row">
                <span>Consultation fee</span>
                <b>
                  {doctor
                    ? formatCurrency(doctor.consultationFee)
                    : "-"}
                </b>
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: "100%",
                  marginTop: 16,
                }}
                disabled={saving}
              >
                <CalendarPlus size={16} />
                {saving ? "Booking..." : "Confirm booking"}
              </button>

              <button
                type="button"
                className="btn btn-outline"
                style={{
                  width: "100%",
                  marginTop: 8,
                }}
                onClick={() => navigate(-1)}
              >
                Cancel
              </button>
            </Card>
          </div>
        </div>
      </form>
    </>
  );
}
