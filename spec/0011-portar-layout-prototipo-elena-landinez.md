---
id: 0011
title: Copiar o VISUAL do protótipo elena-landinez-studio para o loja-blog (sem a stack Lovable): inventário, conflito com as specs aprovadas, crítica e direção
status: implemented
layers: [front]
owner: Thiago Morgado
created: 2026-10-28
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("registre minha aprovação da 0011 e 0012 com os defaults")
approved_at: 2026-10-28
---

# 0011 — Portar o layout do protótipo `elena-landinez-studio`

Spec-guarda-chuva (decisão de direção + camada 1: tema). As páginas novas ficam na **0012**. Nada de código foi escrito.

## 1. Contexto e problema
Pedido: "olha o projeto `/Users/thiagomorgado/Desktop/elena-landinez-studio` e faz o layout seguindo o que já tem aqui", depois "seguir layout, design, UI e UX". **Esclarecimento do usuário (mensagem posterior, registrada como fato): "eu não quero usar a stack da Lovable, eu só quero copiar o visual dele".** Logo: **stack = a deste projeto** (Next 16, Tailwind 4, base-ui, i18n por cookie, Server Actions); **o que se copia é o visual** (tokens, tipografia, composição, efeitos, ritmo). Nada de TanStack Router/Start, Vite, Radix, `localStorage` de idioma nem os ~40 componentes shadcn do protótipo.

**Fato central descoberto:** o protótipo e o loja-blog são **duas linguagens visuais diferentes** da mesma artista.
- Protótipo (Lovable, TanStack Start + Vite): papel/tinta/musgo, serifa **Fraunces** nos títulos, **Work Sans** no corpo, **Caveat** terracota como acento, fundo pontilhado, colagem (recorte "rasgado", fita, costura), cards que "balançam", menu lateral só com texto.
- loja-blog (specs 0001, 0005, 0006, 0010, **aprovadas e implementadas**): creme com **faixas de cor cheia** (salmão/mostarda), letreiros manuscritos **em imagem PNG** fornecidos pelo cliente (menu, título das seções, logo), menu overlay de tela cheia, newsletter mostarda, fonte padrão sans-serif por pedido do usuário (0006/0010), referências do cliente em `spec/references/` (`elena-home-mobile.png`).
Como o usuário quer **o visual do protótipo**, a direção provável é **substituir a identidade visual hoje aprovada**, o que **revoga em parte** 0001/0005/0006/0010. Não posso assumir isso em silêncio: a spec propõe a rota "visual do protótipo com escada de risco" e lista exatamente o que seria superado (seção 5.4). Falta só o usuário dizer o destino dos ativos do cliente (letreiros PNG, ilustrações) — pergunta 1.

## 2. Objetivos e não-objetivos
**Objetivos**
- Inventariar o protótipo com evidência e mapear protótipo → loja-blog (o que existe, difere, falta).
- Decidir qual linguagem prevalece quando divergem e propor o que portar.
- Camada 1 (esta spec): tema do protótipo (fontes, tokens, utilitários de colagem/movimento com reduced-motion) e `YearList`.
- Camada 2 (spec 0012): páginas que faltam (detalhe de projeto e de residência, práticas, contato).
**Não-objetivos**
- Usar a stack Lovable (ver seção 1). Alterar 0007–0009 (só pontos de contato, seção 6.6). Copiar ilustrações/fotos/textos do protótipo sem confirmação de direitos. Backend de conteúdo (CMS/Prisma).

