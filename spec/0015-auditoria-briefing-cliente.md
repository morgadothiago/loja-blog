---
id: 0015
title: Auditoria de conformidade do projeto contra o briefing da cliente (estrutura do site) e mapa das specs 0016-0022
status: approved
layers: [front, back, db]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0015 — Auditoria contra o briefing da cliente + roadmap

> Tipo: **auditoria/relatório** (não altera código). Fonte de verdade: `spec/references/briefing-cliente-estrutura-do-site.md` (Elena Landínez). Esta spec é aprovada para aceitar o diagnóstico, o recorte 0016-0022 e a ordem. Nada foi implementado; nada fora de `spec/` foi tocado. O app não foi rodado (auditoria feita por leitura de código e dos letreiros PNG); portanto **nenhuma afirmação visual de runtime** é feita aqui.

## 1. Contexto e problema
A cliente definiu a arquitetura de informação (7 seções, categorias, modelos de conteúdo, footer, 3 idiomas). O projeto foi construído antes dela (specs 0005, 0010-0014) com seções de exemplo, menu com nomes próprios e um blog/loja do começo do projeto. É preciso medir a distância e planejar o que falta, sem desfazer o visual já aprovado.

## 2. Objetivos e não-objetivos
**Objetivos:** matriz item a item com evidência; aderência por seção; divergências; recorte e ordem das specs; perguntas consolidadas.
**Não-objetivos:** implementar; mexer nas specs de pagamento 0007-0009 (adiadas; só apontamos a interação do Shop, seção 7); decidir pela cliente conteúdo/redes/e-mail.

