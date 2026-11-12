// Carrega as questões pela API local (scripts/api.mjs) e as expõe via contexto.
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

export const LETRAS = ["a", "b", "c", "d", "e"];

export async function api(metodo, url, corpo) {
  const r = await fetch(url, {
    method: metodo,
    headers: corpo ? { "content-type": "application/json" } : {},
    body: corpo ? JSON.stringify(corpo) : undefined,
  });
  const dados = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(dados.erro || `Erro ${r.status}`), { detalhes: dados.detalhes || [] });
  return dados;
}

const Ctx = createContext(null);

/**
 * Site estático (build de produção, ex.: GitHub Pages): não há servidor, então as questões
 * vão embutidas no bundle a partir de data/*.json. Em desenvolvimento (npm start) usa a API,
 * que permite editar e recarregar.
 */
export const MODO_ESTATICO = !import.meta.env.DEV;
const EMBUTIDOS = MODO_ESTATICO ? import.meta.glob("../../data/*.json", { eager: true, import: "default" }) : {};
const arquivosEmbutidos = () =>
  Object.entries(EMBUTIDOS)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([caminho, json]) => ({ arquivo: caminho.split("/").pop(), ...json }));

export function BancoProvider({ children }) {
  const [arquivos, setArquivos] = useState(() => (MODO_ESTATICO ? arquivosEmbutidos() : null));
  const [erro, setErro] = useState(null);

  const recarregar = useCallback(async () => {
    if (MODO_ESTATICO) return;
    try {
      setArquivos(await api("GET", "/api/banco"));
      setErro(null);
    } catch (e) {
      setErro(e.message);
    }
  }, []);

  useEffect(() => { recarregar(); }, [recarregar]);

  // JSON editado à mão em data/: o servidor avisa e as questões recarregam sem F5
  useEffect(() => {
    if (!import.meta.hot) return;
    const aoAtualizar = ({ erro }) => { if (!erro) recarregar(); else console.warn("[questões]", erro); };
    import.meta.hot.on("questoes:atualizadas", aoAtualizar);
    return () => import.meta.hot.off?.("questoes:atualizadas", aoAtualizar);
  }, [recarregar]);

  const valor = useMemo(() => {
    const questoes = [];
    for (const a of arquivos ?? []) {
      for (const q of a.questoes) questoes.push({ ...q, disciplina: a.disciplina, arquivo: a.arquivo, numero: questoes.length + 1 });
    }
    return {
      carregado: arquivos !== null,
      erro,
      arquivos: arquivos ?? [],
      questoes,
      porId: new Map(questoes.map((q) => [q.id, q])),
      disciplinas: (arquivos ?? []).map((a) => a.disciplina),
      recarregar,
    };
  }, [arquivos, erro, recarregar]);

  return <Ctx.Provider value={valor}>{children}</Ctx.Provider>;
}

export const useBanco = () => useContext(Ctx);
