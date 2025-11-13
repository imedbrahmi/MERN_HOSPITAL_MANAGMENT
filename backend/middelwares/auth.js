import { chatchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMidelware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";

// Middleware générique pour vérifier l'authentification (sans vérifier le rôle)
// SOLUTION ULTIME : Sélection intelligente basée sur l'utilisateur réel, pas sur des patterns de routes
export const isAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    const adminToken = req.cookies.adminToken;
    const patientToken = req.cookies.patientToken;
    
    console.log(`[isAuthenticated] === AUTHENTICATION CHECK ===`);
    console.log(`[isAuthenticated] Path: ${req.path}, Method: ${req.method}`);
    console.log(`[isAuthenticated] Tokens present - adminToken: ${!!adminToken}, patientToken: ${!!patientToken}`);
    
    if(!adminToken && !patientToken){
        console.log(`[isAuthenticated] ❌ No tokens found`);
        return next(new ErrorHandler("User is not authenticated", 401));
    }
    
    // Étape 1: Vérifier et décoder les deux tokens pour obtenir les utilisateurs
    let adminUser = null;
    let patientUser = null;
    
    if (adminToken) {
        try {
            const decoded = jwt.verify(adminToken, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            if (user) {
                // Accepter adminToken seulement si l'utilisateur a un rôle dashboard
                if (user.role === "Admin" || user.role === "SuperAdmin" || user.role === "Doctor" || user.role === "Receptionist") {
                    adminUser = { user, token: adminToken, tokenType: "adminToken" };
                    console.log(`[isAuthenticated] ✅ Valid adminToken for ${user.role} (ID: ${user._id})`);
                } else {
                    console.log(`[isAuthenticated] ⚠️ adminToken exists but user role is ${user.role} (not dashboard role)`);
                }
            }
        } catch (error) {
            console.log(`[isAuthenticated] ❌ adminToken invalid:`, error.message);
        }
    }
    
    if (patientToken) {
        try {
            const decoded = jwt.verify(patientToken, process.env.JWT_SECRET_KEY);
            const user = await User.findById(decoded.id);
            if (user) {
                // Accepter patientToken seulement si l'utilisateur est un Patient
                if (user.role === "Patient") {
                    patientUser = { user, token: patientToken, tokenType: "patientToken" };
                    console.log(`[isAuthenticated] ✅ Valid patientToken for Patient (ID: ${user._id})`);
                } else {
                    console.log(`[isAuthenticated] ⚠️ patientToken exists but user role is ${user.role} (not Patient)`);
                }
            }
        } catch (error) {
            console.log(`[isAuthenticated] ❌ patientToken invalid:`, error.message);
        }
    }
    
    // Étape 2: Logique de sélection intelligente
    let selectedUser = null;
    let selectedTokenType = null;
    let selectionReason = "";
    
    // Cas 1: Les deux tokens sont valides
    if (adminUser && patientUser) {
        // Vérifier si c'est le MÊME utilisateur (cas rare mais possible)
        const sameUser = adminUser.user._id.toString() === patientUser.user._id.toString();
        
        if (sameUser) {
            // Même utilisateur avec deux tokens - choisir selon le contexte
            // Mais normalement, un utilisateur ne devrait avoir qu'un seul type de token
            // Si c'est un Patient, utiliser patientToken
            // Si c'est un rôle dashboard, utiliser adminToken
            if (adminUser.user.role === "Patient") {
                selectedUser = patientUser.user;
                selectedTokenType = patientUser.tokenType;
                selectionReason = "Same user, both tokens valid, using patientToken (user is Patient)";
            } else {
                selectedUser = adminUser.user;
                selectedTokenType = adminUser.tokenType;
                selectionReason = "Same user, both tokens valid, using adminToken (user is dashboard role)";
            }
        } else {
            // Utilisateurs DIFFÉRENTS - choisir selon le contexte de la route
            // Routes dashboard explicites → adminToken
            // Routes patient explicites → patientToken
            // Routes mixtes → prioriser patientToken (car les patients utilisent plus souvent ces routes)
            const dashboardRoutes = ['/admin/', '/doctor/', '/receptionist/', '/getAll', '/doctors', '/patients', '/clinics', '/schedule', '/medical-record', '/prescription', '/invoice'];
            const patientRoutes = ['/patient/', '/patient/my-'];
            
            const isDashboardRoute = dashboardRoutes.some(route => req.path.includes(route));
            const isPatientRoute = patientRoutes.some(route => req.path.includes(route));
            
            if (isDashboardRoute) {
                selectedUser = adminUser.user;
                selectedTokenType = adminUser.tokenType;
                selectionReason = `Different users, dashboard route → using adminToken (${adminUser.user.role})`;
            } else if (isPatientRoute) {
                selectedUser = patientUser.user;
                selectedTokenType = patientUser.tokenType;
                selectionReason = `Different users, patient route → using patientToken`;
            } else {
                // Route mixte: prioriser patientToken car les patients utilisent plus souvent ces routes depuis le frontend
                selectedUser = patientUser.user;
                selectedTokenType = patientUser.tokenType;
                selectionReason = `Different users, mixed route → using patientToken (frontend priority)`;
            }
        }
    }
    // Cas 2: Seul adminToken est valide
    else if (adminUser) {
        selectedUser = adminUser.user;
        selectedTokenType = adminUser.tokenType;
        selectionReason = `Only adminToken valid (${adminUser.user.role})`;
    }
    // Cas 3: Seul patientToken est valide
    else if (patientUser) {
        // Vérifier si c'est une route dashboard explicite
        const dashboardRoutes = ['/admin/', '/doctor/', '/receptionist/', '/getAll', '/doctors', '/patients', '/clinics', '/schedule', '/medical-record', '/prescription', '/invoice'];
        const isDashboardRoute = dashboardRoutes.some(route => req.path.includes(route));
        
        if (isDashboardRoute) {
            console.log(`[isAuthenticated] ❌ Dashboard route requires adminToken, but only patientToken available`);
            return next(new ErrorHandler("Dashboard routes require admin authentication. Please login to the dashboard.", 401));
        }
        
        selectedUser = patientUser.user;
        selectedTokenType = patientUser.tokenType;
        selectionReason = `Only patientToken valid`;
    }
    
    // Étape 3: Validation finale
    if (!selectedUser) {
        console.log(`[isAuthenticated] ❌ No valid token found after processing`);
        return next(new ErrorHandler("Invalid or expired token", 401));
    }
    
    // Étape 4: Assigner l'utilisateur à la requête
    req.user = selectedUser;
    console.log(`[isAuthenticated] ✅ SELECTED: ${selectedTokenType} for ${selectedUser.role} (ID: ${selectedUser._id})`);
    console.log(`[isAuthenticated] 📝 Reason: ${selectionReason}`);
    console.log(`[isAuthenticated] ========================================`);
    
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