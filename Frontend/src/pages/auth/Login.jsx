import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, HeartPulse, Lock, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { login } from "../../api/authApi";
import { errMsg } from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import { isEmail } from "../../utils/validators";
import { HOSPITAL_NAME } from "../../utils/constants";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import AuthSide from "./AuthSide";
import "./AuthPages.css";

export default function Login() {
  useDocumentTitle("Sign in");
  const { user, setSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const onChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: "" });
  };

  const validate = () => {
    const e = {};
    if (!isEmail(form.email)) e.email = "Enter a valid email";
    if (!form.password) e.password = "Password is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await login({ email: form.email.trim(), password: form.password });
      setSession(res); // res = { token, user }
      toast.success(`Welcome back, ${res.user.name}`);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <AuthSide />

      <main className="auth-main">
        <div className="auth-wrap">
          <form className="auth-card" onSubmit={onSubmit} noValidate>
            <span className="auth-badge"><HeartPulse size={26} /></span>
            <h2>Welcome back</h2>
            <p className="auth-sub">Sign in to continue to your account</p>

            <div className="auth-field">
              <label htmlFor="email">Email</label>
              <div className={`auth-input ${errors.email ? "has-error" : ""}`}>
                <Mail size={18} />
                <input id="email" name="email" type="email" autoComplete="email" placeholder="you@example.com" value={form.email} onChange={onChange} />
              </div>
              {errors.email && <small className="auth-error">{errors.email}</small>}
            </div>

            <div className="auth-field">
              <label htmlFor="password">Password</label>
              <div className={`auth-input ${errors.password ? "has-error" : ""}`}>
                <Lock size={18} />
                <input id="password" name="password" type={show ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={form.password} onChange={onChange} />
                <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Show password">
                  {show ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && <small className="auth-error">{errors.password}</small>}
            </div>

            <div className="auth-row">
              <span />
              <Link to="/forgot-password">Forgot password?</Link>
            </div>

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (<><span className="btn-spin" /> Signing in...</>) : (<>Sign in <ArrowRight size={18} /></>)}
            </button>

            <p className="auth-switch">
              New patient? <Link to="/register">Create an account</Link>
            </p>
            <p className="auth-note">Staff accounts are created by the administrator.</p>
          </form>

          <p className="auth-foot">© {new Date().getFullYear()} {HOSPITAL_NAME}</p>
        </div>
      </main>
    </div>
  );
}