import mongoose from "mongoose";
import validator from "validator";


const appointmentSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: [3, "Please enter a valid firstname"],
    },

    lastName: {
        type: String,
        required: false,
        minlength: [3, "Please enter a valid lastname"],
    },

    phone: {
        type: String,
        required: true,
        minlength: [8, "Please phone number must be at least 8 characters long"],
        maxlength: [8, "Please phone number must be at most 8 characters long"],
        validate: [validator.isMobilePhone,]
    },

    CIN: {
        type: String,
        required: true,
        minlength: [8, "Please enter a valid CIN 8 Numbers"],
        maxlength: [8, "Please enter a valid CIN 8 Numbers"],
    },

    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
    dob: {
        type: Date,
        required: true,
        validate: [validator.isDate, "Please enter a valid date"],
    },
    gender: {
        type: String,
        required: true,
        enum: ["Male", "Female"],
    
    },

    appointment_date: {
        type: String,    required: true,
    },
    department: {
        type: String,
        required: true,
        //enum: ["Cardiology", "Dermatology", "Gastroenterology", "Neurology", "Pediatrics", "Psychiatry", "Urology"],
    },
    doctor: {
        firstName: {
            type: String,
            required: true,
        },
        lastName: {
            type: String,
            required: true,
        },
    },
    hasVisited: {
        type: Boolean,
        default: false,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
    },
    address: {
        type: String,
        required: true,
    },
    status: {
        type: String,
        enum: ["Pending", "Accepted", "Rejected"],
        default: "Pending",
    },
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
        required: [true, "Clinic ID is required for appointments"],
    },
});

export const Appointment = mongoose.model("Appointment", appointmentSchema);