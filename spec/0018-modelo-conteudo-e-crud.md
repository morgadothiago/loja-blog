---
id: 0018
title: Modelo de dados de conteúdo (Projects, Exhibitions, Residencies & Events, News, Books) e CRUD no dashboard
status: approved
layers: [db, back, front]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0018 — Modelo de conteúdo e CRUD

## 1. Contexto e problema
Briefing §9: "permitir adicionar novos projetos, exposições, residências, publicações e produtos de forma simples", categorias consistentes por seção, itens relacionados entre seções, exposições itinerantes, 3 idiomas, ordem cronológica/curatorial. Hoje: 3 itens de exemplo em arquivos TS (`src/lib/content/index.ts:30-48`, `projects.ts`, `residencies.ts`), textos curtos em `i18n.ts`; blog em `Post` sem tradução; nenhum CRUD no dashboard para 4 das 5 seções. Cada novo item exigiria deploy de código: a cliente não consegue.

## 2. Objetivos e não-objetivos
**Objetivos:** tabelas e tipos para as 5 seções; categorias fixas do briefing; 3 idiomas por campo de texto; imagens (capa, galeria, páginas internas de livro) no Azure Blob; links entre itens (bidirecionais); exposições itinerantes com N apresentações; ordenação cronológica real; destaque curatorial em Projects; CRUD admin com rascunho/publicado; API de leitura server-side para a 0019.
**Não-objetivos:** páginas públicas (0019); Shop/produtos (0020); About (0021); importar o conteúdo do briefing (0022); editor rich text; busca textual; versionamento de rascunhos.

## 3. Estado atual do código
- Tipos e conteúdo exemplo: `src/lib/content/{index,details,projects,residencies,lookup}.ts` (`Localized = Record<Locale,string>` em `details.ts:7` — **reaproveitar o tipo**).
- Padrão de actions: `src/actions/{posts,products,categories}.ts` + `src/actions/guard.ts` (`requireAdmin`), `src/lib/result.ts` (`ok`/`fail`, `Result<T>` com `fieldErrors`), `src/lib/action.ts` (contrato 0003).
- Dashboard: `src/app/(private)/dashboard/{posts,produtos,categorias,mensagens}`; formulários `src/components/dashboard/{post-form,product-form,image-upload}.tsx`.
- Upload: `src/app/api/upload/route.ts:19` aceita `folder` só `posts|products` (somente ADMIN, valida tipo/tamanho); `next.config.ts:8` permite `*.blob.core.windows.net`.
- Testes: pasta `tests/` com Vitest (`vitest.config.mts`), p.ex. `tests/crud-orders-actions.test.ts`, `tests/detail-content.test.ts`.
- Blog: `Post` + `Category(kind POST)`; home usa `getRecentStories` (`src/lib/home-data.ts`).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| Prisma 6 (`node_modules/@prisma/client` + `prisma/schema.prisma` do projeto) | 6.19.3 | Convenção local: sem enums nativos, `String` + Zod; `Json` é suportado no PostgreSQL | **A ler/validar no passo 0**: índices em `Json`, `Prisma.JsonNull`, tipagem de `Json` (`z.infer` no read). Não confirmei a doc oficial nesta spec |
| `next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`/`revalidateTag.md` | 16.4.3 | Existem; leitura integral no passo 0 | A ler |
| `src/actions/guard.ts`, `src/lib/result.ts` | repo | Contrato de erro e guard já padronizados | Não |

## 5. Alternativas
**5.1 Onde mora o conteúdo**
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | Manter arquivos TS (hoje) | Sem migration, tipado | Cliente não edita; deploy a cada item; descumpre §9 | baixo agora, alto depois | bundle cresce |
| B | **Tabela polimórfica `ContentItem` + tabelas auxiliares** (imagens, apresentações, links); campos específicos em `details Json` validados por Zod por seção | 1 CRUD, 1 listagem, 1 mecanismo de links/imagens; categorias e seções novas sem migration | `details` é Json (sem integridade relacional); validação só em Zod | médio | queries simples, índice em `(section, category, sortDate)` |
| C | Uma tabela por seção (`Project`, `Exhibition`, `Residency`, `NewsItem`, `Book`) | Esquema fortemente tipado | 5× schema, 5× CRUD, 5× links; refator a cada campo novo | alto | mais migrations |
| D | CMS headless (Sanity/Payload/Keystatic) | Editor pronto | Nova infra/dependência, conta externa, incerteza com vinext, desvia do dashboard existente | alto | externo |
**Recomendação: B.** C é a "mais correta" no papel, mas o custo de 5 CRUDs não se paga: os campos comuns (títulos, datas, local, imagens, links) são ~80% iguais. Rejeitadas: A (não cumpre o briefing), D (nova dependência sem pedido).

