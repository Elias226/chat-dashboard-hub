# Projetos de Lei — primeira versão

## Cobertura e pesquisa

`/projetos-de-lei` publica **PL, PEC e PLP apresentados nos últimos sete dias
corridos**, inclusive a data de referência em Brasília. Não é todo o acervo
histórico nem uma lista de todas as propostas em tramitação. A janela avança
somente após coleta completa; início, fim e data da consulta ficam visíveis.

Tipo, número, ano e assunto filtram o conjunto publicado inteiro. Assunto
pesquisa ementa, ementa detalhada e keywords, ignorando caixa e acentos. Todas
as palavras informadas devem estar presentes. Não pesquisa textos integrais.
Inicialmente mostra 20 resultados, com Carregar mais.

Com tipo, número e ano preenchidos, **Pesquisar** consulta a API diretamente,
inclusive para outros períodos (1900–2099). Essa busca exata não combina assunto
e depende de CORS/disponibilidade da fonte. Falha HTTP/rede/timeout é distinta
de uma resposta oficial válida sem resultados. Ausência no recorte nunca é
apresentada como ausência no acervo completo.

## Endpoints e semântica verificados

Fonte: [documentação oficial](https://dadosabertos.camara.leg.br/swagger/api.html)
e [especificação](https://dadosabertos.camara.leg.br/api/v2/api-docs).

- `/proposicoes?siglaTipo=PL,PEC,PLP&dataApresentacaoInicio=AAAA-MM-DD&dataApresentacaoFim=AAAA-MM-DD&itens=100&ordem=ASC&ordenarPor=id`:
  recorte por apresentação. `dataInicio/Fim`, que não usamos, filtram tramitação.
- `/proposicoes?siglaTipo=PL&numero=2630&ano=2020&itens=100&ordem=ASC&ordenarPor=id`:
  exemplo de consulta exata. Segundo a documentação, `ano` afasta a restrição
  padrão de movimentação nos últimos 30 dias; não se adiciona esse filtro.
- `/proposicoes/{id}`: identificação, ementas, keywords, apresentação e
  `statusProposicao` (situação, data/hora, órgão, descrição e despacho).
- `/proposicoes/{id}/autores`: nomes de pessoas ou instituições; pode incluir
  proponentes e apoiadores, conforme a documentação. Sem contatos/CPF.
- `/proposicoes/{id}/tramitacoes`: histórico retornado pela fonte. Sua
  representação é descrita como provisória pela Câmara.

Todos os links `next` são seguidos, inclusive nos endpoints adicionais quando
fornecidos. Conserva filtros omitidos e recusa alteração de escopo, host externo,
ciclo, sequência ambígua e totais inconsistentes. Na listagem do recorte exige
`X-Total-Count` e igualdade com os IDs únicos. Duplicatas conflitantes, total
incompatível e campos essenciais inválidos impedem a publicação.

Limite de segurança: 250 proposições no recorte, **sem truncamento silencioso**.
Excedê-lo preserva a publicação anterior com sua data. Não se baixa todo o
histórico: somente os registros da janela e suas próprias tramitações.

Fichas oficiais: `https://www.camara.leg.br/proposicoesWeb/fichadetramitacao?idProposicao={id}`.
Apresentação, aprovação em comissão/Casa e norma publicada são etapas distintas.
A interface não infere conversão em lei, vigência ou sanção a partir de uma
descrição de andamento. PEC tem rito próprio, sem sanção presidencial. Campos
ausentes são identificados, sem avaliações sobre autores ou propostas.

## Arquitetura e atualização

`public/data/proposicoes.json` contém o recorte com detalhes, autoria e histórico.
É carregado sob demanda, a partir de `BASE_URL`, e não integra o JavaScript
inicial. Pesquisa e detalhes do recorte não consultam a Câmara no navegador.
React Query compartilha o arquivo por cinco minutos. Buscas exatas e detalhes
externos também têm cache de cinco minutos e cancelamento de navegação.
Histórico mostra 20 eventos por vez, com Carregar mais tramitações.

O workflow Pages existente executa `proposals:prepare` e `proposals:validate`
depois dos deputados. Mantém agenda **03:17 em Brasília**, concorrência `pages`,
permissões mínimas e um único artefato. Sem commits automáticos ou segundo
workflow. Uma falha anterior na preparação de deputados ainda pode parar o job.

O coletor usa Node 22 e `camaraHttp.ts`: até três tentativas transitórias por
URL, Retry-After, 20 segundos por tentativa e orçamento total de cinco minutos.
Até três proposições são processadas em paralelo; os três endpoints de cada
uma são sequenciais. Não há dependências novas, banco ou participação do backend.

O arquivo só é substituído por renomeação após validar registros, datas, janela,
totais, recibos e SHA-256 do payload. Hash não é assinatura da Câmara. Endpoints
e páginas sucessivos não constituem uma transação simultânea da base.

Na preparação, recupera-se primeiro o último JSON publicado e validado. Falha
de coleta mantém esse conjunto, registra warning/resumo no Actions e permite
publicar outros dados/código válidos. A data antiga permanece visível. Falha de
recuperação/validação do JSON anterior interrompe a publicação; não retorna
silenciosamente a um arquivo mais antigo do checkout.

Inicialização do novo módulo: **somente HTTP 404 em dispatch manual com
`bootstrap_data=true`** permite usar o snapshot oficial validado do repositório,
reutilizando a entrada já existente no workflow. Rede, HTTP 503 e JSON corrompido
não inicializam. Push/cron ou dispatch sem a opção param com segurança em 404.
O bootstrap dos deputados permanece com suas regras anteriores. Na primeira
publicação deste módulo, integrar o código, conferir o bloqueio esperado do
push e executar o workflow na main com essa opção. Publicações seguintes usam
o padrão false. A ativação remota continua dependendo de autorização do usuário.

## Comandos e testes

```text
npm run proposals:update     # coleta oficial completa e gravação atômica
npm run proposals:validate   # valida sem rede
npm run proposals:prepare    # rotina do Pages
npm run test:data            # coletor/publicação com simulações
npm test
npm run lint
npm run typecheck
npm run build
```

`RUN_PUBLISHED_LIVE=1` habilita o E2E do JSON oficial servido, sem mocks nem
chamadas à API no navegador. `RUN_PROPOSALS_LIVE=1` habilita o teste real opcional
PL 2630/2020. O CI não depende da disponibilidade dessa consulta externa opcional.
Simulações ficam exclusivamente nos testes. Resultados finais de CI, deploy e
validação pública são apresentados no relatório da tarefa.

## Evidência inicial — 14/11/2026

Coleta oficial concluída às **22:41:12 em Brasília**; janela **08–14/11/2026**:
70 IDs únicos, todos com os três endpoints adicionais concluídos. Arquivo de
126.101 bytes. SHA-256:
`ee19d701e45107dc51470059f73f9e9de9bf3e4aad4236ef10eece0692d7e558`.
Totais são evidências datadas, não constantes ou contagens presumidas.

Listagem, detalhe, autores e tramitações do PL 2630/2020 responderam HTTP 200
com CORS `*` nas sondagens. A busca e os detalhes também passaram no navegador
Edge contra o build com subcaminho. Isso não garante disponibilidade futura.
O arquivo anual de cerca de 81 MB foi avaliado e não integra o repositório.

## Limitações

- Pesquisa por assunto limitada ao recorte, sem busca semântica/textos integrais.
- Consulta histórica exata e detalhes externos dependem da Câmara; falhas
  oferecem nova tentativa e acesso à ficha oficial, sem dados inventados.
- A janela avança; não há arquivo permanente de todos os snapshots.
- Histórico não é votação nominal nem agrega automaticamente dados do Senado.
- O cron pode atrasar; a data da consulta é a referência efetiva.
- Ampliação de tipos/período exige avaliação futura, não execução automática.
