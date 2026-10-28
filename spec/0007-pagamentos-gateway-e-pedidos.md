---
id: 0007
title: Pagamentos nacionais (BRL) — camada de gateway plug and play, modelo de pagamento, webhook e reserva de estoque
status: in-review
layers: [back, db, infra]
owner: Thiago Morgado
created: 2026-10-28
approved_by:             # preenchido SOMENTE por humano
approved_at:             # preenchido SOMENTE por humano
---

# 0007 — Camada de gateway, modelo de pagamento e webhook

> Série de specs: **0007** (esta: fundação, sem UI) → **0008** (checkout + Pix) → **0009** (cartão). Nenhuma depende de código da outra além do que está declarado em "Contrato com 0008/0009". Implementar nessa ordem.

## 1. Contexto e problema
- A loja vende produtos; o cliente final atende compras nacionais e internacionais. **Agora entra só o nacional (Brasil, BRL).** O internacional virá depois, provavelmente com outro gateway (Stripe/PayPal).
- Hoje não existe pagamento. `createOrder` (`src/actions/orders.ts:14`) cria o pedido `PENDING` e **já baixa o estoque** na criação (`orders.ts:34-40`); nada move o pedido para `PAID`, e nada devolve o estoque de pedido abandonado. O `/carrinho` redireciona direto para `/conta/pedidos/[id]` (`src/app/(public)/carrinho/page.tsx:20-26`).
- Requisito do usuário com prioridade no desenho: **trocar de gateway deve ser plug and play** — mudar em **um único lugar** (config central + variáveis de ambiente do adapter) e valer para o projeto inteiro, sem tocar em checkout, Server Actions, rota de webhook ou UI.
- Confirmação de pagamento **sempre por webhook validado**; nunca pelo retorno do navegador (decisão já tomada).

## 2. Objetivos e não-objetivos
**Objetivos**
- Interface `PaymentGateway` + formato normalizado de estados/eventos que o resto do app consome; registro único de adapters; seleção por config.
- Adapter **AbacatePay** (Pix e cartão) como primeira implementação.
- Modelo `Payment` e `PaymentEvent` (idempotência de webhook), máquina de estados do pedido/pagamento, reserva de estoque com expiração e liberação.
- Rota de webhook genérica que delega ao adapter; reconciliação server-side como rede de segurança.
- Testes de contrato que **qualquer** adapter novo deve passar.
- Desenho extensível para seleção por país/idioma (futuro internacional) — **sem implementá-la**.
- **Compatibilidade com vinext/Workers** (seção 6.3): camada de pagamentos só com APIs web (fetch, Web Crypto), sem estado em memória, com guarda de CI; o projeto segue em `next`.

**Não-objetivos (decididos e justificados)**
| Item | Decisão | Por quê |
|---|---|---|
| Internacional (Stripe/PayPal, moeda ≠ BRL) | Fora. Só pontos de extensão (seção 6.2.1 e 6.2.8). | Pedido do usuário. |
| Boleto | **Fora da v1**, previsto em `PaymentMethod`/capabilities. | Compensa em até D+3 úteis (pricing) → estoque preso por dias ou reserva longa; não é reembolsável via API (`transparents/refund`); fluxo de UI próprio (linha digitável/PDF). Pix + cartão cobrem o caso de uso. Entra depois como adapter method adicional sem mudar o resto. |
| Cartão salvo (`cardToken`), upsell, assinaturas | Fora. | Sem requisito; cartão salvo muda o escopo de LGPD/PCI e exige tela de gestão. O adapter **não** persiste `cardToken` (descartado da resposta). |
| Reembolso / portal do cliente | **Fora da UI.** Método `refund?` existe na interface (opcional) e é implementado no adapter, mas **sem Server Action/tela**: reembolso é feito pelo painel do gateway (admin). | Reembolso é parcial/integral, tem saldo e disputa (docs); sem requisito de produto ainda. Ver pergunta 7. |
| Frete/endereço/NF-e | Fora. `Order.totalCents` = soma dos itens. | O schema não tem endereço nem frete. **Lacuna de negócio para o go-live** (pergunta 9), não para o desenho. |
| Repasse da taxa do cartão ao cliente | Fora da v1 (loja absorve). | Docs só descrevem repasse em `checkouts/create` (`card.passFeesToCustomer`); **não confirmado** para checkout transparente. Ver pergunta 3. |

## 3. Estado atual do código
- `prisma/schema.prisma` `Order` (id, userId, status String, totalCents, createdAt) e `OrderItem` (cópias de nome/preço). `status` é `String` (sem enum), comentário lista `PENDING|PAID|SHIPPED|DELIVERED|CANCELED`. **Não há** `Payment`, endereço, CPF, telefone.
- `src/actions/orders.ts:14-47` `createOrder` via `defineAction({ auth: "user" })`: recalcula preço/estoque no banco em transação com decremento condicional. **Preservar.** Teste atual: `tests/crud-orders-actions.test.ts:73+`.
- `src/lib/action.ts` (`defineAction`: auth → Zod → handler → `mapError`), `src/lib/result.ts` (`Result`, `ErrorCode`, `fail`), `src/lib/errors.ts` (`BusinessError`, `mapError`, `logError`) — contrato de erros da spec 0003. Reusar.
- `src/lib/rate-limit.ts` (janela de 15 min no Postgres, tabela `AuthAttempt`) — reusar com chaves novas (`pay-user:`, `pay-ip:`).
- `src/proxy.ts:6` matcher cobre `/dashboard`, `/conta`, `/carrinho`, `/login`, `/cadastro`; **`/api/*` não passa pelo proxy** → o webhook não será interceptado pelo Auth.js (bom), e **não deve** ser incluído no matcher.
- `src/lib/utils-app.ts:15-23` `formatPrice` (BRL) e `ORDER_STATUS` (rótulos fixos pt-BR, **fora do i18n**; 0008 migra para i18n).
- Testes: Vitest em `tests/`, Postgres `*_test` real via `tests/global-setup.ts` (migrate deploy). Sem Playwright instalado.
- `.env.example` só tem `DATABASE_URL`, `AUTH_SECRET`, `AZURE_*`.
- Não há `server-only` instalado (`node_modules/server-only` ausente) e `next.config.ts` não define CSP/headers.

## 4. Documentação consultada
### 4.1 Next 16.4.3 (local, `node_modules/next/dist/docs/`)
| Fonte | O que confirmei | Contradiz o esperado? |
|---|---|---|
| `01-app/03-api-reference/03-file-conventions/route.md` | Route Handlers recebem `Request`/`NextRequest` (Web API); `POST` não é cacheado; params são `Promise` em rotas dinâmicas (`RouteContext<'/…/[id]'>` tipo global). | Confirma `await ctx.params`. |
| `route.md` (Web APIs) | Corpo cru via `await request.text()` — necessário para HMAC sobre o corpo exato. | Não. |
| `01-app/03-api-reference/04-functions/after.md` | `after()` roda após a resposta, limitado ao `maxDuration` da plataforma. | Considerado e **rejeitado** para o webhook: ver 6.2.4 (processar antes de responder, é rápido). |
| `01-app/02-guides/environment-variables.md` | Variáveis sem `NEXT_PUBLIC_` ficam só no servidor; `NEXT_PUBLIC_` é **inlinado no build** (congela). | **Sim:** a chave pública do gateway **não** usará `NEXT_PUBLIC_` (congelaria por build; trocar de gateway exigiria rebuild). Será lida no servidor e passada por props. |
| `01-app/02-guides/scripts.md` | `next/script` com `strategy`, `onLoad`/`onReady`. | Usado em 0009. |
| `01-app/02-guides/content-security-policy.md` | CSP por nonce via proxy exige render dinâmico. | Projeto não tem CSP hoje; nota em 0009. |
| `01-app/02-guides/authentication-with-cache-components.md` | Usa `import 'server-only'`. | Pacote `server-only` **não instalado**; ver alternativa na 6.2.1. |
| https://github.com/cloudflare/vinext (README) | 2026-10-28 | Next 16.x; suporta Server Actions, route handlers, `proxy.ts`, `after`, `revalidatePath/Tag`, `cookies()/headers()` assíncronos, `next/script`; 🟡 `next/image`, `next/font`, segment config; `cacheComponents` incompleto; nativos não rodam; `vinext check` existe; **não menciona** Prisma nem `nodejs_compat`. | Sim: lacunas e experimental (ver 6.3) |
| Docs Prisma para Workers | 2026-10-28 | Driver adapters (`adapter-pg` + `nodejs_compat`, `adapter-neon`), cliente por requisição; exemplos em Prisma 7. | Sim: o projeto usa cliente clássico 6.19 |
| Next.js `AGENTS.md` do projeto | `middleware` → `proxy`; `cacheComponents` desligado. | Respeitado: nada de `"use cache"`. |

