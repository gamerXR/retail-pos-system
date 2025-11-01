import { api } from "encore.dev/api";
import { secret } from "encore.dev/config";
import nodemailer from "nodemailer";

const smtpHost = secret("SMTPHost");
const smtpPort = secret("SMTPPort");
const smtpUser = secret("SMTPUser");
const smtpPassword = secret("SMTPPassword");
const smtpFromEmail = secret("SMTPFromEmail");
const smtpFromName = secret("SMTPFromName");

export interface SendEmailRequest {
  to: string;
  subject: string;
  htmlContent: string;
}

export interface SendEmailResponse {
  success: boolean;
  message: string;
}

export const send = api(
  { method: "POST", path: "/email/send", expose: true },
  async (req: SendEmailRequest): Promise<SendEmailResponse> => {
    try {
      const transporter = nodemailer.createTransport({
        host: smtpHost(),
        port: parseInt(smtpPort()),
        secure: parseInt(smtpPort()) === 465,
        auth: {
          user: smtpUser(),
          pass: smtpPassword(),
        },
      });

      await transporter.sendMail({
        from: `"${smtpFromName()}" <${smtpFromEmail()}>`,
        to: req.to,
        subject: req.subject,
        html: req.htmlContent,
      });

      return {
        success: true,
        message: "Email sent successfully",
      };
    } catch (error: any) {
      console.error("Error sending email:", error);
      return {
        success: false,
        message: error.message || "Failed to send email",
      };
    }
  }
);
