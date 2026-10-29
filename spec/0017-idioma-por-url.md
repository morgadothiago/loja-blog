---
id: 0017
title: Idioma na URL (/pt, /en, /es): rotas localizadas, troca de idioma que mantém a página, hreflang e sitemap
status: approved
layers: [front, infra]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0017 — Idioma por URL

## 1. Contexto e problema
Briefing §9: três idiomas com a mesma estrutura; a troca deve manter o visitante na página correspondente. Hoje o idioma vive em cookie (`src/contexts/language-context.tsx:31-38`, `src/lib/i18n-server.ts:5-8`), com o mesmo URL para as 3 línguas. A experiência de "ficar na página" funciona, mas: sem URL por idioma não há compartilhamento no idioma certo, `hreflang` nem indexação separada; o root layout lê `cookies()` e **torna todas as páginas dinâmicas** (`src/app/layout.tsx:46-47`). As rotas estão só em português (`/projetos`, `/exposicoes`, `/festivais-e-residencias`, `/livros`, `/sobre`, `/loja`, `/blog`).

## 2. Objetivos e não-objetivos
**Objetivos:** URL por idioma; troca de idioma = mesma página no outro idioma; `<html lang>` correto no HTML estático; `hreflang`/canonical/sitemap; redirects 308 das URLs atuais; páginas públicas estáticas (SSG/ISR) quando o conteúdo permitir.
**Não-objetivos:** traduzir conteúdo (0018+); áreas privadas (`/login`, `/cadastro`, `/conta`, `/dashboard`, `/carrinho`, `/api`) continuam **sem prefixo** e usam o cookie; domínio por idioma.

## 3. Estado atual do código
`src/app/layout.tsx` (root, `auth()` + `cookies()`), `src/components/providers.tsx`, `src/contexts/language-context.tsx`, `src/components/language-switcher.tsx:46-56` (chama `setLocale`), `src/lib/i18n.ts` (`LOCALES = ["pt-BR","en","es"]`, `LOCALE_COOKIE`), `src/lib/i18n-server.ts`, `src/proxy.ts` (matcher só `/dashboard`, `/conta`, `/carrinho`, `/login`, `/cadastro`), `src/auth.config.ts`, `e2e/*.spec.ts`. Texto traduzido via `useI18n()` (client) e `getT()` (server) em muitos componentes: a fonte do locale muda, a API `t` não.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `01-app/02-guides/internationalization.md` | 16.4.3 | Roteamento por sub-caminho: `proxy` redireciona sem locale; todos os arquivos especiais sob `app/[lang]`; `hasLocale`+`notFound()`; `lang` via `next/root-params` | Sem surpresa; **sem** opção `i18n` de config no App Router |
| `.../04-functions/next-root-params.md` | 16.4.3 | `lang()` não funciona em Server Actions/Route Handlers; precisa de `[lang]` acima do root layout | Limita: actions devem receber o locale do input ou do cookie |
| `.../04-functions/generate-metadata.md` | 16.4.3 | `metadataBase` + `alternates.canonical/languages` | Não |
| `.../03-file-conventions/01-metadata/sitemap.md` | 16.4.3 | `sitemap.ts`; `alternates.languages` por entrada | Não |
| Pendente (passo 0): `proxy.md` (matcher, composição com Auth.js), `generate-static-params.md`, `route-groups.md` (múltiplos root layouts), `redirects.md` | 16.4.3 | **Não li integralmente** | — |

## 5. Alternativas
| # | Opção | Prós | Contras | Risco / custo | Perf/SEO |
|---|---|---|---|---|---|
| A | Manter cookie (hoje) | Zero custo | Sem URL/hreflang; tudo dinâmico | nenhum | pior SEO |
| B | **Prefixo `/[lang]` nas páginas públicas + múltiplos root layouts** (público em `app/(site)/[lang]/layout.tsx`, privado em `app/(app)/layout.tsx`) | É o padrão oficial; SSG por idioma; `html lang` estático; hreflang | Navegar entre os dois root layouts recarrega a página inteira (ex.: Entrar, Carrinho, Conta); proxy novo precisa conviver com o Auth.js | médio-alto | melhor |
| C | Prefixo por `rewrite` no proxy mantendo um único root layout (locale em cabeçalho interno) | Um layout só | Espalha estado em header; SSG perde; comportamento com vinext incerto | médio | médio |
| D | Subdomínio/domínio por idioma | Separação total | Infra/DNS/cookies de sessão por domínio | alto | bom |
**Recomendação: B.** Rejeitadas: A (não resolve SEO), C (mantém dinamicidade), D (custo de infra sem pedido).

