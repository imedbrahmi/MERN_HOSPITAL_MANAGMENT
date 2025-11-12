import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { Prescription } from "../models/prescriptionSchema.js";
import { User } from "../models/userSchema.js";
import { Clinic } from "../models/clinicSchema.js";
import cloudinary from "cloudinary";
import fs from "fs";
import path from "path";

// Fonction helper pour charger pdfkit dynamiquement
const loadPDFKit = async () => {
    try {
        const pdfkitModule = await import("pdfkit");
        return pdfkitModule.default || pdfkitModule;
    } catch (error) {
        console.warn("PDFKit not installed. PDF generation will be disabled. Run: npm install pdfkit");
        return null;
    }
};

// POST /api/v1/prescription/create - Créer une ordonnance (Doctor seulement)
export const createPrescription = chatchAsyncErrors(async (req, res, next) => {
    // Seul un Doctor peut créer une ordonnance
    if (req.user.role !== "Doctor") {
        return next(new ErrorHandler("Only doctors can create prescriptions", 403));
    }

    const {
        patientId,
        appointmentId,
        medicalRecordId,
        medications,
        notes,
    } = req.body;

    if (!patientId || !medications || !Array.isArray(medications) || medications.length === 0) {
        return next(new ErrorHandler("Patient ID and at least one medication are required", 400));
    }

    // Vérifier que le patient existe
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "Patient") {
        return next(new ErrorHandler("Patient not found", 404));
    }

    // Vérifier que le docteur a un clinicId
    if (!req.user.clinicId) {
        return next(new ErrorHandler("Doctor must be assigned to a clinic", 400));
    }

    const prescription = await Prescription.create({
        patientId,
        doctorId: req.user._id,
        appointmentId: appointmentId || null,
        medicalRecordId: medicalRecordId || null,
        medications,
        notes: notes || "",
        clinicId: req.user.clinicId,
    });

    // Générer le PDF (si pdfkit est installé)
    try {
        const PDFDocument = await loadPDFKit();
        if (PDFDocument) {
            const pdfUrl = await generatePrescriptionPDF(prescription, patient, req.user, PDFDocument);
            prescription.pdfUrl = pdfUrl.url;
            prescription.pdfPublicId = pdfUrl.public_id;
            await prescription.save();
        }
    } catch (error) {
        console.error("Error generating PDF:", error);
        // On continue même si le PDF échoue
    }

    res.status(201).json({
        success: true,
        message: "Prescription created successfully",
        prescription,
    });
});

// Fonction pour générer le PDF en mémoire (buffer)
const generatePrescriptionPDFBuffer = async (prescription, patient, doctor, PDFDocument) => {
    if (!PDFDocument) {
        throw new Error("PDFKit is not installed. Please run: npm install pdfkit");
    }
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        doc.fontSize(25).text("Ordonnance Médicale", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text(`Date: ${new Date(prescription.prescriptionDate).toLocaleDateString('fr-FR')}`);
        doc.moveDown();

        doc.fontSize(14).text("Informations Patient:");
        doc.fontSize(12).text(`Nom: ${patient.firstName} ${patient.lastName || ""}`);
        doc.text(`Email: ${patient.email}`);
        if (patient.phone) {
            doc.text(`Téléphone: ${patient.phone}`);
        }
        doc.moveDown();

        doc.fontSize(14).text("Informations Médecin:");
        doc.fontSize(12).text(`Dr. ${doctor.firstName} ${doctor.lastName || ""}`);
        if (doctor.doctorDepartment) {
            doc.text(`Département: ${doctor.doctorDepartment}`);
        }
        doc.moveDown();

        doc.fontSize(14).text("Médicaments:");
        prescription.medications.forEach((med, index) => {
            doc.fontSize(12).text(`${index + 1}. ${med.name} - ${med.dosage} - ${med.frequency}`);
            if (med.duration) {
                doc.text(`   Durée: ${med.duration}`);
            }
            if (med.instructions) {
                doc.text(`   Instructions: ${med.instructions}`);
            }
            doc.moveDown();
        });

        if (prescription.notes) {
            doc.moveDown();
            doc.fontSize(14).text("Notes:");
            doc.fontSize(12).text(prescription.notes);
            doc.moveDown();
        }

        doc.moveDown(3);
        doc.text("Signature du médecin: ___________________", { align: "right" });

        doc.end();
    });
};

