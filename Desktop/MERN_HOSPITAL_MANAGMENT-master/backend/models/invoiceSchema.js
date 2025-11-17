import mongoose from "mongoose";

const invoiceItemSchema = new mongoose.Schema({
    description: {
        type: String,
        required: true,
        minlength: [3, "Description must be at least 3 characters long"],
    },
    quantity: {
        type: Number,
        required: true,
        min: [1, "Quantity must be at least 1"],
    },
    unitPrice: {
        type: Number,
        required: true,
        min: [0, "Unit price cannot be negative"],
    },
    total: {
        type: Number,
        required: true,
        min: [0, "Total cannot be negative"],
    },
}, { _id: false });

const paymentSchema = new mongoose.Schema({
    amount: {
        type: Number,
        required: true,
        min: [0, "Payment amount cannot be negative"],
    },
    paymentMethod: {
        type: String,
        required: true,
        enum: ["Cash", "Credit Card", "Debit Card", "Bank Transfer", "Check", "Other"],
    },
    paymentDate: {
        type: Date,
        required: true,
        default: Date.now,
    },
    transactionId: {
        type: String,
        required: false,
        // ID de transaction pour paiement en ligne
    },
    notes: {
        type: String,
        required: false,
    },
}, { _id: false, timestamps: true });

const invoiceSchema = new mongoose.Schema({
    invoiceNumber: {
        type: String,
        required: true, // Généré dans le contrôleur avant création
        unique: true,
        // Format: "INV-YYYY-MMDD-NNNN" (ex: "INV-2024-1101-0001")
    },
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Patient ID is required"],
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Appointment",
        // Optionnel, car une facture peut être créée indépendamment
    },
    items: {
        type: [invoiceItemSchema],
        required: true,
        validate: {
            validator: function(v) {
                return v && v.length > 0;
            },
            message: "At least one item is required"
        }
    },
    subtotal: {
        type: Number,
        required: true,
        min: [0, "Subtotal cannot be negative"],
    },
    tax: {
        type: Number,
        default: 0,
        min: [0, "Tax cannot be negative"],
    },
    discount: {
        type: Number,
        default: 0,
        min: [0, "Discount cannot be negative"],
    },
    total: {
        type: Number,
        required: true,
        min: [0, "Total cannot be negative"],
    },
    status: {
        type: String,
        enum: ["Pending", "Partially Paid", "Paid", "Cancelled"],
        default: "Pending",
    },
    payments: {
        type: [paymentSchema],
        default: [],
    },
    dueDate: {
        type: Date,
        required: false,
    },
    notes: {
        type: String,
        required: false,
        maxlength: [500, "Notes must be at most 500 characters long"],
    },
    clinicId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Clinic",
        required: [true, "Clinic ID is required"],
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: [true, "Creator ID is required"],
        // Receptionist ou Admin qui a créé la facture
    },
}, {
    timestamps: true,
});

// Index pour améliorer les performances
invoiceSchema.index({ patientId: 1 });
invoiceSchema.index({ clinicId: 1 });
invoiceSchema.index({ invoiceNumber: 1 });
invoiceSchema.index({ status: 1 });
invoiceSchema.index({ createdAt: -1 });

// Le numéro de facture est généré dans le contrôleur avant la création
// pour éviter les problèmes de timing avec les hooks

export const Invoice = mongoose.model("Invoice", invoiceSchema);

