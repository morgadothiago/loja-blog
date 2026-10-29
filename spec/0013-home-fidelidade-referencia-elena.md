---
id: 0013
title: Home, menu, rodapé e "arte & ativismo" no visual das 4 referências elena-home-ref-1..4 (camada 3 da 0011)
status: implemented
layers: [front]
owner: Thiago Morgado
created: 2026-10-28
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("aprovada, implemente a 0013 com os defaults")
approved_at: 2026-10-28
---

# 0013 — Home no visual das referências `elena-home-ref-1..4`

Nada de código foi escrito. Esta spec fecha a **camada 3 da 0011** (home, menu, rodapé) e responde a P1 da 0011: o humano afirmou que `spec/references/elena-home-ref-1.png … ref-4.png` são "a referência da tela home do projeto". Logo, a home **passa a seguir essas imagens**, não o carrossel da baleia (0001/0006).

## 1. Contexto e problema
- A home atual (`spec/references/loja-blog-atual.png`) ainda é a da 0006: hero em `bg-secondary` com a baleia cinza, título em caixa-alta "BEM-VINDO a um MAR de ENCONTROS" centralizado, subtítulo roxo, banner turquesa de exemplo, hambúrguer em PNG, rodapé legal em microtexto. As páginas internas (0011/0012) já usam o tema do protótipo (Fraunces, Caveat, papel pontilhado, terracota), então a home **destoa do resto do site e das referências**.
- Referências (lidas com a ferramenta de imagem, as 4 + `loja-blog-atual.png`, `elena-site-referencia.png`, `elena-proto-home-mobile.png`):
  - `ref-1`: topo da home, 1666 px de largura de captura.
  - `ref-2`: banner largo do mural MOTH + legenda.
  - `ref-3`: "Histórias recentes" + 3 cards.
  - `ref-4`: "arte & ativismo" (retrato em colagem) + rodapé.
  - `elena-site-referencia.png` é o **site atual do cliente (Wix)**: só contexto de conteúdo (menu SOBRE/PROJETOS/EXPOSIÇÕES/RESIDÊNCIAS e FESTIVAIS/SHOP*/MAIS/PT-EN, "Bem vinde / Navegue Sinta Olhe / Contemple", "arte é vida"). Não é alvo visual.
- Fato: as refs vêm do protótipo `/Users/thiagomorgado/Desktop/elena-landinez-studio` (`src/routes/index.tsx`, `SiteShell.tsx`, `styles.css`), que continua somente leitura. O código do protótipo é a **fonte de medidas**; as imagens são a fonte de verdade visual.
- Fato (verificado): o protótipo carrega Fraunces com o eixo **`opsz` 9..144** (`__root.tsx:90`) e pesos 300/400 + itálico 300; Caveat 500; Work Sans 400/500. O projeto carrega Fraunces **sem `axes`** (`src/app/layout.tsx:14-19`). Pela doc local (`font.md`, seção `axes`: "By default, only the font weight is included"), o corte de display (hastes finas, alto contraste do título gigante de `ref-1`) **não existe hoje no projeto**. É uma causa provável da divergência de "peso/contraste" do título.

## 2. Objetivos e não-objetivos
**Objetivos**
- Home com as 4 seções das refs: (1) topo "bem-vindo — / um mar de *encontros* / Navegar Sentir Olhar Contemplar" + mural MOTH inclinado com mariposa; (2) banner largo do mural com legenda; (3) "Histórias *recentes*" + 3 cards; (4) "arte & ativismo" + retrato em colagem + link; (5) rodapé "arte é vida · Instagram · Facebook · © ano".
- Header no padrão das refs: logo à esquerda e palavra **"menu"** manuscrita terracota à direita (sem hambúrguer), com foco preso, `Esc`, `aria-expanded`.
- Textos exatos das refs em pt-BR + en + es (os do protótipo já existem nas 3 línguas, `src/lib/i18n.ts` do protótipo, linhas 33-84).
- Testes de componente, e2e/axe nas 4 larguras e **comparação visual por captura** (seção 8).

**Não-objetivos**
- Páginas internas (Sobre, Projetos, Exposições, Residências, Shop, Livros, Contato, "Mais"): não mudam aqui; ver pergunta 8.
- Backend, banco, newsletter (action/Zod), pagamentos (0007–0009), carrinho/login (apenas preservar o acesso).
- Reutilizar o código Lovable/TanStack/Vite do protótipo. Copiar só o visual (decisão 0011).

