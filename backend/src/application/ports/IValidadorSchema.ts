/** Resultado da validação de um XML contra o leiaute do eSocial. */
export interface ResultadoValidacao {
  valido: boolean;
  /** Mensagens indicando o campo/elemento problemático (vazio quando válido). */
  erros: string[];
}

/**
 * `IValidadorSchema` do modelo de domínio: isola o montador da biblioteca de
 * validação concreta (estrutural, XSD oficial ou mock de testes).
 */
export interface IValidadorSchema {
  validar(xml: string): ResultadoValidacao;
}
