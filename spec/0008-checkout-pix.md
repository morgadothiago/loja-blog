---
id: 0008
title: Checkout nacional — página de pagamento e Pix (QR, copia e cola, acompanhamento de status)
status: in-review
layers: [front, back]
owner: Thiago Morgado
created: 2026-10-28
approved_by:             # preenchido SOMENTE por humano
approved_at:             # preenchido SOMENTE por humano
---

# 0008 — Checkout e Pix

> Depende da **0007 aprovada e implementada** (gateway, `Payment`, webhook, reserva). Cartão é a **0009** (esta spec deixa o "slot" do cartão pronto, mas só renderiza a opção Pix se `capabilities.methods` não incluir `CARD` ou se a 0009 ainda não estiver implementada).

## 1. Contexto e problema
- Hoje "Finalizar compra" cria o pedido e leva ao detalhe do pedido sem pagar (`src/app/(public)/carrinho/page.tsx:17-26`). Falta a tela onde o cliente paga.
- Pix é o meio mais barato (R$ 0,80 fixo, liquidação imediata — pricing AbacatePay) e o de maior conversão no Brasil. É assíncrono: o cliente paga no app do banco, então a tela precisa **acompanhar** o status até o webhook confirmar.

## 2. Objetivos e não-objetivos
**Objetivos**
- Rota de pagamento do pedido, protegida, responsiva, acessível, i18n pt/en/es.
- Pix: gerar cobrança, mostrar QR + copia e cola (com botão copiar), contagem regressiva de expiração, acompanhar status (polling server-side-backed), estados de sucesso/expirado/erro.
- Resumo do pedido, dados do pagador (CPF/CNPJ), seleção de método dirigida por `capabilities`.
**Não-objetivos**
- Cartão (0009), boleto, frete/endereço, reembolso, e-mail de confirmação, cupom, "pagar depois" por link.
- Mudar o carrinho além de redirecionar (e do estado de erro de estoque que já existe).
- Migrar o resto do app para `Intl`/i18n (só o que esta spec toca; `ORDER_STATUS` passa a usar i18n porque a nova tela exibe status).

