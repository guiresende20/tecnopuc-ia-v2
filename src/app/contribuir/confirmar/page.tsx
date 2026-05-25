import { ConfirmarContribuicao } from '@/components/contribuir/ConfirmarContribuicao';

export const metadata = {
  title: 'Confirmar contribuição — TecnoPUC IA',
};

// Página intersticial do link do e-mail de confirmação.
// O GET desta página NÃO muta estado — apenas mostra um botão. A promoção da
// contribuição só acontece via POST disparado pelo clique humano (ver
// ConfirmarContribuicao). Isso impede que scanners de e-mail (ex.: Safe Links
// do Office 365), que fazem GET automático nos links, auto-validem a
// contribuição e queimem o token antes do usuário clicar.
export default async function ConfirmarPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          ✉️
        </div>
        <h1 className="text-2xl font-bold mb-3">Confirmar contribuição</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Você está quase lá! Clique no botão abaixo para enviar sua contribuição
          para a fila de revisão de um administrador.
        </p>
        <ConfirmarContribuicao token={token ?? null} />
      </div>
    </main>
  );
}
