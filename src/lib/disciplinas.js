// Identidade visual de cada disciplina: cor (token CSS --d-<chave>) e ícone.
// A cor acompanha a disciplina em todo o app e sempre vem junto do nome (nunca sozinha).
const MAPA = {
  "Língua Portuguesa": { chave: "pt", curto: "Português", icone: "livro" },
  "Matemática e Raciocínio Lógico": { chave: "mat", curto: "Matemática e RL", icone: "calc" },
  "Noções de Legislação": { chave: "leg", curto: "Legislação", icone: "balanca" },
  "Noções de Direitos Humanos": { chave: "dh", curto: "Direitos Humanos", icone: "mundo" },
  "Direitos das Pessoas com Deficiência": { chave: "pcd", curto: "Pessoas com Deficiência", icone: "acesso" },
  "Noções de Informática": { chave: "info", curto: "Informática", icone: "monitor" },
};

export function disciplinaInfo(nome) {
  const d = MAPA[nome] ?? { chave: "outra", curto: nome, icone: "livro" };
  return { ...d, nome, cor: `var(--d-${d.chave})` };
}
