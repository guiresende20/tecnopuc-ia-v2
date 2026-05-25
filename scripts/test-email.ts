// scripts/test-email.ts
// Diagnóstico do transporte de e-mail: verifica conexão+auth SMTP (verify()) e
// envia um e-mail de teste. NÃO toca no banco.
//
// Uso:  npx tsx scripts/test-email.ts [destinatario]
//       (sem arg, envia para SMTP_USER / dono da conta)

import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import nodemailer from 'nodemailer';

const host = process.env.SMTP_HOST;
const port = Number(process.env.SMTP_PORT ?? 465);
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.EMAIL_FROM ?? user;
const to = process.argv[2] ?? user;

console.log('\n=== Config SMTP detectada ===');
console.log(`host: ${host}`);
console.log(`port: ${port} (secure=${port === 465})`);
console.log(`user: ${user}`);
console.log(`pass: ${pass ? `${pass.length} chars (••••${pass.slice(-4)})` : 'AUSENTE'}`);
console.log(`from: ${from}`);
console.log(`to:   ${to}`);

if (!host || !user || !pass) {
  console.error('\n❌  SMTP incompleto no .env.local.');
  process.exit(1);
}

const transport = nodemailer.createTransport({
  host,
  port,
  secure: port === 465,
  auth: { user, pass },
});

async function main() {
  console.log('\n=== 1. verify() — testa conexão + autenticação ===');
  try {
    await transport.verify();
    console.log('✅ verify() OK — conexão e login no Gmail funcionam.');
  } catch (err) {
    console.error('❌ verify() FALHOU:', err instanceof Error ? err.message : err);
    console.error('   → App Password inválido/revogado, ou bloqueio de rede/porta.');
    process.exit(1);
  }

  console.log('\n=== 2. Envio de teste ===');
  try {
    const info = await transport.sendMail({
      from,
      to,
      subject: 'Teste de envio — TecnoPUC IA',
      text: 'Se você recebeu isto, o transporte SMTP está funcionando.',
      html: '<p>Se você recebeu isto, o transporte <strong>SMTP está funcionando</strong>.</p>',
    });
    console.log('✅ sendMail OK');
    console.log(`   messageId: ${info.messageId}`);
    console.log(`   response:  ${info.response}`);
    console.log(`   accepted:  ${JSON.stringify(info.accepted)}`);
    console.log(`   rejected:  ${JSON.stringify(info.rejected)}`);
  } catch (err) {
    console.error('❌ sendMail FALHOU:', err instanceof Error ? err.message : err);
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
