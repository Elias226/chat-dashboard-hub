# Senado Federal — consulta e indicadores

> Em 15/11/2026, a composição partidária passou a usar um hemiciclo simbólico
> compartilhado com a Câmara; o comparativo ganhou resumos e os dois desenhos.
> Fonte, conjunto, atualização e tabela institucional continuam iguais.
> Consulte [INDICATORS_VISUALS.md](INDICATORS_VISUALS.md) para a metodologia visual.

## Fonte e referência

- [Documentação oficial de senadores em exercício](https://www12.senado.leg.br/dados-abertos/legislativo/parlamentares/senadores-em-exercicio).
- Endpoint: `https://legis.senado.leg.br/dadosabertos/senador/lista/atual.json`.
- Esquema declarado na resposta: `https://legis.senado.leg.br/dadosabertos/dados/ListaParlamentarEmExerciciov4.xsd`.
- [Composição institucional](https://www12.senado.leg.br/institucional/documentos/sobre-o-senado/atividade/composicao).
- [Referência da Câmara para o comparativo](https://www2.camara.leg.br/transparencia/acesso-a-informacao/copy_of_perguntas-frequentes/deputados).

A documentação define a lista como parlamentares atualmente em exercício,
incluindo titulares e suplentes nessa condição. Não é resultado eleitoral nem
cadastro de todos os titulares e suplentes. O endpoint retorna uma lista única,
sem links de paginação; não se agrega a lista de eleitos ou de afastados.

São utilizados `IdentificacaoParlamentar` (código, nome parlamentar, UF,
partido e foto), `Mandato` (código, participação, duas legislaturas e exercícios)
e `Metadados.Versao`. Não são retidos e-mail, telefone, data de nascimento ou
demais dados pessoais desnecessários. O perfil oficial é construído no padrão
verificado `https://www25.senado.leg.br/web/senadores/senador/-/perfil/{id}`.
Fotos legadas HTTP do caminho oficial são convertidas para HTTPS e validadas
por host/caminho exatos. Falha de foto mostra o ícone existente, sem imagem fictícia.

## Exercício, mandato e transição

Cada registro precisa ter um exercício que inclua o dia da coleta em Brasília.
Períodos de exercício futuros são ignorados na seleção do exercício vigente;
se não houver exercício vigente, a coleta é recusada. O mandato da cadeira
também deve abranger essa data. O período do mandato não é o tempo individual
do suplente: substituição não cria outro mandato de oito anos.

Não há filtro fixo para a eleição de 2026 nem nomes promovidos automaticamente
em fevereiro de 2027. A mesma lista oficial é consultada novamente. Novos
mandatos só entram se estiverem vigentes e em exercício na nova coleta. Uma
publicação antiga continua validada contra sua data original; a interface
adverte quando ela atravessa o fim de um exercício, mandato ou legislatura.
Essa regra é baseada nas datas retornadas, não em uma lista manual de eleitos.

## Integridade e atualização

`public/data/senadores.json` contém versão, origem, referência, data UTC,
metadado da fonte, registros institucionais e SHA-256. O validador é compartilhado
entre navegador, coleta e publicação. Hash detecta alteração, não é assinatura
do Senado. IDs de pessoas e de mandatos precisam ser únicos; duplicatas idênticas
por pessoa são deduplicadas, conflitos são recusados.

Proteção conservadora de completude: exige 81 cadeiras, três por UF, conforme
a composição constitucional e a resposta real observada. **Não cria registros
para completar o total.** Resposta parcial, campos essenciais inválidos, futuro
em vez de exercício atual ou contagem diferente interrompem a atualização.
Se a fonte refletir uma vacância real, essa regra também recusará a nova coleta:
será necessária revisão documentada, sem preencher vagas com dados inventados.

O cliente HTTP existente é reutilizado, com até três tentativas transitórias,
Retry-After, 20 segundos por tentativa e limite total de 70 segundos. Só uma
resposta de lista é necessária. A gravação é temporária e renomeada após validar.

O workflow Pages existente acrescenta `senators:prepare` e `senators:validate`.
Mantém agenda 03:17 em Brasília, grupo de concorrência `pages` e permissões
mínimas. Sem novos workflows, commits automáticos, dependências ou backend.
As etapas anteriores de deputados/proposições ainda podem impedir o job inteiro.

A preparação recupera primeiro o JSON publicado e validado. Falha de coleta
mantém esse conjunto com a data original e gera warning/resumo. Coleta parcial,
anterior ou conflitante não substitui a publicação. Falha de recuperação ou de
integridade da publicação anterior interrompe o deploy. A inicialização exige
HTTP 404 e dispatch explícito com `bootstrap_data=true`; push/cron não inicializam.

## Interface e indicadores

Sem item adicional no menu principal:

- `/parlamentares`: opção padrão Deputados Federais.
- `/parlamentares?casa=senado`: pesquisa e filtros combinados sobre todos os
  registros, usando os filtros existentes, fotos e carregamento de 20 em 20.
- `/parlamentares/senadores/{id}`: perfil institucional publicado, sem API ao abrir.
- `/graficos`: gráficos atuais da Câmara preservados.
- `/graficos?casa=senado`: barras por partido reutilizando Recharts e o componente
  existente; tabela com percentuais cujo denominador é explicitamente o total
  de cadeiras validado do arquivo. Arredondamentos podem não somar 100%.
- `/graficos?casa=comparativo`: tabela institucional, sem comparar quantidades
  brutas como medida de qualidade/poder e sem misturar datas das duas fontes.

Os períodos de mandato são agrupados em tabela educativa, não em outro gráfico
redundante. Não há votação, gasto, ranking, recomendação ou projeção eleitoral.
Falha de uma fonte no comparativo não inventa seu total nem apaga os fatos
institucionais estáticos, cujas referências ficam disponíveis.

O JSON é buscado do próprio site com `BASE_URL`, inclusive no subcaminho, somente
ao abrir uma opção que usa o Senado. React Query compartilha cache de cinco
minutos. Fotografias têm carregamento adiado; não ficam no repositório.

## Comandos e evidências

```text
npm run senators:update
npm run senators:validate
npm run senators:prepare
npm run test:data
npm test
npm run lint
npm run typecheck
npm run build
```

`RUN_PUBLISHED_LIVE=1` inclui E2E do JSON oficial servido em navegador novo,
sem simular dados e sem consultar a API no navegador. Testes unitários, de
falhas, transição e publicação usam fixtures exclusivamente nos testes.

Coleta inicial real: **14/11/2026 às 23:17 em Brasília**, 81 IDs de pessoas e
81 mandatos, três por UF, incluindo suplentes em exercício. Períodos observados:
2019–2027 e 2023–2031. Arquivo de 35.183 bytes; SHA-256 inicial:
`7d1f7c12fc8f7d0e44b2b4958e7974719d32b498c143646365b5f17ead35dedb`.
São evidências datadas da coleta, não dados de eleições presumidos. O link de
perfil e uma fotografia oficial também foram verificados em HTTPS.

Na validação local passaram lint, TypeScript, 132 unitários, 40 testes de
coleta/publicação, builds padrão/subcaminho e 43 E2E; uma consulta externa
opcional de proposições ficou desativada. O teste real do Senado usou o arquivo
oficial servido, sem API no navegador. Resultados remotos e data final publicada
são registrados no relatório da tarefa; a próxima execução real do cron é futura.

Limitações externas: disponibilidade da fonte, imagens e horário não exato do
Actions. Datas continuam sendo essenciais para interpretar snapshots antigos.
O backend, Render e a pendência anterior do chatbot não participam desta etapa.
