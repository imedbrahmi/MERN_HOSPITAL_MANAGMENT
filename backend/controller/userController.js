import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";

import ErrorHandler from "../middelwares/errorMidelware.js";
import { User } from "../models/userSchema.js";
import { Clinic } from "../models/clinicSchema.js";
import { Appointment } from "../models/appointmentSchema.js";
import { generateToken } from "../utils/jwtToken.js";
import cloudinary from "cloudinary";
import mongoose from "mongoose";

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

    // Pour le dashboard, accepter "Admin" si l'utilisateur est Admin, SuperAdmin, Doctor ou Receptionist
    // Pour le frontend patient, accepter seulement "Patient"
    if(role === "Admin"){
        // Si le frontend envoie "Admin", accepter Admin, SuperAdmin, Doctor ou Receptionist (tous utilisent le dashboard)
        if(user.role !== "Admin" && user.role !== "SuperAdmin" && user.role !== "Doctor" && user.role !== "Receptionist"){
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
});

// POST /api/v1/user/receptionist/addnew - Créer un nouveau Receptionist (Admin/SuperAdmin seulement)
export const addNewReceptionist = chatchAsyncErrors(async (req, res, next) => {
    // Seul Admin et SuperAdmin peuvent créer des Receptionists
    if(req.user.role !== "Admin" && req.user.role !== "SuperAdmin") {
        return next(new ErrorHandler("Only Admin and SuperAdmin can create Receptionists", 403));
    }

    const { firstName, lastName, phone, CIN, email, dob, gender, password, clinicId} = req.body;

    if(!firstName || !lastName || !phone || !CIN || !email || !dob || !gender || !password) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }

    const isRegistered = await User.findOne({ email });
    if(isRegistered){
        return next(new ErrorHandler(`${isRegistered.role} already exist with this email`, 400));
    }

    // Déterminer le clinicId à assigner
    let clinicIdToAssign = null;
    
    if (req.user.role === "Admin") {
        // Admin : assigner automatiquement sa clinique
        if (!req.user.clinicId) {
            return next(new ErrorHandler("You are not assigned to any clinic. Please contact SuperAdmin.", 400));
        }
        clinicIdToAssign = req.user.clinicId;
    } else if (req.user.role === "SuperAdmin") {
        // SuperAdmin : peut spécifier un clinicId ou laisser null
        clinicIdToAssign = clinicId || null;
    }

    const receptionist = await User.create({ 
        firstName, 
        lastName, 
        phone, 
        CIN, 
        email, 
        dob, 
        gender, 
        password, 
        role: 'Receptionist',
        clinicId: clinicIdToAssign
    });

    return res.status(200).json({
        success: true,
        message: "Receptionist created successfully",
        receptionist: {
            _id: receptionist._id,
            firstName: receptionist.firstName,
            lastName: receptionist.lastName,
            email: receptionist.email,
            clinicId: receptionist.clinicId,
        }
    });
})

