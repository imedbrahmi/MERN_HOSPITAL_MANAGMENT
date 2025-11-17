import express from "express";
import {
    createMedicalRecord,
    getPatientMedicalRecords,
    getMedicalRecordById,
    getDoctorMedicalRecords,
    updateMedicalRecord,
    deleteMedicalRecord,
} from "../controller/medicalRecordController.js";
import { isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

router.post("/create", isAuthenticated, requireRole(['Doctor']), createMedicalRecord);
router.get("/patient/:patientId", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin', 'Patient']), getPatientMedicalRecords);
router.get("/doctor/:doctorId", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), getDoctorMedicalRecords);
router.get("/:id", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin', 'Patient']), getMedicalRecordById);
router.put("/:id", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), updateMedicalRecord);
router.delete("/:id", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), deleteMedicalRecord);

export default router;

