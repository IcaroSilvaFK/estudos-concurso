# Caderno TRT-8 — estudos para o concurso (banca FCC)

App de estudo com **826 questões** de múltipla escolha (a–e) sobre o conteúdo programático do concurso do TRT da 8ª Região. São 660 no estilo FCC (80%) e 166 inéditas (20%), com gabarito comentado.

**Site:** https://icarosilvafk.github.io/estudos-concurso/

| Seção | O que faz |
|---|---|
| **Painel** | Meta diária, XP e nível, sequência de dias, calendário de frequência, gráficos, progresso por disciplina e assuntos em que você mais erra |
| **Treinar** | Lição com correção imediata: escolhe a alternativa, confirma e lê o comentário. Filtra por disciplina, assunto, origem e situação |
| **Prova** | Simulado cronometrado com folha de respostas clicável, marcação para revisar e correção só na entrega |
| **Revisão** | Repetição espaçada em 5 caixas: errou, a questão volta hoje; acertou, ela demora mais para voltar |
| **Editor** | Cria, edita e exclui questões, com pré-visualização. Só existe na versão local |

O progresso fica salvo no navegador de cada pessoa. Em **Painel → Seus dados** dá para baixar e importar um backup.

### Atalhos

| Tecla | Ação |
|---|---|
| `A`–`E` | Escolher/marcar alternativa |
| `Enter` | Responder / continuar |
| `Shift` + letra (ou botão direito) | Riscar alternativa |
| `←` `→` / `M` | Navegar / marcar para revisar (prova) |
| `F` | Favoritar |
| `Ctrl` + `S` | Salvar (editor) |

## Questões por disciplina

| Disciplina | Questões |
|---|---|
| Língua Portuguesa | 150 |
| Matemática e Raciocínio Lógico | 150 |
| Noções de Informática | 140 |
| Noções de Legislação (Código de Ética, Regimento Interno do TRT-8, Res. CNJ 400/351/492, Res. CSJT 360/368, Estatuto de Roma, Carta da ONU) | 141 |
| Noções de Direitos Humanos | 125 |
| Direitos das Pessoas com Deficiência (incl. Res. CSJT 386/2024 e Convenção da ONU) | 120 |

O arquivo [BANCO-DE-QUESTOES.md](BANCO-DE-QUESTOES.md) traz todas as questões em formato de caderno, com **gabarito ao final**.

> **Atenção:** a Resolução TRT8 nº 067/2021, citada no edital, foi **revogada** pela Resolução TRT8 nº 065/2025, que tem o mesmo título. As questões seguem o texto vigente.

## Rodando localmente (com editor)

```bash
npm install
npm start     # http://localhost:3000
```

Localmente, o app usa uma API embutida no servidor do Vite que lê e grava `data/*.json`. Salvar pelo Editor, ou editar o JSON à mão, atualiza o app e o `BANCO-DE-QUESTOES.md` na hora.

## Publicação

Cada push na `main` dispara o workflow [.github/workflows/deploy.yml](.github/workflows/deploy.yml), que valida as questões, gera o build estático e publica no GitHub Pages. No site publicado, as questões vão embutidas no build e o Editor não aparece.

## Estrutura

| Caminho | Para quê |
|---|---|
| `data/*.json` | Fonte das questões, uma disciplina por arquivo. Cada questão tem `id` fixo (ex.: `pt-001`) |
| `src/` | Front-end (React + Vite) |
| `scripts/api.mjs` | API local de leitura e gravação (só no `npm start`) |
| `scripts/build.mjs` | Valida as questões e gera o documento (`npm run questoes`) |

## Sobre a origem das questões

- **Estilo FCC:** reconstruídas a partir de temas, formatos e pegadinhas recorrentes da banca. **Não são cópias literais** de provas e não citam ano nem órgão. Para as provas originais, use os cadernos oficiais da FCC.
- **Inéditas:** criadas para cobrir pontos do edital.
- As questões de legislação foram escritas a partir do texto oficial das normas, e o comentário cita o artigo. Mesmo assim, confira sempre a versão vigente: normas mudam.
