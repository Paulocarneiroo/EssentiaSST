import { ValidationError } from '../errors/AppError.js';
import type { CreateEmpresaData, UpdateEmpresaData } from '../entities/Empresa.js';

const CNPJ_LENGTH = 14;
const CNAE_MAX_LENGTH = 10;
const GRAU_RISCO_MIN = 1;
const GRAU_RISCO_MAX = 4;

const onlyDigits = (value: string): string => value.replace(/\D/g, '');

export const normalizeCnpj = (cnpj: string): string => onlyDigits(cnpj);

export const validateCreateEmpresa = (data: CreateEmpresaData): CreateEmpresaData => {
  const cnpj = normalizeCnpj(data.cnpj);
  if (cnpj.length !== CNPJ_LENGTH) {
    throw new ValidationError('CNPJ deve conter exatamente 14 dígitos.');
  }
  if (!data.razaoSocial?.trim()) {
    throw new ValidationError('Razão social é obrigatória.');
  }
  if (!data.nomeFantasia?.trim()) {
    throw new ValidationError('Nome fantasia é obrigatório.');
  }
  if (!data.cnae?.trim()) {
    throw new ValidationError('CNAE é obrigatório.');
  }
  if (data.cnae.trim().length > CNAE_MAX_LENGTH) {
    throw new ValidationError('CNAE deve ter no máximo 10 caracteres.');
  }
  if (!Number.isInteger(data.grauRisco) || data.grauRisco < GRAU_RISCO_MIN || data.grauRisco > GRAU_RISCO_MAX) {
    throw new ValidationError(`Grau de risco deve ser um inteiro entre ${GRAU_RISCO_MIN} e ${GRAU_RISCO_MAX}.`);
  }
  return {
    ...data,
    cnpj,
    razaoSocial: data.razaoSocial.trim(),
    nomeFantasia: data.nomeFantasia.trim(),
    cnae: data.cnae.trim(),
  };
};

export const validateUpdateEmpresa = (data: UpdateEmpresaData): UpdateEmpresaData => {
  const result: UpdateEmpresaData = { ...data };

  if (data.cnpj !== undefined) {
    const cnpj = normalizeCnpj(data.cnpj);
    if (cnpj.length !== CNPJ_LENGTH) {
      throw new ValidationError('CNPJ deve conter exatamente 14 dígitos.');
    }
    result.cnpj = cnpj;
  }
  if (data.razaoSocial !== undefined && !data.razaoSocial.trim()) {
    throw new ValidationError('Razão social não pode ser vazia.');
  }
  if (data.nomeFantasia !== undefined && !data.nomeFantasia.trim()) {
    throw new ValidationError('Nome fantasia não pode ser vazio.');
  }
  if (data.cnae !== undefined) {
    if (!data.cnae.trim()) {
      throw new ValidationError('CNAE não pode ser vazio.');
    }
    if (data.cnae.trim().length > CNAE_MAX_LENGTH) {
      throw new ValidationError('CNAE deve ter no máximo 10 caracteres.');
    }
    result.cnae = data.cnae.trim();
  }
  if (data.grauRisco !== undefined) {
    if (!Number.isInteger(data.grauRisco) || data.grauRisco < GRAU_RISCO_MIN || data.grauRisco > GRAU_RISCO_MAX) {
      throw new ValidationError(`Grau de risco deve ser um inteiro entre ${GRAU_RISCO_MIN} e ${GRAU_RISCO_MAX}.`);
    }
  }
  if (data.razaoSocial !== undefined) {
    result.razaoSocial = data.razaoSocial.trim();
  }
  if (data.nomeFantasia !== undefined) {
    result.nomeFantasia = data.nomeFantasia.trim();
  }

  return result;
};
