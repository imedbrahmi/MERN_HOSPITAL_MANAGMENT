import express from "express";
import { pacientRegister, login, addNewAdmin, addNewReceptionist, getAllDoctors, getDoctorsByClinic, getAllPatients, getUserDetails, logoutAdmin, logoutPatient, addNewDoctor, getUnassignedAdmins } 
from "../controller/userController.js";
import { isAdminAuthenticated, isPatientAuthenticated, isAuthenticated, requireRole } from "../middelwares/auth.js";



const router = express.Router();

router.post("/patient/register", pacientRegister);
router.post("/login", login);
router.post("/admin/addnew", isAuthenticated, requireRole(['SuperAdmin']), addNewAdmin);
router.post("/receptionist/addnew", isAuthenticated, requireRole(['Admin', 'SuperAdmin']), addNewReceptionist);
router.get("/admins/unassigned", isAuthenticated, requireRole(['SuperAdmin']), getUnassignedAdmins);
router.get("/doctors", isAdminAuthenticated, getAllDoctors);
router.get("/doctors/clinic/:clinicName", getDoctorsByClinic); // Public endpoint pour le frontend
router.get("/patients", isAdminAuthenticated, getAllPatients); // Admin, Receptionist et SuperAdmin peuvent voir les patients
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);
router.post("/doctor/addnew", isAdminAuthenticated, addNewDoctor);

export default router;