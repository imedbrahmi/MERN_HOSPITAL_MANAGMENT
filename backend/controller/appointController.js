import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { Appointment } from "../models/appointmentSchema.js";
import { User } from "../models/userSchema.js";
import { isPatientAuthenticated ,isAdminAuthenticated} from "../middelwares/auth.js";

export const postAppointment = chatchAsyncErrors(async (req, res, next) => {
    const { firstName, lastName, phone, CIN, email,
           dob, gender, appointment_date, department, 
           doctor_firstName, doctor_lastName,
           hasVisited, address,
         } = req.body;

        if(!firstName || !lastName || !phone || !CIN || !email ||
               !dob || !gender || !appointment_date || !department ||
                !doctor_firstName || !doctor_lastName
               || !address) {
        return next(new ErrorHandler("Please fill all fields", 400));
        }
    const isConfict = await User.find({
         firstName: doctor_firstName,
         role: "Doctor",
         doctorDepartment: department,
         });
        if (isConfict.length === 0) {
            return next(new ErrorHandler("Doctor not found", 400));
        }
        if (isConfict.length > 1) {
            return next(new ErrorHandler("Conflict: Multiple doctors found", 400));
        }
    const doctorId = isConfict[0]._id;
    const patientId = req.user._id;
    const appointment = await Appointment.create({
        firstName,
        lastName,
        phone,
        CIN,
        email,
        dob,
        gender,
        appointment_date,
        department,
        doctor: {
            firstName: doctor_firstName,
            lastName: doctor_lastName,
        },
        doctorId,
        patientId,
        address,
    })
    res.status(200).json({
        success: true,
        message: "Appointment created successfully",
        appointment,
    });
});
export const getAllAppointments = chatchAsyncErrors(async (req, res, next) => {
    const appointments = await Appointment.find();
    res.status(200).json({
        success: true,
        message: "All appointments fetched successfully",
        appointments,
    });
});
export const updateAppointment = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
   let appointment = await Appointment.findById(id);
   if(!appointment){
    return next(new ErrorHandler("Appointment not found", 404));
   }
  appointment = await Appointment.findByIdAndUpdate(id, req.body, { 
    new: true,
    runValidators: true,
    useFindAndModify: false,
 });
    res.status(200).json({
        success: true,
        message: "Appointment updated successfully",
        appointment,
    });
});

export const deleteAppointment = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    let appointment = await Appointment.findById(id);
    if(!appointment){
        return next(new ErrorHandler("Appointment not found", 404));
    }
    await appointment.deleteOne();
    res.status(200).json({
        success: true,
        message: "Appointment deleted successfully",
    });
})
