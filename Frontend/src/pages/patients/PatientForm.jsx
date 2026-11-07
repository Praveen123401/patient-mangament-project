
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  createPatient,
  getPatient,
  updatePatient,
} from "../../api/patientApi";

import api, { errMsg } from "../../api/axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";

import {
  BLOOD_GROUPS,
  FULL_ACCESS_ROLES,
  GENDERS,
  INDIAN_STATES,
  MARITAL_STATUS,
  RATION_CARD_OPTIONS,
} from "../../utils/constants";

import { validatePatient } from "../../utils/validators";
import { digitsOnly, formatAadhaar } from "../../utils/formatId";
import { toInputDate } from "../../utils/formatDate";
import calculateAge from "../../utils/calculateAge";

import PageHeader from "../../components/common/PageHeader";
import Breadcrumb from "../../components/common/Breadcrumb";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";

const EMPTY = {
  name: "",
  guardianName: "",
  guardianRelation: "",
  dob: "",
  gender: "",
  maritalStatus: "",
  occupation: "",
  bloodGroup: "",
  allergies: "",
  phone: "",
  alternatePhone: "",
  email: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  medicalConditions: "",
  currentMedications: "",
  medicalHistory: "",
  department: "",
  assignedDoctor: "",
  patientType: "OPD",
  registrationStatus: "registered",
  admissionDate: "",
  hasRationCard: "no",
  rationCardNumber: "",
  rationCardType: "",
  governmentScheme: "None",
  schemeMemberId: "",
  aadhaarNumber: "",
  annualIncome: "",
  ecName: "",
  ecPhone: "",
  ecRelation: "",
};

const GAP = <div style={{ height: 14 }} />;

const SCHEME_OPTIONS = [
  { value: "None", label: "None" },
  { value: "PM-JAY", label: "Ayushman Bharat (PM-JAY)" },
  { value: "State Scheme", label: "State Government Scheme" },
  { value: "ESI", label: "ESI" },
  { value: "CGHS", label: "CGHS" },
  { value: "Other", label: "Other" },
];

const PATIENT_TYPES = [
  { value: "OPD", label: "OPD - Outpatient" },
  { value: "IPD", label: "IPD - Inpatient" },
  { value: "Emergency", label: "Emergency" },
];

