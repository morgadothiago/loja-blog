---
id: 0020
title: Shop — 4 categorias, campos do briefing, 3 idiomas, visual do site e ligação Books → Shop
status: approved
layers: [front, back, db]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0020 — Shop do briefing

## 1. Contexto e problema
Briefing §06: loja de obras originais, impressões/edições, livros e objetos; categorias **só quando o acervo crescer**; cada produto com imagens, título, descrição, dimensões e materiais (quando aplicável), nº da edição (quando aplicável), preço, disponibilidade e info de compra/envio. Livros (Books) não são vendidos na seção Books; a página do livro linka para o Shop quando existir produto. Hoje `/loja` está no shell antigo, em português fixo (`src/app/(public)/loja/page.tsx`, zero `t(`), com categorias livres (`Category kind PRODUCT`) e `Product` com 1 imagem e sem dimensões/materiais/edição.

## 2. Objetivos e não-objetivos
**Objetivos:** rota `/[lang]/shop` no visual aprovado; 4 categorias fixas com abas **apenas quando houver ≥2 categorias com produto publicado** (regra do "sem muitas subdivisões" no início); campos novos; textos nos 3 idiomas; galeria; disponibilidade clara (única/edição/estoque); informações de envio; dashboard de produtos com os campos novos; link Books → Shop (e volta).
**Não-objetivos (adiados, **não tocar**):** gateway, Pix, cartão, webhook, pedidos pagos (specs 0007–0009). `createOrder` e a regra "preço e estoque recalculados no servidor, decremento condicional" **permanecem como estão**. Frete calculado/CEP, cupom, estoque por variação.

## 3. Estado atual do código
`prisma/schema.prisma` (`Product`: `name`, `slug`, `description`, `priceCents`, `imageUrl`, `stock`, `published`, `categoryId`), `src/app/(public)/loja/{page,[slug]/page,loading}.tsx`, `src/components/add-to-cart-button.tsx`, `src/contexts/cart-context.tsx`, `src/actions/{products,orders,categories}.ts`, `src/components/dashboard/product-form.tsx`, `src/app/(private)/dashboard/produtos/*`, `src/lib/utils-app.ts` (`formatPrice`), `src/auth.config.ts` (carrinho exige login), `tests/crud-orders-actions.test.ts`, `tests/cart-guard.test.ts`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| Código do projeto (acima) | repo | Dinheiro em centavos; `createOrder` em transação | Não |
| `next/dist/docs/.../dynamic-routes.md`, `generate-static-params.md` | 16.4.3 | A ler no passo 0 (mesmas rotas por idioma da 0017/0019) | — |
| Prisma 6 migrations (`prisma migrate dev`) | 6.19.3 | Coluna aditiva e backfill em duas migrations; **não consultei a doc online nesta spec** | A confirmar |
| Specs 0007–0009 (leitura) | aprovadas/adiadas | Dependem de `Product.priceCents` e `OrderItem` | Ver §7 |

## 5. Alternativas
**5.1 Categorias**
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Manter `Category(kind PRODUCT)` livre | Zero migração | A cliente cria categorias fora do briefing; nome em 1 idioma; sem as 4 fixas |
| B | **Constante `SHOP_CATEGORIES` (4 slugs, rótulos Localized) + coluna `Product.shopCategory String?`** (mesmo padrão da 0018) | Coerente com o briefing e 3 idiomas; abas previsíveis | Nova categoria = mudança de código |
| C | Seed das 4 em `Category` e `name` Json | Sem coluna nova | `Category` é compartilhada com posts; mexe em tabela antiga |
**Recomendação: B.** `Product.categoryId`/`Category kind PRODUCT` ficam **deprecados** (sem apagar) e são migrados por slug no script de backfill; remoção em spec futura.

**5.2 Traduções do produto**
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Trocar `name/description` por `Json` | Uniforme com 0018 | Quebra `createOrder` (copia `name`), `OrderItem.name`, testes e specs 0007–0009 |
| B | **Manter `name`/`description` (idioma base, usados por pedidos/dashboard) e adicionar `translations Json?` `{ en:{name,description,materials,dimensions}, es:{…} }`** | Não toca em pedidos; migração aditiva; fallback ao base | Dois lugares para texto |
**Recomendação: B** (mudança mínima; protege a regra de preço/estoque e as specs de pagamento). O idioma base é pt-BR (decisão: Q).

