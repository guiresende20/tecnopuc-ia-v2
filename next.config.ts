import type { NextConfig } from "next";

// Headers de segurança aplicados em toda a aplicação.
// Cada um ativa uma proteção nativa do browser que vem desligada por padrão.
// CSP (Content-Security-Policy) não está aqui de propósito — configurar CSP bem
// exige staging (report-only) pra não quebrar estilos/scripts inline do Next.
const securityHeaders = [
  // Força HTTPS por 2 anos, inclusive em subdomínios. Inclui preload para o browser
  // já carregar essa regra antes mesmo do primeiro acesso.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // Impede que a página seja embutida em <iframe>. Bloqueia clickjacking.
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  // Impede que o browser "adivinhe" o MIME type do response — mitiga execução
  // acidental de arquivos enviados como conteúdo não-executável.
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  // Quando o usuário sai do site, envia apenas a origin (sem path/query) para
  // destinos cross-origin. Evita vazamento de URLs internas em header Referer.
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  // Libera microfone APENAS para o próprio domínio (modo voz do chatbot).
  // Bloqueia camera, geolocation e demais APIs sensíveis por padrão.
  {
    key: "Permissions-Policy",
    value: "microphone=(self), camera=(), geolocation=(), interest-cohort=()",
  },
  // Permite prefetch de DNS dos links na página. Benefício de performance.
  {
    key: "X-DNS-Prefetch-Control",
    value: "on",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
