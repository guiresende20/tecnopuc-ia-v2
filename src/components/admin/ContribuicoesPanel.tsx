'use client';

// Painel de moderação de contribuições da comunidade.
// Renderizado dentro de admin/page.tsx quando a aba "Contribuições" está ativa.

import { useState, useEffect, useCallback } from 'react';

interface Props {
  authHeader: string;
  onPendingCountChange?: (count: number) => void;
}

interface Contribuicao {
  id: string;
  conteudo_original: string;
  conteudo_aprovado: string | null;
  categoria: string | null;
  email: string;
  status: 'aguardando_email' | 'aguardando_revisao' | 'aprovada' | 'rejeitada';
  criada_em: string;
  email_verificado_em: string | null;
  revisada_por: string | null;
  revisada_em: string | null;
  motivo_rejeicao: string | null;
  knowledge_source_id: number | null;
}

type StatusFilter = 'aguardando_revisao' | 'aprovada' | 'rejeitada';

const FILTER_LABELS: Record<StatusFilter, string> = {
  aguardando_revisao: 'Pendentes',
  aprovada: 'Aprovadas',
  rejeitada: 'Rejeitadas',
};

export function ContribuicoesPanel({ authHeader, onPendingCountChange }: Props) {
  const [items, setItems] = useState<Contribuicao[]>([]);
  const [filter, setFilter] = useState<StatusFilter>('aguardando_revisao');
  const [loading, setLoading] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Estado da edição inline
  const [editTitulo, setEditTitulo] = useState('');
  const [editConteudo, setEditConteudo] = useState('');
  const [editMotivo, setEditMotivo] = useState('');
  const [acting, setActing] = useState(false);

  const fetchList = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/contribuicoes?status=${filter}`, {
        headers: { Authorization: authHeader },
      });
      if (res.ok) {
        const data = await res.json();
        setItems((data.items as Contribuicao[]) || []);
        onPendingCountChange?.(data.pendingCount ?? 0);
      } else {
        setItems([]);
      }
    } catch (e) {
      console.error('[admin contribuicoes] fetch falhou:', e);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [authHeader, filter, onPendingCountChange]);

  useEffect(() => {
    fetchList();
  }, [fetchList]);

  function startReview(item: Contribuicao) {
    setExpandedId(item.id);
    setEditConteudo(item.conteudo_original);
    setEditTitulo(item.categoria || '');
    setEditMotivo('');
  }

  function cancelReview() {
    setExpandedId(null);
    setEditConteudo('');
    setEditTitulo('');
    setEditMotivo('');
  }

  async function aprovar(id: string) {
    if (!editTitulo.trim()) {
      alert('Defina um título para a contribuição antes de aprovar.');
      return;
    }
    if (editConteudo.trim().length < 50) {
      alert('Conteúdo precisa ter pelo menos 50 caracteres.');
      return;
    }

    setActing(true);
    try {
      const res = await fetch('/api/admin/contribuicoes', {
        method: 'PATCH',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          acao: 'aprovar',
          titulo: editTitulo.trim(),
          conteudo_aprovado: editConteudo.trim(),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        alert(`Contribuição aprovada e indexada no RAG (${data.chunkCount} chunks).`);
        cancelReview();
        fetchList();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Falha ao aprovar: ' + (err.error || 'erro desconhecido'));
      }
    } catch {
      alert('Erro de conexão ao aprovar.');
    } finally {
      setActing(false);
    }
  }

  async function rejeitar(id: string) {
    if (!confirm('Confirmar rejeição desta contribuição?')) return;
    setActing(true);
    try {
      const res = await fetch('/api/admin/contribuicoes', {
        method: 'PATCH',
        headers: { Authorization: authHeader, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          acao: 'rejeitar',
          motivo_rejeicao: editMotivo.trim() || null,
        }),
      });
      if (res.ok) {
        cancelReview();
        fetchList();
      } else {
        const err = await res.json().catch(() => ({}));
        alert('Falha ao rejeitar: ' + (err.error || 'erro desconhecido'));
      }
    } catch {
      alert('Erro de conexão ao rejeitar.');
    } finally {
      setActing(false);
    }
  }

  return (
    <div className="admin-panel contribuicoes-panel">
      <div className="contrib-toolbar">
        <h3>Contribuições da Comunidade</h3>
        <div className="contrib-filters">
          {(Object.keys(FILTER_LABELS) as StatusFilter[]).map((s) => (
            <button
              key={s}
              className={filter === s ? 'active' : ''}
              onClick={() => {
                cancelReview();
                setFilter(s);
              }}
            >
              {FILTER_LABELS[s]}
            </button>
          ))}
          <button
            className="contrib-refresh"
            onClick={fetchList}
            disabled={loading}
            title="Atualizar"
          >
            ↻
          </button>
        </div>
      </div>

      {loading && items.length === 0 && (
        <p className="contrib-empty">Carregando...</p>
      )}

      {!loading && items.length === 0 && (
        <p className="contrib-empty">Nenhuma contribuição em &quot;{FILTER_LABELS[filter]}&quot;.</p>
      )}

      <ul className="contrib-list">
        {items.map((item) => {
          const isExpanded = expandedId === item.id;
          const conteudoMostrado =
            item.status === 'aprovada' && item.conteudo_aprovado
              ? item.conteudo_aprovado
              : item.conteudo_original;

          return (
            <li key={item.id} className={`contrib-card ${isExpanded ? 'expanded' : ''}`}>
              <div className="contrib-meta">
                <span className="contrib-email">{item.email}</span>
                {item.categoria && <span className="contrib-tag">{item.categoria}</span>}
                <span className="contrib-date">
                  {new Date(item.criada_em).toLocaleString('pt-BR')}
                </span>
              </div>

              {!isExpanded && (
                <>
                  <p className="contrib-preview">
                    {conteudoMostrado.slice(0, 240)}
                    {conteudoMostrado.length > 240 ? '…' : ''}
                  </p>

                  {filter === 'aguardando_revisao' && (
                    <button className="primary-btn" onClick={() => startReview(item)}>
                      Revisar
                    </button>
                  )}

                  {filter === 'aprovada' && item.revisada_por && (
                    <p className="contrib-meta-small">
                      Aprovada por <strong>{item.revisada_por}</strong>
                      {item.revisada_em && (
                        <> em {new Date(item.revisada_em).toLocaleString('pt-BR')}</>
                      )}
                      {item.knowledge_source_id && (
                        <> · ID na base: {item.knowledge_source_id}</>
                      )}
                    </p>
                  )}

                  {filter === 'rejeitada' && (
                    <>
                      {item.motivo_rejeicao && (
                        <p className="contrib-rejection">Motivo: {item.motivo_rejeicao}</p>
                      )}
                      <p className="contrib-meta-small">
                        Rejeitada por <strong>{item.revisada_por}</strong>
                        {item.revisada_em && (
                          <> em {new Date(item.revisada_em).toLocaleString('pt-BR')}</>
                        )}
                      </p>
                    </>
                  )}
                </>
              )}

              {isExpanded && (
                <div className="contrib-edit">
                  <label>
                    Título do documento <span className="required">*</span>
                    <input
                      type="text"
                      value={editTitulo}
                      onChange={(e) => setEditTitulo(e.target.value)}
                      placeholder="Ex: Empresa XYZ no TecnoPUC"
                    />
                  </label>
                  <label>
                    Conteúdo (edite se necessário antes de aprovar)
                    <textarea
                      rows={12}
                      value={editConteudo}
                      onChange={(e) => setEditConteudo(e.target.value)}
                    />
                  </label>
                  <label>
                    Motivo de rejeição{' '}
                    <span style={{ color: '#64748b', fontWeight: 'normal' }}>
                      (opcional, só usado se for rejeitar)
                    </span>
                    <input
                      type="text"
                      value={editMotivo}
                      onChange={(e) => setEditMotivo(e.target.value)}
                      placeholder="Ex: conteúdo fora do escopo"
                    />
                  </label>
                  <div className="contrib-actions">
                    <button
                      className="primary-btn"
                      onClick={() => aprovar(item.id)}
                      disabled={acting}
                    >
                      {acting ? 'Processando...' : 'Aprovar e indexar no RAG'}
                    </button>
                    <button
                      className="danger-btn"
                      onClick={() => rejeitar(item.id)}
                      disabled={acting}
                    >
                      Rejeitar
                    </button>
                    <button
                      className="logout-btn"
                      onClick={cancelReview}
                      disabled={acting}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
