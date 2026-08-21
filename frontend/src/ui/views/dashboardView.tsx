import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { acidenteService } from '../../services/acidenteService';
import { asoService } from '../../services/asoService';
import { colaboradorService } from '../../services/colaboradorService';
import { empresaService } from '../../services/empresaService';
import { eventoService } from '../../services/eventoService';
import { formatCnpj, formatDate, pluralizar } from '../../services/format';
import {
  LABEL_AMBIENTE,
  LABEL_SITUACAO_APTIDAO,
  LABEL_STATUS_EVENTO,
  SIGLA_TIPO_EVENTO,
  VARIANT_AMBIENTE,
  VARIANT_SITUACAO_APTIDAO,
  VARIANT_STATUS_EVENTO,
} from '../../services/labels';
import { riscoService } from '../../services/riscoService';
import { getUsuario } from '../../state/session';
import type { AvaliacaoAptidao } from '../../types/aptidao';
import type { Colaborador } from '../../types/colaborador';
import { calcularNivelRisco, classificarRisco } from '../../types/risco';
import {
  Badge,
  CardTabela,
  EmptyState,
  Loading,
  PageError,
  PageHeader,
  StatCard,
  Table,
  useDocumentTitle,
} from '../components';

const SITUACOES_PENDENTES = ['VENCIDO', 'SEM_ASO', 'INAPTO'] as const;

interface DashboardDados {
  empresa: Awaited<ReturnType<typeof empresaService.minhaEmpresa>>;
  colaboradores: Colaborador[];
  riscos: Awaited<ReturnType<typeof riscoService.listar>>;
  eventos: Awaited<ReturnType<typeof eventoService.listar>>;
  acidentes: Awaited<ReturnType<typeof acidenteService.listar>>;
  asos: Awaited<ReturnType<typeof asoService.listar>>;
  aptidoes: Map<string, AvaliacaoAptidao>;
}

