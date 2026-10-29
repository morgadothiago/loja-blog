---
id: 0019
title: Páginas de seção com abas de categoria e páginas de detalhe (Projects, Exhibitions, Residencies & Events, News, Books)
status: approved
layers: [front]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0019 — Seções com filtros e páginas de detalhe

## 1. Contexto e problema
Briefing §9: cada seção tem página de entrada; categorias como **filtros/abas horizontais** (ver todos ou uma categoria); cronologia (Exhibitions, Residencies & Events, News, Books) e curadoria em Projects; prioridade às imagens; Books como "biblioteca visual linda"; cada item com página individual e **links internos** entre seções. Hoje: grade genérica sem filtro (`src/components/sections/content-grid.tsx`), lista de texto em Exhibitions (`year-list.tsx`), detalhe só de projeto/residência (`projetos/[slug]`, `festivais-e-residencias/[slug]`), blog em shell antigo.

## 2. Objetivos e não-objetivos
**Objetivos:** componente de abas de categoria; 5 páginas de seção + 5 de detalhe lendo `ContentItem` (0018); identidade visual por seção dentro do sistema 0011/0013/0014; itinerantes; links relacionados; estados vazio/erro/loading; 3 idiomas; a11y/responsivo testados.
**Não-objetivos:** modelo/CRUD (0018); Shop (0020); About (0021); novo sistema visual; comentários/busca.

## 3. Estado atual do código
`src/components/sections/*` (`section-page.tsx`, `content-grid.tsx`, `content-card.tsx` — meta em `text-xs uppercase` linha 22, `year-list.tsx`, `detail-hero.tsx`, `detail-cover.tsx`, `detail-gallery.tsx`, `related-list.tsx`, `reading-column.tsx`, `page-title.tsx`, `practice-gallery.tsx`), `src/app/(home)/(sections)/*`, `src/components/home/story-card.tsx`, `src/lib/section-metadata.ts`, `src/components/home/placeholder-art.tsx`, tokens em `src/app/globals.css` (`page-width`, `--content-max`, `ink-link`). Letreiros de título: `SectionPage` usa o PNG do menu como `h1` (`section-page.tsx`), com a restrição de 0016 (arte nova ou fallback em texto).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `01-app/02-guides/internationalization.md`, `next-root-params.md` | 16.4.3 | Páginas sob `[lang]` com `params` Promise | Não |
| `03-file-conventions/dynamic-routes.md`, `page.md` (PageProps) | 16.4.3 | **Não li integralmente**: `generateStaticParams`, `dynamicParams`, `PageProps<"/…">` tipado por `next typegen` (AGENTS.md) | A ler no passo 0 |
| `next/image` (docs do guia de imagens) | 16.4.3 | A ler: `sizes`, `fill`, `placeholder` | A ler |
| Referências visuais: `spec/references/elena-proto-residencias-desktop.png` (**vi**), `elena-proto-home-desktop.png`, `elena-home-ref-1..4.png`, `elena-site-referencia.png` | — | Residências no protótipo: título grande em serifa, ano em manuscrito vermelho, kicker em caixa-alta pequena, capa com leve rotação, colunas deslocadas (escalonadas), link "saiba mais →" | Mostra layout escalonado, **sem abas** (briefing é posterior) |

Só abri uma referência nesta passada (a de Residências); as demais foram vistas nas specs 0011/0013 e devem ser relidas no passo 0.

## 5. Alternativas
**5.1 Onde vive o filtro**
| # | Opção | Prós | Contras | Impacto |
|---|---|---|---|---|
| A | `?category=` (query) | Simples | `searchParams` torna a página dinâmica; canonical/hreflang por query frágil; mais difícil de indexar | perf pior |
| B | **Segmento de rota `/…/projects/category/[category]`** (pré-gerado por `generateStaticParams`; "Todos" = rota base) | Estático/ISR, URL compartilhável e indexável, `aria-current` simples, funciona sem JS | Slug `category` reservado; mais rotas | perf melhor |
| C | Filtro no cliente (carrega tudo, filtra em estado) | Troca instantânea | Carrega tudo; depende de JS; URL não reflete; escala mal | bundle/dados |
**Recomendação: B.** Rejeitadas: A (dinâmica e frágil), C (acervo cresce "ao longo dos anos", §9).

