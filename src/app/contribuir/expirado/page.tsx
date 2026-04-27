import Link from 'next/link';

export const metadata = {
  title: 'Link expirado — TecnoPUC IA',
};

export default function ExpiradoPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 px-4 py-12 flex items-center justify-center">
      <div className="max-w-md text-center">
        <div className="text-5xl mb-4" aria-hidden="true">
          ⏱️
        </div>
        <h1 className="text-2xl font-bold mb-3">Link expirado</h1>
        <p className="text-slate-400 mb-8 leading-relaxed">
          Este link de confirmação não está mais válido (expira em 1 hora). Você
          pode reenviar sua contribuição usando o formulário.
        </p>
        <Link
          href="/contribuir"
          className="inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 transition"
        >
          Enviar nova contribuição
        </Link>
      </div>
    </main>
  );
}