**5.3 Disponibilidade**
Derivada, sem campo novo: `stock > 0` → "Disponível"; `stock = 0` → "Esgotado"/"Vendido" (obras únicas: `kind` ORIGINAL com estoque 1 → "Disponível"/"Vendida"); textos nos 3 idiomas. Reserva de estoque durante pagamento é da 0007 (não alterar).

## 6. Design proposto
### 6.0 Referências e direção visual
Mesma linguagem do site (0011/0013/0019). A referência `spec/references/loja-blog-atual.png` documenta o estado antigo; **não há referência da cliente para a loja** — direção proposta a partir dos tokens: cartões como `ContentCard` (imagem em primeiro, título, preço em destaque), ficha de produto em 2 colunas (galeria | dados), faixa de cor da seção.

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Loja e blog fora do sistema visual e sem i18n | `loja/page.tsx` | alta | migrar ao shell novo (0016) e a chaves i18n |
| 2 | Carrinho exige login (`/carrinho` só logado) antes de qualquer compra | `src/auth.config.ts` (rota `/carrinho`) | média | **apenas registrar**: mudar é decisão de produto/pagamentos (0008); não alterar aqui |
| 3 | Preço e disponibilidade precisam aparecer sem abrir o produto | briefing §06 | média | no cartão: preço (`Intl`), "Esgotado" textual (não só cor) |
| 4 | Uma imagem por produto (`imageUrl`) não atende "imagens dos produtos" | schema | alta | tabela `ProductImage` (galeria ordenada, `alt` por idioma) |
| 5 | Info de envio inexistente | briefing §06 | média | bloco "Compra e envio" com texto global nos 3 idiomas (texto da cliente: Q) |
| 6 | Abas com 4 rótulos longos em 360 | rótulos EN/ES | média | mesmo `CategoryTabs` da 0019 |

### 6.1 Frontend
- **Rotas:** `/[lang]/shop` (todos), `/[lang]/shop/category/[category]` (existe só para categorias com produtos publicados), `/[lang]/shop/[slug]`; `loading.tsx`, `not-found.tsx`. Carrinho/`/conta/pedidos` continuam sem prefixo (0017) e adotam o shell da 0016.
- **Árvore:** `ShopPage` (Server) → `CategoryTabs` (só se ≥2 categorias com itens) → `ProductGrid` → `ProductCard`; detalhe: `ProductGallery` → `ProductFacts` (`dl`: dimensões, materiais, edição, disponibilidade) → `AddToCartButton` (Client, existente) → `ShippingInfo` → `BookLink` (se houver livro no portfólio ligado a este produto: "Ver o livro →").
- **Estados:** loja vazia ("Em breve"), categoria vazia, esgotado (botão desativado, texto), erro/loading.
- **Responsivo:** grade 2 col (360), 3 (≥768), 4 (≥1280); detalhe 1 col (galeria acima) → 2 col em ≥1024; botão de comprar fixo ao fim da ficha (não sticky em 360 para não cobrir conteúdo).
- **A11y:** `h1` por página; preço com `<data>`/texto; botão ≥2,75rem; `alt` por imagem; contraste conferido; erro de "adicionar ao carrinho" via contrato 0003.
- **i18n:** `t()` para tudo da UI; textos do produto por `translations` com fallback ao base.

### 6.2 Backend
**Schema (aditivo; valores em `String` + Zod):**
```prisma
model Product {
  // … campos atuais inalterados (name, description, priceCents, stock, published, categoryId, imageUrl)
  shopCategory String?   // ORIGINAL | PRINTS | BOOKS | OBJECTS (slugs: original-artworks, prints-editions, books, objects-special-editions)
  translations Json?     // { en?: {name?, description?, materials?, dimensions?}, es?: {…} }
  materials    String?   // idioma base
  dimensions   String?   // idioma base, ex.: "30 × 40 cm"
  edition      String?   // ex.: "3/20" ou "Edição única"
  images       ProductImage[]
  contentItems ContentItem[]   // livros ligados (0018 shopProductId)
}
model ProductImage { id String @id @default(cuid()); productId String; product Product @relation(fields:[productId],references:[id],onDelete:Cascade); url String; alt Json?; sortOrder Int @default(0); @@index([productId, sortOrder]) }
```
`Product.imageUrl` continua como capa (compatibilidade com carrinho/pedidos); a galeria é a nova tabela (a capa pode ser a 1ª). **Backfill:** migration SQL/script que mapeia `Category.slug` → `shopCategory` por tabela explícita (slugs desconhecidos ficam `null` = aparecem só em "Todos").
**Actions:** `createProduct/updateProduct` (existentes, `requireAdmin`) estendidos com Zod para os campos novos (limites: dimensions/materials/edition ≤120; translations ≤2000/idioma; ≤12 imagens); nova `reorderProductImages`. `createOrder` **não muda**.
**Cache:** `revalidatePath`/tag `shop` nas actions.
**Books → Shop:** campo `ContentItem.shopProductId` (0018) editável no dashboard do livro (seletor de produtos publicados); a página do livro só mostra o link se o produto estiver `published` (e mostra o estado "esgotado" lá, sem preço). **Sem venda na seção Books**: nenhum botão de compra, só link.

