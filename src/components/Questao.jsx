import { LETRAS } from "../lib/banco.jsx";
import { alternarFavorita, useProgresso, registroDe } from "../lib/progresso.js";
import { disciplinaInfo } from "../lib/disciplinas.js";

/** Bolinha do cartão-resposta. estado: vazia | marcada | certa | errada | gabarito */
export function Bolha({ letra, estado = "vazia", pequena = false, ...resto }) {
  return (
    <span className={`bolha bolha--${estado}${pequena ? " bolha--p" : ""}`} aria-hidden="true" {...resto}>
      {letra ? letra.toUpperCase() : ""}
    </span>
  );
}

export function Icone({ nome, tamanho = 18 }) {
  const p = {
    estrela: <path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" />,
    riscar: <><path d="M7.5 19l4.5-13 4.5 13M9.2 14.5h5.6" opacity=".55" /><path d="M4 11.5h16" /></>,
    bandeira: <><path d="M5 21V4" /><path d="M5 4h11l-2 4 2 4H5" /></>,
    certo: <path d="M5 12.5l4.5 4.5L19 7.5" />,
    errado: <path d="M6 6l12 12M18 6L6 18" />,
    relogio: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></>,
    seta: <path d="M9 5l7 7-7 7" />,
    voltar: <path d="M15 5l-7 7 7 7" />,
    // navegação
    painel: <><rect x="3.5" y="3.5" width="7" height="9" rx="2" /><rect x="13.5" y="3.5" width="7" height="5" rx="2" /><rect x="13.5" y="11.5" width="7" height="9" rx="2" /><rect x="3.5" y="15.5" width="7" height="5" rx="2" /></>,
    treinar: <><path d="M15.5 4.5l4 4L9 19H5v-4z" /><path d="M13 7l4 4" /></>,
    prova: <><rect x="5" y="4" width="14" height="17" rx="2" /><path d="M9 4V3h6v1" /><path d="M8.5 10h7M8.5 14h7M8.5 18h4" /></>,
    revisao: <><path d="M4.5 12a7.5 7.5 0 0 1 13-5.1L20 9" /><path d="M20 4v5h-5" /><path d="M19.5 12a7.5 7.5 0 0 1-13 5.1L4 15" /><path d="M4 20v-5h5" /></>,
    editor: <><path d="M4 20h16" /><path d="M14.5 5.5l3 3L9 17H6v-3z" /></>,
    chama: <path d="M12 21c-3.9 0-6.5-2.6-6.5-6 0-3.2 2.3-5.2 3.6-7.4.4 1.5 1.3 2.6 2.4 3.1C11.6 7.4 13 5 15 3c.3 3 3.5 5.6 3.5 10.5 0 4.4-2.8 7.5-6.5 7.5z" />,
    trofeu: <><path d="M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4.5v1.5A3.5 3.5 0 0 0 8 11M17 6h2.5v1.5A3.5 3.5 0 0 1 16 11" /><path d="M12 14v3.5M8.5 20.5h7M9.5 17.5h5v3h-5z" /></>,
    raio: <path d="M13 3L5 13.5h6L10 21l8-10.5h-6z" />,
    lupa: <><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4.5 4.5" /></>,
    mais: <path d="M12 5v14M5 12h14" />,
    olho: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
    lixeira: <><path d="M4.5 7h15M10 11v6M14 11v6" /><path d="M6.5 7l1 13h9l1-13M9.5 7V4.5h5V7" /></>,
    brilho: <path d="M12 3.5l1.8 5.2 5.2 1.8-5.2 1.8L12 17.5l-1.8-5.2L5 10.5l5.2-1.8zM18.5 15.5l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" />,
    // disciplinas
    livro: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z" /><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5" /></>,
    calc: <><rect x="5" y="3" width="14" height="18" rx="2.5" /><path d="M8.5 7h7" /><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01M15.5 18h.01" strokeWidth="2.4" /></>,
    balanca: <><path d="M12 4v16M7 20h10M5 7h14" /><path d="M5 7l-2.5 6a3 3 0 0 0 5 0zM19 7l-2.5 6a3 3 0 0 0 5 0z" /></>,
    mundo: <><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.5 2.6 3.6 5.4 3.6 8.5s-1.1 5.9-3.6 8.5c-2.5-2.6-3.6-5.4-3.6-8.5S9.5 6.1 12 3.5z" /></>,
    acesso: <><circle cx="12" cy="4.5" r="1.6" /><path d="M5 8.5l7 1.5 7-1.5M12 10v4.5M12 14.5l-3 6M12 14.5l3 6" /></>,
    monitor: <><rect x="3" y="4.5" width="18" height="12" rx="2" /><path d="M9 20.5h6M12 16.5v4" /></>,
  }[nome];
  return (
    <svg className="icone" width={tamanho} height={tamanho} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{p}</svg>
  );
}

