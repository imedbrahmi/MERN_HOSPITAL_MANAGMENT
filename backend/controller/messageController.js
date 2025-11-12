import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import { Message } from "../models/messageSchema.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { getClinicIdByName } from "./clinicController.js";

export const sendMessage = chatchAsyncErrors(async (req, res, next) => {
    const { firstName, lastName, phone, message, email, clinicName } = req.body;
    
    if(!firstName || !phone || !message || !email || !clinicName) {
        return next(new ErrorHandler("Please fill all required fields (firstName, phone, message, email, clinicName)", 400));
    }
    
    // Convertir clinicName en clinicId
    const clinicId = await getClinicIdByName(clinicName, next);
    if (!clinicId) return; // Erreur déjà gérée dans getClinicIdByName
    
    await Message.create({ 
        firstName, 
        lastName: lastName || "", 
        phone, 
        message, 
        email,
        clinicId 
    });
    
    res.status(201).json({
        success: true,
        message: "Message sent successfully",
    });
})

export const getAllMessages = chatchAsyncErrors(async (req, res, next) => {
    // Isolation multi-tenant : SuperAdmin voit tous les messages, Admin/Receptionist voit seulement ceux de sa clinique
    const query = {};
    
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        // Admin et Receptionist : filtrer par sa clinique
        query.clinicId = req.user.clinicId;
    }
    // SuperAdmin : pas de filtre, voit tous les messages
    
    const messages = await Message.find(query);
    res.status(200).json({
        success: true,
        messages,
    });
});

