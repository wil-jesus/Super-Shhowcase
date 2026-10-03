import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  if (!process.env.RESEND_API_KEY) {
    console.warn("[email] RESEND_API_KEY não configurado — pulando envio");
    return;
  }

  await resend.emails.send({
    from: "Showcase <noreply@showcase.com>",
    to,
    subject,
    html,
  });
}

export function passwordResetEmail(name: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/reset-password?token=${token}`;
  return {
    subject: "Showcase — Recuperação de senha",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Showcase</h1>
        <p>Olá ${name},</p>
        <p>Você solicitou a recuperação de senha. Clique no link abaixo para redefinir:</p>
        <a href="${url}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Redefinir senha
        </a>
        <p style="color: #666; font-size: 12px;">Este link expira em 1 hora. Se não foi você, ignore este e-mail.</p>
      </div>
    `,
  };
}

export function verificationEmail(name: string, token: string) {
  const url = `${process.env.NEXTAUTH_URL}/verify-email?token=${token}`;
  return {
    subject: "Showcase — Confirme seu e-mail",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Showcase</h1>
        <p>Olá ${name},</p>
        <p>Confirme seu e-mail para ativar sua conta:</p>
        <a href="${url}" style="display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
          Confirmar e-mail
        </a>
      </div>
    `,
  };
}

export function bookingNotificationEmail(name: string, eventTitle: string) {
  return {
    subject: "Showcase — Nova solicitação de contratação",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h1 style="color: #0ea5e9;">Showcase</h1>
        <p>Olá ${name},</p>
        <p>Você recebeu uma nova solicitação para o evento <strong>${eventTitle}</strong>.</p>
        <p>Acesse sua dashboard para aceitar ou recusar.</p>
      </div>
    `,
  };
}