'use client';

// Componente reutilizável de formulário de contribuição da comunidade.
// Estilizado com a paleta do chat (#0099ff / Space Grotesk / glass dark).
// Usado tanto na página /contribuir (fallback) quanto dentro do ContribuirLayer.

import { useState, FormEvent } from 'react';
import { useT } from '@/i18n';

const MIN_LEN = 50;
const MAX_LEN = 5000;

interface Props {
  onSuccess?: () => void;
}

type Mensagem = { tipo: 'sucesso' | 'erro'; texto: string } | null;

export function ContribuirForm({ onSuccess }: Props) {
  const t = useT();
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
        setMensagem({ tipo: 'sucesso', texto: t.contribuir.success });
        setConteudo('');
        setEmail('');
        setCategoria('');
        onSuccess?.();
      } else {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        setMensagem({
          tipo: 'erro',
          texto: data.error || t.contribuir.errorGeneric,
        });
      }
    } catch {
      setMensagem({ tipo: 'erro', texto: t.contribuir.errorConnection });
    } finally {
      setEnviando(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="contrib-form">
      {/* Honeypot — invisível para humanos, irresistível para bots. */}
      <input
        type="text"
        name="website"
        value={website}
        onChange={(e) => setWebsite(e.target.value)}
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="contrib-honeypot"
      />

      <div className="contrib-field">
        <label htmlFor="conteudo" className="contrib-label">
          {t.contribuir.contentLabel}
          <span className="contrib-counter">
            {tamanho}/{MAX_LEN}
          </span>
        </label>
        <textarea
          id="conteudo"
          rows={8}
          value={conteudo}
          onChange={(e) => setConteudo(e.target.value)}
          placeholder={t.contribuir.contentPlaceholder}
          className="contrib-input contrib-textarea"
          disabled={enviando}
        />
        {tamanho > 0 && tamanho < MIN_LEN && (
          <p className="contrib-warning">
            {t.contribuir.minCharsWarning(MIN_LEN - tamanho, MIN_LEN)}
          </p>
        )}
      </div>

      <div className="contrib-row">
        <div className="contrib-field">
          <label htmlFor="email" className="contrib-label">
            {t.contribuir.emailLabel} <span className="contrib-required">{t.contribuir.requiredMark}</span>
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t.contribuir.emailPlaceholder}
            required
            className="contrib-input"
            disabled={enviando}
          />
          <p className="contrib-hint">{t.contribuir.emailHint}</p>
        </div>
        <div className="contrib-field">
          <label htmlFor="categoria" className="contrib-label">
            {t.contribuir.categoryLabel} <span className="contrib-optional">{t.contribuir.categoryOptional}</span>
          </label>
          <input
            id="categoria"
            type="text"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
            placeholder={t.contribuir.categoryPlaceholder}
            maxLength={80}
            className="contrib-input"
            disabled={enviando}
          />
        </div>
      </div>

      {mensagem && (
        <div className={`contrib-message ${mensagem.tipo}`} role="status">
          {mensagem.texto}
        </div>
      )}

      <button type="submit" disabled={!podeEnviar} className="contrib-submit">
        {enviando ? t.contribuir.submitting : t.contribuir.submit}
      </button>

      <style jsx>{`
        .contrib-form {
          display: flex;
          flex-direction: column;
          gap: 18px;
          font-family: 'Space Grotesk', sans-serif;
        }

        .contrib-honeypot {
          position: absolute;
          left: -9999px;
          opacity: 0;
          height: 0;
          width: 0;
          pointer-events: none;
        }

        .contrib-field {
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .contrib-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 14px;
        }

        .contrib-label {
          display: flex;
          align-items: baseline;
          justify-content: space-between;
          gap: 8px;
          font-size: 10.5px;
          font-weight: 600;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: rgba(200, 220, 255, 0.65);
        }

        .contrib-counter {
          font-size: 10.5px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: none;
          color: rgba(200, 220, 255, 0.4);
          font-variant-numeric: tabular-nums;
        }

        .contrib-required {
          color: #ef4444;
          font-weight: 700;
          margin-left: 2px;
        }

        .contrib-optional {
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.04em;
          text-transform: none;
          color: rgba(200, 220, 255, 0.4);
          margin-left: 4px;
        }

        .contrib-input {
          width: 100%;
          padding: 10px 14px;
          background: rgba(10, 16, 36, 0.8);
          border: 1px solid rgba(0, 153, 255, 0.2);
          border-radius: 8px;
          color: rgba(220, 235, 255, 0.95);
          font-family: 'Space Grotesk', sans-serif;
          font-size: 13.5px;
          line-height: 1.5;
          transition: border-color 0.2s, box-shadow 0.2s, background 0.2s;
        }

        .contrib-input::placeholder {
          color: rgba(200, 220, 255, 0.3);
        }

        .contrib-input:hover:not(:disabled):not(:focus) {
          border-color: rgba(0, 153, 255, 0.35);
        }

        .contrib-input:focus {
          outline: none;
          border-color: rgba(0, 153, 255, 0.55);
          background: rgba(10, 16, 36, 0.95);
          box-shadow: 0 0 0 3px rgba(0, 153, 255, 0.12);
        }

        .contrib-input:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .contrib-textarea {
          resize: vertical;
          min-height: 140px;
        }

        .contrib-warning {
          margin: 0;
          font-size: 11px;
          color: rgba(251, 191, 36, 0.85);
        }

        .contrib-hint {
          margin: 0;
          font-size: 11px;
          color: rgba(200, 220, 255, 0.45);
        }

        .contrib-message {
          padding: 11px 14px;
          border-radius: 8px;
          font-size: 12.5px;
          line-height: 1.5;
          border: 1px solid;
        }

        .contrib-message.sucesso {
          background: rgba(16, 185, 129, 0.1);
          border-color: rgba(16, 185, 129, 0.35);
          color: rgba(167, 243, 208, 0.95);
        }

        .contrib-message.erro {
          background: rgba(239, 68, 68, 0.1);
          border-color: rgba(239, 68, 68, 0.35);
          color: rgba(252, 165, 165, 0.95);
        }

        .contrib-submit {
          align-self: flex-start;
          padding: 10px 22px;
          background: rgba(0, 153, 255, 0.15);
          border: 1px solid rgba(0, 153, 255, 0.4);
          border-radius: 8px;
          color: #0099ff;
          font-family: 'Space Grotesk', sans-serif;
          font-size: 11.5px;
          font-weight: 600;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          cursor: pointer;
          transition: background 0.2s, border-color 0.2s, color 0.2s, box-shadow 0.2s;
        }

        .contrib-submit:hover:not(:disabled) {
          background: rgba(0, 153, 255, 0.25);
          border-color: rgba(0, 153, 255, 0.7);
          color: #33bbff;
          box-shadow: 0 0 16px rgba(0, 153, 255, 0.25);
        }

        .contrib-submit:disabled {
          background: rgba(0, 153, 255, 0.04);
          border-color: rgba(0, 153, 255, 0.12);
          color: rgba(200, 220, 255, 0.3);
          cursor: not-allowed;
        }

        @media (max-width: 600px) {
          .contrib-row {
            grid-template-columns: 1fr;
          }
          .contrib-submit {
            align-self: stretch;
            text-align: center;
          }
        }
      `}</style>
    </form>
  );
}
