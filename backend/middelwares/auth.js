import { chatchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMidelware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";

// Middleware générique pour vérifier l'authentification (sans vérifier le rôle)
// SOLUTION PERMANENTE : Vérifie les deux tokens et utilise celui qui correspond au rôle de l'utilisateur
export const isAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    const adminToken = req.cookies.adminToken;
    const patientToken = req.cookies.patientToken;
    
    console.log(`[isAuthenticated] Checking authentication - adminToken: ${!!adminToken}, patientToken: ${!!patientToken}`);
    
    if(!adminToken && !patientToken){
        console.log(`[isAuthenticated] No tokens found`);
        return next(new ErrorHandler("User is not authenticated", 401));
    }
    
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
    
    // SOLUTION PERMANENTE : Si les deux tokens sont valides, utiliser celui qui correspond au rôle de l'utilisateur
    // Si les deux sont pour des utilisateurs différents, utiliser celui qui correspond au contexte de la route
    // Pour déterminer le contexte, on vérifie le chemin de la requête
    
    let selectedUser = null;
    let selectedTokenType = null;
    
    // Détecter le contexte de la requête pour choisir le bon token
    // Routes patient : routes qui commencent par /patient/ ou contiennent /my-
    const isPatientRoute = req.path.includes('/patient/') || req.path.includes('/my-');
    
    // Routes dashboard : routes pour admin/doctor/receptionist
    const isDashboardRoute = req.path.includes('/admin/') || 
                             req.path.includes('/doctor/') || 
                             req.path.includes('/receptionist/') || 
                             req.path.includes('/getAll') || 
                             req.path.includes('/doctors') || 
                             req.path.includes('/patients') ||
                             req.path.includes('/clinics') ||
                             req.path.includes('/schedule') ||
                             req.path.includes('/medical-record') ||
                             req.path.includes('/prescription') ||
                             req.path.includes('/invoice');
    
    console.log(`[isAuthenticated] Route detection - path: ${req.path}, method: ${req.method}, isPatientRoute: ${isPatientRoute}, isDashboardRoute: ${isDashboardRoute}`);
    
    // Si les deux tokens sont valides, choisir selon le contexte ET le rôle de l'utilisateur
    if (adminUser && patientUser) {
        // Les deux tokens sont valides : utiliser celui qui correspond au contexte de la route
        // Si c'est une route patient explicite, utiliser patientToken
        // Si c'est une route dashboard, utiliser adminToken
        // Sinon (route mixte comme /appointment/post), utiliser celui qui correspond au rôle de l'utilisateur
        if (isPatientRoute) {
            selectedUser = patientUser.user;
            selectedTokenType = patientUser.tokenType;
            console.log(`[isAuthenticated] Both tokens valid, using patientToken for patient route`);
        } else if (isDashboardRoute) {
            selectedUser = adminUser.user;
            selectedTokenType = adminUser.tokenType;
            console.log(`[isAuthenticated] Both tokens valid, using adminToken for dashboard route`);
        } else {
            // Route mixte (comme /appointment/post) : utiliser celui qui correspond au rôle de l'utilisateur
            // Si les deux sont pour des utilisateurs différents, prioriser selon le contexte
            // Par défaut, pour les routes POST qui peuvent être utilisées par les deux, prioriser patientToken
            // car les patients utilisent plus souvent ces routes depuis le frontend
            if (req.method === 'POST' && (req.path.includes('/post') || req.path.includes('/create'))) {
                // Pour les routes POST, prioriser patientToken si disponible (patients créent depuis frontend)
                selectedUser = patientUser.user;
                selectedTokenType = patientUser.tokenType;
                console.log(`[isAuthenticated] Both tokens valid for POST route, using patientToken (frontend priority)`);
            } else {
                // Pour les autres routes, prioriser adminToken (dashboard)
                selectedUser = adminUser.user;
                selectedTokenType = adminUser.tokenType;
                console.log(`[isAuthenticated] Both tokens valid, using adminToken (dashboard priority)`);
            }
        }
    } else if (isPatientRoute && patientUser) {
        // Route patient : utiliser patientToken
        selectedUser = patientUser.user;
        selectedTokenType = patientUser.tokenType;
        console.log(`[isAuthenticated] Using patientToken for patient route:`, req.path);
    } else if (isDashboardRoute && adminUser) {
        // Route dashboard : utiliser adminToken
        selectedUser = adminUser.user;
        selectedTokenType = adminUser.tokenType;
        console.log(`[isAuthenticated] Using adminToken for dashboard route:`, req.path);
    } else if (adminUser) {
        selectedUser = adminUser.user;
        selectedTokenType = adminUser.tokenType;
        console.log(`[isAuthenticated] Using adminToken (only valid token)`);
    } else if (patientUser) {
        selectedUser = patientUser.user;
        selectedTokenType = patientUser.tokenType;
        console.log(`[isAuthenticated] Using patientToken (only valid token)`);
    }
    
    if (!selectedUser) {
        console.log(`[isAuthenticated] No valid token found`);
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
    
    req.user = selectedUser;
    console.log(`[isAuthenticated] User authenticated with ${selectedTokenType}:`, { id: req.user._id, role: req.user.role, email: req.user.email });
    next();
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