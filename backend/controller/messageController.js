import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import { Message } from "../models/messageSchema.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
export const sendMessage = chatchAsyncErrors(async (req, res, next) => {
   
    const { firstName, lastName, phone, message, email } = req.body;
    if(!firstName || !lastName || !phone || !message || !email) {
        return next(new ErrorHandler("Please fill all fields", 400));
    }
    await Message.create({ firstName, lastName, phone, message, email });
    res.status(201).json({
        success: true,
        message: "Message sent successfully",
    });

    
    })

