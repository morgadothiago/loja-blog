---
id: 0012
title: Páginas que faltam, no visual do protótipo: detalhe de projeto e de residência, práticas e contato
status: implemented
layers: [front, back, db]
owner: Thiago Morgado
created: 2026-10-28
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("registre minha aprovação da 0011 e 0012 com os defaults")
approved_at: 2026-10-28
---

# 0012 — Detalhe, práticas e contato (camada 2 da 0011)

Depende de **0011 aprovada** (direção B, camada 1 = tema). Stack: **a deste projeto** (o usuário não quer a stack Lovable; só o visual). Nada implementado.

## 1. Contexto e problema
O protótipo tem 4 tipos de página que o loja-blog não tem (ver 0011 §5.2): `/projects/$slug`, `/residencies/$slug`, `/practices/$type`, `/contact`. Aqui as listas (`/projetos`, `/festivais-e-residencias`) usam cards **não clicáveis** por decisão da 0005 ("sem página de detalhe") e o rodapé prevê `footer.contact` sem `href` (`src/lib/site.ts:12-18`). O protótipo, no contato, usa `mailto:` sem destinatário (não envia nada: 0011 crítica #3).

## 2. Objetivos e não-objetivos
**Objetivos**
- Detalhe de projeto e de residência com o desenho editorial do protótipo (voltar, meta, título grande, imagem larga, texto em coluna de leitura, galeria, "outras jornadas").
- Práticas (`/praticas/[tipo]`) como galeria filtrada por tipo.
- `/contato` funcional, acessível e protegido contra abuso.
- Listas passam a linkar para o detalhe (**revoga o default "sem detalhe" da 0005 só para projetos e residências**).
**Não-objetivos**
- Menu: sem novos itens (não há letreiros PNG; pergunta 4 da 0011). Livros/Notícias/Loja. CMS. Checkout (0007–0009). Conteúdo real da artista (pergunta 2 da 0011). Criar arte.

## 3. Estado atual do código
- `src/app/(home)/(sections)/projetos/page.tsx`, `festivais-e-residencias/page.tsx`, `exposicoes/page.tsx`: `SectionPage` + `ContentGrid`.
- `src/lib/content/index.ts:9-35`: `ContentEntry {id, titleKey, metaKey, image?}` e 3 entradas-exemplo por seção, com textos em `content.<seção>.<n>.title|meta` em `src/lib/i18n.ts`.
- `src/components/sections/{section-page,content-grid,content-card}.tsx`; `ImageSlot` (`src/lib/home-images.ts`).
- Padrão de formulário público com Server Action: `src/actions/newsletter.ts` (`defineAction` público, honeypot `website`, Zod em `src/lib/schemas/newsletter.server.ts`), `NewsletterForm` (cliente), toast via `flash`, erros tipados `Result` (`src/lib/result.ts`, spec 0003). Rate limit em Postgres: `src/lib/rate-limit.ts` (hoje só auth).
- Dashboard ADMIN: `src/app/(private)/dashboard/{categorias,posts,produtos}`; guarda `src/actions/guard.ts` (`requireAdmin`).
- Sem Playwright (0011 pergunta 7).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-static-params.md` | 16.4.3 | `params: Promise<{slug}>`; `dynamicParams` controla slug fora da lista; `export const dynamicParams = false` → 404 | Não |
| `.../04-functions/generate-metadata.md` | 16.4.3 | `generateMetadata({ params })` com `await params` | Não |
| `.../04-functions/not-found.md` | 16.4.3 | `notFound()` renderiza 404; UI via `not-found.js` | Não |
| `.../02-guides/forms.md` | 16.4.3 | Server Action + `safeParse` no servidor; `useActionState` | Não |
| `.../02-components/image.md` | 16.4.3 | `sizes` obrigatório p/ `fill`; `priority` deprecated → `preload` | Divergência com 0006 (que cita `fetchPriority`), a conferir |
| Protótipo `src/routes/projects_.$slug.tsx`, `residencies_.$slug.tsx`, `practices.$type.tsx`, `contact.tsx`, `lib/content.ts` | — | estrutura das páginas e modelo de conteúdo | `loader`/`notFound` do TanStack ≠ App Router (traduzir) |
**A confirmar na implementação:** `generateStaticParams` com conteúdo em arquivo (SSG) funciona no vinext (0011 §6.4).

## 5. Alternativas

### 5.1 Onde mora o conteúdo longo (corpo, créditos, galeria)
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | **Chaves em `src/lib/i18n.ts`** (padrão atual) | Convenção já usada; tipo `MessageKey` garante 3 línguas | Dicionário de 606 linhas vai ao **bundle do cliente** (importado pelo contexto): corpos longos de N projetos o incham; chaves para listas de parágrafos/créditos são desajeitadas | Baixo agora, ruim ao crescer | Bundle ↑ |
| B | **Arquivos de conteúdo tipados, só servidor** (`src/lib/content/projects.ts` etc.) com `Record<Locale, string>` por campo, escolhidos por `getLocale()`; textos de interface continuam em i18n | 3 línguas obrigatórias por tipo; não vai ao cliente; espelha o `lib/content.ts` do protótipo | Segundo mecanismo de tradução; texto fora de `i18n.ts` (exceção à convenção, aprovada aqui) | Baixo/médio | Bundle ~0 |
| C | **Banco/CMS** (Prisma `Project`, dashboard CRUD) | Cliente edita sem deploy | Migration, CRUD, upload, testes: escopo grande; não pedido | Alto | DB + dashboard |
**Recomendação: B** (conteúdo de exemplo agora; C numa spec futura). A rejeitada: bundle e ergonomia; C rejeitada: fora do pedido.

### 5.2 Contato
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | **Sem formulário:** link `mailto:` real (`SITE.contactEmail`) | Zero backend | Exige cliente de e-mail; sem proteção de spam; sem registro | Baixo | Nenhum |
| B | **Formulário → tabela `ContactMessage` (Postgres) + lista no dashboard (ADMIN)** | Sem serviço externo nem segredo; honeypot + rate limit; histórico | Admin precisa abrir o dashboard (sem notificação) | Médio (migration + 1 tela admin) | DB |
| C | Formulário → **e-mail transacional** (Resend/SMTP) | Notifica na hora | Dependência nova + segredo + domínio verificado; compat. Workers a checar | Médio/alto | Dependência |
**Recomendação: B** com o e-mail de notificação como evolução (C) quando o usuário informar provedor. A rejeitada: não resolve o problema do protótipo (nada é enviado de forma confiável); C rejeitada: depende de decisão externa (pergunta 3).

## 6. Design proposto

### 6.0 Referências e direção visual
- **Referências:** `spec/references/elena-proto-*.png` (home, residências desktop, sobre mobile) e o código das 4 rotas do protótipo (lidas). Páginas de detalhe/contato do protótipo **não** foram capturadas visualmente (só código): a primeira capturas 360/768/1280 deve ser feita na implementação.
- **Sistema:** o da 0011 §6.3 (Fraunces/Work Sans/Caveat, tokens do protótipo).
- **Layout a traduzir:** detalhe = coluna de leitura 6/12 centralizada em `lg`, título `font-heading` grande com `text-balance`, imagem larga com `aspect-[16/9]`, galeria 2 col (`md`) com offset vertical **só no 2º item**, "voltar" manuscrito; residência = galeria em colunas CSS + créditos + 3 "outras jornadas".
- **Não copiar:** textos/fotos reais (pergunta 2); `alt=""` em imagem de conteúdo; rotação em toda a galeria; tamanhos em `px`/`vh`.

#### Crítica específica
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Contato sem rótulos, só placeholder; erros fixos em pt | `contact.tsx:30-45` | alta | `Field` com `label` visível, `aria-invalid`, `aria-describedby`, erro junto ao campo, `autocomplete="name"/"email"`, i18n |
| 2 | `mailto:` sem destinatário | `contact.tsx:27` | alta | Opção 5.2-B |
| 3 | `h1` até `text-8xl` + título longo em 360 (não medido) | `projects_.$slug.tsx:34` | média | `text-4xl sm:text-5xl lg:text-7xl`, `text-balance`; teste 360 |
| 4 | Galeria com `alt` genérico | `residencies_.$slug.tsx:62` | média | `alt` por imagem no conteúdo (por idioma); decorativa → `alt=""` explícito no dado |
| 5 | "Outras jornadas" sem estado para 0 ou 1 item | `residencies_.$slug.tsx:38` | baixa | Ocultar a seção se `others.length === 0` |
| 6 | Link "voltar" só manuscrito, alvo pequeno | `projects_.$slug.tsx:31` | média | `min-h-11`, texto claro "← Projetos" via i18n |
| 7 | Colunas CSS (`columns-3`) mudam a ordem de leitura (de cima p/ baixo por coluna) | `practices.$type.tsx:42` | baixa | Aceitável p/ galeria; manter ordem do DOM = ordem cronológica, documentar |

### 6.1 Frontend
**Rotas (todas em `src/app/(home)/(sections)/`, herdam layout e `loading.tsx`):**
- `projetos/[slug]/page.tsx` (+ `not-found.tsx` do segmento), `festivais-e-residencias/[slug]/page.tsx`, `praticas/[tipo]/page.tsx`, `contato/page.tsx`.
- Todos Server Components; `params` com `await`; `generateStaticParams` a partir do conteúdo; `dynamicParams = false` → slug inexistente = 404 (conferido em `generate-static-params.md`); `generateMetadata` com título/descrição no idioma do cookie (`getLocale()`) — **atenção:** ler cookie torna a rota dinâmica e anula o SSG; decidir na implementação (recomendação: aceitar rotas dinâmicas, como `/` já é `force-dynamic`).
**Componentes novos (Server, pasta `src/components/sections/`):**
`DetailHero` (voltar + meta + h1), `ReadingColumn`, `DetailGallery`, `RelatedList`, `PracticeGallery`; reuso de `SectionPage`? **Não**: o detalhe tem cabeçalho próprio (título dinâmico em texto, não letreiro PNG). Reuso: `YearList` (0011), `Image` (`sizes` corretos), `buttonVariants` para links com cara de botão.
**Cliente (único):** `ContactForm` (`"use client"`, `useActionState`, `useId` para labels/erros; padrão do `NewsletterForm`).
**Listas:** `ContentCard` vira link (`<Link>` envolvendo o card, nome acessível = título) em projetos e residências; exposições seguem sem link.
**Práticas:** links "Desenho · Cerâmica · Colagem" como chips no topo de `/projetos` (alvo ≥ 2,75rem), `aria-current` na ativa.

**Responsivo:**
```
360/390: voltar / meta / h1 (3xl-4xl, balance) / imagem 16:9 / texto (1 col, px-5) / galeria 1 col
768:     imagem larga / texto max-w-prose centrado / galeria 2 col
1024:    texto em 6 de 12 col / galeria 2 col, offset no 2º item
1280+:   conteúdo limitado a --content-max (page-width), fundo contínuo
```
Sem rolagem horizontal; `min-w-0` em flex/grid; título longo quebra (`break-words`).
**Estados:** loading (herdado `(sections)/loading.tsx`), erro (`(home)/error.tsx`, 0003), vazio (galeria sem imagens: seção omitida; práticas sem obras: mensagem i18n "Em breve"), 404 por slug.
**A11y (checklist):** um `h1` por página; ordem de leitura = visual; foco visível; contraste ≥ 4,5:1; formulário com `label` visível, erro anunciado (`role="alert"` no resumo), estado `pending` com botão desabilitado e texto; `alt` descritivo; links com nome acessível.
**i18n:** UI em `i18n.ts` (`detail.back`, `detail.related`, `practice.*`, `contact.*` nas 3 línguas); conteúdo longo por 5.1-B.

### 6.2 Backend / dados
**Modelo (migration `npm run db:migrate`, revisar o SQL; sem enum nativo):**
```prisma
model ContactMessage {
  id        String   @id @default(cuid())
  name      String   // máx. 100
  email     String   // máx. 255
  message   String   // máx. 1000
  locale    String   // validado com Zod
  createdAt DateTime @default(now())
  readAt    DateTime?
  @@index([createdAt])
}
```
**Action** `src/actions/contact.ts`: `sendContactMessage` = `defineAction({ name, auth: "public", schema })` como `newsletter.ts`. Input: `{ name: trim 1..100, email: trim, lowercase, email, ≤255, message: trim 1..1000, website: honeypot }`. Saída `Result<void>`. Erros: `VALIDATION` (por campo, mensagens i18n), `RATE_LIMITED`, genérico logado no servidor (0003). Honeypot preenchido → finge sucesso sem gravar. Rate limit: reaproveitar `src/lib/rate-limit.ts` com chave nova `contact-ip:<ip>` (ex.: 5 por janela de 15 min; **não** misturar com contadores de login) — `AuthAttempt` é nome de tabela de login; usar a mesma tabela com prefixo de chave é aceitável, registrar como dívida. Nunca logar nome/e-mail/mensagem.
**Admin:** `dashboard/mensagens/page.tsx` (Server, `requireAdmin()` no layout e na leitura), lista paginada (20/pág), marcar como lida via action `markContactRead` (`requireAdmin`, valida `id`). Conteúdo exibido como texto (React escapa; **sem** `dangerouslySetInnerHTML`).
**Permissões:**
| Recurso | Anônimo | CLIENTE | ADMIN |
|---|---|---|---|
| Páginas de detalhe/práticas/contato | ver | ver | ver |
| `sendContactMessage` | sim (rate limit) | sim | sim |
| `/dashboard/mensagens`, `markContactRead` | não | não (403) | sim |
**Compat. vinext:** Server Action ✅ (lista 0008 §6.3); Prisma segue como nas 0007–0009 (§6.3.7 da 0007).

## 7. Segurança
- Contato = endpoint público: validação Zod no servidor, limites de tamanho, honeypot, rate limit por IP, sem PII em log, texto escapado. Avaliado: CAPTCHA fora de escopo (default: honeypot + rate limit; revisar se houver spam).
- `Referer`/CSRF: Server Actions do Next já checam `Origin`; nada extra.
- Dashboard: `requireAdmin()` em layout **e** em cada action; teste de papel errado.
- Sem redirects novos. Conteúdo estático sem input de usuário.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Slug válido renderiza `h1` com o título; slug inexistente → `notFound()` | unit/componente (render do page com `params` Promise) | 200 / 404 |
| 2 | `generateStaticParams` cobre todos os slugs do conteúdo | unit | lista = conteúdo |
| 3 | Todo item de conteúdo tem pt-BR/en/es e `alt` | unit (tipo + teste de completude) | falha se faltar idioma |
| 4 | Lista → cards são links com nome acessível = título | componente | `getByRole("link", {name})` |
| 5 | `RelatedList` oculta com 0 itens; galeria vazia omitida | componente | seção ausente |
| 6 | Práticas: filtra por tipo; tipo inválido → 404; vazio → mensagem | componente | ok |
| 7 | `ContactForm`: labels visíveis, erro por campo, `pending`, sucesso (toast/mensagem), nas 3 línguas | componente | `getByLabelText`, `getByRole("alert")` |
| 8 | `sendContactMessage`: caminho feliz grava; input inválido; honeypot não grava; rate limit bloqueia na 6ª; erro inesperado vira genérico | integração contra Postgres de teste (sem mockar Prisma) | conforme |
| 9 | `markContactRead`/lista admin: anônimo e CLIENTE negados; ADMIN ok; `id` inválido | integração | `UNAUTHENTICATED`/`FORBIDDEN`/ok |
| 10 | Responsivo 360/768/1280 sem rolagem horizontal, axe zero serious/critical, menu | Playwright + axe | **depende da pergunta 7 da 0011**; sem ela, declarar "UI não verificada visualmente" e entregar capturas manuais (Brave headless) |
Rodar: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`, `npx next build`.

## 9. Plano de implementação (após 0011 aprovada e esta aprovada)
0. `npx vinext check` e registrar (0007 passo 0). 1. Modelo de conteúdo 5.1-B + testes de completude. 2. Componentes de detalhe + rota de projetos + testes. 3. Residências + práticas + chips em `/projetos`. 4. Cards como link nas listas. 5. Migration `ContactMessage`, schema Zod, action, rate limit, testes de integração. 6. `ContactForm` + `/contato` + `footer.contact` com `href` + i18n. 7. Dashboard de mensagens + testes de permissão. 8. Capturas 360/768/1280, verificações, relatório.

## 10. Riscos, rollback e dívidas
- Depende da 0011 (tema) e das respostas sobre conteúdo/direitos; sem isso, só conteúdo de exemplo.
- Ler cookie em `generateMetadata` deixa rotas dinâmicas (sem SSG): impacto em cache/vinext.
- Spam no contato; mitigação: honeypot + rate limit; CAPTCHA futuro.
- Rollback: migration aditiva (nova tabela) e rotas novas; reverter commit + migration down manual (nunca editar migration aplicada).
- Dívidas: CMS (5.1-C), e-mail de notificação (5.2-C), tabela de rate limit com nome "AuthAttempt".

## 11. Perguntas em aberto
1. Aceita revogar o default "sem detalhe" da 0005 para projetos e residências? **Default: sim.**
2. Conteúdo: usar só exemplos ou fornecer textos/imagens reais com direitos confirmados? **Default: exemplos.**
3. Contato: para onde vão as mensagens (só dashboard, ou e-mail? qual provedor)? **Default: só dashboard.**
4. Rotas em português (`/praticas`, `/contato`) como as demais? **Default: sim.**
5. `/projetos` e residências devem ser SSG (idioma por rota ou cookie com rotas dinâmicas)? **Default: dinâmicas, como a home.**

## 12. Checklist da review humana
- [ ] 0011 aprovada primeiro
- [ ] Opção 5.1-B (conteúdo em arquivos) e 5.2-B (contato no Postgres)
- [ ] Matriz de permissões e rate limit
- [ ] Plano de testes e dependência de Playwright
- [ ] Perguntas 1–5

## 13. Registro de aprovação
aprovado com defaults, 2026-10-28 (registrado ao implementar; o humano pediu "pode implementar com o agente fulstack").

## 14. Relatório pós-implementação
Implementado conforme o plano (passos 0 a 8).
- **Passo 0 `npx vinext check` (somente leitura):** 92% compatível (21 ok, 2 parciais, 1 problema). Único problema: `next-auth` (depende de internals do Next; sugere better-auth), pré-existente e fora desta spec. Parciais: `images` (sem otimizador) e `turbopack.rules`. `next/font/google`, `next/image`, `next/headers` ok. Nenhum bloqueio para esta spec.
- **Feito:** conteúdo longo em arquivos só de servidor (`src/lib/content/{details,projects,residencies,lookup}.ts`, 3 línguas por campo, `alt` por idioma; título/meta seguem em i18n); rotas `/projetos/[slug]`, `/festivais-e-residencias/[slug]`, `/praticas/[tipo]` (desenho/ceramica/colagem), `/contato`; `generateStaticParams` + `dynamicParams = false`; `generateMetadata` no idioma do cookie (rotas dinâmicas, como a home); `(home)/not-found.tsx`; cards de projetos/residências viram link; chips das práticas em `/projetos`; "Outras jornadas" omitida com 0 itens; galeria vazia omitida; `footer.contact` com `href`.
- **Contato:** tabela `ContactMessage` (migração `prisma/migrations/20261028230000_add_contact_message`), gerada por `prisma migrate diff` (sem tocar em banco) e aplicada SÓ no banco de testes (`loja_blog_test`) pelo globalSetup do Vitest. `sendContactMessage` (`defineFormAction`, público): Zod, honeypot `website` (finge sucesso), rate limit de 5 por 15 min por IP com chave `contact-ip:` em `AuthAttempt`, erro genérico logado sem PII. `ContactForm` cliente: labels, `autocomplete`, erro por campo, preserva o digitado em erro, status de sucesso, `runWithGuards`. Dashboard: `/dashboard/mensagens` (ADMIN no layout e na página, 20 por página, texto escapado) + `markContactRead` (admin); link "Mensagens" na sidebar.
- **Desvios:** `ContentCard` com link usa `div` interno em vez de `article` (no Chrome o link ficava sem nome acessível; achado do Playwright). Slug inexistente responde HTTP 200 com `noindex` e conteúdo 404 (streaming por causa do `loading.tsx`): não é 404 de status. Um único `not-found.tsx` em `(home)` em vez de um por segmento.
- **Testes novos (Vitest):** contact-action (integração), contact-admin (integração, papéis), contact-form, dashboard-messages-page, detail-content, detail-pages, theme; ajustados 3 testes antigos (footer com Contato como link; exposições assíncrona).
- **Playwright + axe (46 passam):** 10 páginas x 4 viewports (360/390/768/1280): sem rolagem horizontal, h1 visível, zero violações serious/critical; fluxos: 404 por slug, lista, detalhe, voltar, prática, idioma en, rota protegida, contato (erro e sucesso), menu mobile com Esc. Contra `next build` + `next start -p 3100` com `DATABASE_URL` do banco de testes. Capturas JPEG em `spec/evidence/0011-0012/` (40 arquivos).
- **Comandos:** `npx tsc --noEmit` limpo; `npx eslint src tests e2e` limpo; `npx vitest run` 395 passam / 5 falham (PRÉ-EXISTENTES, já falhavam antes das mudanças: `menu-images` x4 e `app-header` x1, procuram `public/images/menu/*` que não existe); `npx next build` ok; `npm run test:e2e` 46/46.
- **NÃO verificado:** loja/blog/dashboard/checkout visualmente com o novo tema; modo escuro visualmente (só contraste de tokens); 404 com status real; login por papel em e2e (só integração); `ContactForm` sem JavaScript (envio por `onSubmit`).
- **Pendente para o humano:** aplicar a migração no banco de dev/produção com `npx prisma migrate deploy` (ou `npm run db:migrate` no dev local) e reiniciar o `next dev` (client Prisma regenerado).
- **Dívidas:** rate limit na tabela `AuthAttempt`; CMS; e-mail de notificação; CAPTCHA se houver spam.
