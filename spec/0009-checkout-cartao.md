---
id: 0009
title: Checkout nacional — cartão de crédito (à vista e parcelado até 12x) via formulário fornecido pelo adapter
status: in-review
layers: [front, back]
owner: Thiago Morgado
created: 2026-10-28
approved_by:             # preenchido SOMENTE por humano
approved_at:             # preenchido SOMENTE por humano
---

# 0009 — Cartão de crédito

> Depende de **0007** (gateway, `Payment`, webhook, reserva) e **0008** (casca do checkout, `MethodPicker`, hook de status). A UI de cartão **não conhece AbacatePay**: renderiza o `CardForm` que o adapter ativo fornece (`registry[gatewayId].CardForm`).

## 1. Contexto e problema
- Cartão parcelado é essencial no varejo brasileiro. Requisito de segurança: **dados de cartão nunca tocam o servidor** do projeto.
- Requisito do usuário: a UI não pode depender de `abacatepay.js` diretamente; o "tokenizador/formulário de cartão" é abstraído por adapter, para trocar de gateway sem tocar no checkout.
- A AbacatePay oferece Checkout Transparente: o número do cartão vai para um **iframe** do fornecedor; o site recebe um token `ctok_…` (60 s, uso único) e o servidor cobra com esse token + dados do cliente.

## 2. Objetivos e não-objetivos
**Objetivos**
- Contrato `CardForm` (cliente) independente de fornecedor + implementação AbacatePay (`abacatepay.js`).
- Parcelamento 1x–12x guiado por `capabilities`/`installmentOptions`, parcela mínima R$ 10.
- Formulário do pagador (nome, e-mail, CPF/CNPJ, celular), 3DS, erros, retentativa, estado "processando" e confirmação **por webhook/`getCharge`** (0007).
**Não-objetivos**
- Cartão salvo/`cardToken`, débito, Apple/Google Pay, repasse de taxa ao cliente, endereço de cobrança (opcional no `tokenize`; não enviado), antifraude próprio, reembolso na UI.

## 3. Estado atual do código
- Nada de cartão existe. Reaproveita: `useServerAction` (`src/hooks/use-server-action.ts`), `translateError`/`translateFieldError` (`src/lib/i18n.ts:583-600`), `ControlledInput` (`src/components/forms/controlled-input.tsx`) + react-hook-form/yup (padrão da newsletter/auth), `Field`/`Label`/`Select`/`Button`, `CheckoutShell`/`MethodPicker`/`use-payment-status` (0008).
- **Não há CSP** em `next.config.ts` hoje.
- `Select` (base-ui) para parcelas: verificar acessibilidade no mobile (alternativa: radios nativos, como em 0008).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/02-guides/scripts.md` e referência de `next/script` | 16.4.3 | `<Script strategy=… onLoad onReady onError>` em Client Components; carregar só onde necessário. | Não |
| https://docs.abacatepay.com/pages/transparents/abacatepay-js | 2026-10-28 | Script em `https://abacatepay.com/abacatepay.js` (não copiar para o servidor; sem pacote npm); API `create/mount/tokenize/destroy`; `locale` pt/en/es; 3DS dentro de `tokenize()` (janela "Autenticação do cartão"); erros `CARD_INCOMPLETE, CARD_INVALID, THREE_DS_FAILED, PROVIDER_LOAD, NETWORK, API…`; `amount` do `create` deve ser igual ao da cobrança. | Não |
| https://docs.abacatepay.com/pages/transparents/card | idem | Detalhes de `POST /v2/transparents/create` (CARD) em 0007 §4.2; timeout ≠ recusa. | Não |
| https://docs.abacatepay.com/pages/guides/cartao-transparente | idem | Cartões de teste; `pk_`/API key do mesmo ambiente; `APPROVED` libera, `PENDING` espera `transparent.completed`. | Não |
| https://docs.abacatepay.com/pages/transparents/public-key | — | **Não lida**; ler na implementação (formato/rotação da `pk_`). | A confirmar |
| Spec 0007 §4.2 "Não confirmado" 2, 5, 6 | — | Se o webhook dispara no `APPROVED`; domínio do iframe (CSP); juros de parcelamento. | Riscos |

