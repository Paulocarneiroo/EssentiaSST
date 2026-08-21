import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import type { Variant } from '../services/labels';

export const useDocumentTitle = (titulo: string): void => {
  useEffect(() => {
    document.title = `${titulo} · EssentiaSST`;
  }, [titulo]);
};

export interface PageHeaderOptions {
  titulo: string;
  subtitulo?: string;
  acoes?: ReactNode;
  voltar?: { href: string; label: string };
}

export const PageHeader = ({ titulo, subtitulo, acoes, voltar }: PageHeaderOptions) => (
  <header className="page-header">
    {voltar ? (
      <Link className="back-link" to={voltar.href}>
        ← {voltar.label}
      </Link>
    ) : null}
    <div className="page-header-row">
      <div>
        <h1>{titulo}</h1>
        {subtitulo ? <p className="text-muted mb-0">{subtitulo}</p> : null}
      </div>
      {acoes ? <div className="page-header-actions">{acoes}</div> : null}
    </div>
  </header>
);

export const Badge = ({
  label,
  variant = 'secondary',
}: {
  label: string;
  variant?: Variant;
}) => <span className={`badge text-bg-${variant}`}>{label}</span>;

export const Loading = ({ mensagem = 'Carregando...' }: { mensagem?: string }) => (
  <div className="loading-overlay">
    <div className="spinner-border spinner-border-sm text-primary" role="status" aria-hidden="true" />
    <span>{mensagem}</span>
  </div>
);

export const EmptyState = ({ mensagem, acao }: { mensagem: string; acao?: ReactNode }) => (
  <div className="empty-state">
    <p className={`mb-${acao ? '3' : '0'}`}>{mensagem}</p>
    {acao}
  </div>
);

export const AlertBox = ({
  mensagem,
  variant = 'danger',
}: {
  mensagem: string;
  variant?: Variant;
}) => (
  <div className={`alert alert-${variant} mb-0`} role="alert">
    {mensagem}
  </div>
);

export const PageError = ({ titulo, mensagem }: { titulo: string; mensagem: string }) => (
  <>
    <PageHeader titulo={titulo} />
    <AlertBox mensagem={mensagem} />
  </>
);

export interface StatCardOptions {
  label: string;
  valor: string | number;
  detalhe?: string;
  variant?: Variant;
  href?: string;
}

export const StatCard = ({ label, valor, detalhe, variant, href }: StatCardOptions) => {
  const conteudo = (
    <>
      <span className="stat-label">{label}</span>
      <strong className={`stat-value${variant ? ` text-${variant}` : ''}`}>{valor}</strong>
      {detalhe ? <span className="stat-detail">{detalhe}</span> : null}
    </>
  );

  return href ? (
    <Link className="stat-card stat-card-link" to={href}>
      {conteudo}
    </Link>
  ) : (
    <div className="stat-card">{conteudo}</div>
  );
};

export interface TableOptions {
  colunas: ReactNode[];
  linhas: ReactNode[];
  vazio: string;
}

export const Table = ({ colunas, linhas, vazio }: TableOptions) => {
  if (linhas.length === 0) {
    return <EmptyState mensagem={vazio} />;
  }

  return (
    <div className="table-responsive">
      <table className="table table-hover align-middle mb-0">
        <thead>
          <tr>
            {colunas.map((coluna, indice) => (
              <th key={indice}>{coluna}</th>
            ))}
          </tr>
        </thead>
        <tbody>{linhas}</tbody>
      </table>
    </div>
  );
};

export const Card = ({
  children,
  classe = '',
}: {
  children: ReactNode;
  classe?: string;
}) => (
  <div className={`card app-card ${classe}`.trim()}>
    <div className="card-body">{children}</div>
  </div>
);

export const CardTabela = ({
  titulo,
  children,
  acoes,
}: {
  titulo: string;
  children: ReactNode;
  acoes?: ReactNode;
}) => (
  <div className="card app-card">
    <div className="card-header d-flex justify-content-between align-items-center">
      <h2 className="h6 mb-0">{titulo}</h2>
      {acoes}
    </div>
    <div className="card-body p-0">{children}</div>
  </div>
);

/** Lista de pares rótulo/valor; o valor pode conter badges. */
export const DefinitionList = ({ itens }: { itens: { termo: string; valor: ReactNode }[] }) => (
  <dl className="definition-list">
    {itens.map(({ termo, valor }) => (
      <div key={termo}>
        <dt>{termo}</dt>
        <dd>{valor}</dd>
      </div>
    ))}
  </dl>
);