**5.2 Idiomas por campo**
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | **`Json` `{ "pt-BR", en, es }` por campo** (mesmo `Localized` já usado) | Formulário simples (abas PT/EN/ES), 1 linha por item, tipo existente | Sem consulta SQL por idioma (não precisamos) |
| B | Tabela `ContentItemTranslation(itemId, locale, …)` | Completude consultável, FTS por idioma | 3 linhas por item, joins, formulário mais complexo |
**Recomendação: A.** Regra de fallback (`pickLocalized`, função pura testada): idioma pedido → `en` → `pt-BR` → `es`; a UI pública **nunca** mostra campo vazio nem placeholder de exemplo; o dashboard marca "tradução faltando" por idioma. Publicar exige título nos 3 idiomas (default; Q9b).

**5.3 News × Blog existente**
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | News = `Post` com campos novos | Reaproveita CRUD de posts | Sem 3 idiomas; duas formas de conteúdo; `Category(kind POST)` livre |
| B | **News = `ContentItem` section `NEWS`; `Post` fica congelado e é migrado** | Uniforme (idiomas, imagens, links, filtros) | Migração de dados; `getRecentStories` muda de fonte |
**Recomendação: B** (default da Q4). `Post`/`Category(kind POST)` permanecem no schema (sem apagar dados) até a 0022; dashboard "Posts" some do menu quando a migração for confirmada. Remoção de tabela = spec própria.

## 6. Design proposto
### 6.0 Referências e direção visual
Dashboard segue o visual e os componentes shadcn já usados em `src/app/(private)/dashboard`. Sem nova identidade visual; a pública é a 0019.

| # | Achado de UX | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Formulário de 3 idiomas × vários campos fica longo em 360 | `post-form.tsx` já é longo | média | abas PT/EN/ES **por formulário** (não por campo), indicador de campos faltantes por aba |
| 2 | Cliente sem familiaridade técnica: slug, datas parciais, categorias | briefing (cliente não técnica) | alta | slug gerado do título (editável), data com precisão (ano / mês / dia), categoria como seletor com rótulos 3 idiomas, "pré-visualizar" |
| 3 | Reordenar imagens sem arrastar em mobile | — | média | botões "subir/descer" (acessíveis por teclado); drag opcional |
| 4 | Exclusão acidental | — | alta | confirmação e despublicar como alternativa; sem hard-delete se há links de entrada? (ver §7) |

### 6.1 Frontend (dashboard)
- **Rotas:** `dashboard/conteudo` (índice com abas por seção + filtro por categoria + busca por título), `dashboard/conteudo/[secao]/novo`, `dashboard/conteudo/[secao]/[id]`. Server Components para listas; `ContentForm` Client (react state por aba de idioma) compartilhando blocos: `LocalizedField`, `ImageListEditor` (estende `image-upload.tsx`), `LinkPicker` (busca de itens por título), `StopsEditor` (só exposições), `DetailsFields` (por seção, via mapa seção → campos).
- **Estados:** vazio ("Nenhum item. Criar o primeiro"), carregando (`loading.tsx` já existe no dashboard), erro do contrato 0003 (`fieldErrors` por campo, mensagens i18n do dashboard), sucesso com toast (`flash-toast`).
- **Responsivo:** lista em cartões no mobile, tabela em ≥768; formulário em 1 coluna até 1024, 2 colunas (principal + lateral de publicação/imagem de capa) em lg+. Sem larguras fixas; sem px.
- **Acessibilidade:** abas com `role=tablist`; rótulos visíveis; erro junto ao campo (`aria-describedby`); foco no 1º campo inválido; alvos ≥2,75rem.
- **i18n:** o dashboard hoje é pt-BR (verificar chaves em `i18n.ts`); nenhum texto novo solto em componente já traduzido.