Slugs de seção (decisão P8b; default **A**): **(A) um slug canônico por seção, igual nos 3 idiomas** (`/pt/projects`, `/en/projects`, `/es/projects`, em inglês) vs **(B) slugs traduzidos** (`/pt/projetos`, `/es/proyectos`, `/en/projects`) com tabela e rewrites. B é mais bonito mas multiplica a manutenção (cada rota, sitemap, switcher, redirect) e o briefing só exige "mesma estrutura". Recomendo A; os slugs de item (`/projects/the-infinite-organism`) são únicos e não traduzidos.

Tabela canônica (default): `projects`, `exhibitions`, `residencies-events`, `news`, `books`, `shop`, `about`, `contact`. Código de URL de idioma: `pt`, `en`, `es` (mapeados a `pt-BR`, `en`, `es` do dicionário).

## 6. Design proposto
### 6.0 Referências e direção visual
N/A (sem mudança visual). O seletor mantém o visual da 0014 (bandeira, sem fundo); só passa a ser navegação.

### 6.1 Frontend
- **Rotas:**
  - `app/(site)/[lang]/layout.tsx` (root: `<html lang>`, Providers, `generateStaticParams` com os 3 idiomas, `hasLocale` + `notFound`), `app/(site)/[lang]/page.tsx` (home), `.../projects`, `.../exhibitions`, `.../residencies-events`, `.../news`, `.../books`, `.../shop`, `.../about`, `.../contact`; itens em `[slug]`.
  - `app/(app)/layout.tsx` (root privado, lê cookie): `login`, `cadastro`, `destino`, `conta`, `carrinho`, `dashboard`, `api` (api não precisa de layout).
- **Proxy** (`src/proxy.ts`): (1) caminhos públicos sem prefixo → redirect para `/{lang}/…` com idioma = cookie `locale` > `Accept-Language` > `pt` (padrão atual); (2) redirects 308 das rotas antigas (`/projetos`→`/pt/projects`, `/festivais-e-residencias`, `/exposicoes`, `/livros`, `/sobre`, `/loja`, `/blog`, `/contato`) preservando o idioma do cookie; (3) mantém `authorized` do Auth.js para as rotas privadas. Matcher exclui `_next`, `api`, arquivos estáticos. Composição Auth.js + proxy próprio: **verificar no passo 0** (hoje `export default NextAuth(authConfig).auth`).
- **Seletor** (`language-switcher.tsx`): em vez de `setLocale`+refresh, `Link` para `pathname` com o prefixo trocado (via `usePathname`), preservando query/hash; grava o cookie `locale` para lembrar a preferência (client, `samesite=lax`). Em rotas privadas (sem prefixo) continua cookie + `router.refresh()`.
- **LanguageProvider:** recebe `locale` do layout `[lang]`; `t` continua igual. `getT()` server passa a ler `lang` via `next/root-params` nas rotas públicas e cookie nas privadas (função única `getLocale()` com as duas fontes; actions recebem locale do input validado — `lang()` não funciona nelas).
- **Metadata:** helper `localizedMetadata(path)` devolve `alternates.canonical` e `languages` (`pt-BR`, `en`, `es`, `x-default`) + `metadataBase` (precisa da URL pública do site: **Q**); `src/app/sitemap.ts` lista todas as URLs × 3 idiomas; `robots.ts`.
- **Estados:** `not-found` por idioma (já existe `(home)/not-found.tsx`); `/xx/...` com idioma inválido → 404.
- **Responsivo/Acessibilidade:** seletor mantém alvo ≥2,75rem; cada opção com `lang` e `hreflang` (links reais, abrem com teclado e botão do meio). `aria-current="true"` no idioma atual. `html lang` correto no 1º byte (benefício de leitores de tela).
- **i18n:** mensagens existentes inalteradas.

