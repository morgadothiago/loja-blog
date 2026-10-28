---
id: 0006
title: Home — fidelidade à referência 6.png (ajustes de layout, sem trocar a arquitetura)
status: implemented
layers: [front]
owner: Thiago Morgado
created: 2026-10-28
approved_by: Thiago Morgado (aprovação escrita na conversa do Claude Code, "aprovado", com as recomendações da seção 11)
approved_at: 2026-10-28
---

# 0006 — Home: fidelidade à referência `6.png`

## 1. Contexto e problema
Pedido: a home deve ficar "exatamente como" a referência `/private/tmp/claude-501/-Users-thiagomorgado-Desktop-loja-blog/dcc640a1-e4f7-404d-9cb8-6c336c405d0e/images/6.png` (captura mobile ~445px de largura, página inteira; lida de fato). A home já existe (spec 0001, aprovada) e esta spec **só ajusta o que diverge**. Não revoga 0001.

Limites do pedido (do usuário): sem `px` como unidade (rem, cqw, %, escala Tailwind); conteúdo limitado a `--content-max` (`page-width`), fundos de ponta a ponta; newsletter já refinada (pílula, toast, cqw em contêiner limitado) **preservada**; slot `newsletterLeft` vazio e imagens de menu apagadas **fora de escopo**; não reverter mudanças não commitadas.

Evidência do estado atual: capturas headless (Brave) de `http://localhost:3000/` em 390 e 1280 de largura, salvas em `/private/tmp/claude-501/-Users-thiagomorgado-Desktop-loja-blog/dcc640a1-e4f7-404d-9cb8-6c336c405d0e/scratchpad/cur390.png` e `cur1280.png`. Ressalva: a de 390 mostra conteúdo cortado à direita, o que sugere que o navegador headless renderizou com viewport mais largo que 390 (Chromium impõe largura mínima de janela). **Tratar a captura de 390 como não confiável**; a de 1280 é confiável. Nenhuma verificação em 360/768 foi feita.

## 2. Objetivos e não-objetivos
**Objetivos:** aproximar cada seção da referência (lista na seção 6.0, "Diferenças"), mantendo i18n, a11y e tokens.
**Não-objetivos:** trocar fonte manuscrita (ver pergunta 4); criar arte (peixe roxo, mural, capas, figura do banjo-esquerda); tocar newsletter além de verificação; menu overlay; backend/DB.

## 3. Estado atual do código (arquivos lidos)
- `src/app/(home)/page.tsx`, `layout.tsx`: ordem Hero, Banner, Stories, Feature, Newsletter; layout sem contêiner.
- `src/components/home/home-hero.tsx:15-47`: **carrossel de 3 slides** (`HomeCarousel`, `aspect-[11/6]`, fundo `bg-secondary`), com setas, bolinhas e botão pausa; título `text-xl…lg:text-3xl tracking-widest`; subtítulo `text-purple text-lg`.
- `src/lib/home-images.ts`: `heroCarousel[0]` = `Whale.png` (cachalote **cinza** com baleia branca dentro); slides 2-3 placeholder; `banner` vazio; `stories` `[{}, {}, {}]`; `feature` = `Characters_2.png`; `newsletterLeft` `{}`; `newsletterRight` = banjo recortado.
- `src/components/home/home-banner.tsx:10-19`: `page-width`, `aspect-[3/1]`, legenda `text-xs text-muted-foreground`.
- `src/components/home/recent-stories.tsx:9-32`, `story-card.tsx:20-48`: carrossel mobile `w-[46%]`, grade 3 col em md+; `ASPECTS` `5/6, 4/3, square`; `OFFSETS` `"", mt-6, ""`; sem rotação; meta `text-xs uppercase`; título `font-sans text-lg`. Vazio: texto "Em breve, novas histórias." + link "Ver todas as histórias".
- `src/components/home/home-feature.tsx:11-27`: imagem `w-1/3 md:w-2/5`, rótulo `text-purple text-sm`, texto `text-xl md:text-3xl`, link `Sobre {SITE.name}` (hoje "Loja & Blog").
- `src/components/home/newsletter-band.tsx`, `newsletter-form.tsx`: **não alterar**.
- `src/components/home/home-footer.tsx:14-52`: © + Loja/Blog/Carrinho + ícones sociais + crédito; `text-xs`, links com `min-h-11`.
- `src/components/home/home-header.tsx` + `header/app-header.tsx:77`: `page-width flex h-[58px]`; logo `Elena_landinez.png` com `-ml-7`; carrinho + hambúrguer.
- `src/app/globals.css:157-160`: `page-width` = `mx-auto w-full px-5` + `max-width: var(--content-max)`.

