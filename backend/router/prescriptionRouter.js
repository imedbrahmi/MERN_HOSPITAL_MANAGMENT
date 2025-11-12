import express from "express";
import {
    createPrescription,
    getPatientPrescriptions,
    getPrescriptionById,
    getDoctorPrescriptions,
    downloadPrescriptionPDF,
} from "../controller/prescriptionController.js";
import { isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

router.post("/create", isAuthenticated, requireRole(['Doctor']), createPrescription);
router.get("/patient/:patientId", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin', 'Patient']), getPatientPrescriptions);
router.get("/doctor/:doctorId", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), getDoctorPrescriptions);
router.get("/:id", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin', 'Patient']), getPrescriptionById);
router.get("/:id/pdf", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin', 'Patient']), downloadPrescriptionPDF);

export default router;

