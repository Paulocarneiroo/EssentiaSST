import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { relatorioApi } from '../../api/relatorioApi';
import { formatCnpj, formatDateTime } from '../../services/format';
import { LABEL_CLASSIFICACAO, LABEL_TIPO_RISCO, VARIANT_CLASSIFICACAO } from '../../services/labels';
import type { RelatorioPGR } from '../../types/relatorio';
import { TIPOS_RISCO, type ClassificacaoRisco } from '../../types/risco';
import {
  Badge,
  Card,
  CardTabela,
  Loading,
  PageError,
  PageHeader,
  StatCard,
  Table,
  useDocumentTitle,
} from '../components';
import { baixarArquivo } from '../html';
import { showToast, toastErro } from '../toast';

const CLASSIFICACOES: readonly ClassificacaoRisco[] = ['CRITICO', 'ALTO', 'MODERADO', 'BAIXO'];

export const PgrPage = () => {
  useDocumentTitle('Relatório PGR');
  const [relatorio, setRelatorio] = useState<RelatorioPGR | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void relatorioApi
      .pgrJson()
      .then((dados) => {
        if (ativo) setRelatorio(dados);
      })
      .catch((error: unknown) => {
        if (!ativo) return;
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar esta página.');
      });
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) return <PageError titulo="Relatório PGR" mensagem={erro} />;
  if (!relatorio) return <Loading />;

  const { empresa, resumo, itens } = relatorio;
  const nomeBase = `pgr-${empresa.cnpj}-${new Date().toISOString().slice(0, 10)}`;
  const tiposPresentes = TIPOS_RISCO.filter((tipo) => resumo.porTipo[tipo] > 0);

  const baixarHtml = async (): Promise<void> => {
    try {
      const html = await relatorioApi.pgrHtml();
      baixarArquivo(html, `${nomeBase}.html`, 'text/html');
      showToast('Relatório HTML baixado.');
    } catch (error) {
      toastErro(error, 'Não foi possível gerar o relatório em HTML.');
    }
  };

  return (
    <>
      <PageHeader
        titulo="Relatório do PGR"
        subtitulo={`Gerado em ${formatDateTime(relatorio.geradoEm)} · ${empresa.razaoSocial} · CNPJ ${formatCnpj(empresa.cnpj)}`}
        acoes={
          <>
            <button type="button" className="btn btn-outline-secondary me-2" onClick={() => void baixarHtml()}>
              Baixar HTML
            </button>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => {
                baixarArquivo(JSON.stringify(relatorio, null, 2), `${nomeBase}.json`, 'application/json');
                showToast('Relatório JSON baixado.');
              }}
            >
              Baixar JSON
            </button>
          </>
        }
      />

      <div className="stat-grid mb-4">
        <StatCard label="Riscos inventariados" valor={resumo.totalRiscos} />
        <StatCard label="Maior nível" valor={resumo.maiorNivel} detalhe="escala de 1 a 25" />
        {CLASSIFICACOES.map((classificacao) => (
          <StatCard
            key={classificacao}
            label={LABEL_CLASSIFICACAO[classificacao]}
            valor={resumo.porClassificacao[classificacao]}
            variant={resumo.porClassificacao[classificacao] ? VARIANT_CLASSIFICACAO[classificacao] : undefined}
          />
        ))}
      </div>

      {tiposPresentes.length ? (
        <Card classe="mb-4">
          <span className="text-muted small">
            Distribuição por natureza do agente —{' '}
            {tiposPresentes.map((tipo, indice) => (
              <span key={tipo}>
                {indice > 0 ? ' · ' : null}
                {LABEL_TIPO_RISCO[tipo]}: <strong>{resumo.porTipo[tipo]}</strong>
              </span>
            ))}
          </span>
        </Card>
      ) : null}

      <CardTabela
        titulo="Inventário priorizado e medidas de controle (NR-01)"
        acoes={
          <Link className="btn btn-sm btn-outline-primary" to="/riscos">
            Gerenciar riscos
          </Link>
        }
      >
        <Table
          colunas={['Risco', 'Sev. × Prob.', 'Nível', 'Classificação', 'Medidas sugeridas']}
          linhas={itens.map((item) => (
            <tr key={item.id}>
              <td>
                <span className="fw-semibold">{item.descricao}</span>
                <div className="text-muted small">{LABEL_TIPO_RISCO[item.tipo]}</div>
              </td>
              <td className="text-center">
                {item.severidade} × {item.probabilidade}
              </td>
              <td className="text-center fw-semibold">{item.nivelRisco}</td>
              <td>
                <Badge
                  label={LABEL_CLASSIFICACAO[item.classificacao]}
                  variant={VARIANT_CLASSIFICACAO[item.classificacao]}
                />
              </td>
              <td>
                <ul className="medidas-list">
                  {item.medidasControle.map((medida) => (
                    <li key={medida}>{medida}</li>
                  ))}
                </ul>
              </td>
            </tr>
          ))}
          vazio="Nenhum risco inventariado. Cadastre os riscos para gerar o PGR."
        />
      </CardTabela>

      <p className="text-muted small mt-3">
        As medidas são uma sugestão automática na hierarquia da NR-01 e não substituem a avaliação do
        responsável técnico.
      </p>
    </>
  );
};