### 4.2 AbacatePay (https://docs.abacatepay.com, consultado em 2026-10-28)
**Confirmado**
| Fato | Fonte |
|---|---|
| Base URL `https://api.abacatepay.com`, rotas `/v2/…`, `Authorization: Bearer <chave>`; **a chave define o ambiente** (mesma URL); campo `devMode` na resposta indica sandbox. Permissões por chave, não editáveis depois (403 `Insufficient permissions`). | `/pages/authentication` |
| Pix: `POST /v2/transparents/create` com `method:"PIX"`, `data.amount` (centavos, mín. 100), `expiresIn` (s), `externalId` (“idempotência”), `metadata`, `customer` opcional (se enviado: name, email, taxId, cellphone), `ensureSameTaxId`. Resposta: `id` (`pix_char_…`), `status`, `brCode`, `brCodeBase64`, `expiresAt`, `devMode`, `platformFee`. | `/pages/transparents/create` |
| Estados (enum da API): `PENDING, EXPIRED, CANCELLED, PAID, UNDER_DISPUTE, REFUNDED, REDEEMED, APPROVED, FAILED`. | idem |
| Consulta Pix: `GET /v2/transparents/check?id=pix_char_…` (permissão `TRANSPARENT:READ`); cartão: `GET /v2/transparents/get?id=card_…`. Docs recomendam webhook em vez de polling. | `/pages/transparents/check` |
| Cartão: `POST /v2/transparents/create` com `method:"CARD"`, `data.token` (`ctok_…`, vale 60 s, 1 uso) **ou** `cardToken`; `amount` deve ser igual ao do `AbacatePay.create`; `installmentCount` 1–12; **parcela mínima R$ 10,00**; `customer` com name, email, taxId, cellphone (todos obrigatórios); `metadata` só texto; **`externalId` e `description` são ignorados em cartão**. Resposta: `id` (`card_…`), `status`, `brand`, `lastFour`, `cardToken`, `installmentCount`… Status: `APPROVED` (aprovada), `PENDING` (aguardar webhook `transparent.completed`), `PAID` (repasse da adquirente), `FAILED`, `REFUNDED`, `UNDER_DISPUTE`. Erros 400 (recusa, token inválido/expirado, parcela < R$ 10…), 401, 403, 422. **Timeout/erro de rede não é recusa: não repetir a cobrança.** | `/pages/transparents/card`, `/pages/guides/cartao-transparente` |
| abacatepay.js: `https://abacatepay.com/abacatepay.js` (não copiar para o servidor), `AbacatePay.create({publicKey, amount, locale:'pt'|'en'|'es', onCardChange, …})`, `mount(alvo)`, `tokenize(cliente, endereço?)` → `{token, expiresIn:60, brand, lastFour}`, `destroy()`. 3DS: `tokenize()` abre janela “Autenticação do cartão” e só resolve após concluir; falha → `THREE_DS_FAILED`. Códigos de erro: `NOT_MOUNTED, PAYER_INVALID, CARD_INCOMPLETE, CARD_INVALID, THREE_DS_FAILED, PROVIDER_LOAD, MOUNT_TARGET, API, NETWORK, UNKNOWN`. Campos do cartão ficam em iframe. `pk_…` e chave de API **do mesmo ambiente**. | `/pages/transparents/abacatepay-js` |
| Cartões de teste: `4242 4242 4242 4242` aprova; `…0002` recusa; `…0069` expirado; `…0127` CVV inválido. Toda recusa devolve a mesma mensagem genérica. | `/pages/devmode`, guia cartão |
| Webhook v2 (envelope): `{ id, event, apiVersion: 2, devMode, data }`. Eventos relevantes: `transparent.completed`, `transparent.refunded`, `transparent.disputed`, `transparent.lost`. Autenticação: **(a)** `?webhookSecret=…` na URL comparado ao seu segredo → 401 se divergir; **(b)** header `X-Webhook-Signature` = HMAC-SHA256 do **corpo cru** em base64 (comparar com `timingSafeEqual`, após checar tamanhos), usando uma **chave pública constante publicada nas docs**. Idempotência: o `id` do corpo é o mesmo em todas as tentativas. Resposta `2xx` em ≤ 30 s = entregue; até 7 tentativas em ~18 h (5 s, 5 min, 30 min, 2 h, 5 h, 10 h); 5xx/408/429/timeout reentregam; **410 desativa o webhook**; 3xx/4xx não reentregam. Reenvio manual no painel gera **novo `id`**. Endpoint exige HTTPS e não aceita IP local/privado. `taxId` chega mascarado; cartão só últimos 4 + bandeira. | `/pages/webhooks/reference`, `/pages/webhooks.md` |
| Reembolso `POST /v2/transparents/refund` (`REFUND:CREATE`): **só integral**; Pix/cartão ok; boleto não; disputa não; saldo insuficiente → erro. | `/pages/transparents/refund` |
| Taxas (pricing): Pix R$ 0,80; boleto R$ 2,50 (R$ 0,80 se pago pelo QR); crédito 1x 3,5% + R$ 0,60, 2–6x 4% + R$ 0,60, 7–12x 4,5% + R$ 0,60; débito 2,5% + R$ 0,60 (D+1); mensalidade R$ 0; cartão liquida em **D+30** (ajustável D+1…D+30; em D+1 as taxas sobem de 5,42% a 17,37% + R$ 0,60); Pix imediato. Mínimo de cobrança R$ 1,00. **Conta nova: limite R$ 5.000 de dia / R$ 1.000 à noite**; aumento não é automático (até 7 dias úteis). | `https://www.abacatepay.com/pricing` |
| Produção: **somente pessoa jurídica (MEI e ME aceitos)**, análise em até 3 dias úteis; pede dados do sócio administrador. | `/pages/production` |
| Parcelamento (`checkouts`): `card.maxInstallments` 1–12, mínimo R$ 10 por parcela; repasse `card.passFeesToCustomer` (cliente paga a taxa, loja recebe cheio; reembolso devolve o total pago sem devolver a taxa). | `/pages/payment/installments`, `/pages/guides/repasse-de-taxa` |

**Não confirmado (tratado como risco; verificar na implementação, no sandbox)**
1. **Campos de `data` do evento `transparent.completed`** (a página de evento retornou 404 e a doc do webhook não lista): onde está o id da cobrança, `status`, `amount`, `externalId`/`metadata`. O adapter é escrito contra **fixtures capturadas do sandbox** no passo 1 da implementação; até lá, o desenho não depende do payload: o webhook é só **gatilho + autenticação**, e a verdade vem de `getCharge` (6.2.4).
2. Se `transparent.completed` dispara também para cartão `APPROVED` (ou só ao liquidar `PAID` em D+30). Se só disparar em D+30, a liberação do pedido **não pode** depender dele: ver 6.2.5 (reconciliação por `getCharge` aceita `APPROVED`).
3. O papel exato do `secret` do `POST /webhooks/create` vs. `?webhookSecret=` da URL (a doc é ambígua). Teste empírico no sandbox.
4. Comportamento de `externalId` repetido no Pix (devolve a cobrança existente ou cria outra?).
5. Rate limits da API; domínio do iframe do cartão (para eventual CSP); se `webhookSecret` e HMAC valem em dev mode.
6. Se o parcelamento do transparente tem juros ao cliente (a doc do transparente não fala de juros; só `passFeesToCustomer` em checkouts).
7. Endpoint de sandbox para simular Pix: `/transparents/simulate-payment` existe, sem parâmetros documentados na página de devmode (ler `/pages/transparents/simulate-payment` na implementação).

**Divergências com o que se esperava:** (i) docs de produção **não** citam limites/mínimo (vêm do pricing) — fatos do pedido conferidos no pricing; (ii) a chave do HMAC é **pública e fixa** (assina integridade, não prova origem) → a origem é provada pelo `webhookSecret`; (iii) `externalId` não vale para cartão → usar `metadata`.

## 5. Alternativas
### 5.1 Camada de gateway
| # | Opção | Prós | Contras | Risco | Impacto |
|---|---|---|---|---|---|
| A | Chamar AbacatePay direto nas actions/UI | Menos arquivos | Trocar de gateway = reescrever checkout, webhook e UI; viola o requisito | Alto | Acoplamento |
| B | **Interface + adapters + registro único + config central** | Troca em um lugar; testes de contrato; internacional entra como adapter | ~10 arquivos de infraestrutura antes de qualquer UI | Baixo | Só o adapter ativo é carregado no cliente (seção 6.2.1) |
| C | SDK oficial `abacatepay-nodejs-sdk` | Menos código HTTP | Dependência nova, não avaliada; acopla tipos do fornecedor | Médio | Bundle/manutenção |
| D | Agregador (Pagar.me/Mercado Pago) | Um fornecedor com Pix+cartão+boleto | Contradiz decisão tomada (AbacatePay) | — | — |

