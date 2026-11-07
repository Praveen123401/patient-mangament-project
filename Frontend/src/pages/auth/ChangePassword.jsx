import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Activity,
  Eye,
  EyeOff,
  Lock,
  ArrowLeft,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

import { changePassword } from "../../api/authApi";
import "./ChangePassword.css";

export default function ChangePassword() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setError("");
    setMessage("");
  };

  const togglePassword = (field) => {
    setShowPasswords((previous) => ({
      ...previous,
      [field]: !previous[field],
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const {
      currentPassword,
      newPassword,
      confirmPassword,
    } = formData;

    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (newPassword.length < 6) {
      setError("Your new password must contain at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }

    if (currentPassword === newPassword) {
      setError("Your new password must differ from your current password.");
      return;
    }

    setLoading(true);

    try {
      const response = await changePassword(
        currentPassword,
        newPassword
      );

      if (!response.success) {
        setError(response.message || "Unable to change password.");
        return;
      }

      setMessage(
        response.message || "Password changed successfully."
      );

      setFormData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });

      // The backend increments tokenVersion.
      // Log in again to obtain a fresh access token.
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");

      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 1800);
    } catch (err) {
      const responseMessage =
        err.response?.data?.message ||
        err.message ||
        "Unable to change password. Please try again.";

      if (err.response?.status === 401) {
        setError("Your session has expired. Please log in again.");
      } else {
        setError(responseMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  const renderPasswordField = ({
    label,
    name,
    field,
    placeholder,
  }) => (
    <div className="change-password-field">
      <label htmlFor={name}>{label}</label>

      <div className="change-password-input-wrapper">
        <Lock size={18} className="change-password-input-icon" />

        <input
          id={name}
          name={name}
          type={showPasswords[field] ? "text" : "password"}
          placeholder={placeholder}
          value={formData[name]}
          onChange={handleChange}
          autoComplete={
            field === "current"
              ? "current-password"
              : "new-password"
          }
          disabled={loading}
          required
        />

        <button
          type="button"
          className="change-password-eye"
          onClick={() => togglePassword(field)}
          aria-label={
            showPasswords[field]
              ? "Hide password"
              : "Show password"
          }
        >
          {showPasswords[field] ? (
            <EyeOff size={18} />
          ) : (
            <Eye size={18} />
          )}
        </button>
      </div>
    </div>
  );

  return (
    <main className="change-password-page">
      <section className="change-password-card">
        <Link to="/dashboard" className="change-password-back">
          <ArrowLeft size={18} />
          Back to Dashboard
        </Link>

        <div className="change-password-brand">
          <div className="change-password-logo">
            <Activity size={27} />
          </div>

          <span>Patient Management System</span>
        </div>

        <div className="change-password-heading">
          <h1>Change Password</h1>

          <p>
            Update your password to help keep your account secure.
          </p>
        </div>

        {error && (
          <div className="change-password-alert error" role="alert">
            <AlertCircle size={19} />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div className="change-password-alert success" role="status">
            <CheckCircle size={19} />
            <span>{message}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {renderPasswordField({
            label: "Current Password",
            name: "currentPassword",
            field: "current",
            placeholder: "Enter current password",
          })}

          {renderPasswordField({
            label: "New Password",
            name: "newPassword",
            field: "new",
            placeholder: "Enter new password",
          })}

          {renderPasswordField({
            label: "Confirm New Password",
            name: "confirmPassword",
            field: "confirm",
            placeholder: "Confirm new password",
          })}

          <div className="change-password-hint">
            Use at least 6 characters for your new password.
          </div>

          <button
            type="submit"
            className="change-password-submit"
            disabled={loading}
          >
            {loading ? "Updating Password..." : "Update Password"}
          </button>
        </form>

        <div className="change-password-footer">
          Forgot your current password?{" "}
          <Link to="/forgot-password">Reset it here</Link>
        </div>
      </section>
    </main>
  );
}