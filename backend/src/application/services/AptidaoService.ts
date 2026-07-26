import type { Aso } from '../../domain/entities/Aso.js';
import type { Colaborador } from '../../domain/entities/Colaborador.js';
import type { Empresa } from '../../domain/entities/Empresa.js';
import type { IAsoRepository } from '../ports/IAsoRepository.js';

export type SituacaoAptidao =
  | 'APTO'
  | 'APTO_COM_RESTRICOES'
  | 'INAPTO'
  | 'VENCIDO'
  | 'SEM_ASO'
  | 'DESLIGADO';

export interface AvaliacaoAptidao {
  colaboradorId: string;
  situacao: SituacaoAptidao;
  /** Resposta objetiva: o trabalhador pode exercer a função hoje? */
  apto: boolean;
  motivo: string;
  /** ASO que sustenta a avaliação (o mais recente que atesta aptidão). */
  asoVigente: Aso | null;
  proximoVencimento: Date | null;
  /** Negativo quando já vencido. */
  diasParaVencimento: number | null;
  /** Intervalo aplicado ao exame periódico, em meses. */
  periodicidadeMeses: number | null;
}

const MS_POR_DIA = 86_400_000;

/** Exames que atestam aptidão para o trabalho — o demissional encerra o vínculo. */
const ATESTAM_APTIDAO = (aso: Aso): boolean => aso.tipoExame !== 'DEMISSIONAL';

/**
 * Soma meses preservando o fim de mês: 31/01 + 1 mês = 28/02, não 03/03.
 * Opera em UTC porque as datas vêm do banco como `date` em meia-noite UTC.
 */
const adicionarMeses = (data: Date, meses: number): Date => {
  const resultado = new Date(data.getTime());
  const dia = resultado.getUTCDate();
  resultado.setUTCMonth(resultado.getUTCMonth() + meses);
  if (resultado.getUTCDate() < dia) {
    resultado.setUTCDate(0);
  }
  return resultado;
};

const idadeEm = (nascimento: Date, referencia: Date): number => {
  let idade = referencia.getUTCFullYear() - nascimento.getUTCFullYear();
  const mes = referencia.getUTCMonth() - nascimento.getUTCMonth();
  if (mes < 0 || (mes === 0 && referencia.getUTCDate() < nascimento.getUTCDate())) {
    idade -= 1;
  }
  return idade;
};

/**
 * Intervalo do exame periódico, em meses (NR-07).
 *
 * Regra base: grau de risco 1 e 2 → 24 meses; 3 e 4 → 12 meses.
 * Reduções para 12 meses: menores de 18 anos, maiores de 45 anos e portadores
 * de restrição, que exigem monitoramento mais frequente.
 */
export const periodicidadeExame = (colaborador: Colaborador, empresa: Empresa, aso: Aso): number => {
  const idade = idadeEm(colaborador.dataNascimento, aso.dataExame);

  const anual =
    empresa.grauRisco >= 3 ||
    idade < 18 ||
    idade > 45 ||
    aso.resultado === 'APTO_COM_RESTRICOES';

  return anual ? 12 : 24;
};

/**
 * `AptidaoService` — decide se um colaborador está apto com base no histórico de ASOs.
 *
 * SRP: muda apenas quando mudam as regras de aptidão ocupacional.
 * DIP: depende de `IAsoRepository` (o `IRepositorioASO` do modelo), não do banco.
 * Colaborador e empresa chegam como dados já carregados e validados pelo chamador,
 * mantendo o serviço com uma única dependência de infraestrutura.
 */
export class AptidaoService {
  // Usa apenas a fatia necessária do repositório (ISP).
  constructor(private readonly repository: Pick<IAsoRepository, 'findByColaborador'>) {}

  async avaliarAptidao(
    colaborador: Colaborador,
    empresa: Empresa,
    agora = new Date(),
  ): Promise<AvaliacaoAptidao> {
    const historico = await this.repository.findByColaborador(colaborador.id);
    const vigente =
      [...historico]
        .filter(ATESTAM_APTIDAO)
        .sort((a, b) => b.dataExame.getTime() - a.dataExame.getTime())[0] ?? null;

    const base = {
      colaboradorId: colaborador.id,
      asoVigente: vigente,
      proximoVencimento: null,
      diasParaVencimento: null,
      periodicidadeMeses: null,
    };

    if (colaborador.dataDemissao) {
      return {
        ...base,
        situacao: 'DESLIGADO',
        apto: false,
        motivo: `Colaborador desligado em ${this.formatar(colaborador.dataDemissao)}.`,
      };
    }

    if (!vigente) {
      return {
        ...base,
        situacao: 'SEM_ASO',
        apto: false,
        motivo: 'Nenhum ASO registrado — exame admissional pendente.',
      };
    }

    if (vigente.resultado === 'INAPTO') {
      return {
        ...base,
        situacao: 'INAPTO',
        apto: false,
        motivo: `ASO de ${this.formatar(vigente.dataExame)} concluiu pela inaptidão para a função.`,
      };
    }

    const periodicidadeMeses = periodicidadeExame(colaborador, empresa, vigente);
    const proximoVencimento = adicionarMeses(vigente.dataExame, periodicidadeMeses);
    const diasParaVencimento = Math.ceil(
      (proximoVencimento.getTime() - agora.getTime()) / MS_POR_DIA,
    );

    const detalhes = { ...base, proximoVencimento, diasParaVencimento, periodicidadeMeses };

    if (diasParaVencimento < 0) {
      return {
        ...detalhes,
        situacao: 'VENCIDO',
        apto: false,
        motivo: `ASO vencido em ${this.formatar(proximoVencimento)}; exame periódico em atraso.`,
      };
    }

    return {
      ...detalhes,
      situacao: vigente.resultado,
      apto: true,
      motivo:
        vigente.resultado === 'APTO_COM_RESTRICOES'
          ? `Apto com restrições conforme ASO de ${this.formatar(vigente.dataExame)}.`
          : `Apto conforme ASO de ${this.formatar(vigente.dataExame)}.`,
    };
  }

  /** Data em que o exame periódico vigente vence. `null` quando não há ASO válido. */
  async proximoVencimento(
    colaborador: Colaborador,
    empresa: Empresa,
    agora = new Date(),
  ): Promise<Date | null> {
    const { proximoVencimento } = await this.avaliarAptidao(colaborador, empresa, agora);
    return proximoVencimento;
  }

  private formatar(data: Date): string {
    return data.toISOString().slice(0, 10);
  }
}