## 3. Estado atual do código
- Carrinho: `src/app/(public)/carrinho/page.tsx` (client; `createOrder` via `useServerAction`; redireciona para `/conta/pedidos/[id]` e limpa o carrinho **antes** de pagar — passa a limpar só quando o pedido é `PAID`, ver 6.1).
- Proteção: `src/proxy.ts:6` cobre `/conta/:path*` + `authorized` em `src/auth.config.ts`; layout `src/app/(private)/conta/layout.tsx`. A nova rota fica sob `/conta` → herda as duas camadas.
- Detalhe do pedido: `src/app/(private)/conta/pedidos/[id]/page.tsx` (Server Component; `findFirst` com `userId`; textos fixos pt-BR; `ORDER_STATUS` em `src/lib/utils-app.ts:15`).
- UI disponível: `button`, `card`, `field`, `input`, `label`, `select`, `badge`, `separator`, `sonner` em `src/components/ui`; **não há** `tabs`/`radio-group`.
- Erros: `src/hooks/use-server-action.ts` (pending, timeout/offline, toast traduzido via `translateError`, `src/lib/i18n.ts:583`), `src/components/error-view.tsx`, `src/app/(private)/conta/error.tsx`.
- Formulários: react-hook-form + yup + `ControlledInput` (`src/components/forms/controlled-input.tsx`, padrão da newsletter/auth) com Zod no servidor.
- i18n: `src/lib/i18n.ts` (dicionários pt-BR/en/es; `translateFieldError`), `useI18n()`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/route.md` | 16.4.3 | Route Handler `GET` com `Response.json`/`headers`; `params` é Promise. | Não |
| `…/04-functions/after.md`, `…/02-guides/forms.md` | 16.4.3 | Server Actions para mutações; GET idempotente em route handler para polling. | Não |
| `…/03-file-conventions/loading.md`, `error.md`, `not-found.md` | 16.4.3 | `loading.tsx`/`error.tsx` (usa `retry()`), `not-found.tsx` por segmento (spec 0003). | Já adotado |
| Spec 0007 §4.2 | — | Resposta do Pix: `brCode`, `brCodeBase64`, `expiresAt`; `GET /v2/transparents/check` (`PENDING/PAID/EXPIRED/CANCELLED…`); `expiresIn` em segundos; `customer` opcional no Pix, mas **se enviado, todos os campos**; `ensureSameTaxId`. | — |
| https://docs.abacatepay.com/pages/concepts/pix | 2026-10-28 | **Não lida em detalhe**; ler na implementação (regras de expiração, bancos). | A confirmar |
| WCAG 2.2 AA (critérios 1.4.3, 1.4.11, 2.4.7, 2.5.8, 4.1.3) | 2.2 | contraste 4.5:1/3:1, foco visível, alvo mínimo, anúncio de status (`role=status`). | Não |

## 5. Alternativas
### 5.1 Acompanhar o status do Pix
| # | Opção | Prós | Contras | Impacto |
|---|---|---|---|---|
| A | Cliente recarrega manualmente | 0 código | Ruim: o pagamento "não acontece" na tela | UX |
| B | **Polling `GET /api/payments/[id]/status` (3 s, visível; recuo para 10 s após 2 min; para em estado final/expirado/aba oculta)** — o servidor lê o banco e, se `PENDING`, faz `reconcilePayment` throttled (0007) | Simples, funciona em qualquer hospedagem, reaproveita a rede de segurança | Latência de até 3 s após o webhook; algumas requisições | Baixo (resposta ~100 bytes, `no-store`) |
| C | SSE/WebSocket | Tempo real | Conexões longas em serverless, infra extra | Alto |
**Recomendação: B.** Rejeitadas: A (UX), C (infra sem necessidade).

### 5.2 Onde fica a tela
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | **`/conta/pedidos/[id]/pagamento`** | Herda proxy + layout + `userId` do pedido; URL estável para "pagar de novo" | Prefixo `/conta` para algo que o cliente vê como "checkout" |
| B | `/checkout/[id]` novo segmento | URL curta | Exige ampliar `matcher` do proxy e criar layout de auth duplicado |
**Recomendação: A.** Rejeitada: B (mais superfície de autorização por ganho estético).

### 5.3 Seleção de método sem componente novo
Opção A: `Select` existente (esconde as opções, ruim em mobile para só 2 itens). Opção B: **`<fieldset>` com `<input type="radio">` nativos estilizados com tokens** (alvos grandes, teclado/leitor de tela nativos, zero dependência). Opção C: instalar `radio-group`/`tabs` do shadcn (verificar compatibilidade base-ui; dependência/arquivo novo). **Recomendação: B.**

## 6. Design proposto

### 6.0 Referências e direção visual
- **Referências analisadas:** `spec/references/` tem layouts da home/menu (editorial, artesanal); **não há referência de checkout**. Direção proposta a partir dos tokens existentes de `src/app/globals.css` e dos padrões já usados (cards com `border`, `Button`, `Badge`).
- **Intenção:** transmitir calma e confiança no momento de pagar — sem faixas de cor cheia competindo com o QR. Um ponto focal por viewport: no Pix, o **QR + botão "Copiar código"**.
- **Sistema:** fundo `bg-background`; cartões `bg-card border-border rounded-lg` (raio já usado nos `Button`); texto `text-foreground`/`text-muted-foreground`; destaque único = botão primário `Button` default; título em `font-heading` curto ("Pagamento"), corpo na fonte de leitura. Faixa `bg-salmon`/`bg-mustard` **não** usada nesta tela (contraste e distração); `bg-mustard` apenas no aviso de expiração se o contraste com `text-ink` for conferido (razão a medir; AA ≥ 4,5:1).
- **Layout:** coluna única no mobile; duas colunas (resumo | pagamento) a partir de `lg`.
- **Não copiar:** nada de ativos de terceiros. Logo do Pix: **não** incluir sem confirmar uso da marca (usar texto "Pix").
- **QR em fundo claro fixo:** leitores de QR exigem módulos escuros sobre fundo claro com margem. A imagem do gateway já vem assim; envolver em contêiner com `p-4` (zona de silêncio) e **sem inversão no tema escuro** (único ponto onde a regra "sem `dark:` ad hoc" é substituída por "o QR preserva suas cores", justificado).

**Crítica de UI/UX**
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Hoje o carrinho limpa o estado e leva a uma tela sem pagar | `carrinho/page.tsx:21-24` | alta | Limpar só quando `PAID`; manter carrinho se o cliente abandonar o pagamento (o pedido pendente retém estoque por 35 min — informar). |
| 2 | Pix expira e o cliente paga depois | Pix com `expiresAt` (docs); reserva de 35 min (0007) | alta | Contagem regressiva visível + `role="timer"` não anunciando a cada segundo; ao expirar, botão "Gerar novo Pix"; aviso de que Pix expirado não deve ser pago. |
| 3 | `ORDER_STATUS` com rótulos fixos pt-BR (`utils-app.ts:15`) | rótulos fora do i18n | média | Migrar para chaves `order.status.*` nas 3 línguas. |
| 4 | Código copia-e-cola é longo (centenas de caracteres) | Pix `brCode` | média | Mostrar em `<textarea readonly>`/bloco com `break-all`, rolagem vertical limitada, **nunca** rolagem horizontal; botão "Copiar" ≥ 2,75rem de altura. |
| 5 | Dependência só de cor para estado (pago/pendente/expirado) | — | média | Ícone + texto + `Badge`; anúncio via `role="status"`. |
| 6 | Pedir CPF e telefone cria atrito | gateway exige taxId no cartão; no Pix é opcional | média | **Pix: não pedir CPF** (customer opcional, evita atrito e mantém dados fora do sistema). Cartão (0009) pede. `ensureSameTaxId` **não** usado. |

### 6.1 Frontend
**Árvore (Server = S, Client = C)**
```
app/(private)/conta/pedidos/[id]/pagamento/
  page.tsx                  (S)  carrega pedido (where {id, userId}), expira se preciso (releaseExpiredOrders),
                                 chama getCheckoutConfig(); redireciona p/ detalhe se PAID; notFound() se não é do usuário
  loading.tsx               (S)  esqueleto (reusa components/loading-skeleton.tsx)
  error.tsx                 (C)  usa error-view + retry() (spec 0003)