const STATUS_OPTIONS = [
  { value: "registered", label: "Registered" },
  { value: "pending", label: "Pending" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

// Supports common API response structures.
function getArray(response) {
  const body = response?.data ?? response;

  if (Array.isArray(body)) return body;

  const possibleArrays = [
    body?.data,
    body?.data?.items,
    body?.data?.doctors,
    body?.data?.departments,
    body?.items,
    body?.doctors,
    body?.departments,
    body?.results,
  ];

  return possibleArrays.find(Array.isArray) || [];
}

function dateValue(value) {
  return value ? String(value).slice(0, 10) : "";
}

function getId(value) {
  if (!value) return "";
  if (typeof value === "object") {
    return String(value._id || value.id || "");
  }
  return String(value);
}

function getDepartmentId(doctor) {
  return getId(
    doctor.department ||
    doctor.departmentId ||
    doctor.department_id
  );
}

function getDoctorName(doctor) {
  return (
    doctor.user?.name ||
    doctor.user?.fullName ||
    doctor.name ||
    doctor.fullName ||
    doctor.specialization ||
    "Doctor"
  );
}

export default function PatientForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const { user } = useAuth();

  useDocumentTitle(isEdit ? "Edit patient" : "Register patient");

  const fullAccess = FULL_ACCESS_ROLES.includes(user?.role);

  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [doctors, setDoctors] = useState([]);

  const [loading, setLoading] = useState(isEdit);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [loadingDoctors, setLoadingDoctors] = useState(true);
  const [saving, setSaving] = useState(false);

  const age = useMemo(() => {
    if (!form.dob) return "";
    return calculateAge(form.dob);
  }, [form.dob]);

  // Match doctors to the selected department using ID or name.
  const filteredDoctors = useMemo(() => {
    if (!form.department) return [];

    const selectedDepartment = departments.find(
      (department) =>
        String(department._id) === String(form.department)
    );

    const selectedDepartmentName =
      selectedDepartment?.name?.trim().toLowerCase();

    return doctors.filter((doctor) => {
      const departmentId = getDepartmentId(doctor);

      const departmentObject =
        typeof doctor.department === "object"
          ? doctor.department
          : null;

      const departmentName =
        departmentObject?.name ||
        doctor.departmentName ||
        doctor.department_name;

      const matchesById =
        departmentId &&
        departmentId === String(form.department);

      const matchesByName =
        departmentName &&
        selectedDepartmentName &&
        String(departmentName).trim().toLowerCase() ===
          selectedDepartmentName;

      return Boolean(matchesById || matchesByName);
    });
  }, [doctors, departments, form.department]);

  // Load departments and doctors.
  useEffect(() => {
    let mounted = true;

    async function loadOptions() {
      try {
        setLoadingDepartments(true);
        setLoadingDoctors(true);

        const [departmentResponse, doctorResponse] =
          await Promise.all([
            api.get("/departments"),
            api.get("/doctors"),
          ]);

        if (!mounted) return;

        const departmentList = getArray(departmentResponse);
        const doctorList = getArray(doctorResponse);

        setDepartments(departmentList);
        setDoctors(doctorList);

        console.log("Departments loaded:", departmentList);
        console.log("Doctors loaded:", doctorList);
      } catch (error) {
        if (mounted) {
          toast.error("Unable to load departments or doctors");
          console.error("Loading departments/doctors failed:", error);
        }
      } finally {
        if (mounted) {
          setLoadingDepartments(false);
          setLoadingDoctors(false);
        }
      }
    }

    loadOptions();

    return () => {
      mounted = false;
    };
  }, []);

  // Load existing patient when editing.
  useEffect(() => {
    if (!isEdit) {
      setLoading(false);
      return;
    }

    let mounted = true;

    async function loadPatient() {
      try {
        const response = await getPatient(id);
        const p = response?.data?.data ?? response?.data ?? response;

        if (!mounted || !p) return;

        const emergency = p.emergencyContact || {};

        setForm((previous) => ({
          ...previous,
          ...p,

          dob: dateValue(p.dob),
          admissionDate: dateValue(p.admissionDate),

          allergies: (p.allergies || []).join(", "),
          medicalConditions: (p.medicalConditions || []).join(", "),
          currentMedications: (p.currentMedications || []).join(", "),

          department: getId(p.department),
          assignedDoctor: getId(p.assignedDoctor),

          hasRationCard: p.hasRationCard ? "yes" : "no",

          ecName: emergency.name || "",
          ecPhone: emergency.phone || "",
          ecRelation: emergency.relation || "",

          annualIncome: p.annualIncome ?? "",
        }));
      } catch (error) {
        toast.error(errMsg(error));
        navigate("/patients");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPatient();

    return () => {
      mounted = false;
    };
  }, [id, isEdit, navigate]);

  const set = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
      ...(name === "department" ? { assignedDoctor: "" } : {}),
      ...(name === "hasRationCard" && value === "no"
        ? { rationCardNumber: "", rationCardType: "" }
        : {}),
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const setDigits = (max) => (event) => {
    set({
      target: {
        name: event.target.name,
        value: digitsOnly(event.target.value, max),
      },
    });
  };

  const setUpper = (event) => {
    set({
      target: {
        name: event.target.name,
        value: event.target.value.toUpperCase(),
      },
    });
  };

  const onSubmit = async (event) => {
    event.preventDefault();

    const validationErrors = validatePatient(form, { fullAccess });

    if (form.hasRationCard === "yes") {
      if (!form.rationCardNumber.trim()) {
        validationErrors.rationCardNumber =
          "Ration card number is required";
      }

      if (!form.rationCardType) {
        validationErrors.rationCardType =
          "Select ration card category";
      }
    }

    if (form.patientType === "IPD" && !form.admissionDate) {
      validationErrors.admissionDate =
        "Admission date is required for IPD";
    }

    if (
      form.assignedDoctor &&
      !filteredDoctors.some(
        (doctor) =>
          String(doctor._id) === String(form.assignedDoctor)
      )
    ) {
      validationErrors.assignedDoctor =
        "Select a doctor from this department";
    }

    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      toast.error("Please correct the highlighted fields");
      return;
    }

    const body = {
      name: form.name.trim(),
      guardianName: form.guardianName.trim(),
      guardianRelation: form.guardianRelation,
      dob: form.dob || undefined,
      age: form.dob ? age : undefined,
      gender: form.gender,
      maritalStatus: form.maritalStatus,
      occupation: form.occupation,
      bloodGroup: form.bloodGroup,

      allergies: form.allergies
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      medicalConditions: form.medicalConditions
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      currentMedications: form.currentMedications
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),

      medicalHistory: form.medicalHistory,

      phone: form.phone,
      alternatePhone: form.alternatePhone,
      email: form.email,
      address: form.address,
      city: form.city,
      state: form.state,
      pincode: form.pincode,

      department: form.department || undefined,
      assignedDoctor: form.assignedDoctor || undefined,

      patientType: form.patientType,
      registrationStatus: form.registrationStatus,

      admissionDate:
        form.patientType === "IPD" && form.admissionDate
          ? form.admissionDate
          : undefined,

      hasRationCard: form.hasRationCard === "yes",

      governmentScheme: form.governmentScheme,
      schemeMemberId: form.schemeMemberId,

      emergencyContact: {
        name: form.ecName.trim(),
        phone: form.ecPhone,
        relation: form.ecRelation.trim(),
      },

      ...(fullAccess
        ? {
            aadhaarNumber: digitsOnly(form.aadhaarNumber, 12),
            rationCardNumber:
              form.hasRationCard === "yes"
                ? form.rationCardNumber.trim().toUpperCase()
                : "",
            rationCardType:
              form.hasRationCard === "yes"
                ? form.rationCardType
                : "",
            annualIncome:
              form.annualIncome === ""
                ? ""
                : Number(form.annualIncome),
          }
        : {}),
    };

    setSaving(true);

    try {
      const response = isEdit
        ? await updatePatient(id, body)
        : await createPatient(body);

      const patient =
        response?.data?.data ?? response?.data ?? response;

      if (!patient?._id) {
        throw new Error(
          "Patient saved, but the server did not return a patient ID"
        );
      }

      toast.success(
        isEdit
          ? "Patient updated successfully"
          : `Patient registered: ${patient.patientId || patient._id}`
      );

      if (!isEdit) {
        toast.success(
          `Registration date: ${new Date(
            patient.registrationDate || Date.now()
          ).toLocaleDateString("en-IN")}`
        );
      }

      navigate(`/patients/${patient._id}`);
    } catch (error) {
      toast.error(errMsg(error));
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Patients", to: "/patients" },
          { label: isEdit ? "Edit patient" : "New patient" },
        ]}
      />

      <PageHeader
        title={isEdit ? "Edit Patient" : "Register New Patient"}
        subtitle="Complete the patient registration details"
      />

      <form onSubmit={onSubmit} noValidate>
        <Card title="1. Personal Details">
          <div className="form-grid">
            <FormField
              label="Full name"
              name="name"
              value={form.name}
              onChange={set}
              error={errors.name}
              required
            />

            <FormField
              label="Parent / spouse / Guardian name"
              name="guardianName"
              value={form.guardianName}
              onChange={set}
            />

            <FormField
              label="Guardian relation"
              name="guardianRelation"
              value={form.guardianRelation}
              onChange={set}
            />

            <FormField
              as="select"
              label="Gender"
              name="gender"
              value={form.gender}
              onChange={set}
              options={GENDERS}
              error={errors.gender}
              required
            />

            <FormField
              label="Date of birth"
              name="dob"
              type="date"
              max={toInputDate()}
              value={form.dob}
              onChange={set}
            />

            <FormField
              label="Age (automatically calculated)"
              name="ageDisplay"
              value={age === "" ? "" : `${age} years`}
              onChange={() => {}}
              disabled
            />

            <FormField
              as="select"
              label="Marital status"
              name="maritalStatus"
              value={form.maritalStatus}
              onChange={set}
              options={MARITAL_STATUS}
            />

            <FormField
              as="select"
              label="Blood group"
              name="bloodGroup"
              value={form.bloodGroup}
              onChange={set}
              options={BLOOD_GROUPS}
            />

            <FormField
              label="Occupation"
              name="occupation"
              value={form.occupation}
              onChange={set}
            />
          </div>

          <FormField
            label="Allergies (separate with commas)"
            name="allergies"
            value={form.allergies}
            onChange={set}
            placeholder="Penicillin, peanuts..."
          />
        </Card>

        {GAP}

        <Card title="2. Contact and Address">
          <div className="form-grid">
            <FormField
              label="Mobile number"
              name="phone"
              inputMode="numeric"
              value={form.phone}
              onChange={setDigits(10)}
              error={errors.phone}
              required
            />

            <FormField
              label="Alternate mobile"
              name="alternatePhone"
              inputMode="numeric"
              value={form.alternatePhone}
              onChange={setDigits(10)}
            />

            <FormField
              label="Email"
              name="email"
              type="email"
              value={form.email}
              onChange={set}
              error={errors.email}
            />
          </div>

          <FormField
            as="textarea"
            label="Address"
            name="address"
            value={form.address}
            onChange={set}
          />

          <div className="form-grid">
            <FormField
              label="City / Village"
              name="city"
              value={form.city}
              onChange={set}
            />

            <FormField
              as="select"
              label="State"
              name="state"
              value={form.state}
              onChange={set}
              options={INDIAN_STATES}
            />

            <FormField
              label="Pincode"
              name="pincode"
              inputMode="numeric"
              value={form.pincode}
              onChange={setDigits(6)}
              error={errors.pincode}
            />
          </div>
        </Card>

        {GAP}

        <Card title="3. Medical Information">
          <FormField
            label="Existing medical conditions (separate with commas)"
            name="medicalConditions"
            value={form.medicalConditions}
            onChange={set}
            placeholder="Diabetes, hypertension, asthma..."
          />

          <FormField
            label="Current medications (separate with commas)"
            name="currentMedications"
            value={form.currentMedications}
            onChange={set}
            placeholder="Medicine name and dosage..."
          />

          <FormField
            as="textarea"
            label="Medical history"
            name="medicalHistory"
            value={form.medicalHistory}
            onChange={set}
            placeholder="Previous surgeries, past illnesses, treatments..."
          />
        </Card>

        {GAP}

        <Card title="4. Department and Doctor Assignment">
          <div className="form-grid">
            <FormField
              as="select"
              label="Hospital department"
              name="department"
              value={form.department}
              onChange={set}
              options={[
                {
                  value: "",
                  label: loadingDepartments
                    ? "Loading departments..."
                    : "Select Department",
                },
                ...departments.map((department) => ({
                  value: department._id,
                  label: department.name,
                })),
              ]}
              required
            />

            <FormField
              as="select"
              label="Assigned doctor"
              name="assignedDoctor"
              value={form.assignedDoctor}
              onChange={set}
              disabled={!form.department || loadingDoctors}
              error={errors.assignedDoctor}
              options={[
                {
                  value: "",
                  label: !form.department
                    ? "Select department first"
                    : loadingDoctors
                      ? "Loading doctors..."
                      : filteredDoctors.length === 0
                        ? "No doctors assigned to this department"
                        : "Select Doctor",
                },
                ...filteredDoctors.map((doctor) => ({
                  value: doctor._id,
                  label: getDoctorName(doctor),
                })),
              ]}
            />
          </div>

          {form.department && !loadingDoctors &&
            filteredDoctors.length === 0 && (
              <p className="form-note">
                No matching doctors were found. Check whether doctors
                are assigned to this department in Doctor Management.
              </p>
            )}
        </Card>

        {GAP}

        <Card title="5. Patient Registration">
          <div className="form-grid">
            <FormField
              as="select"
              label="Patient type"
              name="patientType"
              value={form.patientType}
              onChange={set}
              options={PATIENT_TYPES}
              required
            />

            <FormField
              as="select"
              label="Registration status"
              name="registrationStatus"
              value={form.registrationStatus}
              onChange={set}
              options={STATUS_OPTIONS}
            />

            {form.patientType === "IPD" && (
              <FormField
                label="Admission date"
                name="admissionDate"
                type="date"
                max={toInputDate()}
                value={form.admissionDate}
                onChange={set}
                error={errors.admissionDate}
                required
              />
            )}
          </div>

          {form.patientType === "IPD" && (
            <p className="form-note">
              This records the admission date on the patient profile.
              Complete the separate Admission process to assign a ward or bed.
            </p>
          )}
        </Card>

        {GAP}

        <Card title="6. Identity Details">
          <div className="form-grid">
            <FormField
              as="select"
              label="Does the patient have a ration card?"
              name="hasRationCard"
              value={form.hasRationCard}
              onChange={set}
              options={[
                { value: "no", label: "No" },
                { value: "yes", label: "Yes" },
              ]}
            />
          </div>

          {form.hasRationCard === "yes" && (
            <div className="form-grid">
              {fullAccess && (
                <FormField
                  label="Ration card number / BPL card number"
                  name="rationCardNumber"
                  value={form.rationCardNumber}
                  onChange={setUpper}
                  error={errors.rationCardNumber}
                  required
                />
              )}

              <FormField
                as="select"
                label="Ration card category"
                name="rationCardType"
                value={form.rationCardType}
                onChange={set}
                options={RATION_CARD_OPTIONS}
                error={errors.rationCardType}
                required
              />
            </div>
          )}

          <FormField
            label="Aadhaar number"
            name="aadhaarNumber"
            inputMode="numeric"
            autoComplete="off"
            value={formatAadhaar(form.aadhaarNumber)}
            onChange={setDigits(12)}
            error={errors.aadhaarNumber}
          />

          <FormField
            label="Annual family income (₹)"
            name="annualIncome"
            type="number"
            min="0"
            value={form.annualIncome}
            onChange={set}
            error={errors.annualIncome}
          />
        </Card>

        {GAP}

        <Card title="7. Government Healthcare Scheme">
          <div className="form-grid">
            <FormField
              as="select"
              label="Healthcare scheme"
              name="governmentScheme"
              value={form.governmentScheme}
              onChange={set}
              options={SCHEME_OPTIONS}
            />

            {form.governmentScheme !== "None" && (
              <FormField
                label="Scheme member ID / Card number"
                name="schemeMemberId"
                value={form.schemeMemberId}
                onChange={set}
                placeholder="Enter scheme ID"
              />
            )}
          </div>

          <p className="form-note">
            PM-JAY, ESI and CGHS are healthcare schemes. They are separate
            from ration card categories such as APL and BPL.
          </p>
        </Card>

        {GAP}

        <Card title="8. Emergency Contact">
          <div className="form-grid">
            <FormField
              label="Contact name"
              name="ecName"
              value={form.ecName}
              onChange={set}
            />

            <FormField
              label="Contact phone"
              name="ecPhone"
              inputMode="numeric"
              value={form.ecPhone}
              onChange={setDigits(10)}
            />

            <FormField
              label="Relationship"
              name="ecRelation"
              value={form.ecRelation}
              onChange={set}
            />
          </div>
        </Card>

        {GAP}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate(-1)}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Update Patient"
                : "Register Patient"}
          </button>
        </div>
      </form>
    </>
  );
}
