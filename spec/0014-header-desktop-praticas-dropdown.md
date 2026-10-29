---
id: 0014
title: Header com navegação em linha em telas grandes (xl+), overlay só abaixo, "Práticas" em dropdown
status: implemented
layers: [front]
owner: Thiago Morgado
created: 2026-10-29
approved_by:    # NÃO preenchido pelo agente. Autorização do humano em mensagem própria: "pode começar a fazer" (após ler spec/prompts/header-desktop-menu-praticas-dropdown.md)
approved_at:
---

# 0014 — Header desktop + dropdown "Práticas"
Escopo, regra "mobile junto" e critérios: ver `spec/prompts/header-desktop-menu-praticas-dropdown.md` (é o briefing aprovado verbalmente). Este arquivo registra as decisões tomadas na implementação e supera a 0001 #7, 0005 e o trecho da 0013 "menu em todas as larguras".

## Decisões
| Tema | Escolha | Alternativas rejeitadas |
|---|---|---|
| Breakpoint | `xl` (1280). Medida: 8 itens + idioma + carrinho + conta não cabem em 1024 (estimativa ~1370 px com ações completas) | `lg`: estoura em en/es |
| Itens no header | **letreiros PNG do cliente** (pedido do humano), 1,75rem de altura (1 linha) e 2,75rem (Festivais & Residências, arte de 2 linhas); "Práticas" em texto Fraunces (não há arte) | texto Fraunces em todos |
| Práticas | `DropdownMenu` do projeto (base-ui Menu: setas, Esc, foco), itens `<Link>`; fica logo após "Projetos" | `<details>`; lista aberta |
| Ações no desktop | idioma compacto (bandeira+sigla), carrinho em ícone, conta/entrar em ícone com nome acessível | botões com texto (largura) |
| Overlay | inalterado abaixo de `xl` (mobile/tablet), com "Práticas" em lista | — |

## Crítica
- Alvos >= 2,75rem em tudo; nome acessível do ícone de conta = rótulo completo. Severidade média: ícone de conta sem texto visível; mitigado por `title` e nome acessível.
- Em en/es "Festivals & Residencies" é o item mais largo: validado por e2e em 1280 sem rolagem horizontal.

## Plano de testes
RTL: dropdown abre por teclado, 3 links, `aria-current`. e2e 360/390/768/1280: overlay abaixo de xl, nav visível em 1280, sem rolagem horizontal, axe pt/en/es.

## Relatório pós-implementação
Feito: `AppHeader` (`groups.afterHref`, nav em linha `xl:flex`, `GroupMenu` com DropdownMenu, gatilho `xl:hidden`, ações em ícone), `HomeHeader` (sem `overlayOnly`), `LanguageSwitcher` compacto sem aria-label (sigla visível + sr-only; corrige axe label-content-name-mismatch). Testes: vitest 404 ok / 5 falhas pré-existentes; Playwright 68/68 (overlay <1280, nav + dropdown por teclado em 1280 pt/en/es, sem rolagem horizontal, axe). Evidência: `spec/evidence/0013/header-1280.png`. Pendência: Festivais usa a arte de 2 linhas (não existe versão de 1 linha); letras ficam menores que as de 1 linha. Verificação visual só no Chromium.
