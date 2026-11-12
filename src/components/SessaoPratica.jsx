import { useEffect, useRef, useState } from "react";
import { LETRAS } from "../lib/banco.jsx";
import { alternarFavorita, registrarResposta } from "../lib/progresso.js";
import { XP_ACERTO, XP_ERRO, xpDe } from "../lib/estatisticas.js";
import { pct, useTeclas } from "../lib/util.js";
import { Bolha, Icone, Questao, fraseAcerto, fraseErro } from "./Questao.jsx";
import { Mascote } from "./Mascote.jsx";
import { Confete } from "./Efeitos.jsx";

/** Fileira de bolinhas: uma por questão, preenchida conforme o resultado. */
export function Trilha({ total, atual, resultados, onIr }) {
  return (
    <ol className="trilha" aria-label="Andamento da sessão">
      {Array.from({ length: total }, (_, i) => {
        const r = resultados[i];
        const estado = r === true ? "certa" : r === false ? "errada" : i === atual ? "marcada" : "vazia";
        const desc = r === true ? "acertou" : r === false ? "errou" : i === atual ? "atual" : "não respondida";
        return (
          <li key={i} className={i === atual ? "trilha__atual" : undefined}>
            {onIr ? (
              <button type="button" onClick={() => onIr(i)} aria-label={`Questão ${i + 1}: ${desc}`}>
                <Bolha estado={estado} pequena />
              </button>
            ) : (
              <span title={`Questão ${i + 1}: ${desc}`}><Bolha estado={estado} pequena /></span>
            )}
          </li>
        );
      })}
    </ol>
  );
}

/**
 * Sessão no formato "lição": escolhe a alternativa, confirma em "Responder" e
 * recebe o retorno numa faixa inferior. Usada por Treinar e Revisão.
 */
export function SessaoPratica({ fila: inicial, modo, titulo, reinserirErros = false, onSair }) {
  const [fila, setFila] = useState(inicial);
  const [idx, setIdx] = useState(0);
  const [escolha, setEscolha] = useState(null);
  const [confirmado, setConfirmado] = useState(false);
  const [riscadas, setRiscadas] = useState(() => new Set());
  const [resultados, setResultados] = useState([]);
  const [combo, setCombo] = useState(0);
  const [melhorCombo, setMelhorCombo] = useState(0);
  const [fim, setFim] = useState(false);
  const [xpPop, setXpPop] = useState(null);
  const reinseridas = useRef(new Set());
  const botaoRef = useRef(null);

  const q = fila[idx];
  const certo = confirmado && escolha === q?.gabarito;

  useEffect(() => { if (confirmado) botaoRef.current?.focus(); }, [confirmado]);

  function escolher(l) {
    if (confirmado || fim) return;
    setEscolha((atual) => (atual === l ? null : l));
    setRiscadas((s) => { if (!s.has(l)) return s; const n = new Set(s); n.delete(l); return n; });
  }

  function confirmar() {
    if (confirmado || !escolha) return;
    const ok = escolha === q.gabarito;
    setConfirmado(true);
    setResultados((r) => { const n = [...r]; n[idx] = ok; return n; });
    registrarResposta(q.id, ok, modo);
    setXpPop({ k: Date.now(), valor: ok ? XP_ACERTO : XP_ERRO, ok });
    const novoCombo = ok ? combo + 1 : 0;
    setCombo(novoCombo);
    setMelhorCombo((m) => Math.max(m, novoCombo));
    // na revisão, quem errou volta para o fim da fila uma vez, para fixar ainda na mesma sessão
    if (!ok && reinserirErros && !reinseridas.current.has(q.id)) {
      reinseridas.current.add(q.id);
      setFila((f) => [...f, q]);
    }
  }

  function riscar(l) {
    if (confirmado) return;
    if (escolha === l) setEscolha(null);
    setRiscadas((s) => { const n = new Set(s); n.has(l) ? n.delete(l) : n.add(l); return n; });
  }

  function avancar() {
    if (!confirmado) return;
    if (idx + 1 < fila.length) {
      setIdx(idx + 1); setEscolha(null); setConfirmado(false); setRiscadas(new Set());
    } else setFim(true);
  }

  function reiniciar(nova) {
    reinseridas.current = new Set();
    setFila(nova); setIdx(0); setEscolha(null); setConfirmado(false); setRiscadas(new Set());
    setResultados([]); setCombo(0); setMelhorCombo(0); setFim(false);
  }

  useTeclas((e) => {
    if (fim || !q) return;
    const k = e.key.toLowerCase();
    if (LETRAS.includes(k) && !confirmado) { e.preventDefault(); e.shiftKey ? riscar(k) : escolher(k); }
    else if (e.key === "Enter" || (e.key === "ArrowRight" && confirmado)) {
      e.preventDefault(); // evita que o Enter "clique" na alternativa focada e desfaça a escolha
      confirmado ? avancar() : confirmar();
    }
    else if (k === "f") alternarFavorita(q.id);
  });

  if (fim) {
    return <Conclusao titulo={titulo} fila={fila} resultados={resultados} melhorCombo={melhorCombo}
      onRefazer={reiniciar} onSair={onSair} />;
  }

  const progresso = (idx + (confirmado ? 1 : 0)) / fila.length;

  return (
    <section className="licao">
      <div className="licao__topo">
        <button className="icone-btn" onClick={() => setFim(true)} title="Encerrar sessão" aria-label="Encerrar sessão">
          <Icone nome="errado" tamanho={22} />
        </button>
        <div className="licao__barra" role="progressbar" aria-valuemin={0} aria-valuemax={fila.length}
          aria-valuenow={idx + (confirmado ? 1 : 0)} aria-label={`${titulo}: questão ${idx + 1} de ${fila.length}`}>
          <span style={{ width: `${progresso * 100}%` }} />
        </div>
        <span className={`licao__combo${combo >= 2 ? " licao__combo--ativo" : ""}`} title="Acertos seguidos">
          <Icone nome="chama" tamanho={20} /> {combo}
        </span>
      </div>

      <p className="licao__contagem">{titulo} · questão {idx + 1} de {fila.length}</p>

      <Questao key={`${idx}-${q.id}`} q={q} escolha={escolha} revelado={confirmado} riscadas={riscadas}
        onEscolher={escolher} onRiscar={riscar} correcao={false} />

      <div className={`licao__rodape${confirmado ? (certo ? " licao__rodape--certo" : " licao__rodape--errado") : ""}`}>
        <div className="licao__rodape-in">
          {confirmado ? (
            <div className="licao__retorno" role="status">
              <span className="licao__selo"><Icone nome={certo ? "certo" : "errado"} tamanho={26} /></span>
              <div>
                <p className="licao__frase">
                  {certo ? fraseAcerto(q.id) : `${fraseErro(q.id)} Resposta certa: ${q.gabarito.toUpperCase()}.`}
                  {certo && combo >= 2 && <span className="licao__xp"> {combo} seguidas!</span>}
                </p>
                <p className="licao__coment">{q.comentario}</p>
              </div>
            </div>
          ) : (
            <p className="dica licao__dica">
              Escolha uma alternativa (<kbd>A</kbd>–<kbd>E</kbd>). Para riscar, use o botão direito ou <kbd>Shift</kbd> + letra.
            </p>
          )}
          {confirmado && xpPop && (
            <span key={xpPop.k} className={`xp-pop${xpPop.ok ? "" : " xp-pop--fraco"}`} aria-hidden="true">+{xpPop.valor} XP</span>
          )}
          <button ref={botaoRef} className={`btn btn--g${confirmado ? (certo ? " btn--certo" : " btn--errado") : ""}`}
            disabled={!confirmado && !escolha} onClick={confirmado ? avancar : confirmar}>
            {confirmado ? (idx + 1 < fila.length ? "Continuar" : "Ver resultado") : "Responder"}
          </button>
        </div>
      </div>
    </section>
  );
}

