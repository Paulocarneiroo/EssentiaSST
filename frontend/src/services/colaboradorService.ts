import { colaboradorApi } from '../api/colaboradorApi.js';
import { getEmpresaId } from '../state/session.js';
import type { AvaliacaoAptidao } from '../types/aptidao.js';
import type { Colaborador, CreateColaboradorData } from '../types/colaborador.js';
import { onlyDigits } from './format.js';

/** Dados do formulário, antes de receber o tenant e a normalização. */
export interface ColaboradorFormData {
  cpf: string;
  nome: string;
  dataNascimento: string;
  cargo: string;
  dataAdmissao: string;
  dataDemissao?: string | null;
}

const paraPayload = (input: ColaboradorFormData): CreateColaboradorData => ({
  // H1.3: a empresa é sempre a do usuário autenticado, nunca escolhida na tela.
  empresaId: getEmpresaId() ?? '',
  cpf: onlyDigits(input.cpf),
  nome: input.nome.trim(),
  dataNascimento: input.dataNascimento,
  cargo: input.cargo.trim(),
  dataAdmissao: input.dataAdmissao,
  dataDemissao: input.dataDemissao || null,
});

export const colaboradorService = {
  async listar(): Promise<Colaborador[]> {
    const colaboradores = await colaboradorApi.list();
    return [...colaboradores].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));
  },

  async buscar(id: string): Promise<Colaborador> {
    return colaboradorApi.getById(id);
  },

  async criar(input: ColaboradorFormData): Promise<Colaborador> {
    return colaboradorApi.create(paraPayload(input));
  },

  async atualizar(id: string, input: ColaboradorFormData): Promise<Colaborador> {
    return colaboradorApi.update(id, paraPayload(input));
  },

  /** H1.2 — o desligamento registra a data de demissão e preserva o histórico. */
  async desligar(id: string, dataDemissao: string): Promise<Colaborador> {
    return colaboradorApi.update(id, { dataDemissao });
  },

  async reativar(id: string): Promise<Colaborador> {
    return colaboradorApi.update(id, { dataDemissao: null });
  },

  async remover(id: string): Promise<void> {
    return colaboradorApi.remove(id);
  },

  async aptidao(id: string): Promise<AvaliacaoAptidao> {
    return colaboradorApi.aptidao(id);
  },

  /** Aptidão de vários colaboradores; falhas isoladas não derrubam a listagem. */
  async aptidoes(ids: string[]): Promise<Map<string, AvaliacaoAptidao>> {
    const resultados = await Promise.allSettled(ids.map((id) => colaboradorApi.aptidao(id)));
    const mapa = new Map<string, AvaliacaoAptidao>();
    resultados.forEach((resultado, indice) => {
      if (resultado.status === 'fulfilled') {
        mapa.set(ids[indice], resultado.value);
      }
    });
    return mapa;
  },

  ativo(colaborador: Colaborador): boolean {
    return !colaborador.dataDemissao;
  },
};
