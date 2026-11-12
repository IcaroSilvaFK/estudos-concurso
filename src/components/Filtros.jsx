import { useMemo } from "react";
import { ultimaTentativa } from "../lib/progresso.js";
import { disciplinaInfo } from "../lib/disciplinas.js";
import { Icone } from "./Questao.jsx";

export const FILTRO_PADRAO = { disciplinas: [], assunto: "", situacao: "todas", origem: "" };

const SITUACOES = [
  ["todas", "Todas"],
  ["novas", "Não respondidas"],
  ["erradas", "Que errei"],
  ["favoritas", "Favoritas"],
];
const ORIGENS = [["", "Todas"], ["fcc", "Estilo FCC"], ["inedita", "Inéditas"]];

export function filtrar(questoes, prog, f) {
  return questoes.filter((q) => {
    if (f.disciplinas.length && !f.disciplinas.includes(q.disciplina)) return false;
    if (f.assunto && q.assunto !== f.assunto) return false;
    if (f.origem && q.origem !== f.origem) return false;
    const r = prog.questoes[q.id];
    if (f.situacao === "novas") return !r?.tentativas.length;
    if (f.situacao === "erradas") return ultimaTentativa(prog, q.id)?.certo === false;
    if (f.situacao === "favoritas") return !!r?.favorita;
    return true;
  });
}

function Segmentado({ nome, opcoes, valor, onChange }) {
  return (
    <div className="segmentado" role="radiogroup" aria-label={nome}>
      {opcoes.map(([v, rotulo]) => (
        <button key={v} type="button" role="radio" aria-checked={valor === v} onClick={() => onChange(v)}>{rotulo}</button>
      ))}
    </div>
  );
}

export function Filtros({ questoes, valor, onChange, situacao = true }) {
  const disciplinas = useMemo(() => [...new Set(questoes.map((q) => q.disciplina))], [questoes]);
  const assuntos = useMemo(() => {
    const base = valor.disciplinas.length ? questoes.filter((q) => valor.disciplinas.includes(q.disciplina)) : questoes;
    return [...new Set(base.map((q) => q.assunto))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [questoes, valor.disciplinas]);

  const set = (parcial) => onChange({ ...valor, ...parcial });
  const alternarDisc = (d) => {
    const nova = valor.disciplinas.includes(d) ? valor.disciplinas.filter((x) => x !== d) : [...valor.disciplinas, d];
    const base = nova.length ? questoes.filter((q) => nova.includes(q.disciplina)) : questoes;
    set({ disciplinas: nova, assunto: base.some((q) => q.assunto === valor.assunto) ? valor.assunto : "" });
  };

  return (
    <div className="filtros">
      <fieldset>
        <legend>
          Disciplinas{" "}
          <span className="legend__nota">
            {valor.disciplinas.length
              ? <>{valor.disciplinas.length} selecionada{valor.disciplinas.length > 1 ? "s" : ""}. <button type="button" className="link" onClick={() => set({ disciplinas: [], assunto: "" })}>Usar todas</button></>
              : "todas incluídas; toque para escolher"}
          </span>
        </legend>
        <div className="blocos-disc">
          {disciplinas.map((nome) => {
            const d = disciplinaInfo(nome);
            const sel = valor.disciplinas.includes(nome);
            const total = questoes.filter((q) => q.disciplina === nome).length;
            return (
              <button key={nome} type="button" className="bloco-disc" aria-pressed={sel} style={{ "--cor": d.cor }}
                onClick={() => alternarDisc(nome)}>
                <span className="selo-disc"><Icone nome={sel ? "certo" : d.icone} /></span>
                <span className="bloco-disc__nome">{d.curto}</span>
                <span className="bloco-disc__qtd">{total} questões</span>
              </button>
            );
          })}
        </div>
      </fieldset>

      <div className="filtros__linha">
        <label className="campo">
          <span>Assunto</span>
          <select value={valor.assunto} onChange={(e) => set({ assunto: e.target.value })}>
            <option value="">Todos os assuntos</option>
            {assuntos.map((a) => <option key={a} value={a}>{a}</option>)}
          </select>
        </label>
        <div className="campo">
          <span id="lbl-origem">Origem</span>
          <Segmentado nome="Origem" opcoes={ORIGENS} valor={valor.origem} onChange={(v) => set({ origem: v })} />
        </div>
      </div>

      {situacao && (
        <div className="campo">
          <span>Quais questões</span>
          <Segmentado nome="Quais questões" opcoes={SITUACOES} valor={valor.situacao} onChange={(v) => set({ situacao: v })} />
        </div>
      )}
    </div>
  );
}

export function Quantidade({ max, valor, onChange, rotulo = "Quantidade" }) {
  const v = Math.min(valor, max);
  return (
    <label className="campo quantidade">
      <span>{rotulo}: <strong>{v}</strong> de {max}</span>
      <input type="range" min={max ? 1 : 0} max={max} value={v} disabled={!max}
        onChange={(e) => onChange(Number(e.target.value))} />
    </label>
  );
}
