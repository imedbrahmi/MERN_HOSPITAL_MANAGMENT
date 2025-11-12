import { chatchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMidelware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";

// Middleware générique pour vérifier l'authentification (sans vérifier le rôle)
export const isAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    // Essayer d'abord adminToken, puis patientToken
    const adminToken = req.cookies.adminToken;
    const patientToken = req.cookies.patientToken;
    
    if(!adminToken && !patientToken){
        return next(new ErrorHandler("User is not authenticated", 401));
    }
    
    const token = adminToken || patientToken;
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    
    if(!req.user){
        return next(new ErrorHandler("User not found", 404));
    }
    
    next();
});

// Middleware pour vérifier que l'utilisateur a un des rôles spécifiés
// Usage: requireRole(['SuperAdmin']) ou requireRole('SuperAdmin', 'Admin')
export const requireRole = (...roles) => {
    return chatchAsyncErrors(async (req, res, next) => {
        // Vérifier d'abord l'authentification
        if(!req.user){
            return next(new ErrorHandler("User is not authenticated", 401));
        }
        
        // Normaliser les rôles : si le premier argument est un tableau, l'utiliser, sinon utiliser tous les arguments
        const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;
        
        // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
        if(!allowedRoles.includes(req.user.role)){
            return next(new ErrorHandler(
                `Access denied. Required roles: ${allowedRoles.join(', ')}`, 
                403
            ));
        }
        
        next();
    });
};

// Middleware pour vérifier que l'utilisateur appartient à la même clinique (pour Admin)
// SuperAdmin peut accéder à toutes les cliniques
export const requireSameClinic = chatchAsyncErrors(async (req, res, next) => {
    if(!req.user){
        return next(new ErrorHandler("User is not authenticated", 401));
    }
    
    // SuperAdmin peut accéder à toutes les cliniques
    if(req.user.role === "SuperAdmin"){
        return next();
    }
    
    // Pour les autres rôles, vérifier clinicId dans la requête (params, body, ou query)
    const requestedClinicId = req.params.clinicId || req.body.clinicId || req.query.clinicId;
    
    if(!requestedClinicId){
        return next(new ErrorHandler("Clinic ID is required", 400));
    }
    
    // Vérifier que l'utilisateur appartient à la même clinique
    if(req.user.clinicId && req.user.clinicId.toString() !== requestedClinicId.toString()){
        return next(new ErrorHandler("You can only access your own clinic's data", 403));
    }
    
    next();
});

// Middlewares existants (conservés pour compatibilité)
export const isAdminAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.adminToken;
    if(!token){
        return next(new ErrorHandler("Admin is not authenticated", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    // Autoriser SuperAdmin, Admin, Doctor et Receptionist (tous utilisent le dashboard)
    if(req.user.role !== "Admin" && req.user.role !== "SuperAdmin" && req.user.role !== "Doctor" && req.user.role !== "Receptionist"){
        return next(new ErrorHandler("You are not authorized to access this resource", 403));
    }
    next();
});

export const isPatientAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.patientToken;
    if(!token){
        return next(new ErrorHandler("Patient is not authenticated", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    if(req.user.role !== "Patient"){
        return next(new ErrorHandler("You are not authorized to access this resource", 403));
    }
    next();
});

// Middleware pour authentifier les docteurs (utilise adminToken car les docteurs se connectent via le dashboard)
export const isDoctorAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.adminToken;
    if(!token){
        return next(new ErrorHandler("Doctor is not authenticated", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    if(req.user.role !== "Doctor"){
        return next(new ErrorHandler("You are not authorized to access this resource", 403));
    }
    next();
});