// Fonction pour uploader un buffer PDF vers Cloudinary
const uploadPDFToCloudinary = async (pdfBuffer, fileName, folder) => {
    return new Promise((resolve, reject) => {
        const tempFilePath = path.join(process.cwd(), "temp", fileName);
        const tempDir = path.join(process.cwd(), "temp");
        
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }
        
        fs.writeFileSync(tempFilePath, pdfBuffer);
        
        cloudinary.v2.uploader.upload(tempFilePath, {
            resource_type: "raw",
            folder: folder,
            format: "pdf",
            access_mode: "public",
            type: "upload",
        })
        .then(result => {
            fs.unlinkSync(tempFilePath);
            resolve(result.secure_url);
        })
        .catch(error => {
            if (fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }
            reject(error);
        });
    });
};

// Fonction pour générer le PDF de l'ordonnance (ancienne version - gardée pour compatibilité)
const generatePrescriptionPDF = async (prescription, patient, doctor, PDFDocument) => {
    if (!PDFDocument) {
        throw new Error("PDFKit is not installed. Please run: npm install pdfkit");
    }
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `prescription-${prescription._id}.pdf`;
        const filePath = path.join(process.cwd(), "temp", fileName);

        // Créer le dossier temp s'il n'existe pas
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // En-tête
        doc.fontSize(20).text("ORDONNANCE MÉDICALE", { align: "center" });
        doc.moveDown();

        // Informations de la clinique
        Clinic.findById(prescription.clinicId).then(clinic => {
            if (clinic) {
                doc.fontSize(12).text(clinic.name, { align: "center" });
                doc.text(clinic.address, { align: "center" });
                doc.text(`Tél: ${clinic.phone}`, { align: "center" });
                doc.moveDown();
            }

            // Date
            doc.fontSize(10).text(`Date: ${new Date(prescription.prescriptionDate).toLocaleDateString('fr-FR')}`, { align: "right" });
            doc.moveDown(2);

            // Informations patient
            doc.fontSize(14).text("PATIENT", { underline: true });
            doc.fontSize(12);
            doc.text(`Nom: ${patient.firstName} ${patient.lastName || ""}`);
            doc.text(`CIN: ${patient.CIN}`);
            doc.text(`Date de naissance: ${new Date(patient.dob).toLocaleDateString('fr-FR')}`);
            doc.moveDown();

            // Informations docteur
            doc.fontSize(14).text("MÉDECIN", { underline: true });
            doc.fontSize(12);
            doc.text(`Dr. ${doctor.firstName} ${doctor.lastName || ""}`);
            doc.text(`Département: ${doctor.doctorDepartment || "Non spécifié"}`);
            doc.moveDown(2);

            // Médicaments
            doc.fontSize(14).text("MÉDICAMENTS", { underline: true });
            doc.moveDown();
            prescription.medications.forEach((med, index) => {
                doc.fontSize(12).text(`${index + 1}. ${med.name}`, { continued: false });
                doc.fontSize(10);
                doc.text(`   Dosage: ${med.dosage}`);
                doc.text(`   Fréquence: ${med.frequency}`);
                doc.text(`   Durée: ${med.duration}`);
                if (med.instructions) {
                    doc.text(`   Instructions: ${med.instructions}`);
                }
                doc.moveDown();
            });

            // Notes
            if (prescription.notes) {
                doc.moveDown();
                doc.fontSize(12).text("NOTES", { underline: true });
                doc.fontSize(10).text(prescription.notes);
            }

            // Signature
            doc.moveDown(3);
            doc.text("Signature du médecin: ___________________", { align: "right" });

            doc.end();

            stream.on("finish", async () => {
                try {
                    // Upload vers Cloudinary (public pour permettre le téléchargement)
                    const result = await cloudinary.v2.uploader.upload(filePath, {
                        resource_type: "raw",
                        folder: "prescriptions",
                        format: "pdf",
                        access_mode: "public",
                        type: "upload",
                    });

                    // Supprimer le fichier temporaire
                    fs.unlinkSync(filePath);

                    resolve({
                        url: result.secure_url,
                        public_id: result.public_id,
                    });
                } catch (error) {
                    // Supprimer le fichier temporaire même en cas d'erreur
                    if (fs.existsSync(filePath)) {
                        fs.unlinkSync(filePath);
                    }
                    reject(error);
                }
            });

            stream.on("error", (error) => {
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                }
                reject(error);
            });
        }).catch(reject);
    });
};

// GET /api/v1/prescription/patient/:patientId - Ordonnances d'un patient
export const getPatientPrescriptions = chatchAsyncErrors(async (req, res, next) => {
    const { patientId } = req.params;

    // Vérifier les permissions
    if (req.user.role === "Patient" && req.user._id.toString() !== patientId) {
        return next(new ErrorHandler("You can only view your own prescriptions", 403));
    }

    // Doctor peut voir les ordonnances de ses patients
    let query = { patientId };
    if (req.user.role === "Doctor") {
        query.doctorId = req.user._id;
    }

    // Admin/Receptionist peut voir les ordonnances des patients de sa clinique
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        query.clinicId = req.user.clinicId;
    }

    const prescriptions = await Prescription.find(query)
        .populate("doctorId", "firstName lastName doctorDepartment")
        .populate("appointmentId", "appointment_date")
        .sort({ prescriptionDate: -1 });

    res.status(200).json({
        success: true,
        message: "Prescriptions fetched successfully",
        prescriptions,
    });
});

