import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { MedicalRecord } from "../models/medicalRecordSchema.js";
import { User } from "../models/userSchema.js";

// POST /api/v1/medical-record/create - Créer un dossier médical (Doctor seulement)
export const createMedicalRecord = chatchAsyncErrors(async (req, res, next) => {
    // Seul un Doctor peut créer un dossier médical
    if (req.user.role !== "Doctor") {
        return next(new ErrorHandler("Only doctors can create medical records", 403));
    }

    const {
        patientId,
        appointmentId,
        visitDate,
        diagnosis,
        symptoms,
        examination,
        treatment,
        notes,
        vitalSigns,
    } = req.body;

    if (!patientId || !diagnosis) {
        return next(new ErrorHandler("Patient ID and diagnosis are required", 400));
    }

    // Vérifier que le patient existe
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "Patient") {
        return next(new ErrorHandler("Patient not found", 404));
    }

    // Vérifier que le docteur a un clinicId
    if (!req.user.clinicId) {
        return next(new ErrorHandler("Doctor must be assigned to a clinic", 400));
    }

    const medicalRecord = await MedicalRecord.create({
        patientId,
        doctorId: req.user._id,
        appointmentId: appointmentId || null,
        visitDate: visitDate || new Date(),
        diagnosis,
        symptoms: symptoms || "",
        examination: examination || "",
        treatment: treatment || "",
        notes: notes || "",
        vitalSigns: vitalSigns || {},
        clinicId: req.user.clinicId,
    });

    res.status(201).json({
        success: true,
        message: "Medical record created successfully",
        medicalRecord,
    });
});

// GET /api/v1/medical-record/patient/:patientId - Dossiers d'un patient
export const getPatientMedicalRecords = chatchAsyncErrors(async (req, res, next) => {
    const { patientId } = req.params;

    // Vérifier les permissions
    if (req.user.role === "Patient" && req.user._id.toString() !== patientId) {
        return next(new ErrorHandler("You can only view your own medical records", 403));
    }

    // Doctor peut voir les dossiers de ses patients
    let query = { patientId };
    if (req.user.role === "Doctor") {
        query.doctorId = req.user._id;
    }

    // Admin/Receptionist peut voir les dossiers des patients de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        query.clinicId = req.user.clinicId;
    }

    const medicalRecords = await MedicalRecord.find(query)
        .populate("doctorId", "firstName lastName doctorDepartment")
        .populate("appointmentId", "appointment_date")
        .sort({ visitDate: -1 });

    res.status(200).json({
        success: true,
        message: "Medical records fetched successfully",
        medicalRecords,
    });
});

// GET /api/v1/medical-record/:id - Détails d'un dossier
export const getMedicalRecordById = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const medicalRecord = await MedicalRecord.findById(id)
        .populate("patientId", "firstName lastName email phone CIN dob gender")
        .populate("doctorId", "firstName lastName doctorDepartment")
        .populate("appointmentId", "appointment_date department");

    if (!medicalRecord) {
        return next(new ErrorHandler("Medical record not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Patient" && medicalRecord.patientId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only view your own medical records", 403));
    }

    if (req.user.role === "Doctor" && medicalRecord.doctorId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only view medical records you created", 403));
    }

    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (medicalRecord.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only view medical records in your clinic", 403));
        }
    }

    res.status(200).json({
        success: true,
        message: "Medical record fetched successfully",
        medicalRecord,
    });
});

// GET /api/v1/medical-record/doctor/:doctorId - Dossiers créés par un docteur
export const getDoctorMedicalRecords = chatchAsyncErrors(async (req, res, next) => {
    const { doctorId } = req.params;

    // Vérifier les permissions
    if (req.user.role === "Doctor" && req.user._id.toString() !== doctorId) {
        return next(new ErrorHandler("You can only view your own medical records", 403));
    }

    // Admin/Receptionist peut voir les dossiers des docteurs de sa clinique
    let query = { doctorId };
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.clinicId?.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only view medical records of doctors in your clinic", 403));
        }
        query.clinicId = req.user.clinicId;
    }

    const medicalRecords = await MedicalRecord.find(query)
        .populate("patientId", "firstName lastName email")
        .populate("appointmentId", "appointment_date")
        .sort({ visitDate: -1 });

    res.status(200).json({
        success: true,
        message: "Medical records fetched successfully",
        medicalRecords,
    });
});

// PUT /api/v1/medical-record/:id - Modifier un dossier médical
export const updateMedicalRecord = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const medicalRecord = await MedicalRecord.findById(id);
    if (!medicalRecord) {
        return next(new ErrorHandler("Medical record not found", 404));
    }

    // Seul le docteur qui a créé le dossier peut le modifier
    if (req.user.role === "Doctor" && medicalRecord.doctorId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only update medical records you created", 403));
    }

    // Admin/Receptionist peut modifier les dossiers de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (medicalRecord.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only update medical records in your clinic", 403));
        }
    }

    const updatedRecord = await MedicalRecord.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    })
        .populate("patientId", "firstName lastName")
        .populate("doctorId", "firstName lastName");

    res.status(200).json({
        success: true,
        message: "Medical record updated successfully",
        medicalRecord: updatedRecord,
    });
});

// DELETE /api/v1/medical-record/:id - Supprimer un dossier médical (optionnel, généralement on ne supprime pas)
export const deleteMedicalRecord = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const medicalRecord = await MedicalRecord.findById(id);
    if (!medicalRecord) {
        return next(new ErrorHandler("Medical record not found", 404));
    }

    // Seul le docteur qui a créé le dossier peut le supprimer
    if (req.user.role === "Doctor" && medicalRecord.doctorId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only delete medical records you created", 403));
    }

    // Admin/Receptionist peut supprimer les dossiers de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (medicalRecord.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only delete medical records in your clinic", 403));
        }
    }

    await medicalRecord.deleteOne();

    res.status(200).json({
        success: true,
        message: "Medical record deleted successfully",
    });
});

