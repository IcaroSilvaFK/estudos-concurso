import { useMemo } from "react";
import { BancoProvider, MODO_ESTATICO, useBanco } from "./lib/banco.jsx";
import { pendentes, respondidasHoje, useProgresso } from "./lib/progresso.js";
import { calcular } from "./lib/estatisticas.js";
import { guardarLink, useRota } from "./lib/util.js";
import { DialogoConfirmacao } from "./components/Dialogo.jsx";
import { Icone } from "./components/Questao.jsx";
import { Anel } from "./components/Anel.jsx";
import Painel from "./pages/Painel.jsx";
import Treinar from "./pages/Treinar.jsx";
import Prova from "./pages/Prova.jsx";
import Revisao from "./pages/Revisao.jsx";
import Editor from "./pages/Editor.jsx";

const SECOES = [
  { id: "painel", nome: "Painel", Pagina: Painel },
  { id: "treinar", nome: "Treinar", Pagina: Treinar },
  { id: "prova", nome: "Prova", Pagina: Prova },
  { id: "revisao", nome: "Revisão", Pagina: Revisao },
  // o Editor grava em data/ pela API local; no site estático (GitHub Pages) ele não existe
  ...(MODO_ESTATICO ? [] : [{ id: "editor", nome: "Editor", Pagina: Editor }]),
];

export default function App() {
  return (
    <BancoProvider>
      <Shell />
    </BancoProvider>
  );
}

function MetaDoDia() {
  const { questoes } = useBanco();
  const prog = useProgresso();
  const hoje = respondidasHoje(prog);
  const meta = prog.config.metaDiaria;
  const { sequencia, xp, nivel, xpNoNivel, xpDoNivel } = useMemo(() => calcular(prog, questoes), [prog, questoes]);
  const batida = hoje >= meta;
  return (
    <a href="#/painel" className={`meta${batida ? " meta--batida" : ""}`} onClick={guardarLink}>
      <span className="meta__linha">
        <span className="meta__chip meta__chip--chama" title="Dias seguidos estudando"><Icone nome="chama" tamanho={16} /> {sequencia}</span>
        <span className="meta__chip meta__chip--xp" title="Pontos de experiência"><Icone nome="raio" tamanho={16} /> {xp} XP</span>
      </span>
      <span className="meta__nivel">
        <span>Nível {nivel}</span>
        <span className="meta__barra" aria-hidden="true"><span style={{ width: `${(xpNoNivel / xpDoNivel) * 100}%` }} /></span>
      </span>
      <span className="meta__linha meta__linha--meta">
        <Anel valor={hoje / meta} tamanho={40} espessura={5} cor={batida ? "var(--certo)" : "var(--caneta)"}
          rotulo={`${hoje} de ${meta} questões hoje`}>
          {batida ? <Icone nome="certo" tamanho={16} /> : null}
        </Anel>
        <span className="meta__texto">
          <strong>{batida ? "Meta do dia batida!" : "Meta do dia"}</strong>
          <span>{hoje} de {meta} questões</span>
        </span>
      </span>
    </a>
  );
}

function Shell() {
  const { rota, params } = useRota();
  const banco = useBanco();
  const prog = useProgresso();
  const nPend = useMemo(() => pendentes(prog, banco.questoes).length, [prog, banco.questoes]);
  const secao = SECOES.find((s) => s.id === rota) ?? SECOES[0];

  return (
    <div className="app">
      <a className="pular" href="#conteudo" onClick={(e) => { e.preventDefault(); document.getElementById("conteudo").focus(); }}>
        Pular para o conteúdo
      </a>
      <header className="lateral">
        <a className="marca" href="#/painel" onClick={guardarLink}>
          <span className="marca__selo" aria-hidden="true"><span /><span /><span /></span>
          <span>
            <span className="marca__nome">Caderno TRT-8</span>
            <span className="marca__sub">{banco.questoes.length} questões, banca FCC</span>
          </span>
        </a>
        <nav aria-label="Seções">
          <ul className="menu">
            {SECOES.map((s) => (
              <li key={s.id}>
                <a href={`#/${s.id}`} aria-current={secao.id === s.id ? "page" : undefined}
                  onClick={(e) => { if (secao.id !== s.id) guardarLink(e); }}>
                  <Icone nome={s.id} tamanho={20} />
                  <span>{s.nome}</span>
                  {s.id === "revisao" && nPend > 0 && (
                    <span className="contador" aria-label={`${nPend} revisões vencidas`}>{nPend}</span>
                  )}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        {banco.carregado && <MetaDoDia />}
      </header>

      <main id="conteudo" className="conteudo" tabIndex={-1}>
        {banco.erro ? (
          <div className="msg msg--erro">
            Não foi possível carregar as questões ({banco.erro}). Confira se o app foi iniciado com <code>npm start</code>.
          </div>
        ) : !banco.carregado ? (
          <p className="dica">Carregando questões…</p>
        ) : (
          <div className="pagina" key={rota + JSON.stringify(params)}>
            <secao.Pagina params={params} />
          </div>
        )}
      </main>
      <DialogoConfirmacao />
    </div>
  );
}
