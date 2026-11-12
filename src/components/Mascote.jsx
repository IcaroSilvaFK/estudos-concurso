// Gabi, a bolinha do gabarito: mascote da meta diária.
// A TINTA mostra o volume (quanto da meta do dia já foi feito);
// a EMOÇÃO mostra o desempenho (o percentual de acerto).
import { useId } from "react";

/** Emoção pela taxa de acerto (0–1). Com a meta batida e bom desempenho, ela faz festa. */
export function humorPorAcerto(taxa, metaBatida = false) {
  if (taxa >= 0.6) return metaBatida ? "festa" : taxa >= 0.8 ? "animado" : "feliz";
  if (taxa >= 0.4) return "pensativo";
  return "triste";
}

/** Emoção do dia: dormindo/preocupada sem respostas; depois, conforme o acerto de hoje. */
export function humorDoDia(hoje, meta, acertos, hora = new Date().getHours()) {
  if (hoje === 0) return hora >= 18 ? "preocupado" : "dormindo";
  if (hoje < 3) return acertos === hoje ? "feliz" : acertos === 0 ? "pensativo" : "feliz"; // pouca amostra: sem drama
  return humorPorAcerto(acertos / hoje, hoje >= meta);
}

const FALAS = {
  dormindo: [
    "Zzz… me acorda com uma questão?",
    "Ainda estou vazia. Bora me encher de tinta?",
    "Cinco minutinhos e a gente começa, combinado?",
  ],
  preocupado: [
    "Ei, o dia está acabando e eu continuo vazia…",
    "Só umas questões hoje para manter a sequência?",
    "Não deixa a sequência cair! Uma lição rapidinha?",
  ],
  feliz: [
    "Mandando bem: {pct}% de acerto!",
    "Boa! {pct}% de acerto até agora.",
    "Tá indo bem, {pct}% de acerto!",
  ],
  animado: [
    "Que pontaria! {pct}% de acerto!",
    "Uau, {pct}% de acerto! Tô amando!",
    "{pct}% de acerto? Assim a vaga é sua!",
  ],
  festa: [
    "Meta batida com {pct}% de acerto! Tô cheinha!",
    "Arrasou! Meta cumprida e {pct}% de acerto!",
    "Dia perfeito: meta batida e {pct}% de acerto!",
  ],
  pensativo: [
    "{pct}% de acerto… dá pra subir! Olho nas pegadinhas.",
    "Hmm, {pct}% de acerto. Lê os comentários com calma.",
    "{pct}% até agora. Bora caprichar na próxima?",
  ],
  triste: [
    "Dia difícil: {pct}% de acerto. A revisão vai ajudar!",
    "Só {pct}% de acerto… errar faz parte. Revisa comigo?",
    "{pct}% de acerto. Respira, lê os comentários e tenta de novo!",
  ],
};

/** Fala do dia: depende do humor, do acerto e do dia (não fica trocando a cada renderização). */
export function falaDoDia(humor, { faltam = 0, taxa = 0, metaBatida = false } = {}) {
  const lista = FALAS[humor];
  let texto = lista[new Date().getDate() % lista.length].replace("{pct}", Math.round(taxa * 100));
  if ((humor === "feliz" || humor === "animado") && faltam > 0) texto += ` Faltam ${faltam}.`;
  if (metaBatida && (humor === "pensativo" || humor === "triste")) texto = `Meta batida! Mas ${texto.charAt(0).toLowerCase()}${texto.slice(1)}`;
  return texto;
}

