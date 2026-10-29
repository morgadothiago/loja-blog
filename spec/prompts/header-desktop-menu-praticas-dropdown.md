# Prompt: overlay do menu só no mobile; navegação visível no header em telas grandes; "Práticas" em dropdown

Status: PROMPT PARA APROVAÇÃO (não implementado). Vira a spec 0014 pelo fluxo do `spec/README.md` (agente `fullstack-nextjs`: docs -> spec -> aprovação humana -> implementação -> review). Motivo de não implementar já: muda decisões aprovadas (0001 #7, 0005: overlay em todas as larguras; 0013: palavra "menu" em todas as larguras), então precisa do seu OK. O screenshot anexado ao pedido não pôde ser lido pelo agente (fica fora do diretório do projeto); se ele traz um desenho específico, copie-o para `spec/references/` e cite aqui.

Contexto: Next.js 16 (ler `node_modules/next/dist/docs/` antes de codar), Tailwind v4, shadcn com base-ui (`Button` sem `asChild`; link com cara de botão = `<Link className={buttonVariants(...)}>`). Header em `src/components/header/app-header.tsx`, montado por `src/components/home/home-header.tsx`. Já existe `AppHeader` com `overlayOnly` (hoje usado na home) e navegação em linha para `lg+` quando `overlayOnly` é falso. Dropdown base: `src/components/ui/dropdown-menu.tsx` (base-ui `Menu`). Itens: `MENU_ITEMS` (`src/lib/nav.ts`, letreiros PNG) e `PRACTICES`/`practiceSlug` (`src/lib/content/details.ts`, rotas `/praticas/desenho|ceramica|colagem`).

## Regra de trabalho (vale para esta e para as próximas tarefas)
**Mobile primeiro e sempre entregue junto.** Toda mudança de layout é escrita para 360 px e ampliada; nenhuma tarefa é "pronta" sem verificação em 360, 390, 768 e 1280 (e2e Playwright + axe, sem rolagem horizontal, alvos >= 2,75rem). Sem `px` nas medidas (rem/cqw/escala Tailwind).

## Comportamento desejado
1. **< lg (mobile e tablet)**: como hoje. Palavra "menu" manuscrita à direita abre o Sheet em overlay (foco preso, `Esc`, `aria-expanded`), com letreiros PNG e a sublista "Práticas".
2. **>= lg (telas grandes)**: sem overlay. Header com logo à esquerda e, à direita, a navegação em linha: Sobre, Projetos, **Práticas (dropdown)**, Exposições, Festivais & Residências, Livros, Notícias, Shop; depois idioma, carrinho e Entrar/Minha conta.
3. **Práticas = dropdown** (Desenho, Cerâmica, Colagem) com `DropdownMenu` do projeto: abre por clique, `Enter`/`Space`/`ArrowDown`, fecha com `Esc` e devolve o foco; itens são `<Link>` reais para `/praticas/...`; `aria-current` na prática ativa; gatilho com `aria-haspopup`/`aria-expanded` e alvo >= 2,75rem.
4. **Itens do header em texto, não em PNG**: os letreiros PNG são grandes demais para a barra (altura ~3,6rem). Decidir na spec entre (a) texto Fraunces para o desktop e PNG só no overlay (recomendado) ou (b) PNG reduzido. Registrar a crítica de legibilidade e de largura em en/es (os textos mais longos: "Festivais & Residências", "Festivals & Residencies").
5. Overflow: com 8 itens + ações a barra pode estourar em 1024; definir o ponto de quebra (ex.: `xl` para a linha completa e `lg` com "Mais"/menu) com medição em en/es, nunca rolagem horizontal.
6. Header transparente no topo e `bg-background` ao rolar (sentinela `#home-top`) permanece; link ativo sublinhado com `ink-link`/terracota.

## Tarefas
1. Docs: `dropdown-menu`/base-ui `Menu` instalado (Tab, setas, typeahead) e `link.md`/`usePathname`. Registrar o que contradiz a expectativa.
2. Spec 0014 com alternativas (dropdown base-ui do projeto vs. `<details>` nativo vs. lista sempre aberta), tabela de breakpoints (360/390/768/1024/1280), esboço ASCII, matriz de a11y e plano de testes. Parar no portão de aprovação.
3. Implementação (após aprovação): `AppHeader` passa a aceitar `overlayBelow="lg"` (ou remover `overlayOnly` na home) e renderiza `NavLinks` (Server/Client mínimo) + `PracticesMenu` (client); `HomeHeader` fornece itens em texto traduzidos; manter `groups`/overlay para mobile sem duplicar links no DOM acessível (esconder o que não é usado com `hidden lg:flex`/`lg:hidden`, não `aria-hidden`).
4. Testes: RTL (dropdown abre/fecha por teclado, `aria-current`, 3 links), e2e em 360/768/1024/1280 (menu overlay só < lg; nav visível >= lg; sem rolagem horizontal; axe sem serious/critical em pt/en/es), e atualizar os testes que cravam "palavra menu em todas as larguras" (`e2e/home.spec.ts`, `tests/app-header.test.tsx`, `tests/home-header.test.tsx`).

## Critério de aceite
- 360/390/768: só "menu" + overlay; 1280: navegação visível com dropdown Práticas funcionando por mouse e teclado.
- Sem mudança perceptível no restante da home; `tsc`, `eslint`, `vitest`, `next build` e Playwright verdes (informar as 5 falhas antigas de `menu-images`/`app-header`, se ainda existirem).
