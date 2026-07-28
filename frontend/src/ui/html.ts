const ENTIDADES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Escapa texto vindo da API antes de interpolar em template de HTML.
 * Toda view monta markup por string, então isso é a barreira contra injeção.
 */
export const esc = (valor: unknown): string => {
  if (valor === null || valor === undefined) return '';
  return String(valor).replace(/[&<>"']/g, (char) => ENTIDADES[char] ?? char);
};

/** Remove o markup de um documento HTML mantendo só o conteúdo do `<body>`. */
export const corpoDoDocumento = (documento: string): string => {
  const corpo = /<body[^>]*>([\s\S]*)<\/body>/i.exec(documento);
  return corpo?.[1] ?? documento;
};

/** Dispara o download de um conteúdo textual gerado no cliente. */
export const baixarArquivo = (conteudo: string, nomeArquivo: string, mimeType: string): void => {
  const blob = new Blob([conteudo], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};
