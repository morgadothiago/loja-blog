---
id: 0022
title: Conteúdo inicial do briefing, fechamento de acessibilidade, SEO e i18n
status: approved
layers: [db, back, front]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0022 — Conteúdo inicial + fechamento (a11y, SEO, i18n)

## 1. Contexto e problema
O briefing lista **57 itens** (contagem abaixo), cada um marcado "(website)" ou "(pasta no drive)" **sem links reais** (nota final do briefing). Sem importar a lista, as seções ficam vazias depois de 0018/0019; importando sem material, aparecem cartões sem imagem nem texto. Além disso é preciso fechar a qualidade transversal: remover o rótulo "Conteúdo de exemplo", textos/rotas antigas, metadata genérica ("Loja & Blog", `src/app/layout.tsx:36-39`), sitemap, a11y e i18n.

## 2. Objetivos e não-objetivos
**Objetivos:** (1) importar os 57 títulos do briefing como **rascunhos** com categoria, ano/local quando o briefing informa e links entre itens confirmados; (2) quando a cliente enviar material, preencher via dashboard (não via código); (3) auditoria final de a11y/SEO/i18n/responsivo; (4) remover código e textos de exemplo.
**Não-objetivos:** inventar descrições, imagens ou links; traduzir descrições (títulos são nomes próprios); publicar item sem imagem de capa e texto mínimo (default: **publicação é decisão da cliente**).

## 3. Estado atual do código
`prisma/seed.ts` (guard `ALLOW_DEV_SEED=1`), `src/lib/content/*` (exemplo), `i18n.ts` (`content.*` exemplo, `content.example`), `src/components/sections/section-page.tsx` (mostra `t("content.example")`), `src/app/(home)/em-breve/page.tsx`, `e2e/*.spec.ts`, `tests/*`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `…/01-metadata/sitemap.md`, `robots.md`, `generate-metadata.md` (`alternates`, `openGraph`) | 16.4.3 | Convenções de metadata; sitemap com `alternates.languages` | Não |
| `…/01-metadata/opengraph-image.md` | 16.4.3 | Existe (OG por rota); leitura integral no passo 0 | A ler |
| Briefing | 2026-10-29 | Lista de itens e categorias | — |
| WCAG 2.2 AA (critérios citados nas specs) | — | Metas: 1.4.3, 2.4.7, 2.5.8 (alvo mínimo), 1.1.1 | — |

## 5. Alternativas
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Cadastrar 57 itens à mão no dashboard | Sem código | Trabalhoso, erro humano, sem rastreio |
| B | **Importador idempotente a partir de um arquivo de dados versionado (`prisma/data/content-initial.json`), upsert por `(section, slug)`, tudo `published=false`** | Reprodutível, revisável em PR, reexecutável | Script a manter (descartável depois) |
| C | Só a estrutura, sem itens | Zero risco de inventar | Seções vazias; não "mostra" a arquitetura |
**Recomendação: B** (Q2: confirmar que o conteúdo entra agora). Alternativa de menor risco: C até a cliente enviar material. O script **não** roda no deploy; é comando manual (`npm run content:import`, novo script em `package.json`, previsto aqui) com guard de ambiente explícito (como o seed).

## 6. Design proposto
### 6.0 Referências e direção visual
N/A (sem UI nova). Crítica transversal:

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Item publicado sem imagem/texto parece quebrado | briefing sem material | alta | sem capa → `PlaceholderArt` existente só em rascunho/preview; publicação bloqueada sem capa e `alt` (validação no 0018) |
| 2 | Títulos repetidos em seções (briefing) devem **linkar**, não duplicar | §9 do briefing | média | ver tabela de links (inferidos, a confirmar) |
| 3 | `metadata` raiz "Loja & Blog" | `layout.tsx:36-39` | média | nome do site de `SiteSettings` (0021) |
| 4 | Rótulo "Conteúdo de exemplo" visível ao público | `section-page.tsx` | alta | remover quando houver conteúdo real |

### 6.1 Frontend
Sem componente novo. Auditoria: axe e responsivo em **todas** as rotas públicas × 3 idiomas × 360/390/768/1280; remoção de `src/lib/content/{index,details,projects,residencies,lookup}.ts`, `home-stories.ts` se obsoleto, chaves `content.*`/`practice.*`/`content.example`, `em-breve`, `PlaceholderArt` se não usada.

### 6.2 Backend / dados
**Inventário (contagem do briefing):** Projects 17 (A=5, B=5, C=7) · Exhibitions 7 (solo 2, grupo 5) · Residencies & Events 14 (residências 7, festivais 3, encontros 4) · News 9 (publicações 1, palestras/oficinas 5, imprensa 3) · Books 10 (autorais 2, ilustrados 8) = **57**.

**Regras do importador:**
- `slug` = slug ASCII do título (+ ano se colidir); `title` = o título do briefing replicado nos 3 idiomas (nomes próprios; a cliente corrige); `category` pelo bloco; ano/cidade/país extraídos **somente** do texto do briefing (ex.: "Residencia Floresta, Salvador, Brazil, 2023"; intervalo "2009-2014"); onde não há ano (ex.: "Ventanas de Mares", "Alquemical Vessels"), `startDate = null` (**ordenar com `nulls last`**, ver ajuste na 0018) e `datePrecision` irrelevante.
- Observação de origem ("website"/"drive") guardada em campo **interno** `details.sourceNote` (e `details.importBatch = 'briefing-2026-10-29'`), visível só no dashboard (para a equipe localizar o material), nunca no público.
- Itinerante "More Than Human" (Design Museum London 2025; Zurich 2026) → 1 item + 2 `ContentStop`.
- "The Exhibition, Moth Festival of Ideas, 2025. NYU University, 2025" → 1 exposição com 1 apresentação (briefing lista dois locais/anos: confirmar se são duas apresentações).
- `published=false` em todos; `authorId` = o ADMIN indicado por e-mail no comando.

