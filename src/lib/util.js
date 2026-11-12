import { useEffect, useRef, useState } from "react";
import { confirmar } from "../components/Dialogo.jsx";

export function embaralhar(lista) {
  const a = [...lista];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const pct = (n, total) => (total ? Math.round((n / total) * 100) : 0);

export function formatarTempo(seg) {
  const s = Math.max(0, Math.round(seg));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  const mm = String(m).padStart(2, "0"), ss = String(r).padStart(2, "0");
  return h ? `${h}:${mm}:${ss}` : `${mm}:${ss}`;
}

/** Atalhos de teclado, ignorados enquanto o foco está num campo de texto. */
export function useTeclas(handler) {
  const ref = useRef(handler);
  ref.current = handler;
  useEffect(() => {
    const f = (e) => {
      const tag = e.target.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || e.target.isContentEditable) return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      ref.current(e);
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }, []);
}

// ---------- Bloqueio de navegação (ex.: prova em andamento) ----------
// bloqueio = { titulo, mensagem, confirmar } — a confirmação usa o diálogo do app, nunca o nativo.
let bloqueio = null;
export const definirBloqueio = (b) => { bloqueio = b; };
export const temBloqueio = () => !!bloqueio;
/** Resolve true se pode sair da tela atual (pergunta ao usuário quando há bloqueio). */
export async function podeSair() {
  if (!bloqueio) return true;
  const ok = await confirmar({ cancelar: "Ficar", perigo: true, ...bloqueio });
  if (ok) bloqueio = null;
  return ok;
}
/** onClick para links internos: segura a navegação até o usuário confirmar. */
export function guardarLink(e) {
  if (!bloqueio) return;
  e.preventDefault();
  const href = e.currentTarget.getAttribute("href");
  podeSair().then((ok) => { if (ok) location.hash = href.replace(/^#/, ""); });
}

// ---------- Rotas por hash: #/treinar?disciplina=X ----------
function lerHash() {
  const [caminho, busca] = location.hash.replace(/^#\/?/, "").split("?");
  return { rota: caminho || "painel", params: Object.fromEntries(new URLSearchParams(busca || "")) };
}

export function useRota() {
  const [r, setR] = useState(lerHash);
  useEffect(() => {
    const f = () => { setR(lerHash()); window.scrollTo(0, 0); };
    window.addEventListener("hashchange", f);
    return () => window.removeEventListener("hashchange", f);
  }, []);
  return r;
}

export async function navegar(rota, params = {}) {
  if (!(await podeSair())) return;
  const q = new URLSearchParams(params).toString();
  location.hash = `/${rota}${q ? "?" + q : ""}`;
}