**5.2 Layout da listagem por seção** (alternativas visuais; todas com os mesmos tokens)
| Seção | Recomendado | Alternativa |
|---|---|---|
| Projects | Galeria visual com capa grande, **destaques (featured) primeiro** em tamanho maior, depois grade escalonada (linguagem do protótipo/ContentCard) | Grade uniforme (mais simples, menos "curadoria") |
| Exhibitions | Lista cronológica por ano com **miniatura**, instituição e cidade/país; selo "itinerante" e série de locais | Cartões grandes (perde densidade de arquivo) |
| Residencies & Events | Escalonado como o protótipo (`elena-proto-residencias`), kicker com cidade/país·ano | Lista (como Exhibitions) |
| News | Editorial: imagem, título, data, veículo; lista vertical, mais recentes primeiro | Grade 3 colunas |
| Books | **Biblioteca**: grade densa de capas em proporção natural sobre fundo de "prateleira" (token `bg-secondary`), título e ano abaixo, sem preço | Carrossel (mau para teclado/SEO) |
Cada seção usa uma cor de faixa do tema (`bg-salmon`, `bg-mustard`, `bg-secondary`, etc. — existem tokens; **escolha por seção na review**, hoje todas usam `bg-secondary`).

## 6. Design proposto
### 6.0 Referências e direção visual
- **Intenção:** portfólio artístico e arquivo, artesanal e editorial, imagens em primeiro lugar (briefing §9).
- **Sistema extraído:** fundo creme; títulos em Fraunces; acento manuscrito Caveat (ano); tinta `text-ink`; salmão/mostarda como faixas; raio pequeno; imagens com leve inclinação opcional; texto de leitura Work Sans ≥1rem.
- **Padrões → componentes:** abas → novo `CategoryTabs` (Server, links); cartão → `ContentCard` revisto; escalonado → `StaggeredGrid` (CSS grid, sem JS); lista cronológica → `YearList` + miniatura; biblioteca → `BookShelf`; detalhe → `DetailHero/Gallery/Related` existentes + `ItemFacts` (dl de metadados) + `TourStops` (itinerantes).
- **Não copiar:** ilustrações/fotos/marcas do protótipo e das referências (placeholders até haver direito de uso, igual 0011).

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Metadados dos cartões em `text-xs` caixa-alta, único portador de ano/local | `content-card.tsx:22` | média | mínimo 0,875rem e **sem** depender só da cor; ano também no `h2`/aria |
| 2 | Abas horizontais com 3 rótulos longos (en/es: "Design & Visual Identity", "Diseño e Identidad Visual") estouram em 360 | briefing §01 | alta | lista em `overflow-x-auto` **dentro do contêiner** (a página não rola), `snap`, alvos ≥2,75rem, fade lateral indicando mais; sem quebra do rótulo |
| 3 | Imagem decorativa com `alt=""` nos cartões perde conteúdo para leitores de tela (`content-card.tsx:19`) | — | baixa | ok quando o título está no link; capa de livro e de projeto no **detalhe** leva `alt` descritivo vindo de `ContentImage.alt` |
| 4 | Capas de livro com proporções diferentes quebram a grade | briefing Books | média | tile com `aspect-[2/3]` + `object-contain` sobre fundo da prateleira (sem recorte de capa) |
| 5 | Itinerante com 2-4 locais: onde mostrar sem poluir | briefing §02 | média | no detalhe, linha do tempo vertical; no cartão, só "N locais" + o mais recente |
| 6 | Letreiros PNG de título (`SectionPage`) travam a mudança de nomes (0016) | `section-page.tsx` | alta | fallback textual `font-heading`; PNG volta quando houver arte |
| 7 | Imagens grandes de cliente podem estourar LCP/dados em 360 | — | média | `sizes` corretos, `priority` só na primeira imagem, aspecto reservado |

