import { Link } from 'react-router-dom';
import { asoService, type AsoFormData } from '../../services/asoService';
import { colaboradorService } from '../../services/colaboradorService';
import { eventoService } from '../../services/eventoService';
import { formatDate, hojeInput, toDateInput } from '../../services/format';
import {
  LABEL_RESULTADO_ASO,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_EXAME,
  VARIANT_RESULTADO_ASO,
  VARIANT_STATUS_EVENTO,
  opcoesDe,
} from '../../services/labels';
import { isAdmin } from '../../state/session';
import { RESULTADOS_ASO, TIPOS_EXAME, type Aso } from '../../types/aso';
import type { Colaborador } from '../../types/colaborador';
import type { EventoESocial } from '../../types/evento';
import { Badge, CardTabela, Loading, PageError, PageHeader, Table, useDocumentTitle } from '../components';
import { readString, SelectField, TextField } from '../formFields';
import { openConfirm, openFormModal } from '../modal';
import { showToast } from '../toast';
import { useCallback, useEffect, useState } from 'react';

const opcoesColaborador = (colaboradores: Colaborador[]) =>
  colaboradores.map((colaborador) => ({
    value: colaborador.id,
    label: colaboradorService.ativo(colaborador)
      ? colaborador.nome
      : `${colaborador.nome} (desligado)`,
  }));

const CamposAso = ({
  colaboradores,
  aso,
  colaboradorFixo,
}: {
  colaboradores: Colaborador[];
  aso?: Aso;
  colaboradorFixo?: string;
}) => (
  <>
    {colaboradorFixo ? (
      <input type="hidden" name="colaboradorId" value={colaboradorFixo} />
    ) : (
      <SelectField
        name="colaboradorId"
        label="Colaborador"
        col={12}
        required
        options={opcoesColaborador(colaboradores)}
        value={aso?.colaboradorId}
        disabled={Boolean(aso)}
        help={aso ? 'O colaborador do ASO não pode ser alterado.' : undefined}
      />
    )}
    <SelectField
      name="tipoExame"
      label="Tipo de exame"
      col={6}
      required
      options={opcoesDe(TIPOS_EXAME, LABEL_TIPO_EXAME)}
      value={aso?.tipoExame}
    />
    <SelectField
      name="resultado"
      label="Resultado"
      col={6}
      required
      options={opcoesDe(RESULTADOS_ASO, LABEL_RESULTADO_ASO)}
      value={aso?.resultado}
    />
    <TextField
      name="dataExame"
      label="Data do exame"
      type="date"
      col={6}
      required
      value={aso ? toDateInput(aso.dataExame) : hojeInput()}
      help="Não pode estar no futuro."
    />
    <TextField name="crm" label="CRM" col={6} required maxlength={20} value={aso?.crm} />
    <TextField name="medico" label="Médico responsável" col={12} required value={aso?.medico} />
  </>
);

const lerAsoForm = (form: HTMLFormElement, colaboradorId?: string): AsoFormData => ({
  colaboradorId: colaboradorId ?? readString(form, 'colaboradorId'),
  tipoExame: readString(form, 'tipoExame') as AsoFormData['tipoExame'],
  resultado: readString(form, 'resultado') as AsoFormData['resultado'],
  dataExame: readString(form, 'dataExame'),
  medico: readString(form, 'medico'),
  crm: readString(form, 'crm'),
});

export interface ModalAsoOptions {
  colaboradores: Colaborador[];
  aso?: Aso;
  colaboradorId?: string;
  aoConcluir: () => Promise<void> | void;
}

export const abrirModalAso = ({
  colaboradores,
  aso,
  colaboradorId,
  aoConcluir,
}: ModalAsoOptions): void => {
  openFormModal({
    titulo: aso ? 'Editar ASO' : 'Registrar ASO',
    campos: <CamposAso colaboradores={colaboradores} aso={aso} colaboradorFixo={aso ? undefined : colaboradorId} />,
    confirmLabel: aso ? 'Salvar alterações' : 'Registrar',
    onConfirm: async (form) => {
      const dados = lerAsoForm(form, aso?.colaboradorId ?? colaboradorId);
      if (aso) {
        await asoService.atualizar(aso.id, dados);
        showToast('ASO atualizado.');
      } else {
        await asoService.criar(dados);
        showToast('ASO registrado.');
      }
      await aoConcluir();
    },
  });
};

