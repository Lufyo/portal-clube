// Faz o navegador baixar um arquivo .json montado na própria página
export function baixarJson(nomeArquivo: string, dados: unknown) {
  const arquivo = new Blob([JSON.stringify(dados, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(arquivo);

  const link = document.createElement("a");
  link.href = url;
  link.download = nomeArquivo;
  link.click();

  URL.revokeObjectURL(url);
}
