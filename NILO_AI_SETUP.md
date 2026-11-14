# IA do Chat Político — diagnóstico e instruções para revisão do Nilo

Verificação de 14/11/2026. Este documento é uma proposta, não uma alteração no
backend nem confirmação de IA ativa. Nenhuma chave, conta, configuração do
Render ou arquivo do repositório do Nilo foi alterado.

## O que foi confirmado

Código público examinado: [backend no commit a6f9c9a](https://github.com/NiloJereissati/chatbot-politico/tree/a6f9c9a805e0738efa9ec4478154889df0f8e574).

- `POST /chat` recebe apenas `{ message }`; devolve `reply`, `intent`,
  `sources: [{ title, url }]` e `mode`. O frontend também aceita `fulfillmentText`.
- `services/ai.js` já integra a OpenAI por `POST /v1/responses`, sem SDK.
  O modelo padrão é `gpt-5-mini`, substituível por `OPENAI_MODEL`.
- `deveUsarIAControlada`, em `server.js`, exige `dados`, fontes e uma intenção
  diferente de `Fallback`. `AI_ENABLED=false` desativa essa etapa. Sem
  `OPENAI_API_KEY`, `gerarRespostaComIA` retorna `null`.
- As respostas educativas prontas não têm `dados` nem fontes e não passam pelo
  gate de IA. O fallback também não passa. Configurar uma chave **não resolve
  essas perguntas abertas por si só**.
- O reconhecimento de templates usa `includes`. Uma pergunta comparativa que
  contém “projeto de lei” pode receber só a definição pronta dessa expressão.
- `mode: ai` só é atribuído quando a integração devolve texto não vazio.
  Falhas do provedor são capturadas e registradas no servidor, mas o cliente
  recebe `mode: template` sem uma causa. Esse modo também representa respostas
  estruturadas com dados oficiais, não apenas explicações educativas prontas.
- A chamada ao provedor não tem timeout explícito. O limite atual é de 450
  tokens de saída; erros HTTP, resposta vazia ou saída incompleta podem levar
  à resposta de base. A causa em produção não pode ser determinada só pelo modo.
- `/health` comprova apenas que o serviço responde; não informa commit,
  credenciais, disponibilidade do modelo nem prontidão de IA.

## Testes reais, sem mocks, antes das melhorias do frontend

Executados no site público em Edge novo; apenas quatro POSTs, sem chamadas
diretas ao provedor ou acesso a credenciais.

| Pergunta | HTTP / modo | Intenção e resultado |
| --- | --- | --- |
| Explique de maneira simples a diferença entre uma PEC e um projeto de lei. | 200 / template | `ExplicarProjetoLei`: só a definição pronta de projeto de lei. |
| Como funciona o processo de aprovação de uma lei federal no Brasil? | 200 / template | `Fallback`: pergunta não compreendida. |
| Qual é a diferença entre as funções de um deputado federal e de um senador? | 200 / template | `Fallback`: pergunta não compreendida. |
| Quem é Lula? | 200 / template | `BuscarPerfilOficial`: dados de perfil e link do Planalto; caminho elegível à IA pelo código público. |

Os quatro textos foram exibidos e o histórico permaneceu após recarga.
Nenhum resultado comprova geração por IA. O código público pode diferir do
deploy: não houve acesso ao painel ou aos logs privados do Render. O perfil
testado é estático no backend; não serve como evidência de atualização atual
do cargo ou de consulta recente à fonte.

## Ação 1 — Nilo: conferir a integração já existente

1. Confirmar qual commit está implantado no Render e verificar os logs privados
   da chamada elegível já testada. Não repetir muitas consultas ao modelo.
2. Conferir **somente no ambiente do backend**:
   - `AI_ENABLED`: `false` impede IA; definir `true` se a ativação for desejada.
   - `OPENAI_API_KEY`: deve existir, ser válida, privada e pertencer ao projeto
     autorizado. Não enviar seu valor por mensagem, GitHub ou variável `VITE_*`.
   - `OPENAI_MODEL`: conferir disponibilidade e acesso na conta; não presumir
     que o padrão do código esteja acessível ou que a conta tenha saldo.
   - `ALLOWED_ORIGIN`: se restringida, a origem do frontend é
     `https://elias226.github.io`, sem o subcaminho do projeto.
3. Diferenciar chave ausente/desativação, autenticação, modelo inacessível,
   quota, limite de requisições, timeout e saída vazia/incompleta. Não existe
   evidência pública suficiente para afirmar qual desses casos ocorre hoje.
4. Em `services/ai.js`, acrescentar timeout que também cubra o corpo da resposta,
   verificar `status`, `incomplete_details` e texto não vazio. Limitar custo de
   entrada/saída e configurar esforço de raciocínio conforme o modelo escolhido;
   **não aumentar indiscriminadamente os tokens**. `max_output_tokens` inclui
   tokens de raciocínio, podendo acabar antes de produzir texto visível.
5. Registrar somente códigos/categorias de falha e identificadores necessários;
   não registrar Authorization, chaves, perguntas privadas ou corpos brutos do
   provedor. Manter a resposta de base caso a geração falhe.

Referências: [Responses API](https://developers.openai.com/api/reference/resources/responses/methods/create),
[limites de saída e raciocínio](https://developers.openai.com/api/docs/guides/reasoning).

## Ação 2 — Nilo: menor proposta para perguntas abertas fundamentadas

Reaproveitar `gerarRespostaComIA`, sem outro servidor, banco, login ou alteração
do corpo enviado pelo frontend.

- Adicionar uma pequena base institucional revisada no backend, com trechos de
  documentos oficiais, URL, data de revisão e limites de cobertura. Começar
  pelas diferenças entre PEC/lei, tramitação legislativa e funções das Casas.
  Fontes possíveis: Constituição e material educativo da Câmara/Senado. Um URL
  sozinho não é conteúdo recuperado nem comprovação de que uma afirmação existe
  na fonte. Nilo deve conferir os textos antes de incluí-los.
- Selecionar os trechos pertinentes à pergunta e retorná-los como `dados`, com
  fontes e uma resposta de base conservadora. Encaminhar a pergunta original e
  esse contexto à integração já existente para produzir uma explicação.
- Fazer esse caminho educativo tratar perguntas comparativas/abertas antes do
  casamento amplo de templates. Preservar a prioridade das consultas específicas
  com identificador e dos serviços oficiais existentes. Não transformar qualquer
  fallback em pedido irrestrito ao modelo e não inventar fatos quando não houver
  contexto confiável. Temas sem cobertura devem ser identificados como tal.
- Preservar o contrato atual: fontes vêm da seleção oficial do backend, não de
  URLs inventadas pelo modelo; `mode: ai` somente após geração bem-sucedida e
  texto completo; `mode: template` em fallback. O frontend já aceita ambos.
- Antes de expor uma chave com cobrança em um endpoint público, limitar tamanho
  de mensagem e frequência de consultas e controlar quota no provedor. O cliente
  não reenvia automaticamente, mas isso não protege o backend de outros clientes.

Aceite mínimo para Nilo: testar as três perguntas abertas acima com geração
efetiva, contexto oficial e fontes, sem simples retorno do template; testar chave
ausente, indisponibilidade, limite, saída incompleta, pergunta fora do escopo e
tentativas de substituir as instruções. Usar mocks para falhas e poucas chamadas
reais para comprovação. Confirmar `mode: ai` junto com o resultado do provedor
nos logs privados, sem publicar dados sensíveis.

## Gratuidade, custos e segurança

- O modelo padrão do código, `gpt-5-mini`, não oferece a faixa Free na
  [documentação consultada](https://developers.openai.com/api/docs/models/gpt-5-mini).
  A [API é tarifada](https://developers.openai.com/api/docs/pricing). Não foi
  adicionado faturamento, criada chave ou contratado serviço. Créditos/saldo
  existentes e autorização de uso devem ser conferidos pelo proprietário.
- Se a exigência for custo zero e não houver créditos autorizados, **não ativar
  cobrança**. Uma alternativa para Nilo avaliar é um adaptador server-side para
  um modelo com [camada gratuita da Gemini API](https://aistudio.google.com/docs/pricing),
  conforme disponibilidade, quotas e termos de tratamento de dados da conta.
  Isso exige mudança de backend; não está implementado nem testado aqui.
  Manter o mesmo contrato HTTP e as mesmas exigências de fundamentação.
- O plano gratuito do Render pode reiniciar após inatividade e demorar para
  responder: [limitações oficiais](https://render.com/docs/free). O plano real
  desta conta não foi consultado. O timeout de 90 segundos do frontend limita
  a espera do visitante; cancelar essa espera **não garante** cancelamento ou
  ausência de custo de uma geração já iniciada no servidor.
- A árvore pública do backend contém `.env`, apesar de estar no `.gitignore`.
  **Valores não foram lidos, copiados ou testados.** Nilo deve inspecioná-lo de
  forma privada, revogar/rotacionar quaisquer segredos que tenham sido expostos,
  remover o arquivo do versionamento e avaliar o histórico em coordenação com
  os colaboradores. Só adicionar ao `.gitignore` não remove conteúdo já rastreado.
  Não foi realizada limpeza de histórico nem operação destrutiva.

## O que o frontend entrega nesta etapa

Perguntas são enviadas sem reescrita, com o mesmo `{ message }`. Respostas IA,
templates/fallbacks e modos desconhecidos são diferenciados visualmente; o modo
é uma declaração do serviço, não uma auditoria independente da geração. Erros
locais têm identificação própria e nova tentativa apenas por clique. Há aviso
de carregamento, mensagem de demora após 12 segundos e prazo total de 90 segundos,
incluindo a leitura do corpo. Não há retries automáticos ou credenciais novas.
Histórico, sugestões, fontes seguras e demais páginas permanecem preservados.

**Pendência concreta:** Nilo precisa conferir a configuração privada e ampliar
o roteamento educativo no backend. O frontend não pode ativar ou comprovar uma
capacidade que o endpoint atual não disponibiliza para as perguntas abertas.
