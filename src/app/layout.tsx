import type { Metadata } from 'next';
import './globals.css';
import { CookieBanner } from '@/components/overlays/CookieBanner';
import { AnalyticsLoader } from '@/components/AnalyticsLoader';

export const metadata: Metadata = {
  title: 'Assistente TecnoPUC',
  description:
    'Assistente virtual do TecnoPUC — Parque Científico e Tecnológico da PUCRS. Tire suas dúvidas sobre o parque, empresas residentes, laboratórios e serviços.',
  keywords: ['TecnoPUC', 'PUCRS', 'Parque Tecnológico', 'Inovação', 'Porto Alegre'],
  openGraph: {
    title: 'Assistente TecnoPUC',
    description: 'Assistente virtual inteligente do TecnoPUC',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <link
          rel="preload"
          as="fetch"
          href="/assets/t-3d/t-core.glb"
          type="model/gltf-binary"
          crossOrigin="anonymous"
        />
      </head>
      <body>
        {children}
        <CookieBanner />
        <AnalyticsLoader />
      </body>
    </html>
  );
}
