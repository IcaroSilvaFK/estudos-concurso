import { useEffect, useMemo, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useBanco } from "../lib/banco.jsx";
import {
  definirMeta, exportarProgresso, importarProgresso, pendentes, respondidasHoje, useProgresso, zerarProgresso,
} from "../lib/progresso.js";
import { calcular, diaKey, serieDiaria } from "../lib/estatisticas.js";
import { disciplinaInfo } from "../lib/disciplinas.js";
import { formatarTempo, navegar, pct } from "../lib/util.js";
import { Anel } from "../components/Anel.jsx";
import { Icone } from "../components/Questao.jsx";
import { confirmar } from "../components/Dialogo.jsx";

/** Lê tokens de cor do CSS e acompanha a troca de tema claro/escuro. */
function useTokens(nomes) {
  const ler = () => {
    const s = getComputedStyle(document.documentElement);
    return Object.fromEntries(nomes.map((n) => [n, s.getPropertyValue(`--${n}`).trim()]));
  };
  const [t, setT] = useState(ler);
  useEffect(() => {
    const mq = matchMedia("(prefers-color-scheme: dark)");
    const f = () => setT(ler());
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return t;
}

const nivel = (n) => (n === 0 ? 0 : n < 5 ? 1 : n < 10 ? 2 : n < 20 ? 3 : 4);

function saudacao() {
  const h = new Date().getHours();
  return h < 12 ? "Bom dia" : h < 18 ? "Boa tarde" : "Boa noite";
}

function Destaque({ est, nPend, prog }) {
  const hoje = respondidasHoje(prog);
  const meta = prog.config.metaDiaria;
  const [editando, setEditando] = useState(false);
  const faltam = Math.max(0, meta - hoje);

  const mensagem = !est.total
    ? "Vamos começar? Responda suas primeiras questões e o painel ganha vida."
    : nPend
      ? `Você tem ${nPend} ${nPend === 1 ? "questão" : "questões"} para revisar hoje.`
      : faltam
        ? `Faltam ${faltam} ${faltam === 1 ? "questão" : "questões"} para a meta de hoje.`
        : "Meta de hoje cumprida. Bom trabalho!";

  return (
    <section className="destaque">
      <div className="destaque__texto">
        <p className="destaque__ola">{saudacao()}!</p>
        <h1 className="destaque__titulo">{mensagem}</h1>
        <div className="acoes">
          <button className="btn btn--g" onClick={() => navegar(nPend ? "revisao" : "treinar")}>
            {nPend ? "Revisar agora" : est.total ? "Continuar estudando" : "Treinar 10 questões"}
          </button>
          <button className="btn btn--fantasma btn--g" onClick={() => navegar("prova")}>Fazer uma prova</button>
        </div>
      </div>
      <div className="destaque__meta">
        <Anel valor={hoje / meta} tamanho={148} espessura={12} cor={hoje >= meta ? "var(--certo)" : "var(--caneta)"}
          rotulo={`${hoje} de ${meta} questões hoje`}>
          <strong className="destaque__num">{hoje}</strong>
          <span className="destaque__de">de {meta} hoje</span>
        </Anel>
        {editando ? (
          <label className="destaque__editar">
            Meta diária
            <input type="number" min="1" max="500" defaultValue={meta} autoFocus
              onBlur={(e) => { definirMeta(Number(e.target.value)); setEditando(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") e.currentTarget.blur(); if (e.key === "Escape") setEditando(false); }} />
          </label>
        ) : (
          <button className="link" onClick={() => setEditando(true)}>Ajustar meta</button>
        )}
      </div>
    </section>
  );
}

export default function Painel() {
  const { questoes } = useBanco();
  const prog = useProgresso();
  const est = useMemo(() => calcular(prog, questoes), [prog, questoes]);
  const nPend = useMemo(() => pendentes(prog, questoes).length, [prog, questoes]);
  const cores = useTokens(["caneta", "linha", "grafite-2", "folha"]);

  if (!est.total) {
    return (
      <>
        <Destaque est={est} nPend={nPend} prog={prog} />
        <PorDisciplina questoes={questoes} prog={prog} est={est} />
        <Dados />
      </>
    );
  }

  const serie14 = serieDiaria(est.porDia, 14);
  const fracos = est.porAssunto
    .filter((a) => a.taxa < 0.75)
    .sort((a, b) => a.taxa - b.taxa || b.total - a.total)
    .slice(0, 6);

  const cartoes = [
    { icone: "raio", rotulo: `Nível ${est.nivel}`, valor: `${est.xp} XP`, nota: `faltam ${est.xpDoNivel - est.xpNoNivel} XP para o nível ${est.nivel + 1}` },
    { icone: "certo", rotulo: "Acerto geral", valor: `${pct(est.acertos, est.total)}%`, nota: `${est.acertos} acertos` },
    { icone: "chama", rotulo: "Sequência", valor: `${est.sequencia} ${est.sequencia === 1 ? "dia" : "dias"}`, nota: est.estudouHoje ? "Você já estudou hoje." : "Estude hoje para manter." },
    { icone: "revisao", rotulo: "Revisões vencidas", valor: nPend, nota: nPend ? "Esperando por você." : "Tudo em dia." },
  ];

  return (
    <div className="painel">
      <Destaque est={est} nPend={nPend} prog={prog} />

      <ul className="cartoes">
        {cartoes.map((c) => (
          <li key={c.rotulo} className="cartao">
            <span className={`cartao__icone cartao__icone--${c.icone}`}><Icone nome={c.icone} /></span>
            <span className="cartao__rotulo">{c.rotulo}</span>
            <strong className="cartao__valor">{c.valor}</strong>
            <span className="cartao__nota">{c.nota}</span>
          </li>
        ))}
      </ul>

      <div className="duas-colunas duas-colunas--larga">
        <div className="bloco caixa-branca">
          <h2 className="subtitulo">Frequência nas últimas 12 semanas</h2>
          <Calendario porDia={est.porDia} />
        </div>
        <div className="bloco caixa-branca">
          <h2 className="subtitulo">Questões por dia</h2>
          <ResponsiveContainer width="100%" height={170}>
            <BarChart data={serie14} margin={{ top: 8, right: 4, bottom: 0, left: -28 }}>
              <CartesianGrid vertical={false} stroke={cores.linha} strokeDasharray="2 4" />
              <XAxis dataKey="rotulo" tick={{ fill: cores["grafite-2"], fontSize: 11 }} tickLine={false} axisLine={{ stroke: cores.linha }} interval={2} />
              <YAxis allowDecimals={false} tick={{ fill: cores["grafite-2"], fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: cores.linha, opacity: 0.35 }} content={<Dica formato={(p) => `${p.total} ${p.total === 1 ? "questão" : "questões"}`} />} />
              <Bar dataKey="total" fill={cores.caneta} radius={[4, 4, 0, 0]} maxBarSize={18} isAnimationActive={false} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <PorDisciplina questoes={questoes} prog={prog} est={est} />

      <div className="duas-colunas duas-colunas--larga">
        <div className="bloco caixa-branca">
          <h2 className="subtitulo">Onde você mais erra</h2>
          {fracos.length ? (
            <ul className="fracos">
              {fracos.map((a) => {
                const d = disciplinaInfo(a.disciplina);
                return (
                  <li key={a.chave}>
                    <span className="selo-disc" style={{ "--cor": d.cor }}><Icone nome={d.icone} tamanho={16} /></span>
                    <div>
                      <strong>{a.assunto}</strong>
                      <span>{d.curto}, {a.acertos} de {a.total} certas</span>
                    </div>
                    <button className="btn btn--fantasma btn--p" onClick={() => navegar("treinar", { disciplina: a.disciplina, assunto: a.assunto })}>
                      Treinar
                    </button>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="dica">Nenhum assunto abaixo de 75% de acerto. Continue variando as disciplinas.</p>
          )}
        </div>
        <div className="bloco caixa-branca">
          <h2 className="subtitulo">Acerto por dia</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={serie14} margin={{ top: 8, right: 8, bottom: 0, left: -24 }}>
              <CartesianGrid vertical={false} stroke={cores.linha} strokeDasharray="2 4" />
              <XAxis dataKey="rotulo" tick={{ fill: cores["grafite-2"], fontSize: 11 }} tickLine={false} axisLine={{ stroke: cores.linha }} interval={2} />
              <YAxis domain={[0, 100]} ticks={[0, 50, 100]} unit="%" tick={{ fill: cores["grafite-2"], fontSize: 11 }} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ stroke: cores.linha }} content={<Dica formato={(p) => (p.taxa === null ? "sem estudo" : `${p.taxa}% de acerto`)} />} />
              <Line dataKey="taxa" stroke={cores.caneta} strokeWidth={2} connectNulls={false}
                dot={{ r: 4, fill: cores.caneta, stroke: cores.folha, strokeWidth: 2 }} activeDot={{ r: 5 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {prog.provas.length > 0 && (
        <div className="bloco caixa-branca">
          <h2 className="subtitulo">Provas recentes</h2>
          <table className="tabela">
            <thead><tr><th>Data</th><th className="num">Nota</th><th className="num">%</th><th className="num">Tempo</th></tr></thead>
            <tbody>
              {[...prog.provas].reverse().slice(0, 8).map((p) => (
                <tr key={p.t}>
                  <td>{new Date(p.t).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</td>
                  <td className="num">{p.acertos} de {p.total}</td>
                  <td className="num">{pct(p.acertos, p.total)}%</td>
                  <td className="num">{formatarTempo(p.duracaoSeg)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dados />
    </div>
  );
}

function PorDisciplina({ questoes, prog, est }) {
  const grupos = [...new Set(questoes.map((q) => q.disciplina))].map((d) => [d, questoes.filter((q) => q.disciplina === d)]);
  return (
    <div className="bloco">
      <h2 className="subtitulo">Disciplinas</h2>
      <ul className="disciplinas">
        {grupos.map(([nome, qs]) => {
          const d = disciplinaInfo(nome);
          const s = est.porDisciplina.find((x) => x.chave === nome);
          const vistas = qs.filter((q) => prog.questoes[q.id]?.tentativas.length).length;
          const taxa = s ? pct(s.acertos, s.total) : null;
          return (
            <li key={nome}>
              <button className="disciplina" style={{ "--cor": d.cor }} onClick={() => navegar("treinar", { disciplina: nome })}>
                <span className="disciplina__capa" aria-hidden="true"><Icone nome={d.icone} tamanho={30} /></span>
                <span className="disciplina__corpo">
                  <span className="disciplina__nome">{d.curto}</span>
                  <span className="disciplina__taxa">{taxa === null ? "Ainda não começou" : `${taxa}% de acerto`}</span>
                  <span className="disciplina__barra" aria-hidden="true"><span style={{ width: `${(vistas / qs.length) * 100}%` }} /></span>
                  <span className="disciplina__rodape">
                    <span className="disciplina__cob">{vistas}/{qs.length} questões</span>
                    <span className="disciplina__acao">{vistas ? "Continuar" : "Começar"}</span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Dica({ active, payload, formato }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="dica-grafico">
      <strong>{p.rotulo}</strong>
      <span>{formato(p)}</span>
    </div>
  );
}

/** Calendário de frequência: uma bolinha por dia, mais escura quanto mais questões. */
function Calendario({ porDia }) {
  const semanas = 12;
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const inicio = new Date(hoje);
  inicio.setDate(inicio.getDate() - (semanas * 7 - 1));
  inicio.setDate(inicio.getDate() - inicio.getDay()); // primeira coluna começa num domingo
  const dias = [];
  for (const d = new Date(inicio); d <= hoje; d.setDate(d.getDate() + 1)) {
    const v = porDia.get(diaKey(d));
    dias.push({ chave: diaKey(d), data: new Date(d), total: v?.total ?? 0, acertos: v?.acertos ?? 0 });
  }
  return (
    <div className="calendario-wrap">
      <ol className="calendario" aria-label="Frequência de estudo por dia">
        {dias.map((d) => {
          const desc = `${d.data.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}: ${d.total ? `${d.total} ${d.total === 1 ? "questão" : "questões"}, ${pct(d.acertos, d.total)}% de acerto` : "sem estudo"}`;
          return <li key={d.chave} className={`dia dia--${nivel(d.total)}`} title={desc} aria-label={desc} />;
        })}
      </ol>
      <div className="legenda" aria-hidden="true">
        <span>Menos</span>{[0, 1, 2, 3, 4].map((n) => <span key={n} className={`dia dia--${n}`} />)}<span>Mais</span>
      </div>
    </div>
  );
}

function Dados() {
  const arquivo = useRef(null);
  const [msg, setMsg] = useState("");

  function baixar() {
    const blob = new Blob([exportarProgresso()], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `progresso-trt8-${diaKey(Date.now())}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }
  async function importar(e) {
    const f = e.target.files[0];
    if (!f) return;
    try {
      importarProgresso(await f.text());
      setMsg("Progresso importado.");
    } catch (err) {
      setMsg(`Não foi possível importar: ${err.message}`);
    }
    e.target.value = "";
  }

  return (
    <details className="dados">
      <summary>Seus dados</summary>
      <p className="dica">O progresso fica salvo neste navegador. Baixe um backup para levar a outro computador.</p>
      <div className="acoes">
        <button className="btn btn--fantasma btn--p" onClick={baixar}>Baixar backup</button>
        <button className="btn btn--fantasma btn--p" onClick={() => arquivo.current.click()}>Importar backup</button>
        <input ref={arquivo} type="file" accept="application/json" hidden onChange={importar} />
        <button className="btn btn--perigo btn--p"
          onClick={async () => {
            if (await confirmar({ titulo: "Apagar todo o progresso?", mensagem: "Respostas, XP, sequência e provas deste navegador serão apagados. Não dá para desfazer.", confirmar: "Apagar progresso", perigo: true })) {
              zerarProgresso(); setMsg("Progresso apagado.");
            }
          }}>
          Apagar progresso
        </button>
      </div>
      {msg && <p className="dica" role="status">{msg}</p>}
    </details>
  );
}
