import {
  AGENTES_CAUSADORES,
  PARTES_ATINGIDAS,
  TIPOS_ACIDENTE,
  TIPOS_CAT,
  TIPOS_LESAO,
  type CreateAcidenteData,
  type UpdateAcidenteData,
} from '../entities/Acidente.js';
import { ValidationError } from '../errors/AppError.js';

/** Hora no formato HHMM exigido pelo leiaute (`hrAcid`, `hrsTrabAntesAcid`). */
const HORA = /^([01]\d|2[0-3])[0-5]\d$/;
const UF = /^[A-Z]{2}$/;
/** CID-10: letra + 2 dígitos, com subcategoria opcional (ex.: S61.0). */
const CID = /^[A-Z]\d{2}(\.\d)?$/;

const parseDate = (value: string, campo: string): Date => {
  const data = new Date(value);
  if (Number.isNaN(data.getTime())) {
    throw new ValidationError(`${campo} inválida. Use o formato ISO (YYYY-MM-DD).`);
  }
  return data;
};

const assertHora = (value: string, campo: string): void => {
  if (!HORA.test(value)) {
    throw new ValidationError(`${campo} deve estar no formato HHMM (ex.: 1430).`);
  }
};

const assertEmUm = <T extends string>(valor: T, permitidos: readonly T[], campo: string): void => {
  if (!permitidos.includes(valor)) {
    throw new ValidationError(`${campo} inválido. Use um de: ${permitidos.join(', ')}.`);
  }
};

const assertTexto = (valor: string | undefined, campo: string, max: number): string => {
  const texto = valor?.trim();
  if (!texto) {
    throw new ValidationError(`${campo} é obrigatório.`);
  }
  if (texto.length > max) {
    throw new ValidationError(`${campo} deve ter no máximo ${max} caracteres.`);
  }
  return texto;
};

const assertCid = (cid: string | null | undefined): string | null => {
  if (cid === undefined || cid === null || cid.trim() === '') {
    return null;
  }
  const normalizado = cid.trim().toUpperCase();
  if (!CID.test(normalizado)) {
    throw new ValidationError('CID inválido. Use o formato CID-10 (ex.: S61.0).');
  }
  return normalizado;
};

/** Óbito exige a data; sem óbito, a data não pode estar preenchida. */
const assertObito = (obito: boolean, dataObito: string | null | undefined): string | null => {
  if (obito) {
    if (!dataObito) {
      throw new ValidationError('Acidente com óbito exige a data do óbito.');
    }
    parseDate(dataObito, 'dataObito');
    return dataObito;
  }
  if (dataObito) {
    throw new ValidationError('dataObito só pode ser informada quando obito = true.');
  }
  return null;
};

export const validateCreateAcidente = (data: CreateAcidenteData): CreateAcidenteData => {
  if (!data.colaboradorId?.trim()) {
    throw new ValidationError('colaboradorId é obrigatório.');
  }

  const dataAcidente = parseDate(data.dataAcidente, 'dataAcidente');
  const dataAtendimento = parseDate(data.dataAtendimento, 'dataAtendimento');
  if (dataAtendimento < dataAcidente) {
    throw new ValidationError('O atendimento não pode ser anterior ao acidente.');
  }

  assertHora(data.horaAcidente, 'horaAcidente');
  assertHora(data.horasTrabalhadasAntes, 'horasTrabalhadasAntes');
  assertHora(data.horaAtendimento, 'horaAtendimento');

  assertEmUm(data.tipoAcidente, TIPOS_ACIDENTE, 'tipoAcidente');
  assertEmUm(data.parteAtingida, PARTES_ATINGIDAS, 'parteAtingida');
  assertEmUm(data.agenteCausador, AGENTES_CAUSADORES, 'agenteCausador');
  assertEmUm(data.tipoLesao, TIPOS_LESAO, 'tipoLesao');
  if (data.tipoCat !== undefined) {
    assertEmUm(data.tipoCat, TIPOS_CAT, 'tipoCat');
  }

  const obito = data.obito ?? false;
  const duracao = data.duracaoTratamentoDias ?? 0;
  if (!Number.isInteger(duracao) || duracao < 0) {
    throw new ValidationError('duracaoTratamentoDias deve ser um inteiro não negativo.');
  }

  const ufCrm = (data.ufCrm ?? '').trim().toUpperCase();
  if (!UF.test(ufCrm)) {
    throw new ValidationError('ufCrm deve ser a sigla de duas letras do estado (ex.: PE).');
  }

  return {
    ...data,
    colaboradorId: data.colaboradorId.trim(),
    localAcidente: assertTexto(data.localAcidente, 'localAcidente', 255),
    descricao: assertTexto(data.descricao, 'descricao', 999),
    medico: assertTexto(data.medico, 'medico', 255),
    crm: assertTexto(data.crm, 'crm', 20),
    ufCrm,
    cid: assertCid(data.cid),
    obito,
    dataObito: assertObito(obito, data.dataObito),
    // Óbito comunicado como tal, salvo indicação explícita de reabertura.
    tipoCat: data.tipoCat ?? (obito ? 'COMUNICACAO_OBITO' : 'INICIAL'),
    comunicadoPolicia: data.comunicadoPolicia ?? false,
    houveInternacao: data.houveInternacao ?? false,
    houveAfastamento: data.houveAfastamento ?? false,
    duracaoTratamentoDias: duracao,
  };
};

