

import nodemailer from 'nodemailer';
import { IncomingForm } from 'formidable';
import fs from 'fs';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const form = new IncomingForm({ multiples: true, uploadDir: '/tmp', keepExtensions: true });

  form.parse(req, async (err, fields, files) => {
    if (err) {
      console.error('Form parse error:', err);
      return res.status(500).json({ message: 'Eroare la procesarea formularului.' });
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const attachments = [];
    if (files && Object.values(files).length > 0) {
      Object.values(files).forEach(file => {
        attachments.push({
          filename: file.originalFilename,
          path: file.filepath,
        });
      });
    }

    const htmlBody = Object.entries(fields).map(([key, value]) => {
      return `<p><strong>${key}:</strong> ${value}</p>`;
    }).join('');

    const mailOptions = {
      from: `"FonduldeModernizare.ro" <${process.env.SMTP_USER}>`,
      to: 'office@sewcels.ro',
      subject: 'FM - Formular analiză eligibilitate',
      html: htmlBody,
      attachments,
    };

    try {
      await transporter.sendMail(mailOptions);
      console.log('EMAIL TRIMIS cu succes');
      res.status(200).json({ message: '✅ Formular trimis cu succes!' });
    } catch (error) {
      console.error('EMAIL ERROR:', error);
      res.status(500).json({ message: 'A apărut o eroare. Încearcă din nou.' });
    } finally {
      attachments.forEach(file => {
        try {
          fs.unlinkSync(file.path);
        } catch (_) {}
      });
    }
  });
}