'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type Estado = 'idle' | 'enviando' | 'erro';

// Botão de confirmação da contribuição. O clique humano dispara o POST que
// promove a contribuição para revisão. É de propósito que a mutação só aconteça
// aqui (e não no carregamento da página): scanners de e-mail fazem GET, não
// executam JS nem submetem POST, então não conseguem auto-confirmar.
export function ConfirmarContribuicao({ token }: { token: string | null }) {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('idle');

  if (!token) {
    return (
      <p className="text-rose-400 leading-relaxed">
        Link inválido — token ausente. Abra o link completo enviado no seu
        e-mail.
      </p>
    );
  }

  async function confirmar() {
    setEstado('enviando');
    try {
      const res = await fetch('/api/contribuicoes/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });
      if (res.ok) {
        router.push('/contribuir/validado');
      } else {
        router.push('/contribuir/expirado');
      }
    } catch {
      setEstado('erro');
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={confirmar}
        disabled={estado === 'enviando'}
        className="inline-block rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-medium px-6 py-3 transition"
      >
        {estado === 'enviando' ? 'Confirmando…' : 'Confirmar contribuição'}
      </button>
      {estado === 'erro' && (
        <p className="text-rose-400 mt-5 leading-relaxed">
          Não foi possível confirmar agora. Tente novamente em instantes ou{' '}
          <Link href="/contribuir" className="underline hover:text-rose-300">
            reenvie sua contribuição
          </Link>
          .
        </p>
      )}
    </>
  );
}
