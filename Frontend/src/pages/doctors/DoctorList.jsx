
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  RefreshCw,
  UserRound,
  Stethoscope,
  Plus,
  X,
  Loader2,
} from "lucide-react";

import { getDoctors, createDoctor } from "../../api/doctorApi";
import { getDepartments } from "../../api/departmentApi";
import { useAuth } from "../../context/useAuth";
import { errMsg } from "../../api/axios";

const SPECIALIZATIONS = [
  "General Physician",
  "General Medicine",
  "Internal Medicine",
  "Cardiology",
  "Interventional Cardiology",
  "Neurology",
  "Neurosurgery",
  "Orthopedics",
  "Pediatrics",
  "Neonatology",
  "Gynecology",
  "Obstetrics",
  "Dermatology",
  "General Surgery",
  "Plastic Surgery",
  "Urology",
  "Nephrology",
  "Oncology",
  "Ophthalmology",
  "ENT",
  "Psychiatry",
  "Psychology",
  "Pulmonology",
  "Gastroenterology",
  "Hepatology",
  "Endocrinology",
  "Diabetology",
  "Rheumatology",
  "Anesthesiology",
  "Radiology",
  "Pathology",
  "Microbiology",
  "Emergency Medicine",
  "Critical Care Medicine",
  "Dentistry",
  "Oral Surgery",
  "Physiotherapy",
  "Sports Medicine",
  "Hematology",
  "Infectious Diseases",
  "Pain Management",
  "Other",
];



const inputStyle = {
  width: "100%",
  padding: "11px 12px",
  border: "1px solid #cbd5e1",
  borderRadius: 8,
  boxSizing: "border-box",
  outlineColor: "#2563eb",
  fontSize: 14,
};

const initialForm = {
  name: "",
  email: "",
  password: "",
  phone: "",
  specialization: "",
  department: "",
  qualification: "",
  experience: "",
  consultationFee: "",
};

