import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import { Clinic } from "../models/clinicSchema.js";
import { User } from "../models/userSchema.js";
import ErrorHandler from "../middelwares/errorMidelware.js";

// GET /api/v1/clinics - Liste toutes les cliniques actives (publique)
export const getAllClinics = chatchAsyncErrors(async (req, res, next) => {
    const clinics = await Clinic.find({ isActive: true })
        .select("name address phone email services tariff")
        .lean();
    
    res.status(200).json({
        success: true,
        message: "Clinics fetched successfully",
        clinics,
    });
});

// GET /api/v1/clinics/all - Liste toutes les cliniques (y compris inactives) pour SuperAdmin
export const getAllClinicsForAdmin = chatchAsyncErrors(async (req, res, next) => {
    const clinics = await Clinic.find()
        .select("name address phone email services tariff isActive createdAt updatedAt")
        .lean();
    
    // Pour chaque clinique, récupérer l'Admin associé (avec clinicId)
    const clinicsWithAdmin = await Promise.all(
        clinics.map(async (clinic) => {
            const admin = await User.findOne({ 
                clinicId: clinic._id, 
                role: "Admin" 
            }).select("firstName lastName email").lean();
            
            return {
                ...clinic,
                admin: admin || null, // Admin associé à la clinique
            };
        })
    );
    
    res.status(200).json({
        success: true,
        message: "All clinics fetched successfully",
        clinics: clinicsWithAdmin,
    });
});

// GET /api/v1/clinics/:id - Récupère une clinique par ID avec son admin associé
export const getClinicById = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const clinic = await Clinic.findById(id);
    
    if (!clinic) {
        return next(new ErrorHandler("Clinic not found", 404));
    }
    
    // Récupérer l'admin associé à cette clinique (rôle Admin avec clinicId)
    const admin = await User.findOne({ 
        clinicId: clinic._id, 
        role: "Admin" 
    }).select("firstName lastName phone CIN email dob gender");
    
    res.status(200).json({
        success: true,
        clinic,
        admin: admin || null,
    });
});

// PUT /api/v1/clinics/:id - Met à jour une clinique et son admin associé (SuperAdmin seulement)
export const updateClinic = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { 
        name, address, phone, email, services, tariff, isActive,
        // Données de l'admin (pour modification) OU adminId (pour changement)
        adminFirstName, adminLastName, adminPhone, adminCIN, 
        adminEmail, adminDob, adminGender, adminPassword,
        adminId // ID de l'Admin existant à assigner (remplace l'Admin actuel)
    } = req.body;
    
    const clinic = await Clinic.findById(id);
    if (!clinic) {
        return next(new ErrorHandler("Clinic not found", 404));
    }
    
    // Vérifier que l'utilisateur est le propriétaire ou SuperAdmin
    if (req.user.role !== "SuperAdmin" && clinic.ownerId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to update this clinic", 403));
    }
    
    // Mettre à jour les champs de la clinique
    if (name) clinic.name = name;
    if (address) clinic.address = address;
    if (phone) clinic.phone = phone;
    if (email) clinic.email = email;
    if (services) clinic.services = services;
    if (tariff) clinic.tariff = tariff;
    if (typeof isActive === 'boolean') clinic.isActive = isActive;
    
    await clinic.save();
    
    let updatedAdmin = null;
    
    // Si adminId est fourni, changer l'Admin assigné
    if (adminId) {
        const newAdmin = await User.findById(adminId);
        if (!newAdmin) {
            return next(new ErrorHandler("Admin not found", 404));
        }
        if (newAdmin.role !== "Admin") {
            return next(new ErrorHandler("Selected user is not an Admin", 400));
        }
        if (newAdmin.clinicId && newAdmin.clinicId.toString() !== clinic._id.toString()) {
            return next(new ErrorHandler("This Admin is already assigned to another clinic", 400));
        }
        
        // Retirer l'ancien Admin de la clinique
        const oldAdmin = await User.findOne({ 
            clinicId: clinic._id, 
            role: "Admin" 
        });
        if (oldAdmin) {
            oldAdmin.clinicId = null;
            await oldAdmin.save();
        }
        
        // Assigner le nouvel Admin à la clinique
        newAdmin.clinicId = clinic._id;
        await newAdmin.save();
        
        updatedAdmin = {
            _id: newAdmin._id,
            firstName: newAdmin.firstName,
            lastName: newAdmin.lastName,
            email: newAdmin.email,
        };
    } else if (adminFirstName || adminLastName || adminPhone || adminCIN || 
               adminEmail || adminDob || adminGender || adminPassword) {
        // Sinon, mettre à jour l'Admin actuel
        const admin = await User.findOne({ 
            clinicId: clinic._id, 
            role: "Admin" 
        });
        
        if (admin) {
            if (adminFirstName) admin.firstName = adminFirstName;
            if (adminLastName) admin.lastName = adminLastName;
            if (adminPhone) admin.phone = adminPhone;
            if (adminCIN) admin.CIN = adminCIN;
            if (adminEmail) admin.email = adminEmail;
            if (adminDob) admin.dob = adminDob;
            if (adminGender) admin.gender = adminGender;
            if (adminPassword) admin.password = adminPassword; // Sera hashé par le hook pre-save
            
            await admin.save();
            updatedAdmin = {
                _id: admin._id,
                firstName: admin.firstName,
                lastName: admin.lastName,
                email: admin.email,
            };
        }
    }
    
    res.status(200).json({
        success: true,
        message: adminId ? "Clinic updated and Admin changed successfully" : "Clinic and Admin updated successfully",
        clinic,
        admin: updatedAdmin,
    });
});