### 6.2 Backend
**Schema (diff proposto, valores em `String` + Zod, sem enums):**
```prisma
model ContentItem {
  id            String   @id @default(cuid())
  section       String   // PROJECT | EXHIBITION | RESIDENCY | NEWS | BOOK
  category      String   // slug fixo por seção (tabela §6.2.1)
  slug          String
  title         Json     // Localized
  summary       Json?    // Localized (curto, cartões)
  body          Json?    // Localized (texto com parágrafos separados por linha em branco)
  details       Json     @default("{}") // por seção, validado por Zod (§6.2.2)
  institution   Json?    // Localized: museu/galeria/organizador/veículo/editora
  city          String?
  country       Json?    // Localized
  startDate     DateTime?
  endDate       DateTime?
  datePrecision String   @default("YEAR") // YEAR | MONTH | DAY
  sortDate      DateTime? // = startDate; nulo = "data a confirmar" (ordena por último, `nulls last`; itens do briefing sem ano, 0022)
  featured      Boolean  @default(false)  // destaque curatorial (Projects, home)
  sortOrder     Int?     // curadoria manual (Projects)
  published     Boolean  @default(false)
  externalUrl   String?  // link externo (News, etc.), só https
  shopProductId String?  // Books -> Shop (0020)
  shopProduct   Product? @relation(fields: [shopProductId], references: [id], onDelete: SetNull)
  authorId      String
  author        User     @relation(fields: [authorId], references: [id])
  images        ContentImage[]
  stops         ContentStop[]
  linksOut      ContentLink[] @relation("LinkFrom")
  linksIn       ContentLink[] @relation("LinkTo")
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  @@unique([section, slug])
  @@index([section, published, category, sortDate])
}
model ContentImage { id String @id @default(cuid()); itemId String; item ContentItem @relation(fields:[itemId],references:[id],onDelete:Cascade); stopId String?; url String; alt Json; caption Json?; role String @default("GALLERY") /* COVER | GALLERY | INNER */; sortOrder Int @default(0); @@index([itemId, role, sortOrder]) }
model ContentStop  { id String @id @default(cuid()); itemId String; item ContentItem @relation(...,onDelete:Cascade); venue Json; city String; country Json; startDate DateTime; endDate DateTime?; datePrecision String @default("MONTH"); url String?; body Json?; sortOrder Int @default(0) }
model ContentLink  { fromId String; toId String; label Json? ; @@id([fromId, toId]); relations from/to onDelete:Cascade }
```
(O bloco acima é o desenho; a migration real é gerada com `npm run db:migrate` e o SQL revisado.) `ContentImage.stopId` é FK opcional para `ContentStop` (galeria por apresentação).

**6.2.1 Categorias (fixas em código, rótulos nos 3 idiomas):** o briefing define 3+2+3+3+2 (+4 Shop na 0020). Mantém-se como constante tipada `CONTENT_CATEGORIES` (slug → `Localized`), **não** como linhas editáveis em `Category` (evita a cliente criar categoria fora do briefing e quebrar a navegação); adicionar uma categoria = editar a constante (mudança de código intencional). Slugs: `art-research`, `art-commissions`, `design-visual-identity` · `solo`, `group` · `artist-residency`, `festival`, `gathering` · `publication`, `talk-workshop`, `press-writing` · `authored`, `illustrated`. Nomes por idioma conforme briefing; **textos curtos de descrição de cada categoria**: Q9 (o briefing traz descrições longas; defaults: usar as frases do briefing).

**6.2.2 `details` por seção (Zod, `z.discriminatedUnion("section")`):**
- PROJECT: `materials?: Localized`, `credits?: {role: Localized, name: string}[]`.
- EXHIBITION: `curator?: string`, `works?: Localized[]` (obras participantes), `itinerant: boolean` (derivado de `stops.length > 1`, não editável).
- RESIDENCY: `participation?: Localized` (natureza da participação), `organizer` vai em `institution`.
- NEWS: `outlet` em `institution`; `credits?: string`; `kind` implícito pela categoria.
- BOOK: `authors: string[]`, `illustrators?: string[]`, `publisher` em `institution`, `year: number`, `credits?`.
Todas as seções aceitam ainda `sourceNote?: string` e `importBatch?: string` (uso **interno**: origem "website/drive" e marca do importador da 0022; nunca renderizados no público). Campos extras são rejeitados (`.strict()`).

