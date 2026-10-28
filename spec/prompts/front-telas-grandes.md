# Prompt: o site não pode esticar em telas grandes (front-end)

Contexto: Next.js (versão instalada, ler `node_modules/next/dist/docs/` antes de codar), Tailwind, shadcn. Home e páginas do menu em `src/app/(home)/`, componentes em `src/components/home/` e `src/components/sections/`. Hoje o conteúdo cresce junto com a janela (sem container) e em 1440px, 1920px ou 2560px imagens, carrossel e cards ficam enormes e o layout parece esticado.

## Regra (decisão de design)

1. **Fundos de ponta a ponta, conteúdo com largura máxima.** Cada seção é um `<section>` de fundo full-bleed (bege do hero, claro da página, faixa amarela, rodapé). O conteúdo dentro dela fica numa composição centralizada com largura máxima única, definida em um só lugar (token CSS `--content-max: 1440px`, utilitário `.page-width`: `mx-auto w-full max-w-[var(--content-max)] px-5`). Nenhum componente define seu próprio `max-w`/`w-[xx%]`: todos usam `.page-width`.
2. **Padding lateral fixo `px-5` (20px)** em todas as larguras, como já decidido. Acima de `--content-max` o excedente vira margem do fundo, nunca largura de conteúdo.
3. **Proporção, não altura.** Imagens e blocos usam `aspect-ratio` constante (carrossel 11/6, banner 3/1, histórias 4/5 · 4/3 · 1/1, destaque 1/3 + 2/3). Proibido: alturas em `svh`/`vh`, `max-h-[...]` para "caber na janela", `object-cover` forçando recorte para ganhar altura, tamanhos `px`/`rem` mágicos, `clamp()` com `vw` que cresce sem teto.
4. **Tipografia com teto.** Escala fluida mobile → `lg`, depois fixa. Sem `xl:`/`2xl:text-*` que aumentem fonte; títulos máximos: hero `text-3xl`, seções `text-4xl`, card `text-lg`, destaque `text-3xl`.
5. **Imagens**: `next/image` com `sizes` coerente com o teto (`(min-width: 1440px) 1400px, 100vw`), sem baixar mais pixels que o necessário.
6. **Header** sticky pode ser full-bleed (fundo) com conteúdo também em `.page-width`. Menu Sheet lateral não muda.

## Tarefas

1. Criar `--content-max` e `.page-width` em `src/app/globals.css`; remover/substituir `content-fit` e todas as frações (`lg:w-4/5`, `2xl:w-2/3`).
2. Refatorar hero, carrossel, banner, histórias, destaque, newsletter, rodapé, header e `src/components/sections/*` para o padrão (fundo full-bleed + `.page-width`).
3. Varrer e remover tudo que a regra 3 e 4 proíbem.
4. Testes: estender `tests/layout-fullwidth.test.tsx` para (a) exigir `.page-width` no conteúdo de cada seção, (b) falhar se aparecer `svh`, `max-h-[`, `clamp(`, `xl:`/`2xl:` com `text-`/`w-`, `content-fit`.
5. Atualizar a matriz de breakpoints na spec 0001 (360, 768, 1280, 1440, 1920, 2560) com larguras e proporções resultantes; reportar antes/depois por componente.

## Critério de aceite

- Em 1920×1080 e 2560×1440 o conteúdo ocupa no máximo 1440px, centralizado, com fundos de ponta a ponta; carrossel e banner nunca passam da altura da janela por proporção.
- Em 360, 768, 1280 e 1440 nada muda de forma perceptível.
- Sem rolagem horizontal; `tsc`, `eslint`, `vitest` e `next build` verdes.
- Sem verificação visual automatizada (Playwright não aprovado): listar o que o usuário deve conferir em 1440, 1920 e 2560.

## Observação ao usuário

Esta regra reintroduz uma largura máxima do conteúdo (1440px), que contraria o pedido anterior de "sem container". Foi escolhida porque é a única forma de impedir o esticamento em monitores grandes sem perder fundos de ponta a ponta. O valor é um único token, fácil de ajustar.
