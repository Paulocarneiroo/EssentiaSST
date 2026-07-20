import { ValidationError } from '../errors/AppError.js';
import { TIPOS_RISCO, type CreateRiscoData, type TipoRisco, type UpdateRiscoData } from '../entities/Risco.js';

const DESCRICAO_MAX_LENGTH = 500;
const ESCALA_MIN = 1;
const ESCALA_MAX = 5;

const assertTipo = (value: unknown): void => {
  if (!TIPOS_RISCO.includes(value as TipoRisco)) {
    throw new ValidationError(`Tipo de risco inválido. Use um de: ${TIPOS_RISCO.join(', ')}.`);
  }
};

const assertEscala = (value: unknown, fieldName: string): void => {
  if (!Number.isInteger(value) || (value as number) < ESCALA_MIN || (value as number) > ESCALA_MAX) {
    throw new ValidationError(
      `${fieldName} deve ser um inteiro entre ${ESCALA_MIN} e ${ESCALA_MAX}.`,
    );
  }
};

const assertDescricao = (descricao: string): void => {
  if (!descricao.trim()) {
    throw new ValidationError('Descrição é obrigatória.');
  }
  if (descricao.trim().length > DESCRICAO_MAX_LENGTH) {
    throw new ValidationError('Descrição deve ter no máximo 500 caracteres.');
  }
};

export const validateCreateRisco = (data: CreateRiscoData): CreateRiscoData => {
  if (!data.empresaId?.trim()) {
    throw new ValidationError('empresaId é obrigatório.');
  }
  assertDescricao(data.descricao ?? '');
  assertTipo(data.tipo);
  assertEscala(data.severidade, 'Severidade');
  assertEscala(data.probabilidade, 'Probabilidade');

  return {
    ...data,
    empresaId: data.empresaId.trim(),
    descricao: data.descricao.trim(),
  };
};

export const validateUpdateRisco = (data: UpdateRiscoData): UpdateRiscoData => {
  const result: UpdateRiscoData = { ...data };

  if (data.descricao !== undefined) {
    assertDescricao(data.descricao);
    result.descricao = data.descricao.trim();
  }
  if (data.tipo !== undefined) {
    assertTipo(data.tipo);
  }
  if (data.severidade !== undefined) {
    assertEscala(data.severidade, 'Severidade');
  }
  if (data.probabilidade !== undefined) {
    assertEscala(data.probabilidade, 'Probabilidade');
  }

  return result;
};
