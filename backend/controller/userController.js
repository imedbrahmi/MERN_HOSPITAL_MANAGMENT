import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";

import ErrorHandler from "../middelwares/errorMidelware.js";
import { User } from "../models/userSchema.js";
import { Clinic } from "../models/clinicSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";

export const pacientRegister = chatchAsyncErrors(async (req, res, next) => {
    if (!req.body) {
        return next(new ErrorHandler("Request body is missing", 400));
    }
    
    const {firstName, 
           lastName,
           phone, 
           CIN, 
           email, 
           dob, 
           gender, 
           password,
           confirmPassword,
           role 
        } = req.body;
    if(!firstName || !lastName || !phone || !CIN || !email || !dob || !gender || !password || !role) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    let user = await User.findOne({ email });
    if(user){
        return next(new ErrorHandler("User already exist", 400));
    }
    user = await User.create({ firstName, lastName, phone, CIN, email, dob, gender, password, role });
    generateToken(user, "user registered successfully", 200, res);

    });


export const login = chatchAsyncErrors(async (req, res, next) => {
    const { email, password, confirmPassword, role } = req.body;
    if(!email || !password || !role) {
        return next(new ErrorHandler("Please fill all fields", 400));}
    
    if(password !== confirmPassword){
        return next(new ErrorHandler("Password and confirm password are not the same", 400));}

    const user = await User.findOne({ email }).select("+password");
    if(!user){
        return next(new ErrorHandler("invalid email or password", 404));}


    const isPasswordMatched = await user.comparePassword(password);
    if(!isPasswordMatched){
        return next(new ErrorHandler("invalid email or password", 404));}

    // Pour le dashboard, accepter "Admin" si l'utilisateur est Admin ou SuperAdmin
    // Pour le frontend patient, accepter seulement "Patient"
    if(role === "Admin"){
        // Si le frontend envoie "Admin", accepter Admin ou SuperAdmin
        if(user.role !== "Admin" && user.role !== "SuperAdmin"){
            return next(new ErrorHandler("You are not authorized to access this resource", 403));
        }
    } else {
        // Pour les autres rôles (Patient, etc.), vérifier l'exact match
        if(role !== user.role){
            return next(new ErrorHandler("You are not authorized to access this resource", 403));
        }
    }
    generateToken(user, "user Login successfully", 200, res);
});

export const addNewAdmin = chatchAsyncErrors(async (req, res, next) => {
// Seul SuperAdmin peut créer des Admins
if(req.user.role !== "SuperAdmin") {
    return next(new ErrorHandler("Only SuperAdmin can create Admins", 403));
}

const { firstName, lastName, phone, CIN, email, dob, gender, password, clinicId} = req.body;

if(!firstName || !lastName || !phone || !CIN || !email || !dob || !gender || !password) {
    return next(new ErrorHandler("Please fill all fields", 400));
}

const isRegistered = await User.findOne({ email });
if(isRegistered){
    return next(new ErrorHandler(`${isRegistered.role} already exist with this email`, 400));
}

// SuperAdmin peut créer des Admins et leur assigner une clinique
// clinicId est optionnel (peut être assigné plus tard)
const admin = await User.create({ 
    firstName, 
    lastName, 
    phone, 
    CIN, 
    email, 
    dob, 
    gender, 
    password, 
    role: 'Admin',
    clinicId: clinicId || null // clinicId optionnel, peut être assigné via onboarding
});

return res.status(200).json({
    success: true,
    message: "Admin created successfully",
    admin: {
        _id: admin._id,
        firstName: admin.firstName,
        lastName: admin.lastName,
        email: admin.email,
        clinicId: admin.clinicId,
    }
});

})
export const getAllDoctors = chatchAsyncErrors(async (req, res, next) => {
    // Isolation multi-tenant : SuperAdmin voit tous les docteurs, Admin voit seulement ceux de sa clinique
    const query = { role: "Doctor" };
    
    if (req.user.role === "Admin" && req.user.clinicId) {
        // Admin : filtrer par sa clinique
        query.clinicId = req.user.clinicId;
    }
    // SuperAdmin : pas de filtre, voit tous les docteurs
    
    const doctors = await User.find(query);
    res.status(200).json({
        success: true,
        message: "Doctors fetched successfully",
        doctors,
    });
})

// GET /api/v1/user/doctors/clinic/:clinicName - Récupère les docteurs d'une clinique spécifique (public)
export const getDoctorsByClinic = chatchAsyncErrors(async (req, res, next) => {
    const { clinicName } = req.params;
    
    if (!clinicName) {
        return next(new ErrorHandler("Clinic name is required", 400));
    }
    
    // Convertir clinicName en clinicId
    const clinic = await Clinic.findOne({ 
        name: clinicName,
        isActive: true 
    });
    
    if (!clinic) {
        return next(new ErrorHandler(`Clinic "${clinicName}" not found or inactive`, 404));
    }
    
    // Récupérer les docteurs de cette clinique
    const doctors = await User.find({ 
        role: "Doctor",
        clinicId: clinic._id 
    }).select("firstName lastName doctorDepartment");
    
    res.status(200).json({
        success: true,
        message: "Doctors fetched successfully",
        doctors,
    });
})