## 4. Documentação consultada
| Fonte | O que confirmei | Contradiz expectativa? |
|---|---|---|
| Spec 0001 (§4) e código atual | `priority` deprecated, usar `fetchPriority`; `HomeImage` já usa `next/image` com `fill`+`sizes` | Não |
| Docs do Next em `node_modules/next/dist/docs/` | **Não reli** nesta fase: as mudanças propostas são só classes/markup em Server Components já existentes, sem API nova. Na implementação, se qualquer coisa de `next/image` (`sizes`, `placeholder`) mudar, reler `01-app/03-api-reference/02-components/image.md` antes. | A confirmar |

## 5. Alternativas (decisões não triviais)
### 5.1 Hero: carrossel vs. imagem única
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Manter carrossel (aprovado em 0001/0005) | Nada a refazer, vários slides possíveis | **Diverge da referência**: ela tem 1 ilustração sem controles, sem overlay cinza |
| B | **Imagem única** (slide 1), sem setas/bolinhas/pausa, fundo `bg-secondary` liso; carrossel fica no código, não renderizado | Fiel à referência; menos JS no LCP; sem controles de pausa (WCAG 2.2.2 deixa de ser problema) | Perde o carrossel já aprovado; precisa de decisão do usuário |
| C | Carrossel só se houver mais de 1 slide real | Flexível | Complexidade para um caso hipotético |
**Recomendação: B** (a referência é uma única peça); se o usuário quiser manter o carrossel, A.

### 5.2 Cards de histórias no mobile
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Manter carrossel com peek (46% por card) | Já feito | Referência mostra 3 cards **visíveis lado a lado** já no mobile, imagens com alturas diferentes |
| B | **3 colunas fixas desde 360** (`grid-cols-3 gap-3`), imagens de proporções diferentes + leve rotação, meta e título em fonte pequena | Fiel; sem rolagem horizontal | Em 360px cada coluna tem ~6,5rem: título longo quebra em 4-5 linhas; alvo de toque ok (card inteiro é link) |
| C | 1 coluna empilhada no mobile | Legível | Diverge visualmente |
**Recomendação: B com `line-clamp-3` no título e meta ≥ `text-xs` (0,75rem)**; ver crítica 3.

## 6. Design proposto
### 6.0 Referências e direção visual
- **Referência única:** `6.png`. Há também `spec/references/elena-home-mobile.png` (0001), mais antiga; esta spec segue a 6.
- **Intenção:** portfólio autoral, calmo; obra protagonista, interface mínima.
- **Sistema extraído:** fundo bege (hero `bg-secondary`, resto `bg-background`, um tom mais claro); faixa mostarda; texto quase-preto; subtítulo hero roxo; rótulo do destaque rosa/laranja; botão preto em pílula; imagens sem raio; título do hero e "Histórias RECENTES" em manuscrito fino e irregular (preto); corpo/títulos de card/feature em serifa editorial.