export const getAllDoctors = chatchAsyncErrors(async (req, res, next) => {
    // Isolation multi-tenant : SuperAdmin voit tous les docteurs, Admin/Receptionist voit seulement ceux de sa clinique
    const query = { 
        role: "Doctor",
        // Filtrer par isActive seulement si défini (pour éviter de ne rien retourner si isActive n'existe pas)
        // On inclut les docteurs où isActive est true OU undefined/null (pour compatibilité)
        $or: [
            { isActive: true },
            { isActive: { $exists: false } },
            { isActive: null }
        ]
    };
    
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        // Admin et Receptionist : filtrer par sa clinique
        query.clinicId = req.user.clinicId;
    }
    // SuperAdmin : pas de filtre clinicId, voit tous les docteurs
    
    // Recherche par nom si fournie
    if (req.query.search) {
        const searchRegex = new RegExp(req.query.search, 'i');
        // Utiliser $and pour combiner les conditions
        query.$and = [
            { $or: [
                { isActive: true },
                { isActive: { $exists: false } },
                { isActive: null }
            ]},
            { $or: [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { doctorDepartment: searchRegex }
            ]}
        ];
        // Supprimer le $or initial car on l'a déplacé dans $and
        delete query.$or;
    }
    
    // Filtre par département si fourni
    if (req.query.department) {
        query.doctorDepartment = req.query.department;
    }
    
    const doctors = await User.find(query).sort({ firstName: 1, lastName: 1 });
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

// GET /api/v1/user/patients - Récupère les patients (avec isolation multi-tenant)
export const getAllPatients = chatchAsyncErrors(async (req, res, next) => {
    // Isolation multi-tenant : SuperAdmin voit tous les patients, Admin/Receptionist voit seulement ceux qui ont des rendez-vous dans sa clinique, Doctor voit seulement ses propres patients
    let patients = [];
    
    if (req.user.role === "SuperAdmin") {
        // SuperAdmin : voir tous les patients directement
        // Inclure les patients où isActive est true OU undefined/null (pour compatibilité)
        const query = { 
            role: "Patient"
        };
        
        // Construire les conditions $or pour isActive
        const isActiveConditions = [
            { isActive: true },
            { isActive: { $exists: false } },
            { isActive: null }
        ];
        
        // Recherche par nom si fournie
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            const searchConditions = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { CIN: searchRegex }
            ];
            // Combiner les conditions avec $and
            query.$and = [
                { $or: isActiveConditions },
                { $or: searchConditions }
            ];
        } else {
            // Pas de recherche, juste les conditions isActive
            query.$or = isActiveConditions;
        }
        
        patients = await User.find(query)
            .select("firstName lastName email phone CIN dob gender")
            .sort({ firstName: 1, lastName: 1 });
    } else {
        // Pour Doctor, Admin, Receptionist : utiliser la logique avec appointments
        let patientIds = [];
        
        if (req.user.role === "Doctor") {
            // Doctor : récupérer les patients qui ont des rendez-vous avec ce docteur
            const appointments = await Appointment.find({ 
                doctorId: req.user._id 
            }).select("patientId").lean();
            
            // Extraire les IDs uniques des patients
            const uniquePatientIds = [...new Set(appointments.map(apt => apt.patientId?.toString()).filter(Boolean))];
            patientIds = uniquePatientIds.map(id => new mongoose.Types.ObjectId(id));
        } else if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
            // Admin et Receptionist : récupérer les patients qui ont des rendez-vous dans sa clinique
            const appointments = await Appointment.find({ 
                clinicId: req.user.clinicId 
            }).select("patientId").lean();
            
            // Extraire les IDs uniques des patients
            const uniquePatientIds = [...new Set(appointments.map(apt => apt.patientId?.toString()).filter(Boolean))];
            patientIds = uniquePatientIds.map(id => new mongoose.Types.ObjectId(id));
        }
        
        // Construire la query
        // Inclure les patients où isActive est true OU undefined/null (pour compatibilité)
        const isActiveConditions = [
            { isActive: true },
            { isActive: { $exists: false } },
            { isActive: null }
        ];
        
        const query = { 
            _id: { $in: patientIds },
            role: "Patient"
        };
        
        // Recherche par nom si fournie
        if (req.query.search) {
            const searchRegex = new RegExp(req.query.search, 'i');
            const searchConditions = [
                { firstName: searchRegex },
                { lastName: searchRegex },
                { email: searchRegex },
                { phone: searchRegex },
                { CIN: searchRegex }
            ];
            // Combiner les conditions avec $and
            query.$and = [
                { $or: isActiveConditions },
                { $or: searchConditions }
            ];
        } else {
            // Pas de recherche, juste les conditions isActive
            query.$or = isActiveConditions;
        }
        
        // Récupérer les patients
        if (patientIds.length > 0) {
            patients = await User.find(query)
                .select("firstName lastName email phone CIN dob gender")
                .sort({ firstName: 1, lastName: 1 });
        }
    }
    
    res.status(200).json({
        success: true,
        message: "Patients fetched successfully",
        patients,
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

// PUT /api/v1/user/doctor/:id - Modifier un Doctor
export const updateDoctor = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let doctor = await User.findById(id);

    if (!doctor || doctor.role !== "Doctor") {
        return next(new ErrorHandler("Doctor not found", 404));
    }

    // Vérification multi-tenant : Admin ne peut modifier que les docteurs de sa clinique
    if (req.user.role === "Admin" && req.user.clinicId) {
        if (doctor.clinicId?.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only update doctors in your clinic", 403));
        }
    }

    // Gestion de la photo si fournie
    if (req.files && req.files.docAvatar) {
        const { docAvatar } = req.files;
        const allowedExtensions = ["image/jpg", "image/jpeg", "image/png", "image/gif", "image/webp"];
        if (!allowedExtensions.includes(docAvatar.mimetype)) {
            return next(new ErrorHandler("Please upload a valid image", 400));
        }

        // Supprimer l'ancienne photo de Cloudinary
        if (doctor.docAvatar?.public_id) {
            await cloudinary.uploader.destroy(doctor.docAvatar.public_id);
        }

        // Uploader la nouvelle photo
        const cloudinaryResponse = await cloudinary.uploader.upload(docAvatar.tempFilePath);
        if (!cloudinaryResponse || cloudinaryResponse.error) {
            return next(new ErrorHandler(cloudinaryResponse?.error?.message || "Failed to upload image to Cloudinary", 500));
        }

        req.body.docAvatar = {
            public_id: cloudinaryResponse.public_id,
            url: cloudinaryResponse.secure_url
        };
    }

    // Vérifier si l'email est modifié et s'il existe déjà
    if (req.body.email && req.body.email !== doctor.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            return next(new ErrorHandler("Email already exists", 400));
        }
    }

    // Mettre à jour le doctor
    doctor = await User.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        message: "Doctor updated successfully",
        doctor,
    });
});

