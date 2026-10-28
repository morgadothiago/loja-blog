---
id: 0010
title: Sobre — fidelidade à referência 8.png (layout editorial: faixa rosa, fotos, cachalote, CV)
status: approved
layers: [front]
owner: Thiago Morgado
created: 2026-10-28
approved_by: Thiago Morgado (mensagem na conversa: "pode iniciar a implementacao da specs", seguindo as recomendações da seção 11)
approved_at: 2026-10-28
---

# 0010 — Sobre: fidelidade à referência `8.png`

## 1. Contexto e problema
Pedido: criar a tela About igual a `/private/tmp/claude-501/-Users-thiagomorgado-Desktop-loja-blog/dcc640a1-e4f7-404d-9cb8-6c336c405d0e/images/8.png` (captura mobile ~350px, página inteira; lida de fato). A rota `/sobre` e `AboutContent` existem (spec 0005). Esta spec só ajusta o que diverge; não revoga 0005, 0001 nem 0006.

Restrições do pedido: sem `px` (rem, cqw, %, escala Tailwind); fonte padrão sans-serif; mobile first; verificar em 360/768/1440; conteúdo até `--content-max` (90rem, `src/app/globals.css:155`); newsletter e footer prontos preservados; não reverter mudanças não commitadas; textos nas 3 línguas em `src/lib/i18n.ts`.

## 2. Objetivos e não-objetivos
**Objetivos:** reproduzir a ordem e a composição da referência com os arquivos que já existem em `src/assets/About`.
**Não-objetivos:** menu overlay (já existe; a imagem mostra o menu aberto só como estado da captura); newsletter/footer; criar arte; backend/DB; fonte manuscrita (ver 6.0 e pergunta 3).

## 3. Estado atual do código
- `src/app/(home)/(sections)/sobre/page.tsx:7` renderiza `SectionPage id="about"` + `AboutContent`.
- `src/components/sections/section-page.tsx:12-37`: faixa `bg-secondary` com letreiro como h1, subtítulo e o rótulo "Conteúdo de exemplo", depois `page-width`.
- `src/components/sections/about-content.tsx:10-73`: retrato (`Foto_ppal.jpg`) + 3 parágrafos de exemplo lado a lado em md+; botão CV só com `SITE.cvUrl` (`src/lib/site.ts:10`, hoje `undefined`); seção "Imagens" com Photos2, cachalote, colagens e divisor.
- Dados: `ABOUT` em `src/lib/content/index.ts:40-52`. Textos: `about.*` em `src/lib/i18n.ts` (pt ~99-107, en ~289-297, es ~476-484).
- Testes existentes em `tests/` (vitest); não há teste de `AboutContent`.

## 4. Documentação consultada
| Fonte | Versão | O que confirmei | Contradiz? |
|---|---|---|---|
| Código do projeto (acima) | Next 16.x | Página é Server Component; `getT()` do servidor; imagens por import estático | N/A |
| `node_modules/next/dist/docs/` (`next/image`) | a ler na implementação | Nada novo de API de Next será usado; só props já usadas no projeto (`sizes`, `style`) | A confirmar antes de codar |

## 5. Alternativas
| # | Opção | Prós | Contras | Risco |
|---|---|---|---|---|
| A | Manter o layout atual | Zero trabalho | Diverge em ordem, faixa rosa, composição e CV oculto | Pedido não atendido |
| B | Reescrever `AboutContent` (e uma variante de topo) mantendo `SectionPage`, dados em `ABOUT`, i18n | Mudança localizada, reaproveita tokens e imagens | `SectionPage` hoje impõe faixa de título que a referência não tem | Baixo |
| C | Nova rota/layout próprio para Sobre sem `SectionPage` | Fidelidade total ao topo | Duplica casca; foge do padrão das outras páginas | Médio |

**Recomendação:** B, com `SectionPage` aceitando um modo sem faixa de título apenas para `about` (ex.: prop `hero` opcional) ou `AboutContent` renderizando o topo e a página dispensando `SectionPage`. Decisão final na implementação; o h1 deve continuar existindo (pode ser `sr-only` se o letreiro "Elena Landinez" for imagem com alt). Rejeitadas: A (não atende), C (duplicação).

