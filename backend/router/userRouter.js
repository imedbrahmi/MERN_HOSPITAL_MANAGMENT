import express from "express";
import { pacientRegister, login, addNewAdmin, addNewReceptionist, getAllDoctors, getDoctorsByClinic, getAllPatients, getUserDetails, logoutAdmin, logoutPatient, addNewDoctor, getUnassignedAdmins, updateDoctor, deleteDoctor, getPatientById, updatePatient, deletePatient } 
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
router.get("/patient/:id", isAdminAuthenticated, getPatientById); // Détails d'un patient
router.put("/patient/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin', 'Receptionist']), updatePatient); // Modifier un patient
router.delete("/patient/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin', 'Receptionist']), deletePatient); // Supprimer un patient
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);
router.post("/doctor/addnew", isAdminAuthenticated, addNewDoctor);
router.put("/doctor/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin']), updateDoctor); // Modifier un doctor
router.delete("/doctor/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin']), deleteDoctor); // Supprimer un doctor

export default router;