// DELETE /api/v1/user/doctor/:id - Supprimer un Doctor (soft delete)
export const deleteDoctor = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const doctor = await User.findById(id);

    if (!doctor || doctor.role !== "Doctor") {
        return next(new ErrorHandler("Doctor not found", 404));
    }

    // Vérification multi-tenant : Admin ne peut supprimer que les docteurs de sa clinique
    if (req.user.role === "Admin" && req.user.clinicId) {
        if (doctor.clinicId?.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only delete doctors in your clinic", 403));
        }
    }

    // Supprimer la photo de Cloudinary
    if (doctor.docAvatar?.public_id) {
        await cloudinary.uploader.destroy(doctor.docAvatar.public_id);
    }

    // Soft delete : marquer comme inactif
    doctor.isActive = false;
    await doctor.save();

    res.status(200).json({
        success: true,
        message: "Doctor deleted successfully",
    });
});

// GET /api/v1/user/patient/:id - Détails complets d'un Patient
export const getPatientById = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const patient = await User.findById(id);

    if (!patient || patient.role !== "Patient") {
        return next(new ErrorHandler("Patient not found", 404));
    }

    // Vérification multi-tenant : Doctor ne peut voir que ses propres patients
    if (req.user.role === "Doctor") {
        const { Appointment } = await import("../models/appointmentSchema.js");
        const hasAppointment = await Appointment.findOne({
            patientId: id,
            doctorId: req.user._id
        });
        if (!hasAppointment) {
            return next(new ErrorHandler("You can only view your own patients", 403));
        }
    } else if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        // Vérification multi-tenant : Admin/Receptionist ne peut voir que les patients de sa clinique
        const { Appointment } = await import("../models/appointmentSchema.js");
        const hasAppointment = await Appointment.findOne({
            patientId: id,
            clinicId: req.user.clinicId
        });
        if (!hasAppointment) {
            return next(new ErrorHandler("You can only view patients in your clinic", 403));
        }
    }

    res.status(200).json({
        success: true,
        message: "Patient fetched successfully",
        patient,
    });
});

// PUT /api/v1/user/patient/:id - Modifier un Patient
export const updatePatient = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let patient = await User.findById(id);

    if (!patient || patient.role !== "Patient") {
        return next(new ErrorHandler("Patient not found", 404));
    }

    // Vérification multi-tenant : Admin/Receptionist ne peut modifier que les patients de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        const { Appointment } = await import("../models/appointmentSchema.js");
        const hasAppointment = await Appointment.findOne({
            patientId: id,
            clinicId: req.user.clinicId
        });
        if (!hasAppointment) {
            return next(new ErrorHandler("You can only update patients in your clinic", 403));
        }
    }

    // Vérifier si l'email est modifié et s'il existe déjà
    if (req.body.email && req.body.email !== patient.email) {
        const emailExists = await User.findOne({ email: req.body.email });
        if (emailExists) {
            return next(new ErrorHandler("Email already exists", 400));
        }
    }

    // Mettre à jour le patient
    patient = await User.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
        useFindAndModify: false,
    });

    res.status(200).json({
        success: true,
        message: "Patient updated successfully",
        patient,
    });
});

// DELETE /api/v1/user/patient/:id - Supprimer un Patient (soft delete)
export const deletePatient = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const patient = await User.findById(id);

    if (!patient || patient.role !== "Patient") {
        return next(new ErrorHandler("Patient not found", 404));
    }

    // Vérification multi-tenant : Admin/Receptionist ne peut supprimer que les patients de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        const { Appointment } = await import("../models/appointmentSchema.js");
        const hasAppointment = await Appointment.findOne({
            patientId: id,
            clinicId: req.user.clinicId
        });
        if (!hasAppointment) {
            return next(new ErrorHandler("You can only delete patients in your clinic", 403));
        }
    }

    // Soft delete : marquer comme inactif
    patient.isActive = false;
    await patient.save();

    res.status(200).json({
        success: true,
        message: "Patient deleted successfully",
    });
});