const express = require("express");
const dotenv = require("dotenv");
const cors = require("cors");
const connectDB = require("./config/db"); 
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000; 

const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const admissionRoutes = require("./routes/admissionRoutes");
const wardRoutes = require("./routes/wardRoutes");
const bedRoutes = require("./routes/bedRoutes");
const departmentRoutes = require("./routes/departmentRoutes");
const visitorRoutes = require("./routes/visitorRoutes");
const billingRoutes = require("./routes/billingRoutes");
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const patientRoutes = require("./routes/patientRoutes");  
const doctorRoutes = require("./routes/doctorRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const dischargeRoutes = require("./routes/dischargeRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");  





app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173"
}));
app.use(express.json());
app.get("/", (req, res) => {
    res.send("Patient Management System API is running!");
});
app.get("/favicon.ico", (req, res) => {
    res.status(204).end();
});
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/admissions", admissionRoutes);
app.use("/api/wards", wardRoutes);
app.use("/api/beds", bedRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/visitors", visitorRoutes); 
app.use("/api/billing", billingRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/discharge", dischargeRoutes);
app.use("/api/records", medicalRecordRoutes);
app.use("/api/lab", require("./routes/labRoutes"));
app.use("/api/reports", require("./routes/reportRoutes"));
app.use("/api/invoices", require("./routes/invoiceRoutes"));
app.use(notFound);
app.use(errorHandler);   
app.use("/api/wards", require("./routes/wardRoutes"));
app.use("/api/beds", require("./routes/bedRoutes"));
const startServer = async () => {
    await connectDB();

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
};

startServer();