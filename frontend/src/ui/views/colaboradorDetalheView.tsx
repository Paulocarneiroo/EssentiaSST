import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { acidenteService } from '../../services/acidenteService';
import { asoService } from '../../services/asoService';
import { colaboradorService } from '../../services/colaboradorService';
import { eventoService } from '../../services/eventoService';
import { formatCpf, formatDate, formatDateTime, formatHora } from '../../services/format';
import {
  LABEL_RESULTADO_ASO,
  LABEL_SITUACAO_APTIDAO,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_ACIDENTE,
  LABEL_TIPO_EXAME,
  SIGLA_TIPO_EVENTO,
  VARIANT_RESULTADO_ASO,
  VARIANT_SITUACAO_APTIDAO,
  VARIANT_STATUS_EVENTO,
} from '../../services/labels';
import type { Acidente } from '../../types/acidente';
import type { AvaliacaoAptidao } from '../../types/aptidao';
import type { Aso } from '../../types/aso';
import type { Colaborador } from '../../types/colaborador';
import type { EventoESocial } from '../../types/evento';
import {
  Badge,
  Card,
  CardTabela,
  DefinitionList,
  Loading,
  PageError,
  PageHeader,
  Table,
  useDocumentTitle,
} from '../components';
import { showToast, toastErro } from '../toast';
import { abrirModalAcidente, CelulaCatDoAcidente } from './acidenteView';
import { abrirModalAso, CelulaEventoDoAso } from './asoView';
import { abrirModalColaborador, abrirModalDesligamento } from './colaboradorView';

interface DetalheDados {
  colaborador: Colaborador;
  asos: Aso[];
  acidentes: Acidente[];
  eventos: EventoESocial[];
  aptidao: AvaliacaoAptidao;
}