**Diferenças concretas (referência vs. estado atual), com evidência**
| # | Seção | Referência | Atual | Ação proposta |
|---|---|---|---|---|
| D1 | Hero, imagem | 1 ilustração grande **roxa** (peixe/baleia), sem moldura, sobre o bege; sem controles | Carrossel com overlay cinza (`bg-…` cinza visível na captura 1280, fundo `~#a89f8f`), setas, 3 bolinhas, botão pausa; arte = cachalote **cinza** | Opção 5.1-B; remover overlay cinza; **arte roxa não existe no repo** (pergunta 1) |
| D2 | Hero, título | Manuscrito fino, preto, ~1,25rem no mobile; subtítulo roxo manuscrito | Caveat Brush (pincel grosso) com `tracking-widest`, título bem mais largo; no mobile transborda (captura 390 cortada, não confiável) | Reduzir `tracking`, garantir quebra em 2 linhas sem estourar; fonte: pergunta 4 |
| D3 | Banner | Faixa com **margem lateral** (~3,5% de cada lado, mobile), proporção ~2,1:1, legenda minúscula embaixo à esquerda | Largura do `page-width`, `aspect-[3/1]`, placeholder SVG turquesa/rosa genérico | `aspect-[2/1]` no mobile, `md:aspect-[3/1]`; legenda `text-xs`. Arte do mural: pergunta 1 |
| D4 | Stories, título | "Histórias RECENTES" manuscrito com **sublinhado/realce** leve? (não visível; apenas manuscrito) | `h2 text-3xl sm:text-4xl` | manter; sem mudança |
| D5 | Stories, cards | **3 cards visíveis** lado a lado desde o mobile; imagens de alturas/proporções distintas, 3º com leve rotação e mais alto; meta em caixa-alta minúscula (`DESIGN MUSEUM, LONDRES · 2024`); título serifado pequeno | Carrossel 46% (só ~2 cards visíveis); sem rotação; com 0 posts mostra só "Em breve" (captura 1280: seção vazia) | Opção 5.2-B; `rotate` só no 3º (`md:` e acima ou todos? pergunta 3); estado vazio: pergunta 2 |
| D6 | Stories, link | Não há "Ver todas as histórias" | Presente | Manter (alvo útil, não está na referência: discordo de remover; ver crítica 5) |
| D7 | Destaque | Ilustração **pequena** (~30% da largura, à esquerda), texto ~1,25rem vertical-centro; rótulo laranja com estrela; link "Sobre a Elena →" minúsculo | Ilustração `w-1/3 md:w-2/5` (no 1280 ocupa 40% da largura e ~25rem de altura: desproporcional vs. texto); link "Sobre Loja & Blog"; rótulo roxo | `md:w-1/4 lg:w-1/5`; limitar altura (`max-h`); rótulo: manter roxo por contraste (crítica 2); texto do link usa nome do site (pergunta 5) |
| D8 | Newsletter | Título alinhado ao início do campo; pílula com ícone; botão preto; ícones; banjo à direita; arte emoldurada à esquerda | Já implementado; esquerda = placeholder (azul/rosa) | **Preservar**; só verificar alinhamento do título ao campo em 360/768/1280 |
| D9 | Rodapé | Linha única e fina: © à esquerda, 4-5 links (`TERMS · PRIVACY · COOKIES · CONTACTS · MANAGE COOKIES`), "WEBSITE BY" à direita; sem ícones sociais | © + Loja/Blog/Carrinho + sociais + crédito; `text-xs`, `min-h-11` por link (alto) | Manter conteúdo útil; remover ícones sociais do rodapé (já estão na newsletter, a referência não os repete); links em `text-xs uppercase tracking-wider`, altura `min-h-11` mantida (alvo); esconder crédito se vazio (já faz). Termos/privacidade/cookies: não existem (pergunta 6) |
| D10 | Header | Logo manuscrito à esquerda **com margem lateral**, só hambúrguer à direita | Logo colado à borda esquerda com `-ml-7`; carrinho + hambúrguer | **Bug provável:** captura 1280 mostra logo e conteúdo **sem o padding lateral** de `page-width` (`px-5`) — logo no x=0, textos de Stories e Feature encostados na borda. Investigar antes de ajustar (pode ser CSS stale do dev server ou `-ml-7` + `px-5` mal calibrados). Carrinho: manter (e-commerce não pode sumir; discordo de remover) |
| D11 | Espaçamento vertical | ~2,5rem entre seções; Stories→Destaque ~3,5rem | `pb-8 … lg:pb-14` e feature com `pt-0` | Ajustar para escala 10/14 (2,5/3,5rem), conferir em captura |

### Crítica de UI/UX (referência e pedido)
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Hero sem CTA: visitante não sabe que há loja | Referência não tem botão; projeto tem loja/carrinho | média | Manter fiel (sem CTA); o caminho para a loja é o menu. Registrar como decisão do usuário |
| 2 | Rótulo "Arte e Ativismo" em laranja/rosa pequeno | Spec 0001 §6.0 calculou salmão/papel **1,81:1** e coral **3,67:1** (falham 4,5:1) | alta | Texto em `text-purple` (7,68:1); estrela/ornamento em `text-salmon` decorativo. Já é o estado atual; **não copiar a cor da referência** |
| 3 | Meta dos cards, legenda do banner e rodapé em ~0,6rem | Referência (microtexto ilegível) | alta | Piso `text-xs` (0,75rem) e contraste ≥4,5:1; informação essencial nunca só em microtexto |
| 4 | 3 colunas de card em 360px: ~6,5rem por card | Aritmética: 360 - 2×1,25rem padding - 2×0,75rem gap ≈ 18,5rem /3 ≈ 6,2rem | média | Título `text-sm line-clamp-3`; se ficar apertado em en/es (títulos longos), cair para 2 colunas abaixo de ~24rem. Verificar visualmente |
| 5 | Remover "Ver todas as histórias" deixaria o blog sem entrada na home | Referência não tem o link | média | Manter discreto abaixo dos cards |
| 6 | Imagem do hero com arte de texto/detalhe fino | — | baixa | `alt` descritivo (já via i18n `home.carousel.1.alt`) |
| 7 | Foco/teclado: cards são links inteiros (bom); rotação não pode cortar o foco | — | baixa | Rotar só a imagem dentro do `overflow-hidden`? Rotação corta cantos; usar rotação ≤1,5° e `focus-visible:outline` no `Link` |

