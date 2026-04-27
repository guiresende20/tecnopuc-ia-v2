// src/lib/email/index.ts
// Envio de e-mails transacionais via Resend.
//
// Variáveis de ambiente:
//   RESEND_API_KEY=...
//   EMAIL_FROM="TecnoPUC IA <onboarding@resend.dev>"
//   APP_BASE_URL=https://...   (usado para montar URL de validação)
//
// IMPORTANTE — modo dev com onboarding@resend.dev:
//   O remetente "onboarding@resend.dev" só consegue enviar para o e-mail do
//   próprio dono da conta Resend. Quando o domínio próprio for verificado,
//   trocar EMAIL_FROM para "TecnoPUC IA <noreply@dominio-da-pucrs>".
//
// Comportamento sem RESEND_API_KEY (dev local):
//   Em vez de falhar, a função loga a URL de verificação no console e
//   retorna { ok: true, skipped: true }. Útil para testar o fluxo sem
//   precisar de conta Resend.

import { Resend } from 'resend';

const apiKey = process.env.RESEND_API_KEY;
const resend = apiKey ? new Resend(apiKey) : null;

const FROM = process.env.EMAIL_FROM ?? 'TecnoPUC IA <onboarding@resend.dev>';

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
  const urlVerificacao = `${baseUrl}/api/contribuicoes/verificar?token=${encodeURIComponent(params.token)}`;
  const truncado = params.conteudoPreview.length > 240
    ? params.conteudoPreview.slice(0, 240) + '…'
    : params.conteudoPreview;
  const html = htmlConfirmacaoContribuicao(urlVerificacao, escapeHtml(truncado));

  if (!resend) {
    console.warn(`[email] RESEND_API_KEY ausente — e-mail não enviado para ${params.para}.`);
    console.warn(`[email] URL de verificação (cole no browser para testar): ${urlVerificacao}`);
    return { ok: true, skipped: true };
  }

  try {
    const { error } = await resend.emails.send({
      from: FROM,
      to: params.para,
      subject: 'Confirme sua contribuição — TecnoPUC IA',
      html,
    });
    if (error) {
      console.error('[email] Erro Resend:', error);
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'erro desconhecido';
    console.error('[email] Exceção:', msg);
    return { ok: false, error: msg };
  }
}
