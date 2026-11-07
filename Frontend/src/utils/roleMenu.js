import {
  LayoutDashboard, Users, Stethoscope, CalendarCheck, BedDouble, FlaskConical, Pill,
  Receipt, DoorOpen, Clock, BarChart3, UserCog, Settings, HeartPulse, Building2,
} from "lucide-react";

const STAFF = ["admin", "doctor", "nurse", "receptionist"];

export const MENU = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, roles: [...STAFF, "labtech", "pharmacist"] },
  { to: "/portal", label: "My Health", icon: HeartPulse, roles: ["patient"] },
  { to: "/patients", label: "Patients", icon: Users, roles: [...STAFF, "labtech"] },
  { to: "/doctors", label: "Doctors", icon: Stethoscope, roles: STAFF },
  { to: "/appointments", label: "Appointments", icon: CalendarCheck, roles: STAFF },
  { to: "/admissions", label: "Admissions", icon: BedDouble, roles: STAFF },
  { to: "/wards", label: "Wards & Beds", icon: Building2, roles: STAFF },
  { to: "/lab", label: "Laboratory", icon: FlaskConical, roles: ["admin", "doctor", "nurse", "labtech"] },
  { to: "/pharmacy", label: "Pharmacy", icon: Pill, roles: ["admin", "doctor", "nurse", "pharmacist"] },
  { to: "/billing", label: "Billing", icon: Receipt, roles: ["admin", "receptionist"] },
  { to: "/visitors", label: "Visitors", icon: DoorOpen, roles: ["admin", "receptionist", "nurse"] },
  { to: "/attendance", label: "Attendance", icon: Clock, roles: [...STAFF, "labtech", "pharmacist"] },
  { to: "/reports", label: "Reports", icon: BarChart3, roles: ["admin"] },
  { to: "/users", label: "Users", icon: UserCog, roles: ["admin"] },
  { to: "/settings", label: "Settings", icon: Settings, roles: ["admin"] },
];