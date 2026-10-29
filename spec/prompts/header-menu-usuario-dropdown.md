# Prompt: botão de usuário logado com dropdown (dashboard/painel + Sair) e "Entrar" levando ao login

Status: PROMPT PARA APROVAÇÃO (não implementado). Vira a spec 0015 pelo fluxo do `spec/README.md` (agente `fullstack-nextjs`: docs -> spec -> aprovação humana -> implementação -> review). Pedido em 2026-10-29.

Contexto: Next.js 16 (ler `node_modules/next/dist/docs/` antes de codar), Tailwind v4, shadcn/ui sobre base-ui (`Button` sem `asChild`; link com cara de botão = `<Link className={buttonVariants(...)}>`; gatilho de dropdown = `DropdownMenuTrigger render={<Button .../>}`). Header em `src/components/header/app-header.tsx`, montado por `src/components/home/home-header.tsx` (home) e `src/components/site-header.tsx` (páginas internas). Regra do botão de sessão hoje em `src/lib/auth-cta.ts` (`getAuthCta`). Logout: Server Action `logout` em `src/actions/auth.ts` (`signOut({ redirectTo: "/" })` + flash "Você saiu"). Já existem `src/components/ui/dropdown-menu.tsx`, `avatar.tsx`, `separator.tsx`. Papéis: `ADMIN` (dono do site, dashboard) e `CUSTOMER` (cliente, área `/conta`); o dashboard é só de ADMIN (`dashboard/layout.tsx` redireciona cliente para `/conta`).

## Regra de trabalho
**Mobile primeiro e sempre entregue junto.** Verificar em 360, 390, 768 e 1280 (e2e Playwright + axe, sem rolagem horizontal, alvos >= 2,75rem). Sem `px` nas medidas (rem/cqw/escala Tailwind). Textos via i18n pt/en/es. Erros conforme spec 0003. Compatível com vinext (sem recurso Next-only novo além do que o header já usa).

## Comportamento desejado
1. **Deslogado**: o botão continua "Entrar" (ícone + texto, sem fundo/borda, como ajustado em 2026-10-29) e **leva para `/login`**. Nenhuma mudança no fluxo de login; só garantir por teste que o link aponta para `/login` em todas as larguras e no painel mobile.
2. **Logado**: o botão "Entrar" é **substituído** por um **botão de usuário**: ícone de usuário (lucide `UserIcon`/`CircleUserRoundIcon`) ou, se houver imagem de perfil, `Avatar` do shadcn com fallback de iniciais. Sem fundo e sem borda (igual ao idioma), com foco visível e alvo >= 2,75rem. Nome acessível: "Menu do usuário" (+ nome da pessoa quando existir).
3. **Dropdown** ao clicar (padrão shadcn "user nav / account menu": `DropdownMenuLabel` com nome e e-mail, `DropdownMenuSeparator`, itens com ícone à esquerda):
   - **ADMIN**: item "Ir para o dashboard" -> `/dashboard`.
   - **CUSTOMER**: item "Minha conta" (o painel do cliente) -> `/conta`. Decidir na spec se entra também "Meus pedidos" -> `/conta/pedidos` (recomendação: sim, como segundo item).
   - **Todos**: separador + item **"Sair"** que desloga e **leva para a página inicial `/`**, mostrando o toast "Você saiu" que a action `logout` já agenda. "Sair" é um `<form action={logout}>` com item `type="submit"` (não um link); garantir que o menu do base-ui não feche antes do submit e que funcione por teclado (Enter/Space).
   - Admin que também queira a área de cliente: **fora do escopo** por padrão (registrar como pergunta em aberto).
4. **A decisão de sessão e papel é do servidor** (sem flash após hidratação): `HomeHeader`/`SiteHeader` leem `auth()` e passam `user: { name, email, image, role }` para um componente novo `UserMenu` (client mínimo só para o dropdown). Nada de ler sessão no cliente para decidir o botão. Substituir/estender `getAuthCta` para devolver o modelo `{ state: "guest" | "user", ... }` e manter os testes dela.
5. **Mobile / painel (Sheet)**: não aninhar dropdown dentro do Sheet. No rodapé do painel, logado mostra um bloco com o nome, o link do painel (dashboard ou conta) e o botão "Sair" (form com `logout`), em lista, alvos >= 3rem. Deslogado mostra "Entrar" -> `/login` como hoje.
6. Onde o header aparece, é o **mesmo `UserMenu`** (home e páginas internas); eliminar a duplicação entre `home-header.tsx` e `site-header.tsx`. Os "Sair" avulsos de `conta/layout.tsx` e `dashboard/sidebar.tsx` permanecem (outras telas), mas podem reutilizar a chave i18n nova.

