# Atualização dos dados oficiais — Chat Político

> **Procedimento vigente em 14/11/2026:** a publicação foi reforçada e passou a
> reutilizar o último JSON completo publicado quando a Câmara falha. Consulte
> a atualização operacional no final deste arquivo e [SECURITY_REVIEW.md](SECURITY_REVIEW.md).
> As seções originais abaixo preservam o registro da implementação de 04/11;
> o bloqueio de publicações de código por falha exclusiva da Câmara foi substituído.

## Estratégia

O visitante carrega `data/deputados.json` do próprio site. A URL utiliza
`import.meta.env.BASE_URL`, incluindo `/chat-dashboard-hub/` no GitHub Pages.
Parlamentares, perfis básicos e os dois indicadores compartilham essa consulta
no React Query. Não existe fallback automático para a API da Câmara.

O workflow existente `.github/workflows/deploy.yml` foi ampliado com execução
diária às **06:17 UTC / 03:17 em Brasília**, além de push na `main` e disparo
manual já existentes. Nada foi executado ou configurado no GitHub nesta tarefa.

Fluxo preparado: checkout → instalação → coleta completa → validação do JSON →
build com subcaminho → fallback SPA → artefato Pages → publicação.

O coletor reutiliza `camaraDeputies.ts` e `camaraHttp.ts`, sem novas dependências.
Node 22 executa o TypeScript compartilhado com remoção nativa de tipos.

## Origem e integridade