## 3. Estado atual do código
**loja-blog (lido):**
- Layout `src/app/(home)/layout.tsx:11-21`: `HomeHeader` + `main#main-content` + `HomeFooter`; conteúdo em `.page-width` (`src/app/globals.css:155-165`, `--content-max: 90rem`, `px-5`).
- Rotas já existentes: `/`, `/sobre`, `/projetos`, `/exposicoes`, `/festivais-e-residencias`, `/livros` (`src/app/(home)/(sections)/*`), `/em-breve`; `(public)`: `/loja`, `/blog`, `/carrinho`; `(auth)`, `(private)`.
- `SectionPage` (`src/components/sections/section-page.tsx:12-37`): faixa `bg-secondary` + letreiro PNG como `h1`; `ContentGrid`/`ContentCard` (`content-card.tsx`): cards **não clicáveis**, 3 placeholders por seção (`src/lib/content/index.ts:25-35`, default da 0005 "sem detalhe").
- Menu: `src/lib/nav.ts` — 7 itens, cada um com **PNG de letreiro por idioma**; não há PNG para "Práticas" nem "Contato".
- Tokens: `globals.css:60-148` (cream, paper, salmon, mustard, ink, purple, teal, coral, navy; `--radius: 0.75rem`); `font-heading` = Caveat Brush (`src/app/layout.tsx:12-21`), corpo Inter. `prefers-reduced-motion` tratado em `globals.css:179` e `home-carousel.tsx:88`.
- i18n: `src/lib/i18n.ts` (606 linhas, `MessageKey` tipado, pt-BR/en/es), cookie `locale` lido no servidor (`layout.tsx:36-38`), `getT()` em `src/lib/i18n-server.ts`. O dicionário é importado pelo contexto de cliente (`src/contexts/language-context.tsx`), logo vai ao bundle do cliente (inferência pelo `"use client"` + import; confirmar na implementação).
- Rodapé: `src/lib/site.ts:12-18` já prevê `footer.contact` sem `href` (página de contato ainda não existe).
- Testes: Vitest + Testing Library em `tests/` (ex.: `menu-pages.test.tsx`, `home-footer-feature.test.tsx`). **Sem Playwright/axe** (0004 §8 declarou "não aprovado").

