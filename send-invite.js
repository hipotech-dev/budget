// send-invite.js
// Express endpoint to send invitation emails using nodemailer
const express = require('express');
const nodemailer = require('nodemailer');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// Configure your SMTP transport (use environment variables for security)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST, // e.g., 'smtp.gmail.com'
    port: process.env.SMTP_PORT || 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER, // SMTP username
        pass: process.env.SMTP_PASS  // SMTP password or app password
    }
});

app.post('/send-invite', async (req, res) => {
    const { to, subject, html, from } = req.body;
    if (!to || !subject || !html || !from) {
        return res.status(400).json({ error: 'Missing required fields.' });
    }
    try {
        await transporter.sendMail({
            from: `${from} <${process.env.SMTP_USER}>`,
            to,
            subject,
            html
        });
        res.json({ success: true });
    } catch (err) {
        console.error('Email send error:', err);
        res.status(500).json({ error: 'Failed to send email.' });
    }
});

// Start server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Send-invite service running on port ${PORT}`);
});

// .env file example (do not commit to version control):
// SMTP_HOST=smtp.gmail.com
// SMTP_PORT=465
// SMTP_USER=your@email.com
// SMTP_PASS=your_app_password 