## 5. Alternativas
### 5.1 Onde fica o formulário de cartão
| # | Opção | Prós | Contras | Segurança |
|---|---|---|---|---|
| A | Campos próprios (`<input>` de número/CVV) | Controle total de UI | **Dado de cartão passa pelo nosso JS e domínio → escopo PCI maior**; proibido pela premissa | Ruim |
| B | **Formulário em iframe do fornecedor, encapsulado em `CardForm` por adapter** | Número/CVV nunca no nosso DOM; troca de gateway = outro `CardForm`; atende o requisito | Estilização limitada (`theme.styles` do `abacatepay.js`), dependência de script externo | Melhor |
| C | Redirecionar para checkout hospedado do fornecedor (`/v2/checkouts`) | Mais simples ainda | Sai do site, perde controle de UX e do parcelamento; outro fluxo/webhook (`checkout.completed`) | Boa |
**Recomendação: B.** Rejeitadas: A (risco PCI), C (muda o produto e o fluxo; pode ser fallback em adapter futuro).

### 5.2 Contrato do `CardForm`
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Cada adapter expõe componente com **`ref`/callback `registerTokenizer`** | Pai controla o botão "Pagar" único | API imperativa |
| B | **Props + callbacks**: `onStateChange({ canSubmit, error })`, `registerTokenizer(fn)` onde `fn(customer) => Promise<CardPayload>` | Botão "Pagar" fica na casca (consistente entre gateways); adapters só tokenizam | Contrato precisa de teste de contrato |
| C | Componente que faz tudo (tokeniza e chama a action) | Menos código no pai | Duplica lógica de ação/erros em cada adapter |
**Recomendação: B.** O botão, parcelas, dados do pagador e a Server Action ficam **genéricos**; o adapter só monta o formulário seguro e produz um `CardPayload` opaco.

## 6. Design proposto

### 6.0 Referências e direção visual
- **Referências:** não há referência de checkout em `spec/references/`. Direção = a de 0008 (tokens do tema, um ponto focal, sem faixa de cor cheia).
- **Estilo do iframe:** `AbacatePay.create({ theme })` aceita estilos; aplicar apenas valores equivalentes aos tokens (lidos de CSS vars do tema ao montar), fonte de leitura do corpo e tamanho ≥ 1rem (evita zoom automático em iOS). Se o `theme` não permitir tudo, **aceitar o visual padrão do fornecedor** em vez de reimplementar.
- **Não copiar:** ícones de bandeira só com `icons: true` do próprio `abacatepay.js` (ativo do fornecedor, uso previsto pela doc).
- **Crítica de UI/UX**
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Token vale **60 s**: se o cliente demora após o 3DS ou preenche e some, `tokenize` falha | doc `abacatepay-js` | média | Tokenizar **só no clique em "Pagar"** (nunca antes); em `TOKEN_EXPIRED`, re-tokenizar automaticamente 1x sem pedir de novo. |
| 2 | Toda recusa tem a mesma mensagem genérica (de propósito) | guia cartão | média | Texto neutro com próximos passos ("tente outro cartão ou use Pix"), sem prometer causa. Botão alternativo "Pagar com Pix" visível. |
| 3 | 3DS abre **janela** ("Autenticação do cartão"): popup bloqueado = `THREE_DS_FAILED` | doc | alta | Aviso prévio curto ("seu banco pode pedir confirmação em uma janela"); mensagem específica para `THREE_DS_FAILED`; tokenização disparada por clique do usuário (evita bloqueio de popup). |
| 4 | Bloqueador de anúncios/CSP derruba o iframe (`PROVIDER_LOAD`) | doc | média | Estado de erro com instrução ("desative bloqueadores para esta página") + alternativa Pix. |
| 5 | Parcelas: R$ 1.200 em 12x (R$ 100) é claro, mas "sem juros" é afirmação comercial | pricing (loja paga 4,5% + R$ 0,60) | média | Só exibir "sem juros" **se** a política (pergunta 3 da 0007) for essa; senão, mostrar total. Total sempre visível. |
| 6 | Dupla cobrança por duplo clique/retry após timeout | doc: "não repita a cobrança" | **alta** | Botão desabilitado durante a ação; índice parcial de 1 `Payment PENDING` por pedido (0007); `UNKNOWN_OUTCOME` **não** reenvia. |
| 7 | Teclado/leitor de tela dentro do iframe | iframe de terceiro | média | Não controlável; testar com teclado e documentar limitação; labels próprios para dados do pagador. |
| 8 | CPF e celular são pedidos só para cartão | doc (obrigatórios) | baixa | `autocomplete`/`inputMode` corretos (`numeric`, `tel`), máscara leve, mensagens de erro por campo. |