components/checkout/
  checkout-shell.tsx        (S)  grade resumo | pagamento; recebe `cardSlot?: ReactNode` (0009)
  order-summary.tsx         (S)  itens, total (formatPrice), prazo de reserva
  method-picker.tsx         (C)  fieldset/radios; métodos de capabilities.methods
  pix-panel.tsx             (C)  estado: idle → creating → pending(qr) → paid | expired | error
  pix-qr.tsx                (C)  <img> do QR (data URL do base64), alt traduzido
  copy-code.tsx             (C)  navigator.clipboard + fallback (select + execCommand não; usa seleção do textarea)
  expiry-countdown.tsx      (C)  contagem a partir de expiresAt (servidor), pausa fora de foco, sem anunciar por segundo
  use-payment-status.ts     (C)  hook de polling (abort, visibilidade, backoff)
  payment-result.tsx        (S/C) sucesso / expirado / falha, com próximos passos
```
**Rotas/segmentos:** `page`, `loading`, `error` (acima); `not-found` do segmento reaproveita o global. Detalhe do pedido (`pedidos/[id]/page.tsx`) ganha: badge via i18n e, se `PENDING` e não expirado, botão "Pagar agora" → `/pagamento`.

**Fluxo**
1. Carrinho → `createOrder` (0007: reserva) → `router.push('/conta/pedidos/[id]/pagamento')`. **Não** chama `clear()` aqui; `clear()` roda quando a página de sucesso (status `PAID`) carrega.
2. Página: pedido `PENDING` → `CheckoutShell` com resumo e `MethodPicker`. Pix selecionado → botão "Gerar Pix" (ação `startPixPayment(orderId)`).
3. `startPixPayment` devolve `{ paymentId, pix:{copyPaste, qrImageBase64, expiresAt}, status }`. Se já existe Pix `PENDING` não expirado do pedido → **reaproveita** (recarregar a página não gera nova cobrança).
4. `use-payment-status` consulta `GET /api/payments/[paymentId]/status`; em `PAID` → `payment-result` (sucesso, foco movido ao título, link "Ver pedido"), em `EXPIRED` → botão "Gerar novo Pix" (nova ação cria novo `Payment` após o anterior estar terminal).
5. Erros: `UNAVAILABLE` → mensagem + "Tentar novamente"; `ORDER_EXPIRED` → "Seu pedido expirou" + link ao carrinho; rede/timeout via `useServerAction` (`NETWORK`/`TIMEOUT`).

**Estados**
| Estado | Tela |
|---|---|
| loading (RSC) | `loading.tsx`: esqueleto de resumo + painel |
| creating | botão `disabled` com `aria-busy`, texto "Gerando Pix…" |
| pending | QR, copia e cola, contagem, `role="status"` "Aguardando pagamento" |
| paid | sucesso + total + "Ver pedido"; carrinho limpo |
| expired | aviso + "Gerar novo Pix" |
| failed/erro | `role="alert"`, texto traduzido por `translateError`, ação de repetir |
| offline durante polling | indicador discreto "Sem conexão; tentando novamente" (não interrompe; retoma ao voltar) |
| pedido não é do usuário/inexistente | `notFound()` |

**Tema:** só tokens (`bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `text-destructive`); sem hex; sem `dark:` ad hoc (exceção do QR acima). **Unidades:** `rem`/escala Tailwind; nada de `px` (memória do projeto) — o QR usa `w-full max-w-[…]` **em `rem`** (ex.: `max-w-64` = 16rem), não `px`.