export function Mascote({ progresso = 0, humor = "feliz", tamanho = 120, rotulo }) {
  const id = useId().replace(/:/g, "");
  const p = Math.max(0, Math.min(1, progresso));
  const nivelTinta = 96 - 82 * p;     // y do topo da tinta dentro do corpo (100% = totalmente cheia)
  const rostoClaro = p >= 0.55;         // o rosto fica branco quando a tinta o cobre
  const festa = humor === "festa";

  return (
    <svg className={`mascote mascote--${humor}`} width={tamanho} height={tamanho} viewBox="0 0 120 120"
      role="img" aria-label={rotulo ?? `Gabi, a mascote, está ${humor}`}>
      <defs>
        <clipPath id={`corpo-${id}`}><circle cx="60" cy="58" r="37" /></clipPath>
      </defs>

      <ellipse className="mascote__sombra" cx="60" cy="108" rx="26" ry="5" />

      <g className="mascote__corpo">
        {festa ? (
          <g className="mascote__bracos mascote__bracos--cima">
            <path d="M26 50 Q14 36 18 22" /><path d="M94 50 Q106 36 102 22" />
          </g>
        ) : humor === "pensativo" ? (
          <g className="mascote__bracos">
            <path d="M24 64 Q14 70 16 80" /><path d="M96 66 Q100 76 84 76" />
          </g>
        ) : (
          <g className={`mascote__bracos${humor === "triste" ? " mascote__bracos--caidos" : ""}`}>
            <path d="M24 64 Q14 70 16 80" /><path d="M96 64 Q106 70 104 80" />
          </g>
        )}

        <circle cx="60" cy="58" r="40" className="mascote__pele" />

        <g clipPath={`url(#corpo-${id})`}>
          <g className="mascote__tinta" style={{ transform: `translateY(${nivelTinta}px)` }}>
            <path className="mascote__onda" d="M-60 6 Q-45 0 -30 6 T0 6 T30 6 T60 6 T90 6 T120 6 T150 6 T180 6 V120 H-60 Z" />
          </g>
        </g>

        <circle cx="60" cy="58" r="40" className="mascote__contorno" />

        <g className={`mascote__rosto${rostoClaro ? " mascote__rosto--claro" : ""}`}>
          {humor === "dormindo" && (
            <>
              <path d="M40 54 q6 5 12 0" /><path d="M68 54 q6 5 12 0" />
              <path d="M54 70 q6 3 12 0" />
            </>
          )}
          {(humor === "feliz" || humor === "animado") && (
            <>
              <g className="mascote__olhos">
                <ellipse cx="46" cy="53" rx="4" ry="5.5" className="mascote__olho" />
                <ellipse cx="74" cy="53" rx="4" ry="5.5" className="mascote__olho" />
              </g>
              {humor === "animado"
                ? <path d="M48 66 q12 13 24 0 z" className="mascote__boca-aberta" />
                : <path d="M50 67 q10 8 20 0" />}
            </>
          )}
          {festa && (
            <>
              <path d="M40 55 l6 -6 l6 6" /><path d="M68 55 l6 -6 l6 6" />
              <path d="M46 64 q14 16 28 0 z" className="mascote__boca-aberta" />
            </>
          )}
          {humor === "pensativo" && (
            <>
              <path d="M40 43 q6 -4 12 -1" /><path d="M69 46 l11 0" />
              <g className="mascote__olhos mascote__olhos--lado">
                <ellipse cx="48" cy="53" rx="3.6" ry="5" className="mascote__olho" />
                <ellipse cx="76" cy="53" rx="3.6" ry="5" className="mascote__olho" />
              </g>
              <path d="M53 70 q4 -2 8 0 t8 0" />
            </>
          )}
          {humor === "triste" && (
            <>
              <path d="M39 49 l11 -4" /><path d="M81 49 l-11 -4" />
              <g className="mascote__olhos">
                <ellipse cx="46" cy="56" rx="3.6" ry="4.5" className="mascote__olho" />
                <ellipse cx="74" cy="56" rx="3.6" ry="4.5" className="mascote__olho" />
              </g>
              <path d="M50 73 q10 -8 20 0" />
            </>
          )}
          {humor === "preocupado" && (
            <>
              <path d="M39 44 l11 4" /><path d="M81 44 l-11 4" />
              <g className="mascote__olhos">
                <ellipse cx="46" cy="55" rx="3.6" ry="5" className="mascote__olho" />
                <ellipse cx="74" cy="55" rx="3.6" ry="5" className="mascote__olho" />
              </g>
              <path d="M52 72 q8 -6 16 0" />
            </>
          )}
          <circle cx="38" cy="64" r="4.5" className="mascote__bochecha" />
          <circle cx="82" cy="64" r="4.5" className="mascote__bochecha" />
        </g>

        {humor === "triste" && <path className="mascote__lagrima" d="M44 62 q-3 5 0 7.5 q3 -2.5 0 -7.5z" />}

        <ellipse cx="48" cy="99" rx="7" ry="4" className="mascote__pe" />
        <ellipse cx="72" cy="99" rx="7" ry="4" className="mascote__pe" />
      </g>

      {humor === "dormindo" && (
        <g className="mascote__zzz" aria-hidden="true">
          <text x="92" y="28">z</text><text x="100" y="18">z</text><text x="108" y="9">z</text>
        </g>
      )}
      {humor === "pensativo" && (
        <g className="mascote__duvida" aria-hidden="true"><text x="98" y="22">?</text></g>
      )}
      {festa && (
        <g className="mascote__brilhos" aria-hidden="true">
          <path d="M14 12 l2 5 5 2 -5 2 -2 5 -2 -5 -5 -2 5 -2z" />
          <path d="M104 40 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" />
          <path d="M8 74 l1.5 4 4 1.5 -4 1.5 -1.5 4 -1.5 -4 -4 -1.5 4 -1.5z" />
        </g>
      )}
    </svg>
  );
}
