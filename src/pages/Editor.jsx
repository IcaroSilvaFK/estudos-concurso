import { useEffect, useMemo, useState } from "react";
import { LETRAS, api, useBanco } from "../lib/banco.jsx";
import { disciplinaInfo } from "../lib/disciplinas.js";
import { definirBloqueio } from "../lib/util.js";
import { Bolha, EtiquetaDisciplina, Icone, Questao } from "../components/Questao.jsx";
import { confirmar } from "../components/Dialogo.jsx";

const NOVA = { assunto: "", origem: "fcc", enunciado: "", alternativas: { a: "", b: "", c: "", d: "", e: "" }, gabarito: "", comentario: "" };
const norm = (s) => String(s).normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
const formDe = (q) => ({
  arquivo: q.arquivo, assunto: q.assunto, origem: q.origem, enunciado: q.enunciado,
  alternativas: { ...q.alternativas }, gabarito: q.gabarito, comentario: q.comentario,
});

/** Card de questão usado na grade e na lista lateral. */
function ItemQuestao({ q, ativo, compacto, onAbrir }) {
  const d = disciplinaInfo(q.disciplina);
  return (
    <button type="button" className={`item-q${compacto ? " item-q--compacto" : ""}${ativo ? " ativo" : ""}`}
      style={{ "--cor": d.cor }} onClick={() => onAbrir(q)} aria-current={ativo || undefined}>
      <span className="item-q__topo">
        {compacto ? <span className="item-q__id">{q.id}</span> : <EtiquetaDisciplina nome={q.disciplina} />}
        <span className={`selo selo--${q.origem}`}>{q.origem === "fcc" ? "FCC" : "Inédita"}</span>
        {!compacto && <span className="item-q__id">{q.id}</span>}
      </span>
      <strong className="item-q__assunto">{q.assunto}</strong>
      <span className="item-q__enun">{q.enunciado}</span>
      {!compacto && (
        <span className="item-q__gab">Gabarito <Bolha letra={q.gabarito} estado="certa" pequena /></span>
      )}
    </button>
  );
}

