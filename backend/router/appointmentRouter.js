import express from "express";
import { postAppointment, getAllAppointments, getMyAppointments, updateAppointment, deleteAppointment} from "../controller/appointController.js";
import { isPatientAuthenticated, isAdminAuthenticated, isDoctorAuthenticated, isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.get("/getAll", isAuthenticated, requireRole(['SuperAdmin', 'Admin', 'Doctor', 'Receptionist']), getAllAppointments);
router.get("/patient/my-appointments", isPatientAuthenticated, getMyAppointments);
router.put("/update/:id", isAuthenticated, requireRole(['SuperAdmin', 'Admin', 'Doctor', 'Receptionist', 'Patient']), updateAppointment);
router.delete("/delete/:id", isAuthenticated, requireRole(['SuperAdmin', 'Admin', 'Patient']), deleteAppointment);

export default router;