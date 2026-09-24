require("dotenv").config();
const express = require("express");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const nodemailer = require("nodemailer");

const app = express();
const PORT = process.env.PORT || 5000;

// Heroku sits behind a proxy — needed for correct client IPs in rate limiting
app.set("trust proxy", 1);
app.use(express.json({ limit: "20kb" }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin(origin, cb) {
      // Allow non-browser clients (curl, Postman) and whitelisted origins
      if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error("Not allowed by CORS"));
    },
  })
);

// Only create a mail transporter when SMTP is configured
const mailer =
  process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT || 465) === 465,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      })
    : null;

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get("/", (req, res) => res.json({ name: "Ghazal Labs API", status: "ok" }));
app.get("/api/health", (req, res) => res.json({ status: "ok", time: new Date().toISOString() }));

// Sample stats endpoint (can power the dashboard later)
app.get("/api/stats", (req, res) => {
  res.json({
    totalSales: 12840,
    orders: 284,
    customers: 1248,
    channels: { inStore: 58, online: 28, wholesale: 14 },
    topProducts: [
      { name: "Custom Apron", sold: 120, revenue: 2400 },
      { name: "Black Cape", sold: 96, revenue: 1920 },
      { name: "Chef Robe", sold: 64, revenue: 1280 },
    ],
  });
});

const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests. Please try again later." },
});

app.post("/api/contact", contactLimiter, async (req, res) => {
  const { name = "", email = "", company = "", product = "", message = "", website = "" } = req.body || {};

  // Honeypot field — bots fill it, humans don't
  if (website) return res.json({ ok: true });

  if (String(name).trim().length < 2) return res.status(400).json({ error: "Please enter your name." });
  if (!emailRe.test(email)) return res.status(400).json({ error: "Please enter a valid email." });
  if (String(message).trim().length < 5) return res.status(400).json({ error: "Please enter a message." });
  if (name.length > 100 || email.length > 150 || company.length > 120 || message.length > 2000)
    return res.status(400).json({ error: "Input too long." });

  const entry = { name, email, company, product, message, at: new Date().toISOString() };
  console.log("New contact submission:", entry);

  if (mailer) {
    try {
      await mailer.sendMail({
        from: `"Ghazal Labs Website" <${process.env.SMTP_USER}>`,
        to: process.env.CONTACT_TO || process.env.SMTP_USER,
        replyTo: email,
        subject: `New enquiry from ${name} — ${product || "General"}`,
        html: `
          <h2>New contact form submission</h2>
          <p><b>Name:</b> ${escapeHtml(name)}</p>
          <p><b>Email:</b> ${escapeHtml(email)}</p>
          <p><b>Company:</b> ${escapeHtml(company || "-")}</p>
          <p><b>Interested in:</b> ${escapeHtml(product || "-")}</p>
          <p><b>Message:</b><br>${escapeHtml(message).replace(/\n/g, "<br>")}</p>`,
      });
    } catch (err) {
      console.error("Email send failed:", err.message);
      return res.status(500).json({ error: "Could not send your message. Please try again later." });
    }
  }

  res.json({ ok: true });
});

app.use((req, res) => res.status(404).json({ error: "Not found" }));
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(err.message === "Not allowed by CORS" ? 403 : 500).json({ error: err.message || "Server error" });
});

app.listen(PORT, () => console.log(`API running on port ${PORT}`));
