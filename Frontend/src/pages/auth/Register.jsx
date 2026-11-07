import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, Lock, Mail, Phone, User, UserPlus } from "lucide-react";
import toast from "react-hot-toast";
import { register } from "../../api/authApi";
import { errMsg } from "../../api/axios";
import { useAuth } from "../../context/useAuth";
import { isEmail, isPhone } from "../../utils/validators";
import { digitsOnly } from "../../utils/formatId";
import { HOSPITAL_NAME } from "../../utils/constants";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import AuthSide from "./AuthSide";
import "./AuthPages.css";

const MIN_PASSWORD = 8; // matches your backend rule

// 0 = empty, 1 to 4 = weak to strong
const strength = (p) => {
  if (!p) return { level: 0, label: "" };
  if (p.length < MIN_PASSWORD) return { level: 1, label: "Too short" };
  let level = 1;
  if (/[a-z]/.test(p) && /[A-Z]/.test(p)) level += 1;
  if (/\d/.test(p)) level += 1;
  if (/[^A-Za-z0-9]/.test(p)) level += 1;
  return { level, label: ["", "Weak", "Okay", "Good", "Strong"][level] };
};

export default function Register() {
  useDocumentTitle("Create account");
  const { user, setSession } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  if (user) return <Navigate to="/" replace />;

  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((er) => ({ ...er, [name]: "" }));
  };
  const onChange = (e) => set(e.target.name, e.target.value);

  const validate = () => {
    const e = {};
    if (form.name.trim().length < 2) e.name = "Enter your full name";
    if (!isEmail(form.email)) e.email = "Enter a valid email";
    if (form.phone && !isPhone(form.phone)) e.phone = "Enter a valid 10 digit mobile number";
    if (form.password.length < MIN_PASSWORD) e.password = `At least ${MIN_PASSWORD} characters`;
    if (form.confirm !== form.password) e.confirm = "Passwords do not match";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await register({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        password: form.password,
      });
      if (res.token && res.user) {
        setSession(res);
        toast.success("Account created");
        navigate("/", { replace: true });
      } else {
        toast.success("Account created, please sign in");
        navigate("/login", { replace: true });
      }
    } catch (err) {
      toast.error(errMsg(err));
    } finally {
      setLoading(false);
    }
  };

  // one input row (a function that returns JSX, so typing never loses focus)
  const field = (name, label, Icon, props = {}, withEye = false) => (
    <div className="auth-field">
      <label htmlFor={name}>{label}</label>
      <div className={`auth-input ${errors[name] ? "has-error" : ""}`}>
        <Icon size={18} />
        <input id={name} name={name} value={form[name]} onChange={onChange} {...props} />
        {withEye && (
          <button type="button" className="eye" onClick={() => setShow((s) => !s)} aria-label="Show password">
            {show ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      {errors[name] && <small className="auth-error">{errors[name]}</small>}
    </div>
  );

  const s = strength(form.password);
  const pwType = show ? "text" : "password";

  return (
    <div className="auth-page">
      <AuthSide />

      <main className="auth-main">
        <div className="auth-wrap">
          <form className="auth-card" onSubmit={onSubmit} noValidate>
            <span className="auth-badge"><UserPlus size={26} /></span>
            <h2>Create your account</h2>
            <p className="auth-sub">Patient registration takes less than a minute</p>

            {field("name", "Full name", User, { placeholder: "Your full name", autoComplete: "name" })}
            {field("email", "Email", Mail, { type: "email", placeholder: "you@example.com", autoComplete: "email" })}
            {field("phone", "Mobile number (optional)", Phone, {
              placeholder: "10 digit number",
              inputMode: "numeric",
              onChange: (e) => set("phone", digitsOnly(e.target.value, 10)),
            })}
            {field("password", "Password", Lock, { type: pwType, placeholder: `Minimum ${MIN_PASSWORD} characters`, autoComplete: "new-password" }, true)}

            {form.password && (
              <div className="strength" data-level={s.level}>
                <div className="strength-bars"><span /><span /><span /><span /></div>
                <small>{s.label}</small>
              </div>
            )}

            {field("confirm", "Confirm password", Lock, { type: pwType, placeholder: "Repeat the password", autoComplete: "new-password" })}

            <button className="auth-btn" type="submit" disabled={loading}>
              {loading ? (<><span className="btn-spin" /> Creating account...</>) : (<>Create account <ArrowRight size={18} /></>)}
            </button>

            <p className="auth-switch">
              Already have an account? <Link to="/login">Sign in</Link>
            </p>
            <p className="auth-note">Staff accounts are created by the administrator.</p>
          </form>

          <p className="auth-foot">© {new Date().getFullYear()} {HOSPITAL_NAME}</p>
        </div>
      </main>
    </div>
  );
}