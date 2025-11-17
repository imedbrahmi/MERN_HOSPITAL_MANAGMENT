import mongoose from "mongoose";

const scheduleSchema = new mongoose.Schema({
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Doctor ID is required"],
    },
    dayOfWeek: {
        type: String,
        required: false, // Optionnel si date est fourni
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
    },
    date: {
        type: Date,
        required: false, // Optionnel si dayOfWeek est fourni (pour rétrocompatibilité)
        // Format: YYYY-MM-DD (date spécifique)
    },
    startTime: {
        type: String,
        required: true,
        // Format: "HH:MM" (ex: "09:00")
        validate: {
            validator: function(v) {
                return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "Start time must be in HH:MM format"
        }
    },
    endTime: {
        type: String,
        required: true,
        // Format: "HH:MM" (ex: "17:00")
        validate: {
            validator: function(v) {
                return /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/.test(v);
            },
            message: "End time must be in HH:MM format"
        }
    },
    duration: {
        type: Number,
        required: true,
        default: 30, // Durée d'un rendez-vous en minutes
        min: [15, "Duration must be at least 15 minutes"],
        max: [120, "Duration must be at most 120 minutes"],
    },
    isAvailable: {
        type: Boolean,
        default: true,
    },
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
        required: [true, "Clinic ID is required"],
    },
}, {
    timestamps: true,
});

// Validation : au moins dayOfWeek ou date doit être fourni
scheduleSchema.pre('validate', function(next) {
    if (!this.dayOfWeek && !this.date) {
        return next(new Error('Either dayOfWeek or date must be provided'));
    }
    next();
});

// Index pour améliorer les performances
scheduleSchema.index({ doctorId: 1, dayOfWeek: 1 });
scheduleSchema.index({ doctorId: 1, date: 1 });
scheduleSchema.index({ clinicId: 1 });

export const Schedule = mongoose.model("Schedule", scheduleSchema);

