import * as nodemailer from 'nodemailer';
import * as cors from 'cors';
import Mail = require('nodemailer/lib/mailer');

require('dotenv').config();

cors({ origin: true });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

export const sendEmail = async ({
  to,
  subject,
  text,
}: Mail.Options): Promise<void> => {
  return new Promise((resolve, reject) => {
    const mailOptions: Mail.Options = {
      from: `${process.env.APP_NAME} <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      text,
    };

    transporter.sendMail(mailOptions, (error) => {
      if (error) {
        console.log(error);
        reject(error);
      }
      resolve();
    });
  });
};
