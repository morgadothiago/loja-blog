---
id: 0004
title: Direção de design: inspiração em oliverjeffers.com (análise e proposta)
status: in-review
layers: [front]
owner: Thiago Morgado
created: 2026-10-27
approved_by:
approved_at:
---

# 0004 — Inspiração: oliverjeffers.com

## 1. Contexto e problema
O usuário/cliente gostou de https://oliverjeffers.com e quer usá-lo como **inspiração adicional** à referência já aprovada (home implementada na spec 0001). É uma direção de design nova, então passa por spec. **Limite importante: a análise visual não foi possível** (ver seção 4). Esta spec registra só o que foi verificado, declara o que não foi, extrai princípios **sem copiar** nada do site (imagens, textos, logotipo, nome, código e assets são obra de terceiros) e propõe um caminho que depende de respostas do usuário.

## 2. Objetivos e não-objetivos
**Objetivos**
- Registrar com evidência o que se sabe do site e o que não se sabe.
- Propor princípios aplicáveis e alternativas ranqueadas para a home (e impacto em loja/blog).
**Não-objetivos**
- Implementar qualquer coisa. Copiar imagens, ilustrações, textos, logotipo, nome do autor, código ou assets. Alterar a home aprovada antes de o usuário dizer **o que** gostou.

## 3. Estado atual do código
Home aprovada (spec 0001): header fixo `AppHeader` bege→claro, hero com carrossel de 3 slides, banner 3:1, histórias recentes, destaque, newsletter, rodapé; sem container de largura máxima e `px-5` (`src/app/globals.css` `px-fluid`). Não há **skip links** em nenhum layout (`grep -ri "skip\|pular para" src` vazio). Loja e blog usam o layout `(public)` antigo (`SiteHeader`, `max-w-5xl`).

## 4. Documentação / evidências consultadas
| Fonte | O que consegui | Limite |
|---|---|---|
| `WebFetch https://oliverjeffers.com` e `/art`, `/books`, `/news` | Só o **cabeçalho do documento**: títulos ("Oliver Jeffers \\| Visual Artist & Author", "Art \\|…", "Books \\|…", "News \\|…"); 3 *skip links* ("Skip to navigation" → `#main-navigation`, "Skip to content" → `#main-content`, "Skip to footer" → `#site-footer`); link do logo para a home **sem texto visível**; navegação em lista com 4 itens (About `/about`, Art `/art`, Books `/books`, News `/news`) e um 5º link **sem rótulo de texto** para uma loja externa (`oliverjeffersstore.com`). | A ferramenta devolve só texto/HTML e o conteúdo veio **truncado**: não vi hero, ordem das seções, grade de obras, tipografia, cores, espaçamentos, rodapé, microinterações, `alt` das imagens, nem a hierarquia de títulos. |
| `WebSearch` | Confirma que o site é o oficial do autor/ilustrador; **nenhuma** descrição do layout. | Sem dados de design. |
| Visual | **Não vi o site renderizado.** | Sem navegador nem captura nesta sessão. |
Conclusão honesta: **qualquer afirmação sobre estética, grade, cor ou tipografia do site seria palpite**, e não vou registrar palpite como fato. Para a análise visual completa (Fase 1B) preciso de **capturas** (home e 1-2 páginas internas, mobile e desktop) em `spec/references/`, ou das indicações do que o usuário gostou.

