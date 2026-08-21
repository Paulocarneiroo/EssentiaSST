import { Link } from 'react-router-dom';
import { acidenteService, type AcidenteFormData } from '../../services/acidenteService';
import { colaboradorService } from '../../services/colaboradorService';
import { eventoService } from '../../services/eventoService';
import { formatDate, formatHora, hojeInput, toDateInput, toHoraInput } from '../../services/format';
import {
  LABEL_AGENTE_CAUSADOR,
  LABEL_PARTE_ATINGIDA,
  LABEL_STATUS_EVENTO,
  LABEL_TIPO_ACIDENTE,
  LABEL_TIPO_CAT,
  LABEL_TIPO_LESAO,
  VARIANT_STATUS_EVENTO,
  opcoesDe,
} from '../../services/labels';
import { isAdmin } from '../../state/session';
import {
  AGENTES_CAUSADORES,
  PARTES_ATINGIDAS,
  TIPOS_ACIDENTE,
  TIPOS_CAT,
  TIPOS_LESAO,
  type Acidente,
} from '../../types/acidente';
import type { Colaborador } from '../../types/colaborador';
import type { EventoESocial } from '../../types/evento';
import { Badge, CardTabela, Loading, PageError, PageHeader, Table, useDocumentTitle } from '../components';
import {
  CheckField,
  FieldsetTitle,
  readBoolean,
  readNumber,
  readString,
  SelectField,
  TextareaField,
  TextField,
} from '../formFields';
import { openConfirm, openFormModal } from '../modal';
import { showToast } from '../toast';
import { useCallback, useEffect, useState } from 'react';

const CamposAcidente = ({
  colaboradores,
  acidente,
  colaboradorFixo,
}: {
  colaboradores: Colaborador[];
  acidente?: Acidente;
  colaboradorFixo?: string;
}) => (
  <>
    {colaboradorFixo ? (
      <input type="hidden" name="colaboradorId" value={colaboradorFixo} />
    ) : (
      <SelectField
        name="colaboradorId"
        label="Trabalhador acidentado"
        col={12}
        required
        options={colaboradores.map((colaborador) => ({
          value: colaborador.id,
          label: colaborador.nome,
        }))}
        value={acidente?.colaboradorId}
        disabled={Boolean(acidente)}
        help={acidente ? 'O trabalhador da CAT não pode ser alterado.' : undefined}
      />
    )}

    <FieldsetTitle titulo="Ocorrência" />
    <TextField
      name="dataAcidente"
      label="Data do acidente"
      type="date"
      col={4}
      required
      value={acidente ? toDateInput(acidente.dataAcidente) : hojeInput()}
    />
    <TextField
      name="horaAcidente"
      label="Hora do acidente"
      type="time"
      col={4}
      required
      value={toHoraInput(acidente?.horaAcidente)}
    />
    <TextField
      name="horasTrabalhadasAntes"
      label="Horas trabalhadas antes"
      type="time"
      col={4}
      required
      value={toHoraInput(acidente?.horasTrabalhadasAntes ?? '0000')}
      help="Tempo decorrido da jornada até o acidente."
    />
    <SelectField
      name="tipoAcidente"
      label="Natureza"
      col={6}
      required
      options={opcoesDe(TIPOS_ACIDENTE, LABEL_TIPO_ACIDENTE)}
      value={acidente?.tipoAcidente}
    />
    <SelectField
      name="tipoCat"
      label="Tipo de CAT"
      col={6}
      required
      options={opcoesDe(TIPOS_CAT, LABEL_TIPO_CAT)}
      value={acidente?.tipoCat ?? 'INICIAL'}
    />
    <TextField
      name="localAcidente"
      label="Local do acidente"
      col={12}
      required
      maxlength={255}
      value={acidente?.localAcidente}
    />
    <CheckField
      name="comunicadoPolicia"
      label="Comunicado à autoridade policial"
      col={4}
      checked={acidente?.comunicadoPolicia}
    />
    <CheckField name="obito" label="Houve óbito" col={4} checked={acidente?.obito} />
    <TextField
      name="dataObito"
      label="Data do óbito"
      type="date"
      col={4}
      value={toDateInput(acidente?.dataObito)}
      help="Obrigatória quando houve óbito."
    />

    <FieldsetTitle titulo="Lesão" />
    <SelectField
      name="parteAtingida"
      label="Parte atingida"
      col={4}
      required
      options={opcoesDe(PARTES_ATINGIDAS, LABEL_PARTE_ATINGIDA)}
      value={acidente?.parteAtingida}
    />
    <SelectField
      name="agenteCausador"
      label="Agente causador"
      col={4}
      required
      options={opcoesDe(AGENTES_CAUSADORES, LABEL_AGENTE_CAUSADOR)}
      value={acidente?.agenteCausador}
    />
    <SelectField
      name="tipoLesao"
      label="Natureza da lesão"
      col={4}
      required
      options={opcoesDe(TIPOS_LESAO, LABEL_TIPO_LESAO)}
      value={acidente?.tipoLesao}
    />
    <TextareaField
      name="descricao"
      label="Descrição do acidente"
      col={12}
      required
      rows={3}
      maxlength={999}
      value={acidente?.descricao}
    />

    <FieldsetTitle titulo="Atendimento médico" />
    <TextField
      name="dataAtendimento"
      label="Data do atendimento"
      type="date"
      col={4}
      required
      value={acidente ? toDateInput(acidente.dataAtendimento) : hojeInput()}
    />
    <TextField
      name="horaAtendimento"
      label="Hora do atendimento"
      type="time"
      col={4}
      required
      value={toHoraInput(acidente?.horaAtendimento)}
    />
    <TextField name="cid" label="CID-10" col={4} maxlength={6} placeholder="S61.0" value={acidente?.cid} />
    <TextField name="medico" label="Médico" col={5} required value={acidente?.medico} />
    <TextField name="crm" label="CRM" col={4} required maxlength={20} value={acidente?.crm} />
    <TextField
      name="ufCrm"
      label="UF do CRM"
      col={3}
      required
      maxlength={2}
      placeholder="PE"
      value={acidente?.ufCrm}
    />
    <TextField
      name="duracaoTratamentoDias"
      label="Dias de tratamento"
      type="number"
      col={4}
      min={0}
      value={acidente?.duracaoTratamentoDias ?? 0}
    />
    <CheckField name="houveInternacao" label="Houve internação" col={4} checked={acidente?.houveInternacao} />
    <CheckField name="houveAfastamento" label="Houve afastamento" col={4} checked={acidente?.houveAfastamento} />
  </>
);

