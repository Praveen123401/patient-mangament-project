import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Activity, Eye, EyeOff, Lock } from "lucide-react";
import toast from "react-hot-toast";
import { resetPassword } from "../../api/authApi";
import { errMsg } from "../../api/axios";
import { HOSPITAL_NAME } from "../../utils/constants";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import "./AuthPages.css";

export default function ResetPassword() {
  useDocumentTitle("Reset password");
  const location = useLocation();
  const navigate = useNavigate();
  const { email, otp } = location.state || {};
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email || !otp) return <Navigate to="/forgot-password" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }
    if (new TextEncoder().encode(password).length > 72) {
      setError("Password cannot exceed 72 UTF-8 bytes.");
      return;
    }
    if (password !== confirmation) {
      setError("Passwords do not match.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await resetPassword(email, otp, password);
      toast.success(response.message || "Password reset. Please sign in.");
      navigate("/login", { replace: true });
    } catch (requestError) {
      setError(errMsg(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <aside className="auth-side">
        <div className="auth-brand">
          <Activity size={30} />
          <h1>{HOSPITAL_NAME}</h1>
        </div>
        <h2>Choose a new password.</h2>
        <p>Use a password you have not used for this account before.</p>
      </aside>
      <main className="auth-main">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Reset password</h2>
          <p className="muted">Create a new password for {email}.</p>
          <div className="auth-field">
            <label htmlFor="new-password">New password</label>
            <div className={`auth-input ${error ? "has-error" : ""}`}>
              <Lock size={17} />
              <input
                autoFocus
                id="new-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={password}
                onChange={(event) => {
                  setPassword(event.target.value);
                  setError("");
                }}
              />
              <button
                type="button"
                className="eye"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>
          </div>
          <div className="auth-field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <div className={`auth-input ${error ? "has-error" : ""}`}>
              <Lock size={17} />
              <input
                id="confirm-password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                value={confirmation}
                onChange={(event) => {
                  setConfirmation(event.target.value);
                  setError("");
                }}
              />
            </div>
            {error && <small className="error">{error}</small>}
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Updating password..." : "Update password"}
          </button>
          <p className="auth-switch">
            <Link to="/login">Return to sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}