### 6.1 Frontend
**Árvore (S/C)**
```
components/checkout/
  card-panel.tsx          (C)  react-hook-form: parcelas + dados do pagador + botão "Pagar R$ X"
                               recebe `installmentOptions` (serializável) e `children` = <CardForm/> (slot do adapter)
  installment-select.tsx  (C)  opções vindas de capabilities/installmentOptions (nunca calculadas no cliente)
  payer-fields.tsx        (C)  nome, e-mail (pré-preenchidos da sessão), CPF/CNPJ, celular
  card-status.tsx         (C)  processing → paid | failed (reusa use-payment-status e payment-result da 0008)
lib/payments/adapters/abacatepay/card-form.tsx   (C)  implementa CardFormProps com abacatepay.js
lib/payments/types.ts                             CardFormProps (abaixo)
app/(private)/conta/pedidos/[id]/pagamento/page.tsx (S)  injeta `<registry[id].CardForm .../>` no `card-panel` como slot
```
**Contrato `CardFormProps` (types.ts, sem import de fornecedor):**
```ts
export type CardFormProps = {
  amountCents: number;                       // do servidor
  locale: "pt-BR" | "en" | "es";             // adapter traduz p/ o do fornecedor
  publicConfig: Record<string, string>;      // ex.: { publicKey } — vem do servidor por props (não NEXT_PUBLIC)
  disabled?: boolean;
  onStateChange: (s: { ready: boolean; canSubmit: boolean; errorCode?: CardFormErrorCode }) => void;
  registerTokenizer: (fn: (payer: Customer) => Promise<CardPayload>) => void; // rejeita com CardFormError
};
export type CardFormErrorCode = "INCOMPLETE" | "INVALID" | "AUTH_FAILED" | "LOAD_FAILED" | "NETWORK" | "UNKNOWN";
// AbacatePay: CARD_INCOMPLETE→INCOMPLETE, CARD_INVALID|PAYER_INVALID→INVALID, THREE_DS_FAILED→AUTH_FAILED,
// PROVIDER_LOAD→LOAD_FAILED, NETWORK→NETWORK, demais→UNKNOWN. Texto do fornecedor NÃO é exibido.
```
**Implementação AbacatePay (`card-form.tsx`):** `next/script` (`strategy="afterInteractive"`, `onReady`) carrega `https://abacatepay.com/abacatepay.js` **apenas** neste componente (nunca no layout); `AbacatePay.create({ publicKey, amount, locale, onCardChange, theme })` + `mount()` num contêiner com altura reservada (evita layout shift); `registerTokenizer` envolve `tokenize({ name, email, taxId, cellphone })`; `destroy()` no unmount (React 19 StrictMode: criar/destruir idempotente). Recria o checkout se `amountCents` mudar (não muda na v1).