### 6.1 Frontend (mudanças, todas em classes/markup; sem componente novo)
| Arquivo | Mudança |
|---|---|
| `home-hero.tsx` | Imagem única (5.1-B): remove `HomeCarousel` do render, `aspect` conforme a arte; reduzir `tracking-widest`; manter `id="home-hero"` (usado por `solidAfterId`) |
| `home-banner.tsx` | `aspect-[2/1] md:aspect-[3/1]`, margem lateral extra só no mobile se confirmada (pergunta 3 da seção 11 cobre) |
| `recent-stories.tsx`, `story-card.tsx` | grade 3 col desde o mobile (5.2-B), proporções/offsets/rotação por posição, estado vazio conforme decisão |
| `home-feature.tsx` | ilustração menor e com altura limitada; link com nome conforme decisão |
| `home-footer.tsx` | remove ícones sociais do rodapé; linha única fina |
| `app-header.tsx`/`home-header.tsx` | **só se** a investigação D10 confirmar bug |
| `newsletter-*` | nenhuma alteração (só verificação) |
| `src/lib/i18n.ts` | só se textos mudarem; 3 idiomas obrigatórios |

Unidades: nenhuma `px` nova; `rem`, `%`, `cqw`, escala Tailwind. (Observação: o código atual já tem `h-[58px]` em `app-header.tsx:77` e `lg:max-h-…`; **não** será tocado nesta spec, a menos que o usuário peça.)

**Responsivo (alvo por breakpoint)**
| Seção | 360-390 | 768 | 1024 | 1280+ (teto `--content-max`) |
|---|---|---|---|---|
| Hero | imagem largura total, título 2 linhas, subtítulo | idem, maior | idem | conteúdo limitado, fundo de ponta a ponta |
| Banner | `2/1` | `3/1` | `3/1` | `3/1` dentro de `page-width` |
| Stories | 3 col compactas | 3 col, gap 1,5rem | gap 2rem | idem |
| Destaque | 2 col, ilustração ~30% | ilustração 25% | 20% | 20%, texto até `text-3xl` |
| Newsletter | inalterada | inalterada | inalterada | inalterada |
| Rodapé | quebra em 2 linhas | linha única | linha única | linha única |

**Acessibilidade (checklist):** contraste ≥4,5:1 em todo texto (rótulo em roxo); alvos ≥2,75rem (`min-h-11`) em links do rodapé/menu; `alt` em imagens reais, `alt=""` em placeholders decorativos; foco visível nos cards; sem controles de movimento no hero (remoção do carrossel elimina o requisito de pausa); `prefers-reduced-motion` nos hovers; sem rolagem horizontal da página em 360/768/1280.

### 6.2 Backend
N/A (sem mudança). `getRecentStories` permanece.

## 7. Segurança e permissões
N/A: só apresentação. Newsletter (action, Zod, honeypot) intocada.

## 8. Plano de testes
- Unidade/componentes (Vitest, ajustar os existentes): `tests/home-hero-banner.test.tsx` (hero sem controles de carrossel; `h1` presente; banner `aspect-[2/1]`), `tests/home-images.test.tsx` (slots), `tests/layout-fullwidth.test.tsx` (fundos de ponta a ponta, `page-width`, sem `px` nas classes novas: teste que varre as classes das seções por `\[\d+px\]`), novo teste de `StoryCard`/`RecentStories` (3 itens no mobile, título com `line-clamp`, estado vazio), rodapé (sem ícones sociais, links com `min-h-11`).
- E2E/responsivo/a11y: **não há Playwright** (fora do projeto). Verificação visual: capturas via Brave headless **em largura real** (usar `--window-size` maior e `--force-device-scale-factor`, ou pedir ao usuário que confira no navegador), 360/768/1280, comparar com `6.png`. Declarar "não verificado" se a captura mobile continuar não confiável.
- Verificação final: `npx tsc --noEmit`, `npx eslint src`, `npm test`, `npx next build`.

