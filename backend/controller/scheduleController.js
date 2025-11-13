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

    const { dayOfWeek, date, startTime, endTime, duration, isAvailable } = req.body;

    if ((!dayOfWeek && !date) || !startTime || !endTime || !duration) {
        return next(new ErrorHandler("Please fill all required fields (dayOfWeek or date, startTime, endTime, duration)", 400));
    }

    // Vérifier que le docteur a un clinicId
    if (!req.user.clinicId) {
        return next(new ErrorHandler("Doctor must be assigned to a clinic", 400));
    }

    // Construire la query pour vérifier les conflits
    // Si date est fourni, vérifier cette date spécifique
    // Si dayOfWeek est fourni, vérifier ce jour de la semaine
    const conflictQuery = {
        doctorId: req.user._id,
        clinicId: req.user.clinicId,
        startTime,
        endTime
    };
    
    if (date) {
        // Pour une date spécifique, vérifier qu'il n'y a pas déjà un créneau avec les mêmes heures
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        const nextDay = new Date(dateObj);
        nextDay.setDate(nextDay.getDate() + 1);
        
        conflictQuery.date = {
            $gte: dateObj,
            $lt: nextDay
        };
    } else if (dayOfWeek) {
        // Pour un jour de la semaine, vérifier qu'il n'y a pas déjà un créneau avec les mêmes heures
        conflictQuery.dayOfWeek = dayOfWeek;
    }

    // Vérifier qu'il n'y a pas déjà un horaire avec les mêmes heures pour ce jour/date
    const existingSchedule = await Schedule.findOne(conflictQuery);

    if (existingSchedule) {
        const conflictInfo = date ? `date ${date}` : dayOfWeek;
        return next(new ErrorHandler(`Schedule already exists for ${conflictInfo} with the same time slot (${startTime} - ${endTime})`, 400));
    }

    // Préparer les données pour la création
    const scheduleData = {
        doctorId: req.user._id,
        startTime,
        endTime,
        duration: duration || 30,
        isAvailable: isAvailable !== undefined ? isAvailable : true,
        clinicId: req.user.clinicId,
    };
    
    // Ajouter date ou dayOfWeek selon ce qui est fourni
    if (date) {
        const dateObj = new Date(date);
        dateObj.setHours(0, 0, 0, 0);
        scheduleData.date = dateObj;
        // Calculer aussi le dayOfWeek pour faciliter les recherches
        scheduleData.dayOfWeek = dateObj.toLocaleDateString('en-US', { weekday: 'long' });
    } else if (dayOfWeek) {
        scheduleData.dayOfWeek = dayOfWeek;
    }

    const schedule = await Schedule.create(scheduleData);

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

    const schedules = await Schedule.find({ doctorId })
        .sort({ 
            date: 1, // Trier par date d'abord si disponible
            dayOfWeek: 1, 
            startTime: 1 
        });

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
        .sort({ 
            date: 1, // Trier par date d'abord si disponible
            dayOfWeek: 1, 
            startTime: 1 
        });

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
    selectedDate.setHours(0, 0, 0, 0);
    const nextDay = new Date(selectedDate);
    nextDay.setDate(nextDay.getDate() + 1);
    const dayOfWeek = selectedDate.toLocaleDateString('en-US', { weekday: 'long' });

    // Récupérer TOUS les schedules pour cette date spécifique OU ce jour de la semaine
    // Priorité aux dates spécifiques
    const schedules = await Schedule.find({
        doctorId,
        $or: [
            // Schedules avec date spécifique pour cette date
            {
                date: {
                    $gte: selectedDate,
                    $lt: nextDay
                },
                isAvailable: true
            },
            // Schedules avec dayOfWeek (rétrocompatibilité)
            {
                dayOfWeek: dayOfWeek,
                date: { $exists: false }, // Pas de date spécifique
                isAvailable: true
            }
        ]
    }).sort({ startTime: 1 });

    if (!schedules || schedules.length === 0) {
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
        appointment_date: { $regex: `^${date}` }, // Chercher les appointments qui commencent par cette date
        status: { $in: ["Pending", "Accepted"] },
    });

    // Générer les créneaux disponibles pour TOUS les schedules de ce jour
    const availableSlots = [];
    
    schedules.forEach(schedule => {
        const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
        const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
        const duration = schedule.duration;

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
                // Extraire l'heure de l'appointment
                let aptTime = '';
                if (apt.appointment_date) {
                    if (apt.appointment_date.includes('T')) {
                        aptTime = apt.appointment_date.split('T')[1]?.substring(0, 5) || '';
                    } else if (apt.appointment_date.includes(' ')) {
                        aptTime = apt.appointment_date.split(' ')[1]?.substring(0, 5) || '';
                    }
                }
                return aptTime === slotTime;
            });

            if (!isBooked) {
                // Vérifier que ce créneau n'est pas déjà dans la liste (éviter les doublons)
                if (!availableSlots.some(slot => slot.time === slotTime)) {
                    availableSlots.push({
                        time: slotTime,
                        dateTime: slotDateTime,
                        duration: duration,
                    });
                }
            }

            // Passer au créneau suivant
            currentMinute += duration;
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }
        }
    });

    // Trier les créneaux par heure
    availableSlots.sort((a, b) => {
        const [hourA, minA] = a.time.split(':').map(Number);
        const [hourB, minB] = b.time.split(':').map(Number);
        if (hourA !== hourB) return hourA - hourB;
        return minA - minB;
    });

    res.status(200).json({
        success: true,
        message: "Available slots fetched successfully",
        availableSlots,
        schedules: schedules.map(s => ({
            dayOfWeek: s.dayOfWeek,
            startTime: s.startTime,
            endTime: s.endTime,
            duration: s.duration,
        })),
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