**Fluxo**
1. Cliente escolhe "Cartão" (`MethodPicker`). `CardForm` carrega (skeleton com altura reservada; timeout de carga → estado `LOAD_FAILED`).
2. Escolhe parcelas (`installmentOptions` do servidor; mostra "Nx de R$ Y" e total).
3. Preenche dados do pagador e o cartão (iframe). Botão "Pagar R$ X" só habilita com `canSubmit` e campos válidos.
4. Clique → `tokenizer(payer)` (3DS se pedido) → `payWithCard({ orderId, installments, payer, cardPayload })`.
5. Retorno da action: `PROCESSING` (normal, mesmo se o gateway já respondeu `APPROVED`: a mudança para `PAID` só ocorre por `applyCharge`/webhook — 0007) → `card-status` faz polling (`use-payment-status`) → `PAID` → `payment-result`; `FAILED` → mensagem + "Tentar outro cartão" (novo `Payment` após terminal) + "Pagar com Pix".
6. `UNKNOWN_OUTCOME`: "Estamos confirmando seu pagamento. Não tente de novo ainda." (sem botão de repetir até o status resolver ou `expiresAt` do `Payment` — 15 min).

**Estados:** loading do formulário · pronto · incompleto · tokenizando/3DS (botão `aria-busy`, texto "Confirmando com seu banco…") · processando · pago · recusado · expirado token · erro de rede/offline · erro de carga do iframe · pedido expirado.

**Responsivo**
| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Navegação | cabeçalho do site | idem | idem | idem |
| Formulário do cartão (iframe) | largura total, campos empilhados (padrão do fornecedor), altura reservada em `rem` | `max-w-xl` | coluna direita | idem |
| Parcelas | `Select`/radios largura total, rótulo "12x de R$ 100,00" quebrando em 2 linhas se preciso | idem | idem | idem |
| Dados do pagador | 1 coluna; 2 colunas (CPF/celular) a partir de `sm` | idem | idem | idem |
| Botão "Pagar" | largura total, `h-11`, fixo ao fim do painel (não `position: fixed`, evita cobrir teclado) | automático | automático | idem |
Nada de `px` (memória do projeto): alturas/larguras em `rem`/escala Tailwind; `theme` do `abacatepay.js` com `rem`.

**Acessibilidade:** labels visíveis e associados em todos os campos próprios; erro junto ao campo (`aria-describedby`, `role=alert` para erro geral); `autocomplete="name|email|tel"`, CPF `inputMode="numeric"` (sem `autocomplete` padrão); foco vai ao primeiro erro; foco ao resultado após `PAID`; contraste AA com tokens; alvos ≥ 2,75rem; `prefers-reduced-motion`. **Limitação documentada:** acessibilidade interna do iframe do cartão é do fornecedor (item 7 da crítica) — validar com teclado e VoiceOver e registrar no relatório.
**i18n:** `checkout.card.*`, `card.error.*` (INCOMPLETE/INVALID/AUTH_FAILED/LOAD_FAILED/NETWORK/UNKNOWN), `error.CARD_DECLINED`, `error.CARD_TOKEN_EXPIRED`, `error.CUSTOMER_INVALID`, `error.INSTALLMENT_TOO_LOW`; `locale` repassado ao fornecedor. Textos en/es mais longos testados em 360.

