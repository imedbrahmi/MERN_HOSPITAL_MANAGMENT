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
    origin: [
        "http://localhost:5173",
        "http://localhost:5174", 
        "https://mern-hospital-managment.vercel.app",
        "https://mern-hospital-managment-2q8w.vercel.app"
    ],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["Set-Cookie"],
}));

app.use(cookieParser())

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));

// Handle preflight requests
app.options('*', cors());

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