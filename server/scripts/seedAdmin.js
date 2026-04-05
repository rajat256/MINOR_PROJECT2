const mongoose = require("mongoose");
const dotenv = require("dotenv");
const User = require("../models/User");
const path = require("path");

dotenv.config({ path: path.join(__dirname, "../.env") });

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");

        const adminExists = await User.findOne({ email: "admin@farmfresh.com" });
        if (adminExists) {
            console.log("⚠️ Admin user already exists");
            process.exit(0);
        }

        const adminUser = await User.create({
            name: "FarmFresh Admin",
            email: "admin@farmfresh.com",
            password: "adminpassword123", // Will be hashed by pre-save hook
            role: "admin",
            phone: "+91 9999999999",
            location: "Head Office",
        });

        console.log(`✅ Admin account created successfully!
Email: ${adminUser.email}
Password: adminpassword123`);
        
        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed:", error);
        process.exit(1);
    }
};

seedAdmin();