export function BotaoFavorita({ id }) {
  const prog = useProgresso();
  const fav = registroDe(prog, id).favorita;
  return (
    <button type="button" className={`icone-btn${fav ? " ativo" : ""}`} aria-pressed={fav}
      onClick={() => alternarFavorita(id)} title={fav ? "Remover dos favoritos (F)" : "Favoritar (F)"}>
      <Icone nome="estrela" />
      <span className="sr">{fav ? "Remover dos favoritos" : "Favoritar"}</span>
    </button>
  );
}

/**
 * Uma questão com alternativas clicáveis.
 * - Clique escolhe; botão direito ou o ícone ao lado risca/desrisca (técnica de eliminação).
 * - revelado: mostra gabarito, o que foi marcado e o comentário.
 */
export function Questao({ q, escolha, revelado = false, riscadas = new Set(), onEscolher, onRiscar, extras, favoritar = true, correcao = true }) {
  const estadoDe = (l) => {
    if (revelado) {
      if (l === q.gabarito) return l === escolha ? "certa" : "gabarito";
      if (l === escolha) return "errada";
      return "vazia";
    }
    return l === escolha ? "marcada" : "vazia";
  };

  return (
    <article className="questao">
      <header className="questao__meta">
        <span className="questao__num">Questão {q.numero}</span>
        <EtiquetaDisciplina nome={q.disciplina} />
        <span className={`selo selo--${q.origem}`}>{q.origem === "fcc" ? "Estilo FCC" : "Inédita"}</span>
        <span className="questao__acoes">
          {extras}
          {favoritar && <BotaoFavorita id={q.id} />}
        </span>
      </header>
      <p className="questao__assunto">{q.assunto}</p>
      <p className="enunciado">{q.enunciado}</p>

      <ol className="alternativas">
        {LETRAS.map((l) => {
          const riscada = riscadas.has(l) && !revelado;
          const estado = estadoDe(l);
          return (
            <li key={l} className={`alt alt--${estado}${riscada ? " alt--riscada" : ""}`}>
              <button
                type="button"
                className="alt__corpo"
                disabled={revelado || !onEscolher}
                aria-pressed={escolha === l}
                onClick={() => onEscolher?.(l)}
                onContextMenu={(e) => { if (onRiscar && !revelado) { e.preventDefault(); onRiscar(l); } }}
              >
                <Bolha letra={l} estado={estado} />
                <span className="alt__texto">{q.alternativas[l]}</span>
              </button>
              {onRiscar && !revelado && (
                <button type="button" className="icone-btn alt__riscar" aria-pressed={riscada}
                  onClick={() => onRiscar(l)} title={`${riscada ? "Desriscar" : "Riscar"} ${l.toUpperCase()} (Shift + ${l.toUpperCase()})`}>
                  <Icone nome="riscar" tamanho={16} />
                  <span className="sr">{riscada ? "Desriscar" : "Riscar"} alternativa {l.toUpperCase()}</span>
                </button>
              )}
            </li>
          );
        })}
      </ol>

      {revelado && correcao && <Correcao q={q} escolha={escolha} />}
    </article>
  );
}

export function EtiquetaDisciplina({ nome }) {
  const d = disciplinaInfo(nome);
  return (
    <span className="etiqueta-disc" style={{ "--cor": d.cor }} title={nome}>
      <Icone nome={d.icone} tamanho={14} /> {d.curto}
    </span>
  );
}

const ELOGIOS = ["Mandou bem!", "Isso aí!", "Certíssimo!", "Acertou em cheio!", "Boa, essa é sua!"];
const ANIMO = ["Quase!", "Essa pega muita gente.", "Bom ponto para revisar.", "Faz parte do treino."];
export const escolherFrase = (lista, id) => lista[[...String(id)].reduce((s, c) => s + c.charCodeAt(0), 0) % lista.length];
export const fraseAcerto = (id) => escolherFrase(ELOGIOS, id);
export const fraseErro = (id) => escolherFrase(ANIMO, id);

export function Correcao({ q, escolha }) {
  const certo = escolha === q.gabarito;
  const titulo = !escolha
    ? `Em branco. Resposta: ${q.gabarito.toUpperCase()}.`
    : certo
      ? escolherFrase(ELOGIOS, q.id)
      : `${escolherFrase(ANIMO, q.id)} Você marcou ${escolha.toUpperCase()}; a resposta é ${q.gabarito.toUpperCase()}.`;
  return (
    <div className={`correcao correcao--${certo ? "certo" : "errado"}`} role="status">
      <p className="correcao__titulo"><Icone nome={certo ? "certo" : "errado"} /> {titulo}</p>
      <p className="correcao__texto">{q.comentario}</p>
    </div>
  );
}