**Responsivo**
```
360–390                      1024+
[Pagamento]                  [Pagamento]
[Resumo (colapsável)]        +-------------+  +---------------------+
(o) Pix ( ) Cartão           | Resumo      |  | (o) Pix  ( ) Cartão |
+---------------+            | itens/total |  | [QR]  Copia e cola  |
|     [QR]      |            | reserva 35m |  | [Copiar] 29:41      |
| Copia e cola  |            +-------------+  +---------------------+
| [Copiar código]|
| Expira em 29:41|
```
| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Navegação | cabeçalho padrão do site (inalterado) | idem | idem | idem |
| Imagem principal (QR) | `w-full max-w-64` centralizado, `aspect-square` reservado | idem | coluna direita, mesmo tamanho | idem |
| Grade | 1 coluna: resumo em `<details>` fechado (total sempre visível) → pagamento | 1 coluna larga (`max-w-xl mx-auto`) | 2 colunas (`grid-cols-[1fr_1.2fr]`, resumo sticky) | `max-w-5xl mx-auto` |
| Formulários | campos em coluna, `h-11` (≥ 2,75rem) | idem | idem | idem |
| Rodapé | do site | idem | idem | idem |
`min-w-0` nos itens da grade e `break-words` nos nomes de produto; testar título de produto longo e 200 caracteres de `brCode`.

