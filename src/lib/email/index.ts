// src/lib/email/index.ts
// Envio de e-mails transacionais. Suporta dois transportes, escolhidos por env:
//   1. SMTP (nodemailer) — preferido quando SMTP_HOST está setado. Ex: Gmail.
//   2. Resend — usado se SMTP_HOST ausente mas RESEND_API_KEY presente.
//   3. Nenhum (dev) — loga a URL de verificação no console.
//
// Variáveis de ambiente:
//   EMAIL_FROM="TecnoPUC IA <endereco@dominio>"  (remetente; no Gmail precisa ser
//              a conta autenticada ou um alias "enviar como")
//   APP_BASE_URL=https://...   (usado para montar a URL de validação)
//
//   --- SMTP (ex: Gmail) ---
//   SMTP_HOST=smtp.gmail.com
//   SMTP_PORT=465              (465=SSL implícito; 587=STARTTLS)
//   SMTP_USER=conta@gmail.com
//   SMTP_PASS=...              (App Password do Google, não a senha normal)
//
//   --- Resend (alternativa) ---
//   RESEND_API_KEY=...
//
// IMPORTANTE: a rota que usa este wrapper (api/contribuicoes) roda em Node
// runtime — nodemailer NÃO funciona em edge.

import { Resend } from 'resend';
import nodemailer from 'nodemailer';

const FROM = process.env.EMAIL_FROM ?? 'TecnoPUC IA <onboarding@resend.dev>';
const SUBJECT = 'Confirme sua contribuição — TecnoPUC IA';

// Transporte SMTP (preferido). Só é criado se SMTP_HOST estiver presente.
const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT ?? 465);
const smtpTransport = smtpHost
  ? nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // 465 = SSL implícito; 587 = STARTTLS
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    })
  : null;

// Transporte Resend (fallback).
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

interface SendResult {
  ok: boolean;
  skipped?: boolean;
  error?: string;
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function htmlConfirmacaoContribuicao(urlVerificacao: string, previewSeguro: string): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f6f7fb; margin: 0; padding: 32px;">
    <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
      <h1 style="color: #4338ca; font-size: 22px; margin: 0 0 16px;">TecnoPUC IA</h1>
      <p style="color: #1e293b; font-size: 16px; line-height: 1.5;">Olá!</p>
      <p style="color: #1e293b; font-size: 16px; line-height: 1.5;">
        Recebemos sua contribuição para a base de conhecimento do assistente TecnoPUC.
        Para enviá-la para revisão, confirme abaixo. <strong>O link expira em 1 hora.</strong>
      </p>
      <div style="text-align: center; margin: 32px 0;">
        <a href="${urlVerificacao}" style="display: inline-block; background: #4338ca; color: #ffffff; text-decoration: none; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 15px;">
          Confirmar contribuição
        </a>
      </div>
      <p style="color: #475569; font-size: 14px; line-height: 1.5; margin-top: 24px;">Prévia do que você enviou:</p>
      <blockquote style="border-left: 3px solid #c7d2fe; padding: 8px 16px; margin: 8px 0 24px; color: #475569; font-size: 14px; font-style: italic;">
        ${previewSeguro}
      </blockquote>
      <p style="color: #94a3b8; font-size: 12px; line-height: 1.5;">
        Se você não enviou esta contribuição, pode ignorar este e-mail.
      </p>
    </div>
  </body>
</html>`;
}

export async function sendConfirmacaoContribuicao(params: {
  para: string;
  token: string;
  conteudoPreview: string;
}): Promise<SendResult> {
  const baseUrl = process.env.APP_BASE_URL ?? 'http://localhost:3000';
  // Aponta para a PÁGINA de confirmação (GET puro, não muta), não para a rota de
  // API. A mutação só ocorre no POST disparado pelo clique humano — assim
  // scanners de e-mail (Safe Links do Office 365) não auto-validam ao varrer o link.
  const urlVerificacao = `${baseUrl}/contribuir/confirmar?token=${encodeURIComponent(params.token)}`;
  const truncado = params.conteudoPreview.length > 240
    ? params.conteudoPreview.slice(0, 240) + '…'
    : params.conteudoPreview;
  const html = htmlConfirmacaoContribuicao(urlVerificacao, escapeHtml(truncado));

  // 1. SMTP (preferido — ex: Gmail).
  if (smtpTransport) {
    try {
      await smtpTransport.sendMail({ from: FROM, to: params.para, subject: SUBJECT, html });
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      console.error('[email] Exceção SMTP:', msg);
      return { ok: false, error: msg };
    }
  }

  // 2. Resend (fallback).
  if (resend) {
    try {
      const { error } = await resend.emails.send({ from: FROM, to: params.para, subject: SUBJECT, html });
      if (error) {
        console.error('[email] Erro Resend:', error);
        return { ok: false, error: error.message };
      }
      return { ok: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'erro desconhecido';
      console.error('[email] Exceção Resend:', msg);
      return { ok: false, error: msg };
    }
  }

  // 3. Nenhum transporte configurado (dev): loga a URL para teste manual.
  console.warn(`[email] Nenhum transporte (SMTP/Resend) configurado — e-mail não enviado para ${params.para}.`);
  console.warn(`[email] URL de verificação (cole no browser para testar): ${urlVerificacao}`);
  return { ok: true, skipped: true };
}
