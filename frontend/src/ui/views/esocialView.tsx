import { useCallback, useEffect, useState } from 'react';
import { colaboradorService } from '../../services/colaboradorService';
import { eventoService } from '../../services/eventoService';
import { formatDateTime } from '../../services/format';
import {
  LABEL_AMBIENTE,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_EVENTO,
  SIGLA_TIPO_EVENTO,
  VARIANT_AMBIENTE,
  VARIANT_STATUS_EVENTO,
} from '../../services/labels';
import { isAdmin } from '../../state/session';
import type { Colaborador } from '../../types/colaborador';
import { STATUS_EVENTO, type EventoESocial, type StatusEventoESocial } from '../../types/evento';
import {
  AlertBox,
  Badge,
  CardTabela,
  Loading,
  PageError,
  PageHeader,
  StatCard,
  Table,
  useDocumentTitle,
} from '../components';
import { baixarArquivo } from '../html';
import { openInfoModal } from '../modal';
import { showToast, toastErro } from '../toast';

const origem = (evento: EventoESocial): string => {
  if (evento.asoId) return 'ASO (monitoramento da saúde)';
  if (evento.acidenteId) return 'Acidente de trabalho';
  if (evento.riscoId) return 'Risco do PGR';
  return 'Sem fato de origem';
};

const verXml = async (evento: EventoESocial): Promise<void> => {
  const xml = await eventoService.xml(evento.id);
  const arquivo = `${SIGLA_TIPO_EVENTO[evento.tipoEvento]}-${evento.id}.xml`;

  openInfoModal({
    titulo: `XML do evento ${SIGLA_TIPO_EVENTO[evento.tipoEvento]}`,
    tamanho: 'xl',
    corpo: (
      <>
        <p className="text-muted small">
          Payload montado pelo backend conforme o leiaute S-1.2 e validado contra o schema antes de ficar
          apto ao envio.
        </p>
        <pre className="xml-viewer">
          <code>{xml}</code>
        </pre>
      </>
    ),
    acoes: (
      <button
        type="button"
        className="btn btn-outline-primary"
        onClick={() => baixarArquivo(xml, arquivo, 'application/xml')}
      >
        Baixar XML
      </button>
    ),
  });
};

