import mongoose from "mongoose";
import validator from "validator";

const messageSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: true,
        minlength: [3, "Please enter a valid firstname"],
    },

    lastName: {
        type: String,
        required: false,
        minlength: [3, "Please enter a valid lastname"],
    },

    phone: {
        type: String,
        required: true,
        minlength: [8, "Please phone number must be at least 8 characters long"],
        maxlength: [8, "Please phone number must be at most 8 characters long"],
        validate: [validator.isMobilePhone,]
    },

    message: {
        type: String,
        required: true,
        minlength: [10, "Message must be at least 10 characters long"],
        maxlength: [1000, "Please message must be at most 1000 characters long"],
    },

    email: {
        type: String,
        required: true,
        validate: [validator.isEmail, "Please enter a valid email"],
    },
});

export const Message = mongoose.model("Message", messageSchema);