**Acessibilidade (checklist)**
- Contraste AA com tokens do tema; razões medidas na implementação (tokens claros e escuros) e registradas no relatório; QR em fundo claro.
- `<fieldset><legend>` para métodos; setas movem seleção (radios nativos); foco visível (`focus-visible:ring-3`, padrão do `Button`).
- Alvos ≥ 2,75rem (44 px equivalentes) — medidos em `rem`; espaçamento ≥ 0,5rem entre alvos.
- Mudança de status anunciada por `role="status"` (`aria-live="polite"`); erros por `role="alert"`; contagem regressiva **não** em região live (anunciar apenas marcos: "faltam 5 minutos").
- `alt` do QR: "QR Code do Pix para pagar R$ X" (traduzido); código copiável também como texto para quem não pode escanear.
- "Copiado!" anunciado por `aria-live`, além do toast visual.
- `prefers-reduced-motion`: sem animações (o spinner vira texto "…").
- Ordem de leitura: título → resumo → método → ação.
**i18n:** chaves novas em `src/lib/i18n.ts` nos três idiomas (prefixos `checkout.*`, `pix.*`, `order.status.*`, `error.PAYMENT_IN_PROGRESS|ORDER_EXPIRED|PAYMENTS_UNAVAILABLE|TOO_MANY_PENDING`). Textos en/es mais longos: botões `whitespace-normal` e layout sem largura fixa; testar en/es em 360. Valores via `formatPrice`/`Intl` (BRL fixo; **não** localizar a moeda — a loja cobra em BRL em qualquer idioma). Datas/contagem via `Intl`.

### 6.2 Backend
- **Server Action `startPixPayment`** (`src/actions/payments.ts`, `defineAction({ auth:"user", schema: z.object({ orderId: z.string().cuid() }) })`):
  1. `order = findFirst({ where:{ id, userId } })`; não achou → `NOT_FOUND`.
  2. `order.status==="PENDING"` e `reservedUntil>now`, senão `CONFLICT/ORDER_EXPIRED`; `PAID` → idempotente: devolve `status:"PAID"`.
  3. `recordAttempt('pay-user:…','pay-ip:…')` + `isBlocked` → `RATE_LIMITED`.
  4. Pix pendente e não expirado do pedido → devolve o existente.
  5. Em transação cria `Payment{PENDING, method:"PIX", amountCents: order.totalCents, gateway: selectGateway().id}` (índice parcial garante 1 ativo).
  6. `gateway.createPixCharge({ paymentId, amountCents, expiresInSeconds: capabilities.pixDefaultExpirySeconds, description })` — **sem `customer`**. Sucesso → grava `externalId`, `pixCopyPaste`, `pixQrBase64`, `expiresAt`; falha → `Payment` vai a `FAILED` (`failureCode`), erro traduzido.
  7. Retorna `{ paymentId, status, pix }` (nunca `externalId` bruto necessário ao cliente).
- **`GET /api/payments/[paymentId]/status`** (sem `export const runtime`, `Cache-Control: no-store`; ver 6.3): sessão obrigatória; `where:{ id, order:{ userId } }` → senão 404; se `PENDING`, chama `reconcilePayment` (throttle 15 s) antes de ler; retorna `{ status, orderStatus, expiresAt }`. Sem `pixCopyPaste`.
- **Cache/revalidação:** páginas dinâmicas (`cookies()` via `auth()`); `revalidatePath('/conta/pedidos')` e `/conta/pedidos/[id]` dentro de `applyCharge` ao pagar; `cacheComponents` segue desligado.
- **Integração:** somente por `PaymentGateway` (0007); **nenhuma menção a AbacatePay** nesta spec de UI/ação.

