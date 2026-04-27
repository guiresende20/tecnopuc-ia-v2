'use client';

// Componente reutilizável de formulário de contribuição da comunidade.
// Usado hoje na página /contribuir; quando o botão migrar para o canto direito
// da home com layer estilo ResponseFocusCard, este mesmo componente é montado
// dentro do layer sem alteração.

import { useState, FormEvent } from 'react';

const MIN_LEN = 50;
const MAX_LEN = 5000;

interface Props {
  onSuccess?: () => void;
}

type Mensagem = { tipo: 'sucesso' | 'erro'; texto: string } | null;

export function ContribuirForm({ onSuccess }: Props) {
  const [conteudo, setConteudo] = useState('');
  const [email, setEmail] = useState('');
  const [categoria, setCategoria] = useState('');
  const [website, setWebsite] = useState(''); // honeypot
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<Mensagem>(null);

  const tamanho = conteudo.trim().length;
  const podeEnviar =
    tamanho >= MIN_LEN && tamanho <= MAX_LEN && email.includes('@') && !enviando;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!podeEnviar) return;

    setEnviando(true);
    setMensagem(null);

    try {
      const res = await fetch('/api/contribuicoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conteudo: conteudo.trim(),
          email: email.trim(),
          categoria: categoria.trim() || null,
          website,
        }),
      });

      if (res.ok) {
        setMensagem({
          tipo: 'sucesso',
          texto:
            'Pronto! Verifique seu e-mail para confirmar a contribuição (link válido por 1h).',
        });
        setConteudo('');
        setEmail('');
        setCategoria('');
        onSuccess?.();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMensagem({
          tipo: 'erro',
          texto:
            data.error ||
            'Não foi possível enviar agora. Tente novamente em instantes.',
        });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Erro de conexão. Tente novamente.' });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Honeypot — invisível para humanos, irresistível para bots. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '-9999px',
          opacity: 0,
          height: 0,
          width: 0,
          pointerEvents: 'none',
        }}
      />

      <div>
        <label
          htmlFor="conteudo"
          className="block text-sm font-medium text-slate-200 mb-2"
        >
          Sua contribuição{' '}
          <span className="text-slate-400 font-normal">
            ({tamanho}/{MAX_LEN})
          </span>
        </label>
        <textarea
          id="conteudo"
          rows={8}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder="Compartilhe um conhecimento sobre o TecnoPUC — uma empresa, evento, programa, fato relevante..."
          className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
          disabled={enviando}
        />
        {tamanho > 0 && tamanho < MIN_LEN && (
          <p className="mt-1 text-xs text-amber-400">
            Mínimo de {MIN_LEN} caracteres ({MIN_LEN - tamanho} restantes).
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-200 mb-2"
          >
            Seu e-mail <span className="text-rose-400">*</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="voce@exemplo.com"
            required
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            disabled={enviando}
          />
          <p className="mt-1 text-xs text-slate-400">
            Usado apenas para confirmar a contribuição.
          </p>
        </div>
        <div>
          <label
            htmlFor="categoria"
            className="block text-sm font-medium text-slate-200 mb-2"
          >
            Categoria{' '}
            <span className="text-slate-500 font-normal">(opcional)</span>
          </label>
          <input
            id="categoria"
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder="Empresa, evento, programa..."
            maxLength={80}
            className="w-full rounded-lg bg-slate-900 border border-slate-700 px-4 py-3 text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            disabled={enviando}
          />
        </div>
      </div>

      {mensagem && (
        <div
          role="status"
          className={`rounded-lg px-4 py-3 text-sm border ${
            mensagem.tipo === 'sucesso'
              ? 'bg-emerald-950/40 border-emerald-700/40 text-emerald-200'
              : 'bg-rose-950/40 border-rose-700/40 text-rose-200'
          }`}
        >
          {mensagem.texto}
        </div>
      )}

      <button
        type="submit"
        disabled={!podeEnviar}
        className="w-full md:w-auto rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-400 disabled:cursor-not-allowed text-white font-medium px-6 py-3 transition"
      >
        {enviando ? 'Enviando...' : 'Enviar contribuição'}
      </button>
    </form>
  );
}
