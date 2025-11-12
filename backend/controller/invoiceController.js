import { chatchAsyncErrors } from "../middelwares/catchAsyncErrors.js";
import ErrorHandler from "../middelwares/errorMidelware.js";
import { Invoice } from "../models/invoiceSchema.js";
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

// POST /api/v1/invoice/create - Créer une facture (Admin/Receptionist seulement)
export const createInvoice = chatchAsyncErrors(async (req, res, next) => {
    // Seul Admin ou Receptionist peut créer une facture
    if (req.user.role !== "Admin" && req.user.role !== "Receptionist") {
        return next(new ErrorHandler("Only Admin and Receptionist can create invoices", 403));
    }

    const {
        patientId,
        appointmentId,
        items,
        tax,
        discount,
        dueDate,
        notes,
    } = req.body;

    if (!patientId || !items || !Array.isArray(items) || items.length === 0) {
        return next(new ErrorHandler("Patient ID and at least one item are required", 400));
    }

    // Vérifier que le patient existe
    const patient = await User.findById(patientId);
    if (!patient || patient.role !== "Patient") {
        return next(new ErrorHandler("Patient not found", 404));
    }

    // Vérifier que l'utilisateur a un clinicId
    if (!req.user.clinicId) {
        return next(new ErrorHandler("You must be assigned to a clinic", 400));
    }

    // Calculer le subtotal
    const subtotal = items.reduce((sum, item) => {
        const itemTotal = item.quantity * item.unitPrice;
        item.total = itemTotal;
        return sum + itemTotal;
    }, 0);

    // Calculer le total
    const taxAmount = tax || 0;
    const discountAmount = discount || 0;
    const total = subtotal + taxAmount - discountAmount;

    if (total < 0) {
        return next(new ErrorHandler("Total cannot be negative", 400));
    }

    // Générer un numéro de facture unique
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Compter toutes les factures existantes pour générer un numéro unique
    const totalCount = await Invoice.countDocuments();
    
    // Utiliser un timestamp pour garantir l'unicité en cas de création simultanée
    const timestamp = Date.now().toString().slice(-6); // 6 derniers chiffres
    const sequence = String(totalCount + 1).padStart(4, '0');
    const invoiceNumber = `INV-${year}-${month}${day}-${sequence}`;

    const invoice = await Invoice.create({
        invoiceNumber,
        patientId,
        appointmentId: appointmentId || null,
        items,
        subtotal,
        tax: taxAmount,
        discount: discountAmount,
        total,
        dueDate: dueDate ? new Date(dueDate) : null,
        notes: notes || "",
        clinicId: req.user.clinicId,
        createdBy: req.user._id,
        status: "Pending",
    });

    res.status(201).json({
        success: true,
        message: "Invoice created successfully",
        invoice,
    });
});

// GET /api/v1/invoice/patient/my-invoices - Mes factures (Patient)
export const getMyInvoices = chatchAsyncErrors(async (req, res, next) => {
    // Seul un Patient peut voir ses propres factures
    if (req.user.role !== "Patient") {
        return next(new ErrorHandler("Only patients can view their invoices", 403));
    }

    const invoices = await Invoice.find({ patientId: req.user._id })
        .populate("createdBy", "firstName lastName")
        .populate("appointmentId", "appointment_date")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Invoices fetched successfully",
        invoices,
    });
});

// GET /api/v1/invoice/patient/:patientId - Factures d'un patient (Admin/Receptionist)
export const getPatientInvoices = chatchAsyncErrors(async (req, res, next) => {
    const { patientId } = req.params;

    // Si c'est un Patient, utiliser getMyInvoices
    if (req.user.role === "Patient") {
        return getMyInvoices(req, res, next);
    }

    // Admin/Receptionist peut voir les factures des patients de sa clinique
    let query = { patientId };
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        query.clinicId = req.user.clinicId;
    }

    const invoices = await Invoice.find(query)
        .populate("createdBy", "firstName lastName")
        .populate("appointmentId", "appointment_date")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Invoices fetched successfully",
        invoices,
    });
});

// GET /api/v1/invoice/:id - Détails d'une facture
export const getInvoiceById = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
        .populate("patientId", "firstName lastName email phone CIN")
        .populate("createdBy", "firstName lastName")
        .populate("appointmentId", "appointment_date department")
        .populate("clinicId", "name address phone email");

    if (!invoice) {
        return next(new ErrorHandler("Invoice not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Patient" && invoice.patientId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only view your own invoices", 403));
    }

    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (invoice.clinicId._id.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only view invoices in your clinic", 403));
        }
    }

    res.status(200).json({
        success: true,
        message: "Invoice fetched successfully",
        invoice,
    });
});

