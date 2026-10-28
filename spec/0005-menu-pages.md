---
id: 0005
title: Páginas dos itens do menu (Sobre, Projetos, Exposições, Festivais & Residências, Livros) e navegação completa
status: implemented
layers: [front]
owner: Thiago Morgado
created: 2026-10-27
approved_by: Thiago Morgado
approved_at: 2026-10-28
---

# 0005 — Páginas do menu

## 1. Contexto e problema
O menu com letreiros (spec 0001) tem 7 itens. Só `Notícias` (`/blog`) e `Shop` (`/loja`) existem; os outros 5 apontam para `/em-breve?secao=<id>` (`src/lib/nav.ts`, `src/app/(home)/em-breve/page.tsx`). O usuário pediu as páginas reais. **Regra do usuário: não receber perguntas sim/não**: esta spec adota defaults e lista decisões abertas só para registro.

## 2. Objetivos e não-objetivos
**Objetivos**
- 5 rotas novas, com a identidade visual da home (header sticky, rodapé, `px-fluid` de 20px, sem container, título manuscrito) e conteúdo i18n pt/en/es.
- `nav.ts` passa a apontar para as rotas reais; item atual com `aria-current` no menu.
- Títulos de aba por rota (`generateMetadata` traduzido), skip link, `loading`/`not-found` coerentes com a spec 0003.
- Estrutura pronta para trocar o conteúdo de exemplo por conteúdo real sem mexer em componentes.
**Não-objetivos**
- Conteúdo real, biografia real, fotos/ilustrações reais ou o nome/marca da artista da referência (só exemplos neutros).
- CRUD no dashboard e modelo no banco (avaliados na seção 5; fora do default).
- Redesenho de `/blog` e `/loja` (continuam no layout `(public)` antigo; ver 6.1 e pergunta 3).