**Recomendação: B**, com HTTP via `fetch` no adapter (sem SDK novo). Rejeitadas: A (viola requisito), C (dependência sem necessidade; a API cabe em ~150 linhas), D (decisão já tomada).

### 5.2 Origem da verdade do status
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Confiar no payload do webhook | Simples | Segredo vai em URL (vaza em logs de proxy); payload do evento não documentado por completo; sem defesa contra spoof se segredo vazar |
| B | **Webhook autenticado = gatilho; estado final vem de `getCharge` (consulta server-to-server) + checagem de valor** | Mesmo caminho serve de reconciliação; spoof inofensivo; independente do formato do payload | 1 chamada extra por evento; depende de rate limit da API (não confirmado) |
| C | Polling puro | Sem webhook | Contraria decisão; docs desencorajam |
**Recomendação: B.** O webhook continua sendo o mecanismo de confirmação (decisão do usuário); a consulta apenas **valida**.

### 5.3 Idempotência e concorrência
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Checar `PaymentEvent` e depois processar | Simples | Corrida entre duas entregas simultâneas |
| B | **`INSERT PaymentEvent` com `@@unique([gateway, eventId])` na mesma transação da mudança de estado; `P2002` = duplicata → 200** + transição de estado idempotente (PAID→PAID é no-op) | Seguro sob concorrência; cobre também o reenvio manual (novo `id`) pela idempotência do estado | Tabela cresce (retenção, 6.2.3) |
**Recomendação: B.**

### 5.4 Estoque durante o pagamento
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Baixar só ao pagar | Sem reserva | Overselling: Pix pago sem estoque = reembolso manual |
| B | **Manter o comportamento atual (baixa na criação) + `reservedUntil` + liberação por expiração** | Preserva o padrão transacional existente; zero overselling | Pedido abandonado prende estoque até expirar; abuso (mitigado: limite de pedidos pendentes e rate limit) |
| C | Reserva em tabela separada | Mais flexível | Mais complexidade sem ganho agora |
**Recomendação: B.** Rejeitadas: A (dinheiro recebido sem produto), C (abstração para um uso).

## 6. Design proposto

### 6.0 Referências e direção visual
N/A — esta spec não tem UI (ver 0008/0009).

### 6.1 Frontend
N/A nesta spec. Contrato com a UI em "6.2.7 Contrato com 0008/0009".

### 6.2 Backend

#### 6.2.1 Interface, registro único e config central
Estrutura (`src/lib/payments/`):
```
types.ts            # tipos normalizados (abaixo) — importável por server e client (sem segredos)
errors.ts           # GatewayError (códigos normalizados)
config.ts           # ÚNICO lugar de escolha: lê PAYMENT_GATEWAY, regra de seleção, lista de habilitados
registry.ts         # ÚNICO lugar que conhece os adapters: { abacatepay: {...} }
core/               # regra de negócio agnóstica de gateway (startPayment, applyCharge, reconcile, release)
adapters/abacatepay/
  index.ts          # implementa PaymentGateway (server)
  client.ts         # fetch + mapeamento de erros HTTP
  map.ts            # status do fornecedor -> status normalizado
  webhook.ts        # verificação + normalização
  card-form.tsx     # "use client": componente do formulário de cartão (0009)
  env.ts            # Zod das variáveis ABACATEPAY_*
contract/           # suíte de contrato reutilizável (tests/)
```
**Tipos normalizados** (o resto do app só conhece isto):
```ts
export type PaymentMethod = "PIX" | "CARD" | "BOLETO";            // BOLETO reservado, não usado na v1
export type PaymentStatus =
  | "PENDING" | "PAID" | "FAILED" | "EXPIRED" | "CANCELED" | "REFUNDED" | "DISPUTED";
// Mapeamento AbacatePay (map.ts): PENDING→PENDING; APPROVED|PAID|REDEEMED?→PAID; FAILED→FAILED;
// EXPIRED→EXPIRED; CANCELLED→CANCELED; REFUNDED→REFUNDED; UNDER_DISPUTE→DISPUTED.
// REDEEMED não está documentado: tratar como DESCONHECIDO (loga e NÃO transiciona) até confirmar.

export type GatewayId = "abacatepay"; // união cresce a cada adapter (efi | stripe | paypal)

export type GatewayCapabilities = {
  methods: PaymentMethod[];                  // abacatepay v1: ["PIX","CARD"]
  currencies: "BRL"[];                       // internacional: amplia aqui
  countries: string[];                       // ["BR"]
  maxInstallments: number;                   // 12
  minInstallmentCents: number;               // 1000
  pixDefaultExpirySeconds: number;           // 1800
  supportsRefund: boolean;
  cardTokenTtlSeconds?: number;              // 60 (UI avisa se demorar)
};

export type Customer = { name: string; email: string; taxId: string; cellphone: string }; // só trafega, nunca persiste (6.2.3)

export type ChargeRef = { gateway: GatewayId; externalId: string };

export type ChargeSnapshot = {                // "verdade" devolvida por getCharge e por create*
  ref: ChargeRef; status: PaymentStatus; amountCents: number; currency: "BRL";
  rawStatus: string;                          // só para log/diagnóstico
  devMode: boolean;
  pix?: { copyPaste: string; qrImageBase64: string; expiresAt: Date };
  card?: { brand?: string; last4?: string; installments: number };
  expiresAt?: Date;
};

export type NormalizedEvent = {
  gateway: GatewayId; eventId: string;        // idempotência
  kind: "CHARGE_UPDATED" | "IGNORED";         // v1: qualquer evento de cobrança vira "reconsulte"
  ref?: ChargeRef; ourPaymentId?: string;     // um dos dois localiza o Payment
  devMode: boolean;
};

export interface PaymentGateway {
  readonly id: GatewayId;
  readonly capabilities: GatewayCapabilities;
  installmentOptions(totalCents: number): { count: number; installmentCents: number; totalCents: number }[]; // puro; v1: sem juros, parcela >= mínimo
  createPixCharge(i: { paymentId: string; amountCents: number; description?: string; expiresInSeconds: number; customer?: Customer }): Promise<ChargeSnapshot>;
  createCardCharge(i: { paymentId: string; amountCents: number; installments: number; customer: Customer; cardPayload: CardPayload }): Promise<ChargeSnapshot>;
  getCharge(ref: ChargeRef): Promise<ChargeSnapshot>;
  /** Autentica (segredo + assinatura, tempo constante) e normaliza. Lança WebhookAuthError se inválido. */
  parseWebhook(req: { rawBody: string; headers: Headers; url: URL }): Promise<NormalizedEvent>;
  refund?(ref: ChargeRef, reason?: string): Promise<ChargeSnapshot>;     // opcional
}
export type CardPayload = { gatewayToken: string; brand?: string; last4?: string }; // opaco para o core
```
`GatewayError` (adapter nunca vaza texto do fornecedor): `code` ∈ `CARD_DECLINED | CARD_INVALID | TOKEN_EXPIRED | CUSTOMER_INVALID | AMOUNT_INVALID | NOT_ENABLED | RATE_LIMITED | UNAVAILABLE | UNKNOWN_OUTCOME` (`UNKNOWN_OUTCOME` = timeout/rede **depois** de enviar a cobrança de cartão: **proibido repetir**). Core converte em `BusinessError`/códigos da spec 0003 (tabela 6.2.6).

**Registro único** (`registry.ts`) — o único arquivo que importa adapters:
```ts
export const registry = {
  abacatepay: { gateway: abacatepayGateway, CardForm: AbacatePayCardForm /* "use client" */ },
} satisfies Record<GatewayId, { gateway: PaymentGateway; CardForm: ComponentType<CardFormProps> }>;
```
Um **módulo só de servidor** que referencia um componente `"use client"` é válido (vira referência de cliente); o Server Component da página renderiza `<CardForm/>` do adapter como *slot* dentro da casca de checkout (0009). Assim **só o formulário do gateway ativo** vai para o navegador e `abacatepay.js` fica encapsulado no adapter. Como `server-only` não está instalado, a fronteira é garantida por (a) `registry.ts` e `adapters/*/index.ts` só importados por `core/`, actions e rotas; (b) teste que falha se `src/components/**` ou `"use client"` importar `registry` (grep/AST simples); instalar `server-only` é alternativa barata → **pergunta 10** (dependência nova só com aprovação).