// PUT /api/v1/invoice/:id/payment - Enregistrer un paiement
export const addPayment = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;
    const { amount, paymentMethod, transactionId, notes } = req.body;

    if (!amount || !paymentMethod) {
        return next(new ErrorHandler("Amount and payment method are required", 400));
    }

    const invoice = await Invoice.findById(id);
    if (!invoice) {
        return next(new ErrorHandler("Invoice not found", 404));
    }

    // Vérifier les permissions
    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (invoice.clinicId.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only add payments to invoices in your clinic", 403));
        }
    }

    // Ajouter le paiement
    const payment = {
        amount: Number(amount),
        paymentMethod,
        transactionId: transactionId || null,
        notes: notes || "",
        paymentDate: new Date(),
    };

    invoice.payments.push(payment);

    // Calculer le total payé
    const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);

    // Mettre à jour le statut
    if (totalPaid >= invoice.total) {
        invoice.status = "Paid";
    } else if (totalPaid > 0) {
        invoice.status = "Partially Paid";
    } else {
        invoice.status = "Pending";
    }

    await invoice.save();

    res.status(200).json({
        success: true,
        message: "Payment added successfully",
        invoice,
        totalPaid,
        remaining: invoice.total - totalPaid,
    });
});

// GET /api/v1/invoice/:id/pdf - Télécharger PDF facture
export const downloadInvoicePDF = chatchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const invoice = await Invoice.findById(id)
        .populate("patientId", "firstName lastName email phone CIN")
        .populate("clinicId", "name address phone email")
        .populate("createdBy", "firstName lastName");

    if (!invoice) {
        return next(new ErrorHandler("Invoice not found", 404));
    }

    // Vérifier les permissions
    if (req.user.role === "Patient" && invoice.patientId._id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You can only download your own invoices", 403));
    }

    if ((req.user.role === "Admin" || req.user.role === "Receptionist") && req.user.clinicId) {
        if (invoice.clinicId._id.toString() !== req.user.clinicId.toString()) {
            return next(new ErrorHandler("You can only download invoices in your clinic", 403));
        }
    }

    // Si le PDF existe déjà sur Cloudinary, le télécharger et le servir
    if (invoice.pdfUrl) {
        try {
            // Télécharger le PDF depuis Cloudinary
            const response = await fetch(invoice.pdfUrl);
            if (!response.ok) {
                throw new Error("Failed to fetch PDF from Cloudinary");
            }
            const pdfBuffer = await response.arrayBuffer();
            
            // Servir le PDF directement
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
            res.send(Buffer.from(pdfBuffer));
            return;
        } catch (error) {
            // Si l'URL Cloudinary ne fonctionne pas, générer un nouveau PDF
            console.log("Failed to fetch from Cloudinary, generating new PDF:", error.message);
        }
    }

    // Générer le PDF (si pdfkit est installé)
    try {
        const PDFDocument = await loadPDFKit();
        if (!PDFDocument) {
            return next(new ErrorHandler("PDF generation is not available. Please install pdfkit: npm install pdfkit", 503));
        }
        
        // Générer le PDF et le servir directement
        const pdfBuffer = await generateInvoicePDFBuffer(invoice, PDFDocument);
        
        // Sauvegarder l'URL si elle n'existe pas
        if (!invoice.pdfUrl) {
            invoice.pdfUrl = await uploadPDFToCloudinary(pdfBuffer, `invoice-${invoice._id}.pdf`, "invoices");
            await invoice.save();
        }
        
        // Servir le PDF directement
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.invoiceNumber}.pdf"`);
        res.send(pdfBuffer);
    } catch (error) {
        return next(new ErrorHandler("Error generating PDF: " + error.message, 500));
    }
});

