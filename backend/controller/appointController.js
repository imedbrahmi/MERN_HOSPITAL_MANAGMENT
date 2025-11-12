import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import { isPatientAuthenticated ,isAdminAuthenticated} from "../middelwares/auth.js";
import { getClinicIdByName } from "./clinicController.js";

export const postAppointment = chatchAsyncErrors(async (req, res, next) => {
    const { firstName, lastName, phone, CIN, email,
           dob, gender, appointment_date, department, 
           doctor_firstName, doctor_lastName,
           hasVisited, address, clinicName,
         } = req.body;

        if(!firstName || !lastName || !phone || !CIN || !email ||
               !dob || !gender || !appointment_date || !department ||
                !doctor_firstName || !doctor_lastName
               || !address || !clinicName) {
        return next(new ErrorHandler("Please fill all fields (including clinicName)", 400));
        }
    
    // Convertir clinicName en clinicId
    const clinicId = await getClinicIdByName(clinicName, next);
    if (!clinicId) return; // Erreur déjà gérée dans getClinicIdByName
    
    const isConfict = await User.find({
         firstName: doctor_firstName,
         role: "Doctor",
         doctorDepartment: department,
         clinicId: clinicId, // Vérifier que le docteur appartient à la même clinique
         });
        if (isConfict.length === 0) {
            return next(new ErrorHandler("Doctor not found in this clinic", 400));
        }
        if (isConfict.length > 1) {
            return next(new ErrorHandler("Conflict: Multiple doctors found", 400));
        }
    const doctorId = isConfict[0]._id;
    const patientId = req.user._id;
    const appointment = await Appointment.create({
        firstName,
        lastName,
        phone,
        CIN,
        email,
        dob,
        gender,
        appointment_date,
        department,
        doctor: {
            firstName: doctor_firstName,
            lastName: doctor_lastName,
        },
        doctorId,
        patientId,
        address,
        clinicId,
    })
    res.status(200).json({
        success: true,
        message: "Appointment created successfully",
        appointment,
    });
});
export const getAllAppointments = chatchAsyncErrors(async (req, res, next) => {
    // Isolation multi-tenant : SuperAdmin voit tous les rendez-vous, Admin/Receptionist voit seulement ceux de sa clinique, Doctor voit seulement les siens
    const query = {};
    
    if (req.user.role === "Doctor") {
        // Doctor : voir uniquement ses propres rendez-vous
        query.doctorId = req.user._id;
    } else if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        // Admin et Receptionist : filtrer par sa clinique
        query.clinicId = req.user.clinicId;
    }
    // SuperAdmin : pas de filtre, voit tous les rendez-vous
    
    const appointments = await Appointment.find(query);
    res.status(200).json({
        success: true,
        message: "All appointments fetched successfully",
        appointments,
    });
});
export const updateAppointment = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment not found", 404));
    }
    
    // Patient peut modifier ses propres appointments (seulement le statut ou la date si Pending)
    if (req.user.role === "Patient") {
        if (appointment.patientId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler("You can only update your own appointments", 403));
        }
        // Patient ne peut modifier que certains champs (date, etc.) et seulement si status est Pending
        if (appointment.status !== "Pending") {
            return next(new ErrorHandler("You can only modify pending appointments", 400));
        }
    }
    // Isolation multi-tenant : Admin/Receptionist ne peut modifier que les rendez-vous de sa clinique, Doctor seulement les siens
    else if (req.user.role === "Doctor") {
        if (appointment.doctorId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler("You are not authorized to update this appointment", 403));
        }
    } else if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (appointment.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You are not authorized to update this appointment", 403));
        }
    }
    // SuperAdmin peut modifier tous les rendez-vous
    
    appointment = await Appointment.findByIdAndUpdate(id, req.body, { 
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });
    res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        appointment,
    });
});

// GET /api/v1/appointment/patient/my-appointments - Récupérer les appointments du patient
export const getMyAppointments = chatchAsyncErrors(async (req, res, next) => {
    // Seul un Patient peut voir ses propres appointments
    if (req.user.role !== "Patient") {
        return next(new ErrorHandler("Only patients can view their appointments", 403));
    }

    const appointments = await Appointment.find({ patientId: req.user._id })
        .populate("doctorId", "firstName lastName doctorDepartment")
        .sort({ appointment_date: -1 });

    res.status(200).json({
        success: true,
        message: "Appointments fetched successfully",
        appointments,
    });
});

export const deleteAppointment = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment not found", 404));
    }
    
    // Patient peut supprimer ses propres appointments
    if (req.user.role === "Patient") {
        if (appointment.patientId.toString() !== req.user._id.toString()) {
            return next(new ErrorHandler("You can only delete your own appointments", 403));
        }
    }
    // Isolation multi-tenant : Admin/Receptionist ne peut supprimer que les rendez-vous de sa clinique
    else if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (appointment.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You are not authorized to delete this appointment", 403));
        }
    }
    // SuperAdmin peut supprimer tous les rendez-vous
    
    await appointment.deleteOne();
    res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
    });
})