### 6.2 Backend
- **Server Action `payWithCard`** (`src/actions/payments.ts`; `defineAction({ auth:"user" })`) — Zod:
```ts
z.object({
  orderId: z.string().cuid(),
  installments: z.number().int().min(1).max(12),          // revalidado contra capabilities
  payer: z.object({
    name: z.string().trim().min(2).max(150),
    email: z.string().trim().toLowerCase().email().max(150),
    taxId: z.string().transform(onlyDigits).refine(validCpfOrCnpj),
    cellphone: z.string().transform(onlyDigits).pipe(z.string().min(10).max(13)),
  }),
  cardPayload: z.object({ gatewayToken: z.string().min(8).max(200), brand: z.string().max(30).optional(), last4: z.string().regex(/^\d{4}$/).optional() }),
})
```
  Passos: (1) `order` do usuário (`findFirst {id,userId}`), `PENDING` e dentro da reserva, senão `NOT_FOUND`/`ORDER_EXPIRED`; (2) `rate limit` (cartão é alvo de *card testing*): `isBlocked('pay-user:…')`/`('pay-ip:…')` e `recordAttempt` **em toda** tentativa; (3) `installments ≤ capabilities.maxInstallments` e `installmentOptions(total)` contém a opção (parcela ≥ mínimo), senão `VALIDATION`/`INSTALLMENT_TOO_LOW`; (4) cria `Payment{CARD, installments, PENDING}` em transação (índice parcial → `PAYMENT_IN_PROGRESS` em duplo clique); (5) `gateway.createCardCharge({ paymentId, amountCents: order.totalCents, installments, customer: payer, cardPayload })`; (6) mapeia: sucesso → grava `externalId`, `cardBrand`, `cardLast4`, `rawStatus` e chama **`applyCharge(payment, snapshot)`** (valida valor; só aí `PAID` se o snapshot disser `PAID`); `CARD_DECLINED` etc. → `Payment.FAILED` + `failureCode`; `UNKNOWN_OUTCOME` → `Payment` continua `PENDING`, retorna `status:"PROCESSING"`; (7) retorno `{ paymentId, status }` — **sem** `externalId`, token ou CPF.
- **`taxId`/`cellphone` não são persistidos** nem logados (0007 §6.2.3); `payer` descartado após a chamada.
- **Dinheiro:** `amountCents` = `Order.totalCents`; o `amount` usado no `AbacatePay.create` (cliente) é só para a UI/token e a API **rejeita** se divergir do cobrado — o servidor usa o seu próprio valor, e divergência vira erro 400 do gateway (testar).
- **Chaves:** `ABACATEPAY_PUBLIC_KEY` entregue por `publicConfig` (props do servidor), `ABACATEPAY_API_KEY` só no adapter servidor.
- **CSP:** se o projeto adotar CSP, liberar `script-src https://abacatepay.com` e o domínio do iframe (**não documentado** → descobrir no sandbox e registrar aqui antes de ativar CSP).

