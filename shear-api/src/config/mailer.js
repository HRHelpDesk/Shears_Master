const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: process.env.EMAIL_PORT == 465, // true for 465 (SMTPS), false for 587 (SMTP with STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Function to send emails
const sendMail = async (mailOptions) => {
  try {
    const transporter = createTransporter();
    const info = await transporter.sendMail({
      from: `"Your App Name" <${process.env.EMAIL_USER}>`, // Sender address
      ...mailOptions, // Spread recipient, subject, text, html, etc.
    });
    console.log(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

module.exports = { sendMail };