import express from "express";
import {
    createInvoice,
    getPatientInvoices,
    getInvoiceById,
    getAllInvoices,
    addPayment,
    downloadInvoicePDF,
} from "../controller/invoiceController.js";
import { isAuthenticated, requireRole } from "../middelwares/auth.js";

const router = express.Router();

router.post("/create", isAuthenticated, requireRole(['Admin', 'Receptionist', 'SuperAdmin']), createInvoice);
router.get("/", isAuthenticated, requireRole(['Admin', 'Receptionist', 'SuperAdmin']), getAllInvoices);
router.get("/patient/:patientId", isAuthenticated, requireRole(['Admin', 'Receptionist', 'SuperAdmin', 'Patient']), getPatientInvoices);
router.get("/:id", isAuthenticated, requireRole(['Admin', 'Receptionist', 'SuperAdmin', 'Patient']), getInvoiceById);
router.put("/:id/payment", isAuthenticated, requireRole(['Admin', 'Receptionist', 'SuperAdmin']), addPayment);
router.get("/:id/pdf", isAuthenticated, requireRole(['Admin', 'Receptionist', 'SuperAdmin', 'Patient']), downloadInvoicePDF);

export default router;

