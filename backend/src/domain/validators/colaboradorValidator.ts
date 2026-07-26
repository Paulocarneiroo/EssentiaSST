import { ValidationError } from '../errors/AppError.js';
import type { CreateColaboradorData, UpdateColaboradorData } from '../entities/Colaborador.js';
import { isCpfValido, somenteDigitos as onlyDigits } from './documentos.js';

const CPF_LENGTH = 11;

/** Comprimento e dígito verificador: um CPF inválido só seria rejeitado no eSocial. */
const assertCpf = (cpf: string): void => {
  if (cpf.length !== CPF_LENGTH) {
    throw new ValidationError('CPF deve conter exatamente 11 dígitos.');
  }
  if (!isCpfValido(cpf)) {
    throw new ValidationError('CPF inválido: o dígito verificador não confere.');
  }
};

const parseDate = (value: string, fieldName: string): Date => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw new ValidationError(`${fieldName} inválida. Use o formato ISO (YYYY-MM-DD).`);
  }
  return date;
};

export const normalizeCpf = (cpf: string): string => onlyDigits(cpf);

export const validateCreateColaborador = (data: CreateColaboradorData): CreateColaboradorData => {
  if (!data.empresaId?.trim()) {
    throw new ValidationError('empresaId é obrigatório.');
  }
  const cpf = normalizeCpf(data.cpf);
  assertCpf(cpf);
  if (!data.nome?.trim()) {
    throw new ValidationError('Nome é obrigatório.');
  }
  if (!data.cargo?.trim()) {
    throw new ValidationError('Cargo é obrigatório.');
  }

  parseDate(data.dataNascimento, 'dataNascimento');
  parseDate(data.dataAdmissao, 'dataAdmissao');
  if (data.dataDemissao) {
    parseDate(data.dataDemissao, 'dataDemissao');
  }

  return {
    ...data,
    empresaId: data.empresaId.trim(),
    cpf,
    nome: data.nome.trim(),
    cargo: data.cargo.trim(),
  };
};

export const validateUpdateColaborador = (data: UpdateColaboradorData): UpdateColaboradorData => {
  const result: UpdateColaboradorData = { ...data };

  if (data.empresaId !== undefined && !data.empresaId.trim()) {
    throw new ValidationError('empresaId não pode ser vazio.');
  }
  if (data.cpf !== undefined) {
    const cpf = normalizeCpf(data.cpf);
    assertCpf(cpf);
    result.cpf = cpf;
  }
  if (data.nome !== undefined && !data.nome.trim()) {
    throw new ValidationError('Nome não pode ser vazio.');
  }
  if (data.cargo !== undefined && !data.cargo.trim()) {
    throw new ValidationError('Cargo não pode ser vazio.');
  }
  if (data.dataNascimento !== undefined) {
    parseDate(data.dataNascimento, 'dataNascimento');
  }
  if (data.dataAdmissao !== undefined) {
    parseDate(data.dataAdmissao, 'dataAdmissao');
  }
  if (data.dataDemissao !== undefined && data.dataDemissao !== null) {
    parseDate(data.dataDemissao, 'dataDemissao');
  }
  if (data.nome !== undefined) {
    result.nome = data.nome.trim();
  }
  if (data.cargo !== undefined) {
    result.cargo = data.cargo.trim();
  }
  if (data.empresaId !== undefined) {
    result.empresaId = data.empresaId.trim();
  }

  return result;
};
