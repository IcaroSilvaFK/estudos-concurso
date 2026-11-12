// Diálogo de confirmação do próprio app (substitui window.confirm/alert/prompt).
// Uso: `if (await confirmar({ titulo, mensagem, confirmar: "Excluir", perigo: true })) { ... }`
import { useEffect, useRef, useSyncExternalStore } from "react";

// Estado único na janela: se o módulo for recarregado (HMR), quem pede a confirmação e
// quem desenha o diálogo continuam enxergando o mesmo estado.
const store = (globalThis.__dialogoConfirmacao ??= { atual: null, ouvintes: new Set() });
const emitir = () => store.ouvintes.forEach((f) => f());

export function confirmar({ titulo, mensagem, confirmar = "Confirmar", cancelar = "Cancelar", perigo = false }) {
  return new Promise((resolve) => {
    store.atual?.resolver(false); // só um diálogo por vez
    store.atual = {
      titulo, mensagem, confirmar, cancelar, perigo,
      resolver: (v) => { store.atual = null; emitir(); resolve(v); },
    };
    emitir();
  });
}

/** Renderizado uma única vez no App. */
export function DialogoConfirmacao() {
  const d = useSyncExternalStore((f) => { store.ouvintes.add(f); return () => store.ouvintes.delete(f); }, () => store.atual);
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (d && !el.open) el.showModal();
    if (!d && el.open) el.close();
  }, [d]);

  return (
    <dialog ref={ref} className="modal" aria-labelledby="dialogo-titulo"
      onCancel={(e) => { e.preventDefault(); d?.resolver(false); }}>
      {d && (
        <>
          <h2 id="dialogo-titulo">{d.titulo}</h2>
          {d.mensagem && <p>{d.mensagem}</p>}
          <div className="acoes">
            <button className={`btn${d.perigo ? " btn--errado" : ""}`} onClick={() => d.resolver(true)} autoFocus>{d.confirmar}</button>
            <button className="btn btn--fantasma" onClick={() => d.resolver(false)}>{d.cancelar}</button>
          </div>
        </>
      )}
    </dialog>
  );
}