const lerAcidenteForm = (form: HTMLFormElement, colaboradorId?: string): AcidenteFormData => ({
  colaboradorId: colaboradorId ?? readString(form, 'colaboradorId'),
  dataAcidente: readString(form, 'dataAcidente'),
  horaAcidente: readString(form, 'horaAcidente'),
  horasTrabalhadasAntes: readString(form, 'horasTrabalhadasAntes'),
  tipoAcidente: readString(form, 'tipoAcidente') as AcidenteFormData['tipoAcidente'],
  tipoCat: readString(form, 'tipoCat') as AcidenteFormData['tipoCat'],
  obito: readBoolean(form, 'obito'),
  dataObito: readString(form, 'dataObito') || null,
  comunicadoPolicia: readBoolean(form, 'comunicadoPolicia'),
  localAcidente: readString(form, 'localAcidente'),
  parteAtingida: readString(form, 'parteAtingida') as AcidenteFormData['parteAtingida'],
  agenteCausador: readString(form, 'agenteCausador') as AcidenteFormData['agenteCausador'],
  tipoLesao: readString(form, 'tipoLesao') as AcidenteFormData['tipoLesao'],
  descricao: readString(form, 'descricao'),
  cid: readString(form, 'cid') || null,
  dataAtendimento: readString(form, 'dataAtendimento'),
  horaAtendimento: readString(form, 'horaAtendimento'),
  houveInternacao: readBoolean(form, 'houveInternacao'),
  houveAfastamento: readBoolean(form, 'houveAfastamento'),
  duracaoTratamentoDias: readNumber(form, 'duracaoTratamentoDias'),
  medico: readString(form, 'medico'),
  crm: readString(form, 'crm'),
  ufCrm: readString(form, 'ufCrm'),
});

export interface ModalAcidenteOptions {
  colaboradores: Colaborador[];
  acidente?: Acidente;
  colaboradorId?: string;
  aoConcluir: () => Promise<void> | void;
}

export const abrirModalAcidente = ({
  colaboradores,
  acidente,
  colaboradorId,
  aoConcluir,
}: ModalAcidenteOptions): void => {
  openFormModal({
    titulo: acidente ? 'Editar acidente' : 'Registrar acidente de trabalho',
    tamanho: 'xl',
    campos: (
      <CamposAcidente
        colaboradores={colaboradores}
        acidente={acidente}
        colaboradorFixo={acidente ? undefined : colaboradorId}
      />
    ),
    confirmLabel: acidente ? 'Salvar alterações' : 'Registrar acidente',
    onConfirm: async (form) => {
      const dados = lerAcidenteForm(form, acidente?.colaboradorId ?? colaboradorId);
      if (acidente) {
        await acidenteService.atualizar(acidente.id, dados);
        showToast('Acidente atualizado.');
      } else {
        await acidenteService.criar(dados);
        showToast('Acidente registrado. Gere a CAT (S-2210) para comunicar ao eSocial.');
      }
      await aoConcluir();
    },
  });
};

