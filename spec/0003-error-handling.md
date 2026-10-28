---
id: 0003
title: Tratamento de erros (front e back): contrato único, boundaries, i18n, rotas de API
status: implemented
layers: [front, back]
owner: Thiago Morgado
created: 2026-10-27
approved_by: Thiago Morgado
approved_at: 2026-10-27
---

# 0003 — Tratamento de erros

## 1. Contexto e problema
Hoje cada Server Action devolve (ou lança) uma coisa diferente, não há nenhuma boundary de erro no app (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx` não existem: `find src` retornou vazio) e há **vazamento de mensagem interna** em `createOrder`. O usuário vê a página de erro padrão do Next em qualquer falha (ex.: banco fora do ar) e erros de validação viram exceções não tratadas.

## 2. Objetivos e não-objetivos
**Objetivos**
- Um contrato único de resultado/erro para Server Actions e rotas `src/app/api/*`.
- Mapeamento de erros Prisma/Zod/Auth/rede para **códigos estáveis**; mensagens i18n pt-BR/en/es no cliente; nenhum detalhe interno ao usuário.
- Logging estruturado no servidor, sem PII.
- Boundaries (`error.tsx`, `global-error.tsx`, `not-found.tsx`, `loading.tsx` onde faz sentido) e padrão de exibição (inline em formulários, toast em ações pontuais).
- Estratégia de teste (vitest) para cada código/estado.
**Não-objetivos**
- Serviço de monitoramento externo (Sentry etc.): só o ponto de integração (`logError`) fica pronto. Dependência = pergunta 4.
- Reescrever a lógica de negócio das actions (só a casca de erro).
- Fluxo de login (spec 0002 usa este contrato).

## 3. Estado atual (evidências)
| # | Onde | Situação | Problema |
|---|---|---|---|
| 1 | `actions/auth.ts:15-31` | retorna `string \| undefined`; tudo que é `AuthError` → "Email ou senha inválidos." | mistura erro de credencial com falha de infraestrutura |
| 2 | `actions/orders.ts:52-54` | `catch (e) { return { error: e instanceof Error ? e.message : … } }` | **vaza mensagens internas** (inclusive de Prisma: nomes de tabela/colunas) ao cliente; só as mensagens de negócio ("Estoque insuficiente…") deveriam passar |
| 3 | `actions/posts.ts:19`, `products.ts:20`, `categories.ts:16` | `schema.parse(...)` lança `ZodError` | validação inválida = 500 genérico, sem mensagem por campo |
| 4 | `actions/categories.ts:25` (`delete`), `posts.ts`/`products.ts` (`delete`) | sem tratamento de `P2003`/`P2025` | excluir categoria em uso ou registro inexistente = 500 |
| 5 | `actions/guard.ts:5-15` | `redirect()` dentro de action | adequado para navegação, mas o chamador não distingue 401 (não logado) de 403 (papel errado) |
| 6 | `api/upload/route.ts:7-9` | `{ error }` com status 401 para quem está logado sem ser admin | deveria ser 403; formato `{ error: string }` sem código |
| 7 | `api/upload/route.ts:34-37` | `console.error("…", e)` objeto inteiro | pode registrar stack/segredos; sem identificador de correlação |
| 8 | `components/dashboard/image-upload.tsx`, `delete-button.tsx` | `<form action>` sem estado de erro; botão "Excluir" sem confirmação | falha silenciosa; ação destrutiva sem prevenção de erro |
| 9 | App inteiro | sem `error.tsx`/`global-error.tsx`/`not-found.tsx`/`loading.tsx` | página padrão do Next; em 404 de `notFound()` também |
| 10 | `lib/db.ts`, páginas com `force-dynamic` | consulta falha ⇒ exceção na renderização | sem fallback; só a boundary resolveria |
| 11 | `actions/newsletter.ts` (spec 0001) | já devolve `{ ok:false, error:"invalid"\|"generic" }` e loga sem PII | modelo a generalizar |
| 12 | Cliente | sem tratamento de offline/timeout em chamada de Server Action | `fetch` falho = erro não capturado / botão preso em "pending" |

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/01-getting-started/10-error-handling.md` | 16.4.3 | Erros **esperados** = valores de retorno com `useActionState`, sem `try/catch` de fluxo; erros inesperados vão a boundaries. | Não |
| `.../03-api-reference/03-file-conventions/error.md` | 16.4.3 | **`error.tsx` recebe `retry()`** (re-busca e re-renderiza) e `reset()` (só limpa estado; "na maioria dos casos use `retry`"). `error.digest` casa com logs do servidor; em produção a mensagem de erro de Server Component é genérica. `error.tsx` **não** envolve o layout do mesmo segmento. | **Sim:** eu usaria `reset`. Usar `retry`. |
| mesmo arquivo + guia (l.399-440) | 16.4.3 | `global-error.tsx` precisa de `<html>`/`<body>` próprios; trata erro do layout raiz. | Não |
| `.../04-functions/catchError.md` | 16.4.3 | Existe `catchError` para boundaries de componente (fora de segmento). **Não li a assinatura completa**; ler na impl. | A confirmar |
| `.../03-file-conventions/forbidden.md`, `unauthorized.md`, `.../05-config/01-next-config-js/authInterrupts.md` | 16.4.3 | `forbidden()`/`unauthorized()` são **experimentais** (exigem `authInterrupts`). | Sim: **não usar**; manter `redirect()` + códigos. |
| `.../01-getting-started/10-error-handling.md` ("Not found") | 16.4.3 | `notFound()` + `not-found.tsx`. | Não |
| `.../02-guides/forms.md` | 16.4.3 | Padrão de formulários com Server Functions (a reler na impl.). | A confirmar |

## 5. Alternativas
### 5.1 Contrato de erro
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Manter formatos atuais | 0 custo | Inconsistente, vaza mensagens |
| B | **Resultado tipado `Result<T>` = `{ ok:true, data } \| { ok:false, error:{ code, fieldErrors? } }`; mensagem = tradução do `code` no cliente** | Simples, i18n natural, testável, alinhado ao guia do Next | Refatorar chamadores |
| C | Lançar exceções tipadas e capturar em boundary | Menos código por action | Contraria o guia (erros esperados não lançam); `error.message` some em produção |
| D | Biblioteca (neverthrow, next-safe-action) | Pronta | Dependência nova; `next-safe-action` acopla a forma |
**Recomendação: B.** Rejeitadas: A, C (UX e segurança), D (dependência sem necessidade).

**Forma proposta (`src/lib/result.ts`)**
```ts
export type ErrorCode =
  | "VALIDATION"      // 422  fieldErrors presente
  | "UNAUTHENTICATED" // 401
  | "FORBIDDEN"       // 403
  | "NOT_FOUND"       // 404
  | "CONFLICT"        // 409  duplicado / estoque / FK em uso
  | "RATE_LIMITED"    // 429
  | "UNAVAILABLE"     // 503  serviço externo (Azure) / banco indisponível
  | "INTERNAL";       // 500
export type ActionError = { code: ErrorCode; fieldErrors?: Record<string, ErrorCode | string>; detailCode?: string };
export type Result<T = void> = { ok: true; data: T } | { ok: false; error: ActionError };
```
`detailCode` = código de negócio específico (ex.: `OUT_OF_STOCK`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`) para mensagens mais úteis; **nunca** texto livre. Mensagem exibida = `t("error." + (detailCode ?? code))`.

### 5.2 Onde mapear exceções
| # | Opção | Contras |
|---|---|---|
| A | try/catch em cada action | Duplicação e esquecimento |
| B | **Wrapper `defineAction(handler)`** que: valida (Zod), executa, converte `ZodError`/`Prisma*Error`/`AuthError`/`RedirectError` em `Result`, registra o erro inesperado com `digest`, e **relança** `NEXT_REDIRECT`/`NEXT_NOT_FOUND` | Uma abstração nova (usada por ≥6 actions = repetição real) |
| C | `withErrorHandling` só em volta do `db` | Não cobre Zod/Auth |
**Recomendação: B.** Rejeitada: A (repetição), C (parcial).

### 5.3 Exibição no front
| # | Opção | Quando usar |
|---|---|---|
| Inline | erro por campo (`ControlledInput`) + `role=alert` geral no formulário | `VALIDATION`, `CONFLICT` em forms, `RATE_LIMITED` |
| Toast (sonner, já instalado) | ações sem formulário (excluir, adicionar ao carrinho, upload) | `NOT_FOUND`, `CONFLICT`, `UNAVAILABLE`, `INTERNAL` |
| Boundary | falha de renderização/dados | `error.tsx` |
| Redirect | `UNAUTHENTICATED` → `/login?callbackUrl=…` | proxy/layout/guard |
**Recomendação:** tabela da seção 6.1 define qual para cada código. Sem alternativa de fachada: é o que o projeto já tem (sonner, `ControlledInput`).

## 6. Design proposto
### 6.0 Referências e direção visual
Sem referência nova; páginas de erro seguem o tema da home (`bg-secondary` faixa, `font-heading`, botão primário). Crítica:
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | **Vazamento de mensagem interna** ao usuário | `orders.ts:52-54` | alta | wrapper (5.2) devolve só `code`; negócio usa `detailCode` |
| 2 | Falhas de validação viram 500 | `posts.ts:19` e similares | alta | `ZodError` → `VALIDATION` com `fieldErrors` |
| 3 | Sem boundaries: página padrão do Next | ver seção 3, item 9 | alta | `error.tsx` por área, `global-error.tsx`, `not-found.tsx`, `loading.tsx` |
| 4 | Ação destrutiva sem confirmação e sem feedback | `delete-button.tsx` | média | `AlertDialog`/confirmação (base-ui `alert-dialog`, shadcn CLI) + toast de resultado |
| 5 | Botão preso em "pending" se a rede cair | cliente sem timeout | média | `useAction` helper com `AbortSignal`/timeout e `navigator.onLine`; mensagem "sem conexão" |
| 6 | 401 vs 403 confundidos em upload | `upload/route.ts:7-9` | média | 401 sem sessão, 403 papel errado |
| 7 | Mensagens de erro hoje só em pt-BR | actions e forms | média | catálogo `error.*` nas 3 línguas |
| 8 | Erro sem como corrigir (ex.: "Carrinho inválido.") | `orders.ts:18` | baixa | mensagens com próxima ação ("Atualize o carrinho e tente de novo") |
| 9 | Páginas de erro: foco e a11y | n/a (não existem) | — | `role=alert`/foco no título, botão "Tentar de novo" ≥44px, link "Voltar ao início", sem stack/mensagem técnica, `digest` visível como "código de suporte" |

### 6.1 Frontend
- **Catálogo i18n**: `error.VALIDATION`, `error.UNAUTHENTICATED`, `error.FORBIDDEN`, `error.NOT_FOUND`, `error.CONFLICT`, `error.RATE_LIMITED`, `error.UNAVAILABLE`, `error.INTERNAL`, `error.NETWORK`, `error.TIMEOUT` + `detailCode`s (`OUT_OF_STOCK`, `EMAIL_TAKEN`, `INVALID_CREDENTIALS`, `FILE_TOO_LARGE`, `FILE_TYPE`, `CATEGORY_IN_USE`…) em `src/lib/i18n.ts` (paridade garantida pelo tipo `Messages`), mais `getErrorMessage(t, error)`.
- **Mapeamento código → UI**
| Código | HTTP equiv. | UI |
|---|---|---|
| VALIDATION | 422 | erro por campo inline + resumo `role=alert`, foco no 1º campo inválido |
| UNAUTHENTICATED | 401 | redirect `/login?callbackUrl=` (path interno, `safeCallbackPath`) |
| FORBIDDEN | 403 | toast "Você não tem permissão" ou, em página, `error`/redirect para `/conta` (hoje `requireAdmin` redireciona) |
| NOT_FOUND | 404 | `not-found.tsx` em páginas; toast em ações |
| CONFLICT | 409 | inline (cadastro: e-mail em uso) / toast (estoque, categoria em uso) |
| RATE_LIMITED | 429 | inline "Muitas tentativas. Tente em alguns minutos." |
| UNAVAILABLE | 503 | toast + "Tentar de novo" |
| INTERNAL | 500 | toast genérico; em render, `error.tsx` com `digest` |
| NETWORK/TIMEOUT | — (cliente) | toast "Sem conexão"/"Demorou demais" + retry; botão volta do pending |
- **Boundaries** (`retry()` conforme doc 16.4.3):
  - `src/app/global-error.tsx` (com `<html>`/`<body>`, textos via cookie de idioma lido no cliente; sem depender dos providers, que não existem quando ele renderiza).
  - `src/app/(public)/error.tsx`, `(home)/error.tsx`, `(private)/dashboard/error.tsx`, `(private)/conta/error.tsx`: componente compartilhado `ErrorView` (title, texto, `digest`, `retry`).
  - `src/app/not-found.tsx` (+ específicos se necessário).
  - `loading.tsx`: `(public)/loja`, `(public)/blog` e dashboard (esqueleto simples) — pergunta 3.
- **Hook** `useServerAction` (client): envolve `startTransition` + timeout + offline, devolve `{ run, pending, error }`; erros de rede viram `NETWORK`/`TIMEOUT`.
- **Responsivo/a11y:** `ErrorView` coluna única `max-w-xl`, 360→1280 sem rolagem horizontal; foco no `h1` ao montar; contraste AA; botões ≥44px; en/es sem quebra.

### 6.2 Backend
- **Wrapper** `defineAction` (`src/lib/action.ts`): `(schema, handler, { auth?: "user"|"admin" })`. Ordem: autenticação/papel (via `guard`) → `schema.safeParse` → handler → mapeamento. Relança `redirect`/`notFound` (detecção por `digest` iniciado em `NEXT_REDIRECT`/`NEXT_HTTP_ERROR_FALLBACK`; **confirmar na doc/fonte do Next ao implementar**).
- **Mapeamento** (`src/lib/errors.ts`, puro e testável):
| Origem | Código |
|---|---|
| `ZodError` | `VALIDATION` + `fieldErrors` por path |
| Prisma `P2002` (unique) | `CONFLICT` (+ `detailCode` conforme alvo: `EMAIL_TAKEN`, `SLUG_TAKEN`) |
| Prisma `P2003` (FK) | `CONFLICT` (`IN_USE`) |
| Prisma `P2025` (não encontrado) | `NOT_FOUND` |
| Prisma `P1001/P1002/P1008/P1017`, `PrismaClientInitializationError` | `UNAVAILABLE` |
| `AuthError` `CredentialsSignin` | `UNAUTHENTICATED` + `INVALID_CREDENTIALS` |
| `BusinessError(detailCode)` (classe própria para regras: estoque, carrinho) | `CONFLICT`/`VALIDATION` conforme a regra |
| Azure/rede (`RestError`, `fetch`) | `UNAVAILABLE` |
| qualquer outro | `INTERNAL` (**mensagem original nunca sai do servidor**) |
- **Logging** (`logError(err, ctx)`): `console.error` JSON com `{ code, name, message, stack, digest/requestId, action, userId? }`; **sem** e-mail, senha, corpo do formulário, connection strings. Para `P2xxx` só `code` e `meta.target` (campo), não valores.
- **Rotas de API** (`src/app/api/*`): helper `jsonError(code, status, init?)` com corpo `{ ok:false, error:{ code } }`; mapa de status: VALIDATION 422 (400 para corpo malformado), UNAUTHENTICATED 401, FORBIDDEN 403, NOT_FOUND 404, CONFLICT 409, RATE_LIMITED 429 + `Retry-After`, UNAVAILABLE 503, INTERNAL 500. Upload: `UNAVAILABLE` (Azure não configurado/falha), `FILE_TYPE`/`FILE_TOO_LARGE` (422), 401 vs 403 separados. `api/auth/[...nextauth]` é do Auth.js: **não tocar**.
- Refatoração das actions: `createOrder` (preservando o padrão: preço/estoque do banco, decremento condicional e transação; `throw new BusinessError("OUT_OF_STOCK")` no lugar de `Error(msg)`), `posts`, `products`, `categories`, `newsletter`, `auth` (spec 0002). `deleteX` passam a devolver `Result` e a UI mostra toast.
- Cache/revalidação: inalterados.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Qualquer action | conforme o guard da action | idem | idem | `defineAction({auth})` chama `requireUser/requireAdmin` **antes** de validar e executar |
| `/api/upload` | 401 | 403 | ✔ | handler |
- Nenhum detalhe interno em respostas (`P2xxx`, stack, SQL, nomes de tabela, connection string, `message` de exceção).
- `digest`/`requestId` como código de suporte: não sensível.
- Enumeração: códigos distintos só onde já é decisão de produto (`EMAIL_TAKEN`, spec 0002); login sempre `INVALID_CREDENTIALS`.
- Rate limiting: `RATE_LIMITED` previsto no contrato; implementação em 0002 (login/cadastro). Para upload/checkout/newsletter: avaliar na impl. (pergunta 5).
- Logs sem PII; teste automatizado garante que e-mail/senha de entrada não aparecem em `console.error`.

## 8. Plano de testes (vitest; banco `loja_blog_test` real)
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `mapError`: ZodError → VALIDATION com `fieldErrors`; P2002/P2003/P2025/P1001 → códigos; desconhecido → INTERNAL | unit | tabela do 6.2 |
| 2 | INTERNAL não contém `message`/stack do original | unit | ok |
| 3 | `defineAction`: não logado → UNAUTHENTICATED/redirect; cliente em ação admin → FORBIDDEN/redirect; admin ok | integração | matriz da seção 7 |
| 4 | Redirect/notFound relançados, não convertidos | integração | sim |
| 5 | `createOrder`: estoque insuficiente → CONFLICT/`OUT_OF_STOCK`; produto removido → NOT_FOUND/CONFLICT; erro de banco simulado (cliente Prisma desconectado) → UNAVAILABLE sem vazar mensagem; carrinho inválido → VALIDATION; 5 pedidos concorrentes do último item → 1 sucesso | integração | sem estoque negativo (preservar padrão) |
| 6 | `posts`/`products`/`categories`: input inválido → VALIDATION + campos; excluir categoria em uso → CONFLICT; excluir inexistente → NOT_FOUND | integração | ok |
| 7 | `logError`: contém `code`/`name`/`stack`; **não** contém e-mail/senha do input | unit | ok |
| 8 | `/api/upload`: sem sessão 401, cliente 403, admin sem Azure 503, tipo inválido 422, grande 422, falha do Azure 503 (Azure mockado, único serviço de terceiros) | integração (handler) | corpo `{ok:false,error:{code}}` |
| 9 | `getErrorMessage`: todo `ErrorCode`/`detailCode` existe nas 3 línguas | unit | paridade |
| 10 | `ErrorView`/`error.tsx`: mostra título, `digest`, botão chama `retry`; foco; sem texto técnico | componente | `getByRole` |
| 11 | `not-found`, `global-error` renderizam com `<html>`/`<body>` e link para home | componente | ok |
| 12 | `useServerAction`: sucesso, erro tipado, rejeição → `NETWORK`, timeout → `TIMEOUT` (timers falsos), `pending` volta a false | componente/unit | ok |
| 13 | Form com erro de campo vindo do servidor mostra mensagem no campo e foca | componente | ok |
| 14 | `DeleteButton`: confirmação, toast de erro/sucesso | componente | ok |
| 15 | Responsivo/axe das páginas de erro 360/768/1280 | e2e (Playwright) | **Playwright não aprovado: declarar não verificado** |

## 9. Plano de implementação
1. `src/lib/result.ts`, `errors.ts` (`BusinessError`, `mapError`), `logError` + testes unitários.
2. Catálogo `error.*` nas 3 línguas + `getErrorMessage` + teste de paridade.
3. `defineAction` + testes de integração (guard, redirect).
4. Refatorar `orders` (preservando transação/estoque) + testes de concorrência.
5. Refatorar `posts`, `products`, `categories`, `newsletter` e chamadores (`useServerAction`, toasts, `DeleteButton` com confirmação).
6. Rotas `api/upload` (`jsonError`) + testes.
7. Boundaries: `ErrorView`, `error.tsx` por área, `global-error.tsx`, `not-found.tsx`, `loading.tsx`.
8. `tsc`, `eslint`, `vitest`, `next build`; verificação manual das páginas de erro (simular falha) e relatório.

## 10. Riscos, rollback e dívidas
- Riscos: refatoração toca todas as actions (testes de regressão primeiro); detecção de `redirect`/`notFound` depende de detalhes do Next (cobrir com teste); `global-error` não tem providers (i18n próprio mínimo); `error.tsx` não captura erro de Server Action disparado em handler de evento (esse vai por `Result`).
- Rollback: por action (commits pequenos); wrapper é aditivo.
- Dívidas: monitoramento externo (Sentry), página `maintenance`, retries automáticos, `forbidden()`/`unauthorized()` quando saírem de experimental.

## 11. Perguntas em aberto (com default)
- [ ] 1. Contrato `Result` com `code` + `detailCode` e mensagens por i18n (5.1-B)? **Default: sim.**
- [ ] 2. Wrapper `defineAction` (5.2-B)? **Default: sim.**
- [ ] 3. `loading.tsx` em loja/blog/dashboard entra agora? **Default: sim, esqueleto simples.**
- [ ] 4. Integração com serviço de monitoramento (Sentry/Application Insights)? **Default: não; só `logError`.**
- [ ] 5. Rate limit também para upload, checkout e newsletter (hoje só login/cadastro na 0002)? **Default: não agora; registrar como dívida.**
- [ ] 6. Confirmação antes de excluir (AlertDialog via shadcn CLI) aprovada? **Default: sim.**
- [ ] 7. Ordem entre specs: 0003 (contrato) antes de 0002 (login) ou juntas? **Default: 0003 primeiro; 0002 consome `Result`.**

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado (N/A: sem migration)
- [ ] Matriz de permissões revisada
- [ ] Crítica de UI/UX avaliada
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
Aprovada por Thiago Morgado em 2026-10-27, via mensagem direta no Claude Code ("aprovar as specs 0002 e 0003 com os defaults"): todas as perguntas em aberto seguem os defaults recomendados da spec. Ordem: 0003 primeiro, a 0002 consome o Result. Registro feito pelo coordenador a pedido expresso do humano. Playwright NÃO aprovado.

## 14. Relatório pós-implementação
Implementada em 2026-10-27 (spec aprovada pelo usuário; defaults da seção 11).

**O que foi feito**
- Contrato `Result<T>` com `code` + `detailCode` + `fieldErrors` (`src/lib/result.ts`), `mapError`/`BusinessError`/`logError` (`src/lib/errors.ts`), wrapper `defineAction`/`defineFormAction` (`src/lib/action.ts`: autenticação/papel -> validação Zod -> handler -> mapeamento; `redirect()`/`notFound()` relançados com `unstable_rethrow`), `jsonError` para rotas (`src/lib/api.ts`), `runWithGuards`/`useServerAction` (offline -> NETWORK, rejeição -> NETWORK, demora -> TIMEOUT), catálogo `error.*`/`confirm.*` nas 3 línguas e `translateError`/`translateFieldError` em `src/lib/i18n.ts`.
- Actions refatoradas: `posts`, `products`, `categories`, `orders` (padrão preservado: preço/estoque do banco, transação e decremento condicional; `BusinessError` no lugar de `Error(msg)`: acabou o vazamento de mensagem interna), `newsletter`, e `auth` (spec 0002). `guard.ts` removido (substituído por `defineAction`).
- Front: formulários de post/produto/categoria com `useActionState` e erro por campo (`FieldMessage`, `aria-describedby`) + resumo `role=alert`; `DeleteButton` com `AlertDialog` (shadcn) e toast; carrinho/checkout via `useServerAction`; `ImageUpload` traduz o erro da API.
- API `/api/upload`: 401 sem sessão, 403 papel errado, 422 (`FILE_TYPE`/`FILE_TOO_LARGE`/corpo inválido), 503 (Azure), corpo `{ ok, error:{ code, detailCode } }`.
- Boundaries: `ErrorView` (`retry()`, foco no título, `digest` como código de suporte), `error.tsx` em `(public)`, `(home)`, `dashboard`, `conta`; `global-error.tsx`; `not-found.tsx`; `loading.tsx` em loja, blog e dashboard (`LoadingSkeleton`).
- shadcn via CLI: `alert-dialog`.

**Testes (vitest, banco `loja_blog_test` real)**: `errors` (mapeamento, não vazar mensagem, logs sem PII, paridade do catálogo nas 3 línguas), `actions-core` (matriz anônimo/cliente/admin, VALIDATION, INTERNAL sem mensagem, redirect relançado), `crud-orders-actions` (posts/categorias, estoque, concorrência de 5 pedidos, banco indisponível sem vazar), `upload-route`, `client-action` (offline, rejeição, timeout, redirect), `error-ui` (ErrorView, global-error, FormError, DeleteButton).

**Desvios**: `vitest.config.mts` ganhou `server.deps.inline` para `next-auth` (importa `next/server` sem extensão). `unstable_rethrow` é API marcada "unstable" na doc 16.4.3, mas é a recomendada para este caso. Playwright não aprovado: páginas de erro **não verificadas visualmente**.

**Pendências**: monitoramento externo (Sentry) fora do escopo; rate limit só em login/cadastro (upload/checkout/newsletter: dívida); `forbidden()`/`unauthorized()` seguem experimentais (não usados).

**Adendo (2026-10-28): toasts de autenticação**
O mecanismo de toast é o mesmo do `DeleteButton`/`useServerAction` (sonner via `Toaster` do layout raiz). Os formulários de login e cadastro passam a disparar `toast.error(translateError(t, error))` além do aviso inline; o sucesso usa o cookie `flash` + `FlashToast` (ver spec 0002, adendo). `Toaster` com `theme="light"`, `top-center` e redução de movimento. Códigos usados: `INVALID_CREDENTIALS`, `RATE_LIMITED`, `INTERNAL`, `UNAVAILABLE`, `NETWORK` (todos no catálogo `error.*` nas 3 línguas).
