import nodemailer from "nodemailer";

// TODO: move to env vars before production hardening
const SMTP_USER = "shreyvijayvargiya26@gmail.com";
const SMTP_PASS = "aqrbctwdvrthxmlk";
const CONTACT_TO = SMTP_USER;

function escapeHtml(value) {
	return String(value)
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;");
}

export default async function handler(req, res) {
	if (req.method !== "POST") {
		return res.status(405).json({ error: "Method not allowed" });
	}

	try {
		const { name, email, subject, message } = req.body;

		if (!name?.trim() || !email?.trim() || !subject?.trim() || !message?.trim()) {
			return res.status(400).json({ error: "All fields are required" });
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(email)) {
			return res.status(400).json({ error: "Invalid email address" });
		}

		const transporter = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 587,
			secure: false,
			auth: {
				user: SMTP_USER,
				pass: SMTP_PASS,
			},
		});

		const safeName = escapeHtml(name.trim());
		const safeEmail = escapeHtml(email.trim());
		const safeSubject = escapeHtml(subject.trim());
		const safeMessage = escapeHtml(message.trim()).replace(/\n/g, "<br />");

		await transporter.sendMail({
			from: `"aantraa Contact" <${SMTP_USER}>`,
			to: CONTACT_TO,
			replyTo: email.trim(),
			subject: `[aantraa Contact] ${subject.trim()}`,
			text: [
				`Name: ${name.trim()}`,
				`Email: ${email.trim()}`,
				`Subject: ${subject.trim()}`,
				"",
				message.trim(),
			].join("\n"),
			html: `
				<div style="font-family: system-ui, sans-serif; color: #18181b; line-height: 1.6;">
					<h2 style="margin: 0 0 16px; font-size: 18px;">New contact form message</h2>
					<p style="margin: 0 0 8px;"><strong>Name:</strong> ${safeName}</p>
					<p style="margin: 0 0 8px;"><strong>Email:</strong> ${safeEmail}</p>
					<p style="margin: 0 0 16px;"><strong>Subject:</strong> ${safeSubject}</p>
					<div style="padding: 16px; background: #fafafa; border: 1px solid #e4e4e7; border-radius: 12px;">
						${safeMessage}
					</div>
				</div>
			`,
		});

		return res.status(200).json({ success: true });
	} catch (error) {
		console.error("Contact email error:", error);
		return res.status(500).json({
			error: "Failed to send message. Please try again or email us directly.",
		});
	}
}
