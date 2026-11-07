
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import toast from "react-hot-toast";

import {
  createDoctor,
  getDoctor,
  updateDoctor,
} from "../../api/doctorApi";

import { getDepartments } from "../../api/departmentApi";
import { errMsg } from "../../api/axios";

import useFetch from "../../hooks/useFetch";
import useDocumentTitle from "../../hooks/useDocumentTitle";

import { digitsOnly } from "../../utils/formatId";
import { isEmail, isPhone } from "../../utils/validators";

import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import Card from "../../components/common/Card";
import FormField from "../../components/common/FormField";
import Loader from "../../components/common/Loader";

// ==========================================
// MEDICAL + DENTAL SPECIALIZATIONS
// ==========================================

const SPECIALIZATIONS = [
  // General Medicine
  "General Physician",
  "General Medicine",
  "Family Medicine",
  "Internal Medicine",

  // Cardiology
  "Cardiology",
  "Interventional Cardiology",

  // Neurology
  "Neurology",
  "Neurosurgery",

  // Orthopedics
  "Orthopedics",

  // Pediatrics
  "Pediatrics",
  "Neonatology",

  // Women's Health
  "Gynecology",
  "Obstetrics",

  // Surgery
  "General Surgery",
  "Plastic Surgery",
  "Urology",

  // Other Medical Specializations
  "Dermatology",
  "Nephrology",
  "Oncology",
  "Surgical Oncology",
  "Radiation Oncology",
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
  "Geriatrics",
  "Physiotherapy",
  "Sports Medicine",
  "Infectious Diseases",
  "Hematology",
  "Pain Management",

  // DENTAL SPECIALIZATIONS
  "General Dentist",
  "Orthodontist",
  "Endodontist",
  "Periodontist",
  "Oral and Maxillofacial Surgeon",
  "Pediatric Dentist",
  "Prosthodontist",

  "Other",
];

// ==========================================
// INITIAL FORM DATA
// ==========================================

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  password: "",
  specialization: "",
  qualification: "",
  experience: "",
  consultationFee: "",
  department: "",
};

// ==========================================
// DOCTOR FORM COMPONENT
// ==========================================

