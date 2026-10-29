---
id: 0016
title: Menu (ordem e nomes nos 3 idiomas), remoção de "Práticas" e footer completo em todas as páginas
status: approved
layers: [front]
owner: Thiago Morgado
created: 2026-10-29
approved_by: Thiago Morgado   # registrado pelo assistente a pedido expresso do humano ("eu aprovo essas specs pode fazer pois irei dormir"), com os defaults recomendados
approved_at: 2026-10-29
---

# 0016 — Navegação, nomes e footer

## 1. Contexto e problema
Auditoria 0015 §6.1 e §6.5: menu com About em 1º, "Festivais & Residências", ES "Acerca de" e dropdown "Práticas" fora do briefing; footer sem e-mail/redes/localização, "© Loja & Blog", ausente em várias páginas; `/loja`, `/blog`, `/carrinho`, `/conta` com shell antigo.

## 2. Objetivos e não-objetivos
**Objetivos**
- Ordem: Projects, Exhibitions, Residencies & Events, News, Books, Shop, About; nomes EN/PT/ES do briefing.
- Remover dropdown e rotas de Práticas (redirect 308 para `/projetos`).
- Footer único (Contato com `mailto:`, Instagram/Facebook, "Salvador, Bahia — Brazil" nos 3 idiomas, copyright, crédito opcional) em **todas** as páginas públicas, auth, `/conta` e telas de erro.
- Um só shell (HomeHeader/HomeFooter) para loja, blog, carrinho e conta.
**Não-objetivos:** mudar URLs por idioma (0017), páginas novas de conteúdo (0019), CRUD, estilo interno de Shop/News (0019/0020), dashboard (ver Q10).

## 3. Estado atual do código
- `src/lib/nav.ts:45-53` (lista, ordem, `href`), imagens PNG por idioma em `src/assets/Menu/`.
- `src/components/home/home-header.tsx:31` (grupo "Práticas" via `groups`), `src/components/header/app-header.tsx` (suporta `groups`, spec 0014).
- `src/components/sections/practice-nav.tsx`, `practice-gallery.tsx`, `src/app/(home)/(sections)/praticas/[tipo]/page.tsx`, `src/lib/content/details.ts:13-26` (`PRACTICES`, `PRACTICE_SLUGS`), `lookup.ts:25-35`, `projects.ts` (campo `practice`), chaves `practice.*` em `i18n.ts:158-166` e equivalentes.
- Footer: `src/components/home/home-footer.tsx`, `src/components/site-footer.tsx`, `src/lib/site.ts`.
- Shells: `src/app/(public)/layout.tsx`, `src/app/(private)/conta/layout.tsx:15`, `(auth)` sem footer, `src/app/not-found.tsx`, `global-error.tsx`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| `node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/redirects.md` (existência; leitura completa no passo 0) | 16.4.3 | `redirects` em `next.config.ts` aceita `permanent: true` (308) | A confirmar no passo 0 (não li o arquivo inteiro) |
| `.../03-file-conventions/route-groups.md` (índice) | 16.4.3 | Route groups existem; layout por grupo | A ler no passo 0 antes de mover `(public)` |

Honestidade: nesta spec li só o índice de redirects/route groups; a leitura integral é o **passo 0** da implementação.

## 5. Alternativas
| # | Opção | Prós | Contras | Custo/risco |
|---|---|---|---|---|
| A | Manter shell antigo em loja/blog e só trocar nomes | Menos mexida | Footer inconsistente; viola "todas as páginas" | baixo, mas não cumpre |
| B | **Mover `(public)` e `/conta` para o shell HomeHeader/HomeFooter (layout compartilhado)** | Um footer, visual coerente | Conteúdo de loja/blog (shadcn cru) fica "estranho" até 0019/0020 | médio |
| C | Footer como componente colocado no root layout | Presente em tudo (inclui erro) | O root layout hoje envolve também dashboard; HomeHeader mora em `(home)`; acoplamento | médio |
**Recomendação: B** + footer renderizável também por `not-found`/`error` (componente server `SiteFooterBar` reutilizado), dashboard fora (Q10).

