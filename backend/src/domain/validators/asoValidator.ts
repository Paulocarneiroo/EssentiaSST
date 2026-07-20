import { ValidationError } from '../errors/AppError.js';
import {
  RESULTADOS_ASO,
  TIPOS_EXAME,
  type CreateAsoData,
  type UpdateAsoData,
} from '../entities/Aso.js';

const CRM_MAX_LENGTH = 20;

const parseDate = (value: string, fieldName: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} inválida. Use o formato ISO (YYYY-MM-DD).`);
  }
  return date;
};

const assertTipoExame = (value: unknown): void => {
  if (!TIPOS_EXAME.includes(value as CreateAsoData['tipoExame'])) {
    throw new ValidationError(`Tipo de exame inválido. Use um de: ${TIPOS_EXAME.join(', ')}.`);
  }
};

const assertResultado = (value: unknown): void => {
  if (!RESULTADOS_ASO.includes(value as CreateAsoData['resultado'])) {
    throw new ValidationError(`Resultado inválido. Use um de: ${RESULTADOS_ASO.join(', ')}.`);
  }
};

const assertCrm = (crm: string): void => {
  if (!crm.trim()) {
    throw new ValidationError('CRM é obrigatório.');
  }
  if (crm.trim().length > CRM_MAX_LENGTH) {
    throw new ValidationError('CRM deve ter no máximo 20 caracteres.');
  }
};

export const validateCreateAso = (data: CreateAsoData): CreateAsoData => {
  if (!data.colaboradorId?.trim()) {
    throw new ValidationError('colaboradorId é obrigatório.');
  }
  assertTipoExame(data.tipoExame);
  assertResultado(data.resultado);

  const dataExame = parseDate(data.dataExame, 'dataExame');
  if (dataExame.getTime() > Date.now()) {
    throw new ValidationError('dataExame não pode estar no futuro.');
  }

  if (!data.medico?.trim()) {
    throw new ValidationError('Nome do médico é obrigatório.');
  }
  assertCrm(data.crm ?? '');

  return {
    ...data,
    colaboradorId: data.colaboradorId.trim(),
    medico: data.medico.trim(),
    crm: data.crm.trim(),
  };
};

export const validateUpdateAso = (data: UpdateAsoData): UpdateAsoData => {
  const result: UpdateAsoData = { ...data };

  if (data.tipoExame !== undefined) {
    assertTipoExame(data.tipoExame);
  }
  if (data.resultado !== undefined) {
    assertResultado(data.resultado);
  }
  if (data.dataExame !== undefined) {
    const dataExame = parseDate(data.dataExame, 'dataExame');
    if (dataExame.getTime() > Date.now()) {
      throw new ValidationError('dataExame não pode estar no futuro.');
    }
  }
  if (data.medico !== undefined) {
    if (!data.medico.trim()) {
      throw new ValidationError('Nome do médico não pode ser vazio.');
    }
    result.medico = data.medico.trim();
  }
  if (data.crm !== undefined) {
    assertCrm(data.crm);
    result.crm = data.crm.trim();
  }

  return result;
};
