const express = require('express');
const nodemailer = require('nodemailer');
const multer = require('multer');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

dotenv.config();
console.log("ENV VARS LOADED:", process.env.SMTP_USER);
const app = express();
const port = 5050;

const upload = multer({ dest: 'uploads/' });
app.use(cors());
app.use(express.static('public'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.post('/send', upload.any(), async (req, res) => {
  console.log('POST /send triggered');
  console.log('BODY:', req.body);
  console.log('FILES:', req.files);

   const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  const attachments = req.files.map(file => ({
    filename: file.originalname,
    path: file.path
  }));

  const formData = req.body;
  const htmlBody = Object.entries(formData).map(([key, value]) => {
    return `<p><strong>${key}:</strong> ${value}</p>`;
  }).join('');

  const mailOptions = {
    from: `"FonduldeModernizare.ro" <${process.env.SMTP_USER}>`, // Corectat
    to: 'office@sewcels.ro',
    subject: 'Formular analiză eligibilitate',
    html: htmlBody,
    attachments: attachments
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('EMAIL TRIMIS cu succes');
    res.send('<script>alert("✅ Formularul a fost trimis cu succes!"); window.history.back();</script>');
  } catch (error) {
    console.error('EMAIL ERROR:', error);
    res.status(500).json({ message: 'A apărut o eroare. Încearcă din nou.' });
  } finally {
    // șterge fișierele temporare
    attachments.forEach(file => fs.unlinkSync(file.path));
  }
});

app.get('/ping', (req, res) => {
  res.send('pong');
});

app.listen(port, () => {
  console.log(`Server email rulează pe portul ${port}`);
});