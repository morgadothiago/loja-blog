---
id: 0001
title: Home page editorial (hero, banner, histórias recentes, destaque, newsletter, rodapé)
status: implemented
layers: [front, back, db]
owner: Thiago Morgado
created: 2026-10-27
approved_by: Thiago Morgado
approved_at: 2026-10-27
---

# 0001 — Home page editorial

## 1. Contexto e problema
- A home atual (`src/app/(public)/page.tsx:9-46`) é um esqueleto: título + 2 botões + listas "Produtos recentes" / "Últimos posts" em cards crus, dentro de `max-w-5xl p-4` (`src/app/(public)/layout.tsx:8`).
- Pedido: recriar a home com a linguagem da referência `spec/references/elena-home-mobile.png` (portfólio editorial/artesanal, fundo creme, faixa mostarda). Textos em pt-BR (e en/es, pois a área pública é traduzida).
- Não há imagens reais; usar placeholders.
- Fato: a referência é **uma única captura mobile (~390px)**. Não há desktop nem menu aberto no repositório (o `spec/references/README.md` fala de 3 telas, mas só 1 arquivo existe). Comportamento tablet/desktop abaixo é **inferência minha**.

## 2. Objetivos e não-objetivos
**Objetivos**
- Home com as 7 seções da referência, mobile-first, responsiva em 360/768/1024/1280.
- Header com menu hambúrguer e overlay de tela cheia acessível; rodapé com links.
- "Histórias recentes" alimentada pelos posts publicados reais (com fallback de capa).
- Newsletter funcional (ver Perguntas em aberto: escopo do backend).
- i18n pt-BR/en/es em todo texto novo.

**Não-objetivos**
- Redesenhar loja, blog, carrinho, login (só herdam header/footer se a pergunta 2 for "sim").
- Ilustrações/fotos/textos/marca "Elena Landínez" da referência em produção.
- CMS para o conteúdo do bloco de destaque (fica como texto i18n fixo).
- Envio real de e-mail (provedor), double opt-in.
- Tema escuro específico da home (tokens já têm `.dark`; só não regredir).

