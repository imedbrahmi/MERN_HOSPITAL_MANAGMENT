import mongoose from "mongoose";
import validator from "validator";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
const userSchema = new mongoose.Schema({
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
    password: {
        type: String,
        required: true,
        minlength: [8, "Please enter a valid password at least 8 characters long"],
        select: false,
       
    
    
    },
    role: {
        type: String,
        required: true,
        enum: ["SuperAdmin", "Admin", "Patient", "Doctor", "Receptionist"],
    },
    doctorDepartment: {
        type: String,
        //required: false,
        //enum: ["Cardiology", "Dermatology", "Gastroenterology", "Neurology", "Pediatrics", "Psychiatry", "Urology"],
    },
    docAvatar: {
        public_id: String,
        url: String,
        //  default: "https://via.placeholder.com/150",
    },
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
        // Optionnel pour SuperAdmin, requis pour les autres rôles
        required: false,
    },
});

// Hook pour hasher le password avant sauvegarde
userSchema.pre("save", async function(next){
    // Hasher le password seulement s'il a été modifié
    if(!this.isModified("password")){
        return next();
    }
    this.password = await bcrypt.hash(this.password, 10);
    next();
});

// Validation conditionnelle : clinicId requis pour Doctor et Receptionist, optionnel pour SuperAdmin, Admin et Patient
// Les Admins peuvent être créés sans clinicId et assignés plus tard via onboarding
// Les Patients n'ont pas besoin de clinicId car ils peuvent prendre rendez-vous dans différentes cliniques
userSchema.pre("validate", async function(next) {
    // Si le rôle est Doctor ou Receptionist et que clinicId n'est pas fourni (seulement à la création)
    if (this.isNew && (this.role === "Doctor" || this.role === "Receptionist") && !this.clinicId) {
        return next(new Error("clinicId is required for Doctor and Receptionist roles"));
    }
    next();
});

userSchema.methods.comparePassword = async function(enteredPassword){
    return await bcrypt.compare(enteredPassword, this.password);
};

userSchema.methods.generateJsonWebToken = function(){
    return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY,
         { expiresIn: process.env.JWT_EXPIRES }, { algorithm: "HS256" });
};
export const User = mongoose.model("User", userSchema);