## 6. Design proposto
### 6.0 Referências e direção visual
- **Referência:** `images/8.png` (leitura direta). Também há `spec/references/igual-about.png` (recorte só da newsletter; preservada).
- **Intenção:** portfólio editorial, artesanal, calmo; bastante respiro; texto de leitura simples sobre fundo creme.
- **Sistema extraído:** fundo creme (`bg-background`), faixa rosa/salmão cheia para a bio (`bg-salmon`, texto escuro), faixa mostarda da newsletter (`bg-mustard`, já pronta), texto corrido pequeno e justificado à esquerda, títulos de seção manuscritos curtos ("A Artista", "Sonhos e Desenhos"), link "download CV" manuscrito com asterisco rosa. Imagens sangradas sem borda; colagens recortadas sobre o fundo rosa.
- **Fonte:** o pedido manda sans-serif padrão; os títulos manuscritos da referência serão **texto sans-serif** (`font-heading` do projeto), não imagem. Sem fonte manuscrita nova.

**Diferenças concretas (referência vs. atual):**
| # | Referência | Atual |
|---|---|---|
| D1 | Topo: foto grande da artista sangrada na largura, letreiro "Elena Landinez" sobreposto (`Elena_landinez.png`), sem faixa de título nem subtítulo/rótulo "exemplo" | Faixa `bg-secondary` com letreiro "Sobre", subtítulo e "Conteúdo de exemplo"; retrato menor, em coluna com texto |
| D2 | Faixa rosa de ponta a ponta com título "A Artista" e 2 parágrafos | Sem faixa; 3 parágrafos de exemplo ao lado do retrato |
| D3 | Dentro da faixa rosa: linha de 4 colagens com legenda pequena (alinhada à direita) | Colagens (`Characters_1.png`) soltas ao fim, sem fundo rosa nem legenda |
| D4 | Título "Sonhos e Desenhos" e 2 fotos lado a lado, sangradas | Título genérico "Imagens"; `Photos2_png.png` (já contém as duas fotos sobre fundo transparente) |
| D5 | 2 parágrafos de bio longa abaixo das fotos | Inexistentes |
| D6 | "download CV" manuscrito com asterisco, alinhado à direita, sempre visível | Botão só aparece com `SITE.cvUrl` (hoje oculto) |
| D7 | Cachalote grande, sangrada, entre o CV e a newsletter | Cachalote antes das colagens, dentro de `page-width` |
| D8 | Divisor decorativo não existe | Divisor `Serzinhovoador.png` ao fim |
| D9 | Ordem: topo, faixa rosa, galeria, bio, CV, cachalote, newsletter, footer | Ordem diferente (ver acima) |

**Mapeamento de ativos (todos existem; import estático das originais, sem reduzir, sem copiar para `public/`):**
| Slot | Arquivo | Observação |
|---|---|---|
| Foto da artista (topo) | `src/assets/About/Foto_ppal.jpg` (1200x1600) | `object-cover`, recorte de topo a definir |
| Letreiro "Elena Landinez" | `src/assets/About/Elena_landinez.png` (747x225) | Sobre a foto; **PNG branco sobre foto: conferir contraste**. alt = nome |
| 4 colagens | `src/assets/About/Characters_1.png` (7433x1637) | Já são as 4 da referência (lírios, flor-olho, tuba, saxofone); fundo transparente (a visualização preta é artefato) |
| 2 fotos "Sonhos e Desenhos" | `src/assets/About/Photos2_png.png` (2732x1658) | Uma única imagem com as duas fotos lado a lado e moldura transparente; sem placeholder |
| CV | `src/assets/About/DownloadCV.png` (649x149) | Usar o arquivo; o link aponta para `SITE.cvUrl` |
| Cachalote | `src/assets/About/Whale.png` (2631x905) | Fundo transparente |
| Divisor | `Serzinhovoador.png` | Remover do layout (não está na referência) ou manter só se aprovado |
| Fora do escopo desta tela | `Characters_2.png`, `Characters_2(1).png`, `Iconesredes.png`, `Menulistras.png` | Não aparecem na referência (a newsletter/ícones já têm seus arquivos) |

**Não há arte faltando para os slots visíveis.** Falta apenas **conteúdo**: os textos da referência (bio da artista, legenda, CV real) são de terceiro; entram como texto de exemplo neutro nas 3 línguas (ver pergunta 1), não copiados.

