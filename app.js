require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

/* =========================
   GLOBAL MIDDLEWARE
========================= */
// Enable CORS for admin panel
app.use(cors({
    origin: ['http://localhost:8000', 'http://127.0.0.1:8000'],
    credentials: true
}));

app.use(express.json({ strict: false }));
app.use(express.urlencoded({ extended: true }));

// Serve frontend files
app.use(express.static("public"));

/* =========================
   SAFETY NET: BAD JSON
========================= */
app.use((err, req, res, next) => {
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            error: "Invalid JSON format",
            hint: "Use JSON body or Form data"
        });
    }
    next();
});

/* =========================
   ROUTES
========================= */
const authRoutes = require("./auth");
const studentRoutes = require("./student");
const ieltsRoutes = require("./ielts");
const ieltsMockRoutes = require("./ieltsMock");
const adminRoutes = require("./admin");
const applicationRoutes = require("./applications");
const billingRoutes = require("./billing");
const notificationRoutes = require("./notifications");
const reminderRoutes = require("./reminders");
const materialsRoutes = require("./materials");
const documentsRoutes = require("./documents");
const counselorsRoutes = require("./counselors");

app.use("/api/auth", authRoutes);
app.use("/api/student", studentRoutes);
app.use("/api/ielts", ieltsRoutes);
app.use("/api/ielts-mock", ieltsMockRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/reminders", reminderRoutes);
app.use("/api/admin/ielts", materialsRoutes);
app.use("/api/documents", documentsRoutes);
app.use("/api/counselors", counselorsRoutes);

// Serve uploaded files
app.use('/uploads/documents', express.static('public/uploads/documents'));

/* =========================
   ROOT CHECK
========================= */
app.get("/", (req, res) => {
    res.send("✅ Ilham Backend Running");
});

/* =========================
   START SERVER
========================= */
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
