import express from "express";
import { config } from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import fileUpload from "express-fileupload";
import { connectDB } from "./database/dbConnection.js";
import messageRouter from "./router/messageRouter.js";
import { errorMidelware } from "./middelwares/errorMidelware.js";
import userRouter from "./router/userRouter.js";
import appointmentRouter from "./router/appointmentRouter.js";
import clinicRouter from "./router/clinicRouter.js";
import scheduleRouter from "./router/scheduleRouter.js";
import medicalRecordRouter from "./router/medicalRecordRouter.js";
import prescriptionRouter from "./router/prescriptionRouter.js";
import invoiceRouter from "./router/invoiceRouter.js";



const app = express();
config({ path: "./config/config.env" });

app.use(cors({
    origin: true, // Allow all origins temporarily
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    exposedHeaders: ["Set-Cookie"],
}));

app.use(cookieParser())

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));



// Health check endpoint for Kubernetes
app.get("/api/v1/health", (req, res) => {
    res.status(200).json({ 
        status: "healthy", 
        timestamp: new Date().toISOString(),
        service: "medflow-backend"
    });
});

// Metrics endpoint for Prometheus
app.get("/api/v1/metrics", (req, res) => {
    // Utiliser process global (disponible dans Node.js)
    const memUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    const uptime = process.uptime();
    
    // Métriques basiques au format Prometheus
    const metrics = [
        `# HELP nodejs_heap_size_total_bytes Process heap size from Node.js`,
        `# TYPE nodejs_heap_size_total_bytes gauge`,
        `nodejs_heap_size_total_bytes ${memUsage.heapTotal}`,
        ``,
        `# HELP nodejs_heap_size_used_bytes Process heap size used from Node.js`,
        `# TYPE nodejs_heap_size_used_bytes gauge`,
        `nodejs_heap_size_used_bytes ${memUsage.heapUsed}`,
        ``,
        `# HELP nodejs_external_memory_bytes Node.js external memory`,
        `# TYPE nodejs_external_memory_bytes gauge`,
        `nodejs_external_memory_bytes ${memUsage.external}`,
        ``,
        `# HELP nodejs_rss_memory_bytes Resident set size`,
        `# TYPE nodejs_rss_memory_bytes gauge`,
        `nodejs_rss_memory_bytes ${memUsage.rss}`,
        ``,
        `# HELP nodejs_cpu_user_seconds_total Total user CPU time spent in seconds`,
        `# TYPE nodejs_cpu_user_seconds_total counter`,
        `nodejs_cpu_user_seconds_total ${cpuUsage.user / 1000000}`,
        ``,
        `# HELP nodejs_cpu_system_seconds_total Total system CPU time spent in seconds`,
        `# TYPE nodejs_cpu_system_seconds_total counter`,
        `nodejs_cpu_system_seconds_total ${cpuUsage.system / 1000000}`,
        ``,
        `# HELP medflow_uptime_seconds Uptime in seconds`,
        `# TYPE medflow_uptime_seconds gauge`,
        `medflow_uptime_seconds ${uptime}`,
        ``,
        `# HELP medflow_http_requests_total Total number of HTTP requests`,
        `# TYPE medflow_http_requests_total counter`,
        `medflow_http_requests_total 0`,
    ].join('\n');
    
    res.set('Content-Type', 'text/plain; version=0.0.4');
    res.send(metrics);
});

// Test endpoint to verify deployment
app.get("/api/v1/test", (req, res) => {
    res.json({ 
        message: "CORS test successful", 
        timestamp: new Date().toISOString(),
        origin: req.headers.origin 
    });
});

app.use("/api/v1/message", messageRouter);
app.use("/api/v1/user", userRouter);
app.use("/api/v1/appointment", appointmentRouter);
app.use("/api/v1/clinics", clinicRouter);
app.use("/api/v1/schedule", scheduleRouter);
app.use("/api/v1/medical-record", medicalRecordRouter);
app.use("/api/v1/prescription", prescriptionRouter);
app.use("/api/v1/invoice", invoiceRouter);

connectDB();

app.use(errorMidelware);
export default app;