**O que NÃO copiar:** textos da referência (nome, cidade, MOTH/NYU etc.); usar apenas as imagens já presentes no projeto, cuja autorização de uso é do cliente.

**Crítica de UI/UX**
| # | Achado | Evidência | Sev. | Proposta |
|---|---|---|---|---|
| 1 | Letreiro branco sobre foto: contraste variável (céu/água claros) | Captura: letreiro sobre céu azul claro no canto superior | alta | Usar a versão que o projeto já tem; se contraste < 3:1, aplicar gradiente `from-black/40` por cima da foto (token) ou posicionar sobre área escura. Conferir com cálculo na implementação |
| 2 | Legenda das colagens em microtexto (~0,6rem na captura) | Linha sob as colagens | média | Mínimo `text-xs` (0,75rem), contraste escuro sobre rosa; informação não essencial |
| 3 | Texto corrido pequeno na referência | Parágrafos ~0,8rem | média | Corpo mínimo `text-base`, `max-w-[65ch]`, `leading-relaxed` |
| 4 | "download CV" manuscrito fino | Fim da bio | média | Usar `DownloadCV.png` com `alt` e alvo mínimo 2,75rem; foco visível |
| 5 | Link CV sem destino (`cvUrl` indefinido) | `src/lib/site.ts:10` | alta | Não renderizar link morto: só renderiza com URL; ver pergunta 2 |
| 6 | Colagens em 7433x1637 em 360: cada uma fica ~4rem | Proporção 4,5:1 | média | Mobile: permitir rolagem? Não. Proposta: manter imagem única `w-full` (sem rolagem horizontal) e aceitar tamanho pequeno; alternativa é recortar em 2x2 (exige novos arquivos, fora do escopo) |
| 7 | Cachalote (2631x905) sangrada em 1440 fica enorme | `object-contain` | baixa | Limitar a `--content-max` e centralizar |
| 8 | Duas fotos em 360 ficam pequenas | Foto única 2732x1658 | média | Manter lado a lado como na referência; sem recorte |

### 6.1 Frontend
- **Árvore (todos Server Components, sem `"use client"`):** `AboutPage` → `AboutHero` (foto + letreiro, h1 acessível) → `AboutArtist` (`bg-salmon`: título, 2 parágrafos, colagens + legenda) → `AboutGallery` (título + `Photos2_png`) → `AboutBio` (2 parágrafos + link CV) → cachalote. Newsletter e footer vêm do layout `(home)` já existente (a conferir na implementação em `src/app/(home)/layout.tsx`; **não alterar**).
- **Rotas:** mesma `/sobre`; sem novos `loading`/`error`.
- **Estados:** vazio/erro N/A (conteúdo estático). Sem `SITE.cvUrl`: sem link (estado deliberado).
- **Tema:** `bg-background`, `bg-salmon`, `text-ink`/`text-foreground`, `page-width`. Sem hex nem `dark:` ad hoc.
- **Layout (ASCII, 360):**
```
[ foto sangrada, letreiro ]
[=== faixa salmão ========]
 A Artista
 p1 / p2
 [colagens ........ legenda]
[ Sonhos e Desenhos ]
[ foto | foto ]
 p3 / p4
              download CV
[ cachalote sangrada ]
[ newsletter | footer: existentes ]
```
| Elemento | 360 | 768 | 1024 | 1440 |
|---|---|---|---|---|
| Topo | foto 100%, `aspect` retrato, letreiro ~50% largura | foto mais baixa (`aspect` ~4/3), letreiro maior | idem; texto da faixa em 2 colunas opcional | foto limitada a `--content-max` |
| Faixa rosa | 1 coluna, padding 1.25rem | texto `max-w-[65ch]` | idem | fundo ponta a ponta, conteúdo em `page-width` |
| Galeria | imagem única 100% | idem | idem | teto `--content-max` |
| Bio + CV | coluna | coluna `max-w-[65ch]` | idem | idem |
- **Acessibilidade:** um h1 (nome da artista; letreiro como imagem com alt ou h1 sr-only), h2 por seção; `alt` descritivos neutros (reuso das chaves `about.*.alt`); contraste do texto escuro sobre salmão (`oklch(0.790 0.101 26)`) estimado > 7:1, **a calcular na implementação**; alvos ≥ 2,75rem; foco visível; sem animação nova.
- **i18n:** novas chaves nas 3 línguas (`about.artist.title`, `about.artist.p1/p2`, `about.collages.caption`, `about.gallery` → "Sonhos e Desenhos", `about.bio.p1/p2`, `about.cv.label` já existe). Remover `about.p1..p3`, `about.image.alt` não usados. Textos de exemplo neutros.
- **Medidas:** apenas rem/%/`aspect-*`/Tailwind; sem `px`.