## 3. Estado atual do código
- `src/lib/nav.ts:34-42` — `MENU_ITEMS` (id, `href`, `altKey`, `lines`, `images` por idioma); `soon(id)` gera `/em-breve?secao=`; `COMING_SOON_IDS` exportado.
- `src/app/(home)/layout.tsx` — `HomeHeader` + `<main>` + `HomeFooter` (sem container). `(home)/em-breve/page.tsx` mostra o letreiro da seção (allowlist) + "Em breve" + voltar; `robots: noindex`.
- `src/components/home/story-card.tsx` — card (imagem com proporção/recuo por posição, metadado em caixa-alta, título `line-clamp-3`), `PlaceholderArt` (`card-a/b/c`, `banner*`, `feature`, `hero`) e `HomeImage`/`HOME_IMAGES` (`src/lib/site.ts`) para trocar imagens por arquivos reais.
- `src/app/layout.tsx:27` — `metadata.title` global fixo "Loja & Blog" (sem template).
- `src/app/(public)/layout.tsx` — `SiteHeader`, `max-w-5xl`; hospeda `/loja`, `/blog`, `/carrinho` (cada página tem `loading.tsx`/`error.tsx` pela spec 0003).
- i18n: `src/lib/i18n.ts` (dicionários tipados, paridade pt/en/es) + `getT()` para servidor (`src/lib/i18n-server.ts`).
- Não existe `not-found.tsx` por segmento (só o global) nem skip links (spec 0004 propõe; **não aprovada**).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/04-functions/generate-metadata.md` | 16.4.3 | `metadata.title` aceita `template` + `default` no layout; filhos definem só o texto; `generateMetadata` é async e recebe `params`/`searchParams` como **Promise**. | Não |
| `.../03-file-conventions/dynamic-routes.md`, `04-functions/generate-static-params.md` | 16.4.3 | Rotas estáticas simples não precisam de `generateStaticParams`; Cache Components está **desligado** neste projeto (`next.config.ts`), então segmentos fixos são prerenderizados e o conteúdo por idioma exige leitura do cookie (rota dinâmica). | **Sim:** como o idioma vem de cookie (`getT()` -> `cookies()`), as páginas serão **dinâmicas por requisição** (como a home, que usa `force-dynamic`). Não dá para ter HTML estático por idioma sem mudar a estratégia (prefixo `/en`). |
| `.../03-file-conventions/not-found.md`, `10-error-handling.md` ("Not found") | 16.4.3 | `notFound()` + `not-found.tsx` por segmento. | Não |
| Código atual | — | ver seção 3 | — |

## 5. Alternativas
### 5.1 Onde mora o conteúdo
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | **Arquivo tipado em `src/lib/content/*.ts` + textos no i18n** | Sem migration, sem dashboard, testável, trocar conteúdo = editar arquivo; zero dependência | Cliente não edita sozinho; deploy para mudar texto | Baixo | Nenhum no banco |
| B | Modelo Prisma `Page`/`Project`/`Exhibition`... + CRUD no dashboard | Cliente edita sozinho | Várias tabelas/actions/forms, i18n por idioma no banco (3 colunas ou tabela de traduções), imagens via Azure, specs 0002/0003 já consomem esforço; muito escopo para exemplos | Alto | Migrations, actions, testes |
| C | MDX/Markdown em arquivos | Bom para textos longos | Exige pacote (`@next/mdx`) = dependência nova | Médio | Bundle/config |
| D | Reusar `Post` (categorias) para tudo | Já existe CRUD | Mistura blog com portfólio; sem i18n; modelo não serve (datas, locais, livros) | Médio | Confunde `/blog` |
**Recomendação: A** (default). B fica como **pendência explícita** (evolução se o cliente quiser editar no dashboard). Rejeitadas: C (dependência), D (modelo errado).

### 5.2 Layout das páginas novas
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | **Route group `(home)` já existente** (mesmo `HomeHeader`/`HomeFooter`, `px-fluid`, sem container) | Zero duplicação, identidade da home, header sticky e menu iguais | `/blog` e `/loja` ficam no layout antigo (inconsistência de header entre páginas do menu) |
| B | Novo group `(site)` e migrar também `/blog` e `/loja` | Consistência total | Toca loja/blog/carrinho (fora do pedido), risco de regressão |
| C | Novo layout próprio só para as 5 páginas | Isolado | Duplica o layout da home |
**Recomendação: A**, mais um **ajuste de baixo risco em B como pendência** (migrar `/blog` e `/loja` para o header da home numa spec própria). Rejeitada: C.

### 5.3 Rotas e idioma
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | **Rotas únicas sem prefixo de idioma** (`/sobre`, `/projetos`, `/exposicoes`, `/festivais-e-residencias`, `/livros`) com cookie de idioma (padrão atual) | Consistente com o site; URL estável | Mesma URL em 3 idiomas (SEO e compartilhamento por idioma ficam limitados) |
| B | Prefixo `/en`, `/es` (i18n routing) | SEO por idioma | Refatoração grande do app inteiro |
| C | Slugs traduzidos por idioma (`/about`, `/acerca-de`) | URLs legíveis | Exige rewrites/proxy; duplica rotas |
**Recomendação: A** (default do usuário). B/C como dívida.

## 6. Design proposto
### 6.0 Referências e direção visual
- **Referência:** a home aprovada (`spec/references/home-approved-mobile.png`) e o padrão do menu com letreiros. Nenhuma referência nova de página interna: **a composição das páginas é minha proposta**, para aprovação.
- **Sistema reutilizado:** fundo `bg-background`/`bg-secondary` (faixa de título), texto `ink`, acento `purple`, título manuscrito (`font-heading`), corpo Newsreader, `px-fluid` (20px), sem container, cards no padrão `StoryCard`, placeholders SVG originais.
- **Direção:** cada página = **faixa de título** (mesma cor do hero, `bg-secondary`) com o **letreiro do item** (a imagem já existente do menu, no idioma ativo, como `h1` com `alt` = texto) e uma frase curta; abaixo o conteúdo. Letreiros no h1 dão a identidade do menu sem fonte nova; fallback em texto manuscrito (`font-heading`) se a imagem faltar.
- **Não copiar:** textos/fatos da referência, nome ou marca da artista. **Conteúdo de exemplo = placeholders claramente neutros** ("Projeto de exemplo 1", "Local de exemplo", "Autor(a) de exemplo", datas fictícias genéricas), marcados como "Exemplo" no i18n para ninguém confundir com fato.
- **Crítica de UI/UX**
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | 5 itens do menu levam a uma página genérica "Em breve": clique sem recompensa e todos parecem quebrados | `nav.ts:34-42`, `/em-breve` | alta | páginas reais (esta spec) |
| 2 | Letreiro em imagem como `h1`: contraste e `alt` ok, mas **texto só em imagem** perde SEO/seleção e some se a imagem falhar | `home-header` usa `<Image alt>` | média | `h1` com a imagem + `alt`; título de aba por `generateMetadata`; fallback em texto |
| 3 | Mesma URL em 3 idiomas, conteúdo muda por cookie | 5.3-A | baixa | aceito; dívida de i18n routing |
| 4 | `/blog` e `/loja` seguem com o header antigo: ao navegar pelo menu o usuário "muda de site" | `(public)/layout.tsx` | alta | pendência (5.2-B), migrar em spec própria; até lá, linkar de volta |
| 5 | Listagens longas (200 itens) sem paginação | StoryCard em grade | média | exemplos pequenos hoje; ao virar dados reais, paginar (`take`/`skip` ou "carregar mais"); registrado na seção 10 |
| 6 | Página "Sobre" com texto longo: medida de leitura | — | média | `max-w-[65ch]` só no texto (padrão da home), tipografia `text-lg` |
| 7 | Cards sem imagem real | placeholders SVG | baixa | `HomeImage` + mapa de imagens (como a home) |
| 8 | Cor/contraste: `purple` sobre `bg-secondary` 7,7:1 (já calculado, spec 0001); metadado `muted-foreground` sobre `bg-background` 5,6:1 | seção 6.0/spec 0001 | ok | manter; nunca `salmon`/`coral` como texto |

### 6.1 Frontend
- **Rotas** (todas em `src/app/(home)/`, dinâmicas por cookie de idioma, como a home):
  - `/sobre` — texto longo (3-4 parágrafos de exemplo) + imagem lateral (`HomeImage`, placeholder), medida ~65ch.
  - `/projetos`, `/exposicoes`, `/festivais-e-residencias`, `/livros` — grade de cards (1 coluna 360, 2 a partir de 640, 3 a partir de 1024 com `gap` da escala atual), cada card: imagem (proporção por posição como `StoryCard`), metadado em caixa-alta (ano/local/tipo), título; **sem páginas de detalhe** nesta spec (card sem link, ou link inerte? default: card **não** é link; evita novo "em breve". Pergunta registrada).
  - `/blog` (Notícias) e `/loja` (Shop): inalterados.
  - `/em-breve`: **mantida como fallback** (sem itens do menu apontando para ela; `noindex`), útil para seções futuras; removê-la é trivial depois.
- **Componentes novos**: `SectionPage` (S: faixa de título com letreiro + subtítulo + slot de conteúdo), `ContentGrid` (S: grade responsiva de cards), `ContentCard` (S: derivado do padrão de `StoryCard` com props `title`, `meta`, `imageSlot`, `index`; **extrair o visual comum de `StoryCard` só se a duplicação for real**: se `StoryCard` e `ContentCard` divergirem pouco, `StoryCard` passa a ser um caso do `ContentCard`; decisão na implementação, com testes cobrindo ambos), `AboutPage` content block.
- **Dados** (`src/lib/content/`): `projects.ts`, `exhibitions.ts`, `festivals.ts`, `books.ts`, `about.ts` — arrays/objetos **tipados** (`ContentEntry = { id; year?: number; placeKey?; titleKey; metaKeys? ; image?: ImageSlot }`) com **chaves i18n** para textos (as 3 línguas ficam no dicionário `src/lib/i18n.ts`, paridade garantida pelo tipo). Trocar conteúdo = editar o arquivo + dicionário.
- **nav**: `MENU_ITEMS[*].href` passam a `/sobre`, `/projetos`, `/exposicoes`, `/festivais-e-residencias`, `/livros`; `soon()` e `COMING_SOON_IDS` removidos (ou mantidos só se `/em-breve` continuar usada).
- **Item atual (aria-current)**: o `AppHeader` já compara `pathname === href`; passa a funcionar com as rotas reais. Para sub-rotas futuras, usar `startsWith` (decisão: igualdade por ora; teste cobre).
- **Metadata**: `title.template` + `default` no layout `(home)` (ex.: `%s | {SITE.name}`) e `generateMetadata` por página com o texto do item **no idioma do cookie** (`getT()`); `description` curta traduzida. `metadata.title` global do layout raiz continua como padrão para outras áreas.
- **Estados**: `loading.tsx` do group (esqueleto simples via `LoadingSkeleton`), `error.tsx` do group já existe (spec 0003), `not-found.tsx` do group com `ErrorView`-like (texto + voltar), listagem vazia (array vazio) mostra mensagem i18n ("Nada por aqui ainda"), 1 item não quebra a grade.
- **Skip link**: **depende da spec 0004 (não aprovada)**. Default desta spec: implementar `SkipLinks` **somente se a 0004-alternativa 1 for aprovada**; senão, só `id="main-content"` no `<main>` do group (aditivo, não muda visual). Registrado como decisão condicional.
- **Responsivo**

| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Faixa de título | letreiro `h-12`→`h-16`, subtítulo abaixo, `px-fluid` | `h-16` | `h-20` | `h-24` (letreiro com `max-w-full`) |
| Grade | 1 coluna, `gap-4` | 2 colunas | 3 colunas, `gap-8` | 3 colunas, `gap-8` (sem container; cards crescem com a janela) |
| Sobre | imagem em cima, texto embaixo | 2 colunas (imagem 2/5, texto 3/5) | idem, texto `max-w-[65ch]` | idem |
| Rodapé / header | os da home (sticky, `px-fluid`) | | | |
- **Acessibilidade**: um `h1` por página (o letreiro com `alt`), `h2` por bloco, landmarks (`main`), grade como `<ul>/<li>`, imagens decorativas dos cards com `alt=""` (o título é o nome), contraste AA conforme seção 6.0, foco visível, alvos ≥44px nos links do rodapé/menu, `prefers-reduced-motion` (sem animações novas), textos longos en/es sem quebrar (`min-w-0`, `line-clamp-3` no título).
- **i18n**: chaves `page.<id>.title/subtitle/description`, `content.<id>.<n>.title/meta`, `about.p1..p4`, `content.empty`, `content.example` ("Exemplo"). Tudo nas 3 línguas, **textos neutros e marcados como exemplo**.

### 6.2 Backend
N/A (sem banco, sem actions no default). Se o cliente optar por 5.1-B: modelos `ContentEntry` (tipo, ano, local, `titleI18n`...), CRUD no dashboard sob `defineAction` (spec 0003), migration aditiva, upload Azure; entra numa spec nova.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ver as 5 páginas | ✔ | ✔ | ✔ | públicas; **proxy não as protege** (matcher inalterado) |
- Sem entrada de usuário, sem formulários, sem `dangerouslySetInnerHTML` (textos vêm de chaves i18n estáticas). `/em-breve?secao=` continua com allowlist.
- Sem dados pessoais. `robots`: as páginas são indexáveis; `/em-breve` `noindex`.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Cada página renderiza em pt/en/es: `h1` (letreiro) com `alt` do idioma, `h2`/conteúdo traduzido, sem chave i18n crua | componente (RTL; `getT` e `HomeImage` mockados) | texto por idioma |
| 2 | `MENU_ITEMS` aponta para as 5 rotas reais; Shop `/loja`, Notícias `/blog`; nenhum href `/em-breve` | unit | mapa conferido |
| 3 | Dados tipados: ids únicos, todas as chaves i18n existem nas 3 línguas (teste de paridade do conteúdo) | unit | sem chave faltando |
| 4 | Menu: `aria-current="page"` no item da rota atual (mock de `usePathname`) para cada rota | componente | ok |
| 5 | Grade: 0, 1 e 3 itens; título longo (`line-clamp-3`); card sem imagem usa placeholder | componente | sem quebra, mensagem de vazio |
| 6 | `generateMetadata` por rota: título/descrição no idioma do cookie; template com o nome do site | unit | "Projetos \\| Nome" etc. |
| 7 | `not-found` do group e `loading` renderizam | componente | texto + link de voltar |
| 8 | Rotas públicas: `authorized` não bloqueia as 5 páginas (anônimo) | unit (`auth.config`) | `true` |
| 9 | `/em-breve` segue funcionando (allowlist) como fallback | componente | ok |
| 10 | Responsivo/axe 360/768/1280/1920 | e2e | **Playwright não aprovado: declarar não verificado** |

## 9. Plano de implementação
1. `src/lib/content/*.ts` (tipos + dados de exemplo) e chaves i18n nas 3 línguas + teste de paridade.
2. `SectionPage`, `ContentGrid`, `ContentCard` (+ extração de `StoryCard` se justificada) + testes.
3. Páginas `sobre`, `projetos`, `exposicoes`, `festivais-e-residencias`, `livros` em `(home)` com `generateMetadata` traduzido; `title.template` no layout do group; `loading.tsx` e `not-found.tsx` do group.
4. Atualizar `nav.ts` (hrefs reais, remover `soon()`), `aria-current` testado.
5. `tsc`, `eslint`, `vitest`, `next build`; conferir no servidor local (curl) status 200 das rotas e `<title>` por idioma; relatório (seção 14) e atualização da spec 0001.

## 10. Riscos, rollback e dívidas
- Riscos: conteúdo de exemplo confundido com real (mitigação: textos neutros + rótulo "Exemplo"); inconsistência de header entre `(home)` e `(public)` (`/blog`, `/loja`); i18n por cookie (mesma URL em 3 idiomas); páginas dinâmicas (sem cache estático).
- Rollback: reverter commit; `nav.ts` volta a `soon()` (aditivo: a rota `/em-breve` continua).
- Dívidas aceitas: conteúdo real e editável (modelo no banco + dashboard); páginas de detalhe (projeto, exposição, livro); paginação; migrar `/blog` e `/loja` para o layout `(home)`; i18n routing por prefixo; skip links (spec 0004); imagens reais e licenciadas.

## 11. Perguntas em aberto (com default; o usuário não quer sim/não, então o default vale)
- [ ] 1. Conteúdo no banco com CRUD ou arquivo tipado? **Default: arquivo tipado (5.1-A); banco como pendência.**
- [ ] 2. Cards das listagens levam a páginas de detalhe? **Default: não (sem links); detalhes = próxima spec.**
- [ ] 3. Migrar `/blog` e `/loja` ao layout/header da home? **Default: não agora (spec própria).**
- [ ] 4. Manter `/em-breve`? **Default: manter como fallback `noindex`.**
- [ ] 5. Skip links junto desta spec? **Default: só `id="main-content"`; skip links seguem a spec 0004.**
- [ ] 6. Quais campos de metadado cada listagem mostra (ano, local, autor, tipo)? **Default: ano + local (projetos/exposições/festivais) e autor + ano (livros), tudo exemplo.**
- [ ] 7. Textos reais e imagens autorizadas do cliente: quando chegam? **Default: seguir com exemplos neutros e placeholders; troca por arquivo.**

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado (N/A: sem banco)
- [ ] Matriz de permissões revisada
- [ ] Direção visual e referências interpretadas corretamente
- [ ] Crítica de UI/UX avaliada (aceito / ajusto / rejeito cada achado)
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
Aprovada por Thiago Morgado em 2026-10-28 com os defaults recomendados (perguntas em aberto 1 a 7). Base: pedido do usuário "depois que essa fila acabar fazer as páginas de todos os itens do menu" e regra do usuário de não ser perguntado sim/não (2026-10-27). Registro feito pelo coordenador. Sem dependências novas; Playwright NÃO aprovado.

## 14. Relatório pós-implementação
Implementada em 2026-10-28 (spec aprovada; defaults da seção 11).

**O que foi feito**
- 5 rotas novas em `src/app/(home)/(sections)/`: `/sobre`, `/projetos`, `/exposicoes`, `/festivais-e-residencias`, `/livros` (dinâmicas por cookie de idioma, como a home); mesmo header sticky, rodapé e `px-fluid` da home, sem container. `/blog` e `/loja` inalterados.
- `src/lib/nav.ts`: hrefs reais; `soon()` e `COMING_SOON_IDS` removidos. `aria-current` do menu funciona por igualdade de rota (testado nas 7 rotas).
- `SectionPage` (faixa `bg-secondary` com o letreiro do item como `h1`, `alt` = texto, subtítulo e rótulo "Conteúdo de exemplo"), `ContentGrid` (1/2/3 colunas; vazio com mensagem), `ContentCard` (padrão visual do `StoryCard`; não é link, sem página de detalhe), `AboutContent` (imagem + parágrafos, `max-w-[65ch]` só no texto). `StoryCard` **não** foi refatorado (a duplicação é pequena; fica como possível extração futura).
- Dados tipados em `src/lib/content/index.ts` (`CONTENT_SECTIONS`, `ABOUT`) + textos nas 3 línguas em `src/lib/i18n.ts` (35 chaves: subtítulos, 3 itens por seção com título/metadado, 3 parágrafos de Sobre, `content.empty`, `content.example`). Conteúdo **neutro, rotulado "exemplo"**; sem nome da artista da referência nem fatos reais. Imagens: placeholders SVG originais; `ContentEntry.image`/`ABOUT.image` aceitam arquivo real (`src`).
- Metadata: `title.template` (`%s | Nome`) no layout `(home)`; `generateMetadata` traduzido por rota (`sectionMetadata`); `<main id="main-content">` no layout. `loading.tsx` no group `(sections)` (esqueleto da spec 0003).
- `/em-breve`: mantida como fallback `noindex`, agora genérica (sem `?secao=` nem allowlist, já que nenhum item aponta para ela).

**Verificação**: `tsc` sem erros; `eslint` limpo; `vitest` 28 arquivos, 268 testes passando (novo `tests/menu-pages.test.tsx`: cada página nos 3 idiomas, dados/paridade i18n, estados da grade, metadata, `title.template`, proxy liberando as rotas, `aria-current` nas 7 rotas; `menu-images` atualizado); `next build` ok. `next start` em outra porta: as 5 rotas respondem 200 com `<title>` correto ("Sobre | Loja & Blog" etc.), e com `Cookie: locale=en/es` o título, o `alt` do letreiro e o conteúdo mudam de idioma.

**Desvios**: `not-found` por segmento **não** foi criado (nenhuma página chama `notFound()`; vale o `not-found.tsx` global da spec 0003); skip links não implementados (dependem da spec 0004, só `id="main-content"`).

**NÃO verificado**: aparência/responsividade em 360/768/1280/1920 e axe (Playwright não aprovado). O `next dev` em execução precisa ser reiniciado.

**Pendências / dívidas**: conteúdo real e editável (modelo no banco + dashboard); páginas de detalhe; paginação; migrar `/blog` e `/loja` ao layout `(home)`; i18n por prefixo de rota; arte inglesa "EXIBITIONS" do menu a corrigir pelo cliente; imagens reais e licenciadas.