### 6.3 Compatibilidade vinext
Sem recurso novo; Prisma/Azure já listados na 0007 §6.3.

## 7. Segurança e permissões e interação com 0007–0009
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ver loja/produto publicado | sim | sim | sim | `published: true` |
| Editar produto/galeria/categoria | não | não | sim | `requireAdmin()` |
| Comprar | não | sim | sim | `requireUser()` + `createOrder` inalterado |
- **Pagamentos:** o preço continua só em `priceCents`; nenhum campo novo é lido por `createOrder`; `OrderItem.name` segue copiando `Product.name` (idioma base). Se a 0007 for implementada depois, ela herda `shopCategory`/galeria sem conflito. Itens para registrar na 0007 (humano decide): disponibilidade de **obra única** (estoque 1) precisa de reserva durante o pagamento; informação de envio deve existir antes do checkout.
- Validação Zod no servidor; `translations` e `images.url` com allowlist do host Azure; sem HTML.
- Rate limit: sem novo (checkout pertence à 0008).

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Zod dos campos novos (limites, categoria inválida) | unit | rejeita |
| 2 | Backfill de categoria (tabela de mapeamento) | integração | slugs conhecidos mapeados, desconhecidos `null` |
| 3 | `createOrder` com produto com campos novos | integração | totais e estoque idênticos aos de hoje (regressão) |
| 4 | Estoque concorrente (já existe) | integração | continua passando |
| 5 | CUSTOMER/anônimo em actions de produto | integração | FORBIDDEN/UNAUTHENTICATED |
| 6 | Abas só com ≥2 categorias com itens | componente | 0–1 → sem abas |
| 7 | Esgotado: botão desativado e texto | componente | ok |
| 8 | Fallback de tradução do produto | unit | en vazio → base |
| 9 | Book com produto publicado/despublicado | componente | link presente/ausente |
| 10 | 360/768/1280, axe, teclado | e2e | sem rolagem horizontal; zero serious/critical |

## 9. Plano de implementação
0. Ler docs (rotas, Prisma migrate) e conferir `tests/crud-orders-actions.test.ts`. 1. Migration aditiva + backfill. 2. Zod e actions estendidas + testes. 3. Dashboard (`product-form`: campos, abas de idioma, galeria). 4. Páginas `/shop` no shell novo, i18n. 5. `BookLink`/ligação com 0018. 6. e2e e capturas. 7. Verificação final (`tsc`, `eslint`, vitest, playwright, `next build`).

## 10. Riscos, rollback e dívidas
- Risco: regressão em pedidos → teste 3/4 obrigatórios antes de merge.
- Rollback: migration aditiva; colunas novas podem ficar sem uso.
- Dívidas: `Category(kind PRODUCT)` deprecada; frete calculado; variações; texto de envio provisório.

## 11. Perguntas em aberto
- [ ] Texto oficial "Compra e envio" nos 3 idiomas: **default** texto neutro provisório marcado como pendente.
- [ ] Idioma-base dos produtos: **default** pt-BR.
- [ ] Mostrar preço também em outra moeda para en/es? **default** não (BRL, `Intl` por idioma; pagamentos adiados).
- [ ] Os 4 produtos/obras iniciais existem? **default** só estrutura (0022).
- [ ] Carrinho exige login (fora do escopo): registrar para a 0008.

## 12. Checklist da review humana
- [ ] Categorias fixas (5.1-B) e `translations` (5.2-B) aceitas
- [ ] Interação com 0007–0009 entendida
- [ ] Migration revisada
- [ ] Testes de regressão do `createOrder` exigidos
- [ ] Perguntas respondidas

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
