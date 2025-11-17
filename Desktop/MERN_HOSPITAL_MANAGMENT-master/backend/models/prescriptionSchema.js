import mongoose from "mongoose";

const medicationSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        minlength: [2, "Medication name must be at least 2 characters long"],
    },
    dosage: {
        type: String,
        required: true,
        // Ex: "500mg", "1 tablet", "10ml"
    },
    frequency: {
        type: String,
        required: true,
        // Ex: "3 times a day", "Once daily", "Every 8 hours"
    },
    duration: {
        type: String,
        required: true,
        // Ex: "7 days", "2 weeks", "1 month"
    },
    instructions: {
        type: String,
        required: false,
        // Ex: "Take with food", "Before meals"
    },
}, { _id: false });

const prescriptionSchema = new mongoose.Schema({
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
        // Optionnel
    },
    medicalRecordId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MedicalRecord",
        // Optionnel
    },
    prescriptionDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    medications: {
        type: [medicationSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: "At least one medication is required"
        }
    },
    notes: {
        type: String,
        required: false,
        maxlength: [500, "Notes must be at most 500 characters long"],
    },
    pdfUrl: {
        type: String,
        required: false,
        // URL du PDF généré
    },
    pdfPublicId: {
        type: String,
        required: false,
        // Public ID Cloudinary pour le PDF
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
prescriptionSchema.index({ patientId: 1 });
prescriptionSchema.index({ doctorId: 1 });
prescriptionSchema.index({ clinicId: 1 });
prescriptionSchema.index({ prescriptionDate: -1 });

export const Prescription = mongoose.model("Prescription", prescriptionSchema);