**Config central** (`config.ts`) — o único ponto de escolha:
```ts
// PAYMENT_GATEWAY=abacatepay            (obrigatória; padrão para novas cobranças)
// PAYMENT_GATEWAYS_ENABLED=abacatepay   (opcional; default = [PAYMENT_GATEWAY]; mantém webhooks/consulta/reembolso
//                                        de gateways antigos funcionando após uma troca)
export function selectGateway(ctx?: { country?: string; locale?: string; currency?: string }): PaymentGateway
// v1: ignora ctx e devolve o default. EXTENSÃO FUTURA (internacional), só nesta função e na config:
//   PAYMENT_ROUTING='{"BR":"abacatepay","*":"stripe"}'  ou regra por locale/moeda; o resto do app não muda,
//   pois cada Payment grava o próprio `gateway`.
export function getGatewayById(id: string): PaymentGateway | null   // só se estiver em ENABLED (webhook, getCharge, refund usam o do Payment)
export function getCheckoutConfig(ctx?): { gatewayId; capabilities; installmentOptions(total) }  // o que a UI consome
```
Validação de env **por adapter** (`adapters/*/env.ts`, Zod 4), **preguiçosa**: faltou variável do adapter → `selectGateway` lança `GatewayError("NOT_ENABLED")` → ação devolve `UNAVAILABLE/PAYMENTS_UNAVAILABLE` (não derruba `next build` nem páginas sem pagamento).

#### 6.2.2 Variáveis de ambiente (`.env.example` ganha estas linhas; **valores nunca em spec/commit**)
| Variável | Escopo | Teste/sandbox | Produção |
|---|---|---|---|
| `PAYMENT_GATEWAY` | servidor | `abacatepay` | `abacatepay` |
| `PAYMENT_GATEWAYS_ENABLED` | servidor, opcional | — | só durante troca |
| `ABACATEPAY_API_KEY` | servidor | chave dev (`abc_dev_…`, perm. `TRANSPARENT:CREATE`, `TRANSPARENT:READ`, `REFUND:CREATE` se usar) | chave de produção |
| `ABACATEPAY_PUBLIC_KEY` | servidor → props do `CardForm` | `pk_…` **do mesmo ambiente** | idem |
| `ABACATEPAY_WEBHOOK_SECRET` | servidor | aleatório ≥ 32 bytes | aleatório distinto do teste |
| `ABACATEPAY_WEBHOOK_HMAC_KEY` | servidor | chave pública publicada nas docs (não é segredo) | idem |
| `APP_URL` | servidor | `http://localhost:3000` (+ túnel HTTPS para o webhook: **o endpoint exige HTTPS e não aceita IP privado**) | domínio |
O ambiente é definido pela **chave**; o adapter lê `devMode` da resposta e **rejeita** `devMode=true` quando `NODE_ENV==="production"` e `devMode=false` fora dela (evita cobrar “de verdade” em dev e confirmar pedido real com evento de teste). Todas as chaves ficam fora do cliente; `ABACATEPAY_PUBLIC_KEY` é pública por natureza, mas entregue por props para não congelar no build.

#### 6.2.3 Modelo de dados / migration
Diff proposto em `prisma/schema.prisma` (migration `add_payments`, **revisar o SQL**; nenhuma coluna obrigatória nova em `Order` → compatível com pedidos existentes):
```prisma
// status: "PENDING" | "PAID" | "SHIPPED" | "DELIVERED" | "CANCELED" | "EXPIRED"
model Order {
  // ...campos atuais
  currency      String    @default("BRL")
  reservedUntil DateTime?           // estoque reservado até aqui (null = pedido legado)
  paidAt        DateTime?
  payments      Payment[]
  @@index([status, reservedUntil])   // varredura de expirados
}

// method: "PIX" | "CARD" | "BOLETO"   status: PENDING|PAID|FAILED|EXPIRED|CANCELED|REFUNDED|DISPUTED
model Payment {
  id             String    @id @default(cuid())
  orderId        String
  order          Order     @relation(fields: [orderId], references: [id], onDelete: Restrict)
  gateway        String                      // "abacatepay"
  method         String
  status         String    @default("PENDING")
  amountCents    Int                         // = Order.totalCents no momento da cobrança (servidor)
  currency       String    @default("BRL")
  installments   Int       @default(1)
  externalId     String?                     // id no gateway (preenchido após a resposta)
  rawStatus      String?
  pixCopyPaste   String?   // brCode (reexibir ao recarregar)
  pixQrBase64    String?   // brCodeBase64 (alternativa: re-gerar a partir do brCode no cliente — pergunta 11)
  expiresAt      DateTime?
  cardBrand      String?
  cardLast4      String?
  failureCode    String?                     // código normalizado (CARD_DECLINED…), nunca texto do fornecedor
  lastSyncedAt   DateTime?                   // throttle da reconciliação
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  @@unique([gateway, externalId])            // NULLs não colidem no Postgres
  @@index([orderId])
  @@index([status, expiresAt])
}

model PaymentEvent {                         // idempotência de webhook + trilha de auditoria
  id          String   @id @default(cuid())
  gateway     String
  eventId     String
  paymentId   String?
  outcome     String                          // "APPLIED" | "NOOP" | "IGNORED" | "MISMATCH"
  receivedAt  DateTime @default(now())
  @@unique([gateway, eventId])
  @@index([receivedAt])                       // retenção: apagar > 180 dias (job manual v1)
}
```
- **Um pagamento ativo por pedido** (impede duplo clique/dupla cobrança): índice parcial **escrito à mão no SQL da migration** (Prisma não expressa): `CREATE UNIQUE INDEX "Payment_one_pending_per_order" ON "Payment"("orderId") WHERE "status" = 'PENDING';`. A violação (`P2002`) vira `CONFLICT/PAYMENT_IN_PROGRESS`; Pix pendente e não expirado do mesmo método é **reaproveitado** em vez de erro (0008).
- **Idempotência de criação:** o `Payment` é gravado **antes** de chamar o gateway (id nosso, `externalId` nulo). Esse id vai como `externalId` do Pix e em `metadata.paymentId` no cartão (únicos campos que a doc diz que voltam/valem). Sem resposta (timeout) o `Payment` fica `PENDING` e a reconciliação o resolve — **nunca** nova cobrança de cartão automática.
- **LGPD / minimização:** `Customer.taxId` e `cellphone` **não são persistidos** em `Payment`/`User` na v1 (só trafegam do formulário → servidor → gateway); o `Payment` guarda bandeira + 4 últimos dígitos (já mascarados). Sem dado de cartão em nenhum ponto do servidor. Se a loja precisar de CPF para nota fiscal, vira spec própria (pergunta 8). `pixCopyPaste` não é sensível, mas é credencial de pagamento de curta duração: só visível ao dono (IDOR) e some do polling quando `status≠PENDING`.
- **Máquina de estados** (única função `canTransition(from, to)` em `core/state.ts`, com teste de tabela):
```
Payment: PENDING → PAID | FAILED | EXPIRED | CANCELED
         PAID → REFUNDED | DISPUTED        DISPUTED → PAID | REFUNDED
         FAILED/EXPIRED/CANCELED/REFUNDED: terminais
Order:   PENDING → PAID | CANCELED | EXPIRED
         PAID → SHIPPED → DELIVERED (admin, fora desta spec);  PAID → CANCELED só por reembolso (fora)
```

#### 6.2.4 Webhook genérico — `src/app/api/payments/webhook/[gateway]/route.ts`
Rota **genérica** (`POST`). `[gateway]` seleciona o adapter dentre os **habilitados**; trocar o gateway ativo **não altera esta rota**. *Desvio consciente do pedido (“delega ao adapter ativo”):* resolver pelo parâmetro mantém **confirmando** cobranças pendentes do gateway anterior depois de uma troca e prepara o internacional (dois gateways ativos). A URL cadastrada no painel do fornecedor é por fornecedor de qualquer jeito. Decisão humana: pergunta 12.

