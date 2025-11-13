import { chatchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMidelware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";

// Middleware générique pour vérifier l'authentification (sans vérifier le rôle)
export const isAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    // Essayer d'abord adminToken, puis patientToken
    const adminToken = req.cookies.adminToken;
    const patientToken = req.cookies.patientToken;
    
    console.log(`[isAuthenticated] Checking authentication - adminToken: ${!!adminToken}, patientToken: ${!!patientToken}`);
    console.log(`[isAuthenticated] All cookies:`, Object.keys(req.cookies || {}));
    
    if(!adminToken && !patientToken){
        console.log(`[isAuthenticated] No tokens found - cookies:`, Object.keys(req.cookies || {}));
        return next(new ErrorHandler("User is not authenticated", 401));
    }
    
    // Vérifier les deux tokens et utiliser celui qui correspond au bon rôle
    // Si les deux sont présents, vérifier les deux et utiliser le bon
    let token = null;
    let tokenType = null;
    let userFromToken = null;
    
    // Vérifier les deux tokens et collecter les utilisateurs valides
    let adminUser = null;
    let patientUser = null;
    
    // Vérifier adminToken (pour dashboard: Admin, SuperAdmin, Doctor, Receptionist)
    if (adminToken) {
        try {
            const decoded = jwt.verify(adminToken, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            if (user && (user.role === "Admin" || user.role === "SuperAdmin" || user.role === "Doctor" || user.role === "Receptionist")) {
                adminUser = { user, token: adminToken, tokenType: "adminToken" };
                console.log(`[isAuthenticated] Found valid adminToken for ${user.role} user:`, user._id);
            }
        } catch (error) {
            console.log(`[isAuthenticated] adminToken invalid:`, error.message);
        }
    }
    
    // Vérifier patientToken (pour frontend: Patient)
    if (patientToken) {
        try {
            const decoded = jwt.verify(patientToken, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            if (user && user.role === "Patient") {
                patientUser = { user, token: patientToken, tokenType: "patientToken" };
                console.log(`[isAuthenticated] Found valid patientToken for Patient user:`, user._id);
            }
        } catch (error) {
            console.log(`[isAuthenticated] patientToken invalid:`, error.message);
        }
    }
    
    // Si les deux tokens sont valides, prioriser adminToken pour le dashboard
    // (car les routes du dashboard utilisent adminToken pour Admin/Doctor/Receptionist)
    // Si seulement patientToken est valide, l'utiliser (pour le frontend patient)
    if (adminUser) {
        token = adminUser.token;
        tokenType = adminUser.tokenType;
        userFromToken = adminUser.user;
        console.log(`[isAuthenticated] Using adminToken (priority) for ${userFromToken.role} user:`, userFromToken._id);
    } else if (patientUser) {
        token = patientUser.token;
        tokenType = patientUser.tokenType;
        userFromToken = patientUser.user;
        console.log(`[isAuthenticated] Using patientToken for Patient user:`, userFromToken._id);
    }
    
    if (!token) {
        console.log(`[isAuthenticated] No valid token found`);
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
    
    // Utiliser l'utilisateur déjà récupéré pour éviter une double requête
    if (userFromToken) {
        req.user = userFromToken;
        console.log(`[isAuthenticated] User authenticated with ${tokenType}:`, { id: req.user._id, role: req.user.role, email: req.user.email });
        next();
    } else {
        // Fallback: récupérer l'utilisateur depuis le token (ne devrait pas arriver normalement)
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
            req.user = await User.findById(decoded.id);
            
            if(!req.user){
                console.log(`[isAuthenticated] User not found for ID:`, decoded.id);
                return next(new ErrorHandler("User not found", 404));
            }
            
            console.log(`[isAuthenticated] User authenticated with ${tokenType}:`, { id: req.user._id, role: req.user.role, email: req.user.email });
            next();
        } catch (error) {
            console.log(`[isAuthenticated] Token verification failed:`, error.message);
            return next(new ErrorHandler("Invalid or expired token", 401));
        }
    }
});

// Middleware pour vérifier que l'utilisateur a un des rôles spécifiés
// Usage: requireRole(['SuperAdmin']) ou requireRole('SuperAdmin', 'Admin')
export const requireRole = (...roles) => {
    return chatchAsyncErrors(async (req, res, next) => {
        // Vérifier d'abord l'authentification
        if(!req.user){
            console.log(`[requireRole] No user found in request`);
            return next(new ErrorHandler("User is not authenticated", 401));
        }
        
        // Normaliser les rôles : si le premier argument est un tableau, l'utiliser, sinon utiliser tous les arguments
        const allowedRoles = Array.isArray(roles[0]) ? roles[0] : roles;
        
        console.log(`[requireRole] Checking role - user role: ${req.user.role}, allowed roles:`, allowedRoles);
        console.log(`[requireRole] User details:`, { id: req.user._id, role: req.user.role, email: req.user.email });
        
        // Vérifier si le rôle de l'utilisateur est dans la liste des rôles autorisés
        if(!allowedRoles.includes(req.user.role)){
            console.log(`[requireRole] Access denied - user role "${req.user.role}" not in allowed roles:`, allowedRoles);
            console.log(`[requireRole] User role type:`, typeof req.user.role, `Allowed roles types:`, allowedRoles.map(r => typeof r));
            return next(new ErrorHandler(
                `Access denied. Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`, 
                403
            ));
        }
        
        console.log(`[requireRole] Access granted for role:`, req.user.role);
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
    console.log(`[isPatientAuthenticated] Checking patient authentication - token present: ${!!token}`);
    console.log(`[isPatientAuthenticated] All cookies:`, Object.keys(req.cookies || {}));
    
    if(!token){
        console.log(`[isPatientAuthenticated] No patientToken found in cookies`);
        return next(new ErrorHandler("Patient is not authenticated", 401));
    }
    
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
        console.log(`[isPatientAuthenticated] Token decoded successfully, user ID:`, decoded.id);
        
        req.user = await User.findById(decoded.id);
        
        if(!req.user){
            console.log(`[isPatientAuthenticated] User not found for ID:`, decoded.id);
            return next(new ErrorHandler("User not found", 404));
        }
        
        console.log(`[isPatientAuthenticated] User found:`, { id: req.user._id, role: req.user.role, email: req.user.email });
        
        if(req.user.role !== "Patient"){
            console.log(`[isPatientAuthenticated] User role is ${req.user.role}, expected Patient`);
            return next(new ErrorHandler("You are not authorized to access this resource", 403));
        }
        
        console.log(`[isPatientAuthenticated] Patient authenticated successfully:`, { id: req.user._id, email: req.user.email });
        next();
    } catch (error) {
        console.log(`[isPatientAuthenticated] Token verification failed:`, error.name, error.message);
        // Les erreurs JWT seront converties en 401 par errorMidelware
        return next(error);
    }
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