**Contratos (Server Actions, `src/actions/content.ts`, retorno `Result<T>` da 0003):**
| Action | Input (Zod) | Saída | Erros |
|---|---|---|---|
| `createContentItem` | `section`, `category` (válida p/ a seção), `slug?`, textos `Localized`, datas, `details`, `imageIds/urls`, `linkIds`, `stops` | `{id, slug}` | VALIDATION (fieldErrors), CONFLICT `SLUG_TAKEN`, FORBIDDEN, UNAUTHENTICATED |
| `updateContentItem` | idem + `id` | idem | + NOT_FOUND |
| `setContentPublished` | `id`, `published` | — | VALIDATION `MISSING_TRANSLATION` se faltar título em algum idioma |
| `deleteContentItem` | `id` | — | NOT_FOUND; remove imagens do Blob em segundo plano (falha de blob não bloqueia, é logada) |
| `reorderContentImages` | `itemId`, `ids[]` | — | VALIDATION se ids ≠ do item |
Todas começam com `await requireAdmin()`; erros inesperados → `INTERNAL` logado (`logError`), mensagem genérica. URLs de imagem: só do host Azure configurado (allowlist) e `externalUrl` só `https:`; `slug` regex `^[a-z0-9]+(?:-[a-z0-9]+)*$`, ≤80. Limites: título ≤200, summary ≤400, body ≤20000 por idioma, ≤60 imagens, ≤30 links, ≤20 apresentações.

**Leitura (server-only, `src/lib/content/queries.ts` novo; substitui `src/lib/content/{index,lookup}.ts` na 0019):** `listItems({section, category?, locale, limit, cursor})` (ordem: Projects por `featured desc, sortOrder asc nulls last, sortDate desc`; demais por `sortDate desc`), `getItem(section, slug, locale)` com `images`, `stops`, e **links nos dois sentidos** (união de `linksOut.to` e `linksIn.from`, só publicados), `listFeatured(n)` para a home. Seleciona só campos necessários; paginação por cursor (exposições/notícias podem crescer).

**Cache:** páginas públicas usam fetch no servidor com `revalidatePath`/`revalidateTag` chamados pelas actions (tags `content`, `content:<section>`, `content:<section>:<slug>`); definição final (tag vs path) depois de ler as docs no passo 0, especialmente com a 0017 (páginas por idioma).

**Upload:** `/api/upload` ganha `folder: "content"` (allowlist); mesmas validações (tipo/tamanho). Capas e galerias com `next/image` e `sizes` (0019). `alt` é obrigatório por imagem (≥1 idioma; publicar exige os 3 para a capa).

**Migração de `Post` → NEWS:** script idempotente `prisma/migrate-posts-to-news.ts` (roda manualmente, não no deploy): `Post.title`→`title.pt-BR`, `excerpt`→`summary`, `content`→`body` (texto puro, sem HTML), `coverUrl`→`ContentImage COVER`, `createdAt`→`startDate/sortDate`, categoria mapeada para `press-writing` por padrão (Q4: confirmar mapeamento), `published` preservado, `slug` preservado. Posts de teste do `seed.ts` não devem virar conteúdo público sem confirmação.