## Visual: shadcn como referência, tema do projeto como lei
- Referência de estrutura/composição: docs e blocos do shadcn (`npx shadcn@latest docs dropdown-menu avatar` apenas para consultar; **não copiar código Radix**: o projeto usa a variante base-ui, sem `asChild`).
- Cores/tipografia **só por tokens do tema** (`src/app/globals.css`, spec 0011): painel `bg-popover text-popover-foreground`, borda `border-border`, foco/hover do item `bg-accent text-accent-foreground` (verde do tema), "Sair" em `text-destructive` com contraste >= 4,5:1 medido sobre o fundo do painel, ícones `text-muted-foreground`, raio do tema (`rounded-lg`/0,25rem), fonte `font-sans` (Work Sans); nome do usuário pode usar `font-display` (Fraunces) se couber. Sem hex, sem `dark:` ad hoc, sem sombras novas fora de `paper-shadow` se existir. O dropdown abre alinhado à direita (`align="end"`), largura mínima ~14rem, sem estourar a viewport a 360.
- Sem animação em loop; entrada curta do dropdown respeitando `prefers-reduced-motion`.

## Tarefas
1. Docs: `dropdown-menu.tsx` do projeto (base-ui `Menu`: teclado, tipografia, foco devolvido), `avatar.tsx`, Server Actions + `form action` dentro de item de menu (checar nas docs do Next instalado como o `redirect` do `signOut` se comporta num submit disparado de dentro do menu). Registrar o que contradiz a expectativa.
2. Spec 0015: alternativas (dropdown base-ui vs. popover vs. menu só no Sheet), esboço ASCII por breakpoint, matriz de a11y (`aria-haspopup="menu"`, `aria-expanded`, `Esc`, foco devolvido, `role="menuitem"`), tabela de estados (deslogado, ADMIN, CUSTOMER, sessão expirando, sem nome/imagem), contraste medido dos pares de cor, plano de testes. **Parar no portão de aprovação.**
3. Implementação (após aprovação): `UserMenu` (client), modelo novo em `auth-cta.ts`, integração em `AppHeader` (barra xl+ e rodapé do Sheet), `HomeHeader` e `SiteHeader`, chaves i18n (`nav.userMenu`, `nav.logout`, `nav.myOrders` se entrar) em pt/en/es.
4. Testes: unit do modelo de sessão por papel; RTL (abre por clique e por teclado, itens por papel, "Sair" chama `logout`, `Esc` fecha e devolve o foco); e2e (deslogado: "Entrar" -> `/login` em 360 e 1280; logado como ADMIN: dropdown mostra dashboard, não mostra "Minha conta"; logado como CUSTOMER: o contrário; "Sair" volta para `/` com o toast e o botão volta a ser "Entrar"; axe sem serious/critical em pt/en/es; sem rolagem horizontal). Usar usuários semeados no banco de testes `loja_blog_test`, nunca o banco de desenvolvimento.

## Critério de aceite
- Deslogado: "Entrar" abre `/login`. Logado: botão de usuário com dropdown correto por papel e "Sair" que volta para a home deslogada.
- Mesmo comportamento na home e nas páginas internas; mobile usa o bloco do Sheet.
- Só tokens do tema, sem `px`, `tsc`, `eslint`, `vitest`, `next build` e Playwright verdes (informar as 5 falhas antigas de `menu-images`/`app-header`, se ainda existirem).

## Perguntas em aberto (cada uma com default)
1. Mostrar o primeiro nome ao lado do ícone em telas grandes? *Default:* só o ícone (nome no dropdown).
2. Admin também vê "Minha conta"? *Default:* não.
3. Cliente vê "Meus pedidos"? *Default:* sim.
4. Após o login, voltar para a página em que o usuário estava (`callbackUrl`)? *Default:* manter o fluxo atual (`/destino` por papel).
5. Foto de perfil: existe campo `image` no usuário? *Default:* ícone, com `Avatar` de iniciais só se houver dados.