export default function DoctorForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);

  const navigate = useNavigate();

  useDocumentTitle(isEdit ? "Edit doctor" : "Add doctor");

  const [form, setForm] = useState(EMPTY);
  const [account, setAccount] = useState(null);

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  // Fetch active departments
  const departments = useFetch(() => getDepartments(), []);
  const departmentList = departments.data?.data || [];

  // ==========================================
  // LOAD EXISTING DOCTOR
  // ==========================================

  useEffect(() => {
    if (!isEdit) return;

    getDoctor(id)
      .then((res) => {
        const d = res.data;

        setAccount(d.user);

        setForm({
          ...EMPTY,
          specialization: d.specialization || "",
          qualification: d.qualification || "",
          experience: d.experience ?? "",
          consultationFee: d.consultationFee ?? "",
          department: d.department?._id || "",
        });
      })
      .catch((err) => {
        toast.error(errMsg(err));
        navigate("/doctors");
      })
      .finally(() => setLoading(false));
  }, [id, isEdit, navigate]);

  // ==========================================
  // HANDLE INPUT CHANGES
  // ==========================================

  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  // ==========================================
  // FORM VALIDATION
  // ==========================================

  const validate = () => {
    const validationErrors = {};

    if (!isEdit) {
      if (form.name.trim().length < 2) {
        validationErrors.name = "Enter the doctor's full name";
      }

      if (!isEmail(form.email)) {
        validationErrors.email = "Enter a valid email address";
      }

      if (form.phone && !isPhone(form.phone)) {
        validationErrors.phone =
          "Enter a valid 10 digit mobile number";
      }

      if (form.password.length < 8) {
        validationErrors.password =
          "Password must contain at least 8 characters";
      }
    }

    if (!form.specialization.trim()) {
      validationErrors.specialization =
        "Please select a specialization";
    }

    if (
      form.experience !== "" &&
      (!Number.isFinite(Number(form.experience)) ||
        Number(form.experience) < 0)
    ) {
      validationErrors.experience = "Enter a valid experience";
    }

    if (
      form.consultationFee !== "" &&
      (!Number.isFinite(Number(form.consultationFee)) ||
        Number(form.consultationFee) < 0)
    ) {
      validationErrors.consultationFee =
        "Enter a valid consultation fee";
    }

    if (
      form.department &&
      !departmentList.some((d) => d._id === form.department)
    ) {
      validationErrors.department =
        "Please select a valid department";
    }

    setErrors(validationErrors);

    return Object.keys(validationErrors).length === 0;
  };

  // ==========================================
  // DOCTOR PROFILE DATA
  // ==========================================

  const profileBody = () => ({
    specialization: form.specialization.trim(),

    qualification: form.qualification.trim(),

    experience:
      form.experience === ""
        ? undefined
        : Number(form.experience),

    consultationFee:
      form.consultationFee === ""
        ? 0
        : Number(form.consultationFee),

    department: form.department || undefined,
  });

  // ==========================================
  // SUBMIT FORM
  // ==========================================

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) {
      toast.error("Please fix the highlighted fields");
      return;
    }

    setSaving(true);

    try {
      if (isEdit) {
        await updateDoctor(id, profileBody());

        toast.success("Doctor updated successfully");
        navigate("/doctors");
        return;
      }

      const doctorResponse = await createDoctor({
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        ...profileBody(),
      });

      toast.success("Doctor added successfully!");

      navigate(`/doctors/${doctorResponse.data._id}/availability`);
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setSaving(false);
    }
  };

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return <Loader />;
  }

  // ==========================================
  // FORM UI
  // ==========================================

  return (
    <>
      <Breadcrumb
        items={[
          { label: "Doctors", to: "/doctors" },
          {
            label: isEdit ? "Edit doctor" : "Add doctor",
          },
        ]}
      />

      <PageHeader
        title={isEdit ? "Edit doctor" : "Add doctor"}
        subtitle={
          isEdit
            ? `Dr. ${account?.name} · ${account?.email}`
            : "Register a new doctor and create their login account"
        }
      />

      <form onSubmit={handleSubmit} noValidate>
        {/* LOGIN ACCOUNT */}

        {!isEdit && (
          <>
            <Card title="Doctor Login Account">
              <p className="form-note">
                Create the doctor's login account.
                The doctor can use these credentials
                to access the hospital management system.
              </p>

              <div className="form-grid">
                <FormField
                  label="Full Name"
                  name="name"
                  placeholder="e.g. Anita Rao"
                  value={form.name}
                  onChange={handleChange}
                  error={errors.name}
                  required
                />

                <FormField
                  label="Email Address"
                  name="email"
                  type="email"
                  placeholder="doctor@example.com"
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  required
                />

                <FormField
                  label="Mobile Number"
                  name="phone"
                  inputMode="numeric"
                  placeholder="10 digit mobile number"
                  value={form.phone}
                  onChange={(e) =>
                    handleChange({
                      target: {
                        name: "phone",
                        value: digitsOnly(e.target.value, 10),
                      },
                    })
                  }
                  error={errors.phone}
                />

                <FormField
                  label="Password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  placeholder="Minimum 8 characters"
                  value={form.password}
                  onChange={handleChange}
                  error={errors.password}
                  required
                />
              </div>
            </Card>

            <div style={{ height: 14 }} />
          </>
        )}

        {/* DOCTOR PROFESSIONAL PROFILE */}

        <Card title="Doctor Professional Details">
          <div className="form-grid">
            <FormField
              as="select"
              label="Medical Specialization"
              name="specialization"
              value={form.specialization}
              onChange={handleChange}
              error={errors.specialization}
              options={[
                {
                  value: "",
                  label: "Select Specialization",
                },
                ...SPECIALIZATIONS.map((item) => ({
                  value: item,
                  label: item,
                })),
                ...(form.specialization &&
                !SPECIALIZATIONS.includes(form.specialization)
                  ? [
                      {
                        value: form.specialization,
                        label: form.specialization,
                      },
                    ]
                  : []),
              ]}
              required
            />

            <FormField
              as="select"
              label="Hospital Department"
              name="department"
              value={form.department}
              onChange={handleChange}
              error={errors.department}
              options={[
                {
                  value: "",
                  label: departments.loading
                    ? "Loading departments..."
                    : "Select Department",
                },
                ...departmentList.map((d) => ({
                  value: d._id,
                  label: d.name,
                })),
              ]}
            />

            <FormField
              label="Qualification"
              name="qualification"
              placeholder="e.g. MBBS, BDS, MDS, MS"
              value={form.qualification}
              onChange={handleChange}
            />

            <FormField
              label="Experience (Years)"
              name="experience"
              type="number"
              min="0"
              placeholder="e.g. 5"
              value={form.experience}
              onChange={handleChange}
              error={errors.experience}
            />

            <FormField
              label="Consultation Fee (₹)"
              name="consultationFee"
              type="number"
              min="0"
              placeholder="e.g. 500"
              value={form.consultationFee}
              onChange={handleChange}
              error={errors.consultationFee}
            />
          </div>

          {departments.error && (
            <p className="error">
              Unable to load departments.
              Please refresh and try again.
            </p>
          )}

          {!departments.loading &&
            departmentList.length === 0 && (
              <p className="form-note">
                No active departments found.
                Add departments from the Department
                Management page first.
              </p>
            )}
        </Card>

        {/* FORM ACTIONS */}

        <div className="form-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => navigate("/doctors")}
            disabled={saving}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="btn btn-primary"
            disabled={saving || departments.loading}
          >
            {saving
              ? "Saving..."
              : isEdit
                ? "Save Changes"
                : "Add Doctor"}
          </button>
        </div>
      </form>
    </>
  );
}