- Endpoint inicial: `https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=nome&pagina=1&itens=100`.
- [Documentação oficial](https://dadosabertos.camara.leg.br/swagger/api.html).
- Sem filtros históricos: deputados em exercício no momento da consulta,
  conforme a semântica documentada da listagem. Não é um conjunto em tempo real.
- São utilizados apenas `id`, `nome`, `siglaPartido`, `siglaUf` e `urlFoto`.
  Não são coletadas fotografias para o repositório, nem CPF ou outros campos
  desnecessários dos perfis.
- O coletor segue os links `next`, sem presumir quantidade de páginas ou de
  deputados. Quando o link omite ordenação/tamanho, conserva explicitamente os
  parâmetros iniciais; não inventa a próxima página. URLs externas, ciclos,
  paginação ambígua e alterações de escopo impedem a publicação.
- Exige `X-Total-Count` positivo e constante em todas as páginas. A quantidade
  final de IDs únicos deve corresponder a esse total, sem número fixo no código.
- Deduplica IDs idênticos. Conflitos no mesmo ID, registros sem ID/nome/UF/partido
  válidos, conjunto vazio ou incompleto interrompem a atualização. Fotografia
  ausente/inválida fica `null`; apenas URLs HTTPS da Câmara são aceitas.
- O JSON contém versão do esquema, origem, data UTC da conclusão, totais,
  recibos das páginas e SHA-256 dos registros normalizados, em ordem de ID.
  O mesmo validador é usado no coletor e no navegador. O hash detecta alterações
  no conteúdo; **não é assinatura digital da Câmara**. A integridade estrutural
  não comprova atualização instantânea de caches da fonte nem simultaneidade
  entre páginas sucessivas.

## Falhas e última versão válida

Cada URL tem até três tentativas, limite de 20 segundos por tentativa e espera
progressiva de um e dois segundos, respeitando `Retry-After` quando maior.
Somente falhas transitórias são repetidas. A listagem inteira tem limite de
120 segundos, incluindo esperas. O job de build tem limite de dez minutos.

O novo arquivo é gravado em temporário e renomeado somente depois de passar
pela validação completa. Qualquer falha mantém o arquivo anterior byte por byte.
O resultado é registrado no log e no resumo da execução do Actions; falha gera
código de saída diferente de zero. Não há `continue-on-error` nessa etapa.

No Actions, uma coleta com falha impede build/upload/deploy. Assim, o site já
publicado permanece com a última versão bem-sucedida. O checkout começa com a
versão inicial do repositório; **ela não é republicada como fallback mais antigo
quando uma coleta falha**. Uma atualização de código também aguardará coleta
bem-sucedida para ser publicada. Essa escolha evita armazenamento remoto extra.

Os dados diários ficam no artefato do site, sem commits automáticos do JSON.
Não há permissões de escrita no repositório, commits recursivos ou segundo
workflow competindo pelo Pages. A concorrência continua no grupo `pages`.

Um clone local contém a versão inicial versionada, não necessariamente o último
JSON publicado remotamente. Para renová-la localmente, executar `data:update`.

## Interface e limites

- A listagem renderiza 20 cartões inicialmente; **Carregar mais** acrescenta 20.
  Os filtros combinados atuam sobre todo o conjunto e reiniciam a quantidade
  visível. Fotografias externas continuam com carregamento preguiçoso e fallback.
- Não existe botão **Atualizar dados**. A data da coleta bem-sucedida aparece
  discretamente. Falhas ao carregar o arquivo do site permitem tentar novamente;
  essa ação não consulta a Câmara. O carregamento tem limite de 20 segundos.
- Os indicadores contam cada ID uma única vez por UF/partido. A interface explica
  a metodologia e direciona à documentação, sem abrir um documento XML bruto.
- Perfis básicos vêm do mesmo arquivo e funcionam sem a API. Gabinete, contatos e
  último status podem ser solicitados explicitamente em **Consultar informações
  adicionais**, reutilizando o endpoint `/deputados/{id}` e seus limites/retries.
  Falhas não ocultam os dados básicos. Informações adicionais não são inventadas.
- CORS da API continua sendo uma limitação dessa consulta opcional. Fotografias
  dependem do domínio externo; o JSON não torna suas imagens disponíveis offline.
- O calendário do GitHub não garante horário exato. Agendamentos executam na
  branch padrão; repositórios públicos sem atividade por 60 dias podem ter a
  agenda desativada. Conferir o painel Actions após a ativação autorizada.
  [Regras do GitHub](https://docs.github.com/en/actions/reference/workflows-and-actions/events-that-trigger-workflows#schedule).

## Comandos locais

Requer Node 22 recente (verificação local: 22.22.3; CI: linha 22).

```text
npm run data:update       # Consulta real completa; mantém anterior se falhar
npm run data:validate     # Sem rede: valida o JSON existente
npm run test:data         # 15 testes do coletor/integridade, com respostas simuladas
npm test                 # Testes unitários do frontend e cliente HTTP
npm run lint
npx tsc -p tsconfig.app.json --noEmit
npx tsc -p tsconfig.node.json --noEmit
npm run build
npm run dev
```

Com `npm run dev`, abrir `http://localhost:8080/parlamentares` ou `/graficos`.
Não é necessário executar `data:update` para visualizar a versão inicial válida.
Para reproduzir o subcaminho em PowerShell:

```powershell
$env:BASE_PATH='/chat-dashboard-hub/'
npm run build
npm run preview -- --host 127.0.0.1 --port 8081 --strictPort
```

Abrir `http://127.0.0.1:8081/chat-dashboard-hub/`. O preview precisa receber o
mesmo `BASE_PATH` do build. A publicação real continua usando `404.html` conforme
o workflow existente; não foi realizado teste remoto nem deploy nesta tarefa.

Os E2E padrão utilizam respostas simuladas. `RUN_PUBLISHED_LIVE=1` habilita as
duas verificações do JSON oficial efetivamente servido, sem simulações e sem
consultar a API no navegador. Substitui o antigo `RUN_CAMARA_LIVE` nessa suíte.
O ambiente desta tarefa usou Microsoft Edge instalado, via configuração temporária
em `test-results/dataset.config.ts`, sem alterar a configuração padrão do projeto.

## Evidências desta etapa — 04/11/2026

- A consulta ordenada por ID retornou HTTP 504 e esgotou três tentativas.
  A ordenação oficial equivalente por nome respondeu 200. Outra coleta falhou
  na página 5 ao seguir links que omitiram a ordenação. A coleta final preservou
  os parâmetros e concluiu seis páginas: 100 + 100 + 100 + 100 + 100 + 13.
  Não foi comprovada a causa interna dessas diferenças na infraestrutura da fonte.
- **Consulta oficial concluída:** `2026-11-04T23:25:00.003Z`
  (04/11/2026 às 20:25 em Brasília). 513 IDs únicos, 27 UFs e 21 siglas partidárias;
  zero duplicatas e zero registros inválidos. Esses números são resultados desta
  consulta, não constantes de validação. Arquivo: 103.889 bytes.
- SHA-256: `cac264f0c7827830b3e46bd50106b572dc61ee2e4f7364f92d373dc84702a64a`.
- `data:validate`: aprovado; igualdade entre o JSON em `public` e no build confirmada.
- `test:data`: **15 aprovados**. Inclui paginação, recuperação, deduplicação,
  hash, campos ausentes, total alterado, falha sem cache e preservação/substituição
  do arquivo anterior. Dados sintéticos ficam exclusivamente nos testes.
- `npm test`: **40 aprovados**; lint e ambos os projetos TypeScript sem erros.
- Build `/chat-dashboard-hub/`: aprovado. Avisos existentes de Browserslist
  desatualizado e bundle acima de 500 kB permanecem; nenhuma dependência adicionada.
- E2E no Edge: **26 aprovados localmente e 26 no build com subcaminho**, incluindo
  duas verificações reais por execução, sem cache anterior. As tabelas dos gráficos
  foram conferidas com todos os agrupamentos do arquivo. Nenhum endpoint da API
  da Câmara foi requisitado pelo navegador nos fluxos básicos reais.
- Rodadas preliminares: uma falha de contagem durante alterações dos arquivos;
  não se repetiu na rodada estável. A primeira rodada de preview foi interrompida
  após falhas causadas pela ausência de `BASE_PATH` no servidor; configuração
  corrigida antes da aprovação acima. Não são resultados ocultados como sucesso.
- Evidências JSON e capturas: `test-results/dataset-local-results/` e
  `test-results/dataset-pages-results/` (artefatos locais ignorados pelo Git).
- Workflow: YAML analisado e ordem coleta/build/upload conferida localmente.
  A execução no GitHub, permissões efetivas e publicação **não foram testadas**.

## Arquivos desta etapa

Criados: `public/data/deputados.json`, `src/services/deputiesDataset.ts`,
`src/services/publishedDeputies.ts`, `scripts/update-deputies.mjs`,
`scripts/update-deputies.test.mjs` e este documento.

Modificados: `.github/workflows/deploy.yml`, `package.json`, `PROJECT_CONTEXT.md`,
`src/services/camaraDeputies.ts`, `src/services/camaraHttp.ts`,
`src/services/camaraDeputies.test.ts`, `src/hooks/useDeputies.ts`,
`src/hooks/useDeputies.test.tsx`, `src/pages/Parlamentares.tsx`,
`src/pages/ParlamentarDetails.tsx`, `src/pages/Graficos.tsx`,
`src/components/CamaraSource.tsx`, `src/components/DeputiesChart.tsx`,
`e2e/fixtures/camara.ts`, `e2e/indicators.spec.ts`, `e2e/parliament.spec.ts`,
`e2e/reliability.spec.ts`, `e2e/indicators-live.spec.ts` e `e2e/parliament-live.spec.ts`.
Nenhum arquivo excluído como resultado final. Alterações locais anteriores foram
preservadas; a relação do Git também inclui trabalhos de etapas anteriores.

Chat, histórico local, contratos de API e backend do Nilo não foram modificados.
Não houve commit, push, deploy, login, banco ou nova funcionalidade política.

## Pendente de autorização

Revisar o resultado local. Somente após autorização, fazer commit/push das
alterações e ativar/verificar a primeira execução na branch padrão, com Pages
configurado para GitHub Actions. O push na `main` já é um gatilho de publicação.
Depois, acompanhar o resumo diário e a data exibida no site. Nenhuma ação remota
é necessária para a revisão local, nem é exigida participação do Nilo.

## Atualização operacional — 14/11/2026

Estado: implementado e validado localmente, **sem commit, push, alteração de
configuração remota ou deploy**. O JSON oficial de 04/11 permanece inalterado.

- `npm run data:update` continua sendo a coleta real independente e atômica.
  O workflow agora executa **`npm run data:prepare`**: recupera e valida primeiro
  o conjunto completo do próprio site; depois tenta consultar a Câmara.
- Se a Câmara falhar, push/manual podem publicar código com o conjunto já
  publicado e sua data original. O snapshot antigo do checkout não substitui
  automaticamente uma publicação mais recente. Coleta parcial, inválida,
  anterior ou conflitante também preserva o conjunto publicado.
- Se a recuperação ou a integridade do JSON do Pages falhar, a publicação para.
  O download usa HTTPS, URL fixa do projeto, sem redirecionamentos/credenciais,
  cache revalidado e limite de 15 segundos. Mudança de proprietário/nome do
  repositório exige revisar a URL em `scripts/prepare-publication.mjs`.
- A atualização diária mantém `17 6 * * *` (03:17 em Brasília). Uma coleta
  diária com falha encerra com erro e não publica. Não há commits automáticos.
- **Inicialização dos dados:** após autorização para publicar as alterações na
  `main` remota, executar manualmente o workflow com `bootstrap_data=true`.
  Isso permite usar o JSON oficial versionado somente se o remoto responder
  404; erros de rede, JSON inválido e outros HTTP não são ocultados. O snapshot
  inicial também precisa passar pela validação. Um push anterior a essa
  inicialização será interrompido com segurança. Não marcar essa opção nas
  execuções normais posteriores.
- Conferir **Settings → Pages → Source: GitHub Actions** e ambiente
  `github-pages` permitindo `main`. A habilitação automática de Pages foi
  retirada. Não é necessário PAT nem permissão de escrita no conteúdo do repo.
- Build possui apenas `contents: read`; somente deploy recebe `pages: write`
  e `id-token: write`. Checkout não mantém credenciais. As Actions diretas
  estão fixadas por SHAs verificados; mantém-se a concorrência global `pages`.
- Lint, TypeScript dos fontes/configurações, testes unitários/publicação e
  integridade antecedem upload/deploy. E2E no build também é obrigatório em
  push/manual; não há download de navegador/E2E diário para código inalterado.
- Node mínimo local: 22.18.0. Ferramentas avaliadas: Vite 6.4.6 e Vitest 4.1.12.
  Os scripts `typecheck`, `test:ci` e `test:e2e:pages` permitem reproduzir as
  verificações. Para E2E com Edge instalado no Windows, usar
  `PLAYWRIGHT_CHANNEL=msedge`; o CI usa Chromium.
- Nesta etapa passaram 79 unitários, 27 testes de coleta/publicação, 27 E2E no
  build padrão e 27 no subcaminho, além de lint, TypeScript, ambos os builds e
  integridade do JSON. Dois E2E por ambiente usam o JSON oficial sem mocks;
  isso não significa uma coleta nova da Câmara. Simulações ficam nos testes.
- Auditoria final: 16 ocorrências totais (1 alta, 15 moderadas, zero críticas)
  e 8 com `--omit=dev`. Condições de não aplicabilidade, versões e evidências
  de ausência de módulos no bundle estão em `SECURITY_REVIEW.md`.

O funcionamento real no GitHub Actions/Linux, a primeira publicação e o próximo
disparo agendado continuam pendentes de autorização e execução remota. A
indisponibilidade de fotografias/detalhes opcionais e o calendário do GitHub
continuam limitações externas; nenhuma mudança no backend do Nilo foi necessária.

## Correção do ambiente de publicação — 14/11/2026

A PR #1 foi integrada à `main` pelo merge `bc0f64f`. A primeira inicialização
manual (execução `43636544387`) coletou e validou dados oficiais e concluiu o
build, mas parou antes dos E2E e do deploy: `ubuntu-latest` selecionou Ubuntu
26.04, incompatível com o Chromium do Playwright 1.60.0 instalado pelo lockfile.

Os jobs passam a usar explicitamente `ubuntu-24.04`, suportado pela versão
instalada do Playwright, sem mudar dependências ou remover verificações.
Publicar essa correção não dispensa a primeira execução manual com
`bootstrap_data=true` enquanto o JSON remoto responder 404. Depois de um deploy
bem-sucedido, execuções normais usam `bootstrap_data=false` (padrão). A agenda
continua às 03:17 em Brasília, na branch padrão, sem exigir novos commits;
seu próximo disparo real precisa ser acompanhado no Actions. Resultados da
publicação e da validação pública devem ser conferidos na execução respectiva,
sem tratar os registros locais anteriores como comprovação remota.

### Publicação confirmada — 14/11/2026

- Bootstrap com dados oficiais concluído na execução `43637599079`; os 27 E2E,
  build e deploy passaram no Ubuntu 24.04. O JSON público passou a responder 200.
- Execução normal, sem bootstrap, concluída em `43637841111`, incluindo nova
  coleta, validação e deploy. Um teste móvel de histórico precisou da repetição
  automática; o teste agora aguarda as larguras finais da transição da sidebar
  antes de selecionar uma conversa e conferir o layout, sem esperas fixas nem
  remoção de asserções. A verificação dessa correção deve ser lida no CI seguinte.
- Validação real do site público em Edge novo, sem mocks: início, navegação,
  filtros, carregamento progressivo, perfis básicos e recarga de rota interna,
  ambos os indicadores e seus agrupamentos passaram. Nenhuma chamada direta à
  API da Câmara ocorreu nesses fluxos e não houve erros JavaScript não tratados.
- Perfil oficial e documentação abriram com HTTP 200. O backend existente
  respondeu à pergunta educativa sobre PEC com HTTP 200 e `mode: template`;
  isso comprova a comunicação e não geração por IA. Histórico preservado após
  recarga. Nenhum backend ou contrato do chat foi alterado.
- Workflow ativo na branch padrão `main`, Pages por Actions e agenda diária
  mantida. O primeiro disparo real do cron permanece uma ocorrência futura,
  distinta do fluxo normal manual já executado. Nenhuma configuração manual
  adicional do GitHub foi necessária nesta publicação.
