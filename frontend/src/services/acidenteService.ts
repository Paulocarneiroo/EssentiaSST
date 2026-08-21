import { acidenteApi } from '../api/acidenteApi';
import type {
  Acidente,
  AgenteCausador,
  CreateAcidenteData,
  ParteAtingida,
  TipoAcidente,
  TipoCat,
  TipoLesao,
  UpdateAcidenteData,
} from '../types/acidente';
import { toHoraLeiaute } from './format';

export interface AcidenteFormData {
  colaboradorId: string;
  dataAcidente: string;
  horaAcidente: string;
  horasTrabalhadasAntes: string;
  tipoAcidente: TipoAcidente;
  tipoCat: TipoCat;
  obito: boolean;
  dataObito: string | null;
  comunicadoPolicia: boolean;
  localAcidente: string;
  parteAtingida: ParteAtingida;
  agenteCausador: AgenteCausador;
  tipoLesao: TipoLesao;
  descricao: string;
  cid: string | null;
  dataAtendimento: string;
  horaAtendimento: string;
  houveInternacao: boolean;
  houveAfastamento: boolean;
  duracaoTratamentoDias: number;
  medico: string;
  crm: string;
  ufCrm: string;
}

const paraPayload = (input: AcidenteFormData): CreateAcidenteData => ({
  colaboradorId: input.colaboradorId,
  dataAcidente: input.dataAcidente,
  // O leiaute exige HHMM; o formulário usa <input type="time">.
  horaAcidente: toHoraLeiaute(input.horaAcidente),
  horasTrabalhadasAntes: toHoraLeiaute(input.horasTrabalhadasAntes),
  tipoAcidente: input.tipoAcidente,
  tipoCat: input.tipoCat,
  obito: input.obito,
  dataObito: input.obito ? input.dataObito || null : null,
  comunicadoPolicia: input.comunicadoPolicia,
  localAcidente: input.localAcidente.trim(),
  parteAtingida: input.parteAtingida,
  agenteCausador: input.agenteCausador,
  tipoLesao: input.tipoLesao,
  descricao: input.descricao.trim(),
  cid: input.cid?.trim() ? input.cid.trim().toUpperCase() : null,
  dataAtendimento: input.dataAtendimento,
  horaAtendimento: toHoraLeiaute(input.horaAtendimento),
  houveInternacao: input.houveInternacao,
  houveAfastamento: input.houveAfastamento,
  duracaoTratamentoDias: Number(input.duracaoTratamentoDias) || 0,
  medico: input.medico.trim(),
  crm: input.crm.trim(),
  ufCrm: input.ufCrm.trim().toUpperCase(),
});

const MS_POR_DIA = 86_400_000;

export const acidenteService = {
  async listar(colaboradorId?: string): Promise<Acidente[]> {
    const acidentes = await acidenteApi.list(colaboradorId);
    return [...acidentes].sort((a, b) => b.dataAcidente.localeCompare(a.dataAcidente));
  },

  async criar(input: AcidenteFormData): Promise<Acidente> {
    return acidenteApi.create(paraPayload(input));
  },

  async atualizar(id: string, input: AcidenteFormData): Promise<Acidente> {
    const { colaboradorId: _ignorado, ...resto } = paraPayload(input);
    return acidenteApi.update(id, resto as UpdateAcidenteData);
  },

  async remover(id: string): Promise<void> {
    return acidenteApi.remove(id);
  },

  /**
   * Espelha `prazoComunicacaoExpirado` do domínio: a CAT é devida até o primeiro
   * dia útil seguinte ao acidente, e de imediato em caso de óbito (Lei 8.213/91, art. 22).
   */
  prazoExpirado(acidente: Acidente, agora = new Date()): boolean {
    const dataAcidente = new Date(acidente.dataAcidente);
    if (acidente.obito) {
      return agora.getTime() > dataAcidente.getTime();
    }
    const limite = new Date(dataAcidente.getTime() + MS_POR_DIA);
    limite.setUTCHours(23, 59, 59, 999);
    return agora.getTime() > limite.getTime();
  },
};