## 5. Alternativas (ranqueadas; as 2 primeiras dependem só do que foi verificado)
| # | Opção | O que muda | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|---|
| 1 | **Adotar os princípios de estrutura e acessibilidade verificados** (seção 6): skip links, navegação curta e clara, nome acessível em links só de ícone/logo | Home e demais layouts públicos ganham skip links e revisão de rótulos; nenhuma mudança de visual | Ganho real de a11y, baixo risco, não depende de visual do site | Não "parece" com o site | Baixo | Home + loja/blog (layouts); bundle ~0 |
| 2 | **Não mudar nada** até o usuário mostrar o que gostou (capturas/descrição) | Nada | Zero risco de descaracterizar a home aprovada | Atrasa a inspiração | Nenhum | Nenhum |
| 3 | **Revisão visual orientada** (após capturas): ajustar espaço em branco, hierarquia, grade de obras/imagens, tipografia e microinterações da home e, depois, loja/blog (portfólio de produtos/posts) | Possível nova grade de "trabalhos", navegação por seções e rodapé | É o que o cliente provavelmente espera ao pedir "inspiração" | Não dá para especificar sem ver; risco de conflitar com bege/artesanal, carrossel e `px-5` aprovados | Médio/Alto | Home e, se aprovado, `/loja` e `/blog` (hoje `max-w-5xl`, sem o novo sistema) |
| 4 | **Copiar o layout** | — | — | **Rejeitada**: viola direitos de terceiros e a regra do projeto de extrair linguagem, não ativos | — | — |
**Recomendação:** executar **1 agora** (barato, verificável, não conflita com nada aprovado) e **manter 2** para o resto até o usuário enviar capturas; só então abrir a rodada **3**, numa spec nova ou numa revisão desta, com aprovação.

## 6. Design proposto
### 6.0 Referências e direção visual
- **Referências analisadas:** nenhuma imagem (ver seção 4). Referência aprovada anterior: `spec/references/home-approved-mobile.png`.
- **Princípios extraídos (somente do que foi verificado):**
  1. **Arquitetura de informação curta e plana:** 4 destinos principais (sobre, arte/obra, livros, novidades) + loja externa; poucos itens, nomes de uma palavra. Aplicação possível: manter a navegação principal enxuta (hoje Início/Loja/Blog + conta); decidir se vale uma página "Sobre" (pergunta 3).
  2. **Skip links como cidadãos de primeira classe** (navegação, conteúdo, rodapé), com `id`s estáveis (`main-navigation`, `main-content`, `site-footer`). Aplicação: criar `SkipLinks` i18n nos layouts públicos e a `<main id="main-content">`/`<footer id="site-footer">`.
  3. **Rótulos acessíveis em elementos sem texto:** o logo e o link da loja aparecem sem texto no HTML extraído (não sei se têm `alt`/`aria-label`). Aplicação: nunca deixar link só de ícone/logo sem nome acessível (nosso carrinho e menu já têm `aria-label`).
  4. **Páginas por tipo de conteúdo** (obras, livros, notícias) com **títulos de documento próprios** ("Seção | Nome"). Aplicação: `metadata.title` por rota (hoje só o título global, `src/app/layout.tsx:27`).
- **Não verificado (não registrar como princípio):** grade, tipografia, cor, espaço em branco, microinterações, tratamento de imagem, rodapé, responsividade.
- **O que NÃO copiar:** qualquer imagem, ilustração, texto, logotipo, nome do autor, código, assets e a estrutura exata de páginas/URLs; nada de marca do autor no nosso código.
- **Crítica (somente sobre o que foi verificado e sobre a nossa home):**
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Nossa home não tem skip links; usuário de teclado atravessa header e menu a cada página | `grep` vazio; header fixo agora ocupa o topo | alta | `SkipLinks` (alternativa 1) |
| 2 | Títulos de aba iguais em todas as páginas ("Loja & Blog") | `layout.tsx:27` | média | `metadata.title` por rota |
| 3 | Nav principal mistura destinos e conta; sem "Sobre" | `home-header.tsx` | baixa | pergunta 3 |
| 4 | Conflito potencial: o site de referência parece usar navegação textual simples; nossa home tem hero carrossel + header que troca de cor, ambos aprovados | análise limitada | informativo | não mudar sem capturas |
| 5 | Conflito de linguagem: bege/artesanal, `px-5`, sem container e carrossel são decisões aprovadas | spec 0001 | informativo | qualquer revisão visual (alternativa 3) exige aprovação explícita |

