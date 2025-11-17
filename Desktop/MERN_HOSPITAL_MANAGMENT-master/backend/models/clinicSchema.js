import mongoose from "mongoose";
import validator from "validator";

const clinicSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Clinic name is required"],
        minlength: [3, "Clinic name must be at least 3 characters long"],
        maxlength: [100, "Clinic name must be at most 100 characters long"],
        trim: true,
    },
    address: {
        type: String,
        required: [true, "Clinic address is required"],
        minlength: [10, "Address must be at least 10 characters long"],
        maxlength: [200, "Address must be at most 200 characters long"],
        trim: true,
    },
    phone: {
        type: String,
        required: [true, "Clinic phone number is required"],
        minlength: [8, "Phone number must be at least 8 characters long"],
        maxlength: [15, "Phone number must be at most 15 characters long"],
        validate: [validator.isMobilePhone, "Please enter a valid phone number"],
    },
    email: {
        type: String,
        required: [true, "Clinic email is required"],
        validate: [validator.isEmail, "Please enter a valid email"],
        lowercase: true,
        trim: true,
    },
    services: {
        type: [String],
        default: [],
        // Exemple: ["Cardiology", "Dermatology", "General Medicine"]
    },
    tariff: {
        consultation: {
            type: Number,
            default: 0,
            min: [0, "Consultation tariff cannot be negative"],
        },
        // On pourra ajouter d'autres tarifs plus tard (ex: emergency, specialist)
    },
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Clinic owner is required"],
        // Référence au SuperAdmin ou Admin qui possède la clinique
    },
    isActive: {
        type: Boolean,
        default: true,
    },
}, {
    timestamps: true, // Ajoute automatiquement createdAt et updatedAt
});

// Index pour améliorer les performances de recherche
clinicSchema.index({ ownerId: 1 });
clinicSchema.index({ name: 1 });
clinicSchema.index({ email: 1 }, { unique: true });

export const Clinic = mongoose.model("Clinic", clinicSchema);
export default Clinic;