## 3. Estado atual do código
| Arquivo | Papel hoje | Destino nesta spec |
|---|---|---|
| `src/app/(home)/page.tsx:1-20` | Hero, Banner, RecentStories, Feature, NewsletterBand; `force-dynamic` | recompor (seção 6.1) |
| `src/app/(home)/layout.tsx` | `HomeHeader` + main + `HomeFooter`, sem contêiner | mantém; muda o conteúdo do header/rodapé |
| `src/components/home/home-header.tsx:15-50` | `AppHeader` `overlayOnly`, logo `brightness-0`, hambúrguer PNG (`MENU_HAMBURGER_IMAGE`), letreiros PNG no overlay, idioma + carrinho no cabeçalho do painel | trocar gatilho; manter overlay |
| `src/components/header/app-header.tsx:60-211` | Sheet base-ui (foco preso, Esc, aria-modal do base-ui). `sticky` + `useSolidAfter(solidAfterId)`: bege (`bg-secondary`) no hero, `bg-card` + sombra depois | gatilho texto "menu"; cores do estado topo/rolado; sem hambúrguer |
| `src/components/home/home-hero.tsx` | baleia 11:6 centralizada + h1 caixa-alta + subtítulo roxo | **substituir** por `HomeIntro` |
| `src/components/home/home-banner.tsx` | faixa 2:1/3:1 com legenda `text-xs` | reaproveitar estrutura; novo asset e legenda |
| `src/components/home/recent-stories.tsx`, `story-card.tsx` | 3 colunas fixas desde 360px, aspectos/offsets diferentes, meta `text-xs`, título `font-sans` | rever: layout e tipografia das refs |
| `src/components/home/home-feature.tsx` | arte `Characters_2` 1/3 + texto | **substituir** por `HomeActivism` (retrato em colagem) |
| `src/components/home/newsletter-band.tsx`, `newsletter-form.tsx` | faixa mostarda (0001/0006, "não alterar") | **decisão do humano** (seção 5.2 / pergunta 3) |
| `src/components/home/home-footer.tsx:1-52` | faixa legal `text-xs uppercase`: © + Termos/Privacidade/Cookies/Contato + "Site por" | **substituir** layout conforme `ref-4` |
| `src/components/home/social-links.tsx`, `placeholder-art.tsx`, `home-image.tsx`, `home-carousel.tsx` | ícones PNG, placeholders, slot de imagem, carrossel (testado, não renderizado) | `home-image` reaproveita; `placeholder-art` segue como fallback; `home-carousel` fica (fora de uso) |
| `src/lib/home-images.ts`, `src/lib/home-data.ts`, `src/lib/site.ts`, `src/lib/nav.ts`, `src/lib/i18n.ts` | slots de imagem, posts recentes, `SITE.social` vazio, itens de menu, dicionários | estendidos (6.1/6.2) |
| `src/app/globals.css:155-290` | tokens do tema, `font-hand`, `ink-link`, `wobble`, `fade-up`, `torn`, `paper-shadow`, `stitch`, `tape` (spec 0011, já em rem, movimento só com `no-preference`) | **tudo já existe**; só entra `float-slow` opcional (ver crítica #6) |
| `e2e/pages.spec.ts`, `playwright.config.ts` | 4 viewports, axe, sem rolagem horizontal, `SHOTS_DIR`; `next start` na porta 3100 | estender com `/` mais rigoroso e captura comparada |

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` | Next 16.4.3 | `sizes` gera `srcset` completo; `fill` sem `sizes` assume `100vw`; `qualities` restringe `quality` (projeto: `[75, 85]`, `next.config.ts:7`); import estático de jpg/png/webp/avif ganha `blurDataURL` automático; `loading="lazy"` é o padrão | **Sim:** `priority` está **deprecado** no Next 16 em favor de `preload` (`image.md`, "Starting with Next.js 16, the `priority` property has been deprecated"); a doc recomenda `loading="eager"` ou `fetchPriority="high"` na maioria dos casos. O `HomeImage` atual já usa `fetchPriority`; **não** usar `priority`. |
| `.../02-components/font.md` (seção `axes`) | 16.4.3 | Por padrão só o eixo de peso é incluído; eixos extras (ex.: `opsz`) vão em `axes: [...]` | **Sim, relevante:** sem `axes: ["opsz"]` o Fraunces do projeto não tem o corte de display do protótipo (item 1 da seção 1). |
| `.../02-components/link.md` | 16.4.3 | `<Link>` é o caminho para navegação interna; links externos são `<a rel="noopener noreferrer">` | Não |
| `src/components/ui/sheet.tsx` + `tests/app-header.test.tsx` | base-ui instalado | Sheet já entrega foco preso, `Esc`, `aria-modal`; botão de fechar e título já têm nome acessível | Não (confirmado nos testes existentes) |
| Protótipo `src/routes/index.tsx`, `SiteShell.tsx`, `styles.css`, `src/lib/i18n.ts` | local, somente leitura | medidas, classes, textos pt/en/es | Divergência: o protótipo usa `min-h-screen`, `h-[50vh]` e `float-slow` em loop infinito (críticas 3, 5, 6) |

Não consultei docs externas além das locais: nenhuma API nova de Next/Prisma/Auth é necessária.

## 5. Alternativas

### 5.1 Como construir a home
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | Manter a home atual e só retocar cores/fonte | menor diff | **não atende**: o humano disse que não seguiu as telas; título, mural, cards, colagem, rodapé e "menu" divergem | baixo, mas reprova | nenhum |
| B | **Recompor a home em Server Components pequenos** (`HomeIntro`, `HomeBanner`, `RecentStories`/`StoryCard` ajustados, `HomeActivism`, `HomeFooter` novo, trocar só o gatilho do `AppHeader`), reusando `font-hand`, `torn`, `stitch`, `tape`, `paper-shadow`, `wobble`, `ink-link` já existentes | fiel às refs, reusa tokens/utilitários já medidos na 0011, SSR, imagens otimizadas pelo `next/image`, nenhuma dependência nova | mexe em 5-6 componentes e em testes que cravam a estrutura antiga | médio | bundle: só ganha JS no gatilho do menu (já é client); +imagens |
| C | Portar o `index.tsx` do protótipo "como está" | rápido | traz `min-h-screen`/`h-[50vh]`/`<img>` crua/loop de animação, sem otimização, sem i18n do projeto, ignora críticas | alto retrabalho | LCP pior, a11y pior |

**Recomendação: B.** Rejeitadas: A (não atende o pedido), C (importa os defeitos do protótipo e quebra convenções do projeto).

### 5.2 O que fazer com o menu overlay de letreiros PNG, newsletter e rodapé legal (conflito com specs aprovadas)
| Item | Spec que aprovou | O que a nova home supera | O que se mantém | Recomendação (humano decide) |
|---|---|---|---|---|
| Gatilho do menu = hambúrguer PNG `Menulistras.png` | 0001 (#7), 0005 | `ref-1` mostra a **palavra "menu"** em Caveat terracota, sem ícone | overlay lateral, foco preso/Esc/aria, idioma + carrinho no cabeçalho do painel | **Superar**: gatilho vira texto "menu"; o PNG fica no repositório (não apagar, pergunta 7) |
| Itens do overlay em **letreiros PNG** do cliente (`src/assets/Menu/*`, 3 idiomas) | 0001, 0005 | O protótipo usa texto em Fraunces `text-4xl` com sublista "Práticas" (Desenho/Cerâmica/Colagem) e idioma/redes no pé; **as refs não mostram o menu aberto** | os 7 destinos atuais (Sobre, Projetos, Exposições, Festivais & Residências, Livros, Notícias, Shop) + login/carrinho que o protótipo **não tem** | **Manter os letreiros** (arte do cliente, aprovada) e **adicionar** a sublista Práticas (rotas da 0012 já existem). Alternativa: trocar por texto Fraunces (consistente com o resto, melhor SEO/tradução, perde a arte). Pergunta 2 |
| Hero com baleia + carrossel | 0001, 0006 (D1) | `ref-1` é o mural, não a baleia | `home-carousel.tsx` e a arte `Whale.png` seguem no código (Sobre usa `Whale.png`, `ABOUT.whale`) | **Superar** na home; `Whale.png` permanece na Sobre |
| Banner turquesa de exemplo | 0006 | `ref-2` = mural MOTH real, legenda real | slot `HOME_IMAGES.banner` | **Superar** com o mural |
| Destaque `Characters_2` + texto | 0001/0006 | `ref-4` = retrato em colagem | texto "Imaginar outros futuros…" (já é o mesmo texto) | **Superar** o visual; reaproveitar chaves i18n |
| **Newsletter mostarda** | 0001, 0006 ("não alterar"), 0010 | **As refs e o protótipo não têm newsletter** | action, Zod, honeypot, rate limit e testes (`tests/newsletter-*.test.tsx`) | **Manter, mas depois do bloco "arte & ativismo" e antes do rodapé** (a `ref-4` mostra o rodapé logo após o bloco; a faixa mostarda é o único elemento fora das refs). Alternativa: tirar da home e deixar só em `/contato`/rodapé. Pergunta 3 |
| Rodapé legal (Termos/Privacidade/Cookies/Contato/Gerenciar cookies, "Site por") | 0006 (D9) | `ref-4` mostra `arte é vida` · Instagram · Facebook · © | os links legais **ainda não têm página** (`SITE.footerLinks` sem `href`, só "Contato" tem) | **Superar** o layout; **manter** os links legais que tiverem `href` (hoje só Contato) como linha discreta com alvo ≥2,75rem (pergunta 4) |
| Cabeçalho sticky bege→claro (0001/0006) | 0001, 0006 | refs: header transparente sobre o papel pontilhado | `sticky` (útil no mobile) | Header **transparente no topo**; ao rolar fica `bg-background` com borda (reusa `useSolidAfter`). Alternativa: estático como o protótipo |

### 5.3 Assets
| # | Opção | Prós | Contras | Risco |
|---|---|---|---|---|
| A | **Copiar de `elena-landinez-studio/src/assets` para `src/assets/Home/`** (import estático = dimensões reais + `blurDataURL`; `next/image` converte para webp/avif) | já é o que as refs mostram; zero rede; padrão do projeto (`src/assets/About`, `Menu`) | ~3,7 MB de originais no repo; **direitos** (pergunta 1) | direitos/LFS |
| B | Subir para o Azure Blob e referenciar por URL | repo leve, trocável pelo painel | exige upload manual, `remotePatterns` já cobre `*.blob.core.windows.net`, sem blur automático | dependência de infra |
| C | Placeholders (`placeholder-art`) até o cliente enviar os arquivos | sem risco de direitos | home não fica igual às refs | reprova o pedido |

**Recomendação: A** (cópia, não referência ao caminho do protótipo), **condicionada à confirmação de direitos** (pergunta 1). Se o humano não confirmar, o código sobe com C e os arquivos entram depois sem mudar componente (os slots já aceitam `src` opcional).

| Elemento | Origem (protótipo) | Dimensão | Destino proposto | Observação |
|---|---|---|---|---|
| Mural (cartão do topo, `ref-1`) | `assets/work/moth-mural-detail.jpg` | 1400×1700 | `src/assets/Home/moth-mural-detail.jpg` | retrato 4:5; `sizes` ≈ 41vw em ≥768 |
| Mural largo (`ref-2`) | `assets/work/moth-mural-wide.jpg` | 1400×700 (2:1) | `src/assets/Home/moth-mural-wide.jpg` | em 1280+ a imagem é exibida ~1590 px de largura de captura: **só 1400 px de origem → fica levemente suave em telas 2x**; pedir original maior (pergunta 5) |
| Card 1 | `moth-mural-1.jpg` (a ref mostra o mural com a placa "MORE THAN HUMAN RIGHTS MURAL") | 1400×990 | `src/assets/Home/moth-mural-1.jpg` | **conferir qual arquivo é** (`moth-mural-1` ou `-2`): na implementação, compará-los com `ref-3` |
| Card 2 "Mother Other" | `mother-other-2.jpg` (1400×1400) ou `-1` (1400×790) | | `src/assets/Home/mother-other.jpg` | a ref mostra o livro sobre fundo cinza, quadrado |
| Card 3 "Song of the Cedars" | `cedars-cover.jpg` | 1400×1400 | `src/assets/Home/cedars-cover.jpg` | |
| Retrato (`ref-4`) | `elena-portrait.jpg` | **379×592** | `src/assets/Home/elena-portrait.jpg` | **baixa resolução**: exibido a ~420 CSS px em desktop, ~1,1x; em tela 2x fica mole. Pedir original (pergunta 5). Alternativa já no repo: `src/assets/About/Foto_ppal.jpg` (outra foto, não é a da ref) |
| Mariposa | `assets/moth.png` (816×816 RGBA, 904 KB) | | `src/assets/Home/moth.png` | PNG com alfa é pesado: o `next/image` entrega webp/avif; **não** reencodar à mão. Usada 3x (topo, retrato, fim da seção de histórias) |
| Logo | usar o atual `src/assets/About/Elena_landinez.png` (747×225, branco + `brightness-0`) | | — | o do protótipo (`logo.png` 610×133) tem outro recorte; **não copiar**, a menos que o humano prefira (pergunta 6) |

Todas as imagens decorativas ficam com `alt=""`; as de conteúdo (mural, capas, retrato) têm `alt` descritivo i18n (seção 6.1).

## 6. Design proposto

### 6.0 Referências e direção visual
- **Referências:** `spec/references/elena-home-ref-1.png` … `ref-4.png` (alvo); `elena-proto-home-desktop.png`, `elena-proto-home-mobile.png`, `elena-proto-sobre-mobile.png`, `elena-proto-residencias-desktop.png` (comportamento); `loja-blog-atual.png` (estado atual, a corrigir); `elena-site-referencia.png` (contexto).
- **Intenção:** portfólio **editorial e artesanal** de artista visual ativista: papel pontilhado, tinta quase preta, musgo e terracota, escala tipográfica muito grande no topo, colagem de papel rasgado e uma mariposa "colada" como assinatura. Calmo, lento, sem apelo de conversão (a loja é secundária).
- **Sistema extraído** (o que já existe pós-0011 está marcado "existe"):
  - **Fundo:** papel `bg-background` + pontilhado do `body` (existe). Sem faixas de cor cheia na home (diferente da 0001: nenhuma seção em salmão/mostarda nas 4 refs, só a newsletter se mantida).
  - **Texto:** `text-foreground` (tinta, `oklch(0.24 0.03 150)`); musgo `text-moss` (existe, 4,81:1) para o itálico "encontros"; terracota `text-primary` (existe; 5,32:1 sobre o papel, medido em `tests/theme.test.ts`) para "menu", "bem-vindo —", "recentes", "arte & ativismo"; secundário `text-muted-foreground` para meta/legenda.
  - **Tipografia:** display = Fraunces (`font-heading`); acento manuscrito = Caveat (`font-hand`), **uma linha por vez**; corpo/meta = Work Sans. Escala observada no protótipo (referência de tamanho; implementar com clamp em rem/vw, sem `px`): h1 `5xl/6xl` no mobile e `min(8.5rem, 9vw, 13vh)` em `md+`, `leading-[0.9]`; manuscrita 2xl→3xl; h2 4xl→6xl; título do card 2xl; frase "arte & ativismo" 3xl→4xl `leading-snug`; meta `text-xs uppercase tracking-widest`.
  - **Ritmo:** hero com `pt` baixo e `pb-16`; seções separadas por `mt-28`/`mt-32` no protótipo (≈7-8rem). Margens laterais `px-6 md:px-10` no protótipo vs. `page-width` (`px-5`, teto 90rem) do projeto: **manter `page-width`** (regra única do site, 0006).
  - **Grade:** hero 12 col (7/5) em `md+`; cards 3 colunas em `md+` com o do meio descido `md:mt-16`; ativismo 2 colunas.
  - **Imagem:** mural inclinado `rotate-2` + `shadow-xl`; banner largo sangrado na margem do conteúdo; cards quadrados com `wobble` no hover (rotação −1,5° e escala 1,02, **só** com `prefers-reduced-motion: no-preference`, já assim em `globals.css`); retrato com 2 "papéis rasgados" (`torn`) verde-musgo/bege, costura tracejada terracota (`stitch`), 2 fitas (`tape`), etiqueta manuscrita "Elena" inclinada e a mariposa no canto.
  - **Bordas/raios:** `--radius: 0.25rem`; quase nada arredondado (recortes irregulares fazem o papel).
- **Padrões de layout → componentes:** ver árvore em 6.1 e inventário abaixo.
- **O que NÃO copiar:** `float-slow` em **loop infinito** (viola WCAG 2.2.2 e 2.3.3; ver crítica #6), `<img>` sem `width/height/sizes`, altura `h-[50vh]` do banner (crítica #5), `min-h-screen`, `aria-hidden` no `<aside>` do menu controlado só por classe (o Sheet do projeto já faz certo), `localStorage` de idioma, ícone/label do menu como botão `div` sem foco preso. **Ilustrações e fotos do mural, do livro, da capa do álbum e do retrato são obra/imagem de terceiros até o humano confirmar os direitos** (pergunta 1).

#### Inventário seção por seção (medidas relativas da captura)
Medidas lidas das capturas (largura de captura ≈1666 px; valores como fração da largura para virar `rem`/`cqw`/`vw`, nunca `px`).

**Seção 1: topo/hero (`ref-1`)**
| Elemento | Observado | Implementação |
|---|---|---|
| Header | logo à esquerda (largura ≈15% da captura; altura ≈ 3,5rem em 1280), "menu" à direita (Caveat, ≈ `text-4xl`), sem borda, fundo = papel | `AppHeader` com `bg-transparent` no topo; logo `Image` `brightness-0`, `h-10 md:h-14` (como hoje); gatilho = texto |
| Eyebrow | "bem-vindo —" Caveat terracota ≈ `text-3xl`, à esquerda, a ≈ 38% da altura da captura | `<p class="font-hand text-primary text-2xl md:text-3xl">` |
| Título | "um mar de" tinta + quebra + "encontros" **itálico musgo**; ≈ 9% da largura por linha de altura; tracking apertado (`-0.02em`, já em `h1,h2,h3`); `leading-[0.9]`; ocupa ≈ 32% da largura da captura | `h1` com `<br/>`/`block` + `<em class="text-moss">`; `text-[clamp(3rem,9vw,8.5rem)]`; **uma `h1` só** (as duas linhas), `text-balance` desnecessário |
| Palavras | "Navegar Sentir Olhar Contemplar" Caveat tinta suave (`text-muted-foreground`), 4 itens em linha, `gap-x-5`, ≈ `text-3xl` | `<ul>` de 4 `<li>` (semântica de lista), com `fade-up` escalonado (0,15 s) só com motion permitido |
| Mural (cartão) | retrato 4:5, ocupa ≈ 38% da largura, **rotação ≈ +2°**, sombra suave inferior/esquerda; encostado à direita e ligeiramente abaixo do eixo | `Image` `rotate-2 paper-shadow`/`shadow-xl`; `md:col-span-5` |
| Mariposa | ≈ 12% da largura da captura, no canto superior esquerdo do cartão, **sobrepondo a borda** (metade para fora) | `Image` decorativa `absolute -top-24 -left-10 w-56` em md+; mobile `-top-12 -right-2 w-24` (como no protótipo) |
| Fundo | papel + pontilhado | herdado do `body` |
| Hover | "menu": `wobble`; cartão sem hover | — |

**Seção 2: banner (`ref-2`)**
| Elemento | Observado | Implementação |
|---|---|---|
| Imagem | larga, proporção ≈ 2,5:1 em 1280+ (≈1590×640 na captura), margens laterais ≈ 3% | `aspect-[2/1] md:aspect-[5/2]` + `object-cover`, dentro de `page-width`; **não** `h-[50vh]` |
| Legenda | "Mural MOTH · Design Museum, Londres, 2025", abaixo, Work Sans pequena, `text-muted-foreground` | `<figcaption class="text-xs">` mínimo (≥0,75rem) com contraste ≥4,5:1 (token existe: ≈ 6:1) |
| Estados | imagem ausente → `placeholder-art` "banner" | reuso de `HomeImage` |

**Seção 3: Histórias recentes (`ref-3`)**
| Elemento | Observado | Implementação |
|---|---|---|
| Título | "Histórias" Fraunces ≈ `text-6xl` + "*recentes*" Caveat terracota na mesma linha, baseline alinhada | `h2` com `<span class="font-hand text-primary">`; fonte da palavra manuscrita contida na linha (sem quebra feia no mobile) |
| Link | "Todos os projetos →" à direita, `text-sm`, `ink-link` | `Link` p/ `/projetos` com `min-h-11` e `ink-link` |
| Cards | 3 colunas; cartão 1 com **leve rotação** (aprox. −1,5°); card 2 **descido** ≈ 4rem; card 3 alinhado ao topo; imagens quadradas | `StoryCard` com `aspect-square`; offsets `md:mt-16` no 2º; rotação só no 1º/3º com `motion-safe`; wobble no hover |
| Meta | `DESIGN MUSEUM, LONDRES · 2025` caixa-alta, `tracking-widest`, ≈0,7rem | `text-xs` (0,75rem) `uppercase tracking-widest text-muted-foreground`; **não** menor (0006 #3) |
| Título do card | Fraunces ≈ `text-2xl`, tinta | `h3` em `font-heading` (hoje é `font-sans`: **muda**) |
| Cauda | no fim da seção aparece papel rasgado verde + a mariposa subindo | `torn` verde + `moth` decorativa, `aria-hidden`; **decisão estética**: ver crítica #7 |

**Seção 4: arte & ativismo (`ref-4`)**
| Elemento | Observado | Implementação |
|---|---|---|
| Retrato | moldura de colagem: papel verde-claro `-rotate-3`, papel bege `rotate-2`, costura tracejada terracota, fita rosa à esquerda, etiqueta "Elena" (Caveat) no canto inferior direito, mariposa no canto superior direito | `HomeActivism` (Server) com 4 spans decorativos `aria-hidden` (`torn`, `stitch`, `tape`), `Image` `torn paper-shadow -rotate-1`; a **etiqueta é texto visível** ("Elena") dentro de `figcaption` |
| Texto | eyebrow "arte & ativismo" Caveat terracota `text-3xl`; frase Fraunces `text-3xl md:text-4xl leading-snug`, ≈ 45 caracteres por linha; link "Sobre a Elena →" `ink-link` | chaves i18n reaproveitadas de `home.feature.*` (texto idêntico) |
| Grade | 2 colunas iguais, retrato à esquerda (largura ≈ 26% da captura), texto à direita centralizado na vertical | `md:grid-cols-2 gap-12 md:gap-16 items-center` |

**Seção 5: rodapé (`ref-4`, parte inferior)**
Borda superior fina (`border-t`, `border-border`); 3 colunas em `md+`: "arte é vida" Caveat tinta à esquerda; "Instagram  Facebook" centro (Work Sans, `text-sm`, `text-muted-foreground`, `ink-link`); "© 2026 Elena Landinez" à direita. Mobile: empilhado, alvos ≥2,75rem.

### 6.1 Frontend
**Árvore (S = Server, C = Client):**
```
(home)/layout.tsx                       S  (inalterado)
 ├─ HomeHeader                          S  (passa `triggerLabel` texto; mantém idioma+carrinho+overlay)
 │   └─ AppHeader                       C  gatilho vira texto "menu" (Caveat, text-primary, ≥2,75rem de alvo)
 ├─ <main>
 │   └─ HomePage (page.tsx)             S  force-dynamic (posts recentes)
 │       ├─ HomeIntro                   S  NOVO (substitui HomeHero): eyebrow, h1, lista de 4 palavras, cartão + mariposa
 │       ├─ HomeBanner                  S  ajustado (mural largo + legenda)
 │       ├─ RecentStories               S  ajustado (título com acento manuscrito, link, grade)
 │       │   └─ StoryCard               S  ajustado (aspect-square, h3 serifa, offsets/rotação)
 │       ├─ HomeActivism                S  NOVO (substitui HomeFeature)
 │       └─ NewsletterBand              S/C  mantida (decisão 3)
 └─ HomeFooter                          S  reescrito
```
Reuso de `src/components/ui`: `buttonVariants` (não usado: não há botões novos), `Sheet` (já). **Sem componente novo de UI e sem dependência nova.**

**Mudanças de dados (tipadas, sem banco):**
- `src/lib/home-images.ts`: novos slots `introMural`, `bannerMural`, `stories[0..2]` (capas de reserva), `portrait`, `moth`; slots antigos `heroCarousel`/`feature` ficam até a revisão (o `home-carousel.tsx` e seus testes continuam; remover só se o humano pedir).
- `src/lib/site.ts`: `SITE.social` passa a ter `instagram: "https://www.instagram.com/elena_landinez"` e `facebook: "http://www.facebook.com/elenalandinez"` **vindos do protótipo; confirmar com o humano antes** (pergunta 4: hoje está vazio de propósito, "sem link morto"); `SITE.name` é "Loja & Blog" no repo: o © do rodapé da ref diz "Elena Landinez" → pergunta 6.
- `src/lib/home-data.ts`: sem mudança (posts reais vencem os exemplos; quando não houver post, o fallback são **os 3 projetos reais do protótipo** como "exemplos curados"): ver 6.2.
- Rotas: `/` (inalterada); `loading.tsx`/`error.tsx` já existem no segmento `(home)`. Estado vazio dos cards = exemplos; imagem ausente = `PlaceholderArt`.

**Estados:** loading (Server Component, sem spinner; imagens com `blurDataURL` automático), erro (`(home)/error.tsx` existente), vazio (3 cards-exemplo apontando para `/projetos`), sucesso.

**Tema:** só tokens (`bg-background`, `text-foreground`, `text-primary`, `text-moss`, `text-muted-foreground`, `border-border`) e utilitários existentes. As cores dos papéis rasgados da colagem (verde-claro, bege): **usar `bg-moss/30` e `bg-secondary`** (o protótipo usa `bg-accent/80` + `bg-secondary`; o `--accent` do projeto é mostarda, então **não** usar `bg-accent` aqui). Nada de hex.

**Mensagens i18n (chaves novas; pt-BR / en / es, texto do protótipo):**
| Chave | pt-BR | en | es |
|---|---|---|---|
| `home.welcome` | bem-vindo — | welcome — | bienvenido — |
| `home.heroA` / `home.heroB` | um mar de / encontros | a sea of / encounters | un mar de / encuentros |
| `home.words` (4 chaves `home.word.1..4`) | Navegar, Sentir, Olhar, Contemplar | Navigate, Feel, Look, Contemplate | Navegar, Sentir, Mirar, Contemplar |
| `home.mural.alt` / `home.banner.alt` | Detalhe do mural MOTH… / The More-Than-Human Rights Mural no Design Museum, Londres | (en) | (es) — **redigir os `alt` descritivos**, o protótipo só tem os de EN |
| `home.banner.caption` | Mural MOTH · Design Museum, Londres, 2025 | MOTH Mural · Design Museum, London, 2025 | Mural MOTH · Design Museum, Londres, 2025 |
| `home.stories.title` + `home.stories.title.hand` | Histórias + recentes | Recent + stories | Historias + recientes (texto, depois manuscrito) |
| `home.stories.all` | Todos os projetos → | All projects → | Todos los proyectos → |
| `home.feature.label` (já existe, vira "arte & ativismo") | arte & ativismo | art & activism | arte y activismo |
| `home.feature.text` (existe, texto igual) | Imaginar outros futuros possíveis através das imagens — para rios, florestas e todas as vidas mais-que-humanas com quem dividimos o mundo. | Imagining other possible futures through images — for rivers, forests and all the more-than-human lives we share the world with. | Imaginar otros futuros posibles a través de las imágenes — para ríos, bosques y todas las vidas más-que-humanas con quienes compartimos el mundo. |
| `home.feature.link` | Sobre a Elena → | About Elena → | Sobre Elena → |
| `home.portrait.alt` / `home.portrait.tag` | Retrato de Elena Landinez… / Elena | | |
| `footer.tagline` | arte é vida | arte é vida (default: slogan não traduzido, pergunta 9) | arte é vida (idem) |
| `menu.label` (texto do gatilho) | menu | menu | menú |
| `footer.instagram` / `footer.facebook` | Instagram / Facebook | idem | idem |
- Textos de card (título/meta de projetos reais: "The More-Than-Human Rights Mural", "Mother Other", "Song of the Cedars") são **nomes próprios de obras, não traduzidos**; só o "local" é traduzido ("Design Museum, Londres" / "London"). Entram em `src/lib/content` (arquivo tipado), não no dicionário.
- Em en/es a ordem muda ("Recent *stories*": a palavra manuscrita é a segunda; em es "Historias *recientes*", igual ao pt). Por isso título e acento são **duas chaves** e o dicionário de en usa `home.stories.title` = "Recent" + `home.stories.title.hand` = "stories": a ordem visual (texto, depois manuscrito) é a mesma nos 3 idiomas, sem prop nova.

**Comportamento responsivo (todas as unidades em rem/%/vw/cqw; zero `px`):**
| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Header | logo `h-10` + "menu" `text-3xl`, ≥2,75rem de alvo, header ≈ 3,6rem; sticky com fundo ao rolar | igual, `text-4xl` | igual | igual; logo `h-14` |
| Topo | **1 coluna**: eyebrow, h1 `clamp(3rem,...)` em 2 linhas, 4 palavras em 2 linhas (flex-wrap), cartão do mural abaixo (largura ≤26rem centrada, mariposa `w-24` no canto sup. direito) | 1 col, h1 maior; cartão abaixo à direita | **2 col 7/5**: texto à esquerda, cartão à direita com a mariposa `-left-10` | idem, h1 até 8,5rem, cartão com altura `min(72vh, 47.5rem)` |
| Banner | `aspect-[2/1]` largura total do `page-width`, legenda abaixo (≥0,75rem) | `aspect-[5/2]` | idem | idem, teto 90rem |
| Histórias | título `text-4xl` com "recentes" na linha seguinte; link "Todos os projetos →" sob o título (≥2,75rem); **cards em 1 coluna** | 3 colunas se couber (`md:grid-cols-3`), 2º card descido | idem | idem |
| Ativismo | retrato (≤17.5rem) com colagem **dentro** da margem (`-inset-*` menores), texto abaixo | 2 col | 2 col | 2 col, retrato ≤26rem |
| Newsletter | existente | existente | existente | existente |
| Rodapé | empilhado: tagline, redes (alvos 2,75rem), ©; `border-t` | 3 colunas | 3 colunas | 3 colunas |

**Divergência deliberada das refs:** em 360 as refs/protótipo mostram os 3 cards em coluna única (o protótipo `md:grid-cols-3`), enquanto a home atual usa 3 colunas desde 360 (0006 "como na referência"). A `ref-3` é desktop: **recomendo 1 coluna no mobile** (cards de ~0,3 da largura ficam ilegíveis com título serifa). Humano decide (pergunta 10).

**Esboço (1280):**
```
[Elena Landinez]                                                    menu
                                                         (mariposa) ┌──────────────┐
 bem-vindo —                                               ╱│  mural MOTH   │ (rot. 2°, sombra)
 um mar de                                                  │  4:5          │
 encontros   (itálico musgo)                                └──────────────┘
 Navegar  Sentir  Olhar  Contemplar
[────────── banner mural 5:2 ──────────────────────────────────────────────]
 Mural MOTH · Design Museum, Londres, 2025
 Histórias recentes                                          Todos os projetos →
 [card 1 rot.]   [card 2 descido]   [card 3]
 [colagem retrato (mariposa)]   arte & ativismo / frase grande / Sobre a Elena →
 [newsletter mostarda (se mantida)]
 arte é vida          Instagram  Facebook          © 2026 Elena Landinez
```
**Esboço (360):**
```
[Elena Landinez]      menu
 bem-vindo —
 um mar de
 encontros
 Navegar Sentir
 Olhar Contemplar
        (mariposa)┌────────┐
          │ mural  │
          └────────┘
[ banner 2:1 ]  legenda
 Histórias
 recentes      Todos os projetos →
 [card]  [card]  [card]  (1 col)
 [retrato em colagem]   texto   link
 arte é vida · Instagram · Facebook · ©
```

**Menu "menu" (gatilho e overlay):**
- Gatilho: `SheetTrigger` renderizando `<Button variant="ghost">` com **texto visível "menu"** (`font-hand text-primary text-3xl md:text-4xl`), `min-h-11 min-w-11`, `aria-expanded` (o base-ui expõe; confirmar em teste), `aria-haspopup="dialog"`. O nome acessível é o próprio texto "menu" (remover o `aria-label` redundante "Abrir menu" ou manter `aria-label` = "Abrir menu"? **Regra WCAG 2.5.3 (Label in Name):** o nome acessível deve conter o texto visível, então manter "Abrir menu" contém "menu": ok). `wobble` no hover (movimento reduzido respeitado em `globals.css`).
- Overlay: **inalterado** (Sheet base-ui: foco preso, `Esc`, `aria-modal`, retorno do foco; `overlayClassName="bg-ink/40"`; painel `w-full` ate sm e `max-w-md`). Sem `aside aria-hidden` manual. Incluir sublista "Práticas" (3 links da 0012) como decisão 2.
- Corpo da página rola por trás? O Sheet do projeto já bloqueia o scroll do corpo (a conferir no teste e2e: abrir menu e verificar `overflow` do `body`).

**Acessibilidade (checklist):**
- Contraste (tokens medidos na 0011): tinta/papel ≈ 14:1; musgo 4,81:1 (itálico gigante, ≥3:1 exigido, ok); terracota 5,32:1 (texto Caveat em 1,5–1,875rem: é "texto grande" só a partir de ≈1,5rem **e** negrito ou ≈1,75rem+; "bem-vindo —" em `text-2xl` (1,5rem) é Caveat peso 500, **fino**: a regra de texto grande (18,66px bold/24px regular) é atendida em 1,5rem regular, mas com ≥4,5:1 já passa, sem depender disso). `muted-foreground` sobre papel ≈ 6:1. **A conferir na implementação por cálculo e por axe**, também sobre o pontilhado e sobre `bg-moss/30` (papel rasgado) onde houver texto ("Elena", etiqueta).
- `h1` único ("um mar de encontros"); `h2` por seção ("Histórias recentes", "arte & ativismo"); `h3` nos cards. Landmarks: `header`, `main`, `footer`, `nav` no rodapé.
- Alvos ≥2,75rem: "menu", "Todos os projetos →", "Sobre a Elena →", links do rodapé, redes.
- Foco visível (`focus-visible:ring-2 ring-ring` já no projeto); ordem de leitura = ordem visual; as 4 palavras como `<ul>`.
- Imagens decorativas (mariposa, papéis, fita, costura) `alt=""`/`aria-hidden`; mural, banner, capas, retrato com `alt` descritivo i18n.
- `prefers-reduced-motion`: `fade-up`, `wobble` e `ink-link` já só animam com `no-preference`; **sem animação em loop** (crítica #6).
- Zoom 200% e 360 de largura: `min-w-0` nos itens flex/grid, `break-words` em títulos de card, sem rolagem horizontal (o protótipo usa `overflow-x-clip` no wrapper: **não** mascarar; a mariposa/colagem precisam caber).
- i18n: títulos longos em en/es ("Todos los proyectos →" é o mais longo), testados no e2e em `locale=es`.

### 6.2 Backend
N/A (só apresentação). Dados: posts recentes continuam vindo de `getRecentStories()` (`src/lib/home-data.ts`, sem alteração de contrato). Sem posts publicados, os cards-exemplo passam a ser os 3 projetos do protótipo (conteúdo curado em `src/lib/content`), linkando para `/projetos` (rota existente). **Quando existirem posts reais no blog, eles vencem** (comportamento atual preservado); o humano deve dizer se a home deve mostrar **Posts do blog** ou **Projetos** (pergunta 11), porque `ref-3` mostra projetos ("Todos os projetos →"), não posts.
- Cache/revalidação: `force-dynamic` continua (lê cookie de idioma e posts).
- Integrações: Azure Blob só para capas de posts reais (`remotePatterns` já cobre).

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ver home / assets | sim | sim | sim | pública (proxy `authorized`) |
| Links sociais externos | sim | sim | sim | `target="_blank" rel="noopener noreferrer"` |
- IDOR/dados do usuário: N/A. Sem input novo; a newsletter mantém Zod/honeypot/rate-limit existentes (não tocada).
- Sem `dangerouslySetInnerHTML`. Redirects: nenhum novo. URLs sociais vêm de `SITE.social` (config, não de usuário).
- Direitos autorais/privacidade: o **retrato é imagem de pessoa** (a própria artista, ok com autorização dela); fotos de obras de terceiros (capa do livro/álbum) precisam de autorização (pergunta 1).
- Rate limiting: N/A (nenhum endpoint novo).

## 8. Plano de testes
| # | Caso | Camada | Resultado esperado |
|---|---|---|---|
| 1 | `HomeIntro` pt/en/es | componente (RTL; `getT`/`HomeImage` mockados como em `tests/home-hero-banner.test.tsx`) | `h1` único com "um mar de" + "encontros" em `<em>`; eyebrow; 4 palavras em `<ul>`; sem chave i18n crua; cartão **antes ou depois** na ordem de leitura conforme spec |
| 2 | Gatilho "menu" | componente (`tests/app-header.test.tsx`/`home-header.test.tsx` atualizados) | botão com texto visível "menu", nome acessível contém "menu", `aria-expanded` alterna; **sem** `<img>` de hambúrguer; `Esc` fecha e devolve o foco |
| 3 | Overlay | componente | 7 itens (+ Práticas se aprovado), `aria-current` correto, idioma e carrinho no cabeçalho do painel (regressão) |
| 4 | `RecentStories`/`StoryCard` | componente | 3 itens; título em `h3` serifa; meta `text-xs`; link para `/projetos` nos exemplos; estado "posts reais vencem" preservado (`tests/stories.test.tsx` ajustado) |
| 5 | `HomeActivism` | componente | `h2` "arte & ativismo", frase, link `/sobre`, retrato com `alt` não vazio, decorativos `aria-hidden`/`alt=""` |
| 6 | `HomeFooter` | componente | tagline, Instagram/Facebook (links externos com `rel`; **sem link** se `SITE.social` vazio, como hoje), © com ano corrente (data mockada), links legais com `href` presentes, alvos `min-h-11` |
| 7 | Sem `px` nas classes novas | unidade (varre fontes) | nenhuma ocorrência de `\[\d+px\]` / `\d+px` em `src/components/home/*` e `globals.css` novos (padrão da 0006) |
| 8 | Contraste dos tokens usados | unidade (`tests/theme.test.ts` estendido) | texto terracota/musgo/muted sobre papel e sobre `moss/30` ≥ 4,5:1 (texto normal) / 3:1 (grande) |
| 9 | Responsivo `/` em 360, 390, 768, 1280 | e2e (Playwright, `e2e/pages.spec.ts`) | sem rolagem horizontal (`scrollWidth <= clientWidth`), `h1` visível, "menu" visível e ≥44×44, menu abre/fecha por teclado |
| 10 | axe em `/` por viewport e por idioma (`locale` cookie pt-BR/en/es) | e2e | zero `serious/critical` |
| 11 | Menu aberto em 360 e 1280 | e2e | foco preso (Tab cicla dentro), `Esc` fecha, foco volta ao gatilho, corpo sem rolagem |
| 12 | `prefers-reduced-motion: reduce` | e2e (`page.emulateMedia`) | sem `animation-name`/`transition` em `h1`, palavras e cards; **nenhum** elemento com `animation-iteration-count: infinite` |
| 13 | Comparação visual com as refs | e2e semiautomático | capturas em 360/390/768/1280 salvas em `spec/evidence/0013/` com `SHOTS_DIR` (já suportado); **ao lado das refs `ref-1..4` na review humana**. **Não** haverá assert pixel-a-pixel contra os PNGs de ref (fontes, pontilhado e imagens variam; seria frágil): critério objetivo = checklist de medidas relativas (posição/ordem/proporção do h1, cartão e cards via `boundingBox`: ex. h1 à esquerda dos 50% da largura em 1280, cartão à direita, banner com razão largura/altura ≈ 2–2,5, card 2 mais baixo que 1 e 3 em ≥1280) |
| 14 | Imagens | e2e | nenhuma imagem com `naturalWidth === 0`; todas com `width/height` ou `fill` em contêiner de proporção fixa (sem CLS); LCP = mural do topo com `fetchPriority="high"` |
| 15 | Newsletter (se mantida) | existentes | `tests/newsletter-*.test.tsx` seguem passando sem alteração |
| 16 | Regressão das 9 páginas internas | e2e existente | `e2e/pages.spec.ts` inteiro verde em 4 larguras (o header transparente afeta todas as páginas `(home)`) |

Infra necessária: **já existe** (Vitest + RTL, Playwright + axe, `playwright.config.ts` na porta 3100, `SHOTS_DIR`). Nada novo a instalar.

## 9. Plano de implementação
Faseamento (cada fase fecha com `tsc`, `eslint`, `vitest`, e2e da fase e capturas em 360/390/768/1280):
- **Fase A: fundação visual.**
  1. `layout.tsx`: Fraunces com `axes: ["opsz"]` (conferir o resultado em `/` e que as demais páginas não mudam de largura de texto a ponto de quebrar layout; rodar o e2e inteiro). Registrar a diferença com capturas antes/depois do h1.
  2. Copiar os assets aprovados para `src/assets/Home/` (só se a pergunta 1 estiver "sim"); senão manter placeholders.
  3. `home-images.ts` e `content`: novos slots/entradas tipados.
  4. i18n: chaves da seção 6.1 nas 3 línguas (o tipo `MessageKey` força paridade).
- **Fase B: header.** Gatilho "menu" + estados do header (transparente no topo / `bg-background` ao rolar); atualizar `home-header.test.tsx`, `app-header.test.tsx`, `sticky-header.test.tsx`.
- **Fase C: seções.** `HomeIntro` → `HomeBanner` → `RecentStories`/`StoryCard` → `HomeActivism` (um por vez, com captura por seção contra a `ref` correspondente).
- **Fase D: rodapé** + `SITE.social` (se aprovado) + posição da newsletter.
- **Fase E: testes e2e/axe/visual** (casos 9-14), ajuste de testes antigos (`home-hero-banner`, `home-images`, `home-footer-feature`, `layout-fullwidth`).
- **Fase F: verificação:** `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`, `npx next build`, `npm run test:e2e`; capturas em `spec/evidence/0013/`; relatório (seção 14).
Rodar o app só na porta 3100 (config existente); não tocar no `next dev` do usuário.

## 10. Riscos, rollback e dívidas
- **Direitos de imagem** (mural, capas, retrato, mariposa, logo): sem confirmação, a home sai com placeholders.
- **Resolução**: retrato 379×592 e mural largo 1400 px ficam suaves em telas 2x/largas (pedir originais).
- **Fraunces `opsz`**: muda a métrica do texto em **todo** o site (títulos); risco de quebras em títulos longos en/es. Mitigação: e2e das 10 páginas nas 4 larguras e revisão visual.
- **Header transparente** em todas as páginas `(home)`: texto sob o header sticky rola por baixo; precisa de fundo sólido ao rolar (planejado) e conferência do `SectionPage` (`bg-secondary` logo abaixo do header).
- **Testes que cravam a estrutura antiga** (5 arquivos) precisam ser reescritos, não só ajustados.
- **Peso da página**: 4-5 imagens grandes + mariposa PNG alfa 904 KB; `next/image` + `sizes` + lazy fora da primeira dobra; só o mural do topo com `fetchPriority="high"`.
- **Reversão:** mudanças isoladas em `src/components/home/*`, `app-header.tsx`, `layout.tsx` (font axes), `home-images.ts`, `site.ts`, `i18n.ts`; `git revert` do bloco; `HomeHero`/`HomeFeature` ficam apagados só no fim da fase C (antes disso coexistem), então dá para voltar atrás por fase.
- **Compatibilidade vinext (nota curta):** recursos Next-only usados: `next/image` (importação estática com `blurDataURL`, `fill`, `sizes`, `qualities`), `next/font/google` (agora com `axes`), `next/link`, `next/navigation` (`usePathname`), `cookies()` assíncrono via `getT()`, `export const dynamic = "force-dynamic"`. Segundo o README do vinext lido na 0007, `next/image` e `next/font` são 🟡 (parciais) e *segment config* também. **Nenhum recurso novo além desses é introduzido**, e nada de `cacheComponents`. Não rodei `vinext check`.
- Dívidas aceitas: `home-carousel.tsx` e `Whale.png` ficam no código sem uso na home; páginas internas seguem com a composição própria (pergunta 8).

## 6.3 Crítica de UI/UX (referências + pedido)
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | "menu" só texto manuscrito: o texto fino de Caveat 500 em terracota é a **única** entrada de navegação; legibilidade e alvo variam | `ref-1`: "menu" ≈ 1,2% da altura; Caveat é fina em tamanhos pequenos | média | `text-3xl` mínimo no mobile, `min-h-11 min-w-11`, `aria-expanded`, foco visível, `font-weight` 600 se o contraste estético cair; conferir axe |
| 2 | Terracota sobre papel: o `--primary` do protótipo (L 0,58) dava 4,31:1; o do projeto (L 0,52) tem **5,32:1** | 0011, `tests/theme.test.ts` | baixa (já resolvido) | usar o token do projeto, **não** o valor bruto do protótipo |
| 3 | `h-[50vh]` no banner: no mobile vira tira alta e estreita que corta o mural (visível em `elena-proto-home-mobile.png`, o mural fica irreconhecível, ~8 telas de scroll no meio da página) | protótipo mobile | alta | `aspect-[2/1]` (mobile) / `5/2` (md+), `object-cover` com `object-position` centrado; legenda sempre visível |
| 4 | `h1` `min(8.5rem, 9vw, 13vh)` com `leading-[0.9]`: em telas baixas (laptop 1280×720) o título encolhe; em 360 a palavra "encontros" (10 letras, Fraunces itálico) **pode estourar** 360 a `text-6xl` | cálculo: ≈0,52em por letra × 10 × 3,75rem ≈ 19,5rem > 17,5rem úteis (360 − 2×1,25rem). `text-5xl` (3rem) ≈ 15,6rem cabe | alta | usar `clamp(2.75rem, 12vw, 8.5rem)` no mobile com `break-words`; testar 360/390 e en/es ("encuentros" tem a mesma extensão) |
| 5 | Título + mural **lado a lado só em lg+**; em 768 a tela fica com h1 pequeno à esquerda e vazio; mural "cai" para baixo da dobra | protótipo `md:grid-cols-12` aplica a partir de 768, mas o cartão é largo e ocupa só 5/12 | média | grade 7/5 a partir de `lg` (1024); em 768 h1 grande e cartão abaixo centralizado; decidir após capturas |
| 6 | Mariposa com `float-slow` **em loop infinito** (7 s, `alternate`) | `styles.css`, `@utility float-slow` | alta (WCAG 2.2.2 Pause, Stop, Hide; 2.3.3) | **sem loop**; mariposa estática, com um "pouso" único (uma vez, ≤0,6 s) só com `no-preference`; rotação fixa |
| 7 | Mariposa + papéis em 3 lugares (topo, retrato, cauda dos cards) + inclinações no cartão e nos cards | `ref-1`, `ref-3`, `ref-4` | baixa | seguir as refs; usar a mariposa como elemento decorativo (`aria-hidden`), **sem** cobrir texto/links; a "cauda" de `ref-3` só se couber sem tocar o rodapé |
| 8 | Meta dos cards em ≈0,7rem e legenda do banner em ≈0,65rem nas refs | `ref-2`, `ref-3` | alta (0006 #3 já pedia piso) | `text-xs` (0,75rem) com `tracking-widest`, `text-muted-foreground` (≥4,5:1); informação essencial (ano/local) nunca só microtexto |
| 9 | Cards em 3 colunas em 360 (home atual) tornam o título ilegível; o protótipo e a `ref-3` são desktop | home atual `grid-cols-3` | média | 1 coluna no mobile (pergunta 10) |
| 10 | Menu aberto sem Shop/Carrinho/Login no protótipo; **o projeto é uma loja** | protótipo `SiteShell` | alta | manter carrinho/idioma/login do overlay atual (já existem) |
| 11 | Instagram/Facebook "decorativos" hoje sem URL; os do protótipo (`elena_landinez`) são URLs de produção que ninguém confirmou | `site.ts`, `SiteShell.tsx` | média | só ativar com confirmação (pergunta 4) |
| 12 | "Todos os projetos →" aponta para projetos, mas os cards vêm de **posts** quando houver | `home-data.ts` | média | pergunta 11 |

## 11. Perguntas em aberto (decisões do humano; cada uma tem default)
- [ ] **1. Direitos:** você confirma que a artista autoriza o uso, em produção, de: mural MOTH (2 fotos), capas "Mother Other" e "Song of the Cedars", retrato da Elena, mariposa e logo? Capas de livro/álbum podem ter terceiros (editora, gravadora). *Default:* sim para tudo que veio do protótipo da própria artista; se **não**, a home sobe com placeholders e os arquivos entram depois.
- [ ] **2. Itens do overlay:** manter os **letreiros PNG** (arte do cliente) e adicionar sublista "Práticas" (desenho/cerâmica/colagem), ou trocar por texto Fraunces como no protótipo? *Default:* manter PNG + sublista **só se** a arte "Práticas" existir; senão a sublista fica em texto Fraunces pequeno.
- [ ] **3. Newsletter na home:** manter (depois do bloco "arte & ativismo") ou remover da home? *Default:* manter, sem alterar o componente.
- [ ] **4. Rodapé:** ativar Instagram `https://www.instagram.com/elena_landinez` e Facebook `http://www.facebook.com/elenalandinez` (vêm do protótipo)? Manter na linha os links legais com `href` (hoje só "Contato")? "Termos/Privacidade/Cookies" continuam sem página. *Default:* ativar as redes **só com sua confirmação**; links legais sem `href` não aparecem.
- [ ] **5. Resolução dos assets:** o retrato tem 379×592 e o mural largo 1400×700. Há originais maiores? *Default:* usar os arquivos atuais e registrar a dívida.
- [ ] **6. Marca:** `SITE.name` = "Loja & Blog" vs © "Elena Landinez" da ref; usar o logo atual (`Elena_landinez.png`) ou o `logo.png` do protótipo? *Default:* logo atual; © com o nome da artista via `SITE.name` alterado **só se você aprovar** (afeta título da aba e `metadata`).
- [ ] **7. Hambúrguer/PNGs:** apagar `Menulistras.png` e `Menu/X.png` se não forem mais usados? *Default:* manter (não apagar nada).
- [ ] **8. Outras telas que ainda divergem e precisam do SEU screenshot de referência (não inventarei o visual):** **Sobre** (a 0010 seguiu `images/8.png`, mas o protótipo `elena-proto-sobre-mobile.png` tem outro desenho), **Projetos** (lista) e **página de projeto**, **Exposições** (lista cronológica), **Residências e Festivais** (lista + detalhe; existe `elena-proto-residencias-desktop.png`), **Livros/Publicações**, **Shop** (loja: sem referência nenhuma do cliente), **Contato**, **"Mais"** (do site atual do cliente: o que contém? não existe no projeto), **Notícias/Blog**, **Carrinho/Conta/Login**. Para cada uma: enviar print (mobile + desktop) do visual desejado ou dizer "usar o do protótipo".
- [ ] **9. Textos de `alt` e tagline em en/es:** `footer.tagline` "arte é vida" permanece em português nos 3 idiomas (slogan da artista, o protótipo não traduz) ou traduzimos? *Default:* **não traduzir**. Redação dos `alt` descritivos do mural/capas/retrato nas 3 línguas: posso propor na implementação.
- [ ] **10. Cards no mobile:** 1 coluna (recomendado) ou manter 3 colunas desde 360? *Default:* 1 coluna.
- [ ] **11. Fonte dos cards "Histórias recentes":** **projetos** (como na `ref-3`, link "Todos os projetos →") ou **posts do blog** (como hoje)? *Default:* projetos curados (`src/lib/content`) com fallback para posts **nunca**: a home mostra projetos; o blog segue acessível no menu "Notícias".
- [ ] **12. Header sticky ou estático?** *Default:* sticky, transparente no topo e `bg-background` ao rolar.
- [ ] **13. Fraunces `opsz`:** aceitar a mudança global de fonte (afeta todos os títulos)? *Default:* sim, verificada com e2e nas 4 larguras.

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada (5.1-B; assets 5.3-A) é aceitável
- [ ] Modelo de dados / migration revisado (N/A: sem DB)
- [ ] Matriz de permissões revisada (N/A: só apresentação)
- [ ] Direção visual e referências interpretadas corretamente (conferir 6.0 contra `ref-1..4`)
- [ ] Conflitos com 0001/0005/0006/0010 decididos (tabela 5.2)
- [ ] Crítica de UI/UX avaliada (aceito / ajusto / rejeito cada achado 1-12)
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
2026-10-28: aprovado com defaults (humano: "aprovada, implemente a 0013 com os defaults"). Ajustes pedidos pelo humano DURANTE a implementação (fora dos defaults):
- Usar `elena-landinez-studio/theme.css` como tema global: sincronizados `--paper`, `--card`/`--popover`, `--secondary`, `--accent` (verde), `--input`, `::selection`, tracking -0.02em, Caveat 500. Mantidos `--primary`/`--ring` L 0,52 (AA, 5,32:1; o 0,58 do tema dá 4,31:1) e os tokens de marca (salmon, mustard, purple...) que o tema não tem.
- Remover as mariposas da tela (removidas de topo e retrato; `moth.png` não foi mantido).
- Remover a faixa mostarda de newsletter da home e criar, abaixo de "arte & ativismo", uma seção nova `HomeNewsletter` no tema (papel rasgado, costura, fita), reaproveitando `NewsletterForm` sem alteração.
- Imagens menores/mais responsivo: mural do topo `max-w-xs` (mobile) e `max-w-md` (lg+), cards `max-w-sm` no mobile, colagem do retrato com insets menores em md. Não consegui ler o screenshot que o humano anexou (fora do diretório de trabalho): proporções seguem as refs 1-4.

## 14. Relatório pós-implementação
**Feito:** Fraunces com `axes: ["opsz"]`; assets copiados para `src/assets/Home/` (moth-mural-detail, moth-mural-wide, moth-mural-1, mother-other (de mother-other-2), cedars-cover, elena-portrait); `HomeIntro`, `HomeBanner` (2:1 / 5:2), `RecentStories`+`StoryCard` (projetos curados em `src/lib/content/home-stories.ts`, 1 coluna no mobile, 3 em md+, 2º descido, 1º com -1,5deg), `HomeActivism` (colagem), `HomeNewsletter`, `HomeFooter` novo; `AppHeader` com gatilho de texto "menu" (`menuLabel`), grupo "Práticas" em texto Fraunces (`groups`), header transparente no topo/`bg-background` ao rolar (sentinela `#home-top` no layout); i18n pt/en/es; `HomeHero`/`HomeFeature` apagados.
**Desvios:** sem mariposa e sem faixa mostarda (pedido do humano); "cauda" de papel da ref-3 era o topo da colagem de ref-4 (não é elemento próprio); cards com `alt` descritivo dentro do link (nome do link fica longo); regra de teste "sem clamp()" relaxada só para o h1; testes de estrutura antiga reescritos (home-hero-banner, home-footer-feature, stories, home-images, layout-fullwidth, sticky-header, app-header, home-header). `getRecentStories` (home-data.ts) ficou sem uso na home (teste próprio mantido). `SITE.name` inalterado: © mostra "Loja & Blog". Instagram/Facebook inativos (`SITE.social` vazio): rodapé mostra só Contato.
**Testes:** vitest 403 passam / 5 falham, todas as 5 pré-existentes (menu-images x4 e app-header, procuram public/images/menu/*). tsc e eslint (src, tests, e2e) limpos. `next build` ok. Playwright 61/61 (e2e/pages.spec.ts nas 4 larguras + e2e/home.spec.ts: estrutura/proporções, imagens/LCP, menu por teclado, header transparente->sólido, axe pt/en/es, reduced-motion, sem loop).
**vinext check:** 92% compatível; 1 issue (next-auth, já conhecido), 2 parciais (images, turbopack rules, já conhecidos). Nenhum bloqueio novo.
**Evidência:** `spec/evidence/0013/home-{360,390,768,1280}.jpg` (+ `home-360-bottom.jpg`). Comparação com refs: h1 à esquerda e mural à direita em 1280, mural abaixo do título <1024, banner 2,5:1, card 2 descido 4rem, colagem à esquerda e texto à direita, rodapé em 3 colunas: conferido por e2e e por captura. Diferença visível: mural do topo menor que na ref-1 (pedido de reduzir) e sem mariposa.
**Não verificado:** zoom 200%, navegadores além do Chromium, a ordem de leitura com leitor de tela real. **Dívidas:** retrato 379x592 e mural largo 1400px ficam suaves em telas 2x (pedir originais); formulário de newsletter usa texto em cqw (~11px em 768), preexistente e não alterado; faixa do SectionPage (`bg-secondary`) agora tem emenda com o header transparente no topo, a revisar nas telas internas; tema global alterou `--secondary`/`--accent` em todo o site (revisar loja/dashboard visualmente); telas do item 8 (Sobre, Projetos, Exposições, Residências, Livros, Shop, Contato, Mais, Notícias, Carrinho/Conta/Login) NÃO tocadas, aguardam screenshots; Sobre ainda usa a faixa mostarda `NewsletterBand`.
