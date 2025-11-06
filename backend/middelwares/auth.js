import { chatchAsyncErrors } from "./catchAsyncErrors.js";
import ErrorHandler from "./errorMidelware.js";
import jwt from "jsonwebtoken";
import { User } from "../models/userSchema.js";


export const isAdminAuthenticated = chatchAsyncErrors(async (req, res, next) => {
    const token = req.cookies.adminToken;
    if(!token){
        return next(new ErrorHandler("Admin is not authenticated", 401));
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET_KEY);
    req.user = await User.findById(decoded.id);
    if(req.user.role !== "Admin"){
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