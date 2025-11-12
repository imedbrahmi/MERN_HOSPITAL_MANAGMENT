import express from "express";
import {
    createSchedule,
    getDoctorSchedules,
    getMySchedule,
    getAvailableSlots,
    updateSchedule,
    deleteSchedule,
} from "../controller/scheduleController.js";
import { isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

// Routes pour Doctor
router.post("/create", isAuthenticated, requireRole(['Doctor']), createSchedule);
router.get("/my-schedule", isAuthenticated, requireRole(['Doctor']), getMySchedule);
router.get("/doctor/:doctorId", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), getDoctorSchedules);
router.get("/available/:doctorId", getAvailableSlots); // Public pour le frontend (pas besoin d'authentification)
router.put("/:id", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), updateSchedule);
router.delete("/:id", isAuthenticated, requireRole(['Doctor', 'Admin', 'Receptionist', 'SuperAdmin']), deleteSchedule);

export default router;