### 6.3 Compatibilidade vinext / Workers
Premissas, matriz completa, regras e riscos: **0007 §6.3** (vale para esta spec). Específico do checkout/Pix:
| Recurso usado aqui | Portável? | Nota / fallback |
|---|---|---|
| Server Action `startPixPayment` | ✅ (vinext lista Server Actions) | fallback: Route Handler `POST` chamando o mesmo `core/` |
| Route Handler `GET /api/payments/[id]/status` (Web `Request`/`Response`, `await ctx.params`) | ✅ | sem `NextRequest` específico; sem `runtime` fixo |
| `auth()` / `cookies()` assíncronos | ✅ | — |
| `revalidatePath` em `applyCharge` | ✅ | isolado em `invalidateOrderViews()` (0007) |
| `loading.tsx`/`error.tsx` (`retry()`)/`not-found` | ✅ | `retry()` **não verificado** no vinext: se faltar, `error.tsx` cai para `reset()` + `router.refresh()` |
| Polling no cliente (`fetch`, `AbortController`, `visibilitychange`) | ✅ | tudo no navegador |
| Clipboard (`navigator.clipboard`) | ✅ | navegador |
| QR `<img src="data:image/png;base64,…">` (não `next/image`) | ✅ | evita a otimização de imagem 🟡 do vinext |
| Estado: nenhum em memória do servidor; throttle e rate limit no banco | ✅ | 0007 §6.3.3 |
**Passo 0 e CI:** os do 0007 (`npx vinext check`, guarda `check:portability`, que também varre `src/components/checkout/**` contra imports Node).

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Página `/conta/pedidos/[id]/pagamento` | redirect login | ✓ só dono | ✓ só dono (admin não paga por terceiros) | proxy + layout + `findFirst({id,userId})` |
| `startPixPayment` | ✗ | ✓ dono | ✓ dono | `defineAction auth:"user"` + query por `userId` |
| `GET /api/payments/[id]/status` | 401 | ✓ dono | ✓ dono | sessão + `order.userId` (404 se alheio) |
- IDOR: nunca buscar `Payment`/`Order` só por id. Valor **sempre** de `Order.totalCents`.
- Rate limit: criação de Pix conta nas mesmas chaves `pay-*` (evita enxurrada de cobranças); polling não grava no banco (só `lastSyncedAt` quando reconcilia, ≥ 15 s).
- Sem dado sensível no cliente; `brCode` é visível só ao dono, só enquanto `PENDING`.
- Clipboard: apenas o `brCode` do próprio pagamento.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `startPixPayment` feliz (adapter fake): cria `Payment PENDING`, valor = `Order.totalCents` ignorando qualquer valor do input | integração | `ok`, `amountCents` do banco |
| 2 | Input inválido (`orderId` não-cuid/ausente) | integração | `VALIDATION` |
| 3 | Não autenticado | integração | `UNAUTHENTICATED` |
| 4 | Pedido de **outro** usuário | integração | `NOT_FOUND`; nenhum `Payment` criado |
| 5 | Pedido expirado/cancelado | integração | `CONFLICT/ORDER_EXPIRED` |
| 6 | Reaproveita Pix pendente (2 chamadas) e **duplo clique concorrente** | integração | 1 `Payment`; sem 2ª cobrança no fake |
| 7 | Gateway indisponível | integração | `UNAVAILABLE/PAYMENTS_UNAVAILABLE`, `Payment FAILED` |
| 8 | Rate limit estourado | integração | `RATE_LIMITED` |
| 9 | `GET status`: dono ok / outro usuário 404 / anônimo 401 / `no-store` | integração | conforme |
| 10 | Status `PENDING` → webhook marca `PAID` → próximo GET devolve `PAID` (fluxo ponta a ponta com fake) | integração | `PAID` |
| 11 | `use-payment-status`: para ao `PAID`, ao `EXPIRED`, aba oculta, retoma ao voltar; backoff; cancela no unmount (timers falsos) | componente | sem requests após parar |
| 12 | `PixPanel` estados: creating (botão desabilitado), pending (QR com `alt`, código, `role=status`), paid (foco no título), expired (botão "Gerar novo"), erro (`role=alert`) | componente (Testing Library, `getByRole`) | conforme |
| 13 | `CopyCode`: copia (mock `navigator.clipboard`), anuncia "Copiado" | componente | — |
| 14 | `MethodPicker` por capabilities: só `PIX` → sem opção de cartão; navegação por setas | componente | — |
| 15 | i18n: chaves `checkout.*`/`pix.*` existem em pt/en/es (teste de paridade) | unit | sem chave faltando |
| 16 | Carrinho: após `createOrder` navega ao pagamento e **não** limpa carrinho; limpa ao ver `PAID` | componente | — (atualizar `tests/cart-*.test.*` existentes) |
| 17 | Responsivo 360/768/1280: sem rolagem horizontal, QR visível sem rolar além de 1 tela, botão "Copiar" acionável, `brCode` longo não estoura | e2e (Playwright) **ou** verificação manual com capturas | ver abaixo |
| 18 | a11y: zero violações serious/critical (axe) nos estados `pending`/`paid`/`expired` | e2e | — |
**Infra:** o projeto **não tem Playwright/axe**. Instalá-los (`@playwright/test`, `@axe-core/playwright`, browsers) é **item desta spec que depende de aprovação** (pergunta 1). Sem aprovação: casos 17–18 viram checklist manual com capturas em 360/768/1280 e **declaração explícita de que não houve verificação automatizada**; o jsdom cobre apenas o comportamento (11–16).