## 9. Plano de implementação (após aprovação)
1. Investigar D10 (padding lateral/logo) com a captura e `getComputedStyle`; corrigir só a causa.
2. Hero (5.1) + tipografia do título (conforme pergunta 4).
3. Banner (D3).
4. Stories (5.2, D5) + estado vazio.
5. Destaque (D7).
6. Rodapé (D9).
7. Ajuste de ritmo vertical (D11).
8. Testes, capturas 360/768/1280, relatório.

## 10. Riscos, rollback e dívidas
- Riscos: 3 colunas em 360px apertadas (crítica 4); `Whale.png` cinza não casa com a referência roxa até chegar a arte nova; capturas mobile via headless não confiáveis.
- Rollback: tudo em classes e markup; `git` do usuário tem muitas mudanças não commitadas, então **editar só os arquivos listados em 6.1** e não tocar nos demais modificados.
- Dívida: carrossel permanece no código sem uso (se 5.1-B); `px` existentes em `app-header.tsx` fora de escopo.

## 11. Perguntas em aberto (precisam do usuário)
1. **Arte:** a referência mostra peixe/baleia **roxo**, mural turquesa/rosa, 3 capas e arte esquerda emoldurada. Você tem os arquivos e os direitos? Hoje o hero usa a cachalote cinza (`Whale.png`), o banner e os cards usam placeholders. "Exatamente igual" só é possível com essas imagens. Sem elas, fica igual em **layout**, não em arte.
2. **Hero:** trocar o carrossel por **imagem única** (recomendado, fiel à referência) ou manter o carrossel aprovado?
3. **Cards:** 3 colunas desde 360px (recomendado) ou manter carrossel; e a leve rotação/alturas diferentes valem também no mobile? Com 0 posts publicados (caso atual do banco local), mostrar "Em breve" ou 3 cards de exemplo (placeholders) para a home ficar igual à referência?
4. **Fonte manuscrita:** a referência usa manuscrito fino; o projeto usa Caveat Brush (pincel grosso). Trocar a fonte (next/font, mudança global de títulos) ou manter e só ajustar tamanho/espaçamento?
5. **Link do destaque:** "Sobre a Elena →" (nome da pessoa) ou "Sobre {SITE.name}" (hoje "Loja & Blog"), e para qual rota (hoje `/blog`; existe `/sobre` da spec 0005?).
6. **Rodapé:** a referência tem Termos/Privacidade/Cookies/Contato e "Website by". Não existem páginas para isso (`SITE.footerLinks` sem `href`). Manter só Loja/Blog/Carrinho?
7. **Carrinho no header:** a referência não tem; manter (recomendado) ou remover?

## 12. Checklist da review humana
- [ ] Decisões 1-7 respondidas
- [ ] Diferenças D1-D11 conferidas contra `6.png`
- [ ] Newsletter confirmada como intocada

## 13. Registro de aprovação
Pendente (campos `approved_*` vazios; preenchimento só por humano).

## 14. Relatório pós-implementação
**Decisões aprovadas (seção 11):** 1) só assets atuais, slots prontos; 2) hero imagem única; 3) 3 colunas desde 360, alturas diferentes, leve rotação, vazio = "Em breve"; 4) fonte mantida, só tamanho/tracking; 5) "Sobre a Elena" para `/blog`; 6) rodapé só Loja/Blog/Carrinho; 7) carrinho mantido.

**Feito:** `home-hero.tsx` (imagem única `eager`, sem carrossel/overlay/controles; tracking menor, `text-balance`); `home-banner.tsx` (`aspect-[2/1] md:aspect-[3/1]`); `recent-stories.tsx` + `story-card.tsx` (grid 3 col desde o mobile, aspectos `5/6`, `1/1`, `4/5`, `rotate-1` no 3º, título `text-sm` ate `md:text-lg`, `outline` de foco); `home-feature.tsx` (ilustração `md:w-1/4`, texto `text-lg` no mobile, link sem `{name}`); `home-footer.tsx` (sem ícones sociais); `i18n.ts` ("Sobre a Elena"/"About Elena"/"Sobre Elena"); espaço Stories->Destaque `pb-12`. Newsletter: nenhum componente alterado.

**D10 (falta de px-5): causa = CSS desatualizado do dev server (:3000).** O CSS do build de produção contém `.page-width{padding-inline:calc(var(--spacing) * 5);max-width:var(--content-max);margin-inline:auto}` e as capturas do build (`next start`) mostram o padding correto. Nenhuma mudança de código foi necessária; reiniciar `npm run dev` resolve.

