import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell, Building2, Check, Database, KeyRound, Monitor, Moon, RotateCcw, Save,
  Settings as CogIcon, ShieldCheck, Sun,
} from "lucide-react";
import toast from "react-hot-toast";
import useDocumentTitle from "../../hooks/useDocumentTitle";
import { useAuth } from "../../context/useAuth";
import { ACCENTS, useTheme } from "../../context/ThemeContext";
import { HOSPITAL_NAME, INDIAN_STATES } from "../../utils/constants";
import { isEmail, isPhone, isPincode } from "../../utils/validators";
import { digitsOnly } from "../../utils/formatId";
import Breadcrumb from "../../components/common/Breadcrumb";
import PageHeader from "../../components/common/PageHeader";
import FormField from "../../components/common/FormField";
import Toggle from "../../components/common/Toggle";

const KEY = "pms-settings";

const DEFAULTS = {
  adminName: "", email: "", phone: "", timezone: "Asia/Kolkata",
  hospitalName: HOSPITAL_NAME, registrationNo: "", hospitalPhone: "", hospitalEmail: "",
  gstin: "", address: "", city: "", state: "", pincode: "",
  notify: { email: true, appointments: true, lab: true, stock: true, admissions: true, daily: false },
  security: { timeout: "30", loginAlerts: true },
  prefs: { dateFormat: "DD MMM YYYY", rowsPerPage: "10", compact: false },
};

const TIMEZONES = [
  { value: "Asia/Kolkata", label: "India Standard Time (IST)" },
  { value: "Asia/Dubai", label: "Gulf Standard Time (GST)" },
  { value: "Asia/Singapore", label: "Singapore Time (SGT)" },
  { value: "Europe/London", label: "London (GMT/BST)" },
  { value: "America/New_York", label: "New York (EST/EDT)" },
  { value: "UTC", label: "Universal Time (UTC)" },
];

const TABS = [
  { key: "general", label: "General", title: "General settings", desc: "Manage your basic account information.", icon: CogIcon },
  { key: "hospital", label: "Hospital profile", title: "Hospital profile", desc: "Details about your hospital.", icon: Building2 },
  { key: "notifications", label: "Notifications", title: "Notifications", desc: "Choose which alerts you want to receive.", icon: Bell },
  { key: "security", label: "Security", title: "Security", desc: "Password and sign-in protection.", icon: ShieldCheck },
  { key: "preferences", label: "System preferences", title: "System preferences", desc: "Appearance, formats and tables.", icon: Database },
];

const NOTIFY = [
  { key: "email", title: "Email notifications", text: "Receive important updates by email." },
  { key: "appointments", title: "Appointment alerts", text: "New bookings, reschedules and cancellations." },
  { key: "lab", title: "Lab results ready", text: "When a lab report is verified. Critical values are always shown." },
  { key: "stock", title: "Low stock and expiry", text: "Medicines that need reordering or are about to expire." },
  { key: "admissions", title: "Admissions and discharges", text: "When a patient is admitted, transferred or discharged." },
  { key: "daily", title: "Daily summary", text: "A short summary of the day, sent each evening." },
];

// which tab holds each field, so a validation error can open the right tab
const FIELD_TAB = {
  adminName: "general", email: "general", phone: "general",
  hospitalName: "hospital", hospitalPhone: "hospital", hospitalEmail: "hospital", pincode: "hospital",
};

const load = (user) => {
  const base = { ...DEFAULTS, adminName: user?.name || "", email: user?.email || "" };
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (!saved) return base;
    return {
      ...base,
      ...saved,
      notify: { ...base.notify, ...saved.notify },
      security: { ...base.security, ...saved.security },
      prefs: { ...base.prefs, ...saved.prefs },
    };
  } catch {
    return base;
  }
};

const validate = (f) => {
  const e = {};
  if (f.adminName.trim().length < 2) e.adminName = "Enter a name";
  if (f.email && !isEmail(f.email)) e.email = "Enter a valid email";
  if (f.phone && !isPhone(f.phone)) e.phone = "Enter a 10 digit mobile number";
  if (f.hospitalName.trim().length < 2) e.hospitalName = "Enter the hospital name";
  if (f.hospitalEmail && !isEmail(f.hospitalEmail)) e.hospitalEmail = "Enter a valid email";
  if (f.hospitalPhone && !/^\d{8,12}$/.test(f.hospitalPhone)) e.hospitalPhone = "Enter 8 to 12 digits";
  if (f.pincode && !isPincode(f.pincode)) e.pincode = "Enter a 6 digit pincode";
  return e;
};