**Links entre seções (INFERIDOS pelos nomes; a cliente confirma, nada é criado como verdade sem Q):**
| Item A | Item B | Motivo |
|---|---|---|
| Projects/Art Commissions: MOTH Mural | Exhibitions/Group: obras do "MOTH Rights Mural" (briefing §02B, §09) | exemplo explícito do briefing |
| Books/Illustrated: Jack y el gigante Capuchino | Projects/Design: Jack y el gigante Capuchino | mesmo título |
| Projects/Design: Wondrous Relations | Residencies/Festival: Wondrous Relations, Cologne 2026 | mesmo título |
| Exhibitions: More Than Human | News/Publications: More Than Human; News/Talks: "More Than Human, Design Museum, 2025 — Talk" | mesmo título |
| Exhibitions: The Exhibition, Moth Festival of Ideas, NYU 2025 | Residencies/Festival: MOTH Festival of Ideas, NYU 2025 | mesmo evento |
| Residencies/Gatherings: MOTH Gathering/Academic Course (4) | Projects/Art Commissions: MOTH Mural; Projects/Design: MOTH WORLD | "encontros ligados a projetos mais amplos" (briefing §03) |
| Projects/Design: Festival de Jazz do Capão 2024; Residência São João | itens homônimos em Residencies/News, se existirem | verificar |
| News/Talks: workshops (Vestindo os Erês, Viagem no Tempo, Dibujando con el corazón) | Projects relacionados, se houver | briefing §04 (opcional) |
O arquivo de dados inclui `links` **vazios por padrão**; os da tabela só entram se confirmados (Q1b).

**SEO/Metadata:** `metadataBase` (variável `NEXT_PUBLIC_SITE_URL`), `robots.ts`, `sitemap.ts` (0017), OG image por item (capa; fallback logo), `noindex` em rascunho e em `/em-breve` removido. Canonical por idioma. **Limite:** JSON-LD fica fora.

**i18n:** auditoria "chave a chave" (teste que compara as chaves dos 3 dicionários e falha se faltar); revisão humana dos textos da UI em en/es; `<html lang>` por idioma (0017); datas/valores por `Intl`; títulos de página nos 3 idiomas.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Rodar importador | não | não | só via CLI | env guard + `authorId` por e-mail existente com role ADMIN |
| Ver rascunho | não | não | sim (dashboard) | `published` |
- O importador não aceita input externo além do arquivo versionado; não loga conteúdo; não toca em `User`/`Order`. Sem rede.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Importador: 57 itens, contagem por seção/categoria | integração | 17/7/14/9/10 e categorias corretas |
| 2 | Idempotência (rodar 2×) | integração | sem duplicar |
| 3 | Itinerante com 2 paradas | integração | ok |
| 4 | Ano e intervalo extraídos; sem ano → `null` e ordenação `nulls last` | unit/integração | ok |
| 5 | Nenhum item publicado após importar | integração | `published=false` |
| 6 | Dicionários pt/en/es com as mesmas chaves | unit | falha se divergir |
| 7 | axe e responsivo (360/390/768/1280) em todas as rotas × 3 idiomas | e2e | zero serious/critical; sem rolagem horizontal |
| 8 | Sitemap lista só publicados/público; rascunho `noindex` | integração/e2e | ok |
| 9 | Sem string "Loja & Blog" / "Conteúdo de exemplo" na saída pública | e2e (grep em páginas) | ausente |

## 9. Plano de implementação
1. `prisma/data/content-initial.json` + validação Zod do arquivo. 2. Importador + `npm run content:import` (guard de env). 3. Testes 1-5. 4. Quando houver conteúdo real: remover arquivos/ chaves de exemplo (lista em 6.1). 5. Metadata/sitemap/OG finais. 6. Auditoria a11y/responsiva com capturas. 7. Teste de paridade de i18n. 8. `tsc`, `eslint`, vitest, playwright, `next build`.

## 10. Riscos, rollback e dívidas
- Risco: importar títulos sem tradução por idioma — aceito (nomes próprios).
- Risco: ano inferido errado — só do texto do briefing; revisão da cliente.
- Rollback: `DELETE` por `details.importBatch = 'briefing-2026-10-29'` (marca de importação) em transação; nunca apaga itens editados pela cliente (checar `updatedAt > createdAt`).
- Dívidas: JSON-LD, OG dinâmicos elaborados, tradução das descrições.

## 11. Perguntas em aberto
- [ ] Q1 Links reais de "website"/"pasta no drive" (57 itens): **default** não existem; o importador guarda só `sourceNote`.
- [ ] Q2 Importar os 57 títulos agora (rascunho) ou só a estrutura? **default** importar como rascunho.
- [ ] Q1b Confirmar os links inferidos da tabela 6.2.
- [ ] "The Exhibition, Moth Festival of Ideas, 2025. NYU University, 2025": duas apresentações ou uma? **default** uma, com nota.
- [ ] Alguns itens aparecem em mais de uma seção (ex.: Jack y el gigante Capuchino): **default** itens separados e **ligados** (sem duplicar texto).
- [ ] Domínio público do site (`NEXT_PUBLIC_SITE_URL`).

## 12. Checklist da review humana
- [ ] Inventário (57) conferido contra o briefing
- [ ] Links inferidos revisados
- [ ] Importar agora ou só estrutura: decidido
- [ ] Perguntas respondidas

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