export const ESocialPage = () => {
  useDocumentTitle('eSocial');
  const [eventos, setEventos] = useState<EventoESocial[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [filtroStatus, setFiltroStatus] = useState<StatusEventoESocial | ''>('');
  const [ocupadoId, setOcupadoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    const [listaEventos, listaColaboradores] = await Promise.all([
      eventoService.listar(),
      colaboradorService.listar(),
    ]);
    setEventos(listaEventos);
    setColaboradores(listaColaboradores);
  }, []);

  useEffect(() => {
    let ativo = true;
    void recarregar()
      .catch((error: unknown) => {
        if (!ativo) return;
        setErro(error instanceof Error ? error.message : 'Não foi possível carregar esta página.');
      })
      .finally(() => {
        if (ativo) setCarregando(false);
      });
    return () => {
      ativo = false;
    };
  }, [recarregar]);

  if (erro) return <PageError titulo="eSocial" mensagem={erro} />;
  if (carregando) return <Loading />;

  const nomePorId = (id: string | null): string => {
    if (!id) return '—';
    const colaborador = colaboradores.find((item) => item.id === id);
    return colaborador?.nome ?? 'Colaborador removido';
  };

  const contagem = eventoService.contarPorStatus(eventos);
  const visiveis = filtroStatus ? eventos.filter((evento) => evento.status === filtroStatus) : eventos;
  const ambienteCorrente = eventos[0]?.ambiente;

  const enviar = async (evento: EventoESocial): Promise<void> => {
    setOcupadoId(evento.id);
    try {
      const atualizado = await eventoService.enviar(evento.id);
      if (atualizado.status === 'ACEITO') {
        showToast(`Evento aceito. Protocolo ${atualizado.protocolo ?? '—'}.`);
      } else {
        showToast(atualizado.mensagemErro ?? 'Evento rejeitado pelo eSocial.', 'danger');
      }
      await recarregar();
    } catch (error) {
      toastErro(error, 'Não foi possível enviar o evento.');
    } finally {
      setOcupadoId(null);
    }
  };

  const reenviar = async (evento: EventoESocial): Promise<void> => {
    setOcupadoId(evento.id);
    try {
      const atualizado = await eventoService.reenviar(evento.id);
      if (atualizado.status === 'ACEITO') {
        showToast(`Reenvio aceito. Protocolo ${atualizado.protocolo ?? '—'}.`);
      } else {
        showToast(atualizado.mensagemErro ?? 'Evento rejeitado novamente.', 'danger');
      }
      await recarregar();
    } catch (error) {
      toastErro(error, 'Não foi possível reenviar o evento.');
    } finally {
      setOcupadoId(null);
    }
  };

  return (
    <>
      <PageHeader
        titulo="Mensageria eSocial"
        subtitulo="Ciclo de vida dos eventos: PENDENTE → ENVIADO → ACEITO ou REJEITADO."
        acoes={
          ambienteCorrente ? (
            <span className="ambiente-tag">
              Destino: <Badge label={LABEL_AMBIENTE[ambienteCorrente]} variant={VARIANT_AMBIENTE[ambienteCorrente]} />
            </span>
          ) : null
        }
      />

      <div className="stat-grid mb-4">
        <StatCard label="Pendentes de envio" valor={contagem.PENDENTE} />
        <StatCard label="Enviados" valor={contagem.ENVIADO} variant={contagem.ENVIADO ? 'info' : undefined} />
        <StatCard label="Aceitos" valor={contagem.ACEITO} variant={contagem.ACEITO ? 'success' : undefined} />
        <StatCard label="Rejeitados" valor={contagem.REJEITADO} variant={contagem.REJEITADO ? 'danger' : undefined} />
      </div>

      <div className="mb-4">
        <AlertBox
          mensagem="O ambiente de destino (produção ou produção restrita/homologação) é definido na configuração do servidor. A troca de ambiente altera apenas para onde o evento é transmitido — as regras de negócio, a montagem e a validação do XML permanecem as mesmas."
          variant="info"
        />
      </div>

      <div className="toolbar mb-3">
        <select
          className="form-select form-select-sm toolbar-search"
          aria-label="Filtrar por status"
          value={filtroStatus}
          onChange={(event) => setFiltroStatus(event.target.value as StatusEventoESocial | '')}
        >
          <option value="">Todos os status</option>
          {STATUS_EVENTO.map((status) => (
            <option key={status} value={status}>
              {LABEL_STATUS_EVENTO[status]}
            </option>
          ))}
        </select>
        {isAdmin() ? null : (
          <span className="text-muted small align-self-center">
            Transmitir e reenviar são ações restritas a administradores.
          </span>
        )}
      </div>

      <CardTabela titulo="Eventos">
        <Table
          colunas={['Evento', 'Trabalhador', 'Status', 'Retorno', 'Ambiente', 'Envio', '']}
          linhas={visiveis.map((evento) => (
            <tr key={evento.id}>
              <td>
                <span className="fw-semibold mono">{SIGLA_TIPO_EVENTO[evento.tipoEvento]}</span>
                <div className="text-muted small">{origem(evento)}</div>
              </td>
              <td>{nomePorId(evento.colaboradorId)}</td>
              <td>
                <Badge
                  label={LABEL_STATUS_EVENTO[evento.status]}
                  variant={VARIANT_STATUS_EVENTO[evento.status]}
                />
                {evento.tentativas > 1 ? (
                  <div className="text-muted small">{evento.tentativas} tentativas</div>
                ) : null}
              </td>
              <td>
                {evento.protocolo ? (
                  <span className="mono small">{evento.protocolo}</span>
                ) : evento.mensagemErro ? (
                  <span className="text-danger small">{evento.mensagemErro}</span>
                ) : (
                  <span className="text-muted small">—</span>
                )}
              </td>
              <td>
                <Badge
                  label={evento.ambiente === 'PRODUCAO' ? 'Produção' : 'Homologação'}
                  variant={VARIANT_AMBIENTE[evento.ambiente]}
                />
              </td>
              <td className="text-nowrap text-muted small">{formatDateTime(evento.dataEnvio)}</td>
              <td className="text-end text-nowrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => {
                    void verXml(evento).catch((error: unknown) =>
                      toastErro(error, 'Não foi possível carregar o XML.'),
                    );
                  }}
                >
                  XML
                </button>
                {isAdmin() && eventoService.podeEnviar(evento) ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-primary ms-2"
                    disabled={ocupadoId === evento.id}
                    onClick={() => void enviar(evento)}
                  >
                    Enviar
                  </button>
                ) : null}
                {isAdmin() && eventoService.podeReenviar(evento) ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-warning ms-2"
                    disabled={ocupadoId === evento.id}
                    onClick={() => void reenviar(evento)}
                  >
                    Reenviar
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          vazio={
            eventos.length === 0
              ? 'Nenhum evento gerado. Gere a partir de um ASO, risco ou acidente já cadastrado.'
              : 'Nenhum evento com o status selecionado.'
          }
        />
      </CardTabela>

      <p className="text-muted small mt-3 mb-0">
        Tipos suportados: {Object.values(LABEL_TIPO_EVENTO).join(' · ')}.
      </p>
    </>
  );
};