export const DashboardPage = () => {
  useDocumentTitle('Painel');
  const [dados, setDados] = useState<DashboardDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let ativo = true;
    void (async () => {
      try {
        const [empresa, colaboradores, riscos, eventos, acidentes, asos] = await Promise.all([
          empresaService.minhaEmpresa(),
          colaboradorService.listar(),
          riscoService.listar(),
          eventoService.listar(),
          acidenteService.listar(),
          asoService.listar(),
        ]);
        const ativos = colaboradores.filter(colaboradorService.ativo);
        const aptidoes = await colaboradorService.aptidoes(ativos.map((colaborador) => colaborador.id));
        if (!ativo) return;
        setDados({ empresa, colaboradores, riscos, eventos, acidentes, asos, aptidoes });
      } catch (error) {
        if (!ativo) return;
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar esta página.');
      }
    })();
    return () => {
      ativo = false;
    };
  }, []);

  if (erro) return <PageError titulo="Painel" mensagem={erro} />;
  if (!dados) return <Loading />;

  const { empresa, colaboradores, riscos, eventos, acidentes, asos, aptidoes } = dados;
  const ativos = colaboradores.filter(colaboradorService.ativo);

  const pendencias = ativos
    .map((colaborador) => ({ colaborador, avaliacao: aptidoes.get(colaborador.id) }))
    .filter(
      (item): item is { colaborador: Colaborador; avaliacao: AvaliacaoAptidao } =>
        item.avaliacao !== undefined &&
        (SITUACOES_PENDENTES as readonly string[]).includes(item.avaliacao.situacao),
    );

  const aptos = ativos.length - pendencias.length;
  const statusEventos = eventoService.contarPorStatus(eventos);
  const riscosPrioritarios = riscos.filter((risco) => {
    const classificacao = classificarRisco(calcularNivelRisco(risco));
    return classificacao === 'ALTO' || classificacao === 'CRITICO';
  });

  const acidentesComEvento = new Set(eventos.map((evento) => evento.acidenteId).filter(Boolean));
  const asosComEvento = new Set(eventos.map((evento) => evento.asoId).filter(Boolean));
  const acidentesSemCat = acidentes.filter((acidente) => !acidentesComEvento.has(acidente.id));
  const asosSemEvento = asos.filter((aso) => !asosComEvento.has(aso.id));

  const ambiente = eventos[0]?.ambiente;
  const nomeUsuario = getUsuario()?.nome.split(' ')[0] ?? '';

  return (
    <>
      <PageHeader
        titulo={`Olá, ${nomeUsuario}`}
        subtitulo={`${empresa.nomeFantasia} · CNPJ ${formatCnpj(empresa.cnpj)} · Grau de risco ${empresa.grauRisco}`}
        acoes={
          ambiente ? (
            <span className="ambiente-tag">
              Ambiente eSocial: <Badge label={LABEL_AMBIENTE[ambiente]} variant={VARIANT_AMBIENTE[ambiente]} />
            </span>
          ) : null
        }
      />

      <div className="stat-grid mb-4">
        <StatCard
          label="Colaboradores ativos"
          valor={ativos.length}
          detalhe={`${colaboradores.length - ativos.length} desligado(s)`}
          href="/colaboradores"
        />
        <StatCard
          label="Aptidão em dia"
          valor={`${aptos}/${ativos.length}`}
          detalhe={
            pendencias.length
              ? pluralizar(pendencias.length, 'pendência', 'pendências')
              : 'Sem pendências'
          }
          variant={pendencias.length ? 'danger' : 'success'}
          href="/colaboradores"
        />
        <StatCard
          label="Riscos prioritários"
          valor={riscosPrioritarios.length}
          detalhe={`de ${pluralizar(riscos.length, 'risco mapeado', 'riscos mapeados')}`}
          variant={riscosPrioritarios.length ? 'warning' : undefined}
          href="/riscos"
        />
        <StatCard
          label="Eventos eSocial"
          valor={eventos.length}
          detalhe={`${statusEventos.ACEITO} aceito(s) · ${statusEventos.REJEITADO} rejeitado(s)`}
          variant={statusEventos.REJEITADO ? 'danger' : undefined}
          href="/esocial"
        />
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <CardTabela
            titulo="Pendências de aptidão (NR-07)"
            acoes={
              <Link className="btn btn-sm btn-outline-primary" to="/colaboradores">
                Ver todos
              </Link>
            }
          >
            <Table
              colunas={['Colaborador', 'Situação', 'Motivo']}
              linhas={pendencias.map(({ colaborador, avaliacao }) => (
                <tr key={colaborador.id}>
                  <td>
                    <Link to={`/colaboradores/${colaborador.id}`} className="fw-semibold">
                      {colaborador.nome}
                    </Link>
                    <div className="text-muted small">{colaborador.cargo}</div>
                  </td>
                  <td>
                    <Badge
                      label={LABEL_SITUACAO_APTIDAO[avaliacao.situacao]}
                      variant={VARIANT_SITUACAO_APTIDAO[avaliacao.situacao]}
                    />
                  </td>
                  <td className="text-muted small">{avaliacao.motivo}</td>
                </tr>
              ))}
              vazio="Nenhuma pendência de aptidão entre os colaboradores ativos."
            />
          </CardTabela>
        </div>

        <div className="col-lg-5">
          <CardTabela
            titulo="Últimos eventos eSocial"
            acoes={
              <Link className="btn btn-sm btn-outline-primary" to="/esocial">
                Acompanhar
              </Link>
            }
          >
            {eventos.slice(0, 5).length ? (
              <Table
                colunas={['Evento', 'Status', 'Retorno', 'Criado']}
                linhas={eventos.slice(0, 5).map((evento) => (
                  <tr key={evento.id}>
                    <td>
                      <span className="mono">{SIGLA_TIPO_EVENTO[evento.tipoEvento]}</span>
                    </td>
                    <td>
                      <Badge
                        label={LABEL_STATUS_EVENTO[evento.status]}
                        variant={VARIANT_STATUS_EVENTO[evento.status]}
                      />
                    </td>
                    <td className="text-muted small">{evento.protocolo ?? evento.mensagemErro ?? '—'}</td>
                    <td className="text-nowrap text-muted small">{formatDate(evento.createdAt)}</td>
                  </tr>
                ))}
                vazio=""
              />
            ) : (
              <EmptyState mensagem="Nenhum evento gerado até agora." />
            )}
          </CardTabela>
        </div>

        <div className="col-lg-6">
          <CardTabela
            titulo="CATs a comunicar"
            acoes={
              <Link className="btn btn-sm btn-outline-primary" to="/acidentes">
                Registrar CAT
              </Link>
            }
          >
            <Table
              colunas={['Acidente', 'Prazo legal']}
              linhas={acidentesSemCat.slice(0, 5).map((acidente) => {
                const expirado = acidenteService.prazoExpirado(acidente);
                return (
                  <tr key={acidente.id}>
                    <td>
                      <Link to="/acidentes" className="fw-semibold">
                        {formatDate(acidente.dataAcidente)}
                      </Link>
                      <div className="text-muted small">{acidente.localAcidente}</div>
                    </td>
                    <td>
                      <Badge
                        label={expirado ? 'Prazo expirado' : 'Dentro do prazo'}
                        variant={expirado ? 'danger' : 'success'}
                      />
                    </td>
                  </tr>
                );
              })}
              vazio="Todos os acidentes registrados já têm evento S-2210 gerado."
            />
          </CardTabela>
        </div>

        <div className="col-lg-6">
          <CardTabela
            titulo="ASOs sem evento S-2220"
            acoes={
              <Link className="btn btn-sm btn-outline-primary" to="/asos">
                Ver ASOs
              </Link>
            }
          >
            <Table
              colunas={['ASO', 'Data do exame']}
              linhas={asosSemEvento.slice(0, 5).map((aso) => (
                <tr key={aso.id}>
                  <td>
                    <Link to={`/colaboradores/${aso.colaboradorId}`} className="fw-semibold">
                      {aso.medico}
                    </Link>
                    <div className="text-muted small">CRM {aso.crm}</div>
                  </td>
                  <td className="text-nowrap">{formatDate(aso.dataExame)}</td>
                </tr>
              ))}
              vazio="Todos os ASOs registrados já têm evento gerado."
            />
          </CardTabela>
        </div>
      </div>
    </>
  );
};
