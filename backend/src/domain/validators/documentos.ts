/**
 * Validação dos dígitos verificadores de CPF e CNPJ (módulo 11).
 *
 * Contar dígitos não basta: um CPF como `11111111111` tem 11 dígitos e passaria,
 * mas nunca seria aceito pelo eSocial — a rejeição só apareceria na transmissão.
 */

/** Sequências de um único dígito repetido satisfazem o módulo 11, mas não existem. */
const REPETIDOS = /^(\d)\1+$/;

export const somenteDigitos = (valor: string): string => valor.replace(/\D/g, '');

export const isCpfValido = (cpf: string): boolean => {
  if (cpf.length !== 11 || REPETIDOS.test(cpf)) {
    return false;
  }

  // Dígitos 10 e 11: pesos decrescentes a partir de 10 e de 11, respectivamente.
  for (const posicao of [9, 10]) {
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) {
      soma += Number(cpf[i]) * (posicao + 1 - i);
    }
    const digito = ((soma * 10) % 11) % 10;
    if (digito !== Number(cpf[posicao])) {
      return false;
    }
  }

  return true;
};

/** Pesos do segundo dígito; o primeiro usa os 12 últimos desta mesma sequência. */
const PESOS_CNPJ = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

export const isCnpjValido = (cnpj: string): boolean => {
  if (cnpj.length !== 14 || REPETIDOS.test(cnpj)) {
    return false;
  }

  for (const posicao of [12, 13]) {
    const pesos = PESOS_CNPJ.slice(PESOS_CNPJ.length - posicao);
    let soma = 0;
    for (let i = 0; i < posicao; i += 1) {
      soma += Number(cnpj[i]) * (pesos[i] as number);
    }
    const resto = soma % 11;
    const digito = resto < 2 ? 0 : 11 - resto;
    if (digito !== Number(cnpj[posicao])) {
      return false;
    }
  }

  return true;
};
