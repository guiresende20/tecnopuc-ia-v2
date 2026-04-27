import Link from 'next/link';
import { ContribuirForm } from '@/components/contribuir/ContribuirForm';

export const metadata = {
  title: 'Contribuir — TecnoPUC IA',
  description:
    'Compartilhe informações sobre o TecnoPUC para enriquecer a base de conhecimento do assistente.',
};

export default function ContribuirPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-block text-sm text-slate-400 hover:text-slate-200 mb-6 transition"
        >
          ← Voltar para o assistente
        </Link>
        <h1 className="text-3xl font-bold mb-2">
          Contribuir com a base de conhecimento
        </h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Compartilhe informações sobre o TecnoPUC para ajudar a IA a responder
          melhor. Toda contribuição passa por validação de e-mail e revisão de
          um administrador antes de entrar na base de conhecimento.
        </p>
        <ContribuirForm />
      </div>
    </main>
  );
}
