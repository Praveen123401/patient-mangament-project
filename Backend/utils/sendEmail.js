const nodemailer = require("nodemailer");

const sendEmail = async ({ to, subject, text, html }) => {
    if (
        !process.env.EMAIL_HOST ||
        !process.env.EMAIL_USER ||
        !process.env.EMAIL_PASS
    ) {
        throw new Error("Email SMTP configuration is missing");
    }

    const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_HOST,
        port: Number(process.env.EMAIL_PORT || 587),
        secure: Number(process.env.EMAIL_PORT || 587) === 465,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
        to,
        subject,
        text,
        html
    });
};

module.exports = sendEmail;