const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'servicepro24x@gmail.com',
    pass: 'wwys skpw mpyt sgld' // Use App Password from Google
  }
});

module.exports = transporter;
