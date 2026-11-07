
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";

import { useAuth } from "./context/useAuth";
import { ROLES } from "./utils/constants";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/layout/Layout";
import Loader from "./components/common/Loader";

// Laboratory pages
import LabDashboard from "./pages/lab/LabDashboard";
import LabTestList from "./pages/lab/LabTestList";
import LabTestForm from "./pages/lab/LabTestForm";
import LabOrderList from "./pages/lab/LabOrderList";
import LabOrderForm from "./pages/lab/LabOrderForm";
import LabOrderDetail from "./pages/lab/LabOrderDetail";  

const {
  ADMIN,
  DOCTOR,
  NURSE,
  RECEPTIONIST,
  LAB_TECH,
  PHARMACIST,
  PATIENT,
} = ROLES;

const STAFF = [ADMIN, DOCTOR, NURSE, RECEPTIONIST];

// Page loader
const modules = import.meta.glob("./pages/**/*.jsx");

function ComingSoon({ name }) {
  return (
    <div style={{ padding: 40, textAlign: "center" }}>
      <h2>{name}</h2>
      <p className="muted">This page is not built yet.</p>
    </div>
  );
}

const page = (path) => {
  const loader = modules[`./pages/${path}.jsx`];
  return loader ? lazy(loader) : () => <ComingSoon name={path} />;
};

// Authentication
const Login = page("auth/Login");
const Register = page("auth/Register");
const VerifyOTP = page("auth/VerifyOTP");
const ForgotPassword = page("auth/ForgotPassword");
const VerifyResetOTP = page("auth/VerifyResetOTP");
const ResetPassword = page("auth/ResetPassword");
const ChangePassword = page("auth/ChangePassword");

// Dashboard and patients
const Dashboard = page("dashboard/Dashboard");
const PatientList = page("patients/PatientList");
const PatientForm = page("patients/PatientForm");
const PatientDetail = page("patients/PatientDetail");
const PatientHistory = page("patients/PatientHistory");

// Doctors and appointments
const DoctorList = page("doctors/DoctorList");
const DoctorForm = page("doctors/DoctorForm");
const DoctorAvailability = page("doctors/DoctorAvailability");

const AppointmentList = page("appointments/AppointmentList");
const BookAppointment = page("appointments/BookAppointment");
const AppointmentDetail = page("appointments/AppointmentDetail");

// Medical records and prescriptions
const RecordForm = page("records/RecordForm");
const RecordDetail = page("records/RecordDetail");
const PrescriptionForm = page("prescriptions/PrescriptionForm");
const PrescriptionView = page("prescriptions/PrescriptionView");

// Admissions and wards
const AdmissionList = page("admissions/AdmissionList");
const AdmitPatient = page("admissions/AdmitPatient");
const AdmissionDetail = page("admissions/AdmissionDetail");
const TransferBed = page("admissions/TransferBed");
const DischargePatient = page("admissions/DischargePatient");
const DischargeList = page("admissions/DischargeList");

const WardList = page("wards/WardList");
const BedMap = page("wards/BedMap");
const DepartmentList = page("wards/DepartmentList");

// Existing laboratory workflow pages
const CollectSample = page("lab/CollectSample");
const EnterResults = page("lab/EnterResults");
const LabReportView = page("lab/LabReportView");

// Pharmacy and billing
const MedicineList = page("pharmacy/MedicineList");
const MedicineForm = page("pharmacy/MedicineForm");
const Dispense = page("pharmacy/Dispense");
const StockAlerts = page("pharmacy/StockAlerts");

const BillList = lazy(() => import("./billing/BillList.jsx"));
const BillDetail = lazy(() => import("./billing/BillDetail.jsx"));
const AddPayment = lazy(() => import("./billing/AddPayment.jsx"));

// Staff tools
const MyAttendance = page("attendance/MyAttendance");
const AllAttendance = page("attendance/AllAttendance");
const VisitorLog = page("visitors/VisitorLog");
const NotificationList = page("notifications/NotificationList");
const UserList = page("users/UserList");
const UserForm = page("users/UserForm");

// Reports, OPD and emergency
const Reports = lazy(() => import("./reports/Reports.jsx"));

const OPDQueue = page("opd/OPDQueue");
const TokenCounter = page("opd/TokenCounter");
const WaitingDisplay = page("opd/WaitingDisplay");

