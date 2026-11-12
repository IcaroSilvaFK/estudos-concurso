import { useMemo, useState } from "react";
import { useBanco } from "../lib/banco.jsx";
import { CAIXAS, DIA, INTERVALOS, pendentes, useProgresso } from "../lib/progresso.js";
import { embaralhar, navegar } from "../lib/util.js";
import { SessaoPratica } from "../components/SessaoPratica.jsx";

function quando(ms) {
  const dias = Math.ceil(ms / DIA);
  if (dias <= 1) return "amanhã";
  return `em ${dias} dias`;
}

export default function Revisao() {
  const { questoes } = useBanco();
  const prog = useProgresso();
  const [qtdNovas, setQtdNovas] = useState(5);
  const [sessao, setSessao] = useState(null);

  const agora = Date.now();
  const pend = useMemo(() => pendentes(prog, questoes, agora), [prog, questoes]); // eslint-disable-line react-hooks/exhaustive-deps
  const novas = useMemo(() => questoes.filter((q) => !prog.questoes[q.id]?.tentativas.length), [prog, questoes]);
  const caixas = useMemo(() => {
    const c = Array(CAIXAS + 1).fill(0);
    for (const q of questoes) { const r = prog.questoes[q.id]; if (r?.tentativas.length) c[r.caixa]++; }
    return c;
  }, [prog, questoes]);
  const proxima = useMemo(() => {
    const futuras = questoes.map((q) => prog.questoes[q.id]).filter((r) => r?.tentativas.length && r.proxima > agora);
    if (!futuras.length) return null;
    const menor = Math.min(...futuras.map((r) => r.proxima));
    const mesmoDia = futuras.filter((r) => r.proxima - menor < DIA).length;
    return { em: menor - agora, qtd: mesmoDia };
  }, [prog, questoes]); // eslint-disable-line react-hooks/exhaustive-deps

  if (sessao) return <SessaoPratica fila={sessao} modo="revisao" titulo="Revisão" reinserirErros onSair={() => setSessao(null)} />;

  const nNovas = Math.min(qtdNovas, novas.length);
  const total = pend.length + nNovas;
  const maiorCaixa = Math.max(1, ...caixas.slice(1));

  return (
    <section>
      <h1 className="titulo">Revisão</h1>
      <p className="lead">
        Cada questão fica numa caixa. Acertou, ela sobe uma caixa e demora mais para voltar. Errou, volta para a caixa 1 e reaparece hoje.
      </p>

      <ol className="caixas">
        {caixas.slice(1).map((qtd, i) => (
          <li className="caixa" key={i} style={{ "--firmeza": `${35 + i * 16}%` }}>
            <span className="caixa__nome">Caixa {i + 1}</span>
            <strong className="caixa__qtd">{qtd}</strong>
            <span className="caixa__int">{["Ainda frágeis", "Pegando o jeito", "Firmando", "Quase lá", "Dominadas"][i]}</span>
            <span className="caixa__medidor" aria-hidden="true"><span style={{ width: `${(qtd / maiorCaixa) * 100}%` }} /></span>
            <span className="caixa__prox">revisa a cada {INTERVALOS[i + 1]} {INTERVALOS[i + 1] === 1 ? "dia" : "dias"}</span>
          </li>
        ))}
      </ol>

      <div className="config">
        <p className="revisao__status">
          {pend.length
            ? <><strong>{pend.length}</strong> {pend.length === 1 ? "questão vence" : "questões vencem"} hoje.</>
            : "Nenhuma revisão vencida agora."}
          {proxima && !pend.length && ` A próxima vence ${quando(proxima.em)} (${proxima.qtd} ${proxima.qtd === 1 ? "questão" : "questões"}).`}
        </p>

        {novas.length > 0 && (
          <label className="campo campo--linha">
            <span>Incluir questões nunca respondidas</span>
            <select value={qtdNovas} onChange={(e) => setQtdNovas(Number(e.target.value))}>
              {[0, 5, 10, 20].map((v) => <option key={v} value={v}>{v === 0 ? "Nenhuma" : `${Math.min(v, novas.length)} novas`}</option>)}
            </select>
          </label>
        )}

        {total > 0 ? (
          <div className="acoes">
            <button className="btn" onClick={() => setSessao([...pend, ...embaralhar(novas).slice(0, nNovas)])}>
              Revisar {total} {total === 1 ? "questão" : "questões"}
            </button>
          </div>
        ) : (
          <p className="vazio">
            Tudo em dia.{" "}
            <button className="link" onClick={() => navegar("treinar")}>Treinar questões avulsas</button>
          </p>
        )}
      </div>
    </section>
  );
}