### 6.3 Compatibilidade vinext
Prisma e Azure SDK têm risco já registrado na 0007 §6.3; esta spec não adiciona recurso Next-only além de Server Actions/`revalidate*` (listados como suportados pela 0007). `next/image` 🟡: manter tamanhos explícitos.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ler itens publicados | sim | sim | sim | query `published: true` |
| Ler rascunho | não | não | sim | query condicionada à sessão ADMIN (preview) |
| Criar/editar/excluir/publicar/reordenar | não | não | sim | `requireAdmin()` em **cada** action |
| Upload `folder=content` | não | não | sim | rota já exige ADMIN |
- IDOR: N/A para usuários (conteúdo é da loja); mas actions validam que `imageIds`/`linkIds` pertencem ao item/existem.
- Sem `dangerouslySetInnerHTML`: `body` é texto; render por parágrafo (split em linha em branco). URLs `externalUrl` com `rel="noopener noreferrer"`.
- Rate limit: ações administrativas; reutilizar `src/lib/rate-limit.ts` só se já houver padrão no dashboard (decidir no passo 0); upload mantém limites atuais.
- Logs: nunca PII; `logError` sem payload do formulário.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `pickLocalized` fallback (en vazio → pt-BR) | unit | ordem correta; nunca string vazia se algum idioma existe |
| 2 | Zod por seção: campo extra, tipo errado, `category` fora da seção | unit | rejeita |
| 3 | Criar item válido (cada seção) | integração (Postgres de teste) | persistido, `sortDate` correto, tags revalidadas |
| 4 | Slug duplicado na mesma seção / igual em seções diferentes | integração | CONFLICT / permitido |
| 5 | Sem sessão / CUSTOMER chamando cada action | integração | UNAUTHENTICATED / FORBIDDEN, nada gravado |
| 6 | Publicar sem 3 títulos | integração | VALIDATION `MISSING_TRANSLATION` |
| 7 | Link A→B aparece em A e em B; item não publicado não aparece | integração | bidirecional, só publicados |
| 8 | Exposição com 2 apresentações | integração | `itinerant` derivado, ordem das paradas |
| 9 | URL de imagem fora do host Azure; `externalUrl` `javascript:` | unit/integração | rejeitado |
| 10 | Excluir item remove filhos (cascade) e não apaga o item vinculado | integração | ok |
| 11 | Ordenação: Projects (featured/sortOrder), demais por data desc | integração | ordem correta |
| 12 | Formulário: abas PT/EN/ES, erro por campo, loading | componente | `getByRole`, foco no 1º erro |
| 13 | Dashboard em 360/768/1280, axe | e2e | sem rolagem horizontal; zero serious/critical |
| 14 | Migração Post→NEWS idempotente | integração | rodar 2× = mesmo resultado |
Infra: Vitest existe; integração contra Postgres de teste: confirmar no passo 0 como `tests/crud-orders-actions.test.ts` isola o banco e reaproveitar (não mockar Prisma).

## 9. Plano de implementação (faseado)
**Fase 1 — dados e leitura (entregável sozinho):** 0) ler Prisma Json/`revalidate*`; 1) constantes/tipos (`Localized`, categorias, schemas Zod por seção) + unit; 2) migration (revisar SQL, não editar aplicada); 3) `queries.ts` + testes de integração; 4) seed de **exemplo** dos 5 tipos para desenvolvimento (sem links inventados).
**Fase 2 — escrita:** 5) actions + testes de papel; 6) `/api/upload` `content`; 7) formulário e listas do dashboard; 8) preview de rascunho; 9) script de migração de posts.
**Fase 3:** 10) e2e/axe; 11) docs curtas para a cliente (como cadastrar um item) — texto, sem código.

## 10. Riscos, rollback e dívidas
- `details Json` perde integridade referencial: mitigado por Zod estrito na escrita **e** `safeParse` na leitura (item corrompido não derruba a página: é omitido e logado).
- Escopo grande: por isso as fases; fase 1 já destrava a 0019.
- Rollback: migration aditiva (só cria tabelas) → reverter = descartar tabelas; `Post`/`Product` intactos.
- Dívidas: sem versionamento/histórico; sem editor rich text; sem busca.

## 11. Perguntas em aberto
- [ ] Q4 Blog atual vira News? **default** sim, posts migrados como `press-writing` e despublicados até a cliente revisar.
- [ ] Q9 Descrições de categoria nos 3 idiomas: **default** usar as frases do briefing (PT/ES onde o briefing tem; EN a traduzir? briefing traz descrição só em PT — confirmar texto oficial EN/ES).
- [ ] Q9b Publicar exige 3 idiomas? **default** título nos 3; demais campos com fallback.
- [ ] Imagens: tamanho máximo e proporção recomendada para capa (hoje `MAX_IMAGE_BYTES` em `azure-blob.ts`): **default** manter limite atual.
- [ ] Texto rico (negrito/itálico/links no corpo)? **default** não; parágrafos simples.

## 12. Checklist da review humana
- [ ] Alternativa 5.1-B (tabela polimórfica) aceita
- [ ] Idiomas por `Json` (5.2-A) aceito
- [ ] Categorias fixas em código aceitas
- [ ] Migration/schema revisados
- [ ] Matriz de permissões revisada
- [ ] Plano de testes cobre os riscos

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