const EmergencyRegister = page("emergency/EmergencyRegister");
const EmergencyBoard = page("emergency/EmergencyBoard");

// Patient portal
const PortalHome = page("portal/PortalHome");
const MyAppointments = page("portal/MyAppointments");
const MyReports = page("portal/MyReports");
const MyPrescriptions = page("portal/MyPrescriptions");
const MyBills = page("portal/MyBills");

// Profile, settings and errors
const MyProfile = page("profile/MyProfile");
const Settings = page("settings/Settings");
const RolePermissions = page("settings/RolePermissions");

const NotFound = page("errors/NotFound");
const Unauthorized = page("errors/Unauthorized");
const ServerError = page("errors/ServerError");

// Home page
function Home() {
  const { user } = useAuth();

  return user?.role === PATIENT
    ? <Navigate to="/portal" replace />
    : <Dashboard />;
}

export default function App() {
  return (
    <Suspense fallback={<Loader />}>
      <Routes>

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/verify-otp" element={<VerifyOTP />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/verify-reset-otp" element={<VerifyResetOTP />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />

        {/* Authenticated routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>

            {/* General */}
            <Route path="/" element={<Home />} />
            <Route path="/dashboard" element={<Navigate to="/" replace />} />
            <Route path="/profile" element={<MyProfile />} />
            <Route path="/profile/password" element={<ChangePassword />} />
            <Route path="/notifications" element={<NotificationList />} />
            <Route path="/attendance" element={<MyAttendance />} />
            <Route path="/unauthorized" element={<Unauthorized />} />
            <Route path="/server-error" element={<ServerError />} />

            {/* Patient portal */}
            <Route element={<ProtectedRoute roles={[PATIENT]} />}>
              <Route path="/portal" element={<PortalHome />} />
              <Route path="/portal/appointments" element={<MyAppointments />} />
              <Route path="/portal/reports" element={<MyReports />} />
              <Route path="/portal/prescriptions" element={<MyPrescriptions />} />
              <Route path="/portal/bills" element={<MyBills />} />
            </Route>

            {/* Patients */}
            <Route element={<ProtectedRoute roles={[...STAFF, LAB_TECH]} />}>
              <Route path="/patients" element={<PatientList />} />
              <Route path="/patients/:id" element={<PatientDetail />} />
              <Route path="/patients/:id/history" element={<PatientHistory />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, RECEPTIONIST, NURSE, DOCTOR]} />}>
              <Route path="/patients/new" element={<PatientForm />} />
              <Route path="/patients/:id/edit" element={<PatientForm />} />
            </Route>

            {/* Doctors */}
            <Route element={<ProtectedRoute roles={STAFF} />}>
              <Route path="/doctors" element={<DoctorList />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN]} />}>
              <Route path="/doctors/new" element={<DoctorForm />} />
              <Route path="/doctors/:id/edit" element={<DoctorForm />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR, RECEPTIONIST]} />}>
              <Route path="/doctors/:id/availability" element={<DoctorAvailability />} />
            </Route>

            {/* Appointments, OPD and emergency */}
            <Route element={<ProtectedRoute roles={STAFF} />}>
              <Route path="/appointments" element={<AppointmentList />} />
              <Route path="/appointments/new" element={<BookAppointment />} />
              <Route path="/appointments/:id" element={<AppointmentDetail />} />
              <Route path="/opd" element={<OPDQueue />} />
              <Route path="/opd/counter" element={<TokenCounter />} />
              <Route path="/opd/display" element={<WaitingDisplay />} />
              <Route path="/emergency" element={<EmergencyBoard />} />
              <Route path="/emergency/register" element={<EmergencyRegister />} />
            </Route>

            {/* Medical records and prescriptions */}
            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR, NURSE]} />}>
              <Route path="/records/new" element={<RecordForm />} />
              <Route path="/records/:id" element={<RecordDetail />} />
              <Route path="/records/:id/edit" element={<RecordForm />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR]} />}>
              <Route path="/prescriptions/new" element={<PrescriptionForm />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR, NURSE, PHARMACIST]} />}>
              <Route path="/prescriptions/:id" element={<PrescriptionView />} />
            </Route>

            {/* Admissions and wards */}
            <Route element={<ProtectedRoute roles={STAFF} />}>
              <Route path="/admissions" element={<AdmissionList />} />
              <Route path="/admissions/:id" element={<AdmissionDetail />} />
              <Route path="/discharges" element={<DischargeList />} />
              <Route path="/wards" element={<WardList />} />
              <Route path="/wards/beds" element={<BedMap />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR, RECEPTIONIST]} />}>
              <Route path="/admissions/new" element={<AdmitPatient />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR, NURSE]} />}>
              <Route path="/admissions/:id/transfer" element={<TransferBed />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR]} />}>
              <Route path="/admissions/:id/discharge" element={<DischargePatient />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN]} />}>
              <Route path="/departments" element={<DepartmentList />} />
            </Route>

            {/* LABORATORY */}

            {/* Dashboard and orders */}
            <Route element={
              <ProtectedRoute roles={[ADMIN, DOCTOR, NURSE, LAB_TECH]} />
            }>
              <Route path="/lab" element={<LabDashboard />} />
              <Route path="/lab/orders" element={<LabOrderList />} />
              <Route path="/lab/orders/:id" element={<LabOrderDetail />} />
              <Route path="/lab/orders/:id/report" element={<LabReportView />} />
            </Route>

            {/* Test management - Admin only */}
            <Route element={<ProtectedRoute roles={[ADMIN]} />}>
              <Route path="/lab/tests" element={<LabTestList />} />
              <Route path="/lab/tests/new" element={<LabTestForm />} />
              <Route path="/lab/tests/:id/edit" element={<LabTestForm />} />
            </Route>

            {/* Create lab orders */}
            <Route element={
              <ProtectedRoute roles={[ADMIN, DOCTOR]} />
            }>
              <Route path="/lab/orders/new" element={<LabOrderForm />} />
            </Route>

            {/* Sample collection */}
            <Route element={
              <ProtectedRoute roles={[ADMIN, NURSE, LAB_TECH]} />
            }>
              <Route path="/lab/orders/:id/collect" element={<CollectSample />} />
            </Route>

            {/* Enter results */}
            <Route element={
              <ProtectedRoute roles={[ADMIN, LAB_TECH]} />
            }>
              <Route path="/lab/orders/:id/results" element={<EnterResults />} />
            </Route>

            {/* Pharmacy */}
            <Route element={<ProtectedRoute roles={[ADMIN, DOCTOR, NURSE, PHARMACIST]} />}>
              <Route path="/pharmacy" element={<MedicineList />} />
              <Route path="/pharmacy/alerts" element={<StockAlerts />} />
            </Route>

            <Route element={<ProtectedRoute roles={[ADMIN, PHARMACIST]} />}>
              <Route path="/pharmacy/new" element={<MedicineForm />} />
              <Route path="/pharmacy/:id/edit" element={<MedicineForm />} />
              <Route path="/pharmacy/dispense" element={<Dispense />} />
            </Route>

            {/* Billing */}
            <Route element={<ProtectedRoute roles={[ADMIN, RECEPTIONIST]} />}>
              <Route path="/billing" element={<BillList />} />
              <Route path="/billing/:id" element={<BillDetail />} />
              <Route path="/billing/:id/pay" element={<AddPayment />} />
            </Route>

            {/* Visitors */}
            <Route element={<ProtectedRoute roles={[ADMIN, RECEPTIONIST, NURSE]} />}>
              <Route path="/visitors" element={<VisitorLog />} />
            </Route>

            {/* Admin only */}
            <Route element={<ProtectedRoute roles={[ADMIN]} />}>
              <Route path="/attendance/all" element={<AllAttendance />} />

              <Route path="/users" element={<UserList />} />
              <Route path="/users/new" element={<UserForm />} />
              <Route path="/users/:id/edit" element={<UserForm />} />

              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/revenue" element={<Navigate to="/reports?tab=revenue" replace />} />
              <Route path="/reports/patients" element={<Navigate to="/reports?tab=patients" replace />} />
              <Route path="/reports/admissions" element={<Navigate to="/reports?tab=admissions" replace />} />
              <Route path="/reports/lab" element={<Navigate to="/reports?tab=lab" replace />} />
              <Route path="/reports/pharmacy" element={<Navigate to="/reports?tab=pharmacy" replace />} />
              <Route path="/pharmacy" element={<MedicineList />} />

              <Route path="/settings" element={<Settings />} />
              <Route path="/settings/roles" element={<RolePermissions />} />  
            </Route>
          </Route>
        </Route> 
        {/* Not found */}
        <Route path="*" element={<NotFound />} />

      </Routes>
    </Suspense>
  );
}