export default function DoctorList() {
  const { hasRole } = useAuth();
  const navigate = useNavigate();
  const canAddDoctor = hasRole("admin", "receptionist");
  const [doctors, setDoctors] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(initialForm);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const [departmentsError, setDepartmentsError] = useState("");

  const fetchDoctors = async () => {
    try {
      setLoading(true);
      setError("");

      const data = await getDoctors();

      setDoctors(
        Array.isArray(data)
          ? data
          : data.doctors || data.data || []
      );
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load doctors."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const response = await getDepartments();
        setDepartments(response.data || []);
      } catch (err) {
        setDepartmentsError(errMsg(err));
      } finally {
        setDepartmentsLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const response = await createDoctor({
        ...form,
        experience: Number(form.experience || 0),
        consultationFee: Number(form.consultationFee || 0),
      });

      const doctorId = response.data?._id;
      if (!doctorId) {
        throw new Error("Doctor was created, but its ID was not returned.");
      }

      setForm(initialForm);
      setShowForm(false);
      navigate(`/doctors/${doctorId}/availability`);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to register doctor."
      );
    } finally {
      setSaving(false);
    }
  };

  const filteredDoctors = doctors.filter((doctor) => {
    const text = [
      doctor.name,
      doctor.email,
      doctor.specialization,
      doctor.department?.name,
      doctor.phone,
    ]
      .join(" ")
      .toLowerCase();

    return text.includes(search.toLowerCase());
  });

  return (
    <div style={{ padding: 28, color: "#172033" }}>
      {/* HEADER */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: 16,
          marginBottom: 24,
        }}
      >
        <div>
          <h1>Doctors</h1>
          <p>Manage your hospital's doctors.</p>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={fetchDoctors}
            disabled={loading}
            style={{
              padding: "10px 16px",
              border: "1px solid #cbd5e1",
              borderRadius: 8,
              background: "white",
              cursor: "pointer",
            }}
          >
            <RefreshCw size={15} /> Refresh
          </button>

          {canAddDoctor && (
            <button
              onClick={() => {
                setError("");
                setShowForm(true);
              }}
              style={{
                padding: "10px 16px",
                border: "none",
                borderRadius: 8,
                background: "#2563eb",
                color: "white",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 7,
              }}
            >
              <Plus size={17} /> Add Doctor
            </button>
          )}
        </div>
      </div>

      {/* MESSAGES */}
      {error && (
        <div style={{
          padding: 12,
          background: "#fee2e2",
          color: "#b91c1c",
          borderRadius: 8,
          marginBottom: 16,
        }}>
          {error}
        </div>
      )}

      {/* TOTAL DOCTORS */}
      <div
        style={{
          display: "flex",
          gap: 16,
          alignItems: "center",
          padding: 20,
          marginBottom: 24,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <Stethoscope size={28} color="#2563eb" />
        <div>
          <p style={{ margin: 0 }}>Total Doctors</p>
          <h2 style={{ margin: "6px 0 0" }}>
            {loading ? "Loading..." : doctors.length}
          </h2>
        </div>
      </div>

      {/* ADD DOCTOR FORM */}
      {canAddDoctor && showForm && (
        <div
          style={{
            background: "white",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <div style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
          }}>
            <h2 style={{ margin: 0 }}>Register New Doctor</h2>

            <button
              type="button"
              onClick={() => setShowForm(false)}
              style={{
                border: "none",
                background: "transparent",
                cursor: "pointer",
              }}
            >
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: 18,
            }}>
              <label>
                Full Name *
                <input
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="Dr. Rahul"
                  style={inputStyle}
                  required
                />
              </label>

              <label>
                Email *
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="doctor@gmail.com"
                  style={inputStyle}
                  required
                />
              </label>

              <label>
                Password *
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="Minimum 6 characters"
                  minLength={6}
                  style={inputStyle}
                  required
                />
              </label>

              <label>
                Phone Number
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="9876543210"
                  style={inputStyle}
                />
              </label>

              <label>
                Specialization *
                <select
                  name="specialization"
                  value={form.specialization}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                >
                  <option value="">Select Specialization</option>
                  {SPECIALIZATIONS.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Department *
                <select
                  name="department"
                  value={form.department}
                  onChange={handleChange}
                  style={inputStyle}
                  required
                  disabled={departmentsLoading || departments.length === 0}
                >
                  <option value="">
                    {departmentsLoading ? "Loading departments..." : "Select Department"}
                  </option>
                  {departments.map((department) => (
                    <option key={department._id} value={department._id}>
                      {department.name}
                    </option>
                  ))}
                </select>
                {departmentsError && (
                  <span style={{ display: "block", color: "#b91c1c", fontSize: 12 }}>
                    Unable to load departments: {departmentsError}
                  </span>
                )}
                {!departmentsLoading && !departmentsError && departments.length === 0 && (
                  <span style={{ display: "block", color: "#b91c1c", fontSize: 12 }}>
                    Add a department before registering a doctor.
                  </span>
                )}
              </label>

              <label>
                Qualification
                <input
                  name="qualification"
                  value={form.qualification}
                  onChange={handleChange}
                  placeholder="MBBS, MD"
                  style={inputStyle}
                />
              </label>

              <label>
                Experience (Years)
                <input
                  type="number"
                  name="experience"
                  value={form.experience}
                  onChange={handleChange}
                  min="0"
                  style={inputStyle}
                />
              </label>

              <label>
                Consultation Fee
                <input
                  type="number"
                  name="consultationFee"
                  value={form.consultationFee}
                  onChange={handleChange}
                  min="0"
                  style={inputStyle}
                />
              </label>
            </div>

            <div style={{
              display: "flex",
              gap: 12,
              marginTop: 24,
            }}>
              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "11px 22px",
                  background: "#2563eb",
                  color: "white",
                  border: "none",
                  borderRadius: 8,
                  cursor: saving ? "not-allowed" : "pointer",
                }}
              >
                {saving ? (
                  <>
                    <Loader2
                      size={15}
                      style={{
                        verticalAlign: "middle",
                        marginRight: 6,
                      }}
                    />
                    Saving...
                  </>
                ) : "Save Doctor"}
              </button>

              <button
                type="button"
                onClick={() => setShowForm(false)}
                style={{
                  padding: "11px 22px",
                  border: "1px solid #cbd5e1",
                  background: "white",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* SEARCH AND DOCTOR TABLE */}
      <div
        style={{
          padding: 20,
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
        }}
      >
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          maxWidth: 450,
          padding: "0 12px",
          border: "1px solid #cbd5e1",
          borderRadius: 8,
          marginBottom: 20,
        }}>
          <Search size={18} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search doctors..."
            style={{
              flex: 1,
              padding: 12,
              border: "none",
              outline: "none",
            }}
          />
        </div>

        {loading ? (
          <p>Loading doctors...</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{
              width: "100%",
              borderCollapse: "collapse",
              textAlign: "left",
            }}>
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  <th style={{ padding: 12 }}>Doctor</th>
                  <th style={{ padding: 12 }}>Email</th>
                  <th style={{ padding: 12 }}>Specialization</th>
                  <th style={{ padding: 12 }}>Department</th>
                  <th style={{ padding: 12 }}>Phone</th>
                  {canAddDoctor && <th style={{ padding: 12 }}>Schedule</th>}
                </tr>
              </thead>

              <tbody>
                {filteredDoctors.map((doctor, index) => (
                  <tr
                    key={doctor._id || doctor.id || index}
                    style={{
                      borderBottom: "1px solid #e2e8f0",
                    }}
                  >
                    <td style={{ padding: 12 }}>
                      <UserRound
                        size={16}
                        style={{
                          verticalAlign: "middle",
                          marginRight: 8,
                        }}
                      />
                      {doctor.name || "Unnamed Doctor"}
                    </td>

                    <td style={{ padding: 12 }}>
                      {doctor.email || "—"}
                    </td>

                    <td style={{ padding: 12 }}>
                      {doctor.specialization || "—"}
                    </td>

                    <td style={{ padding: 12 }}>
                      {typeof doctor.department === "object"
                        ? doctor.department?.name || "—"
                        : doctor.department || "—"}
                    </td>

                    <td style={{ padding: 12 }}>
                      {doctor.phone || "—"}
                    </td>

                    {canAddDoctor && (
                      <td style={{ padding: 12 }}>
                        <Link
                          className="btn btn-outline btn-sm"
                          to={`/doctors/${doctor._id}/availability`}
                        >
                          Set availability
                        </Link>
                      </td>
                    )}
                  </tr>
                ))}

                {filteredDoctors.length === 0 && (
                  <tr>
                    <td colSpan={canAddDoctor ? 6 : 5} style={{
                      padding: 24,
                      textAlign: "center",
                    }}>
                      {search
                        ? "No matching doctors found."
                        : "No doctors found."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