// GET /api/v1/prescription/:id - Détails d'une ordonnance
export const getPrescriptionById = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
        .populate("patientId", "firstName lastName email phone CIN dob gender")
        .populate("doctorId", "firstName lastName doctorDepartment")
        .populate("appointmentId", "appointment_date department")
        .populate("medicalRecordId", "diagnosis visitDate");

    if (!prescription) {
        return next(new ErrorHandler("Prescription not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Patient" && prescription.patientId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only view your own prescriptions", 403));
    }

    if (req.user.role === "Doctor" && prescription.doctorId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only view prescriptions you created", 403));
    }

    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (prescription.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only view prescriptions in your clinic", 403));
        }
    }

    res.status(200).json({
        success: true,
        message: "Prescription fetched successfully",
        prescription,
    });
});

// GET /api/v1/prescription/:id/pdf - Télécharger PDF
export const downloadPrescriptionPDF = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const prescription = await Prescription.findById(id)
        .populate("patientId", "firstName lastName")
        .populate("doctorId", "firstName lastName");

    if (!prescription) {
        return next(new ErrorHandler("Prescription not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Patient" && prescription.patientId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only download your own prescriptions", 403));
    }

    if (req.user.role === "Doctor" && prescription.doctorId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only download prescriptions you created", 403));
    }

    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (prescription.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only download prescriptions in your clinic", 403));
        }
    }

    // Si le PDF existe déjà sur Cloudinary, le télécharger et le servir
    if (prescription.pdfUrl) {
        try {
            // Télécharger le PDF depuis Cloudinary
            const response = await fetch(prescription.pdfUrl);
            if (!response.ok) {
                throw new Error("Failed to fetch PDF from Cloudinary");
            }
            const pdfBuffer = await response.arrayBuffer();
            
            // Servir le PDF directement
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription._id}.pdf"`);
            res.send(Buffer.from(pdfBuffer));
            return;
        } catch (error) {
            // Si l'URL Cloudinary ne fonctionne pas, générer un nouveau PDF
            console.log("Failed to fetch from Cloudinary, generating new PDF:", error.message);
        }
    }

    // Générer le PDF si nécessaire
    try {
        const PDFDocument = await loadPDFKit();
        if (!PDFDocument) {
            return next(new ErrorHandler("PDF generation is not available. Please install pdfkit: npm install pdfkit", 503));
        }
        
        // Récupérer les données nécessaires
        const patient = await User.findById(prescription.patientId);
        const doctor = await User.findById(prescription.doctorId);
        
        if (!patient || !doctor) {
            return next(new ErrorHandler("Patient or Doctor not found", 404));
        }
        
        // Générer le PDF et le servir directement
        const pdfBuffer = await generatePrescriptionPDFBuffer(prescription, patient, doctor, PDFDocument);
        
        // Sauvegarder l'URL si elle n'existe pas
        if (!prescription.pdfUrl) {
            prescription.pdfUrl = await uploadPDFToCloudinary(pdfBuffer, `prescription-${prescription._id}.pdf`, "prescriptions");
            await prescription.save();
        }
        
        // Servir le PDF directement
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="prescription-${prescription._id}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        return next(new ErrorHandler("Error generating PDF: " + error.message, 500));
    }
});

// GET /api/v1/prescription/doctor/:doctorId - Ordonnances créées par un docteur
export const getDoctorPrescriptions = chatchAsyncErrors(async (req, res, next) => {
    const { doctorId } = req.params;

    // Vérifier les permissions
    if (req.user.role === "Doctor" && req.user._id.toString() !== doctorId) {
        return next(new ErrorHandler("You can only view your own prescriptions", 403));
    }

    // Admin/Receptionist peut voir les ordonnances des docteurs de sa clinique
    let query = { doctorId };
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.clinicId?.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only view prescriptions of doctors in your clinic", 403));
        }
        query.clinicId = req.user.clinicId;
    }

    const prescriptions = await Prescription.find(query)
        .populate("patientId", "firstName lastName email")
        .populate("appointmentId", "appointment_date")
        .sort({ prescriptionDate: -1 });

    res.status(200).json({
        success: true,
        message: "Prescriptions fetched successfully",
        prescriptions,
    });
});