**Testes:** atualizados `home-hero-banner`, `layout-fullwidth` (hero único, 2/1 liberado, varredura sem `[..px]` em `src/components/home`), `stories` (+grade 3 col), `newsletter-band` (atualizado ao layout atual: pílula, `md:min-h-[28cqw]`, `md:translate-y-[2cqw]`, toast via mock do sonner); novo `home-footer-feature`. Resultado: `npx vitest run` com 8 falhas, todas as já conhecidas (menu-images, menu-pages, app-header: imagens de menu apagadas do `public`). `tsc --noEmit` limpo, `eslint src tests` limpo, `next build` ok.

**Verificação visual:** capturas do build de produção, 1280 (Brave headless) e 360/768 via iframe (a janela headless não vai abaixo de ~500). 360: sem rolagem horizontal visível; 1280 confere com a referência em ordem e proporções. **Não verificado:** a grade de 3 cards com posts reais (banco sem posts: só vazio); 768 capturado mas não inspecionado em detalhe; axe/foco/teclado; menu overlay.

**Pendente (arte):** peixe/baleia roxa do hero (hoje `Whale.png` cinza), mural do banner (placeholder SVG), 3 capas dos cards (`HOME_IMAGES.stories` vazio), arte esquerda da newsletter (`newsletterLeft` vazio). Slots prontos em `src/lib/home-images.ts`. `HomeCarousel` permanece no código sem uso.

## 15. Rodada 2 (2026-10-28): fidelidade máxima à referência (instrução do usuário)
Pedido: analisar a referência de novo e deixar a home o mais exata possível; onde falta conteúdo real, manter o esqueleto com dados de exemplo; o que não está na referência sai da home. Reverte decisões da rodada 1 que divergiam (sem perguntas de sim/não, regra: a opção mais próxima da referência).

| # | Divergência | Rodada 1 | Rodada 2 |
|---|---|---|---|
| R1 | Header | logo + carrinho + hambúrguer | só logo + hambúrguer; carrinho continua **dentro do menu** (pílula no cabeçalho do overlay) |
| R2 | "Ver todas as histórias" | mantido | removido da home (rota /blog segue existindo; cards levam a ela) |
| R3 | Histórias sem posts | "Em breve" | **3 cards de exemplo** (título, "Exemplo · 2024"), somem sozinhos com posts reais; chave `home.stories.empty` removida |
| R4 | Meta dos cards | "mês ano" | só o **ano** ("CATEGORIA · 2024"), como na referência |
| R5 | Proporções/recuos dos cards | 5/6, 1/1, 4/5 | 21/20, 4/3, 9/10 com recuos 1/6/0 (2º mais baixo, 3º mais alto e girado), conforme medido na referência |
| R6 | Legenda do banner | "Ilustração de exemplo (substituir…)" | "Mural de exemplo · Museu, Cidade, 2024" (formato da referência, texto próprio) |
| R7 | Rodapé | Loja/Blog/Carrinho | © + Termos/Privacidade/Cookies/Contato/Gerenciar cookies + "Site por" à direita; itens sem `href` são **texto** (sem link morto), viram link ao preencher `SITE.footerLinks[].href`; sem Loja/Blog/Carrinho |

**Ainda difere (e por quê):** (a) arte: hero cachalote cinza (a referência tem peixe roxo), banner/cards/arte esquerda da newsletter em placeholder (arquivos inexistentes); (b) tipografia manuscrita: Caveat Brush (mais grossa) por decisão 4; (c) rótulo "Arte e ativismo" em roxo e não laranja, por contraste (1,81:1 / 3,67:1 do laranja/rosa); (d) rodapé em 360 quebra em 3 linhas (a referência usa ~0,6rem; aqui `text-xs`, piso de legibilidade); (e) os itens legais do rodapé não levam a lugar nenhum até existirem as páginas; (f) hambúrguer da referência é 3 linhas simples, aqui é o desenho do cliente (`Menulistras.png`).
**Testes:** `stories`, `home-footer-feature`, `home-images` (footer), `home-header` (barra só com hambúrguer; carrinho no menu), `home-hero-banner` (legenda), `newsletter-band` (largura central 17rem, que mudou fora desta spec). vitest: 316 passam, 8 falham (as conhecidas de menu-images/menu-pages/app-header). tsc, eslint, build ok. Capturas do build de produção em 360/768 (iframe) e 1280.