### 6.3 Compatibilidade vinext / Workers
Premissas, matriz e regras: **0007 §6.3**. Específico do cartão:
| Recurso usado aqui | Portável? | Nota / fallback |
|---|---|---|
| Server Action `payWithCard` (Zod 4 puro) | ✅ | fallback: Route Handler `POST` sobre o mesmo `core/` |
| `createCardCharge` no adapter via `fetch` | ✅ | **sem SDK do fornecedor**; sem `Buffer`; JSON por `JSON.stringify` |
| `next/script` + `abacatepay.js` remoto (cliente) | ✅ (vinext: `next/script` com as 4 strategies) | roda no navegador, independe do servidor |
| Registry servidor referenciando componente `"use client"` (`CardForm` como slot) | ⚠️ **não verificado no vinext** (RSC sobre Vite) | `vinext check` no passo 0 + teste de render; **fallback:** `page.tsx` importa o `CardForm` por um mapa cliente `cardForms[gatewayId]` em arquivo `"use client"` próprio, mantendo "uma linha por adapter" no `registry.ts` apenas para a parte servidor (perde um pouco do "um único lugar": decisão 18 da 0007) |
| Rate limit anti card-testing | ✅ | Postgres (`lib/rate-limit.ts`), nunca `Map` em memória |
| Dependência de `crypto`/`Buffer` | ✅ nenhuma | token só trafega como string opaca |
| CPF/CNPJ (dígito verificador), máscara | ✅ | funções puras |
**Passo 0 e CI:** herdados da 0007; `check:portability` cobre `src/components/checkout/**` e `adapters/**/card-form.tsx` (este pode usar `window.AbacatePay`, mas não imports Node).

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| `payWithCard` | ✗ | ✓ só pedido próprio | ✓ só próprio | `defineAction auth:"user"` + `findFirst({id,userId})` |
| Polling `GET /api/payments/[id]/status` | 401 | ✓ dono | ✓ dono | 0008 |
- **Nunca** número/CVV/validade no nosso JS, servidor, banco, log ou analytics; só `ctok_` (efêmero, descartado após o uso, **não logado**), bandeira e 4 últimos dígitos.
- Token de cartão passa pelo cliente → action (HTTPS); validade 60 s e uso único limitam o abuso. `cardToken` permanente **ignorado** (cartão salvo fora do escopo).
- Rate limit anti *card testing*; resposta de recusa uniforme (sem distinguir motivo).
- Logs: `paymentId`, `gateway`, códigos normalizados; nunca payload da action.
- LGPD: base legal = execução de contrato; CPF/celular só repassados ao gateway para a transação (política de privacidade deve citar o operador de pagamento — **ação de negócio**, pergunta 5).
- Cabeçalhos: sem mudanças (CSP é futura).

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `payWithCard` feliz com adapter fake: cria `Payment CARD`, `amountCents` do banco, `installments` gravado; retorna `PROCESSING`; pedido só vira `PAID` após `applyCharge`/webhook | integração | conforme |
| 2 | Input inválido: CPF com dígito errado, e-mail inválido, `installments` 0/13/1,5, token vazio/gigante, `orderId` inválido | integração | `VALIDATION` + `fieldErrors` |
| 3 | Não autenticado | integração | `UNAUTHENTICATED` |
| 4 | Pedido de outro usuário / inexistente / já `PAID` / expirado | integração | `NOT_FOUND` / idempotente / `ORDER_EXPIRED` |
| 5 | Parcela abaixo de R$ 10 (ex.: R$ 25 em 3x) e acima do máximo da capability | integração | `INSTALLMENT_TOO_LOW`/`VALIDATION` |
| 6 | Valor vindo do cliente é ignorado (campo extra `amount` rejeitado/descartado) | integração | cobra `Order.totalCents` |
| 7 | Recusa → `Payment FAILED`, `failureCode=CARD_DECLINED`, pedido segue `PENDING`; novo `payWithCard` com outro token funciona | integração | — |
| 8 | **Timeout** (`UNKNOWN_OUTCOME`): `Payment PENDING`, **nenhuma 2ª chamada** ao gateway ao repetir a action (`PAYMENT_IN_PROGRESS`); reconciliação depois resolve | integração | 1 chamada |
| 9 | Duplo clique concorrente (`Promise.all` de 2 `payWithCard`) | integração | 1 cobrança, 1 `PAYMENT_IN_PROGRESS` |
| 10 | Rate limit anti card-testing | integração | `RATE_LIMITED` após N tentativas |
| 11 | Webhook/`reconcile` confirma cartão `APPROVED` e `PENDING→PAID` (usa 0007) | integração | `PAID` |
| 12 | Logs não contêm token, taxId, e-mail, payload | integração | zero ocorrências |
| 13 | **Contrato do `CardForm`** (suíte reutilizável com adapter fake e AbacatePay com `window.AbacatePay` stub): chama `onStateChange`, `registerTokenizer` uma vez, `destroy` no unmount, mapeia cada erro do fornecedor para `CardFormErrorCode`, nunca expõe `message` do fornecedor | componente | passa; é critério de aceite de qualquer adapter com cartão |
| 14 | `CardPanel`: botão desabilitado até `canSubmit`; estado `aria-busy` durante tokenização; erro por campo; `AUTH_FAILED`/`LOAD_FAILED` exibem mensagem + "Pagar com Pix"; sucesso move foco | componente | — |
| 15 | `InstallmentSelect`: opções vêm das props; texto en/es longo não estoura | componente | — |
| 16 | Troca de gateway: adapter fake com outro `CardForm` é renderizado **sem mudar** `CardPanel`/page | componente/integração | prova do plug and play |
| 17 | Sandbox manual (checklist no relatório): `4242…` aprova; `…0002` recusa; `…0069` expirado; `…0127` CVV; 3DS; popup bloqueado | manual | registrado |
| 18 | Responsivo 360/768/1280 sem rolagem horizontal; iframe visível e utilizável; botão acionável | e2e (Playwright, se aprovado na 0008) / manual | — |
| 19 | axe: zero serious/critical fora do iframe do fornecedor | e2e | — |
**Infra:** Vitest + jsdom já existem; Playwright/axe dependem da pergunta 1 da 0008. Fornecedor mockado (`fetch` e `window.AbacatePay`) — **nenhuma chamada de rede real** em testes automatizados.