### 6.1 Frontend
- **Rotas** (sob `[lang]`, slugs 0017): `/projects`, `/projects/category/[category]`, `/projects/[slug]`; idem `exhibitions`, `residencies-events`, `news`, `books`. `generateStaticParams` por categoria; item `dynamicParams` com revalidação por tag (0018). `loading.tsx` por seção (esqueleto de cartões), `error.tsx` (existe `(home)/error.tsx`), `not-found.tsx` por idioma. Slug `category` reservado (validado na action da 0018).
- **Árvore (Server por padrão):** `SectionPage` (faixa de título; h1 texto/PNG) → `CategoryTabs` (links) → `ListByKind` (escolhe `ProjectGallery | YearList | StaggeredGrid | NewsList | BookShelf`) → `Pagination` (**default**: sem paginação até 24 itens; acima disso, link "Mais antigos" renderizado no servidor, por cursor). Detalhe: `DetailHero` → `ItemFacts` → `ReadingColumn` (body) → `DetailGallery` → `TourStops` (itinerante) → `RelatedLinks` (links bidirecionais agrupados por seção, com o nome da seção) → `ShopLink` (Books com produto publicado; 0020). Client apenas onde há estado: galeria com lightbox (**não** nesta spec; sem lightbox no v1) e o fade das abas (CSS).
- **Estados:** vazio por categoria ("Em breve" traduzido, com link "Ver todos"), erro (boundary 0003), loading (esqueleto), 404.
- **Responsivo:**

| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Abas | linha rolável dentro do contêiner, 1 linha | todas visíveis | todas | todas |
| Projects | 1 coluna, destaques full | 2 col | 3 col, destaque 2 col | 3 col, teto `--content-max` |
| Exhibitions | miniatura 4rem + título/local empilhados | 12 col como `YearList` | idem | idem |
| News | imagem em cima, texto embaixo | imagem à esquerda 1/3 | idem | idem |
| Books | 2 col de capas | 3-4 | 5 | 6 |
| Detalhe | imagem sangrada, texto 1 col ≤65ch | texto + `dl` lateral | idem | galeria 2-3 col |

```
Abas:  [ Todos ] [ Art & Research ] [ Art Commissions ] [ Design & … ]→   (rolável só a faixa)
Exhib.: 2026  More Than Human — Design Museum, Zurich          [itinerante · 2 locais]
```
- **Acessibilidade:** `nav aria-label` das abas (links, `aria-current="page"`; não usar `role=tab` pois navegam); foco visível; ordem de leitura = visual; `h1` único; datas com `<time datetime>`; contraste de texto sobre faixas conferido por axe nos 3 viewports; `prefers-reduced-motion` respeitado em hover/transform; imagens com `alt` do banco (obrigatório no CRUD).
- **i18n:** rótulos de categoria vêm de `CONTENT_CATEGORIES` (0018) nos 3 idiomas; datas via `Intl.DateTimeFormat(locale)` respeitando `datePrecision` (ano / mês ano / dia); strings da UI no `i18n.ts`; en/es mais longos testados em 360.
- **Tema:** só tokens (`bg-*`, `text-ink`, `font-hand`, `font-heading`); sem hex, sem `dark:` ad hoc, **sem px** (rem/escala/`cqw`).
- **SEO:** `generateMetadata` por página (título, descrição, `alternates` da 0017, OG com a capa), JSON-LD opcional (`CreativeWork`/`Book`/`ExhibitionEvent`) — **dívida**, fora do v1.