Menu — nomes e **letreiros**: os PNG do cliente têm o texto desenhado (verificado: "Festivals & Residencies", "Festivais & Residências", "Acerca de"). Opções: (1) **pedir arte nova** à cliente (3 letreiros de Residências e Encontros + "Sobre mí"); (2) fallback em texto com `font-hand`/Caveat enquanto não chegam. **Recomendação:** implementar já com fallback (`image` opcional em `MenuItem`; sem imagem → `<span class="font-hand">`), trocar pelos PNG quando entregues. Alt do PNG deve **igualar o texto desenhado**: um PNG com nome antigo + alt novo é erro de acessibilidade (1.1.1), então não reutilizar o PNG antigo com o nome novo.

## 6. Design proposto
### 6.0 Referências e direção visual
- Referências: `spec/references/elena-home-ref-*.png`, `menu-desktop.png`, `elena-proto-*`; aprovadas em 0011/0013/0014. Nenhuma referência nova; mantém tokens `bg-salmon`, `text-ink`, `font-hand`.
- Footer (briefing §8): 3 blocos curtos legíveis, não microtexto. Layout: mobile coluna; md grid 3 colunas (Contato / Redes / Localização) + faixa inferior com © e crédito.
- Crítica:

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | PNG com nome antigo desenhado contradiz o briefing | `Eng_04/Port_04/Esp_01.png` | alta | fallback em texto até chegar arte |
| 2 | Footer só com ícones/links vazios hoje; e-mail como texto clicável precisa de área ≥2,75rem | `home-footer.tsx:8` | média | `mailto:` com `min-h-11`, texto visível (não só ícone) |
| 3 | "Salvador, Bahia — Brazil" é nome próprio; não traduzir "Brazil"? No briefing aparece "Brazil" em todos os idiomas | briefing §8 | baixa | rótulo traduz (LOCATION/LOCALIZAÇÃO/UBICACIÓN), valor fixo |
| 4 | Links legais vazios (Termos/Privacidade/Cookies) já ocultos por design | `site.ts:14-20` | baixa | manter oculto até existirem |
| 5 | Remover Práticas exclui conteúdo já aprovado (0012/0014) | specs 0012/0014 | média | decisão D1 do humano (ver Q3) |

### 6.1 Frontend
- **Árvore:** `SiteFooter` (Server) substitui `HomeFooter`/`site-footer.tsx` (um componente); `HomeHeader` perde `groups`; `AppHeader` mantém suporte genérico a `groups` (sem remover código reutilizável; remover só se ficar morto → decidir na review).
- **Rotas:** novo layout compartilhado `src/app/(site)/layout.tsx` (renomear/reagrupar `(home)` com `(public)`); `/carrinho`, `/loja`, `/blog`, `/conta` herdam. Remover `praticas/[tipo]`; `next.config.ts` `redirects`: `/praticas/:tipo` → `/projetos` (permanent). `/festivais-e-residencias` mantém até 0017.
- **Dados:** `SITE` ganha `contactEmail`, `location: Record<Locale,string>` ou constante, `social` preenchido (Q7). Sem e-mail configurado o bloco não aparece (sem link morto), **mas o briefing exige** → Q7 é bloqueante para aceitar o critério.
- **Estados:** footer é estático; sem loading/erro.
- **Tema:** tokens existentes. Footer em `bg-secondary`/`text-foreground` (contraste a conferir no teste axe).
- **Responsivo:**

| Elemento | 360–390 | 768 | 1024 | 1280+ |
|---|---|---|---|---|
| Menu | overlay (igual hoje) | overlay | overlay | linha (xl, 0014); ordem nova; 7 itens cabem? **verificar** com nomes mais longos (RESIDÊNCIAS E ENCONTROS) |
| Footer | 1 coluna: Contato, Redes, Localização, © | 3 colunas | 3 colunas | 3 colunas + faixa |