### 6.1 Frontend (apenas alternativa 1, se aprovada)
- `SkipLinks` (Server Component, `getT()`): 3 âncoras visíveis só no foco (`sr-only focus:not-sr-only`), estilo com tokens (`bg-background`, `text-foreground`, anel de foco), alvo ≥44px. Textos i18n pt/en/es: "Pular para a navegação", "Pular para o conteúdo", "Pular para o rodapé".
- Ids: `main-navigation` (na `nav` do `AppHeader`/`SiteHeader`), `main-content` (nos `<main>` dos layouts `(home)` e `(public)`, com `tabIndex={-1}`), `site-footer` (nos rodapés).
- Layouts tocados: `(home)/layout.tsx`, `(public)/layout.tsx` (impacta loja/blog de forma aditiva, sem mudar visual).
- `metadata.title` por rota (`generateMetadata`/`metadata`), com template `%s | {SITE.name}`.
- Responsivo: sem impacto visual (invisíveis até o foco). Foco visível em 360–1920. `scroll-padding-top` já existe (header fixo).
- a11y: contraste do skip link ≥ 4,5:1 (ink sobre paper 15,5:1); não esconder com `display:none`.

### 6.2 Backend
N/A (sem dados nem actions).

## 7. Segurança e permissões
N/A: só marcação estática. Se "Sobre" for criada (pergunta 3), é conteúdo público sem formulários.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `SkipLinks` renderiza 3 âncoras com `href` corretos e rótulos nas 3 línguas | componente | `getByRole("link")` |
| 2 | Primeiro Tab no layout da home foca "Pular para a navegação"; Enter move o foco para o alvo | componente (jsdom) | foco no alvo com `tabIndex=-1` |
| 3 | Layouts `(home)` e `(public)` têm `main#main-content`, `footer#site-footer`, `nav#main-navigation` | componente | ids presentes |
| 4 | Títulos de aba por rota | unit (`metadata`) | "Loja \\| Nome" etc. |
| 5 | axe/responsivo | e2e | **Playwright não aprovado: declarar não verificado** |

## 9. Plano de implementação (só alternativa 1, após aprovação)
1. Chaves i18n `skip.*`. 2. `SkipLinks` + testes. 3. Ids nos layouts e nos headers/rodapés. 4. `metadata` por rota. 5. `tsc`/`eslint`/`vitest`/`next build`; relatório.

## 10. Riscos, rollback e dívidas
- Riscos: pouca evidência de design (maior risco: construir sobre palpite); ids duplicados entre `SiteHeader` e `AppHeader` (cada layout só usa um).
- Rollback: reverter commit (aditivo).
- Dívidas: análise visual completa; página "Sobre"; revisão de loja/blog ao novo sistema da home.

## 11. Perguntas em aberto (com default)
- [ ] 1. **O que exatamente o usuário/cliente gostou** no site (navegação, grade de obras, tipografia, espaço em branco, microinterações, rodapé, outra coisa)? Pode enviar capturas (home + 1-2 internas, mobile e desktop) para `spec/references/`? **Default: nenhuma mudança visual até saber; seguir só com a alternativa 1.**
- [ ] 2. A inspiração vale só para a **home** ou também para **loja e blog**? **Default: só home por ora; loja/blog numa spec própria depois.**
- [ ] 3. Criar uma página **"Sobre"** e/ou reorganizar a navegação principal? **Default: não.**
- [ ] 4. Manter o **carrossel do hero**, o **header que troca de cor** e a paleta bege/artesanal? **Default: sim.**
- [ ] 5. Aprova a alternativa 1 (skip links + títulos por rota) como primeiro passo? **Default: sim.**

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Direção visual e referências interpretadas corretamente
- [ ] Crítica de UI/UX avaliada
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
<Humano: data, decisão e ressalvas.>

## 14. Relatório pós-implementação
<Preenchido pelo agente ao final.>
