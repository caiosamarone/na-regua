import { z } from 'zod';

// Mirrors the API rules (auth.schema.ts) so users get feedback before the request.
export const emailField = z.string().trim().toLowerCase().email('Digite um e-mail válido.');

export const PASSWORD_RULES = [
  { label: 'Mínimo 8 caracteres', test: (v: string) => v.length >= 8 },
  { label: 'Uma letra maiúscula', test: (v: string) => /[A-Z]/.test(v) },
  { label: 'Um símbolo', test: (v: string) => /[^A-Za-z0-9]/.test(v) },
];

// Last address a magic link was sent to, so the "expired link" screen can offer a resend.
let lastMagicLinkEmail = '';
export const rememberMagicLinkEmail = (email: string) => {
  lastMagicLinkEmail = email;
};
export const getLastMagicLinkEmail = () => lastMagicLinkEmail;
