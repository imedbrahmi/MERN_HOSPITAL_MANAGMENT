import express from "express";
import { postAppointment, getAllAppointments, updateAppointment, deleteAppointment} from "../controller/appointController.js";
import { isPatientAuthenticated, isAdminAuthenticated } from "../middelwares/auth.js";

const router = express.Router();

router.post("/post", isPatientAuthenticated, postAppointment);
router.get("/getAll", isAdminAuthenticated, getAllAppointments);
router.put("/update/:id", isAdminAuthenticated, updateAppointment);
router.delete("/delete/:id", isAdminAuthenticated, deleteAppointment);

export default router;