function Conclusao({ titulo, fila, resultados, melhorCombo, onRefazer, onSair }) {
  const respondidas = resultados.filter((r) => r !== undefined).length;
  const acertos = resultados.filter((r) => r === true).length;
  const erradas = [...new Map(fila.filter((_, i) => resultados[i] === false).map((x) => [x.id, x])).values()];
  const taxa = respondidas ? acertos / respondidas : 0;
  const xp = xpDe(acertos, respondidas - acertos);
  const frase = !respondidas ? "Sessão encerrada"
    : taxa >= 0.85 ? "Arrasou!"
    : taxa >= 0.7 ? "Muito bem!"
    : taxa >= 0.5 ? "Bom treino!"
    : "Valeu o esforço!";
  const sub = !respondidas ? "Nenhuma questão respondida desta vez."
    : taxa >= 0.85 ? "Você está dominando esse conteúdo."
    : taxa >= 0.7 ? "Mais um pouco e fica afiado."
    : taxa >= 0.5 ? "Os erros já viraram revisão para fixar."
    : "Começo é assim mesmo. A revisão vai trazer esses pontos de volta.";

  return (
    <section className="conclusao">
      {taxa >= 0.7 && <Confete />}
      <div className="conclusao__selo">
        <Mascote progresso={taxa} humor={taxa >= 0.7 ? "festa" : taxa >= 0.5 ? "animado" : "feliz"} tamanho={160}
          rotulo={`Gabi reagindo ao resultado: ${pct(acertos, respondidas)}% de acerto`} />
      </div>
      <p className="destaque__ola">{titulo} concluído</p>
      <h1 className="conclusao__titulo">{frase}</h1>
      <p className="conclusao__sub">{sub}</p>

      <ul className="conclusao__stats">
        <li className="stat stat--xp"><span>XP ganho</span><strong>+{xp}</strong></li>
        <li className="stat stat--acerto"><span>Acerto</span><strong>{pct(acertos, respondidas)}%</strong></li>
        <li className="stat stat--combo"><span>Melhor sequência</span><strong>{melhorCombo}</strong></li>
      </ul>

      <Trilha total={respondidas} atual={-1} resultados={resultados} />
      <p className="dica">{XP_ACERTO} XP por acerto e {XP_ERRO} XP por tentativa: errar também conta como treino.</p>

      <div className="acoes acoes--centro">
        {erradas.length > 0 && (
          <button className="btn btn--g" onClick={() => onRefazer(erradas)}>
            Refazer {erradas.length === 1 ? "a que errei" : `as ${erradas.length} que errei`}
          </button>
        )}
        <button className={`btn btn--g${erradas.length ? " btn--fantasma" : ""}`} onClick={onSair}>Continuar</button>
      </div>
    </section>
  );
}
