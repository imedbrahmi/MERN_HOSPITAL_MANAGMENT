export const generateToken = (user, message, statusCode, res) => {
    const token = user.generateJsonWebToken();
    // SuperAdmin, Admin, Doctor et Receptionist utilisent adminToken (dashboard), Patient utilise patientToken (frontend)
    const cookieName = (user.role === "Admin" || user.role === "SuperAdmin" || user.role === "Doctor" || user.role === "Receptionist") ? "adminToken" : "patientToken";
    const cookieExpire = parseInt(process.env.COOKIE_EXPIRE) || 7;
    res.status(statusCode).cookie(cookieName, token, {
        expires: new Date(Date.now() + cookieExpire * 24 * 60 * 60 * 1000),
        httpOnly: true,
    }).json({
        success: true,
        message: message,
        user,
        token,
    });  
};