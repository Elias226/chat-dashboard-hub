# Indicadores — apresentação e metodologia visual

Atualização: 15/11/2026. Esta etapa muda a apresentação, sem novas fontes,
coletas, dependências ou alterações no backend.

## Composição partidária

- Câmara e Senado usam o mesmo componente SVG. **Um círculo corresponde a um
  parlamentar do conjunto completo validado**, agrupado pela sigla registrada.
- Os grupos seguem ordem alfabética no hemiciclo. Os pontos são distribuídos em
  arcos concêntricos por um cálculo geométrico, sem coordenadas de assentos reais
  ou classificação ideológica. A tabela mantém a ordenação do agrupamento
  existente (quantidade decrescente, desempate alfabético).
- Uma paleta compartilhada identifica a mesma sigla nas duas Casas. Acentos e
  caixa são normalizados; PODE/PODEMOS compartilham a cor. As cores não são
  oficiais nem representam alinhamento político; siglas novas recebem cor
  determinística. Legendas e tabelas permitem leitura sem depender da cor.
- Hover, clique e botões de legenda destacam um partido; os botões também
  funcionam por teclado. Não há centenas de pontos no percurso de Tab.
- Quantidade e percentual são calculados sobre o total **da respectiva Casa na
  publicação**, identificado na interface. Arredondamentos podem não somar 100%.
  Os dois desenhos têm enquadramento próprio: tamanho de círculos não compara
  poder, importância ou desempenho entre Casas.
- O cálculo valida contagens e admite até 2.000 pontos, acima das composições
  atualmente suportadas. Os validadores dos dados continuam sendo aplicados
  antes da renderização. Testes verificam contagens exatas e ausência de
  sobreposição na composição de 513 cadeiras.

## Estados e comparação

O lollipop conserva todos os valores e a ordem alfabética das UFs. Cada linha
tem rótulo e quantidade visíveis, escala linear de zero ao maior valor e tabela
alternativa. Não há normalização por população ou inferência de desempenho.

O comparativo inclui, para cada Casa, total do conjunto, partidos representados,
maior bancada (todos os empates) e data da consulta em Brasília. Registros sem
partido continuam no total, mas não contam como um partido ou maior bancada.
Datas diferentes não são apresentadas como fotografia simultânea das Casas.
As referências e a tabela institucional anterior foram preservadas.

## Dois indicadores de proposições

A seção recolhível usa exclusivamente `data/proposicoes.json`, a mesma consulta
e cache da pesquisa. O JSON só é solicitado quando a seção é aberta, sem acesso
à API da Câmara. Reabrir reutiliza o cache existente.

1. Contagem por PL, PEC e PLP.
2. Contagem por dia de apresentação dentro do período publicado, em ordem
   cronológica, usando a data registrada na Câmara, sem conversão de fuso.

O período e a data da consulta são exibidos. Trata-se somente do **recorte
recente completo publicado**, atualmente sete dias, nunca de todo o acervo.
Zero significa ausência de registros naquele tipo/dia no recorte validado;
não mede toda a atividade parlamentar. Não se infere aprovação ou conversão
em lei. Erro de carregamento não produz contagens substitutas e não impede os
indicadores das Casas. Para a política de atualização, veja
[PROPOSALS_DATA.md](PROPOSALS_DATA.md) e [DATA_UPDATES.md](DATA_UPDATES.md).

## Acessibilidade, desempenho e verificação

Fontes oficiais e datas permanecem em cada gráfico. Tabelas usam títulos e
cabeçalhos semânticos; legendas têm foco visível e estado de seleção. Telas
menores mantêm legenda textual e tabela, pois os pontos da Câmara ficam menores.

SVG/CSS dispensam uma biblioteca nova. Recharts e seus componentes antigos
continuam no repositório, mas deixaram de ser importados nesta página. O build
principal passou de aproximadamente 815 kB para 445 kB de JavaScript não
comprimido nesta etapa; o peso pode variar em builds posteriores.

Testes novos cobrem geometria, agrupamento, cores, percentuais, empates,
teclado, lollipop, comparação, carregamento sob demanda, falhas e largura
reduzida. As respostas controladas ficam exclusivamente nos testes. Os testes
`*-live` usam os JSONs oficiais publicados no build, sem simular a fonte;
a verificação pública após deploy deve ser registrada separadamente no
relatório final. Nenhum teste desta etapa comprova geração de IA no backend.

Validação local repetida em 15/11/2026: lint e TypeScript sem erros,
`npm run test:ci` com 148 testes unitários e 40 de coleta aprovados, três
validadores de JSON aprovados, builds padrão e com `/chat-dashboard-hub/`
aprovados. `npm run test:e2e:pages` no Edge, com `RUN_PUBLISHED_LIVE=1`,
teve 49 aprovados e um ignorado (consulta opcional direta à API da Câmara).
O build com subcaminho gerou 445,34 kB de JavaScript principal (136,88 kB gzip),
comparado a 815.425 bytes medidos no JavaScript público anterior à publicação.
Os testes de envio ao chatbot usam respostas simuladas, sem acionar IA real.
