# Specs

Toda mudança relevante começa aqui, antes do código. O agente `fullstack-nextjs` (`.claude/agents/fullstack-nextjs.md`) escreve e implementa; **o humano aprova**.

## Ciclo de vida

```
draft → in-review → approved → in-progress → implemented
              ↘ needs-revision ↗                 (review humana final)
              ↘ rejected
```

| Fase | Quem | O que acontece |
|---|---|---|
| 1. Pesquisa + spec | agente | Lê as docs das versões instaladas, compara alternativas, escreve `NNNN-slug.md` (`in-review`) e **para**. |
| 2. Review da spec | **humano** | Lê, marca o checklist (seção 12), responde perguntas em aberto. |
| 3. Aprovação | **humano** | Muda o front-matter para `status: approved` e preenche `approved_by` / `approved_at`. |
| 4. Implementação + testes | agente | Só começa com `approved`. Front e back, com testes. |
| 5. Review final | **humano** | Revisa o código e o "Relatório pós-implementação" (seção 14). |

## Como usar

1. Peça a feature ao agente: *"use o agente fullstack-nextjs para <pedido>"*.
2. Ele devolve a spec e a frase `AGUARDANDO APROVAÇÃO HUMANA`.
3. Para aprovar, edite o front-matter da spec (`status: approved`, `approved_by`, `approved_at`) e peça: *"spec 0001 aprovada, implemente"*. Para pedir ajustes, escreva na seção 13 e use `status: needs-revision`.

## Convenções
- Nome: `NNNN-slug-curto.md` (4 dígitos, próximo livre). Use `_template.md` como base.
- Uma spec por mudança coesa. Escopo cresceu durante a implementação? O agente para e volta a `needs-revision`.
- Specs não são apagadas; `rejected` e `implemented` ficam como histórico de decisão.