## 9. Plano de implementação
0. (Herdado) resultado de `npx vinext check` registrado em 0007 §6.3.7; verificar especificamente o padrão "registry servidor → componente cliente como slot" (6.3); se falhar, aplicar o fallback do mapa cliente.
1. (Pré-condição) 0007 e 0008 `implemented`. No sandbox, validar: `tokenize` → `create` com `ctok_`; payload do webhook para cartão; se `APPROVED` dispara evento; juros no parcelamento; domínio do iframe. Atualizar 0007 §4.2 e esta spec se houver contradição.
2. `CardFormProps`/`CardFormError` em `types.ts` + suíte de contrato do `CardForm` (teste 13) com adapter fake.
3. `createCardCharge` no adapter AbacatePay (+ `installmentOptions`, mapeamento de erros) + testes de contrato do 0007.
4. `payWithCard` + schema Zod + testes 1–12.
5. `card-form.tsx` (AbacatePay) + testes 13.
6. `payer-fields`, `installment-select`, `card-panel`, `card-status` + testes 14–15.
7. Integração na página (slot) + teste 16; i18n (3 idiomas) e paridade.
8. Verificação manual no sandbox (teste 17), capturas 360/768/1280, `tsc`, `eslint src`, `npm test`, `next build`.

## 10. Riscos, rollback e dívidas
- `abacatepay.js` é script remoto não versionável (a doc proíbe copiar): mudança do fornecedor pode quebrar o formulário → contrato + monitorar `PROVIDER_LOAD`; mitigação: Pix sempre disponível.
- Janela 3DS bloqueada por navegador.
- Cartão `APPROVED` mas liquidado em D+30: pedido liberado no `APPROVED`; **risco de chargeback/disputa** (`UNDER_DISPUTE`) tratado manualmente.
- Conta nova: limite R$ 5.000 dia/R$ 1.000 noite pode recusar tickets altos.
- Rollback: esconder `CARD` de `capabilities.methods` (config do adapter) devolve o checkout só-Pix sem mexer em código de UI.
- Dívidas: sem cartão salvo, sem endereço de cobrança no `tokenize`, sem reembolso na UI.

## 11. Perguntas em aberto
- [ ] 1. Política de parcelas (0007 pergunta 3): "sem juros" até quantas vezes? Repasse da taxa?
- [ ] 2. Aceitar que o pedido seja liberado em `APPROVED` (sem esperar liquidação D+30)? Risco de disputa assumido pela loja.
- [ ] 3. Parcela mínima: manter R$ 10 (piso do gateway) ou subir (ex.: R$ 30)?
- [ ] 4. Aceitar a limitação de acessibilidade/estilo do iframe do fornecedor, com Pix sempre como alternativa?
- [ ] 5. Quem atualiza a política de privacidade/termos citando o operador de pagamento?

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado (ver 0007)
- [ ] Matriz de permissões revisada
- [ ] Direção visual e referências interpretadas corretamente (sem referência de checkout)
- [ ] Crítica de UI/UX avaliada (aceito / ajusto / rejeito cada achado)
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
<Humano: data, decisão e ressalvas.>

## 14. Relatório pós-implementação
<Preenchido pelo agente ao final.>