export const ColaboradorDetalhePage = () => {
  useDocumentTitle('Colaborador');
  const { id = '' } = useParams();
  const [dados, setDados] = useState<DetalheDados | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [gerandoAsoId, setGerandoAsoId] = useState<string | null>(null);
  const [gerandoCatId, setGerandoCatId] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    const [colaborador, asos, acidentes, eventos] = await Promise.all([
      colaboradorService.buscar(id),
      asoService.listar(id),
      acidenteService.listar(id),
      eventoService.listar(),
    ]);
    const aptidao = await colaboradorService.aptidao(id);
    setDados({
      colaborador,
      asos,
      acidentes,
      eventos: eventos.filter((evento) => evento.colaboradorId === id),
      aptidao,
    });
  }, [id]);

  useEffect(() => {
    let ativo = true;
    setDados(null);
    setErro(null);
    void recarregar().catch((error: unknown) => {
      if (!ativo) return;
      setErro(error instanceof Error ? error.message : 'Não foi possível carregar esta página.');
    });
    return () => {
      ativo = false;
    };
  }, [recarregar]);

  if (erro) return <PageError titulo="Colaborador" mensagem={erro} />;
  if (!dados) return <Loading />;

  const { colaborador, asos, acidentes, eventos, aptidao } = dados;
  const ativo = colaboradorService.ativo(colaborador);

  const eventoDoAso = (asoId: string): EventoESocial | undefined =>
    eventos.find((evento) => evento.asoId === asoId);
  const eventoDoAcidente = (acidenteId: string): EventoESocial | undefined =>
    eventos.find((evento) => evento.acidenteId === acidenteId);

  const gerarEvento = async (asoId: string): Promise<void> => {
    setGerandoAsoId(asoId);
    try {
      await eventoService.gerarDeAso(asoId);
      showToast('Evento S-2220 gerado e validado contra o schema.');
      await recarregar();
    } catch (error) {
      toastErro(error, 'Não foi possível gerar o evento.');
    } finally {
      setGerandoAsoId(null);
    }
  };

  const gerarCat = async (acidenteId: string): Promise<void> => {
    setGerandoCatId(acidenteId);
    try {
      await eventoService.gerarDeAcidente(acidenteId);
      showToast('CAT (S-2210) gerada e validada contra o schema.');
      await recarregar();
    } catch (error) {
      toastErro(error, 'Não foi possível gerar a CAT.');
    } finally {
      setGerandoCatId(null);
    }
  };

  return (
    <>
      <PageHeader
        titulo={colaborador.nome}
        subtitulo={`${colaborador.cargo} · CPF ${formatCpf(colaborador.cpf)}`}
        voltar={{ href: '/colaboradores', label: 'Colaboradores' }}
        acoes={
          <>
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => abrirModalColaborador(colaborador, recarregar)}
            >
              Editar
            </button>
            {ativo ? (
              <button
                type="button"
                className="btn btn-outline-warning ms-2"
                onClick={() => abrirModalDesligamento(colaborador, recarregar)}
              >
                Desligar
              </button>
            ) : null}
          </>
        }
      />

      <div className="row g-4 mb-4">
        <div className="col-lg-6">
          <Card>
            <h2 className="h6 mb-3">Dados cadastrais</h2>
            <DefinitionList
              itens={[
                { termo: 'CPF', valor: formatCpf(colaborador.cpf) },
                { termo: 'Cargo', valor: colaborador.cargo },
                { termo: 'Nascimento', valor: formatDate(colaborador.dataNascimento) },
                { termo: 'Admissão', valor: formatDate(colaborador.dataAdmissao) },
                {
                  termo: 'Vínculo',
                  valor: ativo ? (
                    <Badge label="Ativo" variant="success" />
                  ) : (
                    <Badge label={`Desligado em ${formatDate(colaborador.dataDemissao)}`} variant="dark" />
                  ),
                },
              ]}
            />
          </Card>
        </div>
        <div className="col-lg-6">
          <Card>
            <div className="d-flex justify-content-between align-items-start mb-3">
              <h2 className="h6 mb-0">Aptidão para a função</h2>
              <Badge
                label={LABEL_SITUACAO_APTIDAO[aptidao.situacao]}
                variant={VARIANT_SITUACAO_APTIDAO[aptidao.situacao]}
              />
            </div>
            <p className="text-muted small">{aptidao.motivo}</p>
            <DefinitionList
              itens={[
                {
                  termo: 'ASO vigente',
                  valor: aptidao.asoVigente
                    ? `${LABEL_TIPO_EXAME[aptidao.asoVigente.tipoExame]} · ${formatDate(aptidao.asoVigente.dataExame)}`
                    : '—',
                },
                {
                  termo: 'Periodicidade (NR-07)',
                  valor: aptidao.periodicidadeMeses ? `${aptidao.periodicidadeMeses} meses` : '—',
                },
                { termo: 'Próximo vencimento', valor: formatDate(aptidao.proximoVencimento) },
                {
                  termo: 'Dias para vencer',
                  valor:
                    aptidao.diasParaVencimento === null
                      ? '—'
                      : aptidao.diasParaVencimento < 0 ? (
                          <Badge
                            label={`${Math.abs(aptidao.diasParaVencimento)} dias em atraso`}
                            variant="danger"
                          />
                        ) : (
                          String(aptidao.diasParaVencimento)
                        ),
                },
              ]}
            />
          </Card>
        </div>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <CardTabela
            titulo="Histórico de ASOs"
            acoes={
              <button
                type="button"
                className="btn btn-sm btn-primary"
                onClick={() =>
                  abrirModalAso({
                    colaboradores: [colaborador],
                    colaboradorId: colaborador.id,
                    aoConcluir: recarregar,
                  })
                }
              >
                Registrar ASO
              </button>
            }
          >
            <Table
              colunas={['Data', 'Tipo', 'Resultado', 'Médico', 'eSocial']}
              linhas={asos.map((aso) => (
                <tr key={aso.id}>
                  <td className="text-nowrap">{formatDate(aso.dataExame)}</td>
                  <td>{LABEL_TIPO_EXAME[aso.tipoExame]}</td>
                  <td>
                    <Badge
                      label={LABEL_RESULTADO_ASO[aso.resultado]}
                      variant={VARIANT_RESULTADO_ASO[aso.resultado]}
                    />
                  </td>
                  <td>
                    {aso.medico}
                    <div className="text-muted small">CRM {aso.crm}</div>
                  </td>
                  <td>
                    <CelulaEventoDoAso
                      aso={aso}
                      evento={eventoDoAso(aso.id)}
                      onGerar={(asoId) => void gerarEvento(asoId)}
                      gerando={gerandoAsoId === aso.id}
                    />
                  </td>
                </tr>
              ))}
              vazio="Nenhum ASO registrado para este trabalhador."
            />
          </CardTabela>
        </div>

        <div className="col-lg-5">
          <CardTabela
            titulo="Eventos eSocial"
            acoes={
              <Link className="btn btn-sm btn-outline-primary" to="/esocial">
                Acompanhar
              </Link>
            }
          >
            <Table
              colunas={['Evento', 'Status', 'Retorno', 'Envio']}
              linhas={eventos.map((evento) => (
                <tr key={evento.id}>
                  <td className="mono">{SIGLA_TIPO_EVENTO[evento.tipoEvento]}</td>
                  <td>
                    <Badge
                      label={LABEL_STATUS_EVENTO[evento.status]}
                      variant={VARIANT_STATUS_EVENTO[evento.status]}
                    />
                  </td>
                  <td className="text-muted small">{evento.protocolo ?? evento.mensagemErro ?? '—'}</td>
                  <td className="text-nowrap text-muted small">{formatDateTime(evento.dataEnvio)}</td>
                </tr>
              ))}
              vazio="Nenhum evento gerado para este trabalhador."
            />
          </CardTabela>
        </div>

        <div className="col-12">
          <CardTabela
            titulo="Acidentes de trabalho"
            acoes={
              <button
                type="button"
                className="btn btn-sm btn-outline-danger"
                onClick={() =>
                  abrirModalAcidente({
                    colaboradores: [colaborador],
                    colaboradorId: colaborador.id,
                    aoConcluir: recarregar,
                  })
                }
              >
                Registrar acidente
              </button>
            }
          >
            <Table
              colunas={['Ocorrência', 'Natureza', 'Comunicação', 'eSocial']}
              linhas={acidentes.map((acidente) => (
                <tr key={acidente.id}>
                  <td className="text-nowrap">
                    {formatDate(acidente.dataAcidente)}
                    <div className="text-muted small">{formatHora(acidente.horaAcidente)}</div>
                  </td>
                  <td>
                    {LABEL_TIPO_ACIDENTE[acidente.tipoAcidente]}
                    <div className="text-muted small">{acidente.localAcidente}</div>
                  </td>
                  <td>
                    {acidenteService.prazoExpirado(acidente) ? (
                      <Badge label="Prazo expirado" variant="danger" />
                    ) : (
                      <Badge label="No prazo" variant="success" />
                    )}
                  </td>
                  <td>
                    <CelulaCatDoAcidente
                      acidente={acidente}
                      evento={eventoDoAcidente(acidente.id)}
                      onGerar={(acidenteId) => void gerarCat(acidenteId)}
                      gerando={gerandoCatId === acidente.id}
                    />
                  </td>
                </tr>
              ))}
              vazio="Nenhum acidente registrado para este trabalhador."
            />
          </CardTabela>
        </div>
      </div>
    </>
  );
};
