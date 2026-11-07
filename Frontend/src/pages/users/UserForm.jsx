
import React, { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import "./UserForm.css";

const emptyForm = {
  name: "",
  email: "",
  phone: "",
  role: "RECEPTIONIST",
  status: "Active",
};

export default function UserForm({ initialData, onSave, onCancel }) {
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (initialData) {
      setForm({ ...emptyForm, ...initialData });
    } else {
      setForm(emptyForm);
    }
    setErrors({});
  }, [initialData]);

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

  const validate = () => {
    const newErrors = {};

    if (!form.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Enter a valid email address";
    }

    if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Enter a valid 10-digit phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!validate()) return;

    onSave({
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      role: form.role,
      status: form.status,
    });
  };

  return (
    <form className="user-form" onSubmit={handleSubmit}>
      <div className="user-form-field">
        <label>Full Name *</label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          placeholder="Enter full name"
        />
        {errors.name && <small>{errors.name}</small>}
      </div>

      <div className="user-form-field">
        <label>Email Address *</label>
        <input
          type="email"
          name="email"
          value={form.email}
          onChange={handleChange}
          placeholder="example@hospital.com"
        />
        {errors.email && <small>{errors.email}</small>}
      </div>

      <div className="user-form-field">
        <label>Phone Number *</label>
        <input
          name="phone"
          value={form.phone}
          onChange={handleChange}
          maxLength={10}
          inputMode="numeric"
          placeholder="10-digit mobile number"
        />
        {errors.phone && <small>{errors.phone}</small>}
      </div>

      <div className="user-form-field">
        <label>User Role *</label>
        <select name="role" value={form.role} onChange={handleChange}>
          <option value="ADMIN">Admin</option>
          <option value="DOCTOR">Doctor</option>
          <option value="NURSE">Nurse</option>
          <option value="RECEPTIONIST">Receptionist</option>
          <option value="LAB_TECH">Lab Technician</option>
          <option value="PHARMACIST">Pharmacist</option>
          <option value="PATIENT">Patient</option>
        </select>
      </div>

      <div className="user-form-field">
        <label>Account Status</label>
        <select name="status" value={form.status} onChange={handleChange}>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      <div className="user-form-actions">
        <button type="button" className="user-cancel-btn" onClick={onCancel}>
          <X size={17} /> Cancel
        </button>

        <button type="submit" className="user-save-btn">
          <Save size={17} />
          {initialData ? "Update User" : "Create User"}
        </button>
      </div>
    </form>
  );
}
