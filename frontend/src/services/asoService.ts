import { asoApi } from '../api/asoApi';
import type { Aso, CreateAsoData, ResultadoAso, TipoExame, UpdateAsoData } from '../types/aso';

export interface AsoFormData {
  colaboradorId: string;
  tipoExame: TipoExame;
  dataExame: string;
  resultado: ResultadoAso;
  medico: string;
  crm: string;
}

const paraPayload = (input: AsoFormData): CreateAsoData => ({
  colaboradorId: input.colaboradorId,
  tipoExame: input.tipoExame,
  dataExame: input.dataExame,
  resultado: input.resultado,
  medico: input.medico.trim(),
  crm: input.crm.trim(),
});

export const asoService = {
  /** Mais recentes primeiro — a ordem em que o ASO é consultado no dia a dia. */
  async listar(colaboradorId?: string): Promise<Aso[]> {
    const asos = await asoApi.list(colaboradorId);
    return [...asos].sort((a, b) => b.dataExame.localeCompare(a.dataExame));
  },

  async criar(input: AsoFormData): Promise<Aso> {
    return asoApi.create(paraPayload(input));
  },

  async atualizar(id: string, input: AsoFormData): Promise<Aso> {
    const { colaboradorId: _ignorado, ...resto } = paraPayload(input);
    return asoApi.update(id, resto as UpdateAsoData);
  },

  async remover(id: string): Promise<void> {
    return asoApi.remove(id);
  },
};
