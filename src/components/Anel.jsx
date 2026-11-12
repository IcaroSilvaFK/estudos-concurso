/** Anel de progresso (0–1). O conteúdo central vai em children. */
export function Anel({ valor, tamanho = 120, espessura = 10, cor = "var(--caneta)", children, rotulo }) {
  const r = (tamanho - espessura) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, valor || 0));
  return (
    <div className="anel" style={{ width: tamanho, height: tamanho }} role="img" aria-label={rotulo}>
      <svg width={tamanho} height={tamanho} viewBox={`0 0 ${tamanho} ${tamanho}`} aria-hidden="true">
        <circle cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke="var(--trilho)" strokeWidth={espessura} />
        <circle
          className="anel__valor"
          cx={tamanho / 2} cy={tamanho / 2} r={r} fill="none" stroke={cor} strokeWidth={espessura}
          strokeLinecap="round" strokeDasharray={c} strokeDashoffset={c * (1 - v)}
          transform={`rotate(-90 ${tamanho / 2} ${tamanho / 2})`}
        />
      </svg>
      <div className="anel__centro">{children}</div>
    </div>
  );
}