### 6.2 Backend
- Sem banco. Actions públicas (`contact`, `newsletter`) já recebem `locale` do cookie: passam a ler do input validado por Zod (`z.enum(["pt-BR","en","es"])`) ou fallback do cookie; não confiar cegamente (apenas rótulo de log).
- Cache: páginas de conteúdo estático podem ser SSG; conteúdo de banco (0018) usa `revalidatePath`/tags nas actions do dashboard (definido na 0018).
- Dinâmico residual: header lê sessão (`auth()`), o que torna a página dinâmica; **decisão técnica a fechar no passo 0**: mover o estado de sessão do header para um sub-componente client (`useAuth`) ou usar PPR/`cacheComponents` (está DESLIGADO e quebra `export const dynamic`; não ligar sem spec). Default: header estático + ilha client de sessão (flash de "Entrar" aceito e testado).

## 7. Segurança e permissões
- Redirect do proxy usa caminho interno construído por allowlist (idioma + slug da tabela); nunca aceitar URL arbitrária (`src/lib/safe-path.ts` como referência).
- `callbackUrl` do login não pode escapar do site; idioma não entra nele sem validação.
- Sem rate limit novo. Cookie `locale` não sensível.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | `/` com cookie en | e2e | redirect `/en` |
| 2 | `/projetos` antigo | e2e | 308 → `/pt/projects` |
| 3 | Trocar idioma em `/pt/projects` | e2e | URL `/en/projects`, h1 em inglês, sem passar pela home |
| 4 | Idioma inválido `/fr/projects` | e2e | 404 |
| 5 | `hreflang` e canonical no `<head>` | e2e | 3 + x-default corretos |
| 6 | Sitemap | integração | URLs × 3 idiomas, sem rotas privadas |
| 7 | Rotas privadas sem prefixo continuam protegidas | e2e | `/dashboard` redireciona ao login |
| 8 | Idioma do cookie em `/login` | e2e | textos no idioma |
| 9 | Teclado no seletor + axe + 360/768/1280 | e2e | zero violações; sem rolagem horizontal |
| 10 | Unit: mapa de rotas/slug canônico e `localizePath()` | unit | trocas corretas, query preservada |

## 9. Plano de implementação
0. Ler proxy/generate-static-params/route-groups/redirects; confirmar composição com Auth.js; `npx vinext check` (já previsto na 0007 §6.3.7).
1. Utilitários puros: `LOCALE_PREFIX`, `localizePath`, `ROUTES` (unit).
2. Criar `(site)/[lang]` e mover páginas públicas (git mv), root layout dedicado; `(app)` para o privado.
3. Proxy + redirects antigos.
4. Seletor como `Link`; provider; `getLocale()` dupla.
5. Metadata/sitemap/robots.
6. Atualizar `nav.ts`, `site.ts`, links internos (`href` por helper `routeFor(lang, id)`).
7. e2e; capturas; build.

## 10. Riscos, rollback e dívidas
- Maior risco estrutural do plano: URLs mudam; links externos quebram sem redirect (mitigado, mas não há dados de tráfego).
- Recarga completa ao cruzar root layouts (Entrar/Carrinho): UX aceitável? alternativa: tornar `/login` etc. também sob `[lang]` (mais mudanças). Q8.
- Compatibilidade vinext: `next/root-params` e múltiplos root layouts **não verificados**; fallback: ler locale de `params` e passar por props. Registrar resultado de `vinext check`.
- Rollback: branch dedicada; redirects reversíveis.

## 11. Perguntas em aberto
- [ ] Q8 Adotar idioma na URL? **default** sim (B).
- [ ] Q8b Slugs canônicos em inglês iguais nos 3 idiomas? **default** sim.
- [ ] Q8c `/login`, `/conta` etc. ficam sem prefixo? **default** sim.
- [ ] URL pública do site (domínio) para `metadataBase`/sitemap: **default** variável de ambiente `NEXT_PUBLIC_SITE_URL` (público, não é segredo); sem valor, sitemap só em produção.
- [ ] Idioma padrão para quem chega sem cookie: **default** `Accept-Language`, fallback `pt`.

## 12. Checklist da review humana
- [ ] Alternativa B e slugs aceitos
- [ ] Impacto em URLs/SEO entendido
- [ ] Perguntas respondidas

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
