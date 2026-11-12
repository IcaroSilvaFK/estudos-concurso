// API de leitura e gravação das questões, usada como middleware do Vite (vite.config.js).
// Rotas: GET /api/banco · POST /api/questoes · PUT /api/questoes/:id · DELETE /api/questoes/:id
import { build, lerArquivos, gravarArquivo, validarQuestao, LETRAS } from "./build.mjs";

// Serializa as gravações para que duas edições simultâneas não se sobrescrevam.
let fila = Promise.resolve();
const exclusivo = (fn) => {
  const p = fila.then(fn);
  fila = p.catch(() => {});
  return p;
};

class ErroHttp extends Error {
  constructor(status, msg, detalhes) { super(msg); this.status = status; this.detalhes = detalhes; }
}

function normalizar(q) {
  const alternativas = {};
  for (const l of LETRAS) alternativas[l] = String(q?.alternativas?.[l] ?? "").trim();
  return {
    id: q.id,
    assunto: String(q?.assunto ?? "").trim(),
    origem: q?.origem,
    enunciado: String(q?.enunciado ?? "").replace(/\r\n/g, "\n").trim(),
    alternativas,
    gabarito: q?.gabarito,
    comentario: String(q?.comentario ?? "").trim(),
  };
}

function proximoId(arq) {
  const nums = arq.questoes.map((q) => Number(q.id.split("-").at(-1)) || 0);
  return `${arq.prefixo}-${String(Math.max(0, ...nums) + 1).padStart(3, "0")}`;
}

/** Aplica a mutação, grava e regenera; se o build falhar, restaura os arquivos tocados. */
function mutar(fn) {
  return exclusivo(async () => {
    const arquivos = await lerArquivos();
    const originais = new Map(arquivos.map((a) => [a.arquivo, structuredClone(a)]));
    const { tocados, resultado } = fn(arquivos);
    for (const a of tocados) await gravarArquivo(a);
    try {
      await build();
    } catch (e) {
      for (const a of tocados) await gravarArquivo(originais.get(a.arquivo));
      await build().catch(() => {});
      throw new ErroHttp(400, "O build falhou; nada foi alterado.", e.message.split("\n").slice(1));
    }
    return resultado;
  });
}

function localizar(arquivos, id) {
  for (const a of arquivos) {
    const i = a.questoes.findIndex((q) => q.id === id);
    if (i >= 0) return { arq: a, i };
  }
  throw new ErroHttp(404, `Questão '${id}' não encontrada.`);
}

function arquivoPorNome(arquivos, nome) {
  const a = arquivos.find((x) => x.arquivo === nome);
  if (!a) throw new ErroHttp(400, `Disciplina inválida: '${nome}'.`);
  return a;
}

function checar(q) {
  const erros = validarQuestao(q);
  if (erros.length) throw new ErroHttp(400, "Questão inválida.", erros);
}

async function lerCorpo(req) {
  let tam = 0;
  const partes = [];
  for await (const c of req) {
    tam += c.length;
    if (tam > 1_000_000) throw new ErroHttp(413, "Corpo da requisição muito grande.");
    partes.push(c);
  }
  try { return JSON.parse(Buffer.concat(partes).toString("utf8") || "{}"); }
  catch { throw new ErroHttp(400, "JSON inválido."); }
}

async function rotear(req, url) {
  if (url.pathname === "/api/banco" && req.method === "GET") {
    return (await lerArquivos()).map(({ arquivo, disciplina, prefixo, questoes }) => ({ arquivo, disciplina, prefixo, questoes }));
  }
  const m = url.pathname.match(/^\/api\/questoes(?:\/([\w-]+))?$/);
  if (!m) throw new ErroHttp(404, "Rota não encontrada.");
  const id = m[1];

  if (req.method === "POST" && !id) {
    const { arquivo, questao } = await lerCorpo(req);
    return mutar((arquivos) => {
      const arq = arquivoPorNome(arquivos, arquivo);
      const q = normalizar({ ...questao, id: proximoId(arq) });
      checar(q);
      arq.questoes.push(q);
      return { tocados: [arq], resultado: { arquivo: arq.arquivo, questao: q } };
    });
  }

  if (req.method === "PUT" && id) {
    const { arquivo, questao } = await lerCorpo(req);
    return mutar((arquivos) => {
      const { arq, i } = localizar(arquivos, id);
      const destino = arquivo ? arquivoPorNome(arquivos, arquivo) : arq;
      if (destino === arq) {
        const q = normalizar({ ...questao, id });
        checar(q);
        arq.questoes[i] = q;
        return { tocados: [arq], resultado: { arquivo: arq.arquivo, questao: q } };
      }
      // mudança de disciplina: move para o outro arquivo com um id novo
      const q = normalizar({ ...questao, id: proximoId(destino) });
      checar(q);
      arq.questoes.splice(i, 1);
      destino.questoes.push(q);
      return { tocados: [arq, destino], resultado: { arquivo: destino.arquivo, questao: q } };
    });
  }

  if (req.method === "DELETE" && id) {
    return mutar((arquivos) => {
      const { arq, i } = localizar(arquivos, id);
      const [removida] = arq.questoes.splice(i, 1);
      return { tocados: [arq], resultado: { arquivo: arq.arquivo, questao: removida } };
    });
  }

  throw new ErroHttp(405, "Método não permitido.");
}

/** Middleware connect/Vite: atende /api/* e repassa o resto. */
export function apiMiddleware() {
  build().catch((e) => console.error(e.message)); // garante documento atualizado ao subir
  return async (req, res, next) => {
    if (!req.url.startsWith("/api/")) return next();
    const url = new URL(req.url, "http://localhost");
    try {
      const dados = await rotear(req, url);
      res.writeHead(200, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify(dados));
    } catch (e) {
      const status = e.status ?? 500;
      if (status === 500) console.error(e);
      res.writeHead(status, { "content-type": "application/json; charset=utf-8" });
      res.end(JSON.stringify({ erro: e.message, detalhes: e.detalhes ?? [] }));
    }
  };
}