## 3. Estado atual do código
- `src/app/(public)/page.tsx` — home atual; `force-dynamic`, busca 3 produtos + 3 posts via `db` com `Promise.all`. Reaproveitar a query de posts (adicionar `coverUrl`, `category.name`, `createdAt`).
- `src/components/home-hero.tsx` — hero client com `useI18n`; será substituído.
- `src/components/site-header.tsx:16-41` — nav inline (Loja, Blog, idioma, carrinho, login) sem menu mobile; texto `text-sm`, links sem alvo ≥44px. Usa `useAuth`, `useCart`, `useI18n`.
- `src/components/site-footer.tsx` — 1 linha `text-xs`.
- `src/app/layout.tsx:10-19` — fontes já corretas: Newsreader (corpo, `--font-body`) e Caveat Brush (`--font-display`). Observação: Caveat Brush é um pincel pesado; a referência usa manuscrito mais fino/irregular. Aceitável, ver achado 6.
- `src/app/globals.css:63-108` — tokens de marca (`cream`, `paper`, `salmon`, `mustard`, `ink`, `purple`, `teal`, `coral`, `navy`) e semânticos. `h1,h2,h3` já usam `font-heading` (`globals.css:154-156`).
- `src/lib/i18n.ts` — dicionário tipado `MessageKey` (3 locales, `Record<MessageKey,string>` força paridade). `t` só existe no cliente (`useI18n`); **não há helper de i18n para Server Components**.
- `src/components/ui/button.tsx` (base-ui, sem `asChild`; tamanhos `default` = h-8, `lg` existe) e `input.tsx` (`h-8`, `md:text-sm`) — pequenos demais para os alvos de 44px; precisarão de `className` de override ou `size="lg"` (verificar altura ao implementar).
- `prisma/schema.prisma:54-68` — `Post` tem `coverUrl`, `excerpt`, `category`, `createdAt`. Não há modelo de newsletter.
- Não há infra de testes: `package.json` sem vitest/playwright/testing-library (há `axe-core` apenas como transitivo em `node_modules`; não contar com ele).
- `next.config.ts` não tem `images.remotePatterns`; `coverUrl` vem do Azure Blob (`src/lib/azure-blob.ts`) → precisa liberar o host do blob para `next/image`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md` (l.48, 266-294) | 16.4.3 | `priority` está **deprecated** em favor de `preload`; docs recomendam `loading="eager"`/`fetchPriority="high"` na maioria dos casos. | Sim: eu usaria `priority`. Usar `fetchPriority="high"` no hero. |
| `.../01-getting-started/12-images.md` | 16.4.3 | Imagem remota exige `width`/`height` ou `fill` + `sizes`; hosts remotos exigem configuração. | Não. |
| `.../01-getting-started/05-server-and-client-components.md`, `03-layouts-and-pages.md` | 16.4.3 | Route groups e layouts aninhados; server por padrão. (Releitura obrigatória no início da implementação para o guia de route groups.) | A confirmar na Fase 4 |
| `node_modules/@base-ui/react/dialog/index.d.ts`, `package.json` | 1.9.0 | Existem `DialogRoot/Trigger/Portal/Backdrop/Popup/Title/Close`. Base-ui Dialog traz foco preso, `Esc` e `aria-modal`. **Não li a doc de props/CSS vars do Popup** — fazer antes de codar. | Não há `Sheet`/`Dialog` shadcn instalado; usar base-ui direto. |
| `src/components/ui/button.tsx` | — | Sem `asChild`; usar `buttonVariants` em `<Link>`. | Já conhecido. |
| Contraste calculado por mim (script, OKLCH→sRGB→WCAG) a partir de `globals.css` | — | ver 6.0 achado 2. | Sim: salmon/coral/teal falham como texto. |

## 5. Alternativas
### 5.1 Onde fica o layout full-bleed (faixas de cor cheia)
O `main` público limita a `max-w-5xl p-4` (`layout.tsx:8`), impossibilitando faixas de ponta a ponta.
| # | Opção | Prós | Contras | Custo/risco | Impacto |
|---|---|---|---|---|---|
| A | Manter layout; faixas com `-mx-4` / `w-screen` hack | Zero mudança de rotas | Frágil (scrollbar causa rolagem horizontal com `w-screen`), feio | Baixo, dívida alta | — |
| B | Remover `max-w/p` do layout e pôr contêiner em cada página (blog, loja, carrinho…) | Modelo "certo" | Toca 5+ páginas fora do escopo | Médio | — |
| C | **Novo route group `(home)` com layout próprio** que reutiliza `SiteHeader/SiteFooter` e `main` sem contêiner; mover `page.tsx` para lá | Isolado, nenhuma outra página muda, sem hacks | Dois layouts quase iguais (3 linhas) | Baixo | Nenhum |
**Recomendação: C.** Rejeitadas: A (hack frágil), B (escopo).

### 5.2 Internacionalização em seções majoritariamente estáticas
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Cada seção é Client Component usando `useI18n` (padrão atual do `HomeHero`) | Consistente com o código | Hidrata a página inteira; mais JS |
| B | **Server Components + helper `getT()` que lê o cookie `locale` e `dictionaries`** (reaproveita `src/lib/i18n.ts`; `layout.tsx:33-34` já faz isso) | HTML estático/streaming, só menu e form são client | Cria um helper novo (~6 linhas) |
| C | Passar `t` por props do page | Sem helper | Props sopa |
**Recomendação: B.** `setLocale` já chama `router.refresh()` (`language-context.tsx`), então os Server Components re-renderizam na troca de idioma. Client Components (menu, form) usam `useI18n` normalmente.

### 5.3 Newsletter
| # | Opção | Prós | Contras | Risco |
|---|---|---|---|---|
| A | Omitir o bloco | Sem backend | Descumpre a referência | — |
| B | Só UI (form sem efeito) | Rápido | **Enganoso**: usuário acha que se inscreveu | Alto (confiança/LGPD) |
| C | **Model `Subscriber` + Server Action `subscribeNewsletter` (Zod, idempotente, rate limit simples)** | Funcional, testável, mínimo | Migration + decisão de LGPD/consentimento | Médio |
| D | Serviço externo (Mailchimp/Resend…) | Entrega e opt-in prontos | Dependência, segredo, fora de escopo | Alto |
**Recomendação: C** (pergunta 3 confirma). Rejeitadas: A, B, D.

### 5.4 Placeholders de imagem
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Blocos de cor lisos (`bg-muted`) | Trivial | Home "morta", difícil validar composição |
| B | **SVGs originais abstratos inline (formas orgânicas com tokens `fill-purple`, `fill-teal`, `fill-coral`)** em um componente `Placeholder` | Sem direitos de terceiros, respeita tema, leve, troca fácil por `next/image` | Algum trabalho de desenho; não é arte final |
| C | Recortar a própria referência | Fiel | **Viola direitos de terceiros** |
**Recomendação: B.** Rejeitada: C (limite duro), A (pobre para avaliar a composição).

### 5.5 Menu overlay
| # | Opção | Prós | Contras |
|---|---|---|---|
| A | Estado próprio + `div` fixed | Sem dependência | Reimplementar foco preso/Esc/aria: risco a11y |
| B | **`@base-ui/react/dialog` (já instalado)** | Foco preso, Esc, aria-modal, scroll lock prontos | Estilização manual (sem wrapper shadcn) |
| C | Instalar shadcn `sheet` via CLI | Padrão shadcn, reutilizável, pedido do usuário | Arquivo gerado; confirmar que o registry base-ui gera `sheet` sobre `@base-ui/react/dialog` |
**Recomendação revisada (requisito adicional do usuário): C**, `npx shadcn@latest add sheet` (a CLI instalada é `shadcn@^4.23`); se o registry não oferecer `sheet` para base-ui, cair em B e registrar. Não verifiquei o que a CLI gera.

### 5.6 Requisitos adicionais do usuário (2026-10-27, via coordenador) — NOVAS DEPENDÊNCIAS
1. shadcn/ui via CLI para componentes reutilizáveis (`sheet`, e o que faltar: `field`/`form`, `card`, `label` já existem em `src/components/ui`).
2. Formulários com **react-hook-form + yup** (`@hookform/resolvers/yup`), schema yup em arquivo separado, mensagens pt-BR.
3. `ControlledInput`/`FormInput` genérico (Controller/useController + `Input` + `Label` + mensagem de erro) por props `name,label,type,placeholder`.

Dependências novas (exigem aprovação humana explícita no front-matter; o coordenador relatou aprovação, mas o campo `approved_*` está vazio): `react-hook-form`, `yup`, `@hookform/resolvers`. Impacto: ~+25 kB gzip no bundle do cliente (estimativa, não medida), só nas rotas com form.

**Conflitos que o humano deve ver:**
- O projeto padroniza **Zod 4 nas bordas** (AGENTS/spec). Decisão: **yup só no cliente (UX)**, **Zod permanece no servidor** dentro da Server Action (segurança não pode depender do cliente). Custo: duas definições da regra de e-mail; mitigação: teste que roda os mesmos casos nos dois schemas. Alternativa: `@hookform/resolvers/zod` (sem duplicar, sem yup) — mais simples, mas contraria o pedido.
- Mensagens pt-BR do yup vs i18n pt/en/es: schema yup recebe `t` (função de mensagens) via factory `createNewsletterSchema(t)` para en/es não ficarem em pt-BR. Default pt-BR conforme o pedido.
- Componente `form` do shadcn no registry base-ui pode ser `field`; `FormMessage` pode não existir. Verificar na Fase 4; fallback: mensagem de erro própria dentro de `ControlledInput` (`role="alert"`, `aria-describedby`).
- Envio: `handleSubmit` do RHF chama a Server Action (`startTransition`) com os valores; substitui `useActionState`.

Arquivos novos previstos: `src/lib/schemas/newsletter.ts` (yup, cliente), `src/lib/schemas/newsletter.server.ts` (Zod), `src/components/forms/controlled-input.tsx`, `src/components/ui/sheet.tsx` (CLI).
Testes adicionais: `ControlledInput` (label associado, erro via `aria-invalid`/`aria-describedby`, `type`/`placeholder` por props, integração com `FormProvider`); schema yup (válido/ inválido/ trim/ mensagens pt-BR); form com RHF (mensagem de validação antes de chamar a action; action chamada 1x).

## 6. Design proposto
### 6.0 Referências e direção visual
- **Referências analisadas:** `spec/references/elena-home-mobile.png` (lida; 1 viewport mobile, página inteira) + a captura enviada no pedido (mesma tela). Menu aberto e "sobre" citados no README **não existem** no repo → não interpretei.
- **Intenção:** portfólio autoral, calmo, artesanal; a obra é a protagonista, a interface some. Tom acolhedor/poético ("Receba notícias mágicas!"), não de conversão agressiva.
- **Sistema extraído**
  - Paleta: fundo creme/papel (`bg-background` = paper; hero levemente mais escuro = `bg-cream`); faixa de newsletter mostarda (`bg-mustard`); texto quase-preto (`text-ink`); acento roxo para o subtítulo (`text-purple`); rótulo rosa/coral pequeno; botão preto (`bg-primary`).
  - Tipografia: display manuscrito para títulos/ subtítulo do hero e "Histórias RECENTES" (`font-heading`); corpo em serifa editorial (Newsreader) incl. o texto grande de destaque (~28px mobile, aparente peso regular); metadados em caixa-alta minúscula com tracking (~10px na referência).
  - Ritmo: seções separadas por ~48–64px, margens laterais ~16px, hero ocupa ~1 viewport.
  - Grade: mobile = **carrossel horizontal** de 3 cards com alturas/larguras variadas (visto pela barra de rolagem/corte do 3º card na referência); destaque em 2 colunas mesmo no mobile (ilustração pequena + texto).
  - Imagem: hero sem moldura, ilustração sangrada no fundo creme; banner largo com margem lateral e legenda mínima; cards com imagens de proporções diferentes (irregular, "colagem").
  - Bordas/raios: praticamente nenhum raio nas imagens; campo de e-mail e botão em pílula (`rounded-full`), borda preta.
- **Padrões de layout → componentes**
  | Referência | Componente |
  |---|---|
  | Header logo + hambúrguer | `SiteHeader` (adaptado) + `MobileMenu` (client, base-ui Dialog) |
  | Hero ilustração + título + subtítulo | `HomeHero` (server) + `Placeholder variant="hero"` |
  | Faixa panorâmica + legenda | `HomeBanner` (server) |
  | Histórias recentes (3 cards) | `RecentStories` (server, dados do banco) + `StoryCard` |
  | Destaque ilustração + texto + link | `HomeFeature` (server) |
  | Newsletter amarela | `NewsletterBand` (server) + `NewsletterForm` (client, `useActionState`) |
  | Rodapé caixa-alta | `SiteFooter` (adaptado) |
- **O que NÃO copiar:** ilustrações (peixe roxo, mapa, capas, figura com guitarra), fotos, nome/logo "Elena Landínez", títulos das histórias ("The More-Than-Human Rights Mural"…), o texto do destaque (o texto do pedido foi fornecido pelo usuário; **confirmar que é texto seu**, pergunta 6), "Welcome to a Sea of Encounters". Tudo placeholder até confirmação.
- **Marca do site:** hoje "Loja & Blog" (`site-header.tsx:19`). Sem logo definido → wordmark em `font-heading` com o nome atual (pergunta 5).

**Crítica de UI/UX**
| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | Hero sem CTA nem contexto de produto: só ilustração + frase. O visitante não sabe se é loja, blog ou portfólio, e o projeto tem loja e carrinho. | Referência: nenhum botão acima da dobra; projeto é "Loja & Blog". | alta | Manter a estética, mas adicionar 1 CTA primário discreto sob o subtítulo ("Ver loja"), e link secundário para o blog; mantém um único ponto focal. A confirmar (pergunta 1). |
| 2 | Cores de acento falham como texto. Rótulo rosa pequeno (`salmon`) sobre papel: **1,81:1**; coral 3,67:1; teal 2,76:1; `muted-foreground` sobre papel 5,63:1 (ok), sobre mostarda 3,88:1 (falha). Roxo sobre papel 7,68:1 (ok), sobre mostarda 5,29:1 (ok). | Calculado em OKLCH→sRGB a partir de `globals.css:63-108`. | alta | Rótulo "Arte e Ativismo" em `text-purple` (ou `text-ink` + ícone/estrela em `salmon` decorativo). Salmão só como decoração. Texto sobre mostarda sempre `text-ink` (10,71:1); nunca `muted-foreground` na faixa mostarda. |
| 3 | Microtexto: metadados dos cards (~10px) e rodapé (~9px) na referência. | Captura mobile: legendas ilegíveis. | alta | Mínimo 12px (`text-xs`) em metadados com `uppercase tracking-wide` e contraste ≥4,5:1; links do rodapé 14px com alvo ≥44px. Informação essencial (categoria/data) nunca só em microtexto. |
| 4 | Carrossel horizontal no mobile: o 3º card fica cortado e não há indicação, rolagem horizontal "escondida" é pouco descobrível; teclado/leitor de tela com dificuldade. | Referência: cards em fileira com corte à direita. | média | Usar scroll-snap com "peek" intencional do próximo card (~12% visível) + cards focáveis (links). Em ≥768px vira grade de 3 colunas. Evita rolagem horizontal **da página**: só o contêiner `overflow-x-auto`. Alternativa: empilhar no mobile (mais simples, mais acessível) — decisão na pergunta 7. |
| 5 | Banner panorâmico largo (≈2:1 no mobile) com texto dentro da arte ("WHAT ARE THEY…") e legenda de ~8px. | Referência. | média | Reservar `aspect-[2/1]` (mobile) e `aspect-[3/1]` (≥1024); com a arte real, texto embutido não é lido por leitor de tela → `alt` descritivo + legenda ≥12px. Com 360px o texto da arte fica ilegível: aceitar ou oferecer versão recortada (`object-cover`). |
| 6 | Caveat Brush é mais grossa/uniforme que o manuscrito de referência; legibilidade ok em 28px+, ruim abaixo de ~20px. Subtítulo do hero em roxo com "·" é fino. | `layout.tsx:15-19`. | média | Usar display só em títulos curtos (hero, "Histórias recentes", "Receba notícias mágicas!"); subtítulo do hero ≥18px; não usar para metadados/links. Trocar a fonte fica fora do escopo (pergunta 8). |
| 7 | Menu hambúrguer: ícone de ~20px na referência e nenhum rótulo. | Referência. | alta | Botão 44×44 com `aria-label` i18n, `aria-expanded`; overlay com foco preso/Esc/botão fechar visível; itens ≥48px de altura. Carrinho e idioma/login precisam continuar alcançáveis (hoje ficam no header — `site-header.tsx:22-37`): no mobile vão para dentro do overlay, mas o contador do carrinho permanece visível no header (ícone + badge) para não esconder o e-commerce. |
| 8 | Campo de e-mail + botão na mesma linha em 360px: botão "ENVIAR" + placeholder cabem, mas com en/es e fonte maior quebram. Placeholder como único rótulo. | Referência (campo ~170px). | alta | Label visível (ou `sr-only` + placeholder claro; recomendado: label visível curta), `type="email" autocomplete="email" inputMode="email"`, campo e botão empilhados <640px, lado a lado ≥640px; altura ≥44px; erro e sucesso inline com `aria-live`. Texto de consentimento curto + link de privacidade (LGPD; pergunta 3). |
| 9 | Ícones Instagram/Facebook sem texto na referência. | Referência. | média | `aria-label` com nome da rede, alvo 44×44, `rel="noopener noreferrer"`, `target="_blank"` com aviso no label. URLs reais = pergunta 4 (lucide-react 1.x **removeu** ícones de marcas? **não verifiquei** → checar na Fase 4; fallback: SVG inline). |
| 10 | Hero ~1 viewport de altura com ilustração gigante: em desktop 1280×720 a ilustração em largura total estoura a dobra e empurra o título para baixo. | Inferência (só há captura mobile). | média | Limitar altura da ilustração (`max-h-[60svh]`) e centralizar com `max-w-3xl`; título sempre visível sem rolagem em 1280×720. |
| 11 | Animações: referência não mostra; evitar decorar. | — | baixa | Só transições de cor/foco; overlay com fade ≤200ms; `motion-reduce:transition-none`. |
| 12 | Estados vazios: com 0 posts publicados a seção "Histórias recentes" some ou vira vazia. | `page.tsx:41` já trata vazio. | média | 0 posts: ocultar a seção inteira (não mostrar título sem conteúdo)? ou mostrar mensagem ("Em breve, novas histórias"). Recomendo mensagem curta + link "Ver blog" (pergunta 7b). |

### 6.1 Frontend
- **Árvore de componentes** (S = Server, C = Client)
  ```
  src/app/(home)/layout.tsx           S  SiteHeader + <main> sem contêiner + SiteFooter
  src/app/(home)/page.tsx             S  busca posts, compõe seções (force-dynamic mantido)
  ├─ HomeHero                         S  Placeholder hero + h1 + subtítulo + CTA (buttonVariants em <Link>)
  ├─ HomeBanner                       S  Placeholder banner + <figcaption>
  ├─ RecentStories                    S  h2 + lista de StoryCard (ul/li) ou estado vazio
  │   └─ StoryCard                    S  <Link> > imagem (next/image fill, ou Placeholder) + meta + título
  ├─ HomeFeature                      S  Placeholder + rótulo + <p> grande + <Link> "Saiba mais"
  ├─ NewsletterBand                   S  faixa bg-mustard, título, ícones sociais
  │   └─ NewsletterForm               C  react-hook-form + yup (resolver) + ControlledInput; chama subscribeNewsletter
  src/components/header/app-header.tsx C  REUTILIZÁVEL e puro (sem contextos): props brand, brandHref, items, actions, desktopActions, menuFooter, labels; fundo bg-secondary, h-[58px], sem borda; Sheet + Button shadcn
  src/components/home/home-header.tsx  C  liga AppHeader a auth/carrinho/i18n (adiciona-se aos itens, carrinho e idioma)
  src/components/mobile-menu.tsx      C  shadcn Sheet (ou base-ui Dialog): nav, idioma, login, carrinho
  src/components/forms/controlled-input.tsx  C  Controller + Label + Input + erro, reutilizável
  src/components/site-footer.tsx      S/C  links (client só se continuar com useI18n; ver getT)
  src/components/placeholder-art.tsx  S  SVGs inline por variante (hero|banner|card|feature|side)
  src/lib/i18n-server.ts              S  getT(): lê cookie `locale` → t(key)
  ```
  `src/components/ui/*` reutilizados: `Input`, `Button`/`buttonVariants`. Nenhum componente shadcn novo.
- **Rotas/segmentos:** mover `src/app/(public)/page.tsx` → `src/app/(home)/page.tsx` (não pode haver dois `/`). `(home)/layout.tsx` novo. `loading.tsx` (esqueleto do carrossel) opcional: a query é 1 consulta leve; **não** criar. `error.tsx`: usar o segmento da raiz se existir (não existe; adicionar `src/app/(home)/error.tsx` simples? pergunta de escopo — recomendo **não**, e tornar a query tolerante: sem banco, a home ainda renderiza sem a seção de histórias? Decisão: erro de banco propaga como hoje; dívida registrada).
- **Estados:** vazio (0 posts), 1–2 posts (grade não quebra; carrossel com 1 item centralizado), post sem `coverUrl` (Placeholder variante `card`), título longo (`line-clamp-3`), formulário: idle / pending (botão desabilitado + texto "Enviando…") / sucesso (mensagem substitui o form, `role="status"`) / erro de validação (inline, `aria-invalid`, `aria-describedby`) / erro inesperado (mensagem genérica).
- **Tema:** só tokens: `bg-background`, `bg-cream`, `bg-mustard`, `text-ink`, `text-purple`, `border-ink`, `bg-primary`, `fill-purple/teal/coral/salmon` nos SVG. Sem hex/`dark:` ad hoc. Em `.dark`, `ink` não muda (marca iguais no claro/escuro): a faixa mostarda e o texto `ink` seguem corretos; `bg-cream`/`bg-background` mudam apenas se usar o semântico → **usar `bg-background` para as seções e `bg-mustard`+`text-ink` explícito na faixa** para não ter texto claro sobre mostarda.
- **Imagens:** `next/image` com `fill` + `sizes` e contêiner `aspect-*`. `coverUrl` remoto: adicionar `images.remotePatterns` do host do Azure Blob em `next.config.ts` (host vem de env — **não li `.env`**; ler apenas o nome da variável em `src/lib/azure-blob.ts` na Fase 4). Hero: `fetchPriority="high"` (não `priority`).
- **Comportamento responsivo**

| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Header | 56–64px: wordmark à esq., carrinho (ícone+badge) e hambúrguer 44×44 à dir. | idem | nav visível (Loja, Blog) + idioma/login/carrinho; hambúrguer oculto | idem, contêiner `max-w-6xl` |
| Menu | overlay tela cheia, itens display grandes | idem | não existe | não existe |
| Hero | ilustração largura total (`aspect-[4/3]`), título 2 linhas (~28–32px), subtítulo, CTA | ilustração `max-w-2xl`, título 40px | `max-h-[60svh]`, título 48px | idem, centralizado `max-w-4xl` |
| Banner | `aspect-[2/1]`, margem 16px, legenda 12px | `aspect-[5/2]` | `aspect-[3/1]`, `max-w-6xl` | idem |
| Histórias | carrossel snap, card ~70vw com peek | grade 3 col, gap 24 | grade 3 col, gap 32 | idem, `max-w-6xl` |
| Destaque | 2 col (ilustração ~35% + texto) texto 22–24px | 2 col 40/60, texto 28px | texto 32px | texto até ~36px, `max-w-5xl` |
| Newsletter | coluna única: título, campo, botão, ícones; arte lateral oculta (<640) | linha form; arte lateral aparece | idem | idem |
| Rodapé | links em 2 colunas, 14px, alvos 44px | linha única com quebra | linha única | idem, direitos à esquerda, "voltar ao topo" à direita |

  Esboço mobile (360):
  ```
  [Wordmark        🛒 ☰]
  [   hero ilustração   ]
  WELCOME…  (h1)
  subtítulo roxo · CTA
  ─────────────────────
  [ banner 2:1 ]
  legenda
  Histórias RECENTES
  [card][card][ca|   ← snap
  ─────────────────────
  [ilus] RÓTULO
         Texto grande…
         Saiba mais →
  ═════ faixa mostarda ═
   Receba notícias mágicas!
   [e-mail            ]
   [ENVIAR            ]
   (ig) (fb)
  ═════════════════════
  links rodapé
  ```
- **Acessibilidade**
  - Contraste: ink/paper 15,5:1; ink/mostarda 10,7:1; roxo/paper 7,7:1; roxo/mostarda 5,3:1; paper sobre ink (botão) 15,5:1. **Proibido** salmon/coral/teal como cor de texto (achado 2). Foco: `ring-ring` roxo sobre mostarda 5,3:1 (≥3:1 ok).
  - Um `h1` (hero), `h2` por seção; landmarks `header`/`nav`/`main`/`footer`; `nav aria-label`.
  - Overlay: foco preso, `Esc`, retorno de foco ao botão, `aria-expanded`, scroll da página bloqueado.
  - Alvos ≥44×44 (botões do header, ícones sociais, links do rodapé, botão e campo). `Input`/`Button` atuais são h-8 → override explícito.
  - Imagens: `alt` descritivo em capas reais; placeholders SVG decorativos com `aria-hidden` e `alt=""` equivalente; a legenda do banner descreve o conteúdo.
  - `prefers-reduced-motion`: sem animações essenciais; overlay sem transição.
  - Links `target=_blank` indicam "abre em nova aba" no `aria-label`.
- **i18n:** chaves novas em `src/lib/i18n.ts` nas 3 línguas (paridade garantida pelo tipo `Messages`). Prefixos `home.*`, `menu.*`, `newsletter.*`, `footer.*`. Strings reais (pt-BR): título hero "Bem-vindo a um mar de encontros" (placeholder do usuário? pergunta 6), subtítulo "Sentir · Navegar · Contemplar", "Histórias recentes", "Receba notícias mágicas!", "Enviar"/"Inscrever-se", "Saiba mais". Cuidar de en/es: "Suscribirse"/"Subscribe" com `whitespace-nowrap` desativado em <640 e `min-w-0`. Títulos de posts não são traduzidos (conteúdo do banco).

### 6.2 Backend
- **Modelo de dados / migration** (só se pergunta 3 = C):
  ```prisma
  model Subscriber {
    id        String   @id @default(cuid())
    email     String   @unique   // normalizado: trim + lowercase
    locale    String?            // "pt-BR" | "en" | "es" (validado com Zod)
    createdAt DateTime @default(now())
  }
  ```
  Migration aditiva (`npm run db:migrate -- --name add_subscriber`); sem impacto em dados existentes. Rollback: migration reversa/`DROP TABLE`.
- **Contrato:** `src/actions/newsletter.ts` — `subscribeNewsletter(prev, formData)`:
  - Zod: `email: z.string().trim().toLowerCase().pipe(z.email()).max(254)`; `website` (honeypot) deve estar vazio.
  - Retorno: `{ ok: true } | { ok: false, error: string, field?: "email" }`.
  - **Idempotente:** e-mail já cadastrado também retorna `{ ok: true }` (não revela quem está inscrito — enumeração). Implementar com `upsert`/`createMany skipDuplicates`, não "find then create".
  - Sem sessão exigida (público). Erros inesperados: `console.error` sem o e-mail, resposta genérica.
  - Locale lido do cookie no servidor (não do cliente).
- **Regra de negócio/transações:** operação de 1 linha; sem transação necessária.
- **Cache e revalidação:** home segue `force-dynamic` (já existia; `cacheComponents` desligado). Nenhum `revalidatePath` necessário (a action não altera dados exibidos). Observação: com `force-dynamic` a home sempre bate no banco; aceitável no volume atual, alternativa `revalidate` por tempo fica como dívida (não verifiquei como interage com o `auth()` no root layout, que já torna as rotas dinâmicas).
- **Integrações externas:** nenhuma de e-mail. Azure: apenas leitura de `coverUrl` já existente.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ver home | ✔ | ✔ | ✔ | pública (`auth.config.ts` `authorized`: confirmar que `/` não é protegida) |
| Listar posts publicados na home | ✔ | ✔ | ✔ | query com `where: { published: true }` |
| `subscribeNewsletter` | ✔ | ✔ | ✔ | Zod + honeypot + limite (abaixo) dentro da action |
| Listar/exportar assinantes | ✘ | ✘ | (fora de escopo) | sem endpoint nesta spec |

- IDOR: não há recurso de dono. Nenhum dado de assinante é exibido ao cliente.
- Validação: e-mail ≤254, normalização, honeypot; nada de `dangerouslySetInnerHTML` (os textos da home são i18n estático; títulos/excerpt de post renderizados como texto).
- **Rate limiting:** a action é endpoint público e pode ser usada para encher o banco. O projeto **não tem** rate limiter. Opções: (a) nenhum agora + honeypot (risco médio); (b) limite por IP em memória (não funciona em múltiplas instâncias/serverless); (c) limite em Postgres (contagem por janela; exige IP/identidade). **Recomendo (a)+limite de tamanho agora e registrar dívida**, salvo se o humano exigir (c) (pergunta 3b).
- Privacidade (LGPD): e-mail é dado pessoal. Mostrar finalidade e link de política de privacidade (página inexistente hoje → pergunta 3c); não logar e-mail; permitir descadastro (fora de escopo, dívida: sem descadastro o envio futuro não poderia acontecer).
- Links externos: `rel="noopener noreferrer"`. URLs de redes sociais fixas em constante (não do usuário).
- Redirects: nenhum.

## 8. Plano de testes
**Infra de testes: não existe e é item desta spec (precisa de aprovação).** Proposta mínima: `vitest` + `@testing-library/react` + `@testing-library/jest-dom` + `jsdom` (unit/componente); `@playwright/test` + `@axe-core/playwright` (responsivo/a11y/e2e); Postgres de teste: banco `*_test` no mesmo `docker-compose.yml` (sem mockar Prisma). Scripts `test`, `test:e2e`. Alternativa: só Playwright (cobre quase tudo, menos rápido para a action). Recomendo a proposta completa porque a action precisa de teste de integração. Se rejeitada, os casos abaixo viram verificação manual declarada.

| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Schema de e-mail: normaliza `"  A@B.com "` → `a@b.com`; rejeita vazio, `abc`, 255 chars | unit | válidos passam; inválidos têm erro |
| 2 | `subscribeNewsletter` feliz: cria linha com e-mail normalizado e locale do cookie | integração | `{ok:true}`, 1 registro |
| 3 | Mesmo e-mail 2× (e com caixa diferente) | integração | `{ok:true}` ambas, 1 registro, sem erro de unique |
| 4 | E-mail inválido | integração | `{ok:false, field:"email"}`, 0 registros |
| 5 | Honeypot preenchido | integração | resposta de sucesso aparente mas **0 registros** (ou erro genérico — definir na impl.; documentar) |
| 6 | Não autenticado / cliente / admin | integração | os três conseguem inscrever (ação pública por desenho); nenhuma sessão é exigida nem vazada |
| 7 | Concorrência: 5 submissões simultâneas do mesmo e-mail | integração | 1 registro, nenhuma exceção |
| 8 | `NewsletterForm`: label associado, erro inline com `role="alert"`, pending desabilita botão, sucesso `role="status"` | componente | por `getByRole`/`getByLabelText` |
| 9 | `StoryCard`: sem `coverUrl` → placeholder; título longo não quebra; link correto `/blog/[slug]` | componente | idem |
| 10 | `RecentStories` com 0, 1, 3 posts | componente | vazio mostra mensagem; 1 item sem quebra |
| 11 | Query da home só traz `published: true`, ordem desc, `take: 3` | integração | rascunhos nunca aparecem |
| 12 | Menu: abre pelo botão, `aria-expanded` muda, foco entra no overlay, `Esc` fecha e devolve foco, Tab não escapa | e2e (360) | passa |
| 13 | Troca de idioma pt→en→es atualiza textos da home (server) | e2e | textos mudam sem recarregar manualmente |
| 14 | Responsivo 360/768/1280: sem rolagem horizontal da página (`scrollWidth<=innerWidth`), hero e CTA visíveis, carrossel só rola no contêiner | e2e | passa; capturas anexadas |
| 15 | axe em 360 e 1280 com overlay aberto e fechado | e2e | 0 `serious/critical` |
| 16 | Home com banco sem posts | e2e | página renderiza, mensagem vazia |
| 17 | Rotas protegidas continuam redirecionando (`/dashboard`, `/conta`) após mover `page.tsx` e criar `(home)` | e2e | regressão |

## 9. Plano de implementação
1. (Fase 4) Reler guia de route groups e props do `Dialog` base-ui; checar `lucide-react` 1.x quanto a ícones de marca.
2. Infra de testes (se aprovada) + smoke test.
3. `i18n-server.ts` (`getT`) + chaves novas nas 3 línguas.
4. `placeholder-art.tsx` (SVGs originais, tokens).
5. Criar `(home)/layout.tsx`; mover `page.tsx`; confirmar que `/` continua pública e que nenhuma outra rota mudou.
6. Header: refatorar `SiteHeader` + `MobileMenu` (Dialog), alvos 44px, carrinho visível.
7. Seções: Hero → Banner → RecentStories/StoryCard → Feature (cada uma com verificação visual em 360 e 1280).
8. `images.remotePatterns` (host do Azure) + `sizes`.
9. Migration `Subscriber` + `actions/newsletter.ts` + `NewsletterForm` + `NewsletterBand`.
10. Rodapé.
11. Testes (tabela 8), capturas 360/768/1280, axe.
12. `npx tsc --noEmit`, `npx eslint src`, testes, `npx next build`; relatório (seção 14).

**Requisito adicional (header isolado e reutilizável):** implementado como `AppHeader` (acima), priorizado no plano; teste de componente `tests/app-header.test.tsx` (abre/fecha pelo botão e por Esc, foco devolvido, `aria-label`/`aria-expanded` do gatilho).

## 10. Riscos, rollback e dívidas
- Riscos: (1) referência só mobile → desktop é inferido; (2) alvos/contraste da referência não passam AA e a versão final difere visualmente (aceito, ver crítica); (3) placeholders não dão a mesma riqueza visual; (4) host do Azure em `remotePatterns`; (5) trocar `page.tsx` de pasta pode quebrar imports/typegen (`npx next typegen`); (6) newsletter pública sem rate limit real.
- Rollback: reverter commit; mover `page.tsx` de volta; migration aditiva reversível; remover chaves i18n.
- Dívidas aceitas: rate limiting robusto; descadastro e envio de e-mail; double opt-in; política de privacidade; CMS do bloco de destaque/banner; `loading.tsx`/`error.tsx` da home; tema escuro refinado; trocar a fonte display; cache da home (`force-dynamic`).

## 11. Perguntas em aberto
- [ ] 1. A home deve manter chamada para a **loja** (CTA "Ver loja" no hero e/ou seção de produtos recentes)? A referência não tem, mas o projeto é "Loja & Blog". Recomendo CTA no hero + seção de produtos fora desta spec.
- [ ] 2. Header/rodapé novos valem **só na home** (opção C, recomendada) ou em **todas** as páginas públicas (exige tocar o layout `(public)` e testar blog/loja/carrinho)?
- [ ] 3. Newsletter: (a) incluir backend (`Subscriber`, recomendado) ou omitir/deixar para outra spec? (b) rate limiting: aceita só honeypot por ora? (c) existe texto/URL de política de privacidade? A infra de testes proposta (vitest + Testing Library + Playwright + axe + DB de teste) está aprovada?
- [ ] 4. URLs de Instagram e Facebook, e quais links o rodapé deve ter (Loja, Blog, Privacidade, Termos, Contato?).
- [ ] 5. Nome/wordmark do site: manter "Loja & Blog" ou há nome/logo definitivo?
- [ ] 6. Textos: o texto grande do destaque e o título "Bem-vindo a um mar de encontros" são **seus** ou apenas ilustrativos? (se forem da referência, trocar.) Para onde vai "Saiba mais"? (`/blog`? página "sobre" inexistente.)
- [ ] 7. Histórias no mobile: carrossel horizontal como na referência ou empilhado (mais acessível)? E sem posts: mensagem "em breve" ou ocultar a seção?
- [ ] 8. Aceita manter Caveat Brush como display, ou quer outra fonte manuscrita (fora do escopo, exigiria nova spec)?
- [ ] 9. Vai fornecer imagens reais/referências de desktop e do menu aberto? Se sim, a seção responsiva será revisada.
- [ ] 10. O banner panorâmico e o bloco de destaque devem ser editáveis no dashboard no futuro (afeta se viram modelo de dados agora)?

- [ ] 15. Carrossel: 1 slide visível por vez (adotado) ou 3 lado a lado em tela larga (exige mais imagens)? **Default: 1 por vez.**
- [ ] 11. **O usuário tem os arquivos licenciados/autorizados do cliente** (hero, banner, 3 histórias, destaque, 2 laterais da newsletter)? Se sim, colocar em `public/images/home/` e conectar no mapa `HOME_IMAGES`. **Default: seguir com placeholders originais.**
- [ ] 12. Manter o carrinho no header mobile e os 2 CTAs do hero (fora do layout aprovado, mas necessários para loja)? **Default: manter; remover se o cliente exigir fidelidade total (o carrinho continua no rodapé do menu).**
- [ ] 13. URLs de Instagram/Facebook, páginas Termos/Privacidade/Cookies/Contato/Gerenciar cookies e crédito "Site por": preencher em `SITE`. **Default: ocultos até existirem.**
- [ ] 14. Para onde vai "Sobre {nome}" (não há página)? **Default: `/blog`.**

## 12. Checklist da review humana
- [ ] O problema e o escopo estão corretos
- [ ] A alternativa recomendada é aceitável
- [ ] Modelo de dados / migration revisado
- [ ] Matriz de permissões revisada
- [ ] Direção visual e referências interpretadas corretamente
- [ ] Crítica de UI/UX avaliada (aceito / ajusto / rejeito cada achado)
- [ ] Comportamento responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas em aberto respondidas

## 13. Registro de aprovação
Aprovado por Thiago Morgado em 2026-10-27, via resposta direta no Claude Code ("Aprovar tudo com defaults"): spec completa, dependências react-hook-form + yup + @hookform/resolvers, infra de testes (vitest + Testing Library) e defaults da seção 11. Registro feito pelo coordenador a pedido expresso do humano. Playwright NÃO aprovado.

## 14. Relatório pós-implementação
Implementado em 2026-10-27 seguindo a seção 9.

**Verificação (rodada de fato)**
- `npx tsc --noEmit`: sem erros. `npx eslint src tests vitest.config.mts`: sem avisos. `npx next build`: ok (`/` dinâmica).
- `npx vitest run`: 17 arquivos, 125 testes passando (schemas yup e Zod, action contra Postgres `loja_blog_test` real incluindo concorrência e honeypot, `getRecentStories`, `ControlledInput`, `NewsletterForm`, `StoryCard`/`RecentStories`).
- Dev server (localhost:3000): `/` 200 com h1/h2 corretos em pt-BR e en; `/loja`, `/blog`, `/login` 200; `/dashboard` 307 (proxy intacto).

**Seletor de idioma (pedido posterior do usuário, dentro do escopo)**
`LanguageSwitcher` refeito com `DropdownMenu` (RadioGroup) do shadcn já instalado, sem dependência nova: gatilho `Button` outline pílula (h-11 nos usos da home) com bandeira + nome no próprio idioma; lista com 3 itens (Português, English, Español), bandeira, check do atual (do `RadioItem`), alvo `min-h-11`, `closeOnClick` (por padrão o RadioItem do base-ui não fecha o menu: bug achado pelo teste de teclado). Bandeiras: SVGs próprios em `src/components/flags.tsx` (decorativos, `aria-hidden`); emoji foi descartado por não renderizar no Windows. `aria-label` do gatilho = "Idioma: Português" via chave nova `language.label` nas 3 línguas. Persistência inalterada (`setLocale`: cookie + contexto + `router.refresh`). Usado também pelo `SiteHeader` antigo (blog/loja/carrinho); `/`, `/loja`, `/blog`, `/carrinho`, `/login`, `/cadastro` respondem 200. Testes: `tests/language-switcher.test.tsx` (aria por idioma, 3 itens/check, bandeiras decorativas, troca por mouse e por teclado, Esc). Não verificado: aparência real, posição do popup dentro do Sheet no mobile e contraste visual (sem navegador).

**Regra de sessão no header (pedido posterior do usuário)**
`HomeHeader` virou Server Component: `auth()` + `getT()` no servidor (sem decisão no cliente, sem flash) e passa ao `AppHeader` (continua puro) a prop `cta` (desktop: botão outline; mobile: último item do Sheet). Regra única em `src/lib/auth-cta.ts` (`getAuthCta`): deslogado = "Entrar" (`/login`); ADMIN = "Ir para o dashboard" (`/dashboard`, chave nova `nav.goDashboard` nas 3 línguas); **cliente logado = "Minha conta" (`/conta`)**, porque `/dashboard` é só ADMIN (`auth.config.ts` redireciona cliente para `/conta`; `(private)/dashboard/layout.tsx` também exige ADMIN). Carrinho virou o client `CartLink`. `SiteHeader` antigo usa a mesma regra (continua lendo a sessão do contexto, que o layout raiz alimenta com `auth()` do servidor). Testes em `tests/home-header.test.tsx` (sessão mockada: deslogada, admin, cliente; `AppHeader` com e sem `cta`; i18n).

Ícones no botão de sessão (pedido posterior): `LogIn` (Entrar), `LayoutDashboard` (Ir para o dashboard) e `User` (Minha conta), do lucide-react já instalado, decorativos (`aria-hidden`), via `AuthCtaIconView` (`src/components/auth-cta-icon.tsx`). `getAuthCta` devolve o nome do ícone; `HomeHeader` (servidor) passa o elemento em `cta.icon`; `AppHeader` renderiza no botão desktop (`gap-2`) e no item do Sheet (`gap-3`). `SiteHeader` antigo recebeu o mesmo ícone. Testes atualizados em `tests/home-header.test.tsx`.

**Correção do erro Base UI `nativeButton` (bug reportado)**
Causa: `SheetClose render={<Link/>}` nos itens do menu (`app-header.tsx`): `SheetClose` é um botão nativo por padrão e recebeu `<a>`. `nativeButton={false}` silencia o aviso mas o base-ui passa a dar `role="button"` aos links (regressão semântica, pega pelos testes). Solução: Sheet controlado (`open/onOpenChange`) e itens como `<Link>` reais com `onClick={() => setOpen(false)}`. Outros `render=` do projeto (`Button`) são `<button>` nativos: ok. Teste novo falha com o padrão antigo (provado) se houver `console.error` ao abrir o menu.

**Redesenho do menu mobile (pedido posterior)**
Idioma saiu do rodapé e foi para o topo do painel via slot `menuHeaderActions` (entre título e fechar), `LanguageSwitcher compact` (bandeira + PT/EN/ES + chevron, nome acessível completo, alvo 44px). Itens em `<ul>` com `aria-current="page"` e destaque (roxo + ponto) na rota atual (`usePathname`, do Next, sem contexto do app); sem ícones nos itens (consistência). CTA de sessão virou botão cheio abaixo da navegação (fora da lista). Rodapé do painel: `CartLink withLabel` (conteúdo real; redes sociais só quando `SOCIAL_LINKS` existir). Painel lateral `max-w-md` a partir de 640px; `motion-reduce` sem transição. Chave `menu.language` removida (não usada). Não verificado visualmente.

**Carrinho exige login (pedido posterior)**
- Servidor: `/carrinho` no matcher do `proxy.ts`; `authorized` (`auth.config.ts`) redireciona deslogado para `/login?callbackUrl=%2Fcarrinho` (callbackUrl fixo e relativo; o padrão do Auth.js passaria URL absoluta, que `safePath` rejeitava); 2ª camada em `(public)/carrinho/layout.tsx` (`auth()` + redirect). Ação `createOrder` já usava `requireUser()`.
- `CartLink` continua apontando para `/carrinho` e o servidor redireciona: uma única regra, sem flash e sem duplicar lógica no cliente; custo: 1 redirect extra para deslogado.
- **Falha de segurança encontrada e corrigida:** `safePath` em `actions/auth.ts` aceitava `/\evil.com` (navegadores tratam `\` como `/`) = open redirect. Substituído por `safeCallbackPath` (`src/lib/safe-path.ts`: só caminho relativo, sem `//`, `\`, controles, ≤2048, verificação de origem via `URL`), usado em login, cadastro e nas páginas.
- Removido do `carrinho/page.tsx` o desvio `if (!isAuthenticated)` (inalcançável agora).
- Testes: `safe-path`, `cart-guard` (deslogado redireciona, CUSTOMER/ADMIN passam, públicas abertas, dashboard/conta seguem protegidos), `cart-link`. Login volta para `/carrinho` via `callbackUrl` já existente (`login`/`register` actions). Não testei o login ponta a ponta em navegador; curl: `/carrinho` deslogado = 302 para `/login?callbackUrl=%2Fcarrinho`.
- **Pergunta em aberto (produto):** o carrinho é `localStorage` (`cart:v1`), **não** por usuário: itens de visitante sobrevivem ao login (não se perdem), mas também vazam entre contas no mesmo navegador (logout não limpa). Decidir: limpar no logout, escopar por usuário ou mesclar com carrinho no servidor. Visitantes ainda podem adicionar itens na loja e só são barrados ao abrir o carrinho. Default recomendado: manter como está até decisão.

**Passe de fidelidade contra o layout aprovado pelo cliente (`spec/references/home-approved-mobile.png`)**
Comparação seção a seção (imagem x implementação) e o que foi feito:
| Seção | Diferença encontrada | Ação |
|---|---|---|
| Header | Ref.: só logo manuscrito + hambúrguer, sem ícone de carrinho; logo em script fino (a nossa Caveat Brush é mais grossa) | Mantido carrinho (e-commerce; pergunta aberta). Fonte do logo: não trocada (pergunta 8). Nome vem de `SITE.name` |
| Hero | Ref.: ilustração ~2:1, título pequeno e espaçado, "WELCOME to a SEA of ENCOUNTERS" (caixa mista), subtítulo roxo "FEEL · Navigate · CONTEMPLate"; sem botões. Nossa: ilustração 4:3, título grande, tudo em maiúsculas, subtítulo em caixa de frase, 2 CTAs | Ilustração ~11:6, título `text-xl→3xl` com `tracking-widest`, caixa mista nas 3 línguas (BEM-VINDO a um MAR de ENCONTROS…), subtítulo na mesma lógica. **CTAs mantidos** (decisão da spec; pergunta aberta) |
| Banner | Ref.: tira ~3:1 com legenda minúscula; nossa 2:1 no mobile e legenda 12px | `aspect-[3/1]` em todos os breakpoints; legenda mantida em 12px (piso de legibilidade, desvio deliberado) |
| Histórias | Ref.: 3 cards lado a lado (~1/3 da largura), proporções e recuos diferentes, 3º cortado; nossa: cards 75% (1 por vez), todos quadrados e alinhados; título "Histórias RECENTES" em caixa mista | Cards `w-[46%]` no mobile (2,2 visíveis, com peek), proporções por posição (5/6, 4/3, 1/1), recuo no 2º, `items-start`; título em caixa mista; metadado 12px e título 18px (a11y, ref. usa ~8-11px). Link "Ver todas" mantido (extra) |
| Destaque | Ref.: ilustração ~1/3, rótulo rosa com estrela, texto ~20px, link pequeno "Sobre a Elena →" | Grade 1/3 + 2/3 no mobile (2/5 + 3/5 ≥768), estrela decorativa `✱` em `text-salmon`, texto `text-xl` mobile, link "Sobre {nome}" (`SITE.name`). **Rótulo em roxo, não rosa** (rosa/coral reprovam AA: 1,81:1 e 3,67:1) e link aponta para `/blog` (não há página "Sobre") |
| Newsletter | Ref.: arte lateral visível também no mobile; botão preto "SIGN UP" em maiúsculas; ícones sociais sempre visíveis; amarelo mais pálido | Arte lateral agora sempre visível (`w-10`/`w-14` no mobile); botão uppercase `tracking-wider`; formulário segue empilhado em <640 (alvo/legibilidade); **ícones só aparecem com URL** (`SITE.social`); amarelo é o token `mustard` (mais saturado que a ref.; mudar o token exige aprovação) |
| Rodapé | Ref.: © ano + TERMS, PRIVACY, COOKIES, CONTACTS, MANAGE COOKIES e "WEBSITE BY" à direita, microtexto | Faixa igual (© + links + crédito), em 12px/alvo 44px; **itens legais e crédito configuráveis em `SITE` e ocultos sem `href`** (as páginas não existem; evita link morto). "Voltar ao topo" removido. Chaves i18n nas 3 línguas |

**Slots de imagem (arte de terceiros NÃO foi copiada; placeholders originais)**
Mapa único `HOME_IMAGES` em `src/lib/site.ts`: `hero`, `banner`, `stories[3]` (capa de reserva), `feature`, `newsletterLeft`, `newsletterRight`; renderizados por `HomeImage` (`src/components/home/home-image.tsx`): sem `src` = placeholder SVG; com `src` = `next/image` (`fill`, `sizes`, alt do i18n via `altKey`, `fit` cover/contain; sem `altKey` = decorativa). **Como trocar:** colocar o arquivo em `public/images/home/`, preencher `src` do slot (ex.: `"/images/home/hero.jpg"`), manter/editar o `altKey` e o texto em `src/lib/i18n.ts`; proporções sugeridas nos comentários do mapa. Posts reais continuam usando `coverUrl` (Azure) e sempre vencem a capa de reserva. Nome/marca: só `SITE.name` (nenhum nome próprio no código). Testes: `tests/home-images.test.tsx`.

**CORREÇÃO DE POSIÇÃO (mais recente, prevalece sobre o texto abaixo): o carrossel fica no HERO, no lugar da ilustração placeholder (acima do título e do subtítulo); o banner panorâmico VOLTOU como estava** (`HomeBanner`: faixa 3:1 + legenda, slot único `HOME_IMAGES.banner`). Slots: `HOME_IMAGES.hero` virou `heroCarousel[3]` (alts `home.carousel.1..3.alt`); `home.hero.alt` removido; `home.banner.alt/caption` restaurados. `HomeCarousel` ganhou `aspectClassName` (hero usa `aspect-[11/6]`, `max-w-2xl` centralizado, largura total no mobile). **Decisão de visualização:** 1 slide por vez em todos os breakpoints, sem "peek" lateral e sem 3 visíveis (com só 3 imagens e `max-w-2xl` o peek apertaria as laterais e 3 lado a lado deixaria o carrossel parado); documentado como pergunta aberta 15. Legibilidade: overlay só nas imagens; título/subtítulo ficam abaixo, sobre `bg-secondary` (ink 15:1, roxo 7,7:1 conforme seção 6.1), sem nada sobre o overlay. Espaçamentos do hero (título↔subtítulo `space-y-1`, `pb-10 md:pb-12`, transição limpa, `px-4`) aplicados ao hero com carrossel; banner restaurado com `pt-4 md:pt-6 pb-10 md:pb-14`. Testes: `tests/home-hero-banner.test.tsx` (hero contém o carrossel antes do h1, 3 slides, overlay; banner presente, 3:1, sem carrossel). Como trocar as imagens: `HOME_IMAGES.heroCarousel[i].src` e `HOME_IMAGES.banner.src`.

**Carrossel (histórico da decisão anterior: tinha sido colocado no lugar do banner)**
- Dependências: `embla-carousel-react` (via `npx shadcn@latest add carousel`, gera `src/components/ui/carousel.tsx`) e `embla-carousel-autoplay`. Ajustes no arquivo gerado: prop `label` nas setas (rótulo i18n) e estado inicial em microtask (regra `react-hooks/set-state-in-effect`).
- **Interpretação do "mostra 3 imagens"**: 3 slides, **um visível por vez** (3:1, loop, autoplay). Três visíveis ao mesmo tempo com só 3 imagens deixaria o carrossel sem movimento; se a intenção for 3 lado a lado em tela larga, é uma mudança pequena (`basis-1/3` no `CarouselItem` a partir de `lg`), mas exige mais de 3 imagens para fazer sentido. Pergunta aberta.
- Componentes: `home/home-carousel.tsx` (client: autoplay, a11y, controles) e `home/home-banner.tsx` (server: monta os slides com `HomeImage`). Mapa: `HOME_IMAGES.carousel` (3 slots; antes `banner`), alts `home.carousel.1..3.alt` nas 3 línguas; placeholders SVG originais (`banner`, `banner-b`, `banner-c`).
- Overlay cinza: `bg-ink/35` (token constante nos temas) decorativo em cada slide; **nenhum texto fica sobre ele** e os controles ficam abaixo da imagem (contraste e alvos de 44px sem depender do overlay).
- Autoplay (5s, loop): pausa em hover, foco dentro do carrossel e ao interagir (arrastar, setas, próximo/anterior); botão pausar/continuar (WCAG 2.2.2) com `aria-label` traduzido; `prefers-reduced-motion`: sem autoplay e sem botão; `aria-live` `off` enquanto roda e `polite` parado. Teclado: setas ←/→ (embla/shadcn), swipe nativo do embla. Semântica: `role=region` + `aria-roledescription="carousel"`, slides `role=group` + `aria-roledescription="slide"` e nome "n de 3"; bolinhas `aria-label="Ir para o slide n"` e `aria-current`. Sem layout shift (`aspect-[3/1]` fixo).
- **Como trocar as imagens:** preencher `src` dos 3 itens de `HOME_IMAGES.carousel` (arquivos em `public/images/home/`), ajustar os alts em `src/lib/i18n.ts`. Testes: `tests/home-carousel.test.tsx` (3 slides, overlay, pausa, aria, reduced motion, hover/foco, sem `console.error`). Não verificado: autoplay real no navegador e swipe (jsdom não tem layout/toque).

**Espaçamentos do hero e da transição para o carrossel (medidos em `home-approved-mobile.png` e no recorte `Screenshot 22.25.45`)**
Medida na referência (escala ~1,26 px de imagem por px CSS): título↔subtítulo ~4px; subtítulo→fim do fundo escuro do hero ~40px; fim do hero→topo da imagem ~16px; margens laterais ~16px. Valores adotados (escala Tailwind, sem valores mágicos):
| Ponto | Antes | Depois |
|---|---|---|
| título↔subtítulo | `gap-4` (16px) | `space-y-1` (4px) |
| subtítulo→borda inferior do hero | `pb-10 md:pb-14` (40/56px) | `pb-10 md:pb-12` (40/48px) |
| borda do hero→topo do carrossel | `py-10 md:py-14` (40/56px) | `pt-4 md:pt-6` (16/24px) |
| carrossel→"Histórias" | `py-10 md:py-14` | `pb-10 md:pb-14` (inalterado) |
| margens laterais | `px-4` | `px-4` (16px, igual) |
Troca de fundo limpa: hero `bg-secondary` → faixa `bg-background`, sem borda. Observação: o arquivo `home-hero.tsx` foi editado fora da minha sessão e **já não tem os botões (Ver loja / Ler o blog)**; tratei como decisão deliberada do usuário (fiel à referência). Com isso, subtítulo→borda do hero = 40px (mobile) / 48px (≥768px), exatamente o medido. Sem verificação visual (sem navegador).

**Full HD (1920×1080) e layout sem container (pedidos posteriores; prevalecem sobre larguras anteriores da spec)**
Decisão final do usuário: **sem container de largura máxima** (nada de `max-w-*`/`mx-auto` nas seções da home) e **padding lateral fixo de 20px** (`px-5`) em todas as larguras. Implementação: utilitário único `px-fluid` em `src/app/globals.css` (`@apply px-5`; o nome ficou do pedido fluido anterior, o valor é fixo e sem breakpoints) aplicado em header (`AppHeader`), hero/carrossel, banner, histórias, destaque, newsletter e rodapé. As faixas de fundo (hero, newsletter, rodapé) continuam de ponta a ponta; os 20px valem para o conteúdo interno. Tokens `--container-site`, `site-container` e `site-gutter` (criados e descartados na mesma rodada) não existem mais. Mudança visível no mobile: margem lateral 16px → 20px (decisão do usuário; a referência mostra ~16px).
- Hero: carrossel `w-full` (com o padding de 20px; não encosta na borda da tela), aspect `11/6` (base) → `md:2/1` → `lg:16/7` → `xl:21/9`, `max-h-[62svh]` para manter título e subtítulo na 1ª dobra, `object-position` configurável por slot (`ImageSlot.position`), `sizes="(min-width: 1792px) 1696px, 100vw"`, qualidade 85 (`next.config.ts` `images.qualities: [75, 85]`: **achado:** no Next 16 qualidade fora da lista é coagida para 75, pegou o teste), `fetchPriority="high"` só no 1º slide. Títulos escalam `xl:text-4xl`/`xl:text-2xl`.
- Histórias: grade de 3 colunas a partir de 768px com `gap` 24/32/48px (`2xl:gap-12`), títulos `2xl:text-5xl`/`2xl:text-2xl`. Destaque: `flex` com ilustração `w-1/3` → `md:w-2/5` → `lg:w-[clamp(18rem,26vw,34rem)]` e texto `flex-1`; **medida de leitura só no texto** (`max-w-[40ch]`, valor arbitrário deliberado, em `ch`); escala até `2xl:text-5xl`. Newsletter: arte lateral `2xl:w-40`, título `2xl:text-5xl`, campo do formulário mantém `max-w-xl` (`2xl:max-w-2xl`, é largura de controle, não de layout).
Matriz de breakpoints (conteúdo = largura da viewport − 40px):
| Viewport | Conteúdo | Carrossel (aspect · altura) | Histórias | Destaque (ilustração) | Título hero |
|---|---|---|---|---|---|
| 360 | 320px | 11/6 · ~175px | faixa rolável, cards 46% | 1/3 | `text-xl` |
| 768 | 728px | 2/1 · ~364px | 3 colunas | 2/5 | `text-2xl` |
| 1280 | 1240px | 21/9 (xl) · 531px, limitado por 62svh (≈446px em 720px de altura) | 3 colunas | clamp ≈ 18-27rem | `text-4xl` |
| 1440 | 1400px | 21/9 · 600px, limitado por 62svh (≈558px em 900px) | 3 colunas | clamp ≈ 26vw | `text-4xl` |
| 1920 | 1880px | 21/9 · 806px → **limitado a 62svh ≈ 670px** (recorte `cover`) | 3 colunas ≈ 600px cada, gap 48px | clamp máx. 34rem | `text-4xl` |
Antes (nesta sessão): carrossel `max-w-2xl` (672px) centralizado com aspect 11/6 em todas as larguras (≈366px de altura), seções em `max-w-5xl/6xl` e hero `max-w-4xl` — em 1920 sobravam ≈624px de bege vazio de cada lado. Cálculos acima são aritmética das classes, **não medições em navegador**.
**O que conferir em 1920×1080 (sem Playwright não foi validado visualmente):** título e subtítulo visíveis sem rolagem; carrossel sem recorte ruim (ajustar `position` do slot); nenhuma rolagem horizontal; linhas de texto do destaque ≤ ~40 caracteres; cards de histórias não gigantes demais; faixa amarela e rodapé de ponta a ponta com 20px de margem interna; botões e alvos ainda ≥44px. Reiniciar `next dev` após a mudança do `next.config.ts` (qualidades).

**Espaçamentos do modelo aprovado (pedido posterior; padding lateral fixo `px-5` mantido)**
Fonte: `home-approved-mobile.png` / screenshot de página inteira (**301 px de largura na imagem que recebi; escala assumida 390/301 ≈ 1,30 px CSS por px de imagem**). **Incerteza declarada:** leitura manual de uma imagem pequena, erro de ±3 px de imagem (≈ ±4 px CSS); onde a medida contradiz a de recorte anterior (subtítulo→fim do hero), mantive o valor do recorte ampliado (40px). Aritmética de classes, não medição em navegador.
| Ponto de medida | Modelo (px CSS aprox.) | Antes | Depois (mobile; escala sm/lg/2xl) |
|---|---|---|---|
| Header (altura) | ~36 (logo/hambúrguer) | 58px (pedido do usuário) | **mantido 58** `h-[58px]` (alvos 44px) |
| Topo da ilustração/carrossel | logo logo acima (~0) | `pt-4` 16 | `pt-0` 0 |
| Carrossel→título | ~43 | 8 + 44 controles + `gap-4` 16 = 68 | `gap-0`: 8 + 44 = 52 (mínimo por alvo de 44px dos controles) |
| Título↔subtítulo | ~18 (linha a linha) | `space-y-1` + `leading-snug` | `space-y-1` + `leading-tight` |
| Subtítulo→fim do hero | ~40 (recorte) | `pb-10 md:pb-12` | `pb-10 md:pb-12 lg:pb-14 2xl:pb-20` |
| Fim do hero→banner | ~22 | `pt-4 md:pt-6` | `pt-5 md:pt-6 lg:pt-8 2xl:pt-12` |
| Banner→legenda | ~5 | `mt-2` 8 | `mt-1` 4 |
| Legenda→título "Histórias" | ~18 | `pb-10` 40 | banner `pb-0` + histórias `pt-5 sm:pt-6 lg:pt-8 2xl:pt-12` |
| Título→cards | ~14 | `mt-6` 24 | `mt-4 lg:mt-6 2xl:mt-8` |
| Entre cards (horizontal) | ~13 | `gap-4` 16 | `gap-3 md:gap-6 lg:gap-8 2xl:gap-12` |
| Imagem do card→metadado | ~9 | `mt-3` 12 | `mt-2 lg:mt-3` |
| Fim das histórias→destaque | ~32 | `pb-12` + `pt-4` = 64 | histórias `pb-8 sm:pb-10 lg:pb-14 2xl:pb-20`, destaque `pt-0` |
| Destaque: ilustração↔texto | ~22 | `gap-4` | `gap-5 md:gap-10 lg:gap-16` |
| Destaque: rótulo→texto→link | ~8 / ~8 (visual) | `space-y-3` | `space-y-2 md:space-y-4` (link com 44px de alvo mantém folga visual) |
| Destaque→faixa amarela | ~24 | `pb-12` 48 | `pb-6 sm:pb-10 lg:pb-14 2xl:pb-20` |
| Faixa amarela: padding vertical | ~32 | `py-12` 48 | `py-8 md:py-12 lg:py-14 2xl:py-20` |
| Faixa: título→formulário | ~21 | `gap-5` 20 | `gap-3` 12 (+ rótulo visível e texto de consentimento, ausentes no modelo, por a11y) |
| Rodapé: padding vertical / altura | ~31 total, 1 linha | `py-6` + 2 linhas de 44px | `py-2`, © e links na mesma linha com quebra (`flex-wrap`); altura mínima limitada pelos alvos de 44px |
Escala em telas largas: os espaçamentos verticais crescem em `sm/lg/2xl` (colunas "Depois"), sem mudar o mobile. Teste de proteção das classes base: `tests/layout-fullwidth.test.tsx`. Desvios que permanecem e por quê: controles do carrossel (44px, WCAG 2.2.2/alvos), rótulo/consentimento do formulário (a11y/LGPD) e alvos de 44px no rodapé.

**Header fixo com troca de cor (pedido posterior)**
- `AppHeader` ganhou props opcionais `sticky` e `solidAfterId` (continua sem contexto do app). `sticky` = `sticky top-0 z-40` (o Sheet/overlay usa `z-50`; `sticky` reserva o espaço no fluxo, então não há layout shift nem compensação de altura; funciona com a barra do navegador mobile). `HomeHeader` passa `sticky` e `solidAfterId="home-hero"` (o `<section id="home-hero">`).
- Troca de cor: hook `useSolidAfter` (`src/components/header/use-solid-after.ts`) com `IntersectionObserver` (sem listener de scroll) e `rootMargin: -59px 0 0 0` (58px do header + 1px de borda): enquanto o hero aparece, `bg-secondary` (bege); ao rolar além do hero, `bg-card` + `text-card-foreground` + `border-border` + `shadow-sm`; ao voltar, bege de novo. "Branco" = o token mais claro do tema (`--card`, oklch 0,983), sem hex solto; contraste do texto `ink` sobre ele ≈ 16:1 (calculado com o mesmo método de OKLCH da seção 6.0; logo/ícones/CTA usam `ink`/`foreground`).
- Sem flash: estado inicial (SSR e 1º render) = bege (hero visível); se a página abrir já rolada, o 1º callback do observer corrige no primeiro frame (pode haver um frame em bege). A borda inferior existe sempre (transparente no hero), então a altura não muda na troca. `transition-colors duration-200` com `motion-reduce:transition-none`.
- `html { scroll-padding-top: 3.75rem }` em `globals.css`: âncoras e foco por teclado não ficam atrás do header (vale para o site todo; efeito inofensivo nas outras páginas).
- Não tocado: `SiteHeader` antigo (blog/loja/carrinho continuam com header estático; mudar exigiria o mesmo hook/`id` do alvo em cada página, fora do escopo da home → pendência).
- Testes: `tests/sticky-header.test.tsx` (classes sticky/z-index/transição, sem `sticky` não fixa, bege inicial, branco fora do hero e volta ao bege, página já rolada, `rootMargin` descontando o header, sem alvo, menu abre com header branco sem `console.error`). **Não verificado em navegador:** troca real ao rolar, comportamento com a barra do navegador mobile e a 1920.

**Menu com letreiros manuscritos em imagem (pedido posterior; defaults confirmados pelo usuário)**
- Arquivos organizados (cópias; originais movidos para `design-assets/menu-originals/`, fora do build): `public/images/menu/{pt,en,es}/<nome>.png`, `shop.png` (igual nos 3 idiomas) e `close.png` (X rosa). Mapa único em `src/lib/nav.ts` (`MENU_ITEMS`: id, rota, `altKey` i18n, linhas 1/2, imagem por idioma com width/height intrínsecos, `MENU_CLOSE_IMAGE`). Teste confere que cada arquivo existe e que width/height batem com o PNG real.
- Mapeamento verificado lendo cada imagem (Eng e Esp têm 6 itens + o 07 `Shop` compartilhado; **não há item extra**):
| # | pt-BR (arquivo) | en (arquivo) | es (arquivo) | Rota |
|---|---|---|---|---|
| 1 | SOBRE (`pt/sobre`) | ABOUT (`en/about`) | ACERCA DE (`es/acerca-de`) | `/em-breve?secao=about` |
| 2 | PROJETOS (`pt/projetos`) | PROJECTS (`en/projects`) | PROYECTOS (`es/proyectos`) | `/em-breve?secao=projects` |
| 3 | EXPOSIÇÕES (`pt/exposicoes`) | **"EXIBITIONS"** (`en/exhibitions`) | EXPOSICIONES (`es/exposiciones`) | `/em-breve?secao=exhibitions` |
| 4 | FESTIVAIS & RESIDÊNCIAS (2 linhas) | FESTIVALS & RESIDENCIES | FESTIVALES & RESIDENCIAS | `/em-breve?secao=festivals` |
| 5 | LIVROS | BOOKS | LIBROS | `/em-breve?secao=books` |
| 6 | NOTÍCIAS | NEWS | NOTICIAS | `/blog` |
| 7 | SHOP (`shop`) | SHOP | SHOP | `/loja` |
  **Achado:** a arte inglesa do item 3 está escrita "EXIBITIONS" (o correto é "EXHIBITIONS"). O `alt` usa o texto correto ("Exhibitions"); pedir ao cliente a arte corrigida.
- `AppHeader`: `HeaderItem` ganhou `image`/`lines`; props `overlayOnly` (hambúrguer em **todas** as larguras, sem navegação em linha nem CTA/idioma no header) e `closeImage`. Overlay com letreiros: tela cheia (`sm:max-w-none`), cores de marca fixas `bg-paper text-ink` (os PNGs são pretos: precisam de fundo claro mesmo se o tema escuro for ativado um dia), `px-fluid` (20px). Itens `<Link>` reais com `<Image alt=texto>` (nome acessível do link = texto do letreiro), `min-h-14`, anel de foco, `aria-current="page"` na rota atual (as 5 seções sem página nunca são "atuais": a URL tem query), altura controlada por CSS (1 linha `h-12 md:h-16 lg:h-20`; 2 linhas `h-24 md:h-32 lg:h-44`) e `width/height` intrínsecos (sem layout shift). Botão fechar = `close.png` decorativa (`alt=""`) com o `aria-label` traduzido do botão. Idioma continua no topo do painel, CTA de sessão e carrinho continuam no menu. A troca de idioma re-renderiza o `HomeHeader` (servidor) e as imagens mudam de pasta.
- `/em-breve` (autorizada pelo usuário): `src/app/(home)/em-breve/page.tsx` com o mesmo header/rodapé, mostra o letreiro da seção (id validado por allowlist) + "Em breve" + texto e botão de voltar nas 3 línguas; `robots: noindex`.
- **Pergunta em aberto:** Sobre, Projetos, Exposições, Festivais & Residências e Livros não têm página. Opções: criar as páginas reais, ocultar os itens ou manter `/em-breve` (adotado). Impacto em loja/blog: nenhum (só o menu da home muda; `SiteHeader` antigo inalterado).
- Testes: `tests/menu-images.test.tsx` (mapa, arquivos/dimensões, 7 links por idioma com alt e pasta certos, fechar com X, aria-current, alvo, altura 1/2 linhas, sem `console.error`, `/em-breve` com allowlist). `tests/home-header.test.tsx` agora abre o menu para achar o CTA. Não verificado visualmente (sem Playwright): ritmo visual, tamanho dos letreiros em 360/768/1280/1920.

**Menu como painel lateral (Sheet) em desktop e mobile + escala tipográfica (pedidos posteriores; substituem a versão "overlay de tela cheia no desktop")**
- Painel (`SheetContent`, shadcn) abre pela direita em todas as larguras: tela cheia abaixo de 640px, `max-w-md` (28rem) em `sm` e `max-w-sm` (24rem) em `lg+`; backdrop `bg-ink/40` (prop nova `overlayClassName` no `SheetContent` gerado); fundo `bg-paper text-ink` (PNGs pretos). Cabeçalho fixo (Menu à esquerda; idioma compacto e X à direita), **só a lista rola** (`min-h-0 flex-1 overflow-y-auto`) se a janela for baixa, rodapé fixo com botão de sessão + carrinho. Foco preso, Esc fecha e devolve o foco ao gatilho (testado), links `<Link>` com `onClick` fechando o Sheet controlado (sem `SheetClose render=Link`), `motion-reduce:transition-none`.
- Letreiros no desktop (`lg+`), antes → depois: 1 linha `lg:h-[7svh]` → `lg:h-[4svh] lg:max-h-11` (≈32px em 1440×790, teto 44px); 2 linhas `lg:h-[14svh]` → `lg:h-[8svh] lg:max-h-[5.5rem]` (≈63px, teto 88px) = ~57% do tamanho anterior (pedido: 60-65%; ficou no limite inferior para caberem sem rolagem); alvo de 44px vem de `min-h-11` + `lg:py-1.5` (não da imagem). Mobile inalterado (`h-12`/`h-24`, `md:h-14`/`md:h-28`). Letra ≥ ~28px a 4svh em 790px de altura (aritmética; não medido).
- Escala tipográfica em telas grandes (reduções de baixo risco aplicadas):
| Elemento | Antes | Depois |
|---|---|---|
| Título do hero | `lg:text-3xl xl:text-4xl` | `lg:text-3xl` |
| Subtítulo do hero | `sm:text-xl xl:text-2xl` | `sm:text-xl` |
| "Histórias recentes" | `sm:text-4xl 2xl:text-5xl` | `sm:text-4xl` |
| Título do card | `2xl:text-2xl` | `2xl:text-xl` |
| Texto do destaque | `md:text-3xl lg:text-4xl 2xl:text-5xl` | `md:text-3xl xl:text-4xl` |
| Título da newsletter | `sm:text-4xl 2xl:text-5xl` | `sm:text-4xl` |
- Investigação do **filete laranja** do carrossel (`spec/references/menu-desktop.png`): ~3px de largura, ~63% da altura do slide, canto esquerdo, com o 3º slide ativo. A cor e a altura batem com a borda **direita do slide 2** (placeholder `banner-b`: coral até o caminho navy, que em x=600 fica a ~60% da altura). Conclusão: **não é bug do SVG nem do layout**; é o fim da transição do embla (a bolinha atualiza em `select`, antes do slide parar, e o print pegou os últimos pixels do slide anterior saindo). Nenhuma alteração. Se aparecer parado (sem transição), reabrir: hipótese seguinte seria arredondamento de largura fracionária do embla no `reInit`.
- Testes: `tests/menu-images.test.tsx` (painel lateral, rolagem só na lista, rodapé fixo, backdrop, Esc/foco, reduced-motion, alturas lg). Não verificado visualmente (sem Playwright).

**Carrinho ao lado do idioma no painel do menu (pedido posterior)**
- Cabeçalho do painel agora é `Menu` à esquerda e, à direita, `[Idioma] [Carrinho] [X]` lado a lado (`menuHeaderActions` = `LanguageSwitcher compact` + `CartLink variant="pill"`; o X continua no `AppHeader`). O carrinho saiu do rodapé do painel, que ficou só com o botão de sessão. `CartLink` ganhou `variant`: `icon` (barra do header, contador no canto) e `pill` (ícone de sacola + contador inline, mesmo visual do seletor de idioma: `outline`, `bg-secondary`, `border-ink/30`, `h-11`, `rounded-full`); `aria-label` traduzido com a quantidade ("Carrinho (2)"), ícone `aria-hidden`; link `/carrinho` e regra de login (proxy/layout) inalterados. Em 360px: `Menu` (~60) + idioma (~90) + carrinho (~64 com contador) + X (44) + gaps/padding (~64) ≈ 322px < 360 (aritmética; sem navegador); a pílula só mostra o ícone quando o carrinho está vazio.
- **Header fechado do desktop:** não alterado (logo à esquerda; carrinho e hambúrguer à direita, sem idioma): o screenshot citado não chegou ao projeto (`spec/references` não tem arquivo novo). Se o pedido era idioma + carrinho + hambúrguer também no header fechado, é um ajuste pequeno (`desktopActions` do `HomeHeader`).
- Testes: ordem `[Idioma] [Carrinho] [X]` e mesmo contêiner, alturas `h-11`, rodapé só com o CTA (`tests/menu-images.test.tsx`); `CartLink` pílula e contador/aria-label nas duas variantes (`tests/cart-link.test.tsx`).

**Correção do carrinho "quadrado" ao lado do idioma (print-0008) — causa raiz no `buttonVariants`**
O carrinho aparecia com cantos pequenos, sem borda escura, fundo diferente e mais baixo porque `<Link className={buttonVariants({ variant: "outline", className: "... rounded-full border-ink/30 bg-secondary h-11" })}>` usava a função `cva` **sem merge**: classes conflitantes (`rounded-lg`/`rounded-full`, `border-border`/`border-ink/30`, `bg-background`/`bg-secondary`, `h-8`/`h-11`) ficavam todas no HTML e a ordem do CSS decidia. O `Button` do idioma passava por `cn` (twMerge) e saía certo. Correção em `src/components/ui/button.tsx`: `buttonVariants` agora faz `cn(cva(...))` (merge real), o que também corrige os demais `<Link className={buttonVariants(...)}>` do projeto (CTA do menu, botões do hero/erros etc.: `rounded-full`/`h-11`/`px-*` agora valem). `CartLink variant="pill"` usa as mesmas classes do `LanguageSwitcher` e vira círculo `w-11 px-0` quando vazio, pílula com contador quando há itens. Teste compara as classes finais dos dois (sem `rounded-lg`, `h-8`, `border-border`, `bg-background`).

**NÃO verificado**
- **A UI não foi verificada visualmente** (sem Playwright, não aprovado; sem capturas em 360/768/1280). Responsividade, overlay do menu (foco preso/Esc), rolagem horizontal e axe: **não testados**; só HTML do servidor e testes de componente em jsdom.
- Ícones sociais: `SOCIAL_LINKS` (`src/lib/site.ts`) está vazio, então não aparecem até haver URLs (pergunta 4).
- `next/image` com capa real do Azure não foi exercitado.

**Desvios da spec**
- Header/rodapé novos são `HomeHeader`/`HomeFooter` (pasta `src/components/home`), em vez de adaptar `SiteHeader`/`SiteFooter`: mantém blog/loja/carrinho intactos (default pergunta 2). `LanguageSwitcher` ganhou prop `className`.
- Menu: `Sheet` do shadcn (CLI), com botão fechar próprio para i18n (o do shadcn tem "Close" fixo em inglês).
- Banner/hero: placeholders decorativos (`aria-hidden`); `alt` entra quando houver arte real.
- Links do rodapé: Loja, Blog, Carrinho e "Voltar ao topo" (privacidade/termos/contato não existem).
- Sem Playwright e sem `@vitejs/plugin-react` (exigia babel 8, conflito de peers); vitest 4 (v5 exigia @types/node 22+). JSX via `oxc.jsx` no `vitest.config.mts`.
- Rate limiting: só honeypot (default aceito). Banco de teste `loja_blog_test` criado uma vez via `docker compose exec`; `tests/global-setup.ts` roda `migrate deploy`.

**Arquivos**: ver resposta de handback.
**Como testar**: `npm run db:up`, criar `loja_blog_test` (comando em `tests/global-setup.ts`), `npm test`, `npm run dev` e abrir `/`.

