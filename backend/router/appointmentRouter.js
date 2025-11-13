import express from "express";
import { postAppointment, getAllAppointments, getMyAppointments, updateAppointment, deleteAppointment} from "../controller/appointController.js";
import { isPatientAuthenticated, isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

// Permettre aux patients ET aux réceptionnistes/admins de créer des appointments
router.post("/post", isAuthenticated, requireRole(['Patient', 'Admin', 'Receptionist']), postAppointment);
router.get("/getAll", isAuthenticated, requireRole(['SuperAdmin', 'Admin', 'Doctor', 'Receptionist']), getAllAppointments);
router.get("/patient/my-appointments", isPatientAuthenticated, getMyAppointments);
router.put("/update/:id", isAuthenticated, requireRole(['SuperAdmin', 'Admin', 'Doctor', 'Receptionist', 'Patient']), updateAppointment);
router.delete("/delete/:id", isAuthenticated, requireRole(['SuperAdmin', 'Admin', 'Patient']), deleteAppointment);

export default router;