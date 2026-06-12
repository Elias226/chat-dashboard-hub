# Chat Politico

Dashboard conversacional para explorar temas politicos, organizar conversas e visualizar graficos sobre PECs, votacoes e indicadores relacionados.

Aplicacao publicada em:

```txt
https://elias226.github.io/chat-dashboard-hub/
```

## Tecnologias

- Vite
- React
- TypeScript
- Tailwind CSS
- shadcn/ui
- Recharts
- React Router
- Vitest
- Playwright

## Como rodar localmente

Requisitos:

- Node.js 22 ou superior
- npm

Instale as dependencias:

```sh
npm install
```

Para executar testes end-to-end pela primeira vez, instale os navegadores do Playwright:

```sh
npx playwright install
```

Inicie o servidor de desenvolvimento:

```sh
npm run dev
```

O servidor local usa a porta `8080` por padrao.

## Backend

O chat consulta o backend do projeto `chatbot-politico` pelo endpoint:

```txt
https://chatbot-politico.onrender.com/chat
```

Para usar outro backend em desenvolvimento ou producao, defina:

```sh
VITE_CHAT_API_URL=https://seu-backend.com/chat
```

## Scripts

```sh
npm run dev       # inicia o ambiente de desenvolvimento
npm run build     # gera o build de producao em dist
npm run preview   # abre um preview local do build
npm run lint      # executa a analise estatica
npm run test      # executa os testes unitarios
npm run test:e2e  # executa os testes end-to-end com Playwright
```

## Deploy

O deploy e feito pelo GitHub Actions usando o workflow:

```txt
.github/workflows/deploy.yml
```

Ao enviar alteracoes para a branch `main`, o workflow:

1. Instala as dependencias com `npm ci`.
2. Gera o build com `npm run build`.
3. Publica a pasta `dist` no GitHub Pages.

## Observacoes

- O backend precisa expor um endpoint `POST /chat` que receba `{ "message": "..." }` e retorne `{ "reply": "..." }`.
- Alguns graficos usam dados estaticos de exemplo.
- O historico de conversas fica salvo no `localStorage` do navegador.