**Protótipo (lido, somente leitura):** `src/styles.css` (122 linhas), `SiteShell.tsx`, `YearList.tsx`, 10 rotas em `src/routes`, `lib/content.ts` (conteúdo tipado `L = {pt,en,es}`), `lib/i18n.tsx` (provider com `localStorage`), `schemas/contact.ts`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/02-components/font.md` | 16.4.3 | `next/font/google` com `variable`, `display`, `subsets`; fonte variável dispensa `weight` | Não |
| `.../02-components/image.md` | 16.4.3 | `sizes` gera `srcset` completo; sem `sizes` em `fill` assume 100vw; **`priority` deprecated, usar `preload`**; `qualities` obrigatório (já em `next.config.ts`) | Parcial: 0006 cita `fetchPriority`; o doc desta versão diz `preload` (conferir na implementação) |
| `.../04-functions/generate-metadata.md` | 16.4.3 | `params` é `Promise` e exige `await` em `generateMetadata` | Não (já sabido) |
| `.../04-functions/generate-static-params.md`, `03-file-conventions/dynamic-routes.md` | 16.4.3 | base para `/projetos/[slug]` com `notFound()` | Não; a ler em detalhe na 0012 |
| Specs 0001, 0004, 0005, 0006, 0010, 0007–0009 (§6.3 vinext) | — | decisões aprovadas e compat. vinext | Ver divergências, seção 5 |
Protótipo: `README.md` (reconstrução de elenalandinez.net; referência de estilo oliverjeffers.com, já tratada na 0004 sem captura).

## 5. Inventário, mapeamento e alternativas

### 5.1 Protótipo — evidências
Capturas (Brave headless, dev server do protótipo na porta 5199, encerrado ao final): `spec/references/elena-proto-home-desktop.png`, `elena-proto-home-mobile.png` (iframe de 390 de largura), `elena-proto-residencias-desktop.png`, `elena-proto-sobre-mobile.png`. **Ressalva:** a janela de captura tinha ~4300 de altura, então valores em `vh` (banner `h-[50vh]`, hero `72vh`) saem inflados nas imagens; tratar proporção do banner como **não confiável**. Páginas `/contact`, `/exhibitions`, `/projects`, detalhe e `practices` foram capturadas na sessão mas lidas só pelo código (não anexadas). 360 e 768 **não** foram verificados no protótipo; só ~390 e 1280.

| Rota | Conteúdo / comportamento |
|---|---|
| `/` | Hero 7/5: kicker manuscrito "bem-vindo —", título `um mar de / encontros` (serifa, itálico musgo), 4 palavras manuscritas em fade-up escalonado; ilustração rotacionada com mariposa flutuante. Banner de mural 50vh + legenda; "Histórias recentes" 3 cards (o 2º com offset vertical); bloco "arte & ativismo" com retrato em colagem. |
| `/about` | Título + retrato sticky (md+) + bio (parágrafo lead em serifa) ; "sobre minha prática" + obra sticky. Texto da bio **só em pt, hardcoded na rota**. |
| `/projects`, `/projects/$slug` | Lista editorial alternada (imagem 7 col / texto 5 col, inverte a cada item); detalhe: voltar, meta, `h1` até 8rem, imagem grande, corpo em 6 colunas centradas, galeria 2 col com offset. |
| `/exhibitions` | `YearList`: grade ano manuscrito / título serifa / local; hover tinge a linha. |
| `/residencies`, `/residencies/$slug` | Cards 2 col com rotação leve; detalhe com créditos, galeria em colunas CSS, "outras jornadas". |
| `/practices/$type` | Galeria em colunas (drawing, ceramic, collage) filtrando projetos. |
| `/contact` | Formulário só com linha inferior; envia via `mailto:` (ver crítica). |
| Shell | Cabeçalho logo + palavra "menu" manuscrita; drawer direito 420 de largura com `Esc`, bloqueio de scroll, idioma e redes no pé; rodapé com "arte é vida". |

Tokens (`styles.css`): `--paper oklch(.965 .018 85)`, `--ink oklch(.24 .03 150)`, `--moss oklch(.52 .08 140)`, `--primary oklch(.58 .15 40)` (terracota), `--radius .25rem`; fontes Fraunces/Work Sans/Caveat; efeitos `wobble` (hover gira -1,5° e escala 1,02), `float-slow` (infinito), `fadeUp` 0,9 s, `ink-link` (sublinhado que cresce), `torn`/`stitch`/`tape`/`paper-shadow`. Dependências: ~25 pacotes Radix + componentes shadcn quase todos **sem uso** (inferência: só `Link`, `useForm`; não auditei uso de cada).

### 5.2 Mapeamento protótipo → loja-blog
| Protótipo | loja-blog hoje | Situação | Qual prevalece |
|---|---|---|---|
| Home (hero texto + ilustração, palavras animadas) | Hero com ilustração única + título, banner, histórias, feature, newsletter (0001/0006) | **Difere por decisão aprovada** | **loja-blog** (0006) |
| Menu drawer texto | Overlay tela cheia com letreiros PNG (0005) | Difere | **loja-blog** |
| Sobre (0010) | `AboutContent` com faixa rosa, fotos, cachalote, CV | Difere | **loja-blog** (0010) |
| `/projects` lista editorial alternada | `/projetos` grade de 3 cards placeholder | Falta o desenho "editorial" e o link p/ detalhe | Protótipo (0012) |
| `/projects/$slug` | — | **Falta** | Protótipo (0012) |
| `YearList` exposições | cards | Difere | Proposta: protótipo, **com decisão** (pergunta 5) |
| `/residencies` + `$slug` | `/festivais-e-residencias` cards; sem detalhe | Falta detalhe | Protótipo (0012) |
| `/practices/$type` | — (menu sem letreiro para "Práticas") | Falta | Protótipo, sem item de menu (pergunta 4) |
| `/contact` | rodapé prevê `footer.contact` sem href | Falta | Protótipo na forma, **reescrito** (Server Action + Zod) |
| `ink-link`, `fadeUp` | só `underline`/carrossel | Falta | Portar, com `prefers-reduced-motion` |
| `wobble`, `float-slow`, `torn/stitch/tape`, fundo pontilhado, Fraunces/Work Sans | — | Linguagem do protótipo | **Não portar por padrão** |
| i18n em `localStorage` | cookie + SSR | Pior no protótipo | **loja-blog** |
| `livros`, `blog`, `loja`, `carrinho`, auth | existem só aqui | — | Herdam o layout |

### 5.3 Alternativas (decisão não trivial: o quanto do protótipo adotar)
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | **Substituir a identidade visual inteira** pela do protótipo (tokens, fontes Fraunces/Work Sans/Caveat, home, sobre, menu de texto, faixas de cor removidas) | Máxima fidelidade ao "visual dele"; identidade única | Descarta ativos do cliente (letreiros PNG do menu/títulos, ilustrações de `src/assets`); refaz home/menu/sobre/newsletter já testados; revoga 0001/0005/0006/0010; header/menu base-ui reescritos | Alto: ~metade do front; vários testes de `tests/` mudam | +2 fontes, CSS novo |
| B | **Visual do protótipo em camadas (recomendada):** (1) tokens e tipografia do protótipo como tema do site; (2) composição e efeitos nas páginas **novas** e nas listas; (3) home/menu/sobre/rodapé só se o usuário confirmar o destino dos ativos do cliente (5.4) | Entrega o visual pedido sem apostar tudo de uma vez; cada camada é revisável e reversível; stack daqui intacta | Camada 1 muda a cara de tudo (inclusive loja/blog/checkout) e exige aprovação explícita; convivência temporária de estilos entre camadas | Médio, faseável (0011 + 0012 + spec futura da camada 3) | +2 fontes via `next/font`; CSS aditivo |
| C | **Só estrutura/páginas faltantes**, mantendo o visual aprovado | Mínimo risco | **Não atende o pedido** ("copiar o visual") | Baixo | Nenhum |
| D | **Tema alternável** (protótipo como segundo tema por flag) | Preserva ambos | Dobra manutenção e testes; sem demanda | Alto | CSS duplicado |
**Recomendação: B.** A (rejeitada por ora): é B com a camada 3 já decidida; vira A se o usuário disser que os ativos do cliente saem. C (rejeitada): contraria o pedido. D (rejeitada): complexidade sem uso.

### 5.4 O que as camadas superam (para decisão explícita)
| Spec aprovada | O que o visual do protótipo contradiz | Camada |
|---|---|---|
| 0006 / 0010 (fonte do corpo sans-serif; título manuscrito) | corpo Work Sans (também sans) mantém a regra; títulos passam de Caveat Brush para **Fraunces** (serifa) e acentos em **Caveat** | 1 |
| 0001 / 0006 (faixas salmão/mostarda de ponta a ponta, newsletter mostarda) | protótipo usa fundo papel contínuo, sem faixas de cor cheia | 3 |
| 0005 (menu overlay de letreiros PNG, títulos de seção em PNG) | protótipo: palavras em tipografia (menu "menu" manuscrito, títulos serifa) | 3 |
| 0001 (hero carrossel/ilustração única) / 0006 | protótipo: hero tipográfico + ilustração inclinada + mariposa | 3 |
| 0010 (Sobre: faixa rosa, fotos, cachalote, CV) | protótipo: retrato sticky + bio + prática | 3 |
| 0002/0003/0007–0009 | só herdam tokens (camada 1); sem mudança de fluxo | 1 |
Camadas 1 e 2 **não exigem** abrir mão de nenhum ativo do cliente; a camada 3 sim.

## 6. Design proposto (opção B)

### 6.0 Referências e direção visual
- **Referências analisadas:** capturas do protótipo (acima, lidas de fato), `spec/references/elena-home-mobile.png` (cliente), código do protótipo. **Não** vi `elenalandinez.net` nem oliverjeffers.com renderizados (0004 §4).
- **Intenção do protótipo:** portfólio artesanal e editorial; "fugir de cara de IA" (README); tom caloroso, escala tipográfica grande, imagens com leve inclinação.
- **Sistema extraído:** paleta (papel = fundo; tinta = texto; musgo = destaque secundário; terracota = acento manuscrito); display serifa 4–8rem em títulos curtos, acento manuscrito 1,5–2,25rem, leitura 1,125rem; ritmo vertical grande (`mt-24/28/32`); grade 12 col com colunas de leitura 6/12; raio ~0; imagens sem moldura, cover, rotação ±1–2°.
- **O que traduzir** (tokens daqui, valores do protótipo): estrutura editorial 7/5 alternada; coluna de leitura 6/12 (`max-w-prose`); lista cronológica ano/título/local; "voltar" manuscrito no topo do detalhe; links com sublinhado crescente; entrada suave (fade/translate curto).
- **O que copiar (visual):** paleta papel/tinta/musgo/terracota; Fraunces (títulos), Work Sans (corpo), Caveat (acento curto); `radius` ~0,25rem; fundo pontilhado sutil; ritmo e grade editorial; imagens com leve inclinação pontual; adereços de colagem (`torn`, `stitch`, `tape`) **com parcimônia**; links com sublinhado crescente; entrada suave.
- **O que NÃO copiar:** ilustrações, fotos, textos reais da artista, mariposa, logotipo (direitos, pergunta 2); a stack (TanStack, Vite, Radix, shadcn/Radix, `localStorage`); `wobble`/`float` perpétuo sem `reduced-motion` (ver crítica); drawer sem foco preso; `px`/`vh` rígidos.

### 6.0b Crítica de UI/UX (protótipo e pedido)
Contrastes calculados (oklch→sRGB linear, WCAG; aproximação minha, conferir com ferramenta antes de aprovar): terracota `primary` sobre papel **4,13:1**; musgo **4,81:1**; `muted-foreground` **6,63:1**; tinta **14,73:1**; texto claro sobre terracota (botão) **4,31:1**. Aqui: roxo/papel 7,68:1, muted/papel 5,63:1.

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Drawer: `aside aria-hidden` fechado mas **links continuam focáveis** (apenas `translate-x-full`); sem foco preso, sem mover foco ao abrir, overlay é `div` com `onClick` | `SiteShell.tsx:44-52` | alta | Não portar. Menu daqui já é `Sheet` base-ui (`app-header.tsx`) |
| 2 | Animações infinitas (`float-slow` 7 s) e `wobble` sem `prefers-reduced-motion`; `grep reduced` no `styles.css` = vazio | `styles.css:99-120` | alta (WCAG 2.2.2/2.3.3) | Portar só `ink-link`/fade curtos, **dentro** do `@media (prefers-reduced-motion: no-preference)`; sem animação perpétua |
| 3 | Contato envia `mailto:` **sem destinatário** (`mailto:?subject=`): não envia nada; sem `label` (só placeholder); erros em pt fixo; sem `autocomplete` | `contact.tsx:27-45`, `schemas/contact.ts` | alta | Reescrever na 0012: Server Action + Zod, labels, `autocomplete`, i18n, rate limit |
| 4 | Alvos pequenos: "menu" e "fechar" são texto manuscrito sem área mínima; idiomas `text-sm` sem altura | `SiteShell.tsx:30-38,68-72` | média | Mínimo 2,75rem de altura (`min-h-11`) como já fazem os links do rodapé daqui |
| 5 | Texto em `text-xs` (0,75rem) carrega legenda e meta (local · ano) | `index.tsx:51`, cards | média | Meta ≥ 0,75rem apenas como apoio; nada essencial só em microtexto (padrão 0006) |
| 6 | Terracota 4,13:1 em texto pequeno (kicker `text-2xl` é "grande": passa 3:1; "enter →" `text-2xl` idem). Qualquer uso em corpo falharia 4,5:1 | cálculo acima | média | Aqui, acento só com tokens que passam 4,5:1 (`text-purple` 7,68:1) |
| 7 | Banner `h-[50vh] object-cover` recorta a obra larga em 390 (vê-se só um fragmento) | `elena-proto-home-mobile.png` | média | Já resolvido aqui com `aspect-[3/1]` + legenda (0006); manter |
| 8 | Alturas em `vh`/`min(72vh,760px)` e px: quebram em janela baixa e **violam a regra "sem px"** deste projeto | `index.tsx:32,41` | média | Usar `aspect-*`, `rem`, `cqw` |
| 9 | Conteúdo real (bio, créditos "performers & palestrantes", "outras jornadas") **hardcoded em pt**; só parte em `en/es` | `about.tsx:21-39`, `residencies_.$slug.tsx:55,66` | alta p/ i18n | Todo texto visível via i18n (pt-BR/en/es) |
| 10 | Idioma em `localStorage` aplicado em `useEffect`: servidor sempre renderiza pt, troca após hidratação; `og:description` só pt | `i18n.tsx:12-22`, rotas | média | Manter cookie + SSR daqui |
| 11 | Galerias com `alt=""` em imagem de conteúdo ou `alt` repetitivo ("Título — 1") | `projects_.$slug.tsx:46`, `residencies_.$slug.tsx:62` | média | `alt` descritivo vindo do conteúdo; vazio só se decorativa |
| 12 | `h1` até `text-8xl` (6rem+) com títulos longos ("The More-Than-Human Rights Mural", "Residência Piratas do Amor"); em 360 há risco de estouro/quebra ruim (**não medi**) | `projects_.$slug.tsx:34` | média | Escala `clamp`/`text-4xl sm:text-5xl lg:text-7xl`, `text-balance`, `break-words`; testar 360 |
| 13 | Rotação e `shadow-xl` em toda foto: em lista densa vira ruído e "efeito pronto" de template | todas as listas | baixa | Rotação só pontual (um item), nunca em galeria de 10+ |
| 14 | Estética "Lovable/shadcn": ~40 componentes `ui/` e ~25 Radix sem uso | `package.json`, `src/components/ui` | baixa (hygiene) | Nada disso é portado |
| 15 | Hierarquia: cada página de lista tem kicker manuscrito + título + conteúdo; bom ponto focal único. Ponto positivo a manter | capturas | informativo | Manter (`SectionPage` já faz) |
| 16 | **Conflito:** protótipo e specs aprovadas divergem em fonte, menu, home, sobre | seção 1 | **bloqueante p/ implementação** | Resolver na pergunta 1 antes de qualquer código |

### 6.1 Frontend (camada 1 = 6.3; camada 2 = 0012; depende de aprovar B)
- **Utilitários em `src/app/globals.css`** (definidos em 6.3): `ink-link` (sublinhado que cresce via `background-size`, `transition` curta) e `fade-up` (0,4 s, 1 rem) ambos sob `@media (prefers-reduced-motion: no-preference)`; fora disso, estático. Sem `px` (usar `rem`).
- **`YearList` (Server)** `src/components/sections/year-list.tsx`: `ul`/`li` semânticos, grade `grid-cols-[4.5rem_1fr]` no mobile (ano + título; local abaixo) e 12 colunas em `md`; hover/`focus-within` com `bg-muted`. Usado em `/exposicoes` (pergunta 5).
- **Ritmo e leitura:** coluna de texto `max-w-prose` (≈65ch) e `text-base`/`text-lg`, corpo em `font-sans` (Work Sans), `font-heading` (Fraunces) só em títulos curtos, `font-hand` só em acento de uma linha.
- **Skip links** (0004 alternativa 1) — fora desta spec; só sinalizo que o novo layout deve herdá-los se a 0004 for aprovada.
- **Estados:** `loading.tsx` do segmento `(sections)` já existe e é herdado; `error.tsx` do `(home)` já existe (0003); `not-found` para slug inexistente (0012).
- **Responsivo (360/390, 768, 1024, 1280+):** sem mudança de grade global; `YearList` 2 col (≤768) → 12 col (≥768); sem rolagem horizontal; `min-w-0` nos itens.
- **Acessibilidade:** alvos ≥ 2,75rem; foco visível (`ring`); contraste ≥ 4,5:1 em texto normal; links com nome acessível.
- **i18n:** novas chaves `year.*`/`common.back` etc. nas 3 línguas em `src/lib/i18n.ts` (tipo `Messages` falha o build se faltar chave).

### 6.2 Backend / dados
Camada 1: N/A (sem dados). Contato e conteúdo na 0012.

### 6.3 Fontes e tokens (camada 1)
- **Fontes via `next/font/google`** em `src/app/layout.tsx` (substitui Caveat Brush/Inter como `--font-display`/`--font-body`, mantendo os nomes de variável para não tocar componentes): `Fraunces` (`variable: "--font-display"`, subsets latin, `display: "swap"`, variável sem `weight`, eixo opsz opcional; itálico para destaques), `Work_Sans` (`--font-body`), `Caveat` (`--font-hand`, novo utilitário `font-hand`). Em `@theme inline` (`globals.css:7-13`): `--font-heading`/`--font-display` apontam para Fraunces; `--font-hand` novo. Conferir em `font.md` se Fraunces exige `axes`/`style` ao usar itálico (a confirmar na implementação).
- **Cores (valores do protótipo em oklch, sem hex solto):** `--background: oklch(.965 .018 85)` (≈ `--paper` atual 0,963/0,025/87: praticamente igual), `--foreground`/`--ink: oklch(.24 .03 150)` (verde-escuro; hoje `.221 .009 59`, quase-preto neutro), `--primary` terracota, novo token de marca `--color-moss` (`oklch(.52 .08 140)`, 4,81:1 sobre papel), `--accent` e `--secondary` do protótipo. **Manter** `salmon/mustard/purple/teal/coral/navy` (usados por home, newsletter, páginas aprovadas) até a camada 3; só remapear semânticos (`primary`, `ring`, `muted`, `border`). Impacto: botões `primary` hoje tinta passam a terracota (texto claro 4,31:1: **abaixo de 4,5:1 para texto pequeno**; usar texto grande/negrito ≥ 1,125rem em botão ou escurecer `--primary` para ≥ 4,5:1; decidir na implementação com medição).
- **Modo escuro:** `.dark` existe em `globals.css:107-136`; o protótipo não tem tema escuro. Default: manter os valores escuros atuais e só validar contraste (pergunta 5).
- **Raio:** `--radius: 0.75rem` → `0.25rem` muda botões, cards, inputs de todo o site (inclusive dashboard/checkout): listar como efeito colateral na review.
- **Utilitários (CSS, aditivos, em `rem`):** `ink-link`, `fade-up` (sob `prefers-reduced-motion: no-preference`), `torn`, `stitch`, `tape`, `paper-shadow` (reimplementados sem `px`; o protótipo usa `1.5px`/`1px`/`22px`: converter para `rem` ou `0.0625rem`/`calc`), fundo pontilhado em `body` com `background-size` em `rem`. **Não** portar `wobble` e `float-slow` (ou só com `reduced-motion` e sem loop; pergunta 6).

### 6.4 Compatibilidade vinext/Cloudflare (nota curta)
Recursos Next-only usados pelo layout aqui e na 0012: `next/image` (🟡 otimização no vinext; fallback = `unoptimized`/loader), `next/font` (🟡), `metadata`/`generateMetadata` (confirmar), `generateStaticParams` + `notFound()`, Server Actions (✅ listadas), `cookies()` assíncrono (✅). Sem Node-only novo. Rodar `npx vinext check` conforme 0007 passo 0 e registrar.

### 6.5 Segurança
Camada 1: sem input, sem dados. Contato (0012) trata validação, rate limit e anti-abuso.

### 6.6 Pontos de contato com as specs de pagamento (0007–0009, em review; **não alteradas**)
- `/carrinho` e o futuro checkout (Pix/cartão) estão no layout `(public)` antigo (`SiteHeader`, `max-w-5xl`); a página de checkout deve **herdar o layout `(home)`** (header de letreiros, `page-width`, rodapé) quando houver migração do `(public)` — fora desta spec, depende de decisão (pergunta 6).
- Tokens e `ink-link` são aditivos; não mudam cores de botão, erros (0003) nem `loading/error` do checkout.
- Estados de erro do pagamento seguem 0003/0008; nada aqui os substitui.

## 7. Segurança e permissões
Matriz: tudo público, somente leitura (camada 1). Sem actions novas. Sem `dangerouslySetInnerHTML`. Redirects: nenhum.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `YearList` renderiza `ul` com N `li`, ano/título/local, lista vazia → mensagem | componente (Testing Library) | `getAllByRole("listitem")`, estado vazio i18n |
| 2 | `YearList` nas 3 línguas | componente | textos corretos; `Messages` completa (tsc) |
| 3 | `ink-link`/`fade-up` não animam com reduced-motion | CSS: teste que o arquivo contém as regras dentro de `@media (prefers-reduced-motion: no-preference)` | passa; **verificação visual de motion não automatizada** |
| 4 | Regressão: testes existentes de home/menu/sobre | vitest | continuam verdes |
| 5 | Sem rolagem horizontal e axe em 360/768/1280 | Playwright + axe | **Playwright não está instalado**: item explícito de pedido de aprovação (pergunta 7); sem ele, declarar "UI não verificada visualmente" |
Rodar: `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`, `npx next build`.

## 9. Plano de implementação (após aprovação; só camada 1)
1. Resolver perguntas 1–3. 2. Fontes (`next/font`) + tokens + utilitários CSS + teste de tokens/contraste; checar regressão dos testes e do dashboard/loja. 3. `YearList` + chaves i18n + testes. 4. Migrar `/exposicoes`. 5. Capturas 360/768/1280 (Brave headless via iframe, ou Playwright se aprovado). 6. Verificações e relatório.

## 10. Riscos, rollback e dívidas
- **Maior risco:** implementar a linguagem do protótipo por cima do aprovado sem decisão. Mitigação: portão na pergunta 1.
- Conteúdo real/fotos da artista no protótipo: risco de direitos (pergunta 2).
- Capturas do protótipo com `vh` inflado; 360/768 não medidos no protótipo.
- Rollback: camada 1 é reversível por commit, mas muda a aparência global: revisar capturas de loja/blog/dashboard antes do merge.
- Dívidas: Playwright/axe; migração do layout `(public)`; `priority`→`preload` (0006).

## 11. Perguntas em aberto (defaults; sem sim/não bloqueante)
1. **Destino dos ativos do cliente** (letreiros PNG do menu/títulos, ilustrações da home e do Sobre): a camada 3 (home/menu/Sobre/rodapé com o visual do protótipo) **troca** esses ativos por tipografia, ou eles ficam e só o resto adota o visual? **Default: camadas 1 e 2 agora; camada 3 só com resposta explícita (fora da 0011/0012).**
2. **Direitos de conteúdo:** textos reais, fotos e mariposa do protótipo (`src/assets/*`, bio real) podem ir para produção? **Default: não; copiar só o visual e usar conteúdo de exemplo ou os PNGs do cliente já em `src/assets`.**
3. **Camada 1 afeta o site todo** (loja, blog, dashboard, checkout herdam tokens, raio 0,25rem e fontes). Aceito, ou limitar o novo tema às rotas `(home)`? **Default: tema global (um só sistema), com contraste medido.**
4. **Práticas** (Desenho/Cerâmica/Colagem): páginas sem item no menu (não há letreiro PNG para elas)? **Default: sim, links dentro de `/projetos`.**
5. **Exposições** em lista cronológica (`YearList`) e **modo escuro**: manter valores escuros atuais, só validar contraste? **Default: sim para ambos.**
6. **Efeitos `wobble`/`float`:** copiar com `prefers-reduced-motion` e sem loop (hover curto), ou omitir? **Default: hover curto só com `no-preference`; sem loop.**
7. **Playwright + axe** (devDependency) para responsivo/a11y? **Default: sim, como passo explícito; sem aprovação, UI declarada não verificada.**
8. **Loja/blog/carrinho/checkout no layout `(home)`?** **Default: não nesta rodada (sinalizado em 0007–0009).**

## 12. Checklist da review humana
- [ ] Direção B em camadas aceita; destino dos ativos do cliente (P1)
- [ ] Superação parcial de 0001/0005/0006/0010 (5.4) entendida
- [ ] Crítica 1–16 revisada
- [ ] Compat. vinext aceita (6.4)
- [ ] Perguntas 2–8 respondidas ou defaults aceitos

## 13. Registro de aprovação
aprovado com defaults, 2026-10-28 (registrado ao implementar; o humano pediu "pode implementar com o agente fulstack").

## 14. Relatório pós-implementação
Implementado: camadas 1 (tema) e 2 (via 0012). Camada 3 (home, menu, Sobre, rodapé) NÃO feita, como no default.
- **Feito:** Fraunces/Work Sans/Caveat via next/font (`--font-display`, `--font-body`, `--font-caveat`; utilitário `font-hand`); tokens do protótipo em `globals.css` (background, foreground/ink, muted, border, ring, `--moss`, radius 0,25rem; secondary, accent e marcas mantidos); `--primary` terracota escurecido de L 0,58 para 0,52 (5,56:1 com texto claro; 5,32:1 como texto sobre o papel); hover do `Button` default passou a escurecer via color-mix (o `/80` dava ~2,7:1); utilitários `ink-link`, `wobble` (hover curto), `fade-up`, `torn`, `stitch`, `tape`, `paper-shadow` em rem, movimento só sob `prefers-reduced-motion: no-preference`, sem loop, sem `float`; fundo pontilhado; `YearList` em `/exposicoes`; chaves i18n nas 3 línguas.
- **Contraste medido** em `tests/theme.test.ts` (tokens reais): foreground/bg 14,7; primary-fg/primary 5,56; primary/bg 5,32; muted-fg/bg 6,63; moss/bg 4,81; ink/salmon 8,1; ink/mustard 10,1; ring/bg 5,3; escuro mantido (11:1).
- **Desvios:** (1) `text-ink/55` para `/70` no placeholder visual do newsletter (axe `color-contrast` serious em `/` e `/sobre`); (2) `home-feature` `md:flex-none` para `md:flex-initial` (a fonte do corpo mais larga causava rolagem horizontal a 768 na home); (3) `home-footer`: `items-center` na lista (o link Contato com `min-h-11` desalinhava os itens de texto). Ajustes mínimos em componentes da home, necessários por efeito colateral do tema/0012; a home não foi redesenhada.
- **Efeitos colaterais do tema global a revisar:** raio 0,25rem e cores de botão em dashboard/loja/blog/checkout (não capturados visualmente); h1-h3 agora Fraunces com `tracking-tight`.
- **Testes:** `tests/theme.test.ts` (16), YearList e listas em `tests/detail-pages.test.tsx`, e2e Playwright+axe (devDependencies `@playwright/test`, `@axe-core/playwright`; `playwright.config.ts`, `e2e/pages.spec.ts`, script `npm run test:e2e`). Resultados completos na seção 14 da 0012 (mesma execução).
- **Observação:** a referência https://elenalandinez.coest.me (enviada pelo humano durante a implementação) lista "Práticas" como grupo no menu; mantido o default (sem item de menu, chips em /projetos) porque não há letreiro PNG. Só o texto da página foi lido, sem captura visual.
