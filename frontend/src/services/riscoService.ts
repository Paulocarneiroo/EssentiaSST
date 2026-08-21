import { riscoApi } from '../api/riscoApi';
import { getEmpresaId } from '../state/session';
import {
  calcularNivelRisco,
  type CreateRiscoData,
  type Risco,
  type TipoRisco,
  type UpdateRiscoData,
} from '../types/risco';

export interface RiscoFormData {
  descricao: string;
  tipo: TipoRisco;
  severidade: number;
  probabilidade: number;
}

const paraPayload = (input: RiscoFormData): CreateRiscoData => ({
  empresaId: getEmpresaId() ?? '',
  descricao: input.descricao.trim(),
  tipo: input.tipo,
  severidade: Number(input.severidade),
  probabilidade: Number(input.probabilidade),
});

export const riscoService = {
  /** Inventário do PGR ordenado do maior nível para o menor, como manda a NR-01. */
  async listar(): Promise<Risco[]> {
    const riscos = await riscoApi.list();
    return [...riscos].sort((a, b) => calcularNivelRisco(b) - calcularNivelRisco(a));
  },

  async criar(input: RiscoFormData): Promise<Risco> {
    return riscoApi.create(paraPayload(input));
  },

  async atualizar(id: string, input: RiscoFormData): Promise<Risco> {
    const { empresaId: _ignorado, ...resto } = paraPayload(input);
    return riscoApi.update(id, resto as UpdateRiscoData);
  },

  async remover(id: string): Promise<void> {
    return riscoApi.remove(id);
  },
};
