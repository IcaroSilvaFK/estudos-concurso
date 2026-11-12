// Gabi, a bolinha do gabarito: mascote da meta diária.
// Ela se enche de "tinta de caneta" conforme o progresso do dia e muda de humor.
import { useId } from "react";

/** Escolhe o humor da Gabi a partir do progresso do dia. */
export function humorDoDia(hoje, meta, hora = new Date().getHours()) {
  if (hoje >= meta) return "festa";
  if (hoje === 0) return hora >= 18 ? "preocupado" : "dormindo";
  return hoje / meta >= 0.5 ? "animado" : "feliz";
}

const FALAS = {
  dormindo: [
    "Zzz… me acorda com uma questão?",
    "Ainda estou vazia. Bora me encher de tinta?",
    "Cinco minutinhos e a gente começa, combinado?",
  ],
  feliz: [
    "Boa! Já tenho um pouco de tinta.",
    "Começou bem! Continua que eu vou enchendo.",
    "Cada questão é mais um pouquinho de tinta.",
  ],
  animado: [
    "Passamos da metade! Tô quase cheia!",
    "Falta pouco pra meta. Não para agora!",
    "Que ritmo! Mais algumas e a gente comemora.",
  ],
  festa: [
    "Meta batida! Tô cheinha de tinta!",
    "Arrasou! Hoje já valeu a pena.",
    "Meta cumprida! Quer fazer umas extras?",
  ],
  preocupado: [
    "Ei, o dia está acabando e eu continuo vazia…",
    "Só umas questões hoje para manter a sequência?",
    "Não deixa a sequência cair! Uma lição rapidinha?",
  ],
};

/** Fala do dia: muda conforme o humor e o dia, mas não fica trocando a cada renderização. */
export function falaDoDia(humor, faltam) {
  const lista = FALAS[humor];
  const base = lista[new Date().getDate() % lista.length];
  if (humor === "feliz" || humor === "animado") return `${base} Faltam ${faltam}.`;
  return base;
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
        ) : (
          <g className="mascote__bracos">
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

        <ellipse cx="48" cy="99" rx="7" ry="4" className="mascote__pe" />
        <ellipse cx="72" cy="99" rx="7" ry="4" className="mascote__pe" />
      </g>

      {humor === "dormindo" && (
        <g className="mascote__zzz" aria-hidden="true">
          <text x="92" y="28">z</text><text x="100" y="18">z</text><text x="108" y="9">z</text>
        </g>
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
