import * as nodemailer from 'nodemailer';
import * as cors from 'cors';

require('dotenv').config();

cors({ origin: true });

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface MailerOptions {
  to: string;
  subject: string;
  text: string;
}

export const sendEmail = async ({
  to,
  subject,
  text,
}: MailerOptions): Promise<void> => {
  return new Promise((resolve, reject) => {
    const mailOptions = {
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