export const CelulaEventoDoAso = ({
  aso,
  evento,
  onGerar,
  gerando,
}: {
  aso: Aso;
  evento?: EventoESocial;
  onGerar: (id: string) => void;
  gerando: boolean;
}) => {
  if (evento) {
    return (
      <Link to="/esocial" className="text-decoration-none">
        <Badge
          label={`S-2220 ${LABEL_STATUS_EVENTO[evento.status]}`}
          variant={VARIANT_STATUS_EVENTO[evento.status]}
        />
      </Link>
    );
  }
  return (
    <button
      type="button"
      className="btn btn-sm btn-outline-primary"
      disabled={gerando}
      onClick={() => onGerar(aso.id)}
    >
      Gerar S-2220
    </button>
  );
};

export const AsoPage = () => {
  useDocumentTitle('ASOs');
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [asos, setAsos] = useState<Aso[]>([]);
  const [eventos, setEventos] = useState<EventoESocial[]>([]);
  const [filtroColaborador, setFiltroColaborador] = useState('');
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    const [listaColaboradores, listaAsos, listaEventos] = await Promise.all([
      colaboradorService.listar(),
      asoService.listar(),
      eventoService.listar(),
    ]);
    setColaboradores(listaColaboradores);
    setAsos(listaAsos);
    setEventos(listaEventos);
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

  if (erro) return <PageError titulo="ASOs" mensagem={erro} />;
  if (carregando) return <Loading />;

  const nomePorId = (id: string): string =>
    colaboradores.find((colaborador) => colaborador.id === id)?.nome ?? 'Colaborador removido';

  const eventoDoAso = (asoId: string): EventoESocial | undefined =>
    eventos.find((evento) => evento.asoId === asoId);

  const visiveis = filtroColaborador
    ? asos.filter((aso) => aso.colaboradorId === filtroColaborador)
    : asos;

  const gerarEvento = async (asoId: string): Promise<void> => {
    setGerandoId(asoId);
    try {
      const evento = await eventoService.gerarDeAso(asoId);
      showToast(`Evento ${evento.tipoEvento.replace('_', '-')} gerado e validado contra o schema.`);
      await recarregar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível gerar o evento.', 'danger');
    } finally {
      setGerandoId(null);
    }
  };

  const remover = async (aso: Aso): Promise<void> => {
    const confirmado = await openConfirm({
      titulo: 'Remover ASO',
      mensagem: `Excluir o ASO de ${formatDate(aso.dataExame)} de ${nomePorId(aso.colaboradorId)}? O histórico médico é parte do prontuário ocupacional.`,
      confirmLabel: 'Excluir',
    });
    if (!confirmado) return;
    await asoService.remover(aso.id);
    showToast('ASO removido.');
    await recarregar();
  };

  return (
    <>
      <PageHeader
        titulo="ASOs"
        subtitulo="Atestados de Saúde Ocupacional e os eventos S-2220 correspondentes."
        acoes={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => abrirModalAso({ colaboradores, aoConcluir: recarregar })}
          >
            Registrar ASO
          </button>
        }
      />

      <div className="toolbar mb-3">
        <select
          className="form-select form-select-sm toolbar-search"
          aria-label="Filtrar por colaborador"
          value={filtroColaborador}
          onChange={(event) => setFiltroColaborador(event.target.value)}
        >
          <option value="">Todos os colaboradores</option>
          {colaboradores.map((colaborador) => (
            <option key={colaborador.id} value={colaborador.id}>
              {colaborador.nome}
            </option>
          ))}
        </select>
      </div>

      <CardTabela titulo="Atestados registrados">
        <Table
          colunas={['Colaborador', 'Tipo', 'Data do exame', 'Resultado', 'Médico', 'eSocial', '']}
          linhas={visiveis.map((aso) => (
            <tr key={aso.id}>
              <td>
                <Link className="fw-semibold" to={`/colaboradores/${aso.colaboradorId}`}>
                  {nomePorId(aso.colaboradorId)}
                </Link>
              </td>
              <td>{LABEL_TIPO_EXAME[aso.tipoExame]}</td>
              <td className="text-nowrap">{formatDate(aso.dataExame)}</td>
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
                  onGerar={(id) => void gerarEvento(id)}
                  gerando={gerandoId === aso.id}
                />
              </td>
              <td className="text-end text-nowrap">
                <button
                  type="button"
                  className="btn btn-sm btn-outline-secondary"
                  onClick={() => abrirModalAso({ colaboradores, aso, aoConcluir: recarregar })}
                >
                  Editar
                </button>
                {isAdmin() ? (
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger ms-2"
                    onClick={() => void remover(aso)}
                  >
                    Remover
                  </button>
                ) : null}
              </td>
            </tr>
          ))}
          vazio={
            asos.length === 0
              ? 'Nenhum ASO registrado até agora.'
              : 'Nenhum ASO para o colaborador selecionado.'
          }
        />
      </CardTabela>
    </>
  );
};
