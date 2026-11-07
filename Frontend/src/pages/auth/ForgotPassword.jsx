import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail } from "lucide-react";
import toast from "react-hot-toast";
import { forgotPassword } from "../../api/authApi";
import { errMsg } from "../../api/axios";
import { isEmail } from "../../utils/validators";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import "./AuthPages.css";

export default function ForgotPassword() {
  useDocumentTitle("Forgot password");
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!isEmail(normalizedEmail)) {
      setError("Enter a valid email address.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await forgotPassword(normalizedEmail);
      toast.success(response.message || "If an account exists, reset instructions have been sent.");
      navigate("/verify-reset-otp", { state: { email: normalizedEmail } });
    } catch (requestError) {
      setError(errMsg(requestError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <main className="auth-main">
        <form className="auth-card" onSubmit={handleSubmit} noValidate>
          <h2>Forgot password?</h2>
          <p className="muted">Enter the email address associated with your account.</p>
          <div className="auth-field">
            <label htmlFor="reset-email">Email</label>
            <div className={`auth-input ${error ? "has-error" : ""}`}>
              <Mail size={17} />
              <input
                autoFocus
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setError("");
                }}
              />
            </div>
            {error && <small className="error">{error}</small>}
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Sending code..." : "Send reset code"}
          </button>
          <p className="auth-switch">
            Remembered your password? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </main>
    </div>
  );
}