import express from "express";
import { getAllClinics, getAllClinicsForAdmin, getClinicById, updateClinic, deleteClinic, onboardClinic } from "../controller/clinicController.js";
import { isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

// Route publique : liste des cliniques actives (pour que les patients puissent choisir)
router.get("/", getAllClinics);

// Route protégée : liste toutes les cliniques (y compris inactives) pour SuperAdmin
router.get("/all", isAuthenticated, requireRole(['SuperAdmin']), getAllClinicsForAdmin);

// Route publique : récupérer une clinique par ID
router.get("/:id", getClinicById);

// Route protégée : onboarding (créer clinique + Admin) (SuperAdmin seulement)
router.post("/onboard", isAuthenticated, requireRole(['SuperAdmin']), onboardClinic);

// Route protégée : mettre à jour une clinique (SuperAdmin seulement)
router.put("/:id", isAuthenticated, requireRole(['SuperAdmin']), updateClinic);

// Route protégée : supprimer une clinique (SuperAdmin seulement)
router.delete("/:id", isAuthenticated, requireRole(['SuperAdmin']), deleteClinic);

export default router;

