// Agregações do progresso para o painel.

/** XP: 10 por acerto, 2 por tentativa errada (errar também é treinar). */
export const XP_ACERTO = 10;
export const XP_ERRO = 2;
export const xpDe = (acertos, erros) => acertos * XP_ACERTO + erros * XP_ERRO;
/** Níveis ficam um pouco mais longos a cada etapa: 100, 150, 200... XP. */
export function nivelDe(xp) {
  let nivel = 1, base = 0, custo = 100;
  while (xp >= base + custo) { base += custo; nivel++; custo += 50; }
  return { nivel, xpNoNivel: xp - base, xpDoNivel: custo };
}
export function diaKey(t) {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function agrupar(tentativas, chave) {
  const m = new Map();
  for (const t of tentativas) {
    const k = chave(t.q);
    const v = m.get(k) ?? { chave: k, total: 0, acertos: 0 };
    v.total++;
    if (t.certo) v.acertos++;
    m.set(k, v);
  }
  return [...m.values()].map((v) => ({ ...v, taxa: v.acertos / v.total }));
}

export function calcular(prog, questoes) {
  const tentativas = [];
  for (const q of questoes) {
    for (const t of prog.questoes[q.id]?.tentativas ?? []) tentativas.push({ ...t, q });
  }
  const total = tentativas.length;
  const acertos = tentativas.filter((t) => t.certo).length;

  const porDia = new Map();
  for (const t of tentativas) {
    const k = diaKey(t.t);
    const v = porDia.get(k) ?? { total: 0, acertos: 0 };
    v.total++;
    if (t.certo) v.acertos++;
    porDia.set(k, v);
  }

  // dias seguidos com estudo, contando até hoje (ou até ontem, se hoje ainda não estudou)
  let sequencia = 0;
  const d = new Date();
  if (!porDia.has(diaKey(d))) d.setDate(d.getDate() - 1);
  while (porDia.has(diaKey(d))) { sequencia++; d.setDate(d.getDate() - 1); }

  const vistas = questoes.filter((q) => prog.questoes[q.id]?.tentativas.length).length;
  const xp = xpDe(acertos, total - acertos);

  return {
    total, acertos, vistas, sequencia, porDia, xp, ...nivelDe(xp),
    estudouHoje: porDia.has(diaKey(Date.now())),
    porDisciplina: agrupar(tentativas, (q) => q.disciplina),
    porAssunto: agrupar(tentativas, (q) => `${q.disciplina}\u0000${q.assunto}`).map((v) => {
      const [disciplina, assunto] = v.chave.split("\u0000");
      return { ...v, disciplina, assunto };
    }),
  };
}

/** Série dos últimos `n` dias (inclui dias sem estudo, com taxa nula). */
export function serieDiaria(porDia, n) {
  const out = [];
  const d = new Date();
  d.setDate(d.getDate() - (n - 1));
  for (let i = 0; i < n; i++) {
    const v = porDia.get(diaKey(d));
    out.push({
      chave: diaKey(d),
      rotulo: `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`,
      semana: d.getDay(),
      total: v?.total ?? 0,
      taxa: v ? Math.round((v.acertos / v.total) * 100) : null,
    });
    d.setDate(d.getDate() + 1);
  }
  return out;
}
