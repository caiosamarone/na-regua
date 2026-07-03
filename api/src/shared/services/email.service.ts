import { Resend } from "resend";
import { env } from "../../config/env";

const resend = new Resend(env.RESEND_API_KEY);
const FROM_EMAIL = "onboarding@resend.dev";

export class EmailService {
  async sendMagicLink(to: string, link: string): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "caiosamarone10@hotmail.com",
      subject: "Seu link mágico para a Na Régua",
      html: `<p>Use o link abaixo para acessar o app. Ele expira em 15 minutos.</p><p><a href="${link}">Acessar</a></p>`,
    });
  }

  async sendInvite(to: string, link: string): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "caiosamarone10@hotmail.com",
      subject: "Você foi convidado para a Na Régua",
      html: `<p>Crie sua senha e comece a usar a plataforma.</p><p><a href="${link}">Aceitar convite</a></p>`,
    });
  }

  async sendOtp(to: string, code: string): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "caiosamarone10@hotmail.com",
      subject: "Código OTP — Na Régua",
      html: `<p>Seu código é <strong>${code}</strong>. Expira em 15 minutos.</p>`,
    });
  }

  async sendCancellation(to: string, appointmentId: string): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "caiosamarone10@hotmail.com",
      subject: "Agendamento cancelado",
      html: `<p>O agendamento ${appointmentId} foi cancelado.</p>`,
    });
  }

  async sendBookingConfirmation(
    to: string,
    appointmentId: string,
  ): Promise<void> {
    await resend.emails.send({
      from: FROM_EMAIL,
      to: "caiosamarone10@hotmail.com",
      subject: "Agendamento confirmado",
      html: `<p>Seu agendamento ${appointmentId} foi confirmado.</p>`,
    });
  }
}
