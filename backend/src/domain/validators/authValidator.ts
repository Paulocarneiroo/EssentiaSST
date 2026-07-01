import { ValidationError } from '../errors/AppError.js';
import type { LoginData, Papel, RegisterData } from '../entities/Usuario.js';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SENHA_MIN_LENGTH = 6;
const PAPEIS: readonly Papel[] = ['ADMIN', 'OPERADOR'];

const normalizeEmail = (email: string): string => email.trim().toLowerCase();

export const validateRegister = (data: RegisterData): Required<Omit<RegisterData, 'papel'>> & {
  papel: Papel;
} => {
  if (!data.empresaId?.trim()) {
    throw new ValidationError('empresaId é obrigatório.');
  }
  if (!data.nome?.trim()) {
    throw new ValidationError('Nome é obrigatório.');
  }
  if (!data.email?.trim() || !EMAIL_REGEX.test(data.email.trim())) {
    throw new ValidationError('E-mail inválido.');
  }
  if (!data.senha || data.senha.length < SENHA_MIN_LENGTH) {
    throw new ValidationError(`A senha deve ter ao menos ${SENHA_MIN_LENGTH} caracteres.`);
  }
  if (data.papel !== undefined && !PAPEIS.includes(data.papel)) {
    throw new ValidationError(`Papel inválido. Use um de: ${PAPEIS.join(', ')}.`);
  }

  return {
    empresaId: data.empresaId.trim(),
    nome: data.nome.trim(),
    email: normalizeEmail(data.email),
    senha: data.senha,
    papel: data.papel ?? 'OPERADOR',
  };
};

export const validateLogin = (data: LoginData): LoginData => {
  if (!data.email?.trim() || !EMAIL_REGEX.test(data.email.trim())) {
    throw new ValidationError('E-mail inválido.');
  }
  if (!data.senha) {
    throw new ValidationError('Senha é obrigatória.');
  }
  return { email: normalizeEmail(data.email), senha: data.senha };
};