## 9. Plano de implementação
0. (Herdado da 0007 §9 passo 0) conferir que o resultado de `npx vinext check` está registrado em 0007 §6.3.7 e que `check:portability` está no CI antes de codar; se o `error.tsx`/`retry()` ou Server Actions foram apontados, aplicar os fallbacks da 6.3.
1. i18n: chaves novas (3 idiomas) + `ORDER_STATUS` por i18n + teste de paridade.
2. `src/actions/payments.ts`: `startPixPayment` + testes 1–8.
3. `GET /api/payments/[paymentId]/status` + testes 9–10.
4. `use-payment-status`, `copy-code`, `expiry-countdown`, `pix-qr` + testes 11, 13.
5. `pix-panel`, `method-picker`, `order-summary`, `checkout-shell` + testes 12, 14.
6. Rota `/conta/pedidos/[id]/pagamento` (`page`, `loading`, `error`) e botão "Pagar agora" no detalhe do pedido.
7. Carrinho: redirecionar ao pagamento; limpar ao `PAID` + teste 16.
8. Verificação visual 360/768/1280 (Playwright se aprovado; senão manual), contraste medido, `tsc`, `eslint src`, `npm test`, `next build`.

## 10. Riscos, rollback e dívidas
- **Pix pago depois de expirar / após liberar estoque:** tratado em 0007 (`PAID_WITHOUT_STOCK`); UI mitiga com contagem e aviso.
- **Webhook atrasado:** o cliente vê "aguardando" mesmo tendo pago → texto "pode levar alguns instantes"; reconciliação cobre.
- **Sem sandbox acessível/HTTPS para webhook** em dev: usar túnel; sem ele, o teste de ponta a ponta usa `simulate-payment` + `reconcile`.
- Rollback: remover a rota e voltar o redirecionamento do carrinho; dados já criados são inertes.
- Dívidas: sem e-mail de confirmação, sem página de "pagar depois" fora do detalhe do pedido, CPF não coletado no Pix.

## 11. Perguntas em aberto
- [ ] 1. Aprovar instalar **Playwright + axe** (dev-only) para responsivo/a11y automatizados? (recomendado; é infra nova)
- [ ] 2. **Pix sem CPF** (menos atrito, sem dado pessoal) é aceitável? O gateway aceita `customer` opcional no Pix.
- [ ] 3. Prazo do Pix: 30 min (padrão proposto) com reserva de 35 min?
- [ ] 4. Marca/logo do Pix (usar apenas texto)? 
- [ ] 5. Em `/carrinho`, manter o carrinho após criar o pedido (proposto) ou esvaziar ao criar?
- [ ] 6. Após `PAID`: só página de sucesso, ou também e-mail (não existe infra de e-mail hoje)?

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado (ver 0007)
- [ ] Matriz de permissões revisada
- [ ] Direção visual e referências interpretadas corretamente (não há referência de checkout; direção proposta pelos tokens)
- [ ] Crítica de UI/UX avaliada (aceito / ajusto / rejeito cada achado)
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
<Humano: data, decisão e ressalvas.>

## 14. Relatório pós-implementação
<Preenchido pelo agente ao final.>
