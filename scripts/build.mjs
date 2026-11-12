// Lê data/*.json, valida as questões e gera BANCO-DE-QUESTOES.md (gabarito ao final).
// Usado pela linha de comando (`npm run questoes`) e pela API do app (scripts/api.mjs).
import { readdir, readFile, writeFile } from "node:fs/promises";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
export const DATA_DIR = join(ROOT, "data");
export const LETRAS = ["a", "b", "c", "d", "e"];
export const ORIGENS = { fcc: "Estilo FCC (base em provas anteriores)", inedita: "Inédita" };

/** Retorna a lista de erros de uma questão (vazia se válida). */
export function validarQuestao(q) {
  const erros = [];
  for (const campo of ["id", "assunto", "origem", "enunciado", "alternativas", "gabarito", "comentario"]) {
    const v = q?.[campo];
    if (v == null || (typeof v === "string" && !v.trim())) erros.push(`campo '${campo}' vazio`);
  }
  if (q?.origem && !ORIGENS[q.origem]) erros.push(`origem inválida '${q.origem}'`);
  const alts = q?.alternativas ?? {};
  const letras = Object.keys(alts);
  if (letras.join() !== LETRAS.join()) erros.push("alternativas devem ser exatamente a, b, c, d, e");
  for (const l of LETRAS) if (typeof alts[l] === "string" && !alts[l].trim()) erros.push(`alternativa ${l.toUpperCase()} vazia`);
  if (q?.gabarito && !LETRAS.includes(q.gabarito)) erros.push(`gabarito inválido '${q.gabarito}'`);
  const textos = Object.values(alts).map((t) => String(t).trim());
  if (new Set(textos).size !== textos.length) erros.push("há alternativas repetidas");
  return erros;
}

/** Lê todos os arquivos de data/ como [{ arquivo, disciplina, prefixo, questoes }]. */
export async function lerArquivos() {
  const nomes = (await readdir(DATA_DIR)).filter((f) => f.endsWith(".json")).sort();
  const out = [];
  for (const arquivo of nomes) {
    const json = JSON.parse(await readFile(join(DATA_DIR, arquivo), "utf8"));
    out.push({ arquivo, ...json });
  }
  return out;
}

export async function gravarArquivo({ arquivo, disciplina, prefixo, questoes }) {
  await writeFile(join(DATA_DIR, arquivo), JSON.stringify({ disciplina, prefixo, questoes }, null, 2) + "\n");
}

/** Valida tudo e regenera os artefatos. Lança Error com a lista de problemas se algo estiver inválido. */
export async function build() {
  const arquivos = await lerArquivos();
  const erros = [];
  const ids = new Set();
  const disciplinas = [];
  const todas = [];

  for (const { arquivo, disciplina, questoes } of arquivos) {
    const lista = [];
    questoes.forEach((q, i) => {
      erros.push(...validarQuestao(q).map((e) => `${arquivo} #${i + 1} (${q.id ?? "sem id"}): ${e}`));
      if (ids.has(q.id)) erros.push(`${arquivo}: id duplicado '${q.id}'`);
      ids.add(q.id);
      const item = { numero: todas.length + 1, disciplina, ...q };
      lista.push(item);
      todas.push(item);
    });
    disciplinas.push({ disciplina, questoes: lista });
  }
  if (erros.length) throw new Error("Erros de validação:\n" + erros.join("\n"));

  await writeFile(join(ROOT, "BANCO-DE-QUESTOES.md"), gerarMarkdown(disciplinas, todas));
  return { disciplinas, todas };
}

function gerarMarkdown(disciplinas, todas) {
  const total = todas.length;
  const nFcc = todas.filter((q) => q.origem === "fcc").length;
  const pct = (n) => (total ? ((n / total) * 100).toFixed(0) : 0) + "%";

  let md = `# Banco de Questões — TRT da 8ª Região (banca FCC)\n\n`;
  md += `Total: **${total} questões** de múltipla escolha (a–e) — `;
  md += `${nFcc} no estilo FCC, com base em provas anteriores (${pct(nFcc)}), e ${total - nFcc} inéditas (${pct(total - nFcc)}).\n\n`;
  md += `> O gabarito completo, com comentários, está ao final do documento.\n\n## Sumário\n\n`;
  for (const d of disciplinas) {
    if (!d.questoes.length) continue;
    md += `- ${d.disciplina} — questões ${d.questoes[0].numero} a ${d.questoes.at(-1).numero}\n`;
  }
  md += `- Gabarito\n\n---\n\n`;

  for (const d of disciplinas) {
    if (!d.questoes.length) continue;
    md += `## ${d.disciplina}\n\n`;
    for (const q of d.questoes) {
      md += `### Questão ${q.numero}\n\n*${q.assunto} · ${ORIGENS[q.origem]}*\n\n`;
      md += q.enunciado.split("\n").join("  \n") + "\n\n";
      for (const l of LETRAS) md += `(${l.toUpperCase()}) ${q.alternativas[l]}  \n`;
      md += `\n`;
    }
    md += `---\n\n`;
  }

  md += `## Gabarito\n\n### Gabarito rápido\n\n`;
  for (const d of disciplinas) {
    if (!d.questoes.length) continue;
    md += `**${d.disciplina}**\n\n| Questão | ${d.questoes.map((q) => q.numero).join(" | ")} |\n`;
    md += `|---|${d.questoes.map(() => "---").join("|")}|\n`;
    md += `| Resposta | ${d.questoes.map((q) => q.gabarito.toUpperCase()).join(" | ")} |\n\n`;
  }
  md += `### Gabarito comentado\n\n`;
  for (const q of todas) md += `**${q.numero} – ${q.gabarito.toUpperCase()}.** ${q.comentario}\n\n`;
  return md;
}

// ---------- Execução pela linha de comando ----------
if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    const { disciplinas, todas } = await build();
    const nFcc = todas.filter((q) => q.origem === "fcc").length;
    console.log(`OK: ${todas.length} questões (${nFcc} estilo FCC / ${todas.length - nFcc} inéditas)`);
    for (const d of disciplinas) console.log(`  - ${d.disciplina}: ${d.questoes.length}`);
    const dist = Object.fromEntries(LETRAS.map((l) => [l.toUpperCase(), todas.filter((q) => q.gabarito === l).length]));
    console.log("  Distribuição do gabarito:", dist);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
