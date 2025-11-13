import express from "express";
import { pacientRegister, login, addNewAdmin, addNewReceptionist, getAllDoctors, getDoctorsByClinic, getAllPatients, getUserDetails, logoutAdmin, logoutPatient, addNewDoctor, getUnassignedAdmins, updateDoctor, deleteDoctor, getPatientById, updatePatient, deletePatient } 
from "../controller/userController.js";
import { isAdminAuthenticated, isPatientAuthenticated, isAuthenticated, requireRole } from "../middelwares/auth.js";



const router = express.Router();

// Route pour enregistrer un patient : accessible publiquement (pour auto-inscription) ou avec authentification (pour admin/réceptionniste)
// L'authentification est optionnelle - vérifiée dans le contrôleur
router.post("/patient/register", async (req, res, next) => {
    // Essayer d'authentifier, mais ne pas échouer si non authentifié (pour auto-inscription)
    const adminToken = req.cookies.adminToken;
    const patientToken = req.cookies.patientToken;
    
    if (adminToken || patientToken) {
        // Si un token existe, authentifier l'utilisateur
        try {
            const jwt = (await import("jsonwebtoken")).default;
            const { User } = await import("../models/userSchema.js");
            const token = adminToken || patientToken;
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.user = await User.findById(decoded.id);
            if (!req.user) {
                req.user = null;
            }
        } catch (error) {
            // Si l'authentification échoue, continuer sans utilisateur (auto-inscription)
            req.user = null;
        }
    } else {
        // Si pas de token, continuer sans authentification (auto-inscription)
        req.user = null;
    }
    next();
}, pacientRegister);
router.post("/login", login);
router.post("/admin/addnew", isAuthenticated, requireRole(['SuperAdmin']), addNewAdmin);
router.post("/receptionist/addnew", isAuthenticated, requireRole(['Admin', 'SuperAdmin']), addNewReceptionist);
router.get("/admins/unassigned", isAuthenticated, requireRole(['SuperAdmin']), getUnassignedAdmins);
router.get("/doctors", isAdminAuthenticated, getAllDoctors);
router.get("/doctors/clinic/:clinicName", getDoctorsByClinic); // Public endpoint pour le frontend
router.get("/patients", isAdminAuthenticated, getAllPatients); // Admin, Receptionist et SuperAdmin peuvent voir les patients

// IMPORTANT: Les routes spécifiques (comme /me) doivent être définies AVANT les routes paramétrées (comme /:id)
// Sinon Express va matcher /patient/me avec /patient/:id et traiter "me" comme un paramètre
router.get("/admin/me", isAdminAuthenticated, getUserDetails);
router.get("/patient/me", isPatientAuthenticated, getUserDetails);

router.get("/patient/:id", isAdminAuthenticated, getPatientById); // Détails d'un patient
router.put("/patient/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin', 'Receptionist']), updatePatient); // Modifier un patient
router.delete("/patient/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin', 'Receptionist']), deletePatient); // Supprimer un patient
router.get("/admin/logout", isAdminAuthenticated, logoutAdmin);
router.get("/patient/logout", isPatientAuthenticated, logoutPatient);
router.post("/doctor/addnew", isAdminAuthenticated, addNewDoctor);
router.put("/doctor/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin']), updateDoctor); // Modifier un doctor
router.delete("/doctor/:id", isAdminAuthenticated, requireRole(['Admin', 'SuperAdmin']), deleteDoctor); // Supprimer un doctor

export default router;