// Animações reutilizáveis: confete, contagem animada de números e a comemoração da meta do dia.
import { useEffect, useMemo, useRef, useState } from "react";
import { respondidasHoje, useProgresso } from "../lib/progresso.js";
import { Mascote } from "./Mascote.jsx";

export const movimentoReduzido = () =>
  typeof matchMedia === "function" && matchMedia("(prefers-reduced-motion: reduce)").matches;

const CORES = ["var(--caneta)", "var(--certo-vivo)", "var(--ouro)", "var(--chama)", "var(--d-dh)", "var(--d-pcd)"];

/** Chuva de confete que some sozinha. Não aparece com "reduzir movimento" ligado. */
export function Confete({ quantidade = 70, duracao = 2600, onFim }) {
  const [vivo, setVivo] = useState(true);
  const pedacos = useMemo(() => Array.from({ length: quantidade }, (_, i) => ({
    i,
    esquerda: Math.random() * 100,
    atraso: Math.random() * 350,
    dur: 1600 + Math.random() * 1200,
    giro: (Math.random() * 720 - 360).toFixed(0),
    deriva: (Math.random() * 160 - 80).toFixed(0),
    cor: CORES[i % CORES.length],
    forma: i % 3,
  })), [quantidade]);

  useEffect(() => {
    const t = setTimeout(() => { setVivo(false); onFim?.(); }, duracao + 400);
    return () => clearTimeout(t);
  }, [duracao, onFim]);

  if (!vivo || movimentoReduzido()) return null;
  return (
    <div className="confete" aria-hidden="true">
      {pedacos.map((p) => (
        <span key={p.i} className={`confete__p confete__p--${p.forma}`}
          style={{
            left: `${p.esquerda}%`, background: p.cor,
            animationDelay: `${p.atraso}ms`, animationDuration: `${p.dur}ms`,
            "--giro": `${p.giro}deg`, "--deriva": `${p.deriva}px`,
          }} />
      ))}
    </div>
  );
}

/** Número que "conta" até o valor ao mudar (ou aparece direto com movimento reduzido). */
export function useContador(alvo, duracao = 800) {
  const [valor, setValor] = useState(movimentoReduzido() ? alvo : 0);
  const atual = useRef(valor);
  useEffect(() => {
    if (movimentoReduzido()) { atual.current = alvo; setValor(alvo); return; }
    const inicio = performance.now(), de = atual.current;
    let raf;
    const passo = (t) => {
      const k = Math.min(1, (t - inicio) / duracao);
      const suave = 1 - Math.pow(1 - k, 3);
      const v = de + (alvo - de) * suave;
      atual.current = v;
      setValor(v);
      if (k < 1) raf = requestAnimationFrame(passo);
    };
    raf = requestAnimationFrame(passo);
    return () => cancelAnimationFrame(raf);
  }, [alvo, duracao]);
  return Math.round(valor);
}

/**
 * Observa o progresso e comemora no momento em que a meta do dia é cruzada,
 * em qualquer tela (treino, revisão ou prova). Não dispara ao abrir o app com a meta já batida.
 */
export function CelebracaoMeta() {
  const prog = useProgresso();
  const hoje = respondidasHoje(prog);
  const meta = prog.config.metaDiaria;
  const anterior = useRef(hoje);
  const [aberta, setAberta] = useState(false);

  useEffect(() => {
    if (anterior.current < meta && hoje >= meta) setAberta(true);
    anterior.current = hoje;
  }, [hoje, meta]);

  useEffect(() => {
    if (!aberta) return;
    const t = setTimeout(() => setAberta(false), 4200);
    return () => clearTimeout(t);
  }, [aberta]);

  if (!aberta) return null;
  return (
    <>
      <Confete quantidade={90} />
      <div className="celebra" role="status" onClick={() => setAberta(false)}>
        <Mascote progresso={1} humor="festa" tamanho={96} rotulo="Gabi comemorando a meta batida" />
        <div>
          <strong>Meta do dia batida!</strong>
          <span>{meta} questões hoje. A Gabi está cheinha de tinta.</span>
        </div>
      </div>
    </>
  );
}