## 3. Estado atual do código (resumo factual)
- Menu: `src/lib/nav.ts:45-53` — ordem about, projects, exhibitions, festivals, books, news(`/blog`), shop(`/loja`); letreiros PNG do cliente em `src/assets/Menu/` (li `Eng_04.png`, `Port_04.png`, `Esp_01.png`: o texto escrito é "Festivals & Residencies", "Festivais & Residências", "Acerca de").
- Rotas "home shell" (HomeHeader/HomeFooter, visual aprovado): `src/app/(home)/(sections)/{projetos,exposicoes,festivais-e-residencias,livros,sobre,contato,praticas/[tipo]}`.
- Rotas "shell antigo" (`SiteHeader`/`SiteFooter` genéricos, `src/app/(public)/layout.tsx:1-11`): `/blog`, `/loja`, `/carrinho`; `/conta` também usa `SiteHeader` (`src/app/(private)/conta/layout.tsx:6,15`). Textos fixos em português (`loja/page.tsx` e `blog/page.tsx`: zero chamadas `t(`).
- Conteúdo: `src/lib/content/index.ts:30-48` gera **3 entradas de exemplo por seção** (chaves i18n `content.<seção>.N.*`); detalhes longos só para projetos e residências (`projects.ts`, `residencies.ts`, tipo `Localized` em `details.ts:7`). Exposições e livros não têm página de detalhe.
- Banco (`prisma/schema.prisma`): só `Product`, `Post`, `Category(kind PRODUCT|POST)`, `Order*`, `User`, `Subscriber`, `ContactMessage`, `AuthAttempt`. Não há modelo para projetos/exposições/residências/livros.
- Idioma: cookie `locale` + `router.refresh()` (`src/contexts/language-context.tsx:31-38`); `<html lang>` vem do cookie (`src/app/layout.tsx:46-52`). Mesmo URL para os 3 idiomas.
- Footer: `src/components/home/home-footer.tsx` (tagline "arte é vida", links só se `SITE` tiver `href`; redes vazias por decisão da 0013, `src/lib/site.ts:8`; `© {SITE.name}` = "Loja & Blog", `site.ts:7`); `src/components/site-footer.tsx` (hard-coded "Loja & Blog").
- Dashboard: CRUD só de produtos, posts, categorias, mensagens (`src/app/(private)/dashboard/*`).

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/02-guides/internationalization.md` | 16.4.3 | Padrão oficial: locale em sub-caminho via `proxy.ts` + `app/[lang]`; `hasLocale` + `notFound()`; `next/root-params` para ler `lang` | Não. Confirma que **não há** `i18n` na config do App Router |
| `.../03-api-reference/04-functions/next-root-params.md` | 16.4.3 | `lang()` só em Server Components (não em Server Actions/Route Handlers); exige `[lang]` acima do root layout | Limitação nova: ações não podem usar `lang()` |
| `.../04-functions/generate-metadata.md` (`alternates.languages`, `metadataBase`) | 16.4.3 | `hreflang` e canonical saem do `metadata` | Não |
| `.../03-file-conventions/01-metadata/sitemap.md` | 16.4.3 | `sitemap.ts` com `alternates.languages` por URL | Não |

Docs específicas (proxy, route groups, estáticos/ISR) são lidas **nas specs que as usam** (0017).

## 5. Alternativas
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Uma spec gigante "alinhar ao briefing" | Um portão só | Revisão inviável; mistura rota, banco, visual |
| B | **Sete specs coesas (0016-0022) com dependências explícitas** | Cada uma revisável e testável; permite entregar a estrutura antes do conteúdo | Mais portões de aprovação |
| C | Só corrigir nomes do menu e footer | Barato | Não entrega a exigência central (arquivo de conteúdo e CRUD simples) |

**Recomendação: B**, com a ordem da seção 8.

## 6. Matriz de conformidade
Legenda: ✅ segue · 🟡 parcial · ❌ falta · ⚠️ contradiz o briefing.

### 6.1 Menu principal (briefing §1)
| # | Requisito | Status | Evidência | Ação (spec) |
|---|---|---|---|---|
| 1.1 | 7 seções no menu | ✅ | `nav.ts:45-53` | — |
| 1.2 | Ordem: Projects, Exhibitions, Residencies & Events, News, Books, Shop, About | ⚠️ | About é o **1º** (`nav.ts:46`); News antes de Books no briefing, mas Books vem antes de News (`:50-51`) | 0016 |
| 1.3 | "RESIDENCIES & EVENTS / RESIDÊNCIAS E ENCONTROS / RESIDENCIAS Y ENCUENTROS" | ⚠️ | "Festivals & Residencies / Festivais & Residências / Festivales & Residencias" (`i18n.ts:76,309,539`); rota `/festivais-e-residencias`; **o letreiro PNG** `Eng_04/Port_04/Esp_04` tem o nome antigo desenhado | 0016 (depende de arte nova da cliente) |
| 1.4 | NEWS/NOTÍCIAS/NOTICIAS aponta para o arquivo editorial | 🟡 | nome certo (`i18n.ts:78,311,541`), mas leva a `/blog` no shell antigo, sem as 3 categorias | 0016 + 0019 |
| 1.5 | ABOUT = "Sobre mí" em ES | ⚠️ | ES = "Acerca de" (`i18n.ts:536`) e o letreiro `Esp_01.png` diz "ACERCA DE" | 0016 (arte nova) |
| 1.6 | PT "SHOP" mantido | ✅ | `i18n.ts:79` | — |
| 1.7 | CONTATO fora do menu, só no footer | ✅ | não está em `MENU_ITEMS`; link em `SITE.footerLinks` (`site.ts:14-20`) | — |
| 1.8 | Dropdown "Práticas" e `/praticas/*` não existem no briefing | ⚠️ | `home-header.tsx:31`, `practice-nav.tsx`, `praticas/[tipo]/page.tsx`, specs 0012/0014 | 0016 |
| 1.9 | Categorias de Projects = Art & Research / Art Commissions / Design & Visual Identity | ⚠️ | O tipo `PracticeId` é drawing/ceramic/collage (`details.ts:15`) | 0016 (remover) + 0018/0019 (categorias reais) |

**Proposta para Práticas (decisão do humano, default D1):** (a) **remover** o dropdown do header e a rota `/praticas/*` com **redirect 308 para `/projetos`** (a filtragem por prática não tem equivalente no briefing; os 3 itens eram conteúdo de exemplo, sem links reais publicados); (b) migrar: reaproveitar `PracticeGallery` como visual da galeria de categoria em Projects; (c) manter como filtro extra "técnica" — rejeitado: contradiz "evitar muitos níveis" (§9) e duplicaria categorias.

### 6.2 Navegação por seção (briefing §9)
| # | Requisito | Status | Evidência | Spec |
|---|---|---|---|---|
| 2.1 | Página de entrada por seção | ✅ | 5 páginas `(sections)`; `/loja` e `/blog` em outro shell | 0016/0019 |
| 2.2 | Categorias como filtros/abas horizontais, "ver todos" ou uma categoria | ❌ | `ContentGrid` sem filtro (`content-grid.tsx`); `/blog` e `/loja` têm chips por `?categoria=` (únicos com filtro, shell antigo, em português fixo) | 0019 |
| 2.3 | Cronologia (Exhibitions, Residencies & Events, News, Books) e curadoria em Projects | 🟡 | Só exposições usam `YearList` com 3 anos fixos (`index.ts:35`); livros/residências em ordem do array; blog por `createdAt` | 0018/0019 |

### 6.3 Modelos de conteúdo e páginas individuais
| # | Requisito | Status | Evidência / lacuna | Spec |
|---|---|---|---|---|
| 3.1 | Projects: título, ano/período, descrição, galeria, materiais/técnicas, créditos, links relacionados | 🟡 | Detalhe tem título, meta (ano·local em i18n), summary, body, galeria (`details.ts:30-37`). Faltam materiais, créditos, links a exposições/publicações/eventos | 0018/0019 |
| 3.2 | Projects: 15 itens em 3 categorias | ❌ | 3 itens de exemplo, sem categoria | 0022 |
| 3.3 | Exhibitions: solo/group, itinerantes com várias apresentações, curadoria, obras, links | ❌ | Lista de 3 exemplos, sem detalhe, sem categoria, sem itinerância (`exposicoes/page.tsx`) | 0018/0019 |
| 3.4 | Residencies & Events: Residências / Festivais / Encontros, natureza da participação, links | 🟡 | Detalhe de residência existe com `credits`; sem categorias nem campos de instituição/local/natureza | 0018/0019 |
| 3.5 | News: Publications / Talks & Workshops / Press & Writing; veículo, link externo, créditos | 🟡 | `Post` (título, excerpt, conteúdo, capa, categoria) com CRUD no dashboard; sem 3 categorias seed, sem veículo/link externo/créditos, sem i18n por campo | 0018/0019 |
| 3.6 | Books: Authored / Illustrated, capa, autores, editora, ano, páginas internas, **sem venda** | ❌ | 3 exemplos sem detalhe; ok o fato de não haver compra | 0018/0019 |
| 3.7 | Books → Shop quando existir produto | ❌ | Sem relação livro↔produto | 0020 |
| 3.8 | Shop: 4 categorias; imagens, título, descrição, dimensões/materiais, nº da edição, preço, disponibilidade, envio | 🟡 | `Product` tem nome, descrição, preço, 1 imagem, estoque, categoria livre (`schema.prisma:Product`); falta galeria, dimensões, materiais, edição, 3 idiomas, info de envio; categorias são livres (sem as 4) | 0020 |
| 3.9 | About: biografia, statement, CV (ver/baixar), contato | 🟡 | `about-content.tsx`: bio e "artist" (texto), botão CV só com `SITE.cvUrl` (undefined, `site.ts:10`); sem bloco de contato com e-mail; textos são exemplo (`page.about.subtitle`) | 0021 |
| 3.10 | "Adicionar itens de forma simples" | ❌ | Dashboard sem CRUD para 4 das 5 seções; conteúdo em arquivos TS exige deploy (`index.ts:10-13`) | 0018 |

### 6.4 Relações entre seções (§9)
| # | Requisito | Status | Evidência | Spec |
|---|---|---|---|---|
| 4.1 | Links internos sem duplicar (Mural: Projects ↔ Exhibitions; livro → Shop; workshop → Projects) | ❌ | Nenhum campo de relação; `otherResidencies` só lista irmãs (`lookup.ts:35-43`) | 0018 (tabela de links) + 0019 (UI) |

### 6.5 Footer (§8)
| # | Requisito | Status | Evidência | Spec |
|---|---|---|---|---|
| 5.1 | Em todas as páginas | 🟡 | Existe em `(home)` e `(public)`; **ausente** em `(auth)` (login/cadastro/destino), `/conta` (usa só header), dashboard, `not-found`/`global-error` | 0016 |
| 5.2 | Contato = e-mail com link (`mailto:`) | ❌ | Link aponta para `/contato` (formulário), sem e-mail visível (`site.ts:18`) | 0016 |
| 5.3 | Instagram / Facebook | ❌ | `SITE.social = {}` (`site.ts:8`; decisão 0013 pendente) | 0016 |
| 5.4 | Localização "Salvador, Bahia — Brazil" (3 idiomas) | ❌ | Inexistente | 0016 |
| 5.5 | Copyright / crédito de desenvolvimento | 🟡 | "© ano Loja & Blog" (`site.ts:7`; `site-footer.tsx:9`); crédito vazio | 0016 |
| 5.6 | Visível e acessível em desktop e mobile | 🟡 | Alvos já ≥2,75rem (`home-footer.tsx:8`); falta verificar com o novo conteúdo | 0016 |

### 6.6 Idiomas (§9)
| # | Requisito | Status | Evidência | Spec |
|---|---|---|---|---|
| 6.1 | 3 idiomas, mesma estrutura | ✅ | `LOCALES` (`i18n.ts:1`); 3 dicionários | — |
| 6.2 | Troca mantém a página atual | 🟡 | Cookie + `router.refresh()` mantém **o mesmo URL** (comportamento do briefing atendido na prática) | — |
| 6.3 | URL por idioma, SEO, compartilhamento | ❌ | Mesmo URL serve 3 idiomas: não indexável por idioma, sem `hreflang`, `<html lang>` dependente de cookie, todas as páginas dinâmicas (lê `cookies()` no root layout, `layout.tsx:46`). Rotas só em português (`/projetos`, `/festivais-e-residencias`) | 0017 |
| 6.4 | Conteúdo longo nos 3 idiomas | 🟡 | `Localized` obrigatório nos arquivos de exemplo; Post/Product/Category em um idioma só | 0018/0020 |

### 6.7 Apresentação visual (§9)
| # | Requisito | Status | Evidência | Spec |
|---|---|---|---|---|
| 7.1 | Prioridade a imagens (Projects, Exhibitions, Books) | 🟡 | Projects usa `ContentCard` com capa; Exhibitions é só lista de texto (`YearList`); Books sem capa real | 0019 |
| 7.2 | Books = biblioteca visual | ❌ | Mesma grade genérica de Projects | 0019 |
| 7.3 | Identidade por seção, coerente | 🟡 | Faixa título + letreiro por seção (`section-page.tsx`); `/loja`, `/blog`, `/carrinho`, `/conta` fora do sistema (0011/0013) | 0016/0019/0020 |

### 6.8 Rotas existentes fora do briefing
| Rota | Situação | Proposta (default) |
|---|---|---|
| `/contato` | Formulário (spec 0012) + `ContactMessage` | **Manter** como página (não está no menu; footer aponta para e-mail). Pergunta P6 |
| `/praticas/*` | ⚠️ Contradiz | Remover, 308 → `/projetos` (0016) |
| `/blog`, `/blog/[slug]` | Vira News | 308 → `/news` (0017/0019). Pergunta P4 |
| `/loja`, `/loja/[slug]` | Vira `/shop` | 308 (0017) |
| `/carrinho`, `/conta`, `/login`, `/cadastro`, `/dashboard`, `/destino` | Áreas funcionais, fora do briefing | Manter sem prefixo de idioma; adotam o shell aprovado (0016/0017) |
| `/em-breve` | Fallback não usado (`em-breve/page.tsx:7`) | Manter até a 0022; depois remover |
| `/festivais-e-residencias` | Nome antigo | 308 → rota nova (0017) |

## 7. Interação do Shop com as specs de pagamento (0007-0009, adiadas)
Não alteradas. Pontos de contato: (i) 0020 muda o modelo `Product` (campos de edição/dimensões/galeria, tradução); a 0007 referencia `Product`/`OrderItem` e o catálogo de preço em centavos — **os campos de dinheiro/estoque ficam intactos** e `createOrder` (recalcula preço/estoque no servidor) não muda; (ii) rotas do checkout (0008/0009) devem nascer já em `/shop/...` ou `/carrinho`, ver 0017; (iii) texto de "informações de envio" do briefing precisa existir antes do checkout nacional. Registrar em 0007 §11 só depois de aprovar a 0020 (humano decide).

## 8. Mapa de specs, dependências e ordem recomendada
| Spec | Escopo | Depende de | Observação |
|---|---|---|---|
| 0016 | Nomes/ordem do menu nos 3 idiomas; remoção de Práticas; footer completo em todas as páginas; shell único | arte nova dos letreiros (ou fallback em texto) | pequena; entrega valor visível já |
| 0017 | Idioma por URL (`/pt|en|es/...`), redirects, hreflang, sitemap | 0016 (nomes) | grande risco estrutural; antes de criar novas rotas |
| 0018 | Modelo de dados de conteúdo + CRUD no dashboard | 0017 (slugs) em paralelo é possível: schema independe de URL | maior spec |
| 0019 | Páginas de seção (abas/filtros) + detalhe por seção | 0017, 0018 | visual 0011/0013/0014 |
| 0020 | Shop (4 categorias, campos, Books → Shop) | 0017, 0018 (links), 0019 (padrão de abas) | não toca em pagamentos |
| 0021 | About (bio, statement, CV, contato) | 0016 (footer/contato), 0018 (upload CV) | pode rodar em paralelo à 0019 |
| 0022 | Conteúdo inicial, a11y, SEO, i18n final | 0018-0021 | depende de links/arquivos da cliente |

**Ordem:** 0016 → 0017 → 0018 → 0019 → (0020 ∥ 0021) → 0022. Primeira entrega útil e barata: 0016.

## 9. Resumo executivo
**Aderência aproximada** (itens ✅=1, 🟡=0,5, ❌/⚠️=0, sobre a matriz; estimativa, não métrica oficial):
| Seção | Aderência | Principal lacuna |
|---|---|---|
| Menu e nomes | ~55% | ordem, "Residências e Encontros", "Sobre mí", letreiros |
| Projects | ~25% | sem categorias, filtros, campos, CRUD; Práticas contradiz |
| Exhibitions | ~10% | sem detalhe, categorias, itinerantes |
| Residencies & Events | ~20% | nome e 3 categorias; detalhe existe |
| News | ~20% | blog fora do visual, sem i18n, sem 3 categorias |
| Books | ~10% | sem detalhe/categorias/biblioteca visual |
| Shop | ~35% | funciona; shell antigo, campos e 4 categorias |
| About | ~50% | falta contato e CV real; textos de exemplo |
| Footer | ~30% | sem e-mail, redes, localização; falta em várias páginas |
| Idiomas | ~60% | funcional por cookie; sem URL por idioma |
| **Geral** | **~30%** | **estrutura existe; conteúdo/dados/CRUD não** |

**Cinco maiores divergências:**
1. **Não existe modelo de conteúdo nem CRUD** para Projects, Exhibitions, Residencies e Books (e a exigência "adicionar itens de forma simples" não é atendida): conteúdo é exemplo em TS.
2. **"Práticas" (0012/0014) contradiz** o briefing: categorias reais de Projects são outras; categorias/abas não existem em nenhuma seção nova.
3. **Menu**: About em 1º, "Festivais & Residências" no lugar de "Residências e Encontros", ES "Acerca de" no lugar de "Sobre mí" — e os nomes antigos estão **desenhados nos PNG** da cliente (exige arte nova).
4. **Footer** sem e-mail com link, redes e "Salvador, Bahia — Brazil"; "© Loja & Blog"; ausente em login/conta/erros. **Loja, Blog, Carrinho e Conta** ainda usam o shell antigo, em português fixo.
5. **Idioma sem URL**: mesmo endereço para 3 línguas (sem hreflang/SEO, tudo dinâmico) e rotas só em português; Exhibitions sem itinerantes/detalhe e Books sem biblioteca visual.

## 10. Segurança e permissões
N/A nesta spec (relatório). Cada spec seguinte tem a própria matriz. Alerta já identificado: toda nova action de conteúdo precisa de `requireAdmin()` (padrão `src/actions/guard.ts`) e rotas de upload seguem somente-ADMIN.

## 11. Plano de testes
N/A (sem código). Cada spec define os seus. Responsivo (360/390/768/1280) e axe seguem o padrão de `e2e/pages.spec.ts`.

## 12. Plano de implementação
Ver seção 8. Cada spec tem passos próprios; nenhuma começa sem `approved` humano.

## 13. Riscos, rollback e dívidas
- Risco maior: **0017 muda todas as URLs** (SEO/links externos) e exige dois root layouts; mitigado por redirects 308 e faseamento.
- Risco de escopo: 0018 é grande; dividida em fases (schema+leitura, depois CRUD).
- Dependência externa: arte dos letreiros, textos oficiais, e-mail, redes, links dos itens "website/pasta no drive".

## 14. Perguntas em aberto (consolidadas; defaults para o humano decidir)
Ver bloco único ao final do relatório do agente e a seção 11 de cada spec. Resumo: P1 links reais; P2 conteúdo inicial agora ou só a estrutura; P3 Práticas; P4 Blog → News; P5 letreiros novos; P6 `/contato`; P7 redes/e-mail/nome do site; P8 idioma por URL; P9 textos oficiais das categorias; P10 dashboard no footer.

## 15. Checklist da review humana
- [ ] Diagnóstico e evidências conferidos
- [ ] Recorte 0016-0022 e ordem aceitos
- [ ] Decisão sobre Práticas (D1) tomada
- [ ] Perguntas respondidas

## 16. Registro de aprovação
<Humano.>

## 17. Relatório pós-implementação
N/A (spec de auditoria).