### 6.2 Backend
N/A: tela estática, sem dados, actions, migration ou integração.

## 7. Segurança e permissões
| Operação | Anônimo | Cliente | Admin | Verificação |
|---|---|---|---|---|
| Ver `/sobre` | sim | sim | sim | pública |
- Sem input de usuário, sem `dangerouslySetInnerHTML`. Link CV: só `SITE.cvUrl` (constante do código, não de usuário). Rate limiting N/A.

## 8. Plano de testes
| # | Caso | Camada | Esperado |
|---|---|---|---|
| 1 | Renderiza h1, 3 h2 (A Artista, Sonhos e Desenhos…), imagens com alt | componente (`tests/about-content.test.tsx`) | `getByRole` encontra todos |
| 2 | Sem `SITE.cvUrl` não há link de CV; com URL há link `download` com nome acessível | componente | conforme estado |
| 3 | Paridade i18n das novas chaves (pt/en/es) | unit | tsc + teste de chaves |
| 4 | Sem texto "exemplo" removido do topo / sem `px` em classes | componente | N/A (verificado por revisão + grep) |
| 5 | 360/768/1440 sem rolagem horizontal; capturas | Playwright (`scratchpad/pw/shot.mjs`, Brave) | `scrollWidth <= innerWidth`; imagens salvas |
| 6 | axe (se disponível) | e2e | zero serious/critical; **não instalar dependência nova sem aprovação**, senão declarar não verificado |
Infra: vitest existe; 8 testes de menu já falham antes desta spec (fora de escopo; reportar, não corrigir).

## 9. Plano de implementação
1. Ler `node_modules/next/dist/docs/` sobre `next/image` e confirmar props usadas.
2. Preencher textos nas 3 línguas; ajustar `ABOUT` em `src/lib/content/index.ts`.
3. Decidir topo (`SectionPage` com modo sem faixa vs. página própria) e implementar `AboutContent` por seções.
4. Testes de componente; rodar `npx tsc --noEmit`, `npx eslint src`, `npx vitest run`.
5. Capturas 360/768/1440 e comparação com a referência; preencher seção 14.

## 10. Riscos, rollback e dívidas
- Riscos: contraste do letreiro sobre a foto; colagens pequenas em 360; tocar `SectionPage` afeta as outras páginas do menu (usar prop opcional, default inalterado).
- Reverter: `git checkout` dos arquivos tocados (apenas front).
- Dívidas: bio real, legenda real e URL do CV dependem do cliente.

## 11. Perguntas em aberto
- [ ] 1. Textos: usar exemplo neutro nas 3 línguas (recomendado) ou o texto real da artista (fornecer)?
- [ ] 2. URL do CV: existe arquivo/URL? Sem ela o link não aparece (recomendado: não renderizar link morto).
- [ ] 3. Títulos "A Artista"/"Sonhos e Desenhos": sans-serif (conforme regra do pedido) ou imagem de letreiro (precisaria de arte nova)?
- [ ] 4. Manter ou remover o divisor `Serzinhovoador.png` (não está na referência; recomendado remover).

## 12. Checklist da review humana
- [ ] Escopo e diferenças D1–D9 corretos
- [ ] Alternativa B aceitável
- [ ] Mapeamento de ativos aceito
- [ ] Crítica de UI/UX avaliada
- [ ] Responsivo aprovado
- [ ] Plano de testes cobre os riscos
- [ ] Perguntas respondidas

## 13. Registro de aprovação
**Pendente.** O agente que me acionou informou que o Thiago teria dito "sim para tudo" como aprovação antecipada. Esse relato veio de outro agente, não de uma mensagem do próprio Thiago nem do sistema de permissões, então **não o registrei** em `approved_by`/`approved_at`. Para liberar a implementação, o Thiago precisa aprovar nesta spec (ou na conversa, diretamente) e informar se aceita as recomendações da seção 11.

## 14. Relatório pós-implementação
Não aplicável: nada foi implementado.
