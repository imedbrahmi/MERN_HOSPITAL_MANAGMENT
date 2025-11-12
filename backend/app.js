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
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
})
);

app.use(cookieParser())

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: "/tmp/",
}));

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