// DELETE /api/v1/clinics/:id - Supprime une clinique (SuperAdmin seulement)
export const deleteClinic = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    
    const clinic = await Clinic.findById(id);
    if (!clinic) {
        return next(new ErrorHandler("Clinic not found", 404));
    }
    
    // Seul SuperAdmin peut supprimer une clinique
    if (req.user.role !== "SuperAdmin") {
        return next(new ErrorHandler("Only SuperAdmin can delete clinics", 403));
    }
    
    // Soft delete : marquer comme inactive au lieu de supprimer
    clinic.isActive = false;
    await clinic.save();
    
    res.status(200).json({
        success: true,
        message: "Clinic deleted successfully",
    });
});

// POST /api/v1/clinics/onboard - Onboarding : Crée une clinique + Admin associé (SuperAdmin seulement)
export const onboardClinic = chatchAsyncErrors(async (req, res, next) => {
    // Données de la clinique
    const { 
        clinicName, 
        clinicAddress, 
        clinicPhone, 
        clinicEmail, 
        clinicServices, 
        clinicTariff 
    } = req.body;
    
    // Données de l'Admin (pour création) OU adminId (pour assignation)
    const { 
        adminFirstName, 
        adminLastName, 
        adminPhone, 
        adminCIN, 
        adminEmail, 
        adminDob, 
        adminGender, 
        adminPassword,
        adminId // ID de l'Admin existant à assigner
    } = req.body;
    
    // Validation des champs de la clinique
    if (!clinicName || !clinicAddress || !clinicPhone || !clinicEmail) {
        return next(new ErrorHandler("Please fill all clinic required fields", 400));
    }
    
    // Vérifier si une clinique avec le même email existe déjà
    const existingClinic = await Clinic.findOne({ email: clinicEmail });
    if (existingClinic) {
        return next(new ErrorHandler("Clinic with this email already exists", 400));
    }
    
    // Créer la clinique
    const clinic = await Clinic.create({
        name: clinicName,
        address: clinicAddress,
        phone: clinicPhone,
        email: clinicEmail,
        services: clinicServices || [],
        tariff: clinicTariff || { consultation: 0 },
        ownerId: req.user._id, // Le SuperAdmin qui fait l'onboarding devient le propriétaire
    });
    
    let admin;
    
    // Si adminId est fourni, assigner un Admin existant
    if (adminId) {
        admin = await User.findById(adminId);
        if (!admin) {
            return next(new ErrorHandler("Admin not found", 404));
        }
        if (admin.role !== "Admin") {
            return next(new ErrorHandler("Selected user is not an Admin", 400));
        }
        if (admin.clinicId) {
            return next(new ErrorHandler("This Admin is already assigned to a clinic", 400));
        }
        // Assigner l'Admin à la clinique
        admin.clinicId = clinic._id;
        await admin.save();
    } else {
        // Sinon, créer un nouvel Admin
        // Validation des champs de l'Admin
        if (!adminFirstName || !adminLastName || !adminPhone || !adminCIN || 
            !adminEmail || !adminDob || !adminGender || !adminPassword) {
            return next(new ErrorHandler("Please fill all admin required fields or select an existing admin", 400));
        }
        
        // Vérifier si un Admin avec le même email existe déjà
        const existingAdmin = await User.findOne({ email: adminEmail });
        if (existingAdmin) {
            return next(new ErrorHandler("Admin with this email already exists", 400));
        }
        
        // Créer l'Admin associé à la clinique
        admin = await User.create({
            firstName: adminFirstName,
            lastName: adminLastName,
            phone: adminPhone,
            CIN: adminCIN,
            email: adminEmail,
            dob: adminDob,
            gender: adminGender,
            password: adminPassword,
            role: "Admin",
            clinicId: clinic._id, // L'Admin est associé à la clinique créée
        });
    }
    
    res.status(201).json({
        success: true,
        message: adminId ? "Clinic created and Admin assigned successfully" : "Clinic and Admin created successfully",
        clinic,
        admin: {
            _id: admin._id,
            firstName: admin.firstName,
            lastName: admin.lastName,
            email: admin.email,
            role: admin.role,
        },
    });
});

// Helper function: Convert clinicName to clinicId
// Cette fonction doit être utilisée avec chatchAsyncErrors ou dans un try/catch
export const getClinicIdByName = async (clinicName, next) => {
    if (!clinicName) {
        return next(new ErrorHandler("Clinic name is required", 400));
    }
    
    const clinic = await Clinic.findOne({ 
        name: clinicName,
        isActive: true 
    });
    
    if (!clinic) {
        return next(new ErrorHandler(`Clinic "${clinicName}" not found or inactive`, 404));
    }
    
    return clinic._id;
};

