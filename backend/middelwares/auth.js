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
    
    // SOLUTION INTELLIGENTE : Utiliser le token qui correspond au rôle de l'utilisateur ET au contexte
    // Si les deux tokens sont valides, choisir selon le rôle réel de l'utilisateur dans la base de données
    let selectedUser = null;
    let selectedTokenType = null;
    
    // Détecter le contexte de la requête de manière intelligente
    // Routes dashboard explicites (priorité haute)
    const dashboardRoutes = [
        '/admin/', '/doctor/', '/receptionist/', '/getAll', 
        '/doctors', '/patients', '/clinics', '/schedule', 
        '/medical-record', '/prescription', '/invoice'
    ];
    const isDashboardRoute = dashboardRoutes.some(route => req.path.includes(route));
    
    // Routes patient explicites (priorité haute)
    const patientRoutes = ['/patient/', '/patient/my-'];
    const isPatientRoute = patientRoutes.some(route => req.path.includes(route));
    
    console.log(`[isAuthenticated] Route detection - path: ${req.path}, method: ${req.method}, isPatientRoute: ${isPatientRoute}, isDashboardRoute: ${isDashboardRoute}`);
    console.log(`[isAuthenticated] adminUser: ${adminUser ? `${adminUser.user.role} (${adminUser.user._id})` : 'null'}`);
    console.log(`[isAuthenticated] patientUser: ${patientUser ? `${patientUser.user.role} (${patientUser.user._id})` : 'null'}`);
    
    // LOGIQUE INTELLIGENTE : Priorité selon le contexte de la route ET le rôle de l'utilisateur
    const adminRoles = ['Admin', 'SuperAdmin', 'Doctor', 'Receptionist'];
    
    if (adminUser && patientUser) {
        // Les deux tokens sont valides - choisir selon le contexte ET le rôle
        if (isDashboardRoute) {
            // Route dashboard : TOUJOURS utiliser adminToken (même si patientToken existe)
            selectedUser = adminUser.user;
            selectedTokenType = adminUser.tokenType;
            console.log(`[isAuthenticated] Both tokens valid, using adminToken for dashboard route (${adminUser.user.role})`);
        } else if (isPatientRoute) {
            // Route patient : TOUJOURS utiliser patientToken (même si adminToken existe)
            selectedUser = patientUser.user;
            selectedTokenType = patientUser.tokenType;
            console.log(`[isAuthenticated] Both tokens valid, using patientToken for patient route`);
        } else {
            // Route mixte (comme /appointment/post) : choisir selon le rôle de l'utilisateur
            // Si adminUser a un rôle dashboard, utiliser adminToken
            // Sinon, utiliser patientToken
            if (adminRoles.includes(adminUser.user.role)) {
                selectedUser = adminUser.user;
                selectedTokenType = adminUser.tokenType;
                console.log(`[isAuthenticated] Both tokens valid for mixed route, using adminToken (${adminUser.user.role})`);
            } else {
                selectedUser = patientUser.user;
                selectedTokenType = patientUser.tokenType;
                console.log(`[isAuthenticated] Both tokens valid for mixed route, using patientToken`);
            }
        }
    } 
    // Si un seul token est valide, vérifier qu'il correspond au contexte
    else if (adminUser) {
        // adminToken valide disponible
        selectedUser = adminUser.user;
        selectedTokenType = adminUser.tokenType;
        console.log(`[isAuthenticated] Using adminToken (only valid token) - ${adminUser.user.role}`);
    } 
    else if (patientUser) {
        // patientToken valide disponible
        // MAIS si c'est une route dashboard explicite, on ne peut pas utiliser patientToken
        if (isDashboardRoute) {
            console.log(`[isAuthenticated] Dashboard route requires adminToken, but only patientToken available`);
            return next(new ErrorHandler("Dashboard routes require admin authentication. Please login to the dashboard.", 401));
        }
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