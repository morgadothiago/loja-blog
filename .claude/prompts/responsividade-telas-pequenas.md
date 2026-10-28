# Prompt: corrigir responsividade em telas pequenas

Use com o agente `fullstack-nextjs`. Cole o print do problema e o nome da seção.

---

Analise a seção [NOME DA SEÇÃO] em telas pequenas (320, 360, 390, 430 e 480 de largura) e corrija tudo que estiver fora do esperado, mantendo o layout aprovado na referência.

Como investigar
1. Abra o componente e o CSS da seção; liste as classes que definem largura, altura, espaçamento e fonte.
2. Capture a seção em 320, 360, 390, 480, 768 e 1440 de largura (Playwright com o Brave, script em scratchpad/pw/shot.mjs) e compare com a referência.
3. Procure: rolagem horizontal, texto quebrando em linhas indesejadas, itens sobrepostos ou cortados, imagens pequenas ou deformadas, alvos de toque menores que 2.75rem, textos ilegíveis (menores que 0.75rem), espaços vazios exagerados.

Regras
- Nenhuma medida em px: use rem, cqw, %, `clamp()` ou a escala do Tailwind. Exceções: media queries e o atributo `sizes` de imagens.
- Mobile first: o estilo base serve para a menor tela; `sm:`, `md:` e `lg:` só acrescentam.
- Conteúdo limitado a `--content-max` (90rem); fundos de ponta a ponta.
- Imagens com `aspect-ratio` e `max-width: 100%`; nada com `min-width` maior que a tela.
- Texto com `whitespace-nowrap` só quando couber em 320 de largura; senão deixe quebrar.
- Mantenha acessibilidade: foco visível, contraste, alvos de toque de pelo menos 2.75rem.

Entrega
- Lista de problemas encontrados, com a largura em que ocorrem.
- Correções feitas (arquivo e classe antes/depois).
- Capturas antes/depois nas larguras acima e testes atualizados (`npx vitest run`, `tsc`, `eslint`).
