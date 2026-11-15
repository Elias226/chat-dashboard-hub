# Contexto do projeto — Chat Político

> **Apresentação dos Indicadores — 15/11/2026:** composição partidária da Câmara
> e do Senado em hemiciclos simbólicos, com uma cadeira por registro e cores
> compartilhadas, sem posições ideológicas ou assentos reais. UFs usam lollipop;
> o comparativo ganha resumos por Casa. Dois indicadores opcionais usam apenas
> o recorte publicado de proposições, carregado ao abrir a seção. Fontes,
> tabelas e datas foram preservadas. Metodologia em
> [INDICATORS_VISUALS.md](INDICATORS_VISUALS.md). A etapa não altera os dados,
> a atualização automática ou o backend; resultados de testes e publicação
> devem ser conferidos no relatório e no CI da respectiva alteração.

> **Senado e Indicadores — 14/11/2026:** a seção Parlamentares passa a oferecer
> Deputados Federais e Senadores; Indicadores oferece Câmara, Senado e comparativo
> institucional. Senado usa a lista oficial em exercício, com JSON validado,
> atualização no workflow existente e preservação da última publicação válida.
> Mandato, exercício e eleição não são confundidos; há validações e aviso na
> transição de legislatura. Arquitetura e limites em [SENATE_DATA.md](SENATE_DATA.md).
> A confirmação final de publicação está no CI e no relatório desta tarefa.
> Backend/Render não foram alterados ou investigados nesta ampliação.

> **Projetos de Lei — 14/11/2026:** implementadas `/projetos-de-lei` e
> `/projetos-de-lei/:id`. A área usa um recorte oficial completo de PL, PEC e
> PLP apresentados em sete dias, publicado com o site e atualizado no workflow
> diário. Assunto filtra esse recorte; tipo+número+ano permite consulta exata
> explícita à Câmara em outros períodos. Detalhes incluem autoria, situação e
> tramitações, sem inferir conversão em lei. Consulte [PROPOSALS_DATA.md](PROPOSALS_DATA.md).
> O estado de publicação e resultados finais devem ser conferidos no CI e no
> relatório desta etapa; registros históricos abaixo não são validação atual.
> O backend/Render do Nilo e sua pendência de deploy ficaram fora desta tarefa.

> **Chat — 14/11/2026:** o frontend distingue IA, respostas de base e modo não
> informado; inclui carregamento, limite total de 90 segundos e nova tentativa
> manual. Diagnóstico público e proposta para Nilo em [NILO_AI_SETUP.md](NILO_AI_SETUP.md).
> Nos quatro testes reais desta etapa, todos os retornos foram `mode: template`;
> geração por IA não foi comprovada. O backend não foi alterado. As limitações
> antigas de ausência de timeout/identificação visual foram superadas no frontend.

> **Evolução local até 14/11/2026:** as seções 13 a 17 registram os Indicadores oficiais, a área de Parlamentares, o diagnóstico de confiabilidade, os dados consolidados e a preparação segura da publicação. As seções anteriores preservam o retrato histórico recuperado em 15/10/2026; referências antigas a gráficos demonstrativos não descrevem mais a página `/graficos` atual.

> Última atualização: **15/10/2026**. Documento de continuidade técnica e de produto.
> Consolida o histórico recuperado e a inspeção dos repositórios. Não exige acesso à conversa original para ser compreendido.

## Como interpretar e atualizar este documento

Os estados abaixo distinguem implementação, relato histórico e planejamento:

| Estado | Significado |
| --- | --- |
| **Confirmado no código** | A implementação foi localizada nos arquivos examinados. Não significa que tenha sido testada em produção nesta atualização. |
| **Histórico** | A conversa registra uma ação, teste ou decisão anterior; o estado operacional atual pode ser diferente. |
| **Condicional** | Existe código, mas seu uso depende de configuração, credenciais externas ou disponibilidade de serviços. |
| **Pendente** | Funcionalidade solicitada ou melhoria recomendada que não foi encontrada implementada, ou cuja ativação ainda precisa ser confirmada. |
| **Planejado** | Possibilidade discutida, sem implementação confirmada nem compromisso de execução imediata. |

Este arquivo é descritivo: registros de permissões antigas, publicações e tarefas não constituem autorização para novas ações. Ao continuar o desenvolvimento, considerar o pedido atual do usuário e verificar o estado dos arquivos.

### Referências e abrangência da verificação

- Histórico recuperado: `historico-recuperado.txt`, com **503 registros**, cobrindo de 01/06/2026 a 15/10/2026. O arquivo original permanece fora deste repositório.
- Frontend: arquivos locais, histórico Git e consulta de leitura ao repositório remoto.
- Backend: código consultado no GitHub durante a recuperação de contexto; commit de referência confirmado novamente nesta atualização.
- As imagens, ZIPs e outros anexos mencionados na conversa não fazem parte do texto exportado. Suas análises antigas são tratadas como relatos históricos, salvo confirmação pelo código atual.
- Não foram executados build, testes, consultas de chat ou validação no painel do Render para produzir este documento. Resultados antigos de testes não são apresentados como testes executados agora.
- Não há valores de credenciais neste arquivo. Nomes de variáveis de ambiente são identificadores de configuração, não seus conteúdos.

### Versões de referência

