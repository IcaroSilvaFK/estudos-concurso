import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { join } from "node:path";
import { apiMiddleware } from "./scripts/api.mjs";
import { build, DATA_DIR } from "./scripts/build.mjs";

// API de questões (leitura/gravação em data/*.json) + recarga automática quando um JSON é editado à mão.
const apiQuestoes = {
  name: "api-questoes",
  configureServer(server) {
    server.middlewares.use(apiMiddleware());

    // data/ fica fora do grafo de módulos: observamos manualmente e avisamos o app por evento próprio,
    // para recarregar as questões sem recarregar a página (e sem perder uma prova em andamento).
    server.watcher.add(join(DATA_DIR, "*.json"));
    let timer;
    const aoMudar = (arquivo) => {
      if (!arquivo.startsWith(DATA_DIR) || !arquivo.endsWith(".json")) return;
      clearTimeout(timer);
      timer = setTimeout(async () => {
        let erro = null;
        try { await build(); } catch (e) { erro = e.message; }
        server.config.logger.info(erro ? `[questões] erro de validação:\n${erro}` : "[questões] data/ alterado: documento regenerado");
        server.ws.send({ type: "custom", event: "questoes:atualizadas", data: { erro } });
      }, 150);
    };
    server.watcher.on("change", aoMudar);
    server.watcher.on("add", aoMudar);
  },
  configurePreviewServer(server) { server.middlewares.use(apiMiddleware()); },
};

export default defineConfig({
  // caminhos relativos: o site funciona em qualquer subpasta (ex.: usuario.github.io/estudos-concurso/)
  base: "./",
  plugins: [react(), apiQuestoes],
  server: { host: "127.0.0.1", port: 3000 },
  preview: { host: "127.0.0.1", port: 3000 },
});
