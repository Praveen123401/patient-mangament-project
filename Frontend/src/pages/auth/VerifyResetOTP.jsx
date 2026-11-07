import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { verifyResetOtp } from "../../api/authApi";
import { errMsg } from "../../api/axios";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import "./AuthPages.css";

export default function VerifyResetOTP() {
  useDocumentTitle("Verify reset code");
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email;
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!email) return <Navigate to="/forgot-password" replace />;

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!/^\d{6}$/.test(otp)) {
      setError("Enter the six-digit code from your email.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      const response = await verifyResetOtp(email, otp);
      toast.success(response.message || "Code verified.");
      navigate("/reset-password", { state: { email, otp } });
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
          <h2>Verify your code</h2>
          <p className="muted">Enter the six-digit code sent to {email}.</p>
          <div className="auth-field">
            <label htmlFor="reset-otp">Verification code</label>
            <div className={`auth-input ${error ? "has-error" : ""}`}>
              <KeyRound size={17} />
              <input
                autoFocus
                id="reset-otp"
                name="otp"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                placeholder="123456"
                value={otp}
                onChange={(event) => {
                  setOtp(event.target.value.replace(/\D/g, "").slice(0, 6));
                  setError("");
                }}
              />
            </div>
            {error && <small className="error">{error}</small>}
          </div>
          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Verify code"}
          </button>
          <p className="auth-switch">
            Wrong email? <Link to="/forgot-password">Start again</Link>
          </p>
        </form>
      </main>
    </div>
  );
}