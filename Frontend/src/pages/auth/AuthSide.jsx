import {
  Activity,
  BedDouble,
  CalendarCheck,
  Clock,
  FlaskConical,
  PhoneCall,
  Pill,
  Receipt,
  Users,
} from "lucide-react";
import { HELPLINE, HOSPITAL_NAME, SERVICE_HOURS } from "../../utils/constants";

const MODULES = [
  { icon: Users, label: "Patients" },
  { icon: CalendarCheck, label: "Appointments" },
  { icon: BedDouble, label: "Admissions" },
  { icon: FlaskConical, label: "Laboratory" },
  { icon: Pill, label: "Pharmacy" },
  { icon: Receipt, label: "Billing" },
];

export default function AuthSide() {
  return (
    <aside className="auth-side">
      {/* background decoration */}
      <span className="orb orb-1" />
      <span className="orb orb-2" />
      <span className="orb orb-3" />
      {[1, 2, 3, 4, 5, 6].map((n) => (
        <span key={n} className={`plus p${n}`} aria-hidden="true" />
      ))}

      <div className="auth-center">
        {/* open 24 x 7 badge */}
        <span className="service-pill">
          <i className="live-dot" />
          Open {SERVICE_HOURS}
        </span>

        <div className="logo-wrap">
          <span className="ring r1" />
          <span className="ring r2" />
          <span className="auth-logo">
            <Activity size={42} />
          </span>
        </div>

        <h1 className="auth-title">{HOSPITAL_NAME}</h1>

        <svg className="ecg auth-hide-sm" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
          <path
            className="ecg-base"
            d="M0 30 H110 L125 30 L135 8 L150 52 L162 18 L172 30 H260 L272 30 L282 10 L296 50 L306 30 H400"
          />
          <path
            className="ecg-live"
            pathLength="520"
            d="M0 30 H110 L125 30 L135 8 L150 52 L162 18 L172 30 H260 L272 30 L282 10 L296 50 L306 30 H400"
          />
        </svg>

        {/* 24 x 7 service card */}
        <div className="service-card auth-hide-sm">
          <span className="service-icon">
            <Clock size={26} />
          </span>
          <div className="service-text">
            <strong>{SERVICE_HOURS} Service</strong>
            <span>Emergency and patient care, round the clock</span>
          </div>
        </div>

        {/* helpline button (only shown when HELPLINE is filled in) */}
        {HELPLINE && (
          <a className="helpline auth-hide-sm" href={`tel:${HELPLINE.replace(/\s/g, "")}`}>
            <PhoneCall size={16} /> Helpline {HELPLINE}
          </a>
        )}

        <div className="module-grid auth-hide-sm">
          {MODULES.map(({ icon: Icon, label }) => (
            <div className="module-tile" key={label}>
              <span className="module-icon">
                <Icon size={20} />
              </span>
              <span className="module-label">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </aside>
  );
}