// GET /api/v1/user/admins/unassigned - Récupère les Admins sans clinicId (pour onboarding)
export const getUnassignedAdmins = chatchAsyncErrors(async (req, res, next) => {
    // Seul SuperAdmin peut voir les Admins non assignés
    if(req.user.role !== "SuperAdmin") {
        return next(new ErrorHandler("Only SuperAdmin can view unassigned admins", 403));
    }
    
    const admins = await User.find({ 
        role: "Admin",
        clinicId: null 
    }).select("firstName lastName email phone");
    
    res.status(200).json({
        success: true,
        message: "Unassigned admins fetched successfully",
        admins,
    });
})

export const getUserDetails = chatchAsyncErrors(async (req, res, next) => {
    const user = req.user
    res.status(200).json({
        success: true,
        message: "User details fetched successfully",
        user,
    });
})

export const logoutAdmin = chatchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("adminToken", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Admin logged out successfully",
    });

})

export const logoutPatient = chatchAsyncErrors(async (req, res, next) => {
    res.status(200).cookie("patientToken", "", {
        expires: new Date(Date.now()),
        httpOnly: true,
    }).json({
        success: true,
        message: "Patient logged out successfully",
    });

})

export const addNewDoctor = chatchAsyncErrors(async (req, res, next) => {
    if(!req.files || Object.keys(req.files).length === 0) {
        return next(new ErrorHandler("Please upload doctor avatar", 400));
    }
    const {docAvatar} = req.files;
    const allowedExtensions = ["image/jpg", "image/jpeg", "image/png", "image/gif", "image/webp"];
    if(!allowedExtensions.includes(docAvatar.mimetype)){
        return next(new ErrorHandler("Please upload a valid image", 400));
    }
    const{firstName, lastName, phone, CIN, email, dob, gender, password, doctorDepartment} = req.body;
    
    // Trim whitespace and check for empty values
    const trimmedFields = {
        firstName: firstName?.trim(),
        lastName: lastName?.trim(),
        phone: phone?.trim(),
        CIN: CIN?.trim(),
        email: email?.trim(),
        dob: dob?.trim(),
        gender: gender?.trim(),
        password: password?.trim(),
        doctorDepartment: doctorDepartment?.trim()
    };
    
    // Check which fields are missing
    const missingFields = [];
    if(!trimmedFields.firstName) missingFields.push('firstName');
    if(!trimmedFields.lastName) missingFields.push('lastName');
    if(!trimmedFields.phone) missingFields.push('phone');
    if(!trimmedFields.CIN) missingFields.push('CIN');
    if(!trimmedFields.email) missingFields.push('email');
    if(!trimmedFields.dob) missingFields.push('dob');
    if(!trimmedFields.gender) missingFields.push('gender');
    if(!trimmedFields.password) missingFields.push('password');
    if(!trimmedFields.doctorDepartment) missingFields.push('doctorDepartment');
    
    if(missingFields.length > 0) {
        return next(new ErrorHandler(`Please fill all fields. Missing: ${missingFields.join(', ')}`, 400));
    }
    const isRegistered = await User.findOne({ email: trimmedFields.email });
    if(isRegistered){
        return next(new ErrorHandler(`${isRegistered.role}  already exist with this email`, 400));
    }
    const cloudinaryResponse = await cloudinary.uploader.upload(docAvatar.tempFilePath);
    if(!cloudinaryResponse || cloudinaryResponse.error){
        return next(new ErrorHandler(cloudinaryResponse?.error?.message || "Failed to upload image to Cloudinary", 500));
    }
    
    // Isolation multi-tenant : assigner automatiquement le clinicId de l'Admin qui crée le docteur
    // SuperAdmin peut créer des docteurs sans clinicId (optionnel), Admin assigne automatiquement sa clinique
    let clinicIdToAssign = null;
    
    if (req.user.role === "Admin") {
        // Admin : doit avoir un clinicId assigné
        if (!req.user.clinicId) {
            return next(new ErrorHandler("You are not assigned to any clinic. Please contact SuperAdmin.", 400));
        }
        clinicIdToAssign = req.user.clinicId;
    } else if (req.user.role === "SuperAdmin") {
        // SuperAdmin : peut spécifier un clinicId ou laisser null
        clinicIdToAssign = req.body.clinicId || null;
    }
    
    const doctor = await User.create({ 
        firstName: trimmedFields.firstName, 
        lastName: trimmedFields.lastName, 
        phone: trimmedFields.phone, 
        CIN: trimmedFields.CIN, 
        email: trimmedFields.email, 
        dob: trimmedFields.dob, 
        gender: trimmedFields.gender,
        password: trimmedFields.password, 
        doctorDepartment: trimmedFields.doctorDepartment,
        role: "Doctor",
        clinicId: clinicIdToAssign,
        docAvatar: {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        } 
    });
    res.status(200).json({
        success: true,
        message: "New Doctor created successfully",
        doctor,
    });
});