
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getLabTests, createLabOrder } from "../../api/labApi";
import { getPatients } from "../../api/patientApi";

const getList = (result) => {
  if (Array.isArray(result)) return result;
  if (Array.isArray(result?.data)) return result.data;
  if (Array.isArray(result?.data?.data)) return result.data.data;
  if (Array.isArray(result?.patients)) return result.patients;
  return [];
};

const getPatientName = (patient) =>
  patient.fullName || patient.name ||
  [patient.firstName, patient.lastName].filter(Boolean).join(" ") ||
  "Unnamed Patient";

const getPatientAge = (patient) => {
  if (patient.age != null) return patient.age;

  if (!patient.dateOfBirth) return "Not available";

  const dob = new Date(patient.dateOfBirth);
  if (Number.isNaN(dob.getTime())) return "Not available";

  const today = new Date();
  let age = today.getFullYear() - dob.getFullYear();

  if (
    today.getMonth() < dob.getMonth() ||
    (today.getMonth() === dob.getMonth() &&
      today.getDate() < dob.getDate())
  ) {
    age--;
  }

  return age;
};

export default function LabOrderForm() {
  const navigate = useNavigate();

  const [patients, setPatients] = useState([]);
  const [tests, setTests] = useState([]);
  const [patientSearch, setPatientSearch] = useState("");
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [selectedTests, setSelectedTests] = useState([]);
  const [priority, setPriority] = useState("routine");
  const [doctorId, setDoctorId] = useState("");
  const [admissionId, setAdmissionId] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const loadData = async () => {
      try {
        const [patientResult, testResult] = await Promise.all([
          getPatients({ limit: 100 }),
          getLabTests(),
        ]);

        setPatients(getList(patientResult));
        setTests(getList(testResult));
      } catch (err) {
        setError(
          err.response?.data?.message ||
          "Unable to load patients or laboratory tests."
        );
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  const filteredPatients = useMemo(() => {
    const query = patientSearch.trim().toLowerCase();

    if (!query) return [];

    return patients.filter((patient) => {
      const searchable = [
        getPatientName(patient),
        patient.patientId,
        patient.phone,
        patient.phoneNumber,
        patient.mobile,
      ];

      return searchable.some((value) =>
        String(value || "").toLowerCase().includes(query)
      );
    });
  }, [patients, patientSearch]);

  const toggleTest = (testId) => {
    setSelectedTests((previous) =>
      previous.includes(testId)
        ? previous.filter((id) => id !== testId)
        : [...previous, testId]
    );
  };

  const total = tests
    .filter((test) => selectedTests.includes(test._id))
    .reduce((sum, test) => sum + Number(test.price || 0), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!selectedPatient) {
      setError("Please select a patient.");
      return;
    }

    if (selectedTests.length === 0) {
      setError("Please select at least one laboratory test.");
      return;
    }

    const body = {
      patient: selectedPatient._id,
      tests: selectedTests,
      priority,
    };

    if (doctorId.trim()) body.doctor = doctorId.trim();
    if (admissionId.trim()) body.admission = admissionId.trim();

    try {
      setSaving(true);
      await createLabOrder(body);
      navigate("/lab/orders");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Unable to create laboratory order."
      );
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <p style={{ padding: 24 }}>Loading laboratory information...</p>;
  }

  const inputStyle = {
    display: "block",
    width: "100%",
    padding: 11,
    marginTop: 7,
    marginBottom: 16,
    border: "1px solid #d1d5db",
    borderRadius: 7,
    boxSizing: "border-box",
  };

  return (
    <div style={{ padding: 24, maxWidth: 850 }}>
      <h1>Create Laboratory Order</h1>
      <p>Register a patient and select the required laboratory tests.</p>

      {error && (
        <p style={{ color: "#b91c1c", background: "#fee2e2", padding: 12 }}>
          {error}
        </p>
      )}

      <form onSubmit={handleSubmit}>
        <h2>1. Patient Information</h2>

        <label>Search Patient *</label>
        <input
          style={inputStyle}
          value={patientSearch}
          onChange={(e) => {
            setPatientSearch(e.target.value);
            setSelectedPatient(null);
          }}
          placeholder="Search by patient name, ID or phone"
        />

        {patientSearch && !selectedPatient && (
          <div style={{
            border: "1px solid #ddd",
            borderRadius: 7,
            marginTop: -10,
            marginBottom: 18,
            maxHeight: 220,
            overflowY: "auto",
          }}>
            {filteredPatients.length > 0 ? (
              filteredPatients.map((patient) => (
                <button
                  key={patient._id}
                  type="button"
                  onClick={() => {
                    setSelectedPatient(patient);
                    setPatientSearch(getPatientName(patient));
                  }}
                  style={{
                    display: "block",
                    width: "100%",
                    textAlign: "left",
                    padding: 12,
                    border: "none",
                    borderBottom: "1px solid #eee",
                    background: "white",
                    cursor: "pointer",
                  }}
                >
                  <strong>{getPatientName(patient)}</strong>
                  <br />
                  <small>
                    ID: {patient.patientId || patient._id}
                    {" | "}
                    Phone: {patient.phone || patient.phoneNumber || patient.mobile || "-"}
                  </small>
                </button>
              ))
            ) : (
              <p style={{ padding: 12 }}>No matching patients found.</p>
            )}
          </div>
        )}

        {selectedPatient && (
          <div style={{
            border: "1px solid #bfdbfe",
            background: "#eff6ff",
            borderRadius: 9,
            padding: 16,
            marginBottom: 20,
          }}>
            <h3>Selected Patient</h3>
            <p><strong>Name:</strong> {getPatientName(selectedPatient)}</p>
            <p><strong>Patient ID:</strong> {selectedPatient.patientId || selectedPatient._id}</p>
            <p><strong>Age:</strong> {getPatientAge(selectedPatient)}</p>
            <p><strong>Gender:</strong> {selectedPatient.gender || "Not available"}</p>
            <p><strong>Phone:</strong> {selectedPatient.phone || selectedPatient.phoneNumber || selectedPatient.mobile || "Not available"}</p>

            <button
              type="button"
              onClick={() => {
                setSelectedPatient(null);
                setPatientSearch("");
              }}
            >
              Change Patient
            </button>
          </div>
        )}

        <h2>2. Order Information</h2>

        <label>Priority *</label>
        <select
          style={inputStyle}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
        >
          <option value="routine">Routine</option>
          <option value="urgent">Urgent</option>
        </select>

        <label>Referring Doctor ID (optional)</label>
        <input
          style={inputStyle}
          value={doctorId}
          onChange={(e) => setDoctorId(e.target.value)}
          placeholder="Enter doctor ID if available"
        />

        <label>Admission ID (optional)</label>
        <input
          style={inputStyle}
          value={admissionId}
          onChange={(e) => setAdmissionId(e.target.value)}
          placeholder="Enter admission ID for admitted patients"
        />

        <h2>3. Select Laboratory Tests</h2>

        {tests.length === 0 ? (
          <p>No active laboratory tests found. Add tests first.</p>
        ) : (
          <div style={{ display: "grid", gap: 10 }}>
            {tests.map((test) => (
              <label
                key={test._id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: 13,
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedTests.includes(test._id)}
                  onChange={() => toggleTest(test._id)}
                />

                <span style={{ flex: 1 }}>
                  <strong>{test.name}</strong>
                  <br />
                  <small>
                    {test.category} | Sample: {test.sampleType || "Not specified"}
                    {test.fastingRequired ? " | Fasting required" : ""}
                  </small>
                </span>

                <strong>₹{test.price}</strong>
              </label>
            ))}
          </div>
        )}

        <h2>4. Order Summary</h2>

        <p>Selected tests: {selectedTests.length}</p>
        <h3>Total Amount: ₹{total.toFixed(2)}</h3>

        <button
          type="submit"
          disabled={saving || !selectedPatient || selectedTests.length === 0}
        >
          {saving ? "Creating Order..." : "Create Laboratory Order"}
        </button>{" "}

        <button
          type="button"
          onClick={() => navigate("/lab/orders")}
        >
          Cancel
        </button>
      </form>
    </div>
  );
}


