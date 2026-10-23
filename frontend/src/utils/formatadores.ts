// 2026-10-10 vira 10/10/2026 (sem usar Date, para evitar erro de fuso horário)
export function formatarData(data: string) {
  const [ano, mes, dia] = data.split("-");
  return `${dia}/${mes}/${ano}`;
}

// 59.9 vira "R$ 59,90"
export function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

// 2026-10-01 vira "Outubro de 2026"
export function formatarMes(referencia: string) {
  const [ano, mes] = referencia.split("-").map(Number);
  const texto = new Date(ano, mes - 1, 1).toLocaleDateString("pt-BR", {
    month: "long",
    year: "numeric",
  });
  return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Data de hoje no Brasil (AAAA-MM-DD). Nesse formato, datas podem ser
// comparadas como texto: "2026-10-10" < "2026-10-22".
export function hojeNoBrasil() {
  return new Date().toLocaleDateString("en-CA", {
    timeZone: "America/Sao_Paulo",
  });
}