export const validateUpdateAcidente = (data: UpdateAcidenteData): UpdateAcidenteData => {
  const result: UpdateAcidenteData = { ...data };

  if (data.dataAcidente !== undefined) {
    parseDate(data.dataAcidente, 'dataAcidente');
  }
  if (data.dataAtendimento !== undefined) {
    parseDate(data.dataAtendimento, 'dataAtendimento');
  }
  if (data.horaAcidente !== undefined) {
    assertHora(data.horaAcidente, 'horaAcidente');
  }
  if (data.horasTrabalhadasAntes !== undefined) {
    assertHora(data.horasTrabalhadasAntes, 'horasTrabalhadasAntes');
  }
  if (data.horaAtendimento !== undefined) {
    assertHora(data.horaAtendimento, 'horaAtendimento');
  }
  if (data.tipoAcidente !== undefined) {
    assertEmUm(data.tipoAcidente, TIPOS_ACIDENTE, 'tipoAcidente');
  }
  if (data.tipoCat !== undefined) {
    assertEmUm(data.tipoCat, TIPOS_CAT, 'tipoCat');
  }
  if (data.parteAtingida !== undefined) {
    assertEmUm(data.parteAtingida, PARTES_ATINGIDAS, 'parteAtingida');
  }
  if (data.agenteCausador !== undefined) {
    assertEmUm(data.agenteCausador, AGENTES_CAUSADORES, 'agenteCausador');
  }
  if (data.tipoLesao !== undefined) {
    assertEmUm(data.tipoLesao, TIPOS_LESAO, 'tipoLesao');
  }
  if (data.localAcidente !== undefined) {
    result.localAcidente = assertTexto(data.localAcidente, 'localAcidente', 255);
  }
  if (data.descricao !== undefined) {
    result.descricao = assertTexto(data.descricao, 'descricao', 999);
  }
  if (data.medico !== undefined) {
    result.medico = assertTexto(data.medico, 'medico', 255);
  }
  if (data.crm !== undefined) {
    result.crm = assertTexto(data.crm, 'crm', 20);
  }
  if (data.ufCrm !== undefined) {
    const ufCrm = data.ufCrm.trim().toUpperCase();
    if (!UF.test(ufCrm)) {
      throw new ValidationError('ufCrm deve ser a sigla de duas letras do estado (ex.: PE).');
    }
    result.ufCrm = ufCrm;
  }
  if (data.cid !== undefined) {
    result.cid = assertCid(data.cid);
  }
  if (data.duracaoTratamentoDias !== undefined) {
    if (!Number.isInteger(data.duracaoTratamentoDias) || data.duracaoTratamentoDias < 0) {
      throw new ValidationError('duracaoTratamentoDias deve ser um inteiro não negativo.');
    }
  }
  if (data.obito !== undefined) {
    result.dataObito = assertObito(data.obito, data.dataObito);
  } else if (data.dataObito !== undefined && data.dataObito !== null) {
    parseDate(data.dataObito, 'dataObito');
  }

  return result;
};