export default function SettingsPage() {
  useDocumentTitle("Settings");
  const { user } = useAuth();
  const theme = useTheme();

  const [tab, setTab] = useState("general");
  const [saved, setSaved] = useState(() => load(user));
  const [form, setForm] = useState(saved);
  const [errors, setErrors] = useState({});

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);
  const current = TABS.find((t) => t.key === tab);
  const CurrentIcon = current.icon;

  const set = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
    setErrors((er) => ({ ...er, [e.target.name]: "" }));
  };
  const setDigitsField = (max) => (e) => set({ target: { name: e.target.name, value: digitsOnly(e.target.value, max) } });
  const setGroup = (group, key, value) => setForm((f) => ({ ...f, [group]: { ...f[group], [key]: value } }));

  const save = () => {
    const errs = validate(form);
    setErrors(errs);
    if (Object.keys(errs).length) {
      toast.error("Please fix the highlighted fields");
      setTab(FIELD_TAB[Object.keys(errs)[0]] || "general");
      return;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(form));
    } catch {
      toast.error("This browser blocked saving");
      return;
    }
    setSaved(form);
    toast.success("Settings saved");
  };

  const discard = () => {
    setForm(saved);
    setErrors({});
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Dashboard", to: "/" }, { label: "Settings" }]} />
      <PageHeader title="Settings" subtitle="Manage your hospital account and system preferences.">
        {dirty && <span className="st-dirty">Unsaved changes</span>}
        <button className="btn btn-primary" onClick={save} disabled={!dirty}>
          <Save size={16} /> Save changes
        </button>
      </PageHeader>

      <div className="st-layout">
        {/* left menu */}
        <nav className="st-menu" aria-label="Settings menu">
          <p className="st-menu-title">Settings menu</p>
          {TABS.map(({ key, label, icon: Icon }) => (
            <button key={key} type="button" className={`st-item ${tab === key ? "active" : ""}`} onClick={() => setTab(key)}>
              <span className="st-item-ico"><Icon size={18} /></span>
              {label}
            </button>
          ))}
        </nav>

        {/* right panel */}
        <section className="st-panel">
          <header className="st-panel-head">
            <span className="st-head-ico"><CurrentIcon size={22} /></span>
            <div>
              <h2>{current.title}</h2>
              <p>{current.desc}</p>
            </div>
          </header>

          <div className="st-body">
            {tab === "general" && (
              <div className="form-grid">
                <FormField label="Administrator name" name="adminName" value={form.adminName} onChange={set} error={errors.adminName} required />
                <FormField label="Email address" name="email" type="email" value={form.email} onChange={set} error={errors.email} />
                <FormField label="Phone number" name="phone" inputMode="numeric" placeholder="10 digit number" value={form.phone} onChange={setDigitsField(10)} error={errors.phone} />
                <FormField as="select" label="Time zone" name="timezone" value={form.timezone} onChange={set} options={TIMEZONES} />
              </div>
            )}

            {tab === "hospital" && (
              <>
                <p className="st-note">
                  Saved on this device. Invoices read the hospital name, address, GSTIN and UPI ID from <code>utils/constants.js</code> for now.
                </p>
                <div className="form-grid">
                  <FormField label="Hospital name" name="hospitalName" value={form.hospitalName} onChange={set} error={errors.hospitalName} required />
                  <FormField label="Registration number" name="registrationNo" value={form.registrationNo} onChange={set} />
                  <FormField label="Hospital phone" name="hospitalPhone" inputMode="numeric" value={form.hospitalPhone} onChange={setDigitsField(12)} error={errors.hospitalPhone} />
                  <FormField label="Hospital email" name="hospitalEmail" type="email" value={form.hospitalEmail} onChange={set} error={errors.hospitalEmail} />
                  <FormField label="GSTIN" name="gstin" maxLength={15} value={form.gstin} onChange={(e) => set({ target: { name: "gstin", value: e.target.value.toUpperCase() } })} />
                </div>
                <FormField as="textarea" label="Address" name="address" value={form.address} onChange={set} />
                <div className="form-grid">
                  <FormField label="City" name="city" value={form.city} onChange={set} />
                  <FormField as="select" label="State" name="state" value={form.state} onChange={set} options={INDIAN_STATES} />
                  <FormField label="Pincode" name="pincode" inputMode="numeric" value={form.pincode} onChange={setDigitsField(6)} error={errors.pincode} />
                </div>
              </>
            )}

            {tab === "notifications" &&
              NOTIFY.map((n) => (
                <div className="st-row" key={n.key}>
                  <div>
                    <h4>{n.title}</h4>
                    <p>{n.text}</p>
                  </div>
                  <Toggle label={n.title} checked={form.notify[n.key]} onChange={(v) => setGroup("notify", n.key, v)} />
                </div>
              ))}

            {tab === "security" && (
              <>
                <div className="st-row">
                  <div>
                    <h4>Password</h4>
                    <p>Change the password you use to sign in.</p>
                  </div>
                  <Link to="/profile/password" className="btn btn-outline">
                    <KeyRound size={16} /> Change password
                  </Link>
                </div>
                <div className="st-row">
                  <div>
                    <h4>Sign-in alerts</h4>
                    <p>Get an email when your account signs in from a new place.</p>
                  </div>
                  <Toggle label="Sign-in alerts" checked={form.security.loginAlerts} onChange={(v) => setGroup("security", "loginAlerts", v)} />
                </div>
                <div className="st-row">
                  <div>
                    <h4>Auto logout</h4>
                    <p>Sign out after this long without activity.</p>
                  </div>
                  <div className="st-row-control">
                    <FormField
                      as="select"
                      name="timeout"
                      value={form.security.timeout}
                      onChange={(e) => setGroup("security", "timeout", e.target.value)}
                      options={[
                        { value: "15", label: "15 minutes" },
                        { value: "30", label: "30 minutes" },
                        { value: "60", label: "1 hour" },
                        { value: "0", label: "Never" },
                      ]}
                    />
                  </div>
                </div>
              </>
            )}

            {tab === "preferences" && (
              <>
                <h3 className="st-sub">Appearance (applies immediately)</h3>
                <div className="theme-modes st-theme-modes">
                  {[
                    { key: "light", label: "Light", icon: Sun },
                    { key: "dark", label: "Dark", icon: Moon },
                    { key: "system", label: "System", icon: Monitor },
                  ].map(({ key, label, icon: Icon }) => (
                    <button key={key} type="button" className={`theme-mode ${theme.mode === key ? "active" : ""}`} onClick={() => theme.setMode(key)}>
                      <Icon size={20} />
                      {label}
                    </button>
                  ))}
                </div>
                <div className="theme-accents">
                  {ACCENTS.map((a) => (
                    <button
                      key={a.key}
                      type="button"
                      title={a.label}
                      aria-label={a.label}
                      className={`theme-swatch ${theme.accent.key === a.key ? "active" : ""}`}
                      style={{ background: a.hex }}
                      onClick={() => theme.setAccent(a.key)}
                    >
                      {theme.accent.key === a.key && <Check size={15} />}
                    </button>
                  ))}
                </div>

                <h3 className="st-sub" style={{ marginTop: 26 }}>Formats and tables</h3>
                <div className="form-grid">
                  <FormField
                    as="select"
                    label="Date format"
                    name="dateFormat"
                    value={form.prefs.dateFormat}
                    onChange={(e) => setGroup("prefs", "dateFormat", e.target.value)}
                    options={["DD MMM YYYY", "DD/MM/YYYY", "MM/DD/YYYY", "YYYY-MM-DD"]}
                  />
                  <FormField
                    as="select"
                    label="Rows per page"
                    name="rowsPerPage"
                    value={form.prefs.rowsPerPage}
                    onChange={(e) => setGroup("prefs", "rowsPerPage", e.target.value)}
                    options={["10", "20", "50"]}
                  />
                </div>
                <div className="st-row">
                  <div>
                    <h4>Compact tables</h4>
                    <p>Smaller row height so more records fit on screen.</p>
                  </div>
                  <Toggle label="Compact tables" checked={form.prefs.compact} onChange={(v) => setGroup("prefs", "compact", v)} />
                </div>
              </>
            )}
          </div>

          {dirty && (
            <footer className="st-foot">
              <span>You have unsaved changes.</span>
              <button className="btn btn-outline" onClick={discard}>
                <RotateCcw size={15} /> Discard
              </button>
              <button className="btn btn-primary" onClick={save}>
                <Save size={15} /> Save settings
              </button>
            </footer>
          )}
        </section>
      </div>
    </>
  );
}