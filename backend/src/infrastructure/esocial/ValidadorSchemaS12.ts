import type { IValidadorSchema, ResultadoValidacao } from '../../application/ports/IValidadorSchema.js';
import { SCHEMAS_POR_EVENTO, type ElementSpec } from './schemasS12.js';
import { parseXml, XmlParseError, type ElementNode } from './xmlParser.js';

/**
 * `ValidadorSchemaS12` — valida a estrutura do XML contra o leiaute S-1.2:
 * presença e ordem dos elementos, cardinalidade, atributos e formato dos valores.
 *
 * É uma validação estrutural, não uma validação XSD contra o arquivo oficial.
 * Cobre os erros de formato que causam rejeição, mas não substitui a homologação
 * oficial — para isso, basta uma outra implementação de `IValidadorSchema` (DIP).
 */
export class ValidadorSchemaS12 implements IValidadorSchema {
  validar(xml: string): ResultadoValidacao {
    let raiz: ElementNode;
    try {
      raiz = parseXml(xml);
    } catch (error) {
      const mensagem = error instanceof XmlParseError ? error.message : 'XML malformado.';
      return { valido: false, erros: [`XML malformado: ${mensagem}`] };
    }

    const evento = raiz.children[0]?.name;
    const schema = evento ? SCHEMAS_POR_EVENTO[evento] : undefined;
    if (!schema) {
      return {
        valido: false,
        erros: [
          `Tipo de evento não reconhecido: esperava um de ${Object.keys(SCHEMAS_POR_EVENTO).join(', ')}.`,
        ],
      };
    }

    const erros: string[] = [];
    validarElemento(raiz, schema, 'eSocial', erros);
    return { valido: erros.length === 0, erros };
  }
}

const validarElemento = (
  node: ElementNode,
  spec: ElementSpec,
  caminho: string,
  erros: string[],
): void => {
  for (const atributo of spec.atributos ?? []) {
    const valor = node.attributes[atributo.nome];
    if (valor === undefined) {
      erros.push(`${caminho}: atributo obrigatório "${atributo.nome}" ausente.`);
    } else if (!atributo.padrao.test(valor)) {
      erros.push(`${caminho}@${atributo.nome}: valor "${valor}" fora do formato esperado.`);
    }
  }

  if (spec.children?.length) {
    validarFilhos(node, spec, caminho, erros);
    return;
  }

  // Elemento folha: valida o conteúdo textual.
  const texto = node.text.trim();
  if (spec.valores && !spec.valores.includes(texto)) {
    erros.push(`${caminho}: valor "${texto}" inválido. Esperado um de: ${spec.valores.join(', ')}.`);
  }
  if (spec.padrao && !spec.padrao.test(texto)) {
    erros.push(`${caminho}: valor "${texto}" fora do formato esperado.`);
  }
};

const validarFilhos = (
  node: ElementNode,
  spec: ElementSpec,
  caminho: string,
  erros: string[],
): void => {
  const esperados = spec.children ?? [];
  const restantes = [...node.children];

  for (const filhoSpec of esperados) {
    const encontrados: ElementNode[] = [];
    // Consome os filhos com esse nome que estejam à frente na sequência.
    while (restantes[0]?.name === filhoSpec.name) {
      encontrados.push(restantes.shift() as ElementNode);
      if (!filhoSpec.repetivel) {
        break;
      }
    }

    if (encontrados.length === 0) {
      if (!filhoSpec.opcional) {
        const proximo = restantes[0];
        const posicao = proximo ? ` (encontrou <${proximo.name}>)` : '';
        erros.push(`${caminho}: elemento obrigatório <${filhoSpec.name}> ausente${posicao}.`);
      }
      continue;
    }

    encontrados.forEach((filho, indice) => {
      const sufixo = filhoSpec.repetivel && encontrados.length > 1 ? `[${indice + 1}]` : '';
      validarElemento(filho, filhoSpec, `${caminho}/${filhoSpec.name}${sufixo}`, erros);
    });
  }

  for (const sobra of restantes) {
    erros.push(`${caminho}: elemento <${sobra.name}> inesperado ou fora de ordem.`);
  }
};
