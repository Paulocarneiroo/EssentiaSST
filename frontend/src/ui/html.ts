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
