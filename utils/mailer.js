// 3rd party modules
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    requireTLS: true,
    auth: {
        user: process.env.GOOGLE_SMTP_USER,
        pass: process.env.GOOGLE_SMTP_PWD,
    },
});

const sendMailToUser = async (mailParameters) => {
    const { mailSubject, mailContent, userEmail } = mailParameters;

    console.log(`${mailSubject}, ${mailContent}, ${userEmail}`.cyan.underline);

    const mailOptions = {
        from: process.env.GOOGLE_SMTP_USER, // sender 'fullstackprojects107@gmail.com'
        to: userEmail, // receiver
        subject: mailSubject, // Subject
        html: mailContent, // html body
    };

    const info = await transporter.sendMail(mailOptions);

    console.log(`mail sent to ${info.messageId}`.green.inverse);
};

module.exports = sendMailToUser;
