import { useMemo, useState } from "react";
import { useBanco } from "../lib/banco.jsx";
import { useProgresso } from "../lib/progresso.js";
import { embaralhar } from "../lib/util.js";
import { FILTRO_PADRAO, Filtros, Quantidade, filtrar } from "../components/Filtros.jsx";
import { SessaoPratica } from "../components/SessaoPratica.jsx";

const VAZIO = {
  novas: "Você já respondeu todas as questões deste filtro. Escolha “Todas” para refazê-las.",
  erradas: "Nenhum erro pendente neste filtro. Bom sinal.",
  favoritas: "Você ainda não favoritou questões. Use a estrela no canto de cada questão.",
  todas: "Nenhuma questão com esses filtros. Tente liberar alguma disciplina ou assunto.",
};

export default function Treinar({ params }) {
  const { questoes } = useBanco();
  const prog = useProgresso();
  const [filtro, setFiltro] = useState(() => ({
    ...FILTRO_PADRAO,
    disciplinas: params.disciplina ? [params.disciplina] : [],
    assunto: params.assunto ?? "",
    situacao: params.situacao ?? "todas",
  }));
  const [qtd, setQtd] = useState(10);
  const [aleatorio, setAleatorio] = useState(true);
  const [sessao, setSessao] = useState(null);

  const disponiveis = useMemo(() => filtrar(questoes, prog, filtro), [questoes, prog, filtro]);
  const n = Math.min(qtd, disponiveis.length);

  if (sessao) return <SessaoPratica fila={sessao} modo="treino" titulo="Treino" onSair={() => setSessao(null)} />;

  return (
    <section>
      <h1 className="titulo">Treinar</h1>
      <p className="lead">Cada resposta é corrigida na hora, com o comentário do gabarito. Erros entram automaticamente na sua revisão.</p>

      <div className="config">
        <Filtros questoes={questoes} valor={filtro} onChange={setFiltro} />
        <div className="config__fim">
          <Quantidade max={disponiveis.length} valor={qtd} onChange={setQtd} />
          <label className="check">
            <input type="checkbox" checked={aleatorio} onChange={(e) => setAleatorio(e.target.checked)} />
            Ordem aleatória
          </label>
        </div>
        {disponiveis.length ? (
          <div className="acoes">
            <button className="btn" onClick={() => setSessao((aleatorio ? embaralhar(disponiveis) : disponiveis).slice(0, n))}>
              Começar treino com {n} {n === 1 ? "questão" : "questões"}
            </button>
          </div>
        ) : (
          <p className="vazio">{VAZIO[filtro.situacao]}</p>
        )}
      </div>
    </section>
  );
}