export default function Editor() {
  const { arquivos, questoes, recarregar } = useBanco();
  const [busca, setBusca] = useState("");
  const [fDisc, setFDisc] = useState("");
  const [atual, setAtual] = useState(null);       // { id|null, numero }
  const [form, setForm] = useState(null);
  const [original, setOriginal] = useState(null);
  const [aba, setAba] = useState("editar");
  const [msg, setMsg] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const [teste, setTeste] = useState(null);

  const sujo = !!form && JSON.stringify(form) !== JSON.stringify(original);

  useEffect(() => {
    definirBloqueio(sujo ? { titulo: "Descartar alterações?", mensagem: "A questão em edição tem alterações que ainda não foram salvas.", confirmar: "Descartar" } : null);
    return () => definirBloqueio(null);
  }, [sujo]);

  const lista = useMemo(() => {
    const t = norm(busca.trim());
    return questoes.filter((q) =>
      (!fDisc || q.arquivo === fDisc) &&
      (!t || norm([q.id, q.assunto, q.enunciado, q.comentario, ...Object.values(q.alternativas)].join(" ")).includes(t)));
  }, [questoes, busca, fDisc]);

  const assuntos = useMemo(() => {
    if (!form) return [];
    return [...new Set(questoes.filter((q) => q.arquivo === form.arquivo).map((q) => q.assunto))].sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [questoes, form?.arquivo]); // eslint-disable-line react-hooks/exhaustive-deps

  async function podeTrocar() {
    return !sujo || confirmar({ titulo: "Descartar alterações?", mensagem: "A questão em edição tem alterações que ainda não foram salvas.", confirmar: "Descartar", perigo: true });
  }

  async function abrir(q, arquivo) {
    if (!(await podeTrocar())) return;
    const f = q ? formDe(q) : { arquivo, ...structuredClone(NOVA) };
    setAtual({ id: q?.id ?? null, numero: q?.numero });
    setForm(f); setOriginal(f); setMsg(null); setTeste(null); setAba("editar");
    window.scrollTo({ top: 0 });
  }

  async function fechar() {
    if (!(await podeTrocar())) return;
    setAtual(null); setForm(null); setOriginal(null); setMsg(null);
  }

  const set = (campo, valor) => { setForm((f) => ({ ...f, [campo]: valor })); setTeste(null); };
  const setAlt = (l, valor) => { setForm((f) => ({ ...f, alternativas: { ...f.alternativas, [l]: valor } })); setTeste(null); };

  async function salvar() {
    if (!form.gabarito) { setAba("editar"); return setMsg({ tipo: "erro", texto: "Clique na letra da alternativa correta para marcar o gabarito." }); }
    setSalvando(true);
    const { arquivo, ...questao } = form;
    try {
      const r = atual.id
        ? await api("PUT", `/api/questoes/${atual.id}`, { arquivo, questao })
        : await api("POST", "/api/questoes", { arquivo, questao });
      await recarregar();
      const f = { arquivo: r.arquivo, ...r.questao };
      delete f.id;
      setAtual((a) => ({ ...a, id: r.questao.id }));
      setForm(f); setOriginal(f);
      setMsg({ tipo: "ok", texto: `Salvo como ${r.questao.id}. O app e o documento já estão atualizados.` });
    } catch (err) {
      setMsg({ tipo: "erro", texto: err.message, detalhes: err.detalhes });
    } finally {
      setSalvando(false);
    }
  }

  async function excluir() {
    const ok = await confirmar({
      titulo: `Excluir a questão ${atual.id}?`,
      mensagem: "Ela sai do banco, do simulador e do documento. Não dá para desfazer pelo editor.",
      confirmar: "Excluir questão", perigo: true,
    });
    if (!ok) return;
    try {
      await api("DELETE", `/api/questoes/${atual.id}`);
      await recarregar();
      setAtual(null); setForm(null); setOriginal(null);
    } catch (err) {
      setMsg({ tipo: "erro", texto: err.message, detalhes: err.detalhes });
    }
  }

  // Ctrl/Cmd + S salva
  useEffect(() => {
    const f = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "s" && form) { e.preventDefault(); if (sujo && !salvando) salvar(); }
    };
    window.addEventListener("keydown", f);
    return () => window.removeEventListener("keydown", f);
  }); // eslint-disable-line react-hooks/exhaustive-deps

  const contagem = (arq) => questoes.filter((q) => q.arquivo === arq).length;

  return (
    <section className={`editor${form ? " editor--editando" : ""}`}>
      <header className="editor__cab">
        <div>
          <h1 className="titulo">Editor de questões</h1>
          <p className="lead">{questoes.length} questões em {arquivos.length} disciplinas. Ao salvar, o app e o documento com gabarito são atualizados na hora.</p>
        </div>
        <button className="btn btn--g" onClick={() => abrir(null, fDisc || arquivos[0]?.arquivo)}>
          <Icone nome="mais" tamanho={20} /> Nova questão
        </button>
      </header>

      <div className="editor__ferramentas">
        <label className="busca">
          <Icone nome="lupa" />
          <input type="search" value={busca} onChange={(e) => setBusca(e.target.value)}
            placeholder="Buscar por texto, assunto ou id (ex.: crase, pt-004)" aria-label="Buscar questões" />
        </label>
        <div className="filtro-disc" role="radiogroup" aria-label="Filtrar por disciplina">
          <button type="button" role="radio" aria-checked={!fDisc} className="chip-disc" onClick={() => setFDisc("")}>
            Todas <span>{questoes.length}</span>
          </button>
          {arquivos.map((a) => {
            const d = disciplinaInfo(a.disciplina);
            return (
              <button key={a.arquivo} type="button" role="radio" aria-checked={fDisc === a.arquivo} className="chip-disc"
                style={{ "--cor": d.cor }} onClick={() => setFDisc(a.arquivo)}>
                <Icone nome={d.icone} tamanho={16} /> {d.curto} <span>{contagem(a.arquivo)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {!form ? (
        lista.length ? (
          <ul className="grade-q">
            {lista.map((q) => <li key={q.id}><ItemQuestao q={q} onAbrir={(x) => abrir(x)} /></li>)}
          </ul>
        ) : (
          <div className="vazio-grande">
            <Icone nome="lupa" tamanho={36} />
            <p>Nenhuma questão encontrada para “{busca}”.</p>
            <button className="btn btn--fantasma" onClick={() => { setBusca(""); setFDisc(""); }}>Limpar filtros</button>
          </div>
        )
      ) : (
        <div className="editor__trabalho">
          <aside className="editor__lista" aria-label="Questões">
            <p className="dica">{lista.length} questões</p>
            <ul>
              {lista.map((q) => <li key={q.id}><ItemQuestao q={q} compacto ativo={atual?.id === q.id} onAbrir={(x) => abrir(x)} /></li>)}
            </ul>
          </aside>

          <div className="editor__painel">
            <div className="editor__painel-topo">
              <button className="icone-btn" onClick={fechar} title="Voltar à lista" aria-label="Voltar à lista">
                <Icone nome="voltar" tamanho={22} />
              </button>
              <div className="editor__painel-titulo">
                <strong>{atual.id ? `Questão ${atual.id}` : "Nova questão"}</strong>
                {sujo ? <span className="aviso-pill">Alterações não salvas</span> : atual.id && <span className="ok-pill">Tudo salvo</span>}
              </div>
              <div className="segmentado" role="tablist" aria-label="Modo">
                <button role="tab" aria-selected={aba === "editar"} aria-checked={aba === "editar"} onClick={() => setAba("editar")}>
                  <Icone nome="editor" tamanho={16} /> Editar
                </button>
                <button role="tab" aria-selected={aba === "previa"} aria-checked={aba === "previa"} onClick={() => setAba("previa")}>
                  <Icone nome="olho" tamanho={16} /> Pré-visualizar
                </button>
              </div>
            </div>

            {aba === "editar" ? (
              <form className="editor__form" onSubmit={(e) => { e.preventDefault(); salvar(); }}>
                <div className="editor__linha">
                  <label className="campo">
                    <span>Disciplina</span>
                    <select value={form.arquivo} onChange={(e) => set("arquivo", e.target.value)}>
                      {arquivos.map((a) => <option key={a.arquivo} value={a.arquivo}>{a.disciplina}</option>)}
                    </select>
                  </label>
                  <div className="campo">
                    <span>Origem</span>
                    <div className="segmentado" role="radiogroup" aria-label="Origem">
                      <button type="button" role="radio" aria-checked={form.origem === "fcc"} onClick={() => set("origem", "fcc")}>Estilo FCC</button>
                      <button type="button" role="radio" aria-checked={form.origem === "inedita"} onClick={() => set("origem", "inedita")}>Inédita</button>
                    </div>
                  </div>
                </div>

                <label className="campo">
                  <span>Assunto</span>
                  <input type="text" list="assuntos-sugeridos" value={form.assunto} onChange={(e) => set("assunto", e.target.value)}
                    placeholder="Ex.: Concordância verbal" />
                  <datalist id="assuntos-sugeridos">{assuntos.map((a) => <option key={a} value={a} />)}</datalist>
                </label>

                <label className="campo">
                  <span>Enunciado</span>
                  <textarea rows={5} value={form.enunciado} onChange={(e) => set("enunciado", e.target.value)}
                    placeholder="Escreva o enunciado. Use Enter para separar texto-base, itens I, II, III etc." />
                </label>

                <fieldset className="campo">
                  <legend>Alternativas <span className="legend__nota">clique na letra para marcar a correta</span></legend>
                  <div className="editor__alts">
                    {LETRAS.map((l) => {
                      const correta = form.gabarito === l;
                      return (
                        <div key={l} className={`editor__alt${correta ? " editor__alt--certa" : ""}`}>
                          <button type="button" className="editor__letra" aria-pressed={correta}
                            onClick={() => set("gabarito", l)} title={`Marcar ${l.toUpperCase()} como correta`}>
                            <Bolha letra={l} estado={correta ? "certa" : "vazia"} />
                            <span className="sr">Marcar alternativa {l.toUpperCase()} como correta</span>
                          </button>
                          <textarea rows={1} value={form.alternativas[l]} onChange={(e) => setAlt(l, e.target.value)}
                            aria-label={`Texto da alternativa ${l.toUpperCase()}`} placeholder={`Alternativa ${l.toUpperCase()}`} />
                          {correta && <span className="editor__correta"><Icone nome="certo" tamanho={16} /> Correta</span>}
                        </div>
                      );
                    })}
                  </div>
                </fieldset>

                <label className="campo">
                  <span>Comentário do gabarito</span>
                  <textarea rows={4} value={form.comentario} onChange={(e) => set("comentario", e.target.value)}
                    placeholder="Explique por que a correta está certa e, se útil, o erro das outras." />
                </label>
              </form>
            ) : (
              <div className="editor__previa">
                <p className="dica">Assim a questão aparece no Treinar. Responda para testar a correção e o comentário.</p>
                <Questao
                  favoritar={false}
                  q={{ ...form, id: atual.id ?? "nova", numero: atual.numero ?? "nova", disciplina: arquivos.find((a) => a.arquivo === form.arquivo)?.disciplina ?? "" }}
                  escolha={teste}
                  revelado={teste !== null && !!form.gabarito}
                  onEscolher={setTeste}
                />
                {teste !== null && <button className="link" onClick={() => setTeste(null)}>Responder de novo</button>}
              </div>
            )}

            {msg && (
              <div className={`msg msg--${msg.tipo}`} role="status">
                {msg.texto}
                {msg.detalhes?.length > 0 && <ul>{msg.detalhes.map((d) => <li key={d}>{d}</li>)}</ul>}
              </div>
            )}

            <div className="editor__barra">
              <button className="btn" onClick={salvar} disabled={salvando || !sujo}>
                {salvando ? "Salvando…" : atual.id ? "Salvar alterações" : "Criar questão"}
              </button>
              <button className="btn btn--fantasma" disabled={!sujo} onClick={() => { setForm(original); setTeste(null); setMsg(null); }}>
                Descartar alterações
              </button>
              <span className="dica editor__atalho"><kbd>Ctrl</kbd> + <kbd>S</kbd> salva</span>
              {atual.id && (
                <button className="btn btn--perigo editor__excluir" onClick={excluir}>
                  <Icone nome="lixeira" tamanho={18} /> Excluir
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