### 6.2 Backend
Consome `listItems`/`getItem`/`listFeatured` (0018). Sem actions novas. Cache: ISR por tag `content:<section>`; `Promise.all` para itens + contagem por categoria; seleção de campos mínimos nos cartões.

## 7. Segurança e permissões
Somente leitura pública de `published: true`. Rascunhos visíveis ao ADMIN via `?preview` **não** (evitar cache/vazamento): preview fica no dashboard (0018). Texto renderizado como React (escape padrão); links externos `rel="noopener noreferrer"`; `externalUrl` só `https`. Sem input do usuário além do slug (validado pelo padrão).

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Ordem: Exhibitions por `sortDate desc`; Projects featured primeiro | integração | ok |
| 2 | Abas: "Todos" e cada categoria; `aria-current` | componente | link correto, atual marcado |
| 3 | Categoria vazia / seção vazia | componente | mensagem + "Ver todos" |
| 4 | Item inexistente / não publicado | e2e | 404 |
| 5 | Itinerante mostra todas as apresentações em ordem | componente | ok |
| 6 | Links relacionados nos dois sentidos, agrupados | integração/componente | ok; sem duplicar texto |
| 7 | Book com produto publicado mostra link ao Shop; sem produto, não | componente | ok |
| 8 | 3 idiomas: rótulos, datas por precisão | componente | ok |
| 9 | 360/768/1280: sem rolagem horizontal **da página**; faixa de abas rola internamente | e2e | ok |
| 10 | Teclado nas abas e cartões; axe | e2e | zero serious/critical |
| 11 | Capturas de evidência por seção/viewport | e2e (`SHOTS_DIR`) | anexadas ao relatório |
Atualizar `e2e/pages.spec.ts` (rotas novas, remover as antigas).

## 9. Plano de implementação
0. Reler referências e docs (dynamic-routes, image). 1. `CategoryTabs` + testes. 2. Projects (lista + detalhe). 3. Residencies & Events (reaproveita o detalhe atual). 4. Exhibitions (+ `TourStops`). 5. News (substitui `/blog`; mantém redirect da 0017). 6. Books (`BookShelf`). 7. `RelatedLinks`/`ItemFacts`. 8. Home (`recent-stories`) passa a `listFeatured`. 9. Remover `src/lib/content/{index,lookup,projects,residencies,details}.ts` e chaves `content.*` de exemplo (somente depois da 0022 popular dados). 10. e2e/axe/capturas.

## 10. Riscos, rollback e dívidas
- Depende de dados reais (0018/0022); sem eles as páginas ficam vazias. Mitigação: seed de exemplo marcado como exemplo e não publicável em produção.
- Escalonado/rotação podem prejudicar leitura: manter rotação decorativa pequena e desativada com `prefers-reduced-motion`.
- vinext: `next/image` 🟡 e `generateStaticParams`/ISR por tag a conferir (0007 §6.3); usar apenas APIs documentadas.
- Rollback: manter rotas antigas atrás de feature flag até a troca? **default** não (as rotas antigas somem pela 0017).
- Dívidas: lightbox, JSON-LD, busca.

## 11. Perguntas em aberto
- [ ] Cor de faixa por seção (identidade): **default** Projects `salmon`, Exhibitions `secondary`, Residencies `mustard`, News `secondary`, Books `salmon` — validar contraste e gosto.
- [ ] Projects: ordem curatorial = destaques por `sortOrder` depois por data? **default** sim.
- [ ] Abas: mostrar contagem por categoria? **default** não.
- [ ] Livros "lançamentos mais recentes primeiro" por `year` do livro: **default** sim.

## 12. Checklist da review humana
- [ ] Filtro por rota (5.1-B) aceito
- [ ] Layouts por seção aceitos
- [ ] Crítica de UI/UX avaliada
- [ ] Responsivo e testes aprovados
- [ ] Perguntas respondidas

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
