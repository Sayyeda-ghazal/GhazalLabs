import nodemailer from "nodemailer";

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (error, status = 400) => Response.json({ error }, { status });

export default async (req) => {
  if (req.method !== "POST") return fail("Method not allowed", 405);

  let body;
  try {
    body = await req.json();
  } catch {
    return fail("Invalid request.");
  }
  const { name = "", email = "", company = "", product = "", message = "", website = "" } = body || {};

  // Honeypot field — bots fill it, humans don't
  if (website) return Response.json({ ok: true });

  if (String(name).trim().length < 2) return fail("Please enter your name.");
  if (!emailRe.test(email)) return fail("Please enter a valid email.");
  if (String(message).trim().length < 5) return fail("Please enter a message.");
  if (name.length > 100 || email.length > 150 || company.length > 120 || message.length > 2000)
    return fail("Input too long.");

  console.log("New contact submission:", { name, email, company, product, message });

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, CONTACT_TO } = process.env;
  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    console.error("SMTP env vars missing — email not sent");
    return fail("Could not send your message. Please try again later.", 500);
  }

  const port = Number(SMTP_PORT) || 465;
  const mailer = nodemailer.createTransport({
    host: SMTP_HOST,
    port,
    secure: port === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await mailer.sendMail({
      from: `"Ghazal Labs Website" <${SMTP_USER}>`,
      to: CONTACT_TO || SMTP_USER,
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
    return fail("Could not send your message. Please try again later.", 500);
  }

  return Response.json({ ok: true });
};

export const config = { path: "/api/contact" };
