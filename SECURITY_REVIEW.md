# Segurança e preparação para publicação — 14/11/2026

## Decisões anteriores às alterações

- A auditoria inicial registrou 59 ocorrências no `npm audit`, incluindo duas
  críticas na cadeia Vitest/Tinypool. Os resultados brutos ficam em artefatos
  ignorados em `test-results/`, sem credenciais.
- Atualizações patch/minor serão aplicadas dentro dos intervalos das bibliotecas
  existentes para corrigir Router, PostCSS e utilitários transitivos. Não será
  executado `npm audit fix --force`.
- Exceção justificada: migrar **Vitest 3 para 4.1.12 e Vite 5 para 6.4.6**.
  Vitest 3.2.7 mantém Tinypool 1.1.1, afetado por alertas críticos e sem correção
  na linha 1. Vitest 4 remove essa dependência e exige Vite 6 ou superior.
  Node 22 e o plugin React/SWC existentes são compatíveis com Vite 6. Não há
  mudança de React, Router 6, Recharts 2 ou Tailwind 3 para outra major.
- Riscos da migração: alterações no runner, mocks, configuração e empacotamento.
  Serão verificados testes unitários, TypeScript, builds padrão/subcaminho e E2E.
  Referências: [migração Vitest 4](https://v4.vitest.dev/guide/migration.html),
  [migração Vite 6](https://v6.vite.dev/guide/migration),
  [Tinypool](https://github.com/advisories/GHSA-5gmw-xhrv-c9v3).
- Alertas restantes serão avaliados pelas condições reais, sem forçar majors
  em funcionalidades não utilizadas apenas para zerar o contador.

## Links externos

As fontes novas passam por `chatApi.ts`; o histórico é lido diretamente do
localStorage e renderizado em `ChatMessages.tsx`. A validação precisa existir
nos dois pontos. O normalizador anterior preservava esquemas perigosos e URLs
não oficiais, que chegavam ao atributo `href`. As mensagens usam texto React,
sem `dangerouslySetInnerHTML`, e os links já usavam `target="_blank"` e
`noreferrer`. Isso não demonstra, por si só, XSS explorável: não foi comprovada
execução de código no navegador. A ausência de política de URL, entretanto,
permitia links indevidos serem apresentados como fontes oficiais.

A correção usa `URL` sem base implícita, hosts exatos autorizados, HTTPS,
rejeição de credenciais/portas não padrão/controles/backslashes e filtragem
antes de criar links. HTTP legado em host autorizado é convertido para HTTPS.
Não há aceitação genérica de `gov.br`, `jus.br` ou sufixos textuais. Novas fontes
oficiais exigirão revisão explícita da lista. Conversas antigas são preservadas.

## Separação entre código e dados

Manter um único workflow e o grupo de concorrência `pages`. Antes da coleta,
recuperar e validar o JSON do próprio site por HTTPS. Na falha da Câmara,
push/manual poderão publicar código com esse conjunto completo, conservando
a data e os registros. A execução diária deverá registrar falha e não publicar.

Falha ao recuperar/validar o JSON publicado bloqueia a publicação: não será usado
silenciosamente um snapshot mais antigo do checkout. A primeira publicação será
uma execução manual na `main`, com opção explícita de inicialização, permitida
somente quando o JSON remoto responder 404; ela poderá usar o JSON oficial
versionado. Essa opção não autoriza nenhum deploy nesta tarefa.

O serviço da Câmara, seus contratos, a validação do conjunto e a escrita atômica
serão reutilizados. Não haverá banco, proxy, commits automáticos nem novo backend.
Limites: recuperação do último conjunto depende da disponibilidade do Pages/CDN;
não há garantia transacional entre páginas da fonte nem assinatura oficial no hash.

## Resultado

### Correções e versões instaladas

| Pacote | Antes | Depois | Motivo |
| --- | --- | --- | --- |
| Vite | 5.4.19 | 6.4.6 | Compatibilidade com Vitest seguro e correções de ferramentas |
| Vitest | 3.2.6 | 4.1.12 | Remove Tinypool vulnerável e corrige o mocker |
| React Router DOM | 6.30.1 | 6.30.6 | Correções compatíveis, mantendo Router 6 |
| `@remix-run/router` | 1.23.0 | 1.23.4 | Corrige alertas de redirecionamento anteriores |
| PostCSS | 8.5.6 | 8.5.33 | Correções de source maps e serialização |
| Lodash | 4.17.21 | 4.18.1 | Correções de template/protótipo, mesma major |
| Nanoid | 3.3.11 | 3.3.20 | Correções de tamanho/geradores, mesma major |
| form-data | 4.0.5 | 4.0.6 | Correção de injeção CRLF |
| js-yaml | 4.1.0 | 4.3.2 | Correções de protótipo e consumo de recursos |

Também foram atualizados utilitários transitivos compatíveis, incluindo Rollup,
flatted, brace-expansion, picomatch e source-map-js, além de ESLint 9 e
typescript-eslint 8. As bibliotecas da interface mantêm suas majors. Não há
override forçando majors incompatíveis, nem `audit fix --force`.

O npm 10 apresentou erro interno `edgesOut` ao resolver a migração do Vitest.
A resolução foi concluída com npm 11.6.2 temporário via npx, sem instalação
global nem dependência adicional no projeto. Depois, uma instalação limpa
`npm ci --ignore-scripts --no-audit` com o npm padrão do Node 22 passou. O CI
continua usando `npm ci` e o lockfile; sua execução remota não ocorreu.

### Auditoria final e aplicabilidade

Resultados de **npm 10.9.8 em 14/11/2026**, depois da instalação limpa:

| Escopo | Antes | Depois |
| --- | --- | --- |
| `npm audit` | 59: 2 críticas, 34 altas, 20 moderadas, 3 baixas | **16: zero críticas, 1 alta, 15 moderadas** |
| `npm audit --omit=dev` | 27: 15 altas, 11 moderadas, 1 baixa | **8: zero críticas, 1 alta, 7 moderadas** |

São contagens de pacotes afetados na árvore, não demonstrações de exploração.
Ferramentas também aparecem em `--omit=dev` por relações de dependências/peers.
O grafo real do bundle foi inspecionado durante o build; Zod, PostCSS, Glob,
Minimatch, Sucrase, Tailwind, Vitest e Tinypool **não estão no JavaScript publicado**.
Evidência: `test-results/security-bundle-usage.json`. O CSS produzido pelo Tailwind
continua publicado normalmente; o compilador não é executado pelo visitante.

Alertas remanescentes e justificativas:

- **Zod 3.25.76 — alto:** sem imports ou chamadas na aplicação, ausente do bundle.
  Não há schema Zod processando arrays de usuários/API. A correção disponível
  exige Zod 4.6.6 ou superior; migrar uma dependência não utilizada não é
  necessário nesta etapa. Rever antes de qualquer uso futuro de Zod.
  [Aviso](https://github.com/advisories/GHSA-mrhx-c7xc-m3w5).
- **Router 6.30.6 — moderado, dois avisos:** o app usa BrowserRouter, sem SSR,
  hidratação manual ou desserialização de erros. Os destinos de Link/NavLink e
  navigate são constantes ou IDs numéricos validados; não recebem caminhos do
  usuário/API. URLs externas não passam pelo Router e agora são filtradas.
  A correção de todos os avisos exigiria Router 7, sem benefício aplicável ao
  uso atual. Rever se houver redirecionamentos dinâmicos ou SSR no futuro.
  [Navegação](https://github.com/advisories/GHSA-wrjc-x8rr-h8h6),
  [SSR](https://github.com/advisories/GHSA-337j-9hxr-rhxg).
- **Glob 10.5.0 / Minimatch nas cadeias de Sucrase, Tailwind e typescript-eslint:**
  usados em build/lint com padrões e arquivos do projeto. Nenhum padrão de glob
  de visitante ou da Câmara é passado a essas ferramentas. Não estão no bundle;
  o CI não executa código de pull requests de terceiros e não usa globs para
  delimitar leitura de arquivos secretos. Não foram forçadas majors transitivas
  incompatíveis apenas para eliminar alertas.
  [Glob](https://github.com/advisories/GHSA-3g3m-2fjr-6pw4),
  [Minimatch](https://github.com/advisories/GHSA-g3hv-75wg-m249).
- **Parser CSS transitivo do `@tailwindcss/typography`:** o plugin fixa 6.0.10;
  a outra instalação compatível foi atualizada para 6.1.6. O aviso restante
  requer seletores CSS controlados por atacante; o app não compila CSS recebido
  de usuários/API. O compilador e esse parser não estão no bundle. Não foi
  sobrescrito o pin do plugin, evitando mudança não necessária de comportamento.
  [Aviso](https://github.com/advisories/GHSA-rj75-hqrm-r3gf).
- Os demais avisos moderados nos pacotes pai são propagação dessas cadeias,
  não funcionalidades adicionais expostas. Essas conclusões se limitam à
  arquitetura e aos fluxos atuais, e não equivalem a ausência de riscos futuros.

### Publicação e Actions

- Permissões globais vazias. Build: somente `contents: read`; deploy:
  `pages: write` e `id-token: write`. Checkout sem persistir credenciais.
  Configure Pages foi movido para o job de deploy; habilitação automática de
  Pages foi removida. Configurar a fonte GitHub Actions na interface antes da
  publicação autorizada; não é preciso liberar escrita no conteúdo do repositório.
- Cinco Actions diretas fixadas por SHA de commit. Os SHAs foram resolvidos
  nas referências oficiais e a API do GitHub informou assinatura verificada:
  checkout/v4 `11d5960a326750d5838078e36cf38b85af677262`;
  setup-node/v4 `49933ea5288caeca8642d1e84afbd3f7d6820020`;
  configure-pages/v5 `983d7736d9b0ae728b81ab479565c72886d7745b`;
  upload-pages-artifact/v3 `56afc609e74202658d3ffba0e8f6dda462b719fa`;
  deploy-pages/v4 `d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e`.
  Fixação exige futuras atualizações revisadas; não torna imutáveis todas as
  dependências internas transitivas das Actions.
- Lint, TypeScript dos fontes/configurações e 106 testes unitários/de dados
  precedem a preparação e o build. E2E contra o build é obrigatório em
  push/manual; o download de navegador e E2E são evitados na atualização diária
  de código inalterado. O JSON é validado em todas as publicações.
- Mesma concorrência `pages`, sem cancelamento da execução em andamento,
  branch restrita à `main`, sem commits, pushes ou workflow recursivo.
- A preparação confirma integridade do JSON do próprio site antes da coleta,
  com URL HTTPS fixa do projeto, sem redirecionamentos nem credenciais,
  revalidação de cache e timeout de 15 segundos. Preserva a data original em
  fallback. Coleta parcial, inválida, anterior ou conflitante não substitui o
  último conjunto completo publicado. Falhas na recuperação do próprio Pages
  bloqueiam publicação para evitar rollback ao snapshot antigo do checkout.
- Push/manual podem publicar código após falha da Câmara; execução diária com
  falha encerra com erro e não publica. O total da coleta continua dinâmico,
  conferido com a fonte; não há números fixos ou simulações em produção.
- A primeira publicação exige `workflow_dispatch` na `main` com
  **bootstrap_data=true**, somente enquanto o JSON remoto retornar 404. Um
  push anterior a essa inicialização será interrompido de forma segura.
  Consultar o JSON remoto em 14/11 confirmou HTTP 404 e a recusa do fallback
  automático. O site ainda não recebeu esta implementação.

### Validação efetivamente executada

- Instalação limpa pelo lockfile: aprovada com os flags indicados acima.
- Unitários: **79 aprovados**, incluindo 37 casos do normalizador, API do chat,
  renderização segura e regressões do cliente/caches/filtros.
- Coletor/publicação: **27 aprovados**, com respostas simuladas e diretórios
  temporários. Incluem falhas transitórias, integridade, preservação dos bytes,
  último publicado mais novo que checkout, coleta inválida/anterior,
  inicialização restrita a dispatch manual e recusa de deploy diário com falha.
- Lint e TypeScript: aprovados; as configurações Vite/Vitest/Playwright também
  estão incluídas na verificação. Artefatos/cache em test-results são ignorados.
- Builds padrão e `/chat-dashboard-hub/`: aprovados. O build com subcaminho foi
  executado via API do Vite com plugin temporário apenas para observar módulos,
  sem alteração na configuração publicada.
- E2E: **27 aprovados no build padrão e 27 no subcaminho**, com Edge instalado
  (`PLAYWRIGHT_CHANNEL=msedge`). Incluem fontes maliciosas novas/no histórico,
  navegação, envio, erros, histórico, filtros, detalhes, gráficos e duas
  verificações do JSON oficial sem mocks em cada ambiente. CI usará Chromium;
  Linux/GitHub Actions não foram executados nesta tarefa.
- Integridade do JSON oficial: aprovada, **byte por byte inalterado**:
  SHA-256 do arquivo `927909d272260c5f7a965de275915f5e842bfdd437df99fa002afaf6971163c1`.
  Não confundir com o hash interno dos registros, que também permanece válido.
  Data da consulta preservada: `2026-11-04T23:25:00.003Z`. Não houve nova coleta
  oficial nem apresentação de testes simulados como dados reais.
- `.env`, variações de produção e credenciais são ignorados; `.env.example` e
  `.env.production.example` permanecem permitidos. Nenhum arquivo de ambiente
  nem credencial foi criado. `git diff --check` sem erros de whitespace.
- YAML e invariantes de segurança foram conferidos localmente. Não houve
  execução de workflow remoto, mudança de configuração GitHub ou deploy.

Ocorrências preliminares: erro de resolução do npm 10; erro de leitura durante
a primeira rodada com alterações de dependências em andamento; testes dessa
rodada foram interrompidos e repetidos depois da instalação limpa. Os resultados
aprovados acima são dessas reexecuções estáveis. Permanece aviso de bundle acima
de 500 kB (aproximadamente 769 kB / 228 kB gzip); não é um novo recurso nem falha
do build. Permanecem também avisos de descontinuação de dependências de tooling.

### Arquivos e impacto

Criados: `SECURITY_REVIEW.md`, `playwright.pages.config.ts`,
`scripts/prepare-publication.mjs`, `scripts/prepare-publication.test.mjs`,
`src/lib/sourceLinks.test.ts`, `src/services/chatApi.test.ts`,
`src/components/ChatMessages.test.tsx` e `e2e/security.spec.ts`.

Modificados nesta etapa: `.github/workflows/deploy.yml`, `.gitignore`,
`package.json`, `package-lock.json`, `eslint.config.js`, `tsconfig.node.json`,
`vitest.config.ts`, `src/lib/sourceLinks.ts`, `src/services/chatApi.ts`,
`src/components/ChatMessages.tsx`, `scripts/update-deputies.mjs`,
`DATA_UPDATES.md` e `PROJECT_CONTEXT.md`. Nenhum arquivo excluído.

O JSON, histórico, identidade visual, filtros, gráficos, perfis e contratos do
chat foram preservados. Links não autorizados deixam de ser clicáveis/exibidos
como oficiais; isso não remove mensagens nem conversas armazenadas. Nenhum
backend do Nilo, funcionalidade política, banco, autenticação, commit, push ou
deploy foi criado/modificado/executado.

### Recomendação e pendências

As correções locais e os testes sustentam a revisão da primeira publicação,
com os alertas não aplicáveis documentados. Isso não é garantia absoluta nem
confirmação do ambiente remoto. Após aprovação explícita, revisar os arquivos
acumulados no Git, publicar o workflow na `main` remota, conferir Pages →
GitHub Actions e ambiente `github-pages` permitindo `main`, e usar o dispatch
manual de inicialização. Confirmar todas as etapas e o JSON remoto HTTP 200,
com sua data correta, antes de considerar a primeira publicação concluída.
Não usar a `main` local antiga nem reexecutar workflows de commits antigos
para publicar esta versão. A agenda continua às 03:17 em Brasília e pode
atrasar/ser desativada por inatividade conforme as regras do GitHub.

Disponibilidade do Pages/CDN para recuperar o último conjunto, disponibilidade
das fotografias/detalhes opcionais, possíveis mudanças de domínio das fontes e
novos avisos de dependências permanecem limitações que exigem acompanhamento.