Algoritmo (**sem** `export const runtime` — o código é agnóstico de runtime, ver 6.3; **sem** `after()` — o processamento é uma transação curta e a doc de reentrega é por 2xx em ≤ 30 s):
1. `gateway = getGatewayById(params.gateway)`; desconhecido/não habilitado → **404** (sem corpo útil).
2. `rawBody = await request.text()`; limite de tamanho (rejeitar > 64 KiB → 413).
3. `event = await gateway.parseWebhook({ rawBody, headers, url })` — o adapter verifica **segredo e HMAC-SHA256 com Web Crypto (`crypto.subtle`) e `safeEqual` próprio em tempo constante** (6.3.2; sem `node:crypto`), JSON válido e `devMode` coerente. Falha → **401** (AbacatePay não reentrega 4xx; atacante não aprende nada).
4. Transação: `INSERT PaymentEvent{gateway,eventId}`; `P2002` → **200** `{ok:true,duplicate:true}`.
5. Localiza o `Payment` (`ref.externalId` ou `ourPaymentId`). **Não encontrado** → **desfaz o insert do evento e responde 503** (reentrega: cobre a janela em que o webhook chega antes de gravarmos `externalId`). Após as 7 tentativas o fornecedor desiste; a reconciliação cobre.
6. `snapshot = await gateway.getCharge(ref)` (valida status e valor); `applyCharge(payment, snapshot)` (6.2.5). Falha de rede no `getCharge` → 503 (reentrega).
7. Responde **200**. Erro inesperado → logar (`logError`, sem corpo, sem headers, sem segredo na URL) e **500** (reentrega). Nunca responder **410** (desativaria o webhook no fornecedor).
Logs: `eventId`, `gateway`, `paymentId`, `outcome`; **nunca** `rawBody`, query string (contém `webhookSecret`) nem `taxId`.

#### 6.2.5 Núcleo agnóstico (`core/`)
- `applyCharge(payment, snapshot)` — **única** porta de mudança de estado (usada por webhook, reconciliação e resposta síncrona do cartão). Em transação:
  - confere `snapshot.amountCents === payment.amountCents` e `currency`; divergência → `PaymentEvent.outcome="MISMATCH"`, log de alerta, **não** marca pago.
  - `canTransition`; igual ao atual → `NOOP`.
  - `PAID`: `order.updateMany({ where:{id, status:"PENDING"}, data:{status:"PAID", paidAt} })`. Se `count===0` (pedido já `EXPIRED/CANCELED` — pagamento tardio): tenta **re-reservar** estoque com o mesmo decremento condicional; se conseguir → `PAID`; senão `Payment.PAID` + `Order` permanece cancelado + log de alerta `PAID_WITHOUT_STOCK` (visível ao admin; reembolso manual). Mitigado por `reservedUntil` ≥ expiração do Pix + margem (abaixo).
  - `FAILED/EXPIRED/CANCELED`: encerra o `Payment`; **o pedido continua `PENDING` até `reservedUntil`** (o cliente pode tentar outro meio). `releaseOrder` só quando o pedido expira/cancela.
  - `REFUNDED/DISPUTED`: atualiza o `Payment` e registra; efeito no pedido/estoque é decisão de negócio (pergunta 7), v1 só registra e loga alerta.
- `releaseOrder(orderId, newStatus)` — `updateMany where status:"PENDING"` (condicional → exatamente uma liberação) + `product.update increment` para cada item com `productId` não nulo, na mesma transação.
- `releaseExpiredOrders(now)` — varre `Order{status:PENDING, reservedUntil<now}` **sem Payment pendente não expirado**; chamada de forma **preguiçosa** (ao abrir o checkout, `/conta/pedidos` e antes de `createOrder` do mesmo usuário) e por rota opcional protegida `POST /api/payments/reconcile` (header `Authorization: Bearer ${CRON_SECRET}`) para agendador externo. **Cron é opcional na v1** (sem infraestrutura de agendamento garantida): a liberação preguiçosa já impede overselling no caminho comum; estoque de pedido abandonado fica preso até alguém tocar o sistema — aceito e documentado (pergunta 5).
- `reconcilePayment(paymentId)` — `getCharge` + `applyCharge`, throttled **no banco** (nunca em memória): o "claim" é `payment.updateMany({ where:{ id, status:"PENDING", OR:[{lastSyncedAt:null},{lastSyncedAt:{lt: now-15s}}] }, data:{ lastSyncedAt: now } })`; `count===0` → outro request já consultou, apenas lê o estado. Chamada pelo polling do Pix (0008) e pelo carregamento da página de pagamento. É a rede de segurança para webhook perdido e para o caso (2) “cartão `APPROVED` sem webhook imediato”. **Server-to-server; nunca disparada pelo navegador com dado do navegador.**
- `startPayment`/`payWithCard` (contratos em 0008/0009) vivem em `src/actions/payments.ts`; **não contêm `if (gateway === …)`**: só chamam `selectGateway()`/`getGatewayById()` e a interface.
- **Reserva:** `createOrder` passa a gravar `reservedUntil = now + 35 min` (Pix expira em 30 min = `pixDefaultExpirySeconds`; 5 min de margem reduzem pagamento tardio). Limite de **3 pedidos `PENDING` por usuário** (`CONFLICT/TOO_MANY_PENDING`) e rate limit nas chaves `pay-user:`/`pay-ip:` (reusa `lib/rate-limit.ts`: `recordAttempt` para cada criação de pedido e cada tentativa de cartão).

#### 6.2.6 Mapeamento de erros (spec 0003)
| Origem | `Result` ao cliente | Observação |
|---|---|---|
| `CARD_DECLINED`, `CARD_INVALID` | `CONFLICT/CARD_DECLINED` | AbacatePay devolve mensagem genérica de propósito; UI não promete motivo. |
| `TOKEN_EXPIRED` | `CONFLICT/CARD_TOKEN_EXPIRED` | UI re-tokeniza. |
| `CUSTOMER_INVALID` | `VALIDATION` com `fieldErrors` (`taxId`, `cellphone`) ou `CONFLICT/CUSTOMER_INVALID` | Zod valida dígitos do CPF/CNPJ antes. |
| `AMOUNT_INVALID` (< R$ 1; parcela < R$ 10) | `VALIDATION`/`CONFLICT/INSTALLMENT_TOO_LOW` | Capabilities já escondem opções inválidas. |
| `UNAVAILABLE`, `RATE_LIMITED`, `NOT_ENABLED` | `UNAVAILABLE/PAYMENTS_UNAVAILABLE` | Loga com `logError`. |
| `UNKNOWN_OUTCOME` | `ok` com `status:"PROCESSING"` | Payment fica `PENDING`; UI diz “estamos confirmando”; **sem retry automático**. |
| Reentrada de pagamento ativo | `CONFLICT/PAYMENT_IN_PROGRESS` | índice parcial. |
| Pedido expirado/ cancelado | `CONFLICT/ORDER_EXPIRED` | UI oferece voltar ao carrinho. |
Novos `detailCode` entram em `src/lib/i18n.ts` (pt/en/es) conforme o padrão `error.*` (`translateError`).

#### 6.2.7 Contrato com 0008/0009
`getCheckoutConfig()` → `{ gatewayId, capabilities, installmentOptions }` (serializável); `registry[gatewayId].CardForm` (slot); Server Actions `startPixPayment(orderId)`, `payWithCard(...)`; rota `GET /api/payments/[paymentId]/status` → `{ status: PaymentStatus; orderStatus; expiresAt? }`.

#### 6.2.8 Extensão futura prevista (não implementar)
`GatewayId`/registry/`PAYMENT_ROUTING` na `config.ts`; `Customer`/`CardPayload` já opacos; `currencies/countries` nas capabilities; `Payment.gateway` por linha; webhook por `[gateway]`. Falta decidir no futuro: moeda no catálogo (`Product.priceCents` hoje é BRL implícito) e idioma ≠ país.

#### 6.2.9 Como adicionar/trocar um gateway (passo a passo)
**Trocar** (adapter já existe): (1) preencher as variáveis `<ADAPTER>_*` do ambiente; (2) `PAYMENT_GATEWAY=<novo>`; (3) manter o antigo em `PAYMENT_GATEWAYS_ENABLED` até esgotar cobranças pendentes e cadastrar o webhook do novo (`https://<domínio>/api/payments/webhook/<novo>`); (4) deploy. **Nenhum arquivo de checkout, action, rota ou UI muda.**
**Adicionar** adapter novo: (1) criar `adapters/<id>/` implementando `PaymentGateway` + `env.ts` + `card-form.tsx` (se oferecer cartão); (2) adicionar o `<id>` à união `GatewayId` e **uma linha** em `registry.ts`; (3) passar a suíte de contrato (`tests/payments/contract.ts`) com fixtures do fornecedor; (4) documentar variáveis em `.env.example`; (5) trocar conforme acima.

