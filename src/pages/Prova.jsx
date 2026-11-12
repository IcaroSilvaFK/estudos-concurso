import { useEffect, useMemo, useRef, useState } from "react";
import { LETRAS, useBanco } from "../lib/banco.jsx";
import { alternarFavorita, registrarProva, registrarResposta, useProgresso } from "../lib/progresso.js";
import { definirBloqueio, embaralhar, formatarTempo, navegar, pct, useTeclas } from "../lib/util.js";
import { FILTRO_PADRAO, Filtros, Quantidade, filtrar } from "../components/Filtros.jsx";
import { Bolha, Icone, Questao } from "../components/Questao.jsx";

const MINUTOS = [2, 3, 4, 5];

export default function Prova() {
  const { questoes } = useBanco();
  const prog = useProgresso();
  const [filtro, setFiltro] = useState(FILTRO_PADRAO);
  const [qtd, setQtd] = useState(20);
  const [minutos, setMinutos] = useState(3);
  const [prova, setProva] = useState(null);       // { fila, fimEm, inicio }
  const [resultado, setResultado] = useState(null);

  const disponiveis = useMemo(() => filtrar(questoes, prog, filtro), [questoes, prog, filtro]);
  const n = Math.min(qtd, disponiveis.length);

  if (resultado) return <Resultado {...resultado} onNova={() => { setResultado(null); setProva(null); }} />;
  if (prova) return <EmProva {...prova} onEntregar={(r) => { setResultado(r); setProva(null); }} />;

  return (
    <section>
      <h1 className="titulo">Prova</h1>
      <p className="lead">
        Simulado com tempo, no formato da FCC: você marca na folha de respostas, pode voltar e trocar, e só vê a correção ao entregar.
      </p>
      <div className="config">
        <Filtros questoes={questoes} valor={filtro} onChange={setFiltro} situacao={false} />
        <div className="config__fim">
          <Quantidade max={disponiveis.length} valor={qtd} onChange={setQtd} rotulo="Questões" />
          <label className="campo">
            <span>Tempo por questão</span>
            <select value={minutos} onChange={(e) => setMinutos(Number(e.target.value))}>
              {MINUTOS.map((m) => <option key={m} value={m}>{m} minutos</option>)}
            </select>
          </label>
        </div>
        <div className="acoes">
          <button className="btn" disabled={!n}
            onClick={() => setProva({ fila: embaralhar(disponiveis).slice(0, n), inicio: Date.now(), fimEm: Date.now() + n * minutos * 60_000 })}>
            Começar prova: {n} questões em {n * minutos} minutos
          </button>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function EmProva({ fila, inicio, fimEm, onEntregar }) {
  const [idx, setIdx] = useState(0);
  const [respostas, setRespostas] = useState({});
  const [marcadas, setMarcadas] = useState(() => new Set());
  const [riscadas, setRiscadas] = useState({});
  const [confirmando, setConfirmando] = useState(false);
  const entregue = useRef(false);

  const q = fila[idx];
  const respondidas = Object.keys(respostas).length;
  const emBranco = fila.length - respondidas;

  useEffect(() => {
    definirBloqueio({ titulo: "Sair da prova?", mensagem: "A prova em andamento será perdida e não entra no seu histórico.", confirmar: "Sair da prova" });
    return () => definirBloqueio(null);
  }, []);

  const marcar = (id, l) => setRespostas((r) => {
    const n = { ...r };
    if (n[id] === l) delete n[id]; else n[id] = l;  // clicar de novo apaga a marcação
    return n;
  });
  const riscar = (id, l) => setRiscadas((r) => {
    const s = new Set(r[id]);
    s.has(l) ? s.delete(l) : s.add(l);
    return { ...r, [id]: s };
  });
  const alternarRevisar = (id) => setMarcadas((m) => { const n = new Set(m); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const ir = (i) => setIdx(Math.max(0, Math.min(fila.length - 1, i)));

  function entregar() {
    if (entregue.current) return;
    entregue.current = true;
    let acertos = 0;
    const porDisciplina = {};
    for (const x of fila) {
      const resp = respostas[x.id];
      const certo = resp === x.gabarito;
      if (resp) registrarResposta(x.id, certo, "prova");
      if (certo) acertos++;
      porDisciplina[x.disciplina] ??= [0, 0];
      porDisciplina[x.disciplina][1]++;
      if (certo) porDisciplina[x.disciplina][0]++;
    }
    const duracaoSeg = Math.round((Math.min(Date.now(), fimEm) - inicio) / 1000);
    registrarProva({ total: fila.length, acertos, emBranco, duracaoSeg, porDisciplina });
    onEntregar({ fila, respostas, acertos, emBranco, duracaoSeg, porDisciplina, esgotou: Date.now() >= fimEm });
  }

  useTeclas((e) => {
    if (confirmando) return;
    const k = e.key.toLowerCase();
    if (LETRAS.includes(k)) { e.preventDefault(); e.shiftKey ? riscar(q.id, k) : marcar(q.id, k); }
    else if (e.key === "ArrowRight") ir(idx + 1);
    else if (e.key === "ArrowLeft") ir(idx - 1);
    else if (k === "m") alternarRevisar(q.id);
    else if (k === "f") alternarFavorita(q.id);
  });

  return (
    <section className="prova">
      <div className="prova__barra">
        <Cronometro fimEm={fimEm} total={fimEm - inicio} onEsgotar={entregar} />
        <span className="prova__progresso">{respondidas} de {fila.length} marcadas</span>
        <button className="btn btn--p" onClick={() => setConfirmando(true)}>Entregar prova</button>
      </div>

      <div className="prova__grade">
        <div className="prova__questao">
          <Questao
            key={q.id}
            q={{ ...q, numero: idx + 1 }}
            escolha={respostas[q.id] ?? null}
            riscadas={riscadas[q.id]}
            onEscolher={(l) => marcar(q.id, l)}
            onRiscar={(l) => riscar(q.id, l)}
            extras={
              <button type="button" className={`icone-btn${marcadas.has(q.id) ? " ativo ativo--marca" : ""}`}
                aria-pressed={marcadas.has(q.id)} onClick={() => alternarRevisar(q.id)} title="Marcar para revisar (M)">
                <Icone nome="bandeira" /><span className="sr">Marcar para revisar</span>
              </button>
            }
          />
          <div className="prova__nav">
            <button className="btn btn--fantasma" disabled={idx === 0} onClick={() => ir(idx - 1)}>
              <Icone nome="voltar" /> Anterior
            </button>
            <p className="dica"><kbd>←</kbd> <kbd>→</kbd> navegam, <kbd>M</kbd> marca para revisar</p>
            <button className="btn btn--fantasma" disabled={idx === fila.length - 1} onClick={() => ir(idx + 1)}>
              Próxima <Icone nome="seta" />
            </button>
          </div>
        </div>

        <FolhaRespostas fila={fila} respostas={respostas} marcadas={marcadas} atual={idx}
          onIr={ir} onMarcar={(i, l) => { ir(i); marcar(fila[i].id, l); }} />
      </div>

      {confirmando && (
        <Modal titulo="Entregar a prova?" onFechar={() => setConfirmando(false)}>
          <p>
            {emBranco > 0
              ? `Você deixou ${emBranco} ${emBranco === 1 ? "questão" : "questões"} em branco.`
              : "Todas as questões estão marcadas."}
            {marcadas.size > 0 && ` ${marcadas.size} ${marcadas.size === 1 ? "está marcada" : "estão marcadas"} para revisar.`}
            {" "}Depois de entregar, não dá para alterar as respostas.
          </p>
          <div className="acoes">
            <button className="btn" onClick={entregar} autoFocus>Entregar prova</button>
            <button className="btn btn--fantasma" onClick={() => setConfirmando(false)}>Continuar resolvendo</button>
          </div>
        </Modal>
      )}
    </section>
  );
}

function Cronometro({ fimEm, total, onEsgotar }) {
  const [agora, setAgora] = useState(Date.now());
  const esgotar = useRef(onEsgotar);
  esgotar.current = onEsgotar;
  useEffect(() => {
    const t = setInterval(() => {
      const a = Date.now();
      setAgora(a);
      if (a >= fimEm) { clearInterval(t); esgotar.current(); }
    }, 1000);
    return () => clearInterval(t);
  }, [fimEm]);
  const resta = Math.max(0, fimEm - agora);
  const alerta = resta < Math.min(5 * 60_000, total * 0.1);
  return (
    <div className={`cronometro${alerta ? " cronometro--alerta" : ""}`} role="timer" aria-label="Tempo restante">
      <Icone nome="relogio" />
      <span className="cronometro__tempo">{formatarTempo(resta / 1000)}</span>
      <span className="cronometro__barra" aria-hidden="true"><span style={{ width: `${(resta / total) * 100}%` }} /></span>
    </div>
  );
}

/** Folha de respostas: clicar numa bolinha marca a resposta direto, como no cartão da prova. */
function FolhaRespostas({ fila, respostas, marcadas, atual, corrigida = false, onIr, onMarcar }) {
  const atualRef = useRef(null);
  useEffect(() => { atualRef.current?.scrollIntoView({ block: "nearest" }); }, [atual]);

  return (
    <aside className="folha" aria-label="Folha de respostas">
      <h2 className="folha__titulo">Folha de respostas</h2>
      <ol className="folha__linhas">
        {fila.map((x, i) => {
          const resp = respostas[x.id];
          return (
            <li key={x.id} ref={i === atual ? atualRef : null} className={`folha__linha${i === atual ? " folha__linha--atual" : ""}`}>
              <button type="button" className="folha__num" onClick={() => onIr(i)} aria-label={`Ir para a questão ${i + 1}`}>
                {String(i + 1).padStart(2, "0")}
              </button>
              {LETRAS.map((l) => {
                const estado = corrigida
                  ? (l === x.gabarito ? (resp === l ? "certa" : "gabarito") : resp === l ? "errada" : "vazia")
                  : (resp === l ? "marcada" : "vazia");
                return (
                  <button key={l} type="button" className="folha__bolha"
                    onClick={() => (corrigida ? onIr(i) : onMarcar(i, l))}
                    aria-label={`Questão ${i + 1}, alternativa ${l.toUpperCase()}${resp === l ? " (marcada)" : ""}`}>
                    <Bolha letra={l} estado={estado} pequena />
                  </button>
                );
              })}
              <span className="folha__flag">{marcadas?.has(x.id) && <Icone nome="bandeira" tamanho={14} />}</span>
            </li>
          );
        })}
      </ol>
    </aside>
  );
}

function Modal({ titulo, children, onFechar }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    d.showModal();
    return () => d.close();
  }, []);
  return (
    <dialog ref={ref} className="modal" onCancel={(e) => { e.preventDefault(); onFechar(); }} aria-labelledby="modal-titulo">
      <h2 id="modal-titulo">{titulo}</h2>
      {children}
    </dialog>
  );
}

// ---------------------------------------------------------------------------

function Resultado({ fila, respostas, acertos, emBranco, duracaoSeg, porDisciplina, esgotou, onNova }) {
  const [aberta, setAberta] = useState(null);
  const total = fila.length;
  return (
    <section className="resultado">
      <h1 className="titulo">Prova corrigida</h1>
      {esgotou && <p className="aviso">O tempo acabou e a prova foi entregue automaticamente.</p>}
      <p className="resultado__nota"><strong>{acertos}</strong> de {total}</p>
      <p className="resultado__sub">
        {pct(acertos, total)}% de acerto em {formatarTempo(duracaoSeg)}.
        {emBranco > 0 && ` ${emBranco} em branco.`} Os erros já entraram na sua revisão.
      </p>

      <div className="prova__grade prova__grade--resultado">
        <div>
          <table className="tabela">
            <thead><tr><th>Disciplina</th><th className="num">Acertos</th><th className="num">%</th></tr></thead>
            <tbody>
              {Object.entries(porDisciplina).map(([d, [a, t]]) => (
                <tr key={d}><td>{d}</td><td className="num">{a} de {t}</td><td className="num">{pct(a, t)}%</td></tr>
              ))}
            </tbody>
          </table>

          {aberta !== null ? (
            <div className="resultado__questao">
              <Questao q={{ ...fila[aberta], numero: aberta + 1 }} escolha={respostas[fila[aberta].id] ?? null} revelado />
              <div className="prova__nav">
                <button className="btn btn--fantasma" disabled={aberta === 0} onClick={() => setAberta(aberta - 1)}><Icone nome="voltar" /> Anterior</button>
                <button className="btn btn--fantasma" disabled={aberta === total - 1} onClick={() => setAberta(aberta + 1)}>Próxima <Icone nome="seta" /></button>
              </div>
            </div>
          ) : (
            <p className="dica">Clique numa linha da folha para ver a questão corrigida e o comentário.</p>
          )}

          <div className="acoes">
            <button className="btn" onClick={onNova}>Fazer outra prova</button>
            <button className="btn btn--fantasma" onClick={() => navegar("painel")}>Ver painel</button>
          </div>
        </div>

        <FolhaRespostas fila={fila} respostas={respostas} atual={aberta ?? -1} corrigida onIr={setAberta} />
      </div>
    </section>
  );
}