export const CelulaCatDoAcidente = ({
  acidente,
  evento,
  onGerar,
  gerando,
}: {
  acidente: Acidente;
  evento?: EventoESocial;
  onGerar: (id: string) => void;
  gerando: boolean;
}) => {
  if (evento) {
    return (
      <Link to="/esocial" className="text-decoration-none">
        <Badge
          label={`S-2210 ${LABEL_STATUS_EVENTO[evento.status]}`}
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
      onClick={() => onGerar(acidente.id)}
    >
      Gerar CAT (S-2210)
    </button>
  );
};

export const AcidentePage = () => {
  useDocumentTitle('Acidentes');
  const [acidentes, setAcidentes] = useState<Acidente[]>([]);
  const [colaboradores, setColaboradores] = useState<Colaborador[]>([]);
  const [eventos, setEventos] = useState<EventoESocial[]>([]);
  const [gerandoId, setGerandoId] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  const recarregar = useCallback(async (): Promise<void> => {
    const [listaAcidentes, listaColaboradores, listaEventos] = await Promise.all([
      acidenteService.listar(),
      colaboradorService.listar(),
      eventoService.listar(),
    ]);
    setAcidentes(listaAcidentes);
    setColaboradores(listaColaboradores);
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

  if (erro) return <PageError titulo="Acidentes" mensagem={erro} />;
  if (carregando) return <Loading />;

  const nomePorId = (id: string): string =>
    colaboradores.find((colaborador) => colaborador.id === id)?.nome ?? 'Colaborador removido';

  const eventoDoAcidente = (acidenteId: string): EventoESocial | undefined =>
    eventos.find((evento) => evento.acidenteId === acidenteId);

  const gerarCat = async (acidenteId: string): Promise<void> => {
    setGerandoId(acidenteId);
    try {
      await eventoService.gerarDeAcidente(acidenteId);
      showToast('CAT (S-2210) gerada e validada contra o schema.');
      await recarregar();
    } catch (error) {
      showToast(error instanceof Error ? error.message : 'Não foi possível gerar a CAT.', 'danger');
    } finally {
      setGerandoId(null);
    }
  };

  const remover = async (acidente: Acidente): Promise<void> => {
    const confirmado = await openConfirm({
      titulo: 'Remover acidente',
      mensagem: `Excluir o acidente de ${formatDate(acidente.dataAcidente)} de ${nomePorId(acidente.colaboradorId)}? O registro é a base legal da CAT.`,
      confirmLabel: 'Excluir',
    });
    if (!confirmado) return;
    await acidenteService.remover(acidente.id);
    showToast('Acidente removido.');
    await recarregar();
  };

  return (
    <>
      <PageHeader
        titulo="Acidentes de trabalho"
        subtitulo="A CAT é devida até o primeiro dia útil seguinte ao acidente — e de imediato em caso de óbito (Lei 8.213/91, art. 22)."
        acoes={
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => abrirModalAcidente({ colaboradores, aoConcluir: recarregar })}
          >
            Registrar acidente
          </button>
        }
      />

      <CardTabela titulo="Ocorrências registradas">
        <Table
          colunas={['Ocorrência', 'Trabalhador', 'Natureza', 'Lesão', 'Comunicação', 'eSocial', '']}
          linhas={acidentes.map((acidente) => {
            const expirado = acidenteService.prazoExpirado(acidente);
            return (
              <tr key={acidente.id}>
                <td>
                  <span className="fw-semibold">{formatDate(acidente.dataAcidente)}</span>
                  <div className="text-muted small">
                    {formatHora(acidente.horaAcidente)} · {acidente.localAcidente}
                  </div>
                </td>
                <td>
                  <Link to={`/colaboradores/${acidente.colaboradorId}`}>
                    {nomePorId(acidente.colaboradorId)}
                  </Link>
                </td>
                <td>
                  {LABEL_TIPO_ACIDENTE[acidente.tipoAcidente]}
                  <div className="text-muted small">{LABEL_TIPO_CAT[acidente.tipoCat]}</div>
                </td>
                <td>
                  {LABEL_TIPO_LESAO[acidente.tipoLesao]}
                  <div className="text-muted small">{LABEL_PARTE_ATINGIDA[acidente.parteAtingida]}</div>
                </td>
                <td>
                  {acidente.obito ? <Badge label="Óbito" variant="dark" /> : null}{' '}
                  <Badge label={expirado ? 'Prazo expirado' : 'No prazo'} variant={expirado ? 'danger' : 'success'} />
                </td>
                <td>
                  <CelulaCatDoAcidente
                    acidente={acidente}
                    evento={eventoDoAcidente(acidente.id)}
                    onGerar={(id) => void gerarCat(id)}
                    gerando={gerandoId === acidente.id}
                  />
                </td>
                <td className="text-end text-nowrap">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => abrirModalAcidente({ colaboradores, acidente, aoConcluir: recarregar })}
                  >
                    Editar
                  </button>
                  {isAdmin() ? (
                    <button
                      type="button"
                      className="btn btn-sm btn-outline-danger ms-2"
                      onClick={() => void remover(acidente)}
                    >
                      Remover
                    </button>
                  ) : null}
                </td>
              </tr>
            );
          })}
          vazio="Nenhum acidente registrado."
        />
      </CardTabela>
    </>
  );
};