### 6.3 Compatibilidade vinext / Workers (requisito do usuário)
**Fontes:** README do vinext (https://github.com/cloudflare/vinext, lido em 2026-10-28) e docs da Prisma para Cloudflare Workers (https://www.prisma.io/docs/orm/prisma-client/deployment/edge/deploy-to-cloudflare). **Não** li o código do vinext nem rodei `vinext check` (passo 0).

**Premissas**
1. O projeto **continua em `next` 16.4.3**; nada pode quebrar lá. vinext é alvo de portabilidade, não de migração agora.
2. vinext é **experimental**: o README diz "not yet a drop-in replacement" e que "some recently introduced or undocumented Next.js behavior may not yet be reproduced"; `cacheComponents` incompleto (já está **desligado** aqui); alvo declarado: Next 16.x.
3. Em Workers não há memória compartilhada entre requisições/isolates, nem FS, nem módulos nativos (Node-API); `fail the build or the request` ao importar nativos (README).
4. **Não confirmado:** se o runtime de destino terá `nodejs_compat` (o README do vinext não o menciona; a doc da Prisma o exige para `@prisma/adapter-pg`). Por isso a camada de pagamentos **não depende dele**.

**6.3.1 Matriz Next-only vs portável (o que as specs 0007–0009 usam)**
| Recurso | Onde é usado | Status no vinext (README) | Portável? | Fallback / decisão |
|---|---|---|---|---|
| `fetch` (chamadas ao gateway) | adapter | padrão web | ✅ | — |
| Web Crypto `crypto.subtle`, `TextEncoder`, `atob/btoa`, `crypto.randomUUID` | HMAC do webhook, ids | padrão web | ✅ | substitui `node:crypto`/`Buffer`/`timingSafeEqual` (6.3.2) |
| Route Handlers (`app/api/**/route.ts`) com `Request`/`Response` | webhook, status, reconcile | ✅ suportado | ✅ | usar só Web `Request`/`Response`; `NextRequest` só se necessário e sem recursos exclusivos |
| `export const runtime` | — | 🟡 `runtime` suportado | ✅ | **não declarar** (evita `"nodejs"` fixo) |
| Server Actions (`"use server"`) | `createOrder`, `startPixPayment`, `payWithCard` | ✅ suportado | ✅ (com risco de lacunas finas) | já é o padrão do projeto; cobrir com teste de integração; **fallback** se `vinext check` apontar problema: expor a mesma função por Route Handler `POST` (o `core/` não muda) |
| `next/headers` (`cookies()`, `headers()`) assíncronos | via `auth()`/rate limit (`clientIp`) | ✅ | ✅ | já `await`ados |
| `next/cache` `revalidatePath` | `applyCharge`, `createOrder` | ✅ suportado | ✅ | invalidação isolada em um helper `invalidateOrderViews()` (um ponto de troca) |
| `after()` (`next/server`) | **não usado** (rejeitado na 6.2.4) | ✅ listado | — | — |
| `next/navigation` (`redirect`, `notFound`) e `unstable_rethrow` (em `src/lib/action.ts`) | actions/páginas | `unstable_rethrow` **não listado** no README | ⚠️ a confirmar | `vinext check`; se faltar, trocar por checagem do `digest` do erro **em `defineAction`**, ponto único já existente |
| Proxy (`src/proxy.ts`, `authorized`) | rotas `/conta`, `/carrinho` | ✅ `proxy.ts` | ✅ | webhook **fora** do matcher (já) |
| `error.tsx`/`loading.tsx`/`not-found.tsx` | 0008 | ✅ | ✅ | — |
| `next/script` (4 strategies) | 0009 | ✅ | ✅ | — |
| `next/image` | não usado nestas specs (QR é `<img>` de data URL) | 🟡 sem otimização no build | ✅ | evitar depender de `sizes`/otimização no checkout |
| `next/font`, route segment config (`dynamic`) | já no projeto | 🟡 | ✅ | sem `preferredRegion` (ignorado) |
| `"use cache"`, `cacheComponents`, `cacheLife/Tag` | **não usados** | incompleto | — | continuam desligados |
| Auth.js v5 beta (`auth()`, JWT) | login/ações | — | ⚠️ não avaliado nesta spec | `bcryptjs` (JS puro) ok; `PrismaAdapter` está em `package.json` (`@auth/prisma-adapter`) — confirmar uso real; fora do escopo, registrar no passo 0 |
| `@azure/storage-blob` | só upload (`/api/upload`), **não** pagamentos | não avaliado | ⚠️ fora do escopo | não importar no módulo de pagamentos |

**6.3.2 Regras da camada de pagamentos (`src/lib/payments/**`, `src/actions/payments.ts`, `src/app/api/payments/**`)**
- Só `fetch`, `Request/Response/Headers`, `URL`, `TextEncoder/Decoder`, `crypto.subtle`, `crypto.getRandomValues/randomUUID`, `atob/btoa`. **Proibido:** `node:*`, `fs`, `net`, `child_process`, `crypto` (Node), `Buffer`, `process.on/exit`, SDKs de gateway que dependam de Node (por isso 5.1-C fica rejeitada também por compatibilidade), módulos nativos.
- HMAC: `crypto.subtle.importKey('raw', keyBytes, {name:'HMAC', hash:'SHA-256'}, false, ['sign'])` → `sign` → base64 via `btoa` sobre bytes. `crypto.subtle.verify` com HMAC já é em tempo constante e **é o preferido** para a assinatura (comparar bytes decodificados da assinatura do header); para o `webhookSecret` (string) e o `CRON_SECRET`, usar `safeEqual(a, b)` próprio em `lib/payments/safe-equal.ts`: codifica ambos com `TextEncoder`, calcula HMAC-SHA256 de cada um com uma chave efêmera aleatória e compara os digests de tamanho fixo com XOR acumulado sem retorno antecipado (esconde também o tamanho). Testes 3, 3b.
- Leitura de variáveis de ambiente **em um único módulo** (`lib/payments/env.ts` → `getEnv()`), pois em Workers os bindings chegam por mecanismo diferente de `process.env` (**não confirmado**). Ninguém mais lê `process.env` na camada de pagamentos; trocar o mecanismo = alterar esse arquivo. Leitura **por requisição** (nada lido/guardado no escopo do módulo).
- `getGatewayById`/`selectGateway` constroem o adapter **por chamada** (ou memoização apenas de dados imutáveis e sem segredo); sem *singleton* com credenciais.

**6.3.3 Estado compartilhado: nada em memória do processo**
| Necessidade | Solução (portável) |
|---|---|
| Throttle do `reconcile` | `Payment.lastSyncedAt` com *claim* condicional no banco (6.2.5) |
| Rate limit de cartão/pedido | `lib/rate-limit.ts` já é Postgres (`AuthAttempt`) — **reutilizado** (nenhum `Map` em memória) |
| Idempotência do webhook | `PaymentEvent` único no banco |
| Cache de status/Pix | **sem cache de módulo**; o polling lê o banco (e `Cache-Control: no-store`) |
| Contagem/expiração | `Order.reservedUntil`/`Payment.expiresAt` no banco; relógio = `Date.now()` por requisição |
| Agendamento | `POST /api/payments/reconcile` chamado por agendador externo (Cron Trigger do Workers, GitHub Actions, etc.); nenhum `setInterval`/`setTimeout` longo no servidor |
| Trabalho após a resposta | não usado (`after()` evitado; transações curtas) |

**6.3.4 Banco e Prisma em Workers — risco e decisão (sem trocar o banco agora)**
- **Fato (código):** `src/lib/db.ts:1-7` usa `new PrismaClient()` clássico (`@prisma/client` 6.19.3, `provider = "prisma-client-js"`) como **singleton em `globalThis`**. O engine clássico é binário/nativo e **não roda em Workers**. A doc da Prisma para Workers (página lida) descreve **driver adapters** (`@prisma/adapter-pg` com `nodejs_compat`, `@prisma/adapter-neon` via HTTP, Prisma Postgres) e cria **o adapter e o `PrismaClient` dentro do `fetch` (por requisição)**; os exemplos da página usam `provider = "prisma-client"` com `output` e Prisma **7**, e a página **não** trata `driverAdapters`/`engineType` nem a versão em que se tornaram estáveis. **Não confirmado:** se Prisma **6.19** suporta o mesmo caminho de forma estável (o projeto está fixado em 6 por uma incompatibilidade anterior com CLI 8 rc + client 7 — premissa do projeto).
- **Decisão desta spec:** a camada de pagamentos acessa o banco **só** por `import { db } from "@/lib/db"` (nunca instancia cliente próprio) e usa transações interativas curtas; `lib/db.ts` é o **único ponto** a mudar numa migração de runtime (ex.: fábrica `getDb()` por requisição + driver adapter). **Nenhuma mudança em `db.ts`, no schema de provedor ou no banco nesta série.**
- **Alternativas** (para decisão futura, não implementadas): (A) manter Node (Next normal, ou vinext em Node/Nitro) — zero mudança, **recomendada agora**; (B) Workers + Postgres via **Hyperdrive** + `@prisma/adapter-pg` (exige `nodejs_compat`, upgrade de Prisma a validar, cliente por requisição); (C) Postgres serverless HTTP (Neon/Prisma Postgres) + `@prisma/adapter-neon`; (D) migrar para D1/SQLite (muda banco, SQL e migrations — **fora**, só se houver razão de negócio). Custo/risco: B e C mexem em `db.ts`, no gerador e no upgrade do Prisma (risco da incompatibilidade já vista); D reescreve migrations (índice parcial do 6.2.3 precisaria de equivalente).
- **Restrições que o desenho já respeita:** transações curtas; sem `$queryRaw` exclusivo de Postgres além do índice parcial em SQL da migration (único ponto Postgres-específico, documentado); sem conexões longas nem `LISTEN/NOTIFY`; sem `prisma.$connect` global.
- O `pg`/TCP em Workers depende de `nodejs_compat`; a doc da Prisma ainda cita limitação com `@cloudflare/next-on-pages` — irrelevante para vinext, mas mostra que cada alvo precisa de teste próprio.

**6.3.5 Como a regra é imposta (CI)**
Teste 3c (seção 8) + script `npm run check:portability` (somente leitura) chamado pelo CI: varre imports em `src/lib/payments/**`, `src/actions/payments.ts`, `src/app/api/payments/**`, `src/components/checkout/**` contra uma lista negra (`node:*`, `fs`, `path` (exceto tipos), `net`, `child_process`, `crypto`, `os`, `stream`, `Buffer`, `sharp`…), e acusa `let` de módulo mutável/`new Map()` em escopo de módulo nessa camada. Se `vinext check` (passo 0) revelar mais itens, estende-se a lista. **Sem dependência nova** (varredura por regex/`ts` já instalado); `eslint no-restricted-imports` por *override* de diretório é a alternativa mais simples ainda e é a recomendada — decisão 15.

**6.3.6 Plug and play × vinext:** o registro e a config (6.2.1) não mudam; um adapter novo deve passar também a **suíte de contrato de portabilidade** (usa só APIs web; teste 3c cobre o adapter novo automaticamente por estar sob `adapters/**`).

**6.3.7 Resultado do `vinext check` (a preencher no passo 0)**
<saída resumida, data, versão do vinext e itens que afetam 0007–0009; "não executado" até a implementação>

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação (onde) |
|---|---|---|---|---|
| `createOrder` | ✗ | ✓ (próprio) | ✓ | `defineAction auth:"user"` (já existe) |
| `startPixPayment` / `payWithCard` | ✗ | ✓ **só do próprio pedido** | ✓ só do próprio | `defineAction auth:"user"` + `order.userId === session.user.id` na query (`where:{id, userId}`) |
| `GET /api/payments/[id]/status` | ✗ 401 | ✓ só dono | ✓ só dono | sessão + join `payment.order.userId` (recurso alheio → 404, não 403, para não confirmar existência) |
| `POST /api/payments/webhook/[gateway]` | ✓ (autenticado por segredo+HMAC) | — | — | `parseWebhook` (adapter) |
| `POST /api/payments/reconcile` | ✗ | ✗ | ✗ (só agendador) | `Bearer CRON_SECRET` (tempo constante) |
| Reembolso | — | — | fora do app (painel do gateway) | — |
- **IDOR:** toda query de `Order`/`Payment` do usuário filtra por `userId` (via `order`).
- **Validação:** Zod nas bordas (`orderId` cuid, `installments` inteiro 1..`capabilities.maxInstallments`, e `amount` **nunca** vem do cliente — `amountCents` é lido de `Order.totalCents`); allowlist de `method`; limites de tamanho (`cardPayload.gatewayToken` ≤ 200, nomes ≤ 150); CPF/CNPJ com dígito verificador; e-mail normalizado.
- **Dinheiro/estoque:** centavos inteiros; total e estoque sempre do banco (padrão do `createOrder` preservado).
- **Abuso:** *card testing* é o risco real → rate limit por usuário e por IP em tentativas de cartão (ex.: 5 por 15 min por usuário, 20 por IP — valores a calibrar) e `recordAttempt` **em toda** tentativa; criação de pedidos limitada (3 pendentes). Webhook: sem rate limit próprio (o fornecedor controla), mas limite de corpo e verificação antes de qualquer trabalho no banco.
- **Dados sensíveis:** nunca tocar número/CVV (iframe do fornecedor); logs sem `rawBody`, query, `taxId`, e-mail, token `ctok_`/`cardToken`; `logError` já loga sem PII (spec 0003) — estender o teste. Segredos só em env; `ABACATEPAY_API_KEY` nunca importada em módulo cliente.
- **Webhook em URL com segredo:** o segredo na query pode aparecer em logs de proxy/CDN → mitigado pela opção 5.2-B (spoof inofensivo, pois o estado vem de `getCharge`) e por rotação do segredo.

## 8. Plano de testes
Infra: reutiliza Vitest + Postgres `*_test` (`tests/`). **Sem dependência nova.** Adapter AbacatePay testado com `fetch` injetado/stub (mock apenas do **terceiro**; Prisma real).
| # | Caso | Camada | Resultado esperado |
|---|---|---|---|
| 1 | `canTransition` (tabela completa) | unit | só transições listadas |
| 2 | `map.ts`: cada status do fornecedor → normalizado; `REDEEMED`/desconhecido → não transiciona | unit | conforme 6.2.1 |
| 3 | HMAC: corpo válido; corpo adulterado; assinatura de tamanho diferente (`safeEqual` não lança nem vaza tamanho); segredo errado/ausente; vetor de teste do HMAC idêntico ao de `node:crypto` (só no teste) | unit | só o válido passa; demais `WebhookAuthError` |
| 3b | `safeEqual`: iguais/diferentes/prefixo/tamanhos distintos; sem early-return por byte | unit | resultado correto |
| 3c | **Guarda de portabilidade (CI):** nenhum arquivo em `src/lib/payments/**` e `src/actions/payments.ts` e `src/app/api/payments/**` importa `node:*`/`fs`/`net`/`child_process`/`crypto`/`Buffer`, `process.on`, nem usa estado de módulo mutável (ver 6.3.5) | unit (varredura de imports/AST) | falha o build com o arquivo e a linha |
| 4 | `installmentOptions`: R$ 25 → só 1x e 2x; R$ 100 → até 10x; total R$ 1.200 → 12x de R$ 100 | unit | parcela ≥ R$ 10; soma = total (resto na 1ª parcela) |
| 5 | **Contrato (suíte reutilizável)** com fixtures do adapter: cria Pix (campos obrigatórios), cria cartão aprovado/recusado, `getCharge` normaliza, `parseWebhook` aceita/rejeita, `capabilities` coerente, nenhum texto de fornecedor em `GatewayError`, `UNKNOWN_OUTCOME` em timeout | contrato | passa para AbacatePay; **é o critério de aceite de qualquer adapter novo** |
| 6 | Webhook: segredo inválido → 401, **sem tocar o banco** | integração | 401 + nenhuma linha |
| 7 | Webhook feliz → `Payment.PAID`, `Order.PAID`, `paidAt` | integração | consistente na mesma transação |
| 8 | **Reentrega duplicada** (mesmo `eventId`) → 200 duplicate, sem dupla transição | integração | 1 `PaymentEvent` |
| 9 | Reenvio manual (novo `eventId`, mesmo estado) | integração | `NOOP` |
| 10 | **Duas entregas concorrentes** (`Promise.all`) | integração | um `APPLIED`, outro duplicate/NOOP; estado final único |
| 11 | Webhook antes de `externalId` gravado | integração | 503 e evento desfeito; após gravar, reentrega aplica |
| 12 | Valor divergente do `getCharge` | integração | `MISMATCH`, pedido não vira `PAID` |
| 13 | `devMode` incoerente com `NODE_ENV` | unit/integração | rejeitado |
| 14 | `getCharge` falha (rede) | integração | 503, estado intacto |
| 15 | Pagamento tardio após `EXPIRED`: com estoque → `PAID`; sem estoque → alerta `PAID_WITHOUT_STOCK`, estoque não negativo | integração | conforme 6.2.5 |
| 16 | `releaseOrder`/`releaseExpiredOrders`: devolve estoque 1x (chamar 2x concorrentes) | integração | estoque restaurado exatamente uma vez |
| 17 | `createOrder`: grava `reservedUntil`; 4º pedido pendente → `TOO_MANY_PENDING`; **testes antigos (`crud-orders-actions`) continuam verdes** | integração | — |
| 18 | Índice parcial: 2º `Payment PENDING` do mesmo pedido | integração | `P2002` → `PAYMENT_IN_PROGRESS` |
| 19 | Autorização: anônimo / cliente em pedido de **outro** cliente / pedido inexistente | integração | `UNAUTHENTICATED` / `NOT_FOUND` (sem vazar existência) |
| 20 | `reconcile`: sem/errado `CRON_SECRET` → 401 | integração | — |
| 21 | Log: spy em `console.*`/`logError` durante os casos 6–14 não contém `rawBody`, `webhookSecret`, `taxId`, token | integração | zero ocorrências |
| 22 | Troca de gateway: com um adapter *fake* registrado só no teste, `PAYMENT_GATEWAY=fake` faz `startPixPayment`/webhook funcionarem **sem mudança** em actions/rotas | integração | prova do “plug and play” |
| 23 | Fronteira: nenhum arquivo cliente importa `registry`/`adapters/*/index` | unit (grep) | — |
Responsivo/a11y/e2e: N/A nesta spec (sem UI); ver 0008/0009 (e a decisão sobre instalar Playwright).

## 9. Plano de implementação
0. **Compatibilidade vinext (antes de qualquer código):** rodar `npx vinext check` na raiz (somente leitura; não instala dependência no projeto — se o `npx` pedir para instalar algo no projeto, parar) e registrar a saída resumida na seção 6.3.7 desta spec; também registrar `next build` verde como linha de base. Se `vinext check` apontar bloqueio em recurso usado pelas specs 0007–0009, voltar a `needs-revision`. **O projeto continua rodando em `next`; vinext é só uma verificação de portabilidade.**
1. **Sandbox primeiro (sem código de produto):** criar conta dev, chave dev, capturar **fixtures reais** de `transparent.completed` (Pix via `simulate-payment` e cartão), esclarecer não-confirmados 1–6 da seção 4.2; atualizar esta spec (se algo contradisse, voltar a `needs-revision`).
2. `types.ts`, `errors.ts`, `core/state.ts` + testes 1–2.
3. Migration `add_payments` (revisar SQL, incluir índice parcial) + testes 17–18.
4. `config.ts` + `registry.ts` com adapter *fake* de teste + suíte de contrato (teste 5) + teste 22–23.
5. Adapter AbacatePay: `client.ts`, `map.ts`, `webhook.ts`, `env.ts` (sem `card-form`) + testes 3–4 e contrato.
6. `core/applyCharge`, `releaseOrder`, `releaseExpiredOrders`, `reconcilePayment` + testes 7–16.
7. Rota de webhook + `reconcile` + testes 6–14, 19–21.
8. `createOrder` com `reservedUntil` e limite de pendentes (sem mudar o redirecionamento do carrinho — isso é 0008).
9. `.env.example`, documentação (seção 6.2.9 copiada para `README`/`spec/README` se aprovado), `npx tsc --noEmit`, `npx eslint src`, `npm test`, `npx next build`.

## 10. Riscos, rollback e dívidas
- **CNPJ (bloqueante para produção):** AbacatePay só atende PJ (MEI/ME). Se o cliente tem só CPF, o adapter alternativo seria **Efí**; o desenho permite escrever `adapters/efi` sem mexer no resto. Em desenvolvimento/homologação o sandbox funciona sem CNPJ.
- Liquidação do cartão em **D+30** (default) afeta o caixa; D+1 encarece (5,42%…17,37% + R$ 0,60).
- Limite inicial de **R$ 5.000 dia / R$ 1.000 noite**: pedido acima do limite pode falhar na produção; tratar `AMOUNT_INVALID`/recusa com mensagem útil e planejar pedido de aumento.
- Payload do webhook não documentado por completo (4.2 nº1) → mitigado por 5.2-B e fixtures.
- Webhook perdido/atrasado → reconciliação (polling server-side e preguiçosa); sem cron o estoque de abandono pode ficar preso.
- `PAID_WITHOUT_STOCK` e disputas exigem rotina manual de reembolso.
- Rollback: migration é **aditiva** (tabelas e colunas anuláveis/com default); reverter o código deixa `Payment` órfão sem efeito. Desligar pagamentos: `PAYMENT_GATEWAY` vazio → actions devolvem `PAYMENTS_UNAVAILABLE` e o carrinho não finaliza.
- **vinext/Workers (6.3):** vinext é experimental; o Prisma clássico (`db.ts`) **não roda em Workers** sem driver adapter e cliente por requisição; `nodejs_compat` e o mecanismo de env em Workers não confirmados; `unstable_rethrow` não listado no README. Mitigação: camada de pagamentos 100% web-API, estado só no banco, `db.ts` como ponto único de troca, `vinext check` no passo 0, Next normal continua sendo o alvo.
- Dívidas aceitas: sem boleto, sem reembolso na UI, sem cron de produção, sem CPF persistido, sem retenção automática de `PaymentEvent`.

## 11. Perguntas em aberto
- [ ] 1. O cliente possui **CNPJ (MEI serve)**? Se só CPF: aprovar **Efí** como adapter inicial no lugar da AbacatePay (muda a spec do adapter, não o resto).
- [ ] 2. **Confirmação estrita:** aprovar que o pedido só vira `PAID` por webhook **ou** por `getCharge` server-side (reconciliação) — nunca pela resposta do navegador — e que a resposta síncrona de cartão `APPROVED` **também** passa só por `applyCharge`? (recomendado) Ou exigir exclusivamente o webhook?
- [ ] 3. **Parcelamento e taxa:** parcelar até 12x **sem juros ao cliente** com a loja absorvendo 3,5%–4,5% + R$ 0,60? Ou repassar a taxa (exige validar na AbacatePay se `passFeesToCustomer` existe no transparente; hoje só confirmado em `checkouts`)? Limite de parcelas desejado (1–12) e parcela mínima (R$ 10 é o piso do gateway).
- [ ] 4. **Prazo de liquidação do cartão:** manter D+30 (3,5%+) ou antecipar (taxa sobe bastante)?
- [ ] 5. **Estoque:** reserva de 35 min com liberação preguiçosa (recomendado) é aceitável? Há agendador (cron) disponível no deploy para `POST /api/payments/reconcile`?
- [ ] 6. **Limite inicial R$ 5.000/dia e R$ 1.000/noite** é compatível com o ticket esperado?
- [ ] 7. **Reembolso/estorno e disputa:** quem opera (painel do gateway por ora)? Reembolso devolve estoque? Cancelamento por cliente após pago?
- [ ] 8. **CPF/CNPJ e telefone:** o gateway exige no pagamento; confirmo **não persistir** (só repassar)? Haverá nota fiscal (precisaria persistir)?
- [ ] 9. **Frete e endereço de entrega** (inexistentes no schema): entram em spec própria antes do go-live? O total a cobrar hoje é só a soma dos itens.
- [ ] 10. Instalar o pacote `server-only` (dependência mínima) para blindar `registry`/adapters contra import no cliente, ou ficar com o teste de grep?
- [ ] 11. QR do Pix: guardar `brCodeBase64` no banco (simples) ou re-renderizar o QR a partir do `brCode` (exigiria lib de QR no cliente — dependência nova)?
- [ ] 12. Webhook por `/api/payments/webhook/[gateway]` (recomendado) ou rota única que sempre usa o adapter ativo (como pedido, mais simples, mas perde cobranças pendentes do gateway antigo numa troca)?

- [ ] 13. **Alvo de runtime:** aceitar que a v1 roda em Node (Next normal) e que Workers/vinext é apenas "não bloquear" (código portável, sem migrar `db.ts`)? Ou há prazo para rodar em Workers (então abrir spec de Prisma/driver adapter, alternativas B/C da 6.3.4, com possível upgrade de Prisma)?
- [ ] 14. Aprovar rodar `npx vinext check` no passo 0 e **parar** se apontar bloqueio? (não instala nada no projeto; baixa o pacote temporariamente via `npx`)
- [ ] 15. Imposição da portabilidade: `eslint no-restricted-imports` por diretório (recomendado, sem dependência) + teste 3c, ou só o teste?
- [ ] 16. Aceitar a **regra "sem `node:*`/`Buffer`/SDK de gateway Node"** na camada de pagamentos (inclui HMAC por Web Crypto e `safeEqual` próprio)? Custo: ~40 linhas próprias e testes.
- [ ] 17. Agendador do `reconcile` (Cron Trigger/GitHub Actions) é aceitável, já que não pode haver `setInterval` em isolates?

- [ ] 18. Se o padrão "registry no servidor referencia o `CardForm` cliente" não funcionar no vinext (a verificar no passo 0), aceitar o **fallback de um mapa cliente separado** (um segundo arquivo a editar ao adicionar adapter com cartão)?

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado
- [ ] Matriz de permissões revisada
- [ ] Direção visual e referências interpretadas corretamente (N/A nesta spec)
- [ ] Crítica de UI/UX avaliada (N/A nesta spec)
- [ ] Comportamento responsivo aprovado (N/A nesta spec)
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
<Humano: data, decisão e ressalvas.>

## 14. Relatório pós-implementação
<Preenchido pelo agente ao final.>
