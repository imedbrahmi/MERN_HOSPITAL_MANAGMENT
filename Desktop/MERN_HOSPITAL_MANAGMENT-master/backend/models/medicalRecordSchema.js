import mongoose from "mongoose";

const medicalRecordSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Patient ID is required"],
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Doctor ID is required"],
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        // Optionnel, car un dossier peut être créé indépendamment d'un appointment
    },
    visitDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    diagnosis: {
        type: String,
        required: true,
        minlength: [3, "Diagnosis must be at least 3 characters long"],
        maxlength: [500, "Diagnosis must be at most 500 characters long"],
    },
    symptoms: {
        type: String,
        required: false,
        maxlength: [1000, "Symptoms must be at most 1000 characters long"],
    },
    examination: {
        type: String,
        required: false,
        maxlength: [1000, "Examination notes must be at most 1000 characters long"],
    },
    treatment: {
        type: String,
        required: false,
        maxlength: [1000, "Treatment notes must be at most 1000 characters long"],
    },
    notes: {
        type: String,
        required: false,
        maxlength: [2000, "Notes must be at most 2000 characters long"],
    },
    vitalSigns: {
        bloodPressure: String, // Ex: "120/80"
        heartRate: Number, // BPM
        temperature: Number, // Celsius
        weight: Number, // kg
        height: Number, // cm
    },
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
        required: [true, "Clinic ID is required"],
    },
}, {
    timestamps: true,
});

// Index pour améliorer les performances
medicalRecordSchema.index({ patientId: 1 });
medicalRecordSchema.index({ doctorId: 1 });
medicalRecordSchema.index({ clinicId: 1 });
medicalRecordSchema.index({ visitDate: -1 }); // Pour trier par date décroissante

export const MedicalRecord = mongoose.model("MedicalRecord", medicalRecordSchema);