```
md+:  [Contato  e-mail@…]  [Instagram · Facebook]  [Localização: Salvador, Bahia — Brazil]
      © 2026 Elena Landínez            Site por …
```
- **Acessibilidade:** `<footer>` com `<nav aria-label>` das redes; links externos `rel="noopener noreferrer"` + indicação "abre em nova aba" no nome acessível; foco visível; alvos ≥2,75rem; contraste AA conferido por axe nos 3 viewports.
- **i18n:** chaves novas `footer.contactLabel`, `footer.location`, `footer.locationValue` (fixo), `menu.item.*` revistos; "Residências e Encontros"/"Residencias y Encuentros"/"Residencies & Events" e "Sobre mí" no `i18n.ts`; en/es mais longos: testar quebra em 360 no letreiro de texto.

### 6.2 Backend
N/A (sem banco). `src/actions/contact.ts` continua para `/contato`.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ver footer/menu | sim | sim | sim | n/a |
- Redirect `/praticas/*` é fixo no config (sem input do usuário). Links externos com `noopener`. E-mail exposto é intencional (briefing); risco de spam aceito (Q7).
- Sem rate limit novo.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Ordem e nomes do menu nos 3 idiomas | componente/e2e | 7 itens na ordem do briefing; textos exatos |
| 2 | `/praticas/desenho` | e2e | 308 → `/projetos` |
| 3 | Footer em `/`, `/projetos`, `/loja`, `/blog`, `/carrinho`, `/login`, `/conta`, 404 | e2e | `mailto:` correto, localização presente |
| 4 | Redes sem URL | componente | item oculto (sem link morto) |
| 5 | Teclado: abrir menu, Esc, foco | e2e | foco preso e retorno |
| 6 | 360/768/1280 sem rolagem horizontal | e2e | `scrollWidth <= clientWidth` |
| 7 | axe serious/critical | e2e | zero |
| 8 | Unit: lista `MENU_ITEMS` ids/ordem vs `i18n` 3 idiomas | unit | falha se faltar chave |
Infra: Vitest e Playwright já existem (`package.json`).

## 9. Plano de implementação
0. Ler `redirects.md` e `route-groups.md` por inteiro; conferir o resultado registrado de `npx vinext check` (0007 §6.3.7).
1. i18n: novas chaves e nomes (3 idiomas) + teste de completude.
2. `nav.ts`: reordenar; `image` opcional com fallback em texto; remover dependência dos PNG antigos de "festivais" e "about ES" (manter arquivos até arte nova).
3. Remover Práticas (header, páginas, componentes mortos, chaves, campo `practice`), adicionar redirect.
4. `SITE` + `SiteFooter` único; aplicar a todos os layouts/erros.
5. Reagrupar `(public)`/`conta` ao shell único.
6. e2e atualizado (`e2e/pages.spec.ts` remove `/praticas/desenho`), capturas 360/768/1280.
7. `tsc`, `eslint`, `vitest`, `playwright`, `next build`.

## 10. Riscos, rollback e dívidas
- Compatibilidade vinext: `redirects` em `next.config` e `next/image` (🟡 no vinext, spec 0007 §6.3). Sem recurso Next-only novo; manter `<footer>` puro.
- Rollback: reverter commit; redirect é só config.
- Dívida: PNG antigos e `AppHeader.groups` podem ficar sem uso.
- Risco: mudar `(public)` para o shell novo quebra estilos de shadcn nas páginas de loja até 0019/0020 (capturas obrigatórias).

## 11. Perguntas em aberto
- [ ] Q3 Práticas: **default** remover + redirect (D1). Alternativa: manter como rota oculta.
- [ ] Q5 Arte nova dos letreiros: **default** fallback em texto até a cliente enviar.
- [ ] Q7 E-mail, Instagram, Facebook, nome do site (`SITE.name`): **default** nada inventado; sem valor, bloco oculto e critério do briefing fica pendente.
- [ ] Q10 Footer no dashboard: **default** não (área administrativa).
- [ ] Rodapé: manter tagline "arte é vida"? **default** sim (aprovada na 0013), acima da faixa.

## 12. Checklist da review humana
- [ ] Escopo e remoção de Práticas aceitos
- [ ] Fallback textual dos letreiros aceito
- [ ] Footer (campos e layout) aceito
- [ ] Perguntas respondidas

## 13. Registro de aprovação
<Humano.>

## 14. Relatório pós-implementação
<Agente, ao final.>
