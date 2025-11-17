import mongoose from "mongoose";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { User } from "../models/userSchema.js";

// Obtenir le chemin du répertoire actuel (pour ES modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Charger les variables d'environnement (chemin relatif au script)
config({ path: join(__dirname, "../config/config.env") });

const seedSuperAdmin = async () => {
    try {
        // Connexion à MongoDB
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB");

        // Vérifier si un SuperAdmin existe déjà
        const existingSuperAdmin = await User.findOne({ role: "SuperAdmin" });
        
        if (existingSuperAdmin) {
            console.log("⚠️  SuperAdmin already exists:");
            console.log(`   Email: ${existingSuperAdmin.email}`);
            console.log(`   Name: ${existingSuperAdmin.firstName} ${existingSuperAdmin.lastName}`);
            console.log(`   ID: ${existingSuperAdmin._id}`);
            await mongoose.connection.close();
            return;
        }

        // Créer le SuperAdmin initial
        const superAdmin = await User.create({
            firstName: "Super",
            lastName: "Admin",
            phone: "12345678",
            CIN: "12345678",
            email: "superadmin@zeecare.com",
            dob: new Date("1990-01-01"),
            gender: "Male",
            password: "SuperAdmin123", // Le password sera hashé automatiquement par le hook pre("save")
            role: "SuperAdmin",
            // clinicId n'est pas requis pour SuperAdmin
        });

        console.log("✅ SuperAdmin created successfully!");
        console.log("📧 Email:", superAdmin.email);
        console.log("🔑 Password: SuperAdmin123");
        console.log("⚠️  IMPORTANT: Change this password after first login!");
        console.log("👤 Name:", `${superAdmin.firstName} ${superAdmin.lastName}`);
        console.log("🆔 ID:", superAdmin._id);

        // Fermer la connexion
        await mongoose.connection.close();
        console.log("✅ Database connection closed");
        
    } catch (error) {
        console.error("❌ Error seeding SuperAdmin:", error.message);
        if (error.code === 11000) {
            console.error("   Duplicate key error - SuperAdmin with this email already exists");
        }
        await mongoose.connection.close();
        process.exit(1);
    }
};

// Exécuter le script
seedSuperAdmin();

