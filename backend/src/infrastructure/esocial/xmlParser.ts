/** Nó de elemento de um documento XML já parseado. */
export interface ElementNode {
  name: string;
  attributes: Record<string, string>;
  children: ElementNode[];
  /** Texto direto do elemento, já com entidades resolvidas. */
  text: string;
}

export class XmlParseError extends Error {}

const TAG_REGEX = /<(\/?)([A-Za-z_][\w.:-]*)((?:\s+[\w:.-]+\s*=\s*"[^"]*")*)\s*(\/?)>/g;
const ATTR_REGEX = /([\w:.-]+)\s*=\s*"([^"]*)"/g;

const unescapeXml = (value: string): string =>
  value
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');

const parseAttributes = (raw: string): Record<string, string> => {
  const attributes: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR_REGEX)) {
    const [, nome, valor] = match;
    if (nome !== undefined) {
      attributes[nome] = unescapeXml(valor ?? '');
    }
  }
  return attributes;
};

/**
 * Parser XML mínimo, suficiente para os documentos que o próprio sistema gera:
 * elementos, atributos e texto. Não trata CDATA, comentários nem namespaces
 * prefixados — se algum aparecer, o documento é rejeitado como malformado.
 */
export const parseXml = (xml: string): ElementNode => {
  const semDeclaracao = xml.replace(/^\s*<\?xml[^?]*\?>/, '');

  if (/<!\[CDATA\[|<!--/.test(semDeclaracao)) {
    throw new XmlParseError('Documento contém CDATA ou comentários, não suportados.');
  }

  const pilha: ElementNode[] = [];
  let raiz: ElementNode | null = null;
  let ultimoIndice = 0;

  for (const match of semDeclaracao.matchAll(TAG_REGEX)) {
    const [tagCompleta, fechamento, nomeCapturado, atributosRaw, autoFechada] = match;
    // Os grupos 1..4 sempre casam quando a tag casa; o fallback satisfaz o compilador.
    const nome = nomeCapturado ?? '';
    const atual = pilha[pilha.length - 1];

    const textoAntes = semDeclaracao.slice(ultimoIndice, match.index);
    if (atual) {
      atual.text += unescapeXml(textoAntes);
    } else if (textoAntes.trim()) {
      throw new XmlParseError(`Texto fora do elemento raiz: "${textoAntes.trim()}".`);
    }
    ultimoIndice = (match.index ?? 0) + tagCompleta.length;

    if (fechamento) {
      if (!atual) {
        throw new XmlParseError(`Fechamento inesperado de </${nome}>.`);
      }
      if (atual.name !== nome) {
        throw new XmlParseError(`Esperava </${atual.name}>, encontrou </${nome}>.`);
      }
      pilha.pop();
      continue;
    }

    const node: ElementNode = {
      name: nome,
      attributes: parseAttributes(atributosRaw ?? ''),
      children: [],
      text: '',
    };

    if (atual) {
      atual.children.push(node);
    } else if (raiz) {
      throw new XmlParseError(`Documento possui mais de um elemento raiz ("${nome}").`);
    } else {
      raiz = node;
    }

    if (!autoFechada) {
      pilha.push(node);
    }
  }

  const naoFechado = pilha[pilha.length - 1];
  if (naoFechado) {
    throw new XmlParseError(`Elemento <${naoFechado.name}> não foi fechado.`);
  }
  if (!raiz) {
    throw new XmlParseError('Documento não possui elemento raiz.');
  }

  return raiz;
};
