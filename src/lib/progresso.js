// Progresso do estudante, salvo no navegador (localStorage), com repetição espaçada (caixas de Leitner).
import { useSyncExternalStore } from "react";

const KEY = "trt8-progresso-v1";
export const DIA = 86_400_000;
/** Intervalo (em dias) até a próxima revisão, por caixa. Caixa 0 = nunca respondida. */
export const INTERVALOS = [0, 1, 3, 7, 16, 35];
export const CAIXAS = 5;

export const META_PADRAO = 20;
const vazio = () => ({ questoes: {}, provas: [], config: { metaDiaria: META_PADRAO } });

function ler() {
  try {
    const v = JSON.parse(localStorage.getItem(KEY));
    return v && typeof v.questoes === "object" ? { ...vazio(), ...v, config: { ...vazio().config, ...v.config } } : vazio();
  } catch {
    return vazio();
  }
}

let estado = ler();
const ouvintes = new Set();

function definir(novo) {
  estado = novo;
  try { localStorage.setItem(KEY, JSON.stringify(estado)); } catch { /* armazenamento indisponível: segue só em memória */ }
  ouvintes.forEach((f) => f());
}

window.addEventListener("storage", (e) => {
  if (e.key === KEY) { estado = ler(); ouvintes.forEach((f) => f()); }
});

export function useProgresso() {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => estado);
}

export const registroDe = (prog, id) =>
  prog.questoes[id] ?? { tentativas: [], caixa: 0, proxima: 0, favorita: false };

/**
 * Registra uma resposta e reagenda a questão:
 * acerto sobe uma caixa (revisão mais espaçada); erro volta para a caixa 1, com revisão imediata.
 */
export function registrarResposta(id, certo, modo) {
  const agora = Date.now();
  const r = registroDe(estado, id);
  const caixa = certo ? Math.min(r.caixa + 1, CAIXAS) : 1;
  const proxima = certo ? agora + INTERVALOS[caixa] * DIA : agora;
  definir({
    ...estado,
    questoes: { ...estado.questoes, [id]: { ...r, caixa, proxima, tentativas: [...r.tentativas, { t: agora, certo, modo }] } },
  });
}

export function alternarFavorita(id) {
  const r = registroDe(estado, id);
  definir({ ...estado, questoes: { ...estado.questoes, [id]: { ...r, favorita: !r.favorita } } });
}

export function registrarProva(resumo) {
  definir({ ...estado, provas: [...estado.provas, { t: Date.now(), ...resumo }] });
}

export function definirMeta(n) {
  definir({ ...estado, config: { ...estado.config, metaDiaria: Math.max(1, Math.min(500, Math.round(n) || META_PADRAO)) } });
}

/** Quantas respostas foram dadas desde a meia-noite. */
export function respondidasHoje(prog) {
  const inicio = new Date(); inicio.setHours(0, 0, 0, 0);
  let n = 0;
  for (const r of Object.values(prog.questoes)) for (const t of r.tentativas) if (t.t >= inicio.getTime()) n++;
  return n;
}

export function zerarProgresso() {
  definir({ ...vazio(), config: estado.config });
}

export function exportarProgresso() {
  return JSON.stringify(estado, null, 2);
}

export function importarProgresso(texto) {
  const v = JSON.parse(texto);
  if (!v || typeof v.questoes !== "object") throw new Error("Arquivo não parece um backup de progresso.");
  definir({ ...vazio(), ...v, config: { ...vazio().config, ...v.config } });
}

/** Questões já respondidas cuja revisão venceu, das mais frágeis (caixa baixa) para as mais firmes. */
export function pendentes(prog, questoes, agora = Date.now()) {
  return questoes
    .filter((q) => { const r = prog.questoes[q.id]; return r && r.tentativas.length && r.proxima <= agora; })
    .sort((a, b) => prog.questoes[a.id].caixa - prog.questoes[b.id].caixa || prog.questoes[a.id].proxima - prog.questoes[b.id].proxima);
}

export const ultimaTentativa = (prog, id) => prog.questoes[id]?.tentativas.at(-1);
