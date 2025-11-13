export const generateToken = (user, message, statusCode, res) => {
    const token = user.generateJsonWebToken();
    // SuperAdmin, Admin, Doctor et Receptionist utilisent adminToken (dashboard), Patient utilise patientToken (frontend)
    const cookieName = (user.role === "Admin" || user.role === "SuperAdmin" || user.role === "Doctor" || user.role === "Receptionist") ? "adminToken" : "patientToken";
    const cookieExpire = parseInt(process.env.COOKIE_EXPIRE) || 7;
    
    console.log(`[generateToken] Creating cookie: ${cookieName} for user:`, { id: user._id, role: user.role, email: user.email });
    
    const cookieOptions = {
        expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: 'lax', // Ajouté pour améliorer la compatibilité
        secure: false, // En développement, ne pas utiliser secure (nécessite HTTPS)
        path: '/', // Cookie disponible pour tout le site
    };
    
    console.log(`[generateToken] Cookie options:`, cookieOptions);
    
    res.status(statusCode).cookie(cookieName, token, cookieOptions).json({
        success: true,
        message: message,
        user,
        token,
    });
    
    console.log(`[generateToken] Cookie ${cookieName} set successfully`);
};