// Fonction pour générer le PDF en mémoire (buffer)
const generateInvoicePDFBuffer = async (invoice, PDFDocument) => {
    if (!PDFDocument) {
        throw new Error("PDFKit is not installed. Please run: npm install pdfkit");
    }
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const chunks = [];
        
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => resolve(Buffer.concat(chunks)));
        doc.on('error', reject);

        // En-tête
        doc.fontSize(20).text("FACTURE", { align: "center" });
        doc.moveDown();

        // Informations de la clinique
        if (invoice.clinicId) {
            doc.fontSize(12).text(invoice.clinicId.name, { align: "center" });
            doc.text(invoice.clinicId.address, { align: "center" });
            doc.text(`Tél: ${invoice.clinicId.phone}`, { align: "center" });
            doc.text(`Email: ${invoice.clinicId.email}`, { align: "center" });
            doc.moveDown();
        }

        // Numéro de facture et date
        doc.fontSize(10);
        doc.text(`Facture N°: ${invoice.invoiceNumber}`, { align: "right" });
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, { align: "right" });
        doc.moveDown(2);

        // Informations patient
        doc.fontSize(14).text("FACTURÉ À", { underline: true });
        doc.fontSize(12);
        doc.text(`Nom: ${invoice.patientId.firstName} ${invoice.patientId.lastName || ""}`);
        doc.text(`CIN: ${invoice.patientId.CIN}`);
        doc.text(`Email: ${invoice.patientId.email}`);
        if (invoice.patientId.phone) {
            doc.text(`Téléphone: ${invoice.patientId.phone}`);
        }
        doc.moveDown(2);

        // Table des items
        doc.fontSize(14).text("DÉTAILS", { underline: true });
        doc.moveDown();

        // En-têtes du tableau
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text("Description", 50, tableTop);
        doc.text("Qté", 300, tableTop);
        doc.text("Prix unit.", 350, tableTop);
        doc.text("Total", 450, tableTop);
        doc.moveDown();

        // Lignes des items
        let y = doc.y;
        invoice.items.forEach((item) => {
            doc.text(item.description, 50, y, { width: 240 });
            doc.text(item.quantity.toString(), 300, y);
            doc.text(`${item.unitPrice.toFixed(2)} TND`, 350, y);
            doc.text(`${item.total.toFixed(2)} TND`, 450, y);
            y += 20;
        });

        doc.y = y + 10;

        // Totaux
        doc.moveDown();
        doc.text(`Sous-total: ${invoice.subtotal.toFixed(2)} TND`, { align: "right" });
        if (invoice.tax > 0) {
            doc.text(`Taxe: ${invoice.tax.toFixed(2)} TND`, { align: "right" });
        }
        if (invoice.discount > 0) {
            doc.text(`Remise: -${invoice.discount.toFixed(2)} TND`, { align: "right" });
        }
        doc.fontSize(14).text(`TOTAL: ${invoice.total.toFixed(2)} TND`, { align: "right" });
        doc.moveDown();

        // Paiements
        if (invoice.payments && invoice.payments.length > 0) {
            doc.moveDown();
            doc.fontSize(12).text("PAIEMENTS", { underline: true });
            doc.fontSize(10);
            invoice.payments.forEach((payment) => {
                doc.text(
                    `${new Date(payment.paymentDate).toLocaleDateString('fr-FR')} - ${payment.paymentMethod}: ${payment.amount.toFixed(2)} TND`
                );
            });
            const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            doc.moveDown();
            doc.text(`Total payé: ${totalPaid.toFixed(2)} TND`, { align: "right" });
            doc.text(`Reste à payer: ${(invoice.total - totalPaid).toFixed(2)} TND`, { align: "right" });
        }

        // Statut
        doc.moveDown();
        doc.fontSize(12).text(`Statut: ${invoice.status}`, { align: "right" });

        // Notes
        if (invoice.notes) {
            doc.moveDown(2);
            doc.fontSize(10).text("Notes:", { underline: true });
            doc.text(invoice.notes);
        }

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

// Fonction pour générer le PDF de la facture (ancienne version - gardée pour compatibilité)
const generateInvoicePDF = async (invoice, PDFDocument) => {
    if (!PDFDocument) {
        throw new Error("PDFKit is not installed. Please run: npm install pdfkit");
    }
    
    return new Promise((resolve, reject) => {
        const doc = new PDFDocument({ margin: 50 });
        const fileName = `invoice-${invoice._id}.pdf`;
        const filePath = path.join(process.cwd(), "temp", fileName);

        // Créer le dossier temp s'il n'existe pas
        const tempDir = path.join(process.cwd(), "temp");
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);

        // En-tête
        doc.fontSize(20).text("FACTURE", { align: "center" });
        doc.moveDown();

        // Informations de la clinique
        if (invoice.clinicId) {
            doc.fontSize(12).text(invoice.clinicId.name, { align: "center" });
            doc.text(invoice.clinicId.address, { align: "center" });
            doc.text(`Tél: ${invoice.clinicId.phone}`, { align: "center" });
            doc.text(`Email: ${invoice.clinicId.email}`, { align: "center" });
            doc.moveDown();
        }

        // Numéro de facture et date
        doc.fontSize(10);
        doc.text(`Facture N°: ${invoice.invoiceNumber}`, { align: "right" });
        doc.text(`Date: ${new Date(invoice.createdAt).toLocaleDateString('fr-FR')}`, { align: "right" });
        doc.moveDown(2);

        // Informations patient
        doc.fontSize(14).text("FACTURÉ À", { underline: true });
        doc.fontSize(12);
        doc.text(`Nom: ${invoice.patientId.firstName} ${invoice.patientId.lastName || ""}`);
        doc.text(`CIN: ${invoice.patientId.CIN}`);
        doc.text(`Email: ${invoice.patientId.email}`);
        if (invoice.patientId.phone) {
            doc.text(`Téléphone: ${invoice.patientId.phone}`);
        }
        doc.moveDown(2);

        // Table des items
        doc.fontSize(14).text("DÉTAILS", { underline: true });
        doc.moveDown();

        // En-têtes du tableau
        const tableTop = doc.y;
        doc.fontSize(10);
        doc.text("Description", 50, tableTop);
        doc.text("Qté", 300, tableTop);
        doc.text("Prix unit.", 350, tableTop);
        doc.text("Total", 450, tableTop);
        doc.moveDown();

        // Lignes des items
        let y = doc.y;
        invoice.items.forEach((item) => {
            doc.text(item.description, 50, y, { width: 240 });
            doc.text(item.quantity.toString(), 300, y);
            doc.text(`${item.unitPrice.toFixed(2)} TND`, 350, y);
            doc.text(`${item.total.toFixed(2)} TND`, 450, y);
            y += 20;
        });

        doc.y = y + 10;

        // Totaux
        doc.moveDown();
        doc.text(`Sous-total: ${invoice.subtotal.toFixed(2)} TND`, { align: "right" });
        if (invoice.tax > 0) {
            doc.text(`Taxe: ${invoice.tax.toFixed(2)} TND`, { align: "right" });
        }
        if (invoice.discount > 0) {
            doc.text(`Remise: -${invoice.discount.toFixed(2)} TND`, { align: "right" });
        }
        doc.fontSize(14).text(`TOTAL: ${invoice.total.toFixed(2)} TND`, { align: "right" });
        doc.moveDown();

        // Paiements
        if (invoice.payments && invoice.payments.length > 0) {
            doc.moveDown();
            doc.fontSize(12).text("PAIEMENTS", { underline: true });
            doc.fontSize(10);
            invoice.payments.forEach((payment) => {
                doc.text(
                    `${new Date(payment.paymentDate).toLocaleDateString('fr-FR')} - ${payment.paymentMethod}: ${payment.amount.toFixed(2)} TND`
                );
            });
            const totalPaid = invoice.payments.reduce((sum, p) => sum + p.amount, 0);
            doc.moveDown();
            doc.text(`Total payé: ${totalPaid.toFixed(2)} TND`, { align: "right" });
            doc.text(`Reste à payer: ${(invoice.total - totalPaid).toFixed(2)} TND`, { align: "right" });
        }

        // Statut
        doc.moveDown();
        doc.fontSize(12).text(`Statut: ${invoice.status}`, { align: "right" });

        // Notes
        if (invoice.notes) {
            doc.moveDown(2);
            doc.fontSize(10).text("Notes:", { underline: true });
            doc.text(invoice.notes);
        }

        doc.end();

        stream.on("finish", async () => {
            try {
                // Upload vers Cloudinary (public pour permettre le téléchargement)
                const result = await cloudinary.v2.uploader.upload(filePath, {
                    resource_type: "raw",
                    folder: "invoices",
                    format: "pdf",
                    access_mode: "public",
                    type: "upload",
                });

                // Supprimer le fichier temporaire
                fs.unlinkSync(filePath);

                resolve(result.secure_url);
            } catch (error) {
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
    });
};

// GET /api/v1/invoice - Liste des factures (Admin/Receptionist)
export const getAllInvoices = chatchAsyncErrors(async (req, res, next) => {
    // Seul Admin ou Receptionist peut voir toutes les factures
    if (req.user.role !== "Admin" && req.user.role !== "Receptionist") {
        return next(new ErrorHandler("Only Admin and Receptionist can view all invoices", 403));
    }

    if (!req.user.clinicId) {
        return next(new ErrorHandler("You must be assigned to a clinic", 400));
    }

    const { status, patientId } = req.query;
    let query = { clinicId: req.user.clinicId };

    if (status) {
        query.status = status;
    }

    if (patientId) {
        query.patientId = patientId;
    }

    const invoices = await Invoice.find(query)
        .populate("patientId", "firstName lastName email")
        .populate("createdBy", "firstName lastName")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        message: "Invoices fetched successfully",
        invoices,
    });
});

