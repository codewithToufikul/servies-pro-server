const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'servicepro24x@gmail.com',
    pass: 'jcte epme lsol klco' // Use App Password from Google
  }
});

module.exports = transporter;
