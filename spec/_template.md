---
id: NNNN
title: <título curto e específico>
status: draft            # draft | in-review | needs-revision | approved | in-progress | implemented | rejected
layers: [front, back]    # front | back | db | infra
owner: <quem pediu>
created: YYYY-MM-DD
approved_by:             # preenchido SOMENTE por humano
approved_at:             # preenchido SOMENTE por humano
---

# NNNN — <título>

## 1. Contexto e problema
<O que está acontecendo, por que importa, quem é afetado. Fatos, não soluções.>

## 2. Objetivos e não-objetivos
**Objetivos**
-
**Não-objetivos** (o que fica explicitamente de fora)
-

## 3. Estado atual do código
<Arquivos/componentes/actions relevantes e o que reaproveitar. Use `caminho:linha`.>

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz o que eu esperava? |
|---|---|---|---|
| node_modules/next/dist/docs/... | 16.x | | |

## 5. Alternativas
| # | Opção | Prós | Contras | Custo/risco | Impacto (bundle, perf, segurança) |
|---|---|---|---|---|---|
| A | Não fazer / usar o que já existe | | | | |
| B | | | | | |
| C | | | | | |

**Recomendação:** <opção e por quê. Alternativas rejeitadas e motivo em uma linha.>

## 6. Design proposto
### 6.0 Referências e direção visual (se houver UI)
- **Referências analisadas** (arquivo em `spec/references/` ou link):
- **Intenção/posicionamento** que a referência comunica:
- **Sistema extraído:** paleta (papel de cada cor) · tipografia (display vs leitura) · espaçamento/ritmo · grade · imagem · bordas/raios:
- **Padrões de layout a traduzir** (hero, faixas, cards, menu, rodapé…) → componente do projeto que os implementa:
- **O que NÃO copiar** (ativos de terceiros, marca, ilustrações):
- **Crítica de UI/UX** (evidência · severidade · proposta):

| # | Achado | Evidência | Severidade | Proposta |
|---|---|---|---|---|
| 1 | | | bloqueante / alta / média / baixa | |

### 6.1 Frontend
- **Árvore de componentes** (marque Server/Client e reuso de `src/components/ui`):
- **Rotas/segmentos** (`page`, `layout`, `loading`, `error`, `not-found`):
- **Estados**: loading / erro / vazio / sucesso:
- **Tema** (tokens usados; sem cor solta):
- **Comportamento responsivo** (descreva ou esboce em ASCII):

| Elemento | 360–390 (mobile) | 768 (tablet) | 1024 | 1280+ |
|---|---|---|---|---|
| Navegação | | | | |
| Hero / imagem principal | | | | |
| Grade de conteúdo | | | | |
| Formulários | | | | |
| Rodapé | | | | |

- **Acessibilidade** (contraste AA conferido com razões; foco; teclado; alvos ≥44px; `alt`; ordem de leitura; `prefers-reduced-motion`):
- **i18n** (pt/en/es: textos longos não quebram o layout):

### 6.2 Backend
- **Modelo de dados / migration** (diff do `schema.prisma`, índices, constraints, compatibilidade com dados existentes):
- **Contratos** (Server Actions / route handlers): input (Zod) → output → erros:
- **Regra de negócio e transações**:
- **Cache e revalidação**:
- **Integrações externas** (ex.: Azure):

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação (onde) |
|---|---|---|---|---|
| | | | | |

- IDOR / filtro por dono:
- Validação e limites de input:
- Rate limiting/abuso (login, cadastro, upload, checkout):
- Dados sensíveis / logs:

## 8. Plano de testes
| # | Caso | Camada (unit / integração / componente / e2e) | Resultado esperado |
|---|---|---|---|
| 1 | Caminho feliz | | |
| 2 | Input inválido | | |
| 3 | Não autenticado | | |
| 4 | Papel errado / recurso de outro usuário | | |
| 5 | Estados de erro/vazio/loading | | |
| 6 | Responsivo: 360 / 768 / 1280 sem rolagem horizontal | e2e (Playwright) | |
| 7 | Acessibilidade: zero violações serious/critical (axe) | e2e | |

Infra de testes necessária (se faltar, é item desta spec e depende de aprovação):

## 9. Plano de implementação
<Passos pequenos, ordenados, cada um verificável.>
1.
2.

## 10. Riscos, rollback e dívidas
- Riscos:
- Como reverter:
- Dívidas aceitas:

## 11. Perguntas em aberto
- [ ]

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
<Humano: data, decisão (aprovada / aprovada com ressalvas / revisar / rejeitada) e ressalvas.>

## 14. Relatório pós-implementação
<Preenchido pelo agente ao final: o que foi feito, capturas em 360/768/1280 (ou declaração de que a UI não foi verificada visualmente), desvios da spec e motivo, testes criados, comandos rodados e resultados, o que NÃO foi verificado, arquivos alterados por camada, como testar localmente.>