| Componente | Repositório | Commit de referência |
| --- | --- | --- |
| Frontend | [Elias226/chat-dashboard-hub](https://github.com/Elias226/chat-dashboard-hub) | `add0722` — `Improve source links and charts`, de 28/09/2026 |
| Backend | [NiloJereissati/chatbot-politico](https://github.com/NiloJereissati/chatbot-politico) | `a6f9c9a` — `Add official APIs and controlled AI`, de 28/09/2026 |

Na inspeção local, a branch ativa era `deploy-github-pages`, acompanhando `origin/main`, em `add0722`. A branch **`main` local permanecia em `c7abd4d`**, um commit antigo. Esse é um retrato da recuperação, não uma recomendação de organização de branches. Conferir novamente antes de qualquer trabalho com Git; não presumir que trocar para a `main` local preserva a versão mais recente.

## 1. Objetivos e proposta

O **Chat Político** é um MVP de aplicação web educativa e conversacional sobre política brasileira, acompanhado de dashboards. O objetivo é facilitar a compreensão de conceitos políticos e o acesso a informações públicas rastreáveis.

O usuário deve poder consultar parlamentares, proposições legislativas, tramitações, votações, candidaturas, bens declarados e informações institucionais. A evolução mais recente também inclui localidades do IBGE e consultas de transparência pública.

Diretrizes de produto estabelecidas pelo usuário:

- Preservar a interface própria do projeto, incluindo sidebar, histórico e balões de mensagem.
- Utilizar **somente fontes oficiais** para fundamentar informações. Wikipedia e derivados foram explicitamente rejeitados.
- Manter foco político e institucional brasileiro, com linguagem clara, educativa e neutra.
- Não transformar o chat em recomendador de voto ou em ferramenta de propaganda partidária.
- Melhorar a naturalidade das respostas sem permitir que uma IA invente fatos ou substitua as fontes oficiais.
- Evoluir o MVP de modo incremental, reaproveitando o backend criado pelo colega.

O histórico também registra uso acadêmico: explicações de arquitetura, documentação, artigo/PI e preparação de slides. Materiais antigos que descrevem o chat principal como inteiramente simulado ficaram desatualizados após a integração de junho.

## 2. Arquitetura do frontend e do backend

### 2.1 Separação dos componentes

Existem **dois repositórios independentes**. Esta pasta contém o frontend; o backend não está embutido nela.

```text
Navegador — React/TypeScript, frontend publicado no GitHub Pages
  |
  | POST /chat com { message }
  v
API — Node.js/Express, backend hospedado no Render segundo o histórico
  |
  +-- Interpretação por regras, padrões e palavras-chave
  +-- Respostas educativas prontas
  +-- Serviços de consulta a fontes oficiais
  +-- Resposta base com dados e referências
  +-- IA opcional para reescrever a resposta, quando elegível
  |
  v
JSON com reply, intent, sources e mode
  |
  v
Frontend exibe a resposta e persiste a conversa no localStorage

Canal alternativo preservado:
Dialogflow --> POST /webhook --> serviços do backend --> fulfillmentText
```

### 2.2 Frontend

O frontend controla a interface, a navegação, o envio de perguntas e a persistência local. O chat principal usa `fetch` diretamente; a presença de um provider de React Query não significa que esse fluxo use cache de consultas dessa biblioteca.

| Arquivo | Responsabilidade |
| --- | --- |
| [src/App.tsx](src/App.tsx) | Rotas `/`, `/graficos` e página de rota desconhecida; `BrowserRouter` com `basename`. |
| [src/pages/Index.tsx](src/pages/Index.tsx) | Coordena a tela inicial, a conversa ativa, o envio e o tratamento visual de falhas. |
| [src/services/chatApi.ts](src/services/chatApi.ts) | Cliente HTTP do chat; interpreta resposta e normaliza fontes. |
| [src/hooks/useConversations.ts](src/hooks/useConversations.ts) | Criação, seleção, exclusão e persistência de conversas. |
| [src/types/chat.ts](src/types/chat.ts) | Tipos de conversa, mensagem e fonte. |
| [src/components/ChatInput.tsx](src/components/ChatInput.tsx) | Campo de pergunta, sugestões e estado de envio. |
| [src/components/ChatMessages.tsx](src/components/ChatMessages.tsx) | Balões, quebras de linha, rolagem e links de fontes. |
| [src/components/Sidebar.tsx](src/components/Sidebar.tsx) | Navegação entre conversas e exclusão. |
| [src/lib/sourceLinks.ts](src/lib/sourceLinks.ts) | Converte padrões conhecidos de URLs de API em páginas oficiais legíveis. |
| [src/components/DashboardCharts.tsx](src/components/DashboardCharts.tsx) | Carrossel de gráficos demonstrativos da tela inicial. |
| [src/pages/Graficos.tsx](src/pages/Graficos.tsx) | Catálogo de gráficos com pesquisa textual. |
| [.github/workflows/deploy.yml](.github/workflows/deploy.yml) | Build e publicação no GitHub Pages. |

A persistência utiliza a chave `chat-politico-conversations`. As mensagens armazenam `id`, `conversation_id`, `role`, `content`, `timestamp` e, opcionalmente, `sources`, `intent` e `mode`. Cada fonte possui `title` e `url`.

O título é derivado da primeira mensagem do usuário e limitado a 40 caracteres, com reticências quando necessário. Os identificadores são gerados com `crypto.randomUUID()`.

### 2.3 Backend

Referência examinada: [árvore do backend no commit a6f9c9a](https://github.com/NiloJereissati/chatbot-politico/tree/a6f9c9a805e0738efa9ec4478154889df0f8e574).

```text
server.js
services/
  ai.js
  camara.js
  ibge.js
  perfisOficiais.js
  senado.js
  transparencia.js
  tse.js
```

O `server.js` concentra rotas, interpretação das perguntas, seleção de serviços e formatação das respostas. Os serviços encapsulam consultas externas e dados específicos. Não foi encontrada uma arquitetura implementada de agentes autônomos, um banco de dados ou um pipeline de busca vetorial.

A ordem principal do roteamento no `/chat` é: proposição identificada por tipo/número/ano; resposta pronta; consulta TSE; Transparência; IBGE; perfil oficial ou parlamentar; fallback. Essa precedência importa: adicionar gatilhos amplos pode interceptar perguntas destinadas a outro serviço.

Rotas confirmadas:

| Rota | Finalidade |
| --- | --- |
| `GET /` | Identifica o serviço e retorna estado básico. |
| `GET /health` | Retorna estado básico de saúde; não informa a versão implantada nem valida todos os serviços externos. |
| `POST /chat` | Entrada do frontend para consultas e respostas estruturadas. |
| `POST /webhook` | Compatibilidade com payloads do Dialogflow para busca de político e de projeto de lei. |

O backend inclui CORS, com origem configurável por `ALLOWED_ORIGIN` e padrão `*`. O `/webhook` tem fluxo próprio e não oferece automaticamente todas as funcionalidades adicionadas ao `/chat`.

### 2.4 Contrato do chat

Requisição atual do frontend:

```json
{
  "message": "Qual a tramitação da PEC 45/2019?"
}
```

Formato de resposta, apresentado apenas como estrutura ilustrativa:

```json
{
  "reply": "Texto da resposta baseada na consulta.",
  "intent": "BuscarTramitacaoProjeto",
  "sources": [
    {
      "title": "Dados Abertos da Câmara dos Deputados",
      "url": "https://dadosabertos.camara.leg.br/"
    }
  ],
  "mode": "template"
}
```

- `mode` indica `template` ou `ai` no backend examinado.
- Os dados estruturados usados internamente pelo backend não são enviados como campo `dados` na resposta final do `/chat` atual.
- O cliente também aceita `fulfillmentText` como alternativa a `reply`.
- Requisição sem mensagem retorna HTTP 400; erros gerais de consulta retornam HTTP 500.
- O frontend envia **somente a mensagem atual**. Não envia `sessionId`, `conversation_id` ou histórico. A identificação de conversa existe apenas na camada local da interface.

### 2.5 Hospedagem e configuração

Endereços registrados no código e no histórico:

- Frontend: `https://elias226.github.io/chat-dashboard-hub/`.
- Backend: `https://chatbot-politico.onrender.com`.
- Endpoint padrão do chat: `https://chatbot-politico.onrender.com/chat`.

O workflow do frontend responde a pushes na `main` remota e a disparo manual. Usa Node 22, `npm ci`, build com `BASE_PATH`, cópia de `dist/index.html` para `dist/404.html` e publicação de `dist`. O Vite utiliza `BASE_PATH`; o roteador utiliza `import.meta.env.BASE_URL`.

O usuário informou que o Render estava com **Auto-Deploy: On Commit** para a `main` do backend. A existência dessa configuração atual e a versão efetivamente em execução precisam ser verificadas no serviço. Um commit no GitHub não comprova que o deploy terminou.

| Identificador de configuração | Local | Finalidade confirmada no código |
| --- | --- | --- |
| `VITE_CHAT_API_URL` | Frontend, durante o build | Substitui a URL completa do endpoint de chat. |
| `BASE_PATH` | Build do frontend | Define o caminho base de publicação. |
| `PORT` | Backend | Porta do servidor; padrão 3000. |
| `ALLOWED_ORIGIN` | Backend | Origem permitida pelo CORS. |
| `OPENAI_API_KEY` | Backend | Credencial exigida para a chamada opcional de IA; conteúdo não registrado aqui. |
| `OPENAI_MODEL` | Backend | Seleção de modelo; padrão encontrado no código: `gpt-5-mini`. |
| `AI_ENABLED` | Backend | O valor `false` desativa a camada de IA. |
| `PORTAL_TRANSPARENCIA_API_KEY` | Backend | Credencial da Transparência; conteúdo não registrado aqui. |
| `TRANSPARENCIA_API_KEY` | Backend | Nome alternativo aceito pelo serviço da Transparência. |
| `TSE_MAX_ZIP_BYTES` | Backend | Limite para carregamento de ZIP do TSE; padrão de 15 MiB. |

As variáveis do frontend são incorporadas ao código entregue ao navegador. Credenciais privadas devem permanecer no ambiente do backend, sem serem copiadas para este documento ou para o frontend. O modelo citado é um padrão da versão examinada, não uma recomendação atual de contratação.

## 3. Tecnologias utilizadas

| Camada | Tecnologias e papel |
| --- | --- |
| Frontend | TypeScript, React 18, React DOM e React Router 6. |
| Build e desenvolvimento | Vite 5, plugin React/SWC, npm e TypeScript 5. |
| Interface | Tailwind CSS 3, shadcn/ui, Radix UI e Lucide React. |
| Visualização | Recharts 2 e Embla Carousel. |
| Qualidade no frontend | ESLint 9, Vitest 3, Testing Library e Playwright. |
| Backend | JavaScript, Node.js, Express 4, Axios, `fetch` nativo e dotenv. |
| Processamento TSE | Buffer, zlib e parser de CSV/ZIP implementado no serviço; sem biblioteca de banco de dados. |
| Publicação | GitHub Actions/GitHub Pages no frontend; Render no backend segundo o histórico. |
| Integração opcional de linguagem | API da OpenAI chamada por HTTP no backend, sem SDK no `package.json` examinado. |
| Canal alternativo | Dialogflow por `/webhook`, sem widget no fluxo principal do site. |

As versões exatas instaladas do frontend devem ser consultadas em [package-lock.json](package-lock.json); os intervalos declarados ficam em [package.json](package.json). A referência de execução documentada para o frontend é Node 22 ou superior; o CI usa especificamente Node 22.

## 4. Funcionalidades implementadas e confirmadas

### 4.1 Interface e conversas

| Funcionalidade | Estado e limite |
| --- | --- |
| Chat com backend real | Confirmado no código; o antigo mock foi removido do fluxo principal. |
| Criar, selecionar e excluir conversas | Confirmado no hook e na sidebar. |
| Histórico persistente | Confirmado em `localStorage`, restrito ao navegador/origem. |
| Sidebar recolhível | Confirmado na tela principal. |
| Título automático | Confirmado a partir da primeira pergunta. |
| Estado de envio | Confirmado; desabilita controles enquanto aguarda resposta. |
| Tratamento visual de falha | Confirmado; apresenta mensagem genérica quando a chamada falha. |
| Sugestões iniciais | Confirmadas para tramitação da PEC 45/2019, votação da PEC 45/2019 e PL 2630/2020. |
| Fontes nas respostas | Confirmado; metadados são salvos junto às mensagens. |
| Quebras de linha e rolagem | Confirmadas no componente de mensagens. |
| Fontes legíveis em conversas antigas | Confirmado; a normalização também ocorre na renderização. |

Os ícones de adicionar e microfone não comprovam anexos ou entrada por voz: os respectivos botões não possuem implementação funcional no componente atual.

### 4.2 Respostas e consultas

- Respostas prontas para PEC, projeto de lei, deputado, senador, finalidade do chatbot, uso, TSE e fontes oficiais.
- Normalização de acentos e algumas abreviações informais, como `vc`.
- Consultas de proposições por tipo, número e ano; inclui padrões como PL, PEC e PLP.
- Respostas específicas para resumo, tramitação e votação da proposição.
- Consulta de deputado e, na ausência de resultado, de senador.
- Tratamento específico dos aliases cadastrados de Lula antes da busca genérica de parlamentares.
- Consultas TSE, IBGE e Transparência conforme o escopo da seção seguinte.
- Resposta base preservada quando não há chave de IA ou quando sua chamada falha.

### 4.3 Dashboards

Há quatro gráficos no carrossel inicial e oito na página `/graficos`, incluindo projetos por ano, raça, votação, região, projetos mensais, partido, gênero e idade. Existem pesquisa por título/descrição/tipo, tooltips formatados em português, métricas resumidas e ajustes responsivos.

**Todos os conjuntos usados nesses gráficos são arrays fixos no código.** Títulos como “Série anual consolidada entre Câmara e Senado” não comprovam agregação oficial. Os painéis não devem ser apresentados como estatísticas oficiais ou dados atualizados. Não há endpoints de dashboard implementados no backend examinado.

## 5. Integrações com APIs e fontes oficiais

| Fonte | Implementação comprovada | Limites e dependências |
| --- | --- | --- |
| Câmara dos Deputados | Busca de deputados; proposições; detalhes; autores; tramitações; votações. Serviço `camara.js`. | Seleciona o primeiro deputado compatível. Detalhes adicionais toleram falhas; ausência de campo não prova inexistência do dado na origem. |
| Senado Federal | Lista de senadores em exercício. Serviço `senado.js`. | Não há consulta implementada de matérias, comissões, relatorias ou votações do Senado. |
| Planalto/gov.br | Perfil local de Lula com aliases e link da biografia oficial. Serviço `perfisOficiais.js`. | Cadastro estático, não consulta automática nem catálogo abrangente de figuras públicas. |
| TSE | Candidaturas e bens declarados por CKAN e download de ZIP/CSV. Serviço `tse.js`. | Ano padrão 2022, cache em memória e limite de tamanho. Não inclui cobertura geral de resultados, contas eleitorais ou propostas de governo. |
| IBGE Localidades | Estados, municípios, listas por UF, regiões e códigos. Serviço `ibge.js`. | Não inclui população ou indicadores socioeconômicos; cache em memória sem expiração explícita. |
| Portal da Transparência | Emendas, contratos e licitações. Serviço `transparencia.js`. | Condicional ao token; apresenta até cinco registros da página consultada. Sem token, retorna orientação de configuração. |

Referências das integrações, registradas a partir do código e do histórico:

- Câmara: `https://dadosabertos.camara.leg.br/api/v2`.
- Senado: `https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json`.
- Planalto: `https://www.gov.br/planalto/pt-br/conheca-a-presidencia/biografia-do-presidente`.
- TSE: `https://dadosabertos.tse.jus.br`, por metadados CKAN de `candidatos-<ano>`.
- IBGE: `https://servicodados.ibge.gov.br/api/v1/localidades`.
- Transparência: `https://api.portaldatransparencia.gov.br/api-de-dados`.

O TSE não foi integrado como uma API de consulta individual de candidato: o serviço descobre recursos, baixa arquivos e os processa. Os dados de bens são associados ao sequencial do candidato. O serviço utiliza `fetch` sem User-Agent customizado na consulta de metadados, após bloqueios 403 registrados no desenvolvimento.

### IA opcional: estado e alcance

O serviço `ai.js` chama a API da OpenAI pelo endpoint `/v1/responses`. A OpenAI é um provedor de geração de linguagem, **não uma fonte oficial de dados políticos**.

O acionamento exige dados estruturados e pelo menos uma fonte na resposta interna. O fallback não é enviado à IA, e `AI_ENABLED=false` impede seu uso. As respostas educativas prontas atuais também não passam automaticamente pela IA, pois não carregam esses dados/fontes internos.

O prompt orienta a usar somente a resposta base e as evidências fornecidas, manter neutralidade, não recomendar voto e não inventar informações. Se a chamada falhar, o backend mantém a resposta base e `mode=template`; com texto gerado, utiliza `mode=ai`.

Esses controles estão **confirmados no código**. Eles não constituem prova de que toda saída será factual ou neutra: faltam avaliações sistemáticas e validação posterior da resposta. A ativação da chave em produção não foi confirmada.

## 6. Principais decisões técnicas e justificativas

| Decisão | Justificativa e implicação |
| --- | --- |
| Integrar o frontend por `/chat` | Preserva layout, histórico e sidebar, evitando um segundo chat visual separado. |
| Preservar `/webhook` | Mantém compatibilidade com o agente Dialogflow do colega. |
| Começar com regras e serviços existentes | Permitiu integrar o MVP com pouca alteração no backend, sem exigir novas credenciais do Dialogflow. |
| Concentrar consultas e respostas no backend | Evita duplicação na interface e mantém credenciais privadas fora do navegador. |
| Usar somente fontes oficiais | Exigência explícita do usuário para rastreabilidade e credibilidade. |
| Usar IA como redatora opcional | Busca naturalidade sem delegar à IA a origem dos fatos nem tornar a disponibilidade do provedor obrigatória. |
| Priorizar perfil conhecido antes da busca parlamentar | Corrige o caso “Lula” sem confundir com “Lula da Fonte”. Não substitui desambiguação geral. |
| Separar links de API de páginas legíveis | Permite consultas técnicas sem obrigar o usuário a ler XML/JSON ao abrir uma fonte. |
| Normalizar fontes na chegada e na exibição | Também atende conversas antigas já persistidas. |
| Padronizar npm e remover ferramentas do Lovable/Bun | Alinha desenvolvimento, lockfile e instalação do CI. |
| Usar base configurável e fallback de SPA no Pages | Atende a publicação sob `/chat-dashboard-hub/` e a navegação com React Router. |
| Usar cache em memória para TSE/IBGE | Simplifica o MVP, com a consequência de perder cache ao reiniciar e precisar controlar atualização/volume. |

### Orientações antigas que foram superadas

- O widget `df-messenger` foi discutido como alternativa inicial, mas a escolha implementada foi manter o chat próprio com `/chat`.
- O pedido de adiar IA generativa, feito em 23/09, foi superado pela autorização de 28/09 para tentar IA controlada por fontes oficiais.
- Relatos antigos de falta de `/chat` ou de fontes na interface não descrevem o código atual.
- A integração TSE estava com erros na etapa intermediária; o commit posterior `a6f9c9a` contém o serviço incorporado. Não retomar o erro intermediário como se não houvesse implementação posterior.
- A sugestão de ampliar APIs não implica que todas as funcionalidades de cada portal tenham sido implementadas.

## 7. Problemas importantes já resolvidos

| Problema | Solução registrada e evidência |
| --- | --- |
| Git local criado com histórico independente e remoto de exemplo | Histórico registra reaplicação da correção sobre a base do GitHub, sem force push. Commit frontend `8cad753`. |
| `npm ci` falhava no Actions | Sincronização do lockfile; frontend `e2544c0`. |
| GitHub Pages não habilitado/disponível naquele cenário | Histórico registra autorização para tornar o repositório público, habilitação de Pages e deploy bem-sucedido. Parte da solução ocorreu por configuração externa, não apenas por código. |
| Caminho de assets e rotas no Pages | Vite com base configurável, `BrowserRouter` com `basename` e `404.html` no workflow. |
| Branding e dependências herdadas | Limpeza textual/configuração do Lovable, remoção dos lockfiles Bun e configuração própria do Playwright; frontend `eb339ad`. |
| Erros de lint em componentes e Tailwind | Interfaces vazias substituídas, import ESM e ajuste de Fast Refresh para componentes UI; frontend `e9da07a`. |
| Frontend sem entrada adequada para o backend | `/chat`, CORS e `/health` no backend `e6cabc3`; integração no frontend `86dff95`. |
| Perguntas educativas sem resposta adequada | Respostas prontas no backend `83eb5df`; sugestões iniciais no frontend `f2f5771`. |
| Consultas retornavam pouco contexto | Fontes, detalhes e camada opcional de IA no backend `908a819`; tramitações/votações em `ed9778e`. |
| Fontes não apareciam na interface | Armazenamento e renderização de fontes/metadados no frontend `ffa37b3`. |
| “O que vc faz?” não era reconhecido | Normalização e expansão de variantes no backend `7645cfb`. |
| “Lula” retornava “Lula da Fonte” | Cadastro específico de perfil oficial no backend `27296d8`. |
| Fontes abriam XML/JSON e gráficos tinham apresentação limitada | Conversão de links conhecidos e melhoria visual dos painéis no frontend `add0722`; dados dos gráficos permaneceram estáticos. |
| Bloqueios intermediários do TSE e ausência das novas integrações | Histórico registra ajuste de chamadas e inclusão de TSE, IBGE, Transparência e IA controlada no backend `a6f9c9a`; implementação confirmada no repositório. |

O histórico relata builds, lint, alguns testes e deploys bem-sucedidos ao longo dessas etapas. Também relata dificuldades do ambiente Windows: política do `npm.ps1`, falhas de criação de processos, travamentos e navegador de testes indisponível. Esses eventos não devem ser automaticamente tratados como erros atuais da aplicação.

A suspeita inicial de corrupção generalizada de acentos foi posteriormente atribuída, naquele diagnóstico, à exibição do PowerShell. Houve correção localizada de frases novas durante a integração TSE, mas não há base para presumir que todo o código atual esteja com encoding incorreto.

## 8. Limitações conhecidas

### Produto e entendimento

- A interpretação depende de palavras-chave e padrões. Perguntas fora das formas previstas ainda caem no fallback.
- Não há contexto entre turnos no backend. Depois de consultar uma PEC, perguntar “ela já foi votada?” não reutiliza automaticamente a referência anterior.
- A ativação da IA não muda esse roteamento nem adiciona memória: ela só recebe dados depois que uma consulta foi reconhecida e executada.
- A busca parlamentar ainda seleciona o primeiro resultado compatível; a correção de Lula é específica, não um mecanismo abrangente de desambiguação.
- O perfil do Planalto é estático e pode envelhecer; não confundir link oficial com atualização automática do conteúdo.
- Não há autenticação, sincronização de conversas entre dispositivos ou banco de dados confirmado.
- Anexos e entrada por voz não estão implementados, apesar dos ícones presentes.

### Dados e experiência

- Todos os gráficos são demonstrativos; não há fonte, data de consulta ou metodologia oficial associada aos números fixos.
- O helper de fontes cobre padrões conhecidos de Câmara e Senado. Ele não é uma validação geral de domínio oficial nem uma garantia de que todos os links serão páginas específicas legíveis.
- Senado, TSE, IBGE e Transparência têm os escopos limitados descritos na seção 5.
- Há cache em memória, sem persistência; TSE e IBGE não possuem política explícita de expiração no código examinado.
- O limite de ZIP do TSE não equivale a um limite geral de memória após descompressão. Anos/bases maiores exigem estratégia própria.
- No serviço da Câmara, falhas de detalhes adicionais são convertidas em campos vazios; é necessário distinguir dado ausente de consulta parcial.
- O frontend não possui timeout explícito nem cancelamento da requisição de chat. Serviços externos também têm políticas diferentes de timeout.
- O tratamento visual de erro do frontend é genérico; não distingue indisponibilidade, lentidão, consulta não compreendida ou falha de integração.
- O histórico relata demora inicial do Render no plano gratuito. Plano, comportamento e latência atuais não foram medidos nesta atualização.

### Verificação e operação

- [src/test/example.test.ts](src/test/example.test.ts) contém apenas `expect(true).toBe(true)`.
- [e2e/home.spec.ts](e2e/home.spec.ts) verifica elementos da tela inicial; não cobre o ciclo completo de conversa e consulta.
- O workflow de publicação executa instalação e build, mas não lint, teste unitário ou E2E.
- O backend examinado possui script de inicialização, sem suíte de testes configurada no `package.json`.
- A existência de prompt e gate de IA não comprova precisão, neutralidade ou resistência a instruções conflitantes do usuário.
- O README atual descreve a integração básica, mas não acompanha toda a evolução das APIs e da IA. Este documento fornece o contexto complementar.
- A publicação de `a6f9c9a` no Render e a configuração das credenciais não foram confirmadas. Não apresentar IA ou Transparência como serviços ativos só porque o código existe.

## 9. Funcionalidades pendentes e possibilidades planejadas

| Item | Classificação | Critério de conclusão ou verificação |
| --- | --- | --- |
| Confirmar versão atual no Render | Pendente operacional | Identificar o commit em execução e validar os caminhos principais; `/health` isoladamente não identifica versão. |
| Confirmar ativação da IA | Condicional / pendente de confirmação | Configuração no backend e retorno real de `mode=ai` em consulta elegível, com avaliação da resposta. |
| Confirmar consultas reais da Transparência | Condicional / pendente de confirmação | Credencial válida no ambiente do backend e resposta obtida em emendas, contratos e licitações. |
| Alimentar dashboards com fontes oficiais | Pendente recorrente | Endpoints e componentes conectados, com definição das métricas, fonte e data; retirar ou identificar explicitamente dados de exemplo. |
| Melhorar entendimento e esclarecimento | Pendente | Reconhecer variantes úteis e pedir os campos faltantes em vez de retornar somente fallback genérico. |
| Contexto entre turnos | Planejado, ainda ausente | Contrato e implementação que associem referências à conversa, com critérios de retenção e isolamento. |
| Desambiguação geral | Pendente de evolução | Priorizar correspondências adequadas e apresentar opções quando houver múltiplos nomes plausíveis. |
| Testes funcionais e de integração | Pendente | Cobrir contratos, fontes, erros, regras do roteador e ciclo de conversa com casos relevantes. |
| Avaliação da IA controlada | Pendente | Casos de fidelidade aos dados, neutralidade, escopo, falhas e ausência de evidências. |
| Mais funcionalidades da Câmara | Planejado | Autoria por parlamentar, voto nominal e consultas individuais foram discutidos, mas não encontrados implementados. |
| Ampliar Senado | Planejado | Matérias, comissões, relatorias e votações, além da lista atual de senadores. |
| Ampliar cobertura eleitoral | Planejado | Resultados detalhados, prestação de contas e outras bases além de candidaturas/bens. |
| Ampliar IBGE | Planejado | Indicadores/população exigem outras integrações; a implementação atual é de localidades. |
| Usar `dados.gov.br` | Apenas sugerido | Catálogo para descoberta de bases; nenhum serviço implementado foi encontrado. |
| Arquitetura de agentes | Apenas discutido | Não há orquestração implementada; avaliar necessidade antes de adicionar complexidade. |
| Documentação e apresentação acadêmica | Trabalho contínuo | Atualizar diagramas, limitações, metodologia e exemplos com evidências atuais, sem apresentar planos como resultados. |

Autenticação, banco de conversas, anexos, voz e migração de hospedagem não foram estabelecidos como próximos trabalhos obrigatórios. Sua ausência não deve ser interpretada como aprovação para implementá-los.

## 10. Próximos passos recomendados

Esta ordem é uma recomendação derivada do estado recuperado, não um registro de execução ou aprovação de novas alterações.

1. **Estabelecer a linha de base operacional.** Confirmar branch/commit de cada repositório, versão no Render e quais integrações estão efetivamente ativas. Registrar separadamente validação de código e validação de produção.
2. **Definir e verificar consultas representativas.** Incluir perguntas educativas, busca nominal, projetos, tramitações, TSE, IBGE, Transparência, ambiguidades, campos ausentes e falhas de serviços. Começar por testes relevantes ao comportamento esperado.
3. **Corrigir a principal diferença entre aparência e dados.** Definir um pequeno conjunto de métricas oficiais para os dashboards, com origem, período, agregação, atualização e estados de erro/carregamento.
4. **Melhorar o entendimento com exemplos reais.** Ajustar precedência das regras, desambiguação e perguntas de esclarecimento; depois avaliar contexto entre turnos. Não presumir que ligar a IA resolve o classificador.
5. **Validar a camada de IA e as integrações condicionais.** Medir qualidade, tempo de resposta e preservação das evidências; comprovar fallback e comportamento sem configuração. Manter o foco político e neutro.
6. **Melhorar manutenção e rastreabilidade.** Centralizar métricas compartilhadas, estabelecer política de cache/timeout, ampliar verificações de CI e atualizar documentação conforme o escopo realmente entregue.

Perguntas representativas recuperadas do desenvolvimento, para orientar verificações futuras:

| Pergunta | Caminho esperado no código / ressalva |
| --- | --- |
| `O que é uma PEC?` | Resposta educativa pronta; não pressupor IA. |
| `O que vc faz?` | Resposta sobre a finalidade do chatbot. |
| `Quem é Erika Hilton?` | Busca parlamentar; depende da fonte e dos registros consultados. |
| `Me fale sobre Lula` | Perfil oficial cadastrado de Luiz Inácio Lula da Silva. |
| `Me fale sobre Lula da Fonte` | Busca parlamentar, sem acionar o alias específico de Lula. |
| `Me fale sobre PL 2630/2020` | Consulta de proposição na Câmara. |
| `Qual a tramitação da PEC 45/2019?` | Consulta e formatação de tramitações recentes. |
| `Como foi a votação da PEC 45/2019?` | Consulta de votações associadas; não equivale a voto nominal por deputado. |
| `Candidato Lula 2022` | Consulta do arquivo oficial de candidaturas do TSE. |
| `Bens declarados de Lula 2022` | Consulta TSE com associação dos bens ao candidato. |
| `Municípios do CE` | Lista/count e exemplos pela API de Localidades do IBGE. |
| `Dados de Fortaleza no IBGE` | Dados cadastrais da localidade; não indicadores de população. |
| `Emendas parlamentares 2024` | Transparência, condicional à configuração válida. |
| `Ela já foi votada?`, após uma PEC | Caso de evolução: contexto não implementado atualmente. |

## 11. Linha do tempo e ponto de retomada

| Período | Marco principal |
| --- | --- |
| 01–02/06/2026 | Deploy no Pages, resolução de Git/lockfile/configuração e limpeza de ferramentas herdadas. |
| 03–12/06/2026 | Análise do backend/Dialogflow, adoção de `/chat`, integração real e perguntas educativas. |
| 02/09/2026 | Consolidação de explicações para documentação e apresentação; gráficos ainda estáticos. |
| 23/09/2026 | Mais detalhes oficiais, tramitações/votações, fontes na interface, variantes informais e perfil específico de Lula. Início do TSE. |
| 28/09/2026 | Links legíveis e melhoria visual dos gráficos; incorporação de TSE, IBGE, Transparência e IA opcional controlada. |
| 15/10/2026 | Pedidos de próximos passos ficaram sem resposta na conversa antiga após problemas de conexão. Histórico recuperado e confrontado com os repositórios. |

O último pedido de implementação da conversa antiga foi incluir APIs e tentar IA controlada por fontes oficiais; corresponde ao backend `a6f9c9a`. A última resposta técnica extensa explicou o projeto para documentação/slides. As solicitações posteriores perguntavam como melhorar o projeto e não registram uma nova implementação iniciada.

## 12. Procedimento de manutenção deste contexto

Ao atualizar este arquivo:

1. Atualizar a data, os commits de referência e a abrangência da verificação.
2. Conferir os arquivos e o ambiente relevante; não elevar relato histórico a fato operacional sem evidência.
3. Mover itens entre planejado, pendente, condicional e confirmado, mantendo o motivo e a referência da mudança.
4. Registrar mudanças de contrato em ambos os repositórios e seus efeitos sobre conversas persistidas.
5. Revisar exemplos, limitações e critérios de conclusão quando uma funcionalidade evoluir.
6. Preservar decisões recentes e registrar explicitamente quando uma orientação anterior for substituída.
7. Registrar somente nomes de configurações, nunca seus valores privados ou conteúdos de arquivos de ambiente.

### Registro de atualizações

| Data | Alteração | Evidência |
| --- | --- | --- |
| 15/10/2026 | Criação do documento após recuperação integral do histórico; separação entre implementação, operação e planejamento. | 503 registros analisados; frontend `add0722`; backend `a6f9c9a`; inspeção estática, sem testes de produção nesta atualização. |

## 13. Indicadores oficiais — atualização local de 04/11/2026

- A página `/graficos` apresenta somente **Deputados federais por estado** (incluindo o Distrito Federal) e **Deputados federais por partido**. Usa barras horizontais com todas as categorias e tabelas acessíveis. Mantém pesquisa, navegação, identidade visual e rodapé.
- Fonte: `https://dadosabertos.camara.leg.br/api/v2/deputados?itens=100&ordem=ASC&ordenarPor=id&pagina=1`. A documentação oficial em `https://dadosabertos.camara.leg.br/swagger/api.html` (especificação `/api/v2/api-docs`) informa que a ausência de filtros temporais seleciona deputados em exercício no momento da requisição. Não adicionar `idLegislatura` ou datas sem rever a semântica dos indicadores.
- `src/services/camaraDeputies.ts` segue exatamente os links `rel=next` até o fim, valida a resposta, limita o tempo de cada requisição e rejeita paginação incompleta ou cíclica. Utiliza `id`, `siglaUf` e `siglaPartido`. Deduplica por ID mantendo a primeira ocorrência; exclui IDs inválidos; agrupa UF ou partido ausentes em “Não informado”, com aviso de qualidade.
- Os dois gráficos compartilham uma consulta pelo React Query já instalado, com validade de cache de cinco minutos em memória. Exibem fonte, período de referência e data/hora da consulta em Brasília. As páginas sucessivas não constituem uma fotografia simultânea da base. Falhas não são substituídas por números demonstrativos ou totais parciais.
- `src/components/DeputiesChart.tsx` concentra a apresentação reutilizável. O antigo `DashboardCharts.tsx` foi preservado, mas seus dados demonstrativos não aparecem na página de Indicadores nem no Assistente IA. A página inicial passou a identificar os Indicadores como provenientes de fonte oficial.
- **Verificação real, sem mocks:** no Edge, localmente e no build sob `/chat-dashboard-hub/`, foram obtidas seis páginas (cinco de 100 registros e uma de 13), totalizando 513 IDs distintos, 27 UFs e 21 siglas partidárias. A consulta do build terminou em 04/11/2026 às 15:42, horário de Brasília. Esses números são evidências datadas, não constantes nem contagens presumidas do aplicativo. As seis respostas bem-sucedidas apresentaram CORS `*`.
- **Verificações automatizadas:** 13 testes unitários aprovados (12 específicos da integração e o exemplo preexistente); 16 E2E aprovados no build com subcaminho, dos quais 15 utilizam simulações nos testes pertinentes e um é a integração real opcional. Ativar somente este último com `RUN_CAMARA_LIVE=1`; a suíte padrão não depende da disponibilidade da Câmara. O teste de acesso ao histórico em celular usa rolagem explícita após recolher a sidebar, sem pressupor rolagem automática durante sua animação.
- **Limitações observadas:** ocorreram HTTP 504 e respostas sem o cabeçalho CORS em tentativas anteriores. A consulta posterior seguindo os links oficiais completos foi concluída, mas a disponibilidade e os cabeçalhos externos continuam sujeitos ao serviço da Câmara. Houve validação local do build, sem publicação nem teste na hospedagem real do GitHub Pages.
- Backend do Nilo, contrato do chatbot e persistência do histórico permanecem sem alterações. Não houve dependências novas, commits, pushes ou deploys. Pesquisa de parlamentares, projetos de lei e outras integrações continuam fora desta etapa.

## 14. Consulta de deputados federais — atualização local de 04/11/2026

- Implementadas as rotas `/parlamentares` e `/parlamentares/:id`. A página inicial oferece o cartão Parlamentares como disponível. A listagem pesquisa nomes sem diferenciar acentos ou caixa e combina filtros por UF e partido sobre todos os registros carregados, não apenas a primeira página. Ordenação alfabética, sem avaliações ou recomendações.
- Reutilizado `src/services/camaraDeputies.ts`, preservando paginação, deduplicação e agrupamentos dos Indicadores. A normalização passou a reter `nome` e `urlFoto`. `src/hooks/useDeputies.ts` compartilha a mesma chave e política de cache do React Query entre Indicadores e Parlamentares: cinco minutos de validade em memória, sem requisição individual para cada item da lista.
- Detalhes consultam `GET /api/v2/deputados/{id}`, com cache próprio por ID. A estrutura foi conferida na especificação oficial `/api/v2/api-docs`: `dados.ultimoStatus` contém nome parlamentar, foto, partido, UF, situação, condição eleitoral, data, legislatura, e-mail e gabinete. O endpoint pode incluir ex-deputados; a tela identifica as informações como o último registro disponível, sem presumir exercício atual a partir do ID. CPF e outros dados pessoais desnecessários não são retidos nem exibidos.
- O padrão de perfil `https://www.camara.leg.br/deputados/{id}` foi verificado no portal oficial pelo perfil de ID 62881. Fotos vêm exclusivamente de URLs HTTPS da Câmara, com carregamento adiado e substituição por um ícone quando ausentes ou indisponíveis. Campos ausentes recebem identificação explícita, sem dados fictícios.
- Criados componentes simples para cabeçalho, fotografia e fonte/data, preservando o rodapé compartilhado. A navegação inclui Início, Assistente IA, Parlamentares e Indicadores. Não foi implementada pesquisa de projetos de lei, login, banco ou nova dependência; backend e contrato do chatbot permanecem sem alteração.
- **Testes simulados:** 22 testes unitários aprovados (17 da integração, quatro dos filtros e o exemplo preexistente). No build com `/chat-dashboard-hub/`, 20 E2E aprovados e dois testes reais opcionais desativados na suíte padrão. Foram verificados filtros isolados e combinados, dados da segunda página, cache entre telas, detalhes, recarga direta da rota, campos incompletos, foto com falha, HTTP 404/503, responsividade e regressão do chat e dos Indicadores.
- **Limite da verificação real desta etapa:** uma resposta real de listagem com nome e foto foi obtida via HTTP, e a primeira página completa respondeu no navegador durante a verificação do build. A consulta completa falhou na segunda página por erro de rede. Tentativas HTTP de detalhes dos IDs 62881, 204379 e 66385 retornaram 504/timeout. Portanto, os detalhes foram validados com respostas simuladas baseadas na especificação oficial, mas a listagem completa e um detalhe real no navegador continuam pendentes de disponibilidade da Câmara. Não reutilizar a evidência real bem-sucedida da seção 13 como se fosse uma nova validação desta etapa.
- A compatibilidade estrutural das rotas com o subcaminho foi testada localmente, sem publicação na hospedagem real. Não foi necessário alterar o backend do Nilo. Não houve commits, pushes ou deploys. Próximo passo: revisar a interface e repetir apenas a verificação real quando a API estiver disponível, antes de ampliar funcionalidades.

## 15. Diagnóstico e confiabilidade — 04/11/2026

### Evidências anteriores à alteração do serviço

- As URLs e a navegação foram inspecionadas antes de alterar o código de produção. A listagem seguia exatamente `links.next`, sequencialmente. Na captura real do navegador, a concorrência máxima da API foi **uma requisição**; não foram observadas chamadas simultâneas ou duplicadas desnecessárias. As duas páginas reutilizavam a mesma chave do React Query.
- As páginas 1, 2 e 3 responderam HTTP 200 com CORS `*` no navegador; a página 4, `https://dadosabertos.camara.leg.br/api/v2/deputados?ordem=ASC&ordenarPor=id&pagina=4&itens=100`, foi bloqueada por ausência de `Access-Control-Allow-Origin`. O detalhe `https://dadosabertos.camara.leg.br/api/v2/deputados/62881` apresentou o mesmo bloqueio.
- Fora do navegador, requisições HTTP com o mesmo Origin obtiveram 200 nas páginas 1, 2 e 4. O detalhe 62881 retornou 200 e JSON institucional válido, mas sem `Access-Control-Allow-Origin`. Assim, as falhas históricas de 504 não foram reproduzidas nessas sondagens; foi confirmada inconsistência de CORS no acesso à fonte, não uma queda geral nem erro comprovado de paginação. A responsabilidade por eventual cache, proxy ou gateway externo continua sem comprovação.
- Lacunas do frontend: não havia recuperação automática por requisição; o limite era apenas por página, não pelo tempo total; resultados completos já em memória eram ocultados após falha de atualização.

### Melhorias implementadas

- `src/services/camaraHttp.ts` concentra a política: no máximo três tentativas por URL, intervalos de um e dois segundos, ou o maior intervalo de `Retry-After` quando acessível. Repete apenas timeout, falha de rede e HTTP 408, 429, 502, 503 e 504. Não repete 404, JSON inválido nem erros de validação. O cabeçalho `Retry-After` em respostas 200 não provoca espera.
- Cada tentativa tem limite de 20 segundos, incluindo leitura do corpo. A listagem tem orçamento total de 120 segundos e cada detalhe, 70 segundos, incluindo esperas. Um `Retry-After` que exceda o orçamento encerra a consulta sem antecipar a nova requisição. Cancelamento de navegação interrompe tentativas e intervalos. Uma página recuperada não reinicia as páginas anteriores.
- `camaraDeputies.ts` marca `complete: true` somente após concluir e validar toda a paginação ou o detalhe solicitado. Não publica resultados intermediários. O React Query continua sem tentativas próprias, evitando multiplicar o número de chamadas do serviço. Cliques manuais repetidos compartilham a consulta em andamento; uma consulta com erro não é refeita apenas por remontar a página.
- Após erro de atualização, o usuário pode escolher **Usar última consulta completa**, somente quando há um resultado completo validado no cache em memória. O aviso mostra a data original e que os dados podem estar desatualizados. Filtros e os dois indicadores continuam usando esse mesmo conjunto. Sem cache completo, não há substituto. Não existe persistência desse cache após recarga do navegador; ele mantém a política de cinco minutos de validade e dez minutos de retenção sem observadores. O histórico do chatbot não foi alterado.

### Validação e limites restantes

- **Simulada:** 40 testes unitários aprovados; 25 E2E aprovados localmente e no build `/chat-dashboard-hub/`, com os dois testes reais opcionais desativados na suíte padrão. Casos incluem recuperação por URL, Retry-After, esgotamento, cancelamento, operação que nunca termina, limite total, deduplicação de observadores/refetches, ausência de cache e recusa de cache incompleto, falha de atualização em página posterior sem substituir o cache anterior, filtros, detalhes, indicadores e regressão do chat.
- **Real após as melhorias:** a listagem de Parlamentares concluiu seis páginas e exibiu 513 deputados após recuperar falhas nas páginas 1 e 3. O detalhe 204379 continuou bloqueado e encerrou após três tentativas. A primeira execução real dos Indicadores chegou às seis páginas, mas o teste antigo contou uma resposta repetida como página extra; o contador do teste foi corrigido para separar tentativas de URLs únicas. Na reexecução do build estático, a página 3 recuperou na terceira tentativa, porém a página 6 falhou nas três, e nenhum gráfico parcial foi exibido. Os testes reais completos, portanto, **não estão todos aprovados**.
- As sondagens HTTP e o navegador foram registrados separadamente em `test-results/verification/`, sem CPF, credenciais ou dados privados. Evidências históricas de sucesso não substituem essa verificação atual.
- CORS é definido pela fonte e não pode ser corrigido pelo JavaScript do frontend. A resposta HTTP de detalhe também não expôs `Retry-After` em `Access-Control-Expose-Headers`; o navegador só pode respeitar esse cabeçalho quando puder lê-lo. Não foi desativada segurança do navegador nem criado proxy. Regularização de CORS na fonte ou eventual proxy autorizado são alternativas futuras, fora desta alteração.
- Backend do Nilo, contratos do chat, gráficos, pesquisa, filtros e páginas de detalhes foram preservados. Nenhuma dependência, banco, autenticação, commit, push, deploy ou pesquisa de projetos de lei foi adicionada.

## 16. Dados consolidados e atualização diária preparada — 04/11/2026

Estado: **implementado e validado localmente; automação e publicação remotas ainda não ativadas**. O registro detalhado de arquitetura, comandos, arquivos, evidências e limitações está em [DATA_UPDATES.md](DATA_UPDATES.md).

- `/parlamentares`, os perfis básicos e `/graficos` carregam `data/deputados.json` do próprio site, respeitando `BASE_URL`. Compartilham o cache em memória e não consultam automaticamente a listagem na Câmara. O botão **Atualizar dados** foi removido. A data exibida é a da coleta oficial, não a data de abertura da página.
- `public/data/deputados.json` foi produzido exclusivamente pela coleta oficial completa concluída em `2026-11-04T23:25:00.003Z`: 513 IDs únicos, seis páginas, 27 UFs e 21 siglas partidárias, sem duplicatas nem registros inválidos. Esses totais não são presumidos pelo código. O arquivo guarda dados básicos, origem, data, total oficial, recibos de paginação e SHA-256; nenhuma fotografia foi armazenada no repositório.
- `scripts/update-deputies.mjs` reutiliza os serviços existentes e o novo validador compartilhado `deputiesDataset.ts`. Segue `next`, preserva os parâmetros explícitos quando omitidos pelo link, exige total constante em `X-Total-Count`, deduplica e rejeita conjuntos incompletos, campos essenciais ausentes e conflitos. Somente após validação completa substitui o arquivo por renomeação. Falhas preservam o arquivo anterior e encerram com erro.
- O workflow existente foi preparado para executar diariamente às 06:17 UTC / 03:17 em Brasília. Coleta e validação antecedem build/upload/deploy. Se falharem, o Pages mantém a versão já publicada; não republica o arquivo inicial mais antigo do checkout. Dados atualizados ficam no artefato, sem commits automáticos, permissões de escrita no repositório ou execuções recursivas. O grupo de concorrência `pages` foi mantido. Atualizações de código também aguardam uma coleta bem-sucedida.
- A listagem renderiza 20 cartões inicialmente e oferece **Carregar mais**. Todos os filtros continuam atuando sobre o conjunto completo. Fotografias externas mantêm carregamento preguiçoso. Os indicadores explicam a metodologia e direcionam à documentação oficial, sem XML bruto.
- Os perfis básicos independem da disponibilidade da API. A consulta institucional adicional permanece disponível por ação explícita, com os limites e tentativas anteriores; falhas não ocultam o perfil publicado. CORS e indisponibilidade da fonte continuam limitando essa consulta opcional e o carregamento de fotografias.
- Evidência real: a ordenação por ID retornou 504, enquanto a consulta por nome respondeu 200; outra coleta falhou na página 5 quando o link omitiu ordenação. A coleta final, mantendo os parâmetros, concluiu as seis páginas e passou pela validação. A causa interna dessas diferenças na fonte não foi comprovada.
- Validação desta etapa: 15 testes do coletor/integridade e 40 testes unitários aprovados; lint e ambos os projetos TypeScript sem erros; build com `/chat-dashboard-hub/` aprovado. **26 E2E aprovados localmente e 26 no build estático**, incluindo duas verificações por ambiente com o JSON oficial sem mocks e navegador novo. Nenhuma requisição aos endpoints da API foi observada nos fluxos básicos reais. Rodadas preliminares com falhas e correções de configuração estão descritas no relatório, assim como avisos existentes do build.
- Não houve execução do workflow no GitHub nem validação de deploy remoto. Agendamento depende de alterações autorizadas na branch padrão, permissões efetivas do Pages e disponibilidade do Actions; pode atrasar ou ser desativado por inatividade conforme as regras do GitHub.
- Nenhuma dependência, backend do Nilo, contrato do chatbot ou histórico foi modificado. Não houve commit, push ou deploy. A próxima ação recomendada é a revisão local; qualquer ativação remota continua dependendo de autorização explícita.

## 17. Segurança e preparação da publicação — 14/11/2026

Estado: **implementado e validado localmente; publicação remota não realizada**.
O relatório detalhado, versões, análise dos alertas e procedimento atual estão
em [SECURITY_REVIEW.md](SECURITY_REVIEW.md) e na atualização operacional de
[DATA_UPDATES.md](DATA_UPDATES.md). Os registros anteriores permanecem históricos.

- Fontes oficiais agora exigem URL absoluta segura, host exato autorizado e
  HTTPS, com rejeição de protocolos perigosos, credenciais, portas inesperadas
  e autoridades enganosas. HTTP legado autorizado é convertido para HTTPS.
  Tanto respostas novas quanto mensagens antigas são filtradas antes de criar
  links. Histórico e contratos do chat foram preservados. Não foi comprovada
  execução de código na versão anterior; foi corrigida a política insuficiente
  que deixava URLs não autorizadas chegarem ao `href` de fontes oficiais.
- Atualizações compatíveis de dependências e migração justificada das ferramentas
  para Vite 6.4.6/Vitest 4.1.12 removeram a cadeia vulnerável do Tinypool e vários
  alertas de Router, PostCSS e utilitários. React, Router 6, Recharts 2 e Tailwind
  3 mantiveram suas majors. Não foi usado `audit fix --force`.
- Auditoria final no npm padrão: 16 ocorrências (zero críticas, uma alta,
  15 moderadas); `--omit=dev`: oito (uma alta e sete moderadas). O alerta alto
  restante é de Zod, sem uso/import no app e ausente do bundle. Alertas moderados
  dependem de padrões de glob/CSS externos, navegação não confiável ou SSR que
  não existem nos fluxos atuais. A análise detalha condições e revisão futura.
- Workflow com permissões globais vazias, build somente com leitura de conteúdo
  e publicação/OIDC reservados ao deploy; checkout sem persistir credenciais;
  Actions diretas fixadas por SHAs oficiais verificados. Lint, TypeScript,
  unitários e testes de publicação antecedem build/upload/deploy; E2E contra o
  build em push/manual. Mantidos `main`, concorrência `pages` e agenda 03:17.
- A nova preparação recupera e valida o JSON do próprio site. Na falha da Câmara,
  push/manual podem publicar código com esse conjunto completo e sua data
  original; cron com falha não publica. Recuperação inválida/indisponível do
  Pages interrompe o processo, sem fallback silencioso ao checkout antigo.
- A primeira publicação do JSON exige dispatch manual explícito com
  `bootstrap_data=true`, aceito somente diante de HTTP 404 e snapshot oficial
  versionado válido. O JSON remoto ainda retornou 404 na verificação desta
  etapa. Nenhum deploy foi feito para mudar esse estado.
- `.gitignore` protege arquivos de ambiente/credenciais e preserva exemplos.
  O JSON oficial de 04/11 permanece byte por byte inalterado. Nenhum backend,
  dado fictício, autenticação, banco ou nova funcionalidade política foi criado.
- Verificações desta etapa: instalação limpa pelo lockfile com scripts
  desativados aprovada; 79 unitários e 27 testes de coleta/publicação aprovados;
  lint e TypeScript aprovados; builds padrão/subcaminho aprovados; 27 E2E no
  build padrão e 27 no subcaminho aprovados em Edge, incluindo duas verificações
  por ambiente do JSON oficial sem mocks e regressão de fontes/histórico.
  Funcionamento no GitHub Actions/Linux e primeira publicação permanecem
  não verificados. Aviso de bundle grande e limites externos estão documentados.
- O próximo passo é revisar o relatório e os arquivos acumulados. Commit,
  push, configuração remota e deploy continuam dependendo de autorização
  explícita. Não houve participação ou modificação do backend do Nilo.
