import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { Schedule } from "../models/scheduleSchema.js";
import { User } from "../models/userSchema.js";

// POST /api/v1/schedule/create - Créer un horaire (Doctor seulement)
export const createSchedule = chatchAsyncErrors(async (req, res, next) => {
    // Seul un Doctor peut créer son propre agenda
    if (req.user.role !== "Doctor") {
        return next(new ErrorHandler("Only doctors can create schedules", 403));
    }

    const { dayOfWeek, startTime, endTime, duration, isAvailable } = req.body;

    if (!dayOfWeek || !startTime || !endTime || !duration) {
        return next(new ErrorHandler("Please fill all required fields", 400));
    }

    // Vérifier que le docteur a un clinicId
    if (!req.user.clinicId) {
        return next(new ErrorHandler("Doctor must be assigned to a clinic", 400));
    }

    // Vérifier qu'il n'y a pas déjà un horaire pour ce jour
    const existingSchedule = await Schedule.findOne({
        doctorId: req.user._id,
        dayOfWeek,
        clinicId: req.user.clinicId
    });

    if (existingSchedule) {
        return next(new ErrorHandler(`Schedule already exists for ${dayOfWeek}`, 400));
    }

    const schedule = await Schedule.create({
        doctorId: req.user._id,
        dayOfWeek,
        startTime,
        endTime,
        duration: duration || 30,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        clinicId: req.user.clinicId,
    });

    res.status(201).json({
        success: true,
        message: "Schedule created successfully",
        schedule,
    });
});

// GET /api/v1/schedule/doctor/:doctorId - Récupérer les horaires d'un docteur
export const getDoctorSchedules = chatchAsyncErrors(async (req, res, next) => {
    const { doctorId } = req.params;

    // Vérifier les permissions
    if (req.user.role === "Doctor" && req.user._id.toString() !== doctorId) {
        return next(new ErrorHandler("You can only view your own schedule", 403));
    }

    // Admin/Receptionist peut voir les horaires des docteurs de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.clinicId?.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only view schedules of doctors in your clinic", 403));
        }
    }

    const schedules = await Schedule.find({ doctorId }).sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
        success: true,
        message: "Schedules fetched successfully",
        schedules,
    });
});

// GET /api/v1/schedule/my-schedule - Récupérer mes horaires (Doctor)
export const getMySchedule = chatchAsyncErrors(async (req, res, next) => {
    if (req.user.role !== "Doctor") {
        return next(new ErrorHandler("Only doctors can view their schedule", 403));
    }

    const schedules = await Schedule.find({ doctorId: req.user._id })
        .sort({ dayOfWeek: 1, startTime: 1 });

    res.status(200).json({
        success: true,
        message: "Your schedule fetched successfully",
        schedules,
    });
});

// GET /api/v1/schedule/available/:doctorId - Horaires disponibles pour une date
export const getAvailableSlots = chatchAsyncErrors(async (req, res, next) => {
    const { doctorId } = req.params;
    const { date } = req.query; // Format: YYYY-MM-DD

    if (!date) {
        return next(new ErrorHandler("Date is required (format: YYYY-MM-DD)", 400));
    }

    const selectedDate = new Date(date);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Récupérer le schedule pour ce jour
    const schedule = await Schedule.findOne({
        doctorId,
        dayOfWeek,
        isAvailable: true,
    });

    if (!schedule) {
        return res.status(200).json({
            success: true,
            message: "No available slots for this day",
            availableSlots: [],
        });
    }

    // Récupérer les appointments existants pour cette date
    const { Appointment } = await import("../models/appointmentSchema.js");
    const existingAppointments = await Appointment.find({
        doctorId,
        appointment_date: date,
        status: { $in: ["Pending", "Accepted"] },
    });

    // Générer les créneaux disponibles
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    const duration = schedule.duration;

    const availableSlots = [];
    let currentHour = startHour;
    let currentMinute = startMinute;

    while (
        currentHour < endHour ||
        (currentHour === endHour && currentMinute + duration <= endMinute)
    ) {
        const slotTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
        const slotDateTime = `${date} ${slotTime}`;

        // Vérifier si ce créneau est déjà pris
        const isBooked = existingAppointments.some(apt => {
            const aptTime = apt.appointment_date.split(' ')[1] || apt.appointment_date;
            return aptTime === slotTime;
        });

        if (!isBooked) {
            availableSlots.push({
                time: slotTime,
                dateTime: slotDateTime,
                duration: duration,
            });
        }

        // Passer au créneau suivant
        currentMinute += duration;
        if (currentMinute >= 60) {
            currentHour += Math.floor(currentMinute / 60);
            currentMinute = currentMinute % 60;
        }
    }

    res.status(200).json({
        success: true,
        message: "Available slots fetched successfully",
        availableSlots,
        schedule: {
            dayOfWeek: schedule.dayOfWeek,
            startTime: schedule.startTime,
            endTime: schedule.endTime,
            duration: schedule.duration,
        },
    });
});

// PUT /api/v1/schedule/:id - Modifier un horaire
export const updateSchedule = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
        return next(new ErrorHandler("Schedule not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Doctor" && schedule.doctorId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only update your own schedule", 403));
    }

    // Admin/Receptionist peut modifier les horaires des docteurs de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (schedule.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only update schedules in your clinic", 403));
        }
    }

    const updatedSchedule = await Schedule.findByIdAndUpdate(id, req.body, {
        new: true,
        runValidators: true,
    });

    res.status(200).json({
        success: true,
        message: "Schedule updated successfully",
        schedule: updatedSchedule,
    });
});

// DELETE /api/v1/schedule/:id - Supprimer un horaire
export const deleteSchedule = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const schedule = await Schedule.findById(id);
    if (!schedule) {
        return next(new ErrorHandler("Schedule not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Doctor" && schedule.doctorId.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only delete your own schedule", 403));
    }

    // Admin/Receptionist peut supprimer les horaires des docteurs de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (schedule.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only delete schedules in your clinic", 403));
        }
    }

    await schedule.deleteOne();

    res.status(200).json({
        success: true,
        message: "Schedule deleted